import asyncio
import json
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from bs4 import BeautifulSoup
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.audit import AuditRun
from app.models.closed_loop import AppliedFix, BrandLieAlert
from app.models.prompt import TrackedPrompt
from app.models.workspace import Workspace
from app.services.citation_gap_service import get_workspace_citation_gaps
from app.services.crawl_auditor import parse_robots_txt_for_ai_bots
from app.services.hijacker_service import _search_duckduckgo, _search_serper
from app.services.llm_runner import execute_prompt_on_engine
from app.services.safe_fetcher import safe_fetch_url
from app.services.scorer import score_audit_citation_async

logger = logging.getLogger("citeclash.fix_loop")


def evaluate_instant_verification(
    fix_type: str,
    target_url: str,
    fetch_res: Dict[str, Any],
    brand_name: str = "",
) -> Dict[str, Any]:
    """
    Deterministic live verification of an applied fix against fetched HTTP response.
    Returns: { "passed": bool, "status": "verified_live"|"verify_failed", "message": str, ... }
    """
    status_code = fetch_res.get("status_code")
    body = fetch_res.get("html") or ""
    content_type = (fetch_res.get("content_type") or "").lower()

    if fix_type == "reddit_reply":
        if fetch_res.get("blocked_by_waf") or status_code == 403:
            return {
                "passed": True,
                "status": "verified_live",
                "manual_confirm_needed": True,
                "message": "Thread URL reachable (Reddit returned 403 to automated bot; marked live with manual confirm).",
            }
        if not fetch_res.get("ok"):
            return {
                "passed": False,
                "status": "verify_failed",
                "message": f"Thread URL returned HTTP {status_code or 'error'}: {fetch_res.get('error')}",
            }
        lower_body = body.lower()
        if "[removed]" in lower_body or "[deleted]" in lower_body:
            return {
                "passed": False,
                "status": "verify_failed",
                "message": "Thread or comment appears [removed] or [deleted] on Reddit.",
            }
        return {
            "passed": True,
            "status": "verified_live",
            "message": "Reddit/Quora thread is active and live.",
        }

    if not fetch_res.get("ok"):
        return {
            "passed": False,
            "status": "verify_failed",
            "message": f"Target URL failed live check ({fetch_res.get('error') or f'HTTP {status_code}'}).",
        }

    if fix_type == "llms_txt":
        stripped = body.strip()
        is_html = stripped.lower().startswith(("<!doctype html", "<html")) or "text/html" in content_type
        if is_html:
            return {
                "passed": False,
                "status": "verify_failed",
                "message": "llms.txt returned HTML (soft-404 redirect) instead of plain text/markdown.",
            }
        if len(stripped) <= 100:
            return {
                "passed": False,
                "status": "verify_failed",
                "message": f"llms.txt is too short ({len(stripped)} chars; must be > 100 chars).",
            }
        return {
            "passed": True,
            "status": "verified_live",
            "message": f"Valid /llms.txt verified live ({len(stripped)} chars).",
        }

    if fix_type == "faq_schema":
        soup = BeautifulSoup(body, "lxml")
        scripts = soup.find_all("script", attrs={"type": re.compile(r"application/ld\+json", re.I)})
        if not scripts:
            return {
                "passed": False,
                "status": "verify_failed",
                "message": "No <script type='application/ld+json'> tag found on target page.",
            }
        found_valid_faq = False
        parse_errors: List[str] = []
        for s in scripts:
            raw_json = (s.string or s.get_text() or "").strip()
            if not raw_json:
                continue
            try:
                parsed = json.loads(raw_json)
            except json.JSONDecodeError as exc:
                parse_errors.append(f"Invalid JSON syntax in FAQPage schema at line {exc.lineno}: {exc.msg}")
                continue
            nodes = parsed if isinstance(parsed, list) else (parsed.get("@graph", [parsed]) if isinstance(parsed, dict) else [])
            for node in nodes:
                if not isinstance(node, dict):
                    continue
                node_type = node.get("@type")
                types_list = node_type if isinstance(node_type, list) else [node_type]
                if "FAQPage" in types_list:
                    main_entity = node.get("mainEntity")
                    if isinstance(main_entity, list) and len(main_entity) > 0:
                        found_valid_faq = True
                        break
                    else:
                        parse_errors.append("FAQPage schema found but 'mainEntity' array is empty or missing.")
        if found_valid_faq:
            return {
                "passed": True,
                "status": "verified_live",
                "message": "Valid FAQPage JSON-LD schema with mainEntity questions verified live.",
            }
        return {
            "passed": False,
            "status": "verify_failed",
            "message": parse_errors[0] if parse_errors else "No valid FAQPage JSON-LD schema found on target page.",
        }

    if fix_type == "robots_txt":
        parsed_robots = parse_robots_txt_for_ai_bots(body)
        required_bots = ("OAI-SearchBot", "GPTBot", "PerplexityBot")
        blocked = [b for b in required_bots if parsed_robots["bots"].get(b) == "blocked"]
        if blocked:
            return {
                "passed": False,
                "status": "verify_failed",
                "message": f"robots.txt still blocks required AI crawler(s): {', '.join(blocked)}.",
            }
        return {
            "passed": True,
            "status": "verified_live",
            "message": "OAI-SearchBot, GPTBot, and PerplexityBot are allowed in robots.txt.",
        }

    # page_diff / outreach_pitch
    if brand_name and brand_name.lower() not in body.lower():
        return {
            "passed": False,
            "status": "verify_failed",
            "message": f"Target URL returned HTTP 200 but '{brand_name}' was not found in the page HTML.",
        }
    return {
        "passed": True,
        "status": "verified_live",
        "message": "Target page verified live (HTTP 200 with expected brand/content).",
    }


