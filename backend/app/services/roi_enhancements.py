import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from bs4 import BeautifulSoup
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit import AuditRun
from app.models.closed_loop import AiReferralVisit, AppliedFix, BrandLieAlert
from app.models.workspace import Workspace
from app.services.llm_runner import run_structured_json_completion
from app.services.safe_fetcher import safe_fetch_url

logger = logging.getLogger("citeclash.roi_enhancements")


class PromptSuggestionGroup(BaseModel):
    intent_group: str
    prompts: List[str]


class PromptSuggestionsPayload(BaseModel):
    groups: List[PromptSuggestionGroup]


async def generate_buyer_intent_prompt_suggestions(
    brand_name: str,
    domain_url: str,
    industry: Optional[str],
    competitors: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Inspect workspace domain (via safe_fetch_url) + Gemini/Groq structured JSON
    to generate 8-10 high-intent buyer prompts grouped by intent.
    """
    target = domain_url.strip()
    if not target.startswith(("http://", "https://")):
        target = f"https://{target}"

    page_context = ""
    fetch_res = await safe_fetch_url(target, timeout=5.0)
    if fetch_res.get("ok") and fetch_res.get("html"):
        soup = BeautifulSoup(fetch_res["html"], "lxml")
        title = soup.find("title").get_text(" ", strip=True) if soup.find("title") else ""
        h1 = soup.find("h1").get_text(" ", strip=True) if soup.find("h1") else ""
        page_context = f"Title: {title} | H1: {h1}"

    ind = (industry or "B2B SaaS").strip()
    comp_list = [c.strip() for c in (competitors or []) if c.strip()]
    primary_comp = comp_list[0].split(".")[0].capitalize() if comp_list else "Competitor"

    prompt = (
        f"Generate 8 to 10 high-intent buyer search prompts for '{brand_name}' ({domain_url}, industry: {ind}, "
        f"competitor: {primary_comp}). Context: {page_context}\n"
        f"Group them strictly into these 4 intent categories:\n"
        f"1. Best-of / Category\n2. vs Competitor\n3. Pricing & Alternatives\n4. Use-Case Specific\n"
        f"Return strict JSON: {{\"groups\": [{{\"intent_group\": str, \"prompts\": [str]}}]}}"
    )

    llm_res = await run_structured_json_completion(prompt=prompt, response_schema=PromptSuggestionsPayload)
    if llm_res and isinstance(llm_res.get("groups"), list) and llm_res["groups"]:
        return {"groups": llm_res["groups"][:4], "source": "ai"}

    # Deterministic high-intent fallback (8-10 prompts across 4 groups)
    clean_brand = brand_name.strip() or domain_url.split(".")[0].capitalize()
    return {
        "groups": [
            {
                "intent_group": "Best-of / Category",
                "prompts": [
                    f"Best {ind} platforms for growing B2B teams in 2026",
                    f"Top-rated {ind} software recommended by engineers on Reddit",
                    f"Most reliable {ind} tools with fast API setup",
                ],
            },
            {
                "intent_group": "vs Competitor",
                "prompts": [
                    f"{clean_brand} vs {primary_comp}: which is better for scaling teams?",
                    f"Feature comparison between {clean_brand} and {primary_comp}",
                ],
            },
            {
                "intent_group": "Pricing & Alternatives",
                "prompts": [
                    f"Best {primary_comp} alternatives with transparent pricing",
                    f"How much does {clean_brand} cost compared to {primary_comp}?",
                ],
            },
            {
                "intent_group": "Use-Case Specific",
                "prompts": [
                    f"How to migrate from {primary_comp} to {clean_brand} without downtime",
                    f"Best {ind} platform for enterprise security and compliance",
                ],
            },
        ],
        "source": "deterministic",
    }


async def compute_competitor_movements(
    workspace_id: str,
    db: AsyncSession,
) -> List[Dict[str, Any]]:
    """
    Compare latest completed AuditRun against previous completed AuditRun
    to surface concrete competitor movements (>= +5% jump, new top citation domain, or overtake).
    """
    res = await db.execute(
        select(AuditRun)
        .options(selectinload(AuditRun.citations))
        .where(AuditRun.workspace_id == workspace_id, AuditRun.status == "completed")
        .order_by(AuditRun.created_at.desc())
        .limit(2)
    )
    audits = list(res.scalars().all())
    if len(audits) < 2:
        return []

    latest, prev = audits[0], audits[1]
    movements: List[Dict[str, Any]] = []

    latest_comp = float(latest.competitor_score or 0.0)
    prev_comp = float(prev.competitor_score or 0.0)
    comp_delta = round(latest_comp - prev_comp, 1)

    if comp_delta >= 5.0:
        movements.append({
            "type": "visibility_jump",
            "severity": "high",
            "title": f"{latest.competitor_domain} visibility jumped +{comp_delta}% since previous audit",
            "detail": f"Competitor score rose from {prev_comp}% to {latest_comp}%.",
            "action_label": "Counter This Move →",
            "target_tab": "page-diff",
        })

    latest_brand = float(latest.overall_visibility_score or 0.0)
    prev_brand = float(prev.overall_visibility_score or 0.0)
    if prev_brand >= prev_comp and latest_comp > latest_brand:
        movements.append({
            "type": "rank_overtake",
            "severity": "critical",
            "title": f"{latest.competitor_domain} overtook your brand ({latest_comp}% vs {latest_brand}%)",
            "detail": "Inspect citation gaps and deploy a counter-comparison page.",
            "action_label": "Counter This Move →",
            "target_tab": "citation-gaps",
        })

    # Check new top citation domain appearing for competitor
    def _extract_domains(audit: AuditRun) -> set[str]:
        doms = set()
        for c in audit.citations or []:
            if c.competitor_mentioned and c.cited_urls_json:
                for entry in c.cited_urls_json:
                    dom = entry.get("domain") if isinstance(entry, dict) else str(entry)
                    if dom:
                        doms.add(dom.lower().lstrip("www."))
        return doms

    new_domains = list(_extract_domains(latest) - _extract_domains(prev))
    if new_domains:
        movements.append({
            "type": "new_citation_source",
            "severity": "medium",
            "title": f"New citation source for {latest.competitor_domain}: {new_domains[0]}",
            "detail": "Competitor gained a new third-party citation not seen in the prior snapshot.",
            "action_label": "Counter This Move →",
            "target_tab": "citation-gaps",
        })

    return movements[:4]


async def build_executive_roi_summary(
    workspace: Workspace,
    days: int,
    db: AsyncSession,
) -> Dict[str, Any]:
    since = datetime.now(timezone.utc) - timedelta(days=days)

    audits = (
        await db.execute(
            select(AuditRun)
            .where(AuditRun.workspace_id == workspace.id, AuditRun.status == "completed")
            .order_by(AuditRun.created_at.desc())
            .limit(2)
        )
    ).scalars().all()
    current_vis = float(audits[0].overall_visibility_score or 0.0) if audits else 0.0
    prev_vis = float(audits[1].overall_visibility_score or current_vis) if len(audits) > 1 else current_vis
    vis_delta = round(current_vis - prev_vis, 1)

    fixes = (
        await db.execute(
            select(AppliedFix).where(AppliedFix.workspace_id == workspace.id)
        )
    ).scalars().all()
    verified_wins_count = sum(1 for f in fixes if f.status == "won")
    top_plan_b_actions = [
        {
            "fix_id": f.id,
            "title": (f.plan_b_json or {}).get("pivot_action_title") or f.title,
            "diagnosis_code": f.diagnosis_code,
            "target_route": (f.plan_b_json or {}).get("target_route") or "fix-tracker",
        }
        for f in fixes
        if f.status == "stalled_pivoted"
    ][:3]

    lies = (
        await db.execute(
            select(BrandLieAlert).where(BrandLieAlert.workspace_id == workspace.id)
        )
    ).scalars().all()
    open_lies = sum(1 for l in lies if l.status == "open")

    visits = (
        await db.execute(
            select(AiReferralVisit).where(
                AiReferralVisit.workspace_id == workspace.id,
                AiReferralVisit.created_at >= since,
            )
        )
    ).scalars().all()
    ai_visitors = sum(1 for v in visits if v.event_type == "pageview")
    ai_conversions = sum(1 for v in visits if v.event_type == "conversion")

    movements = await compute_competitor_movements(workspace.id, db)

    summary_text = (
        f"{workspace.brand_name} — {days}-Day AI Search ROI Summary\n"
        f"• AI Visibility: {current_vis}% ({'+' if vis_delta >= 0 else ''}{vis_delta}% delta)\n"
        f"• Verified Wins: {verified_wins_count} | Open Brand Lies: {open_lies} (Total Caught: {len(lies)})\n"
        f"• Real AI Referral Traffic: {ai_visitors} visitors, {ai_conversions} conversions\n"
        f"• Competitor Movements Detected: {len(movements)}"
    )

    return {
        "workspace_id": workspace.id,
        "brand_name": workspace.brand_name,
        "days": days,
        "current_visibility_score": current_vis,
        "visibility_delta": vis_delta,
        "verified_wins_count": verified_wins_count,
        "open_brand_lies_count": open_lies,
        "total_lies_caught": len(lies),
        "ai_visitors": ai_visitors,
        "ai_conversions": ai_conversions,
        "top_plan_b_actions": top_plan_b_actions,
        "competitor_movements": movements,
        "executive_summary_text": summary_text,
    }
