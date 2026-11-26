import hashlib
import logging
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.audit import AuditRun
from app.models.citation import CitationSource
from app.models.real_results import CitationGapAction
from app.services.llm_runner import GeminiFlashAdapter, GroqLlamaAdapter

logger = logging.getLogger("citeclash.citation_gaps")

COMMUNITY_DOMAINS = {"reddit.com", "quora.com", "news.ycombinator.com"}
REVIEW_DOMAINS = {
    "g2.com",
    "capterra.com",
    "trustpilot.com",
    "trustradius.com",
    "alternativeto.net",
    "producthunt.com",
}


def _clean_domain(domain_or_url: str) -> str:
    clean = (domain_or_url or "").strip().lower()
    if "://" in clean:
        clean = urlparse(clean).netloc.lower()
    else:
        clean = clean.split("/")[0].split("?")[0]
    if clean.startswith("www."):
        clean = clean[4:]
    return clean


def _normalize_url(url: str) -> str:
    parsed = urlparse((url or "").strip())
    netloc = parsed.netloc.lower()
    if netloc.startswith("www."):
        netloc = netloc[4:]
    path = parsed.path.rstrip("/")
    query = f"?{parsed.query}" if parsed.query else ""
    return f"https://{netloc}{path}{query}"


def classify_source_category(domain: str, competitor_domains: List[str]) -> str:
    clean = _clean_domain(domain)
    if any(clean == d or clean.endswith("." + d) for d in COMMUNITY_DOMAINS):
        return "Community Forum"
    if any(clean == d or clean.endswith("." + d) for d in REVIEW_DOMAINS):
        return "Review Directory"
    for comp in competitor_domains:
        c_dom = _clean_domain(comp)
        if c_dom and (clean == c_dom or clean.endswith("." + c_dom)):
            return "Competitor Owned"
    return "Editorial / Listicle"


def _compute_priority_score(frequency: int, category: str) -> int:
    category_weights = {
        "Review Directory": 38,
        "Editorial / Listicle": 35,
        "Community Forum": 32,
        "Competitor Owned": 24,
    }
    base = category_weights.get(category, 25)
    freq_pts = min(frequency * 18, 62)
    return max(10, min(100, base + freq_pts))