async def verify_fix_live(
    fix: AppliedFix,
    brand_name: str,
    db: AsyncSession,
) -> AppliedFix:
    fetch_res = await safe_fetch_url(fix.target_url)
    check = evaluate_instant_verification(
        fix_type=fix.fix_type,
        target_url=fix.target_url,
        fetch_res=fetch_res,
        brand_name=brand_name,
    )
    fix.instant_check_result_json = check
    fix.status = check["status"]
    await db.commit()
    await db.refresh(fix)
    return fix


async def check_url_google_indexed(target_url: str) -> bool:
    """Stage 2: Check Google indexing via Serper.dev (fallback DuckDuckGo)."""
    clean = re.sub(r"^https?://", "", target_url.strip()).rstrip("/")
    query = f"site:{clean}"
    try:
        if settings.SERPER_API_KEY:
            res = await _search_serper(query, settings.SERPER_API_KEY)
            return len(res) > 0
        res = await _search_duckduckgo(query)
        return len(res) > 0
    except Exception:
        return False


def build_root_cause_plan_b(
    fix_type: str,
    is_indexed: bool,
    has_open_lie_alert: bool,
    citation_gaps_count: int,
) -> Dict[str, Any]:
    """
    Deterministic Root-Cause Diagnosis & Plan-B Pivot generator when score_delta <= 0.
    """
    on_page_types = {"llms_txt", "faq_schema", "robots_txt", "page_diff"}

    if fix_type in on_page_types and not is_indexed:
        return {
            "diagnosis_code": "not_indexed",
            "root_cause_summary": "Your fix is live on your site, but Google/AI search indexes have not crawled the updated URL yet.",
            "pivot_action_title": "Force Indexing & Add Homepage Internal Link",
            "pivot_steps": [
                "Open Google Search Console and click 'Request Indexing' for the updated URL.",
                "Add a direct internal link from your homepage footer or navigation to this page.",
                "Resubmit your XML sitemap so PerplexityBot & OAI-SearchBot discover the update.",
            ],
            "target_route": "crawl-audit",
        }

    if has_open_lie_alert:
        return {
            "diagnosis_code": "hallucination_conflict",
            "root_cause_summary": "An open Brand Lie Alert is contradicting your product facts on these prompts, suppressing AI recommendations.",
            "pivot_action_title": "Deploy Corrective Fact Kit from Brand Lie Guard",
            "pivot_steps": [
                "Open Brand Lie Guard and generate the Corrective FAQ JSON-LD kit for the open alert.",
                "Publish the 2-sentence Ground Truth block on your pricing or documentation page.",
                "Send the short correction email to any third-party source repeating the outdated claim.",
            ],
            "target_route": "brand-guard",
        }

    if fix_type in {"llms_txt", "faq_schema", "page_diff"} and citation_gaps_count >= 3:
        return {
            "diagnosis_code": "weak_offpage_authority",
            "root_cause_summary": f"On-page signals are solid, but competitors are cited on {citation_gaps_count} third-party sources where your brand is absent.",
            "pivot_action_title": "Pitch Top 3 Third-Party Citation Gap Listicles",
            "pivot_steps": [
                "Open Citation Gaps and filter by 'Editorial / Listicle' and 'Review Directory'.",
                "Generate and send tailored 1-click inclusion pitches for the top 3 highest-frequency URLs.",
                "Mark each outreach as Pitched to track inclusion.",
            ],
            "target_route": "citation-gaps",
        }

    if fix_type == "reddit_reply":
        return {
            "diagnosis_code": "buried_community_thread",
            "root_cause_summary": "The original community thread may be too old or saturated to shift AI consensus alone.",
            "pivot_action_title": "Engage 2 Fresher High-Velocity Reddit/Quora Threads",
            "pivot_steps": [
                "Open Reddit Hijacker and click Refresh to fetch threads from the past 12 months.",
                "Draft a value-first technical comparison reply on 2 fresh threads with zero promotional hype.",
            ],
            "target_route": "reddit",
        }

    return {
        "diagnosis_code": "weak_fact_density",
        "root_cause_summary": "AI engines still lack structured comparison tables and quantifiable proof points on your target page.",
        "pivot_action_title": "Run Competitor Page Diff & Add Comparison Table",
        "pivot_steps": [
            "Open Page Diff and compare your target URL against the #1 cited competitor page.",
            "Paste the generated HTML <table> and missing H2 sections onto your page.",
        ],
        "target_route": "page-diff",
    }


def evaluate_recheck_outcome(
    fix: AppliedFix,
    current_visibility_score: float,
    is_indexed: bool,
    has_open_lie_alert: bool,
    citation_gaps_count: int,
) -> AppliedFix:
    """
    Pure outcome evaluator for Day-7/14 rechecks.
    Sets status='won' if score_delta >= 5.0, or triggers Root-Cause Plan-B if score_delta <= 0.
    """
    now = datetime.now(timezone.utc)
    delta = round(current_visibility_score - (fix.baseline_visibility_score or 0.0), 1)
    fix.current_visibility_score = round(current_visibility_score, 1)
    fix.score_delta = delta
    fix.last_rechecked_at = now
    fix.is_indexed = is_indexed

    if delta >= 5.0:
        fix.status = "won"
        fix.diagnosis_code = None
        fix.plan_b_json = None
    elif delta <= 0.0:
        plan_b = build_root_cause_plan_b(
            fix_type=fix.fix_type,
            is_indexed=is_indexed,
            has_open_lie_alert=has_open_lie_alert,
            citation_gaps_count=citation_gaps_count,
        )
        fix.status = "stalled_pivoted"
        fix.diagnosis_code = plan_b["diagnosis_code"]
        fix.plan_b_json = plan_b
    else:
        # Slight positive progress (0 < delta < 5): schedule another recheck in 7 days
        fix.status = "indexed" if is_indexed else "verified_live"
        fix.recheck_due_at = now + timedelta(days=7)

    return fix


async def recheck_applied_fix(
    fix: AppliedFix,
    workspace: Workspace,
    db: AsyncSession,
) -> AppliedFix:
    """
    Stage 2 + 3: Check indexing, re-run affected prompts (with 3x micro-variation quorum for paid tiers),
    and evaluate Win vs Root-Cause Plan-B Pivot.
    """
    is_indexed = await check_url_google_indexed(fix.target_url)
    fix.index_checked_at = datetime.now(timezone.utc)

    # Determine competitor & prompts
    last_audit = (
        await db.execute(
            select(AuditRun)
            .where(AuditRun.workspace_id == workspace.id)
            .order_by(AuditRun.created_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    comp_domain = last_audit.competitor_domain if last_audit else "competitor.com"

    prompts_q = await db.execute(
        select(TrackedPrompt)
        .where(TrackedPrompt.workspace_id == workspace.id, TrackedPrompt.is_active == True)
        .limit(3)
    )
    prompts = [p.prompt_text for p in prompts_q.scalars().all()]
    if not prompts:
        prompts = [f"Best {workspace.industry or 'SaaS'} alternatives to {comp_domain.split('.')[0]}"]

    # Paid plans run 3x micro-variation quorum on top priority prompt
    is_paid = (workspace.plan_tier or "free").lower() in ("starter", "growth", "agency")
    run_prompts = [prompts[0], f"{prompts[0]} (2026 comparison)", f"Top recommended {workspace.industry or 'SaaS'} tools: {prompts[0]}"] if is_paid else prompts[:2]

    scores: List[float] = []
    for p_text in run_prompts:
        engine_res = await execute_prompt_on_engine(
            prompt=p_text,
            brand_domain=workspace.domain_url,
            competitor_domain=comp_domain,
            preferred_engine="Google AI Overview (Gemini)",
        )
        scored = await score_audit_citation_async(
            raw_response=engine_res["response_text"],
            brand_domain=workspace.domain_url,
            competitor_domain=comp_domain,
            industry=workspace.industry or "SaaS",
            cited_urls=engine_res.get("cited_urls"),
        )
        scores.append(scored.brand_score)

    current_score = round(sum(scores) / max(len(scores), 1), 1)

    open_lies = (
        await db.execute(
            select(BrandLieAlert.id)
            .where(BrandLieAlert.workspace_id == workspace.id, BrandLieAlert.status == "open")
            .limit(1)
        )
    ).scalar_one_or_none()

    gaps_res = await get_workspace_citation_gaps(workspace.id, workspace.domain_url, db)
    gaps_count = gaps_res.get("total", 0)

    evaluate_recheck_outcome(
        fix=fix,
        current_visibility_score=current_score,
        is_indexed=is_indexed,
        has_open_lie_alert=bool(open_lies),
        citation_gaps_count=gaps_count,
    )
    await db.commit()
    await db.refresh(fix)
    return fix