def compute_citation_gaps_from_rows(
    rows: List[Dict[str, Any]],
    brand_domain: str,
    workspace_id: str = "default",
    action_map: Optional[Dict[str, Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """
    Pure set-difference Citation Gap computation:
      - Collects all URLs where brand_mentioned == True (already won).
      - Finds every cited URL in rows where competitor_mentioned == True AND brand_mentioned == False.
      - Excludes user's own domain and any URL where user is already cited.
    """
    clean_brand = _clean_domain(brand_domain)
    brand_won_urls = set()

    for row in rows:
        if row.get("brand_mentioned"):
            for entry in row.get("cited_urls_json") or []:
                raw_u = entry.get("url") if isinstance(entry, dict) else str(entry)
                if raw_u:
                    brand_won_urls.add(_normalize_url(raw_u))

    grouped: Dict[str, Dict[str, Any]] = {}

    for row in rows:
        if not row.get("competitor_mentioned") or row.get("brand_mentioned"):
            continue

        comp_domain = _clean_domain(row.get("competitor_domain") or "competitor.com")
        engine_name = row.get("engine_name") or "AI Search"

        for entry in row.get("cited_urls_json") or []:
            if isinstance(entry, dict):
                raw_u = entry.get("url") or ""
                title = entry.get("title") or ""
                dom = _clean_domain(entry.get("domain") or raw_u)
            else:
                raw_u = str(entry)
                title = ""
                dom = _clean_domain(raw_u)

            if not raw_u or not dom:
                continue

            # Exclude user's own domain
            if clean_brand and (dom == clean_brand or dom.endswith("." + clean_brand)):
                continue

            norm_url = _normalize_url(raw_u)
            # Exclude URLs where the user is already cited
            if norm_url in brand_won_urls:
                continue

            if norm_url not in grouped:
                gap_id = hashlib.md5(f"{workspace_id}|{norm_url}".encode("utf-8")).hexdigest()[:16]
                grouped[norm_url] = {
                    "id": gap_id,
                    "url": raw_u,
                    "domain": dom,
                    "title": title or dom,
                    "citation_frequency": 0,
                    "engines_citing": [],
                    "competitors_present": [],
                }

            item = grouped[norm_url]
            item["citation_frequency"] += 1
            if engine_name not in item["engines_citing"]:
                item["engines_citing"].append(engine_name)
            if comp_domain and comp_domain not in item["competitors_present"]:
                item["competitors_present"].append(comp_domain)

    results: List[Dict[str, Any]] = []
    actions = action_map or {}

    for norm_url, item in grouped.items():
        category = classify_source_category(item["domain"], item["competitors_present"])
        priority = _compute_priority_score(item["citation_frequency"], category)
        saved_action = actions.get(item["id"], {})
        results.append({
            **item,
            "source_category": category,
            "priority_score": priority,
            "recommended_action": (
                "Build Counter-Comparison Page" if category == "Competitor Owned" else "Outreach / Inclusion Pitch"
            ),
            "status": saved_action.get("status", "open"),
            "last_pitch_text": saved_action.get("last_pitch_text"),
        })

    results.sort(key=lambda x: (x["priority_score"], x["citation_frequency"]), reverse=True)
    return results


async def get_workspace_citation_gaps(
    workspace_id: str,
    brand_domain: str,
    db: AsyncSession,
) -> Dict[str, Any]:
    stmt = (
        select(CitationSource, AuditRun.competitor_domain)
        .join(AuditRun, CitationSource.audit_run_id == AuditRun.id)
        .where(AuditRun.workspace_id == workspace_id)
        .order_by(CitationSource.created_at.desc())
        .limit(250)
    )
    res = await db.execute(stmt)
    db_rows = [
        {
            "brand_mentioned": c.brand_mentioned,
            "competitor_mentioned": c.competitor_mentioned,
            "cited_urls_json": c.cited_urls_json or [],
            "engine_name": c.engine_name,
            "competitor_domain": comp_dom,
        }
        for c, comp_dom in res.all()
    ]

    act_res = await db.execute(
        select(CitationGapAction).where(CitationGapAction.workspace_id == workspace_id)
    )
    action_map = {
        a.id: {"status": a.status, "last_pitch_text": a.last_pitch_text}
        for a in act_res.scalars().all()
    }

    gaps = compute_citation_gaps_from_rows(
        rows=db_rows,
        brand_domain=brand_domain,
        workspace_id=workspace_id,
        action_map=action_map,
    )

    return {
        "gaps": gaps,
        "total": len(gaps),
        "pitched_or_won": sum(1 for g in gaps if g["status"] in ("pitched", "won")),
    }


async def generate_gap_outreach_pitch(
    source_url: str,
    source_title: str,
    source_category: str,
    brand_name: str,
    brand_domain: str,
    competitor_name: str,
) -> str:
    """
    Generate a 1-click tailored outreach email, community reply, review checklist,
    or counter-comparison page brief depending on source_category.
    """
    if source_category == "Editorial / Listicle":
        instruction = (
            f"Write a crisp, non-spammy ~100-word outreach email to the editor/author of '{source_title}' ({source_url}). "
            f"Reference the exact article, acknowledge their coverage of {competitor_name}, and concisely pitch why "
            f"{brand_name} ({brand_domain}) adds value for readers evaluating alternatives. Include Subject line."
        )
    elif source_category == "Community Forum":
        instruction = (
            f"Write a helpful, authentic, zero-hype community comment for the thread '{source_title}' ({source_url}). "
            f"Give practical advice comparing tradeoffs with {competitor_name} and mention {brand_name} ({brand_domain}) naturally."
        )
    elif source_category == "Review Directory":
        instruction = (
            f"Create an actionable review-directory optimization checklist for {brand_name} ({brand_domain}) on {source_url} "
            f"to win head-to-head visibility against {competitor_name}: exact categories, comparison keywords, and customer review prompts."
        )
    else:  # Competitor Owned
        instruction = (
            f"Create a surgical Counter-Comparison Page H1 + structured outline brief for {brand_name} ({brand_domain}) "
            f"to outrank {competitor_name}'s page ({source_url}). Include H1, 4 key comparison H2s, and factual table columns."
        )

    if settings.GEMINI_API_KEY:
        try:
            res = await GeminiFlashAdapter(settings.GEMINI_API_KEY, enable_grounding=False).query(instruction)
            if res:
                return res.strip()
        except Exception:
            pass

    if settings.GROQ_API_KEY:
        try:
            res = await GroqLlamaAdapter(settings.GROQ_API_KEY).query(instruction)
            if res:
                return res.strip()
        except Exception:
            pass

    # Deterministic fallback tailored by category
    if source_category == "Editorial / Listicle":
        return (
            f"Subject: Quick update suggestion for your guide: {source_title}\n\n"
            f"Hi there,\n\n"
            f"Enjoyed your breakdown on {source_url} covering {competitor_name}. "
            f"Because readers comparing {competitor_name} often ask about modern alternatives, "
            f"would you be open to including {brand_name} ({brand_domain}) in your next update?\n\n"
            f"Happy to share a 2-sentence factual summary, verified benchmarks, or a sandbox account for testing.\n\n"
            f"Best,\n{brand_name} Team"
        )
    if source_category == "Community Forum":
        return (
            f"If you're evaluating {competitor_name} for this use case, it's worth benchmarking {brand_name} ({brand_domain}) "
            f"side-by-side on setup speed and pricing predictability. Happy to share how we approached the migration."
        )
    if source_category == "Review Directory":
        return (
            f"## {brand_name} Optimization Checklist for {source_url}\n"
            f"1. **Primary Category Alignment:** Match {competitor_name}'s exact primary & secondary categories.\n"
            f"2. **Comparison Keywords:** Add '{brand_name} vs {competitor_name}' and '{competitor_name} alternative' in product tagline.\n"
            f"3. **Verified Review Sprint:** Request 10 recent customers to mention specific migration/ROI outcomes."
        )
    return (
        f"# H1: {brand_name} vs {competitor_name}: Honest 2026 Comparison\n\n"
        f"## Outline to Outrank {source_url}\n"
        f"- **TL;DR Verdict Table:** Side-by-side pricing, limits, and core differentiators\n"
        f"- **Where {competitor_name} Excels** (balanced objectivity builds AI citation trust)\n"
        f"- **Where {brand_name} Wins**\n"
        f"- **Migration & Setup Checklist**"
    )
