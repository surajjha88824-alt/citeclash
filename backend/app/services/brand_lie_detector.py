import json
import logging
import re
from typing import Any, Dict, List, Literal, Optional
from urllib.parse import urlparse

from bs4 import BeautifulSoup
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.citation import CitationSource
from app.models.closed_loop import BrandGroundTruth, BrandLieAlert
from app.services.llm_runner import run_structured_json_completion
from app.services.safe_fetcher import safe_fetch_url

logger = logging.getLogger("citeclash.brand_lie_detector")


class ExtractedFactItem(BaseModel):
    category: Literal["pricing", "features", "integrations", "target_audience", "positioning"]
    fact_statement: str


class ExtractedFactsBatch(BaseModel):
    facts: List[ExtractedFactItem]


class DetectedLieItem(BaseModel):
    citation_index: int
    ground_truth_index: int
    ai_false_claim: str
    severity: Literal["critical", "moderate"]


class DetectedLiesBatch(BaseModel):
    lies: List[DetectedLieItem]


class CorrectiveKitOutput(BaseModel):
    corrective_faq_json_ld: str
    website_clarity_snippet: str
    third_party_update_email: str


async def auto_extract_ground_truths_from_website(
    domain_url: str,
    brand_name: str,
) -> List[Dict[str, str]]:
    """
    Crawls the workspace domain via safe_fetch_url and proposes up to 6 factual
    Ground Truth statements for user approval.
    """
    target = domain_url.strip()
    if not target.startswith(("http://", "https://")):
        target = f"https://{target}"

    fetch_res = await safe_fetch_url(target)
    if not fetch_res.get("ok") or not fetch_res.get("html"):
        return [
            {
                "category": "positioning",
                "fact_statement": f"{brand_name} is available at {domain_url}.",
            }
        ]

    soup = BeautifulSoup(fetch_res["html"], "lxml")
    title = soup.find("title").get_text(" ", strip=True) if soup.find("title") else brand_name
    h1 = soup.find("h1").get_text(" ", strip=True) if soup.find("h1") else ""
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()
    clean_text = re.sub(r"\s+", " ", soup.get_text(" ", strip=True))[:4000]

    prompt = (
        f"Extract up to 6 concise, verifiable Ground Truth factual statements about '{brand_name}' ({target}) "
        f"strictly from the website text below. Do NOT invent any price or feature not stated in the text.\n"
        f"Categories allowed: pricing, features, integrations, target_audience, positioning.\n\n"
        f"Title: {title}\nH1: {h1}\nBody: {clean_text}\n\n"
        f"Return strict JSON: {{\"facts\": [{{\"category\": \"...\", \"fact_statement\": \"...\"}}]}}"
    )
    llm_res = await run_structured_json_completion(prompt=prompt, response_schema=ExtractedFactsBatch)
    if llm_res and isinstance(llm_res.get("facts"), list) and llm_res["facts"]:
        return [
            {
                "category": str(f.get("category", "features")),
                "fact_statement": str(f.get("fact_statement", "")).strip(),
            }
            for f in llm_res["facts"][:6]
            if f.get("fact_statement")
        ]

    # Deterministic fallback extraction
    proposed: List[Dict[str, str]] = []
    if h1:
        proposed.append({"category": "positioning", "fact_statement": f"{brand_name}: {h1}"})
    price_matches = re.findall(r"\$\s?\d+(?:\.\d{1,2})?(?:\s*/\s*(?:mo|month|year|user|seat))?", clean_text, re.I)
    if price_matches:
        proposed.append({
            "category": "pricing",
            "fact_statement": f"{brand_name} lists pricing starting at {price_matches[0]} on {domain_url}.",
        })
    if len(proposed) < 2:
        proposed.append({
            "category": "features",
            "fact_statement": f"{brand_name} ({domain_url}) — {title[:140]}",
        })
    return proposed[:6]


def _deterministic_pricing_contradiction_check(
    raw_response: str,
    truths: List[BrandGroundTruth],
) -> List[Dict[str, Any]]:
    """
    Deterministic guard for explicit pricing contradictions (e.g., Ground Truth says '$49/month, not $99'
    or '$49/month' while AI says '$99/month').
    """
    hits: List[Dict[str, Any]] = []
    resp_lower = (raw_response or "").lower()
    resp_prices = re.findall(r"\$\s?(\d+(?:\.\d{1,2})?)\s*(?:/\s*(?:mo|month|yr|year)|per\s+month)?", resp_lower)
    if not resp_prices:
        return hits

    for gt in truths:
        if gt.category != "pricing":
            continue
        gt_text = gt.fact_statement.lower()
        # Check explicit "not $X" negation in ground truth
        negated = re.findall(r"not\s+\$\s?(\d+(?:\.\d{1,2})?)", gt_text)
        for bad_price in negated:
            if bad_price in resp_prices:
                hits.append({
                    "ground_truth": gt,
                    "ai_false_claim": f"AI response states price as ${bad_price}/month.",
                    "severity": "critical",
                })
                break
        if hits:
            continue

        # Check if ground truth specifies a single clear price $A and AI states a different price $B
        gt_clean = re.sub(r"not\s+\$\s?\d+(?:\.\d{1,2})?", "", gt_text)
        gt_prices = re.findall(r"\$\s?(\d+(?:\.\d{1,2})?)", gt_clean)
        if gt_prices and not any(p in resp_prices for p in gt_prices):
            hits.append({
                "ground_truth": gt,
                "ai_false_claim": f"AI response cites pricing as ${resp_prices[0]} instead of ${gt_prices[0]}.",
                "severity": "critical",
            })

    return hits


async def scan_audit_for_brand_lies(
    workspace_id: str,
    audit_run_id: str,
    citations: List[CitationSource],
    db: AsyncSession,
) -> List[BrandLieAlert]:
    """
    Post-audit automated lie scanner:
    Batch-compares brand-mentioned citations against active brand_ground_truths
    in ONE lightweight structured-JSON LLM call (plus deterministic pricing check).
    """
    truths = list(
        (
            await db.execute(
                select(BrandGroundTruth).where(
                    BrandGroundTruth.workspace_id == workspace_id,
                    BrandGroundTruth.is_active == True,
                )
            )
        )
        .scalars()
        .all()
    )
    mentioned_citations = [c for c in citations if c.brand_mentioned and c.raw_response]
    if not truths or not mentioned_citations:
        return []

    created_alerts: List[BrandLieAlert] = []
    seen_pairs = set()

    # 1. Try one lightweight batched LLM call
    gt_lines = "\n".join(f"[{idx}] ({gt.category}) {gt.fact_statement}" for idx, gt in enumerate(truths))
    cit_lines = "\n".join(
        f"[{idx}] Engine: {c.engine_name} | Prompt: {c.prompt_text}\nResponse Excerpt: {(c.raw_response or '')[:900]}"
        for idx, c in enumerate(mentioned_citations[:8])
    )
    prompt = (
        "You are a strict Fact Verification Auditor. Compare the AI search responses below against the brand's Ground Truth facts.\n"
        "STRICT RULE: Flag a lie ONLY when the AI response EXPLICITLY contradicts a Ground Truth fact "
        "(e.g., wrong price, falsely claiming a supported feature is missing, wrong target market). "
        "NEVER flag vague omissions or stylistic differences as lies.\n\n"
        f"GROUND TRUTH FACTS:\n{gt_lines}\n\n"
        f"AI RESPONSES:\n{cit_lines}\n\n"
        "Return strict JSON: {\"lies\": [{\"citation_index\": int, \"ground_truth_index\": int, "
        "\"ai_false_claim\": str, \"severity\": \"critical\"|\"moderate\"}]}"
    )

    llm_res = await run_structured_json_completion(prompt=prompt, response_schema=DetectedLiesBatch)
    if llm_res and isinstance(llm_res.get("lies"), list):
        for item in llm_res["lies"]:
            try:
                c_idx = int(item["citation_index"])
                g_idx = int(item["ground_truth_index"])
                cit = mentioned_citations[c_idx]
                gt = truths[g_idx]
            except (KeyError, ValueError, IndexError, TypeError):
                continue

            pair_key = (cit.id, gt.id)
            if pair_key in seen_pairs:
                continue
            seen_pairs.add(pair_key)

            first_url = None
            if cit.cited_urls_json:
                first_entry = cit.cited_urls_json[0]
                first_url = first_entry.get("url") if isinstance(first_entry, dict) else str(first_entry)

            severity = item.get("severity")
            if severity not in ("critical", "moderate"):
                severity = "critical" if gt.category in ("pricing", "integrations") else "moderate"

            alert = BrandLieAlert(
                workspace_id=workspace_id,
                audit_run_id=audit_run_id,
                citation_source_id=cit.id,
                engine_name=cit.engine_name,
                prompt_text=cit.prompt_text,
                ground_truth_id=gt.id,
                ai_false_claim=str(item.get("ai_false_claim", "")).strip(),
                actual_truth=gt.fact_statement,
                severity=severity,
                suspected_source_url=first_url,
                status="open",
            )
            db.add(alert)
            created_alerts.append(alert)

    # 2. Deterministic pricing contradiction pass (catches explicit price lies even without LLM key)
    if not created_alerts:
        for cit in mentioned_citations:
            det_hits = _deterministic_pricing_contradiction_check(cit.raw_response or "", truths)
            for hit in det_hits:
                gt = hit["ground_truth"]
                pair_key = (cit.id, gt.id)
                if pair_key in seen_pairs:
                    continue
                seen_pairs.add(pair_key)

                first_url = None
                if cit.cited_urls_json:
                    first_entry = cit.cited_urls_json[0]
                    first_url = first_entry.get("url") if isinstance(first_entry, dict) else str(first_entry)

                alert = BrandLieAlert(
                    workspace_id=workspace_id,
                    audit_run_id=audit_run_id,
                    citation_source_id=cit.id,
                    engine_name=cit.engine_name,
                    prompt_text=cit.prompt_text,
                    ground_truth_id=gt.id,
                    ai_false_claim=hit["ai_false_claim"],
                    actual_truth=gt.fact_statement,
                    severity=hit["severity"],
                    suspected_source_url=first_url,
                    status="open",
                )
                db.add(alert)
                created_alerts.append(alert)

    if created_alerts:
        await db.commit()
        for a in created_alerts:
            await db.refresh(a)

    return created_alerts


async def generate_corrective_kit_for_alert(
    alert: BrandLieAlert,
    brand_name: str,
    brand_domain: str,
) -> Dict[str, str]:
    """
    Generate 1-click Corrective Kit:
      - corrective_faq_json_ld
      - website_clarity_snippet
      - third_party_update_email
    """
    prompt = (
        f"Generate a 3-part Corrective Fact Kit for {brand_name} ({brand_domain}) to fix this AI hallucination:\n"
        f"False AI Claim: {alert.ai_false_claim}\n"
        f"Actual Ground Truth: {alert.actual_truth}\n"
        f"Suspected Source URL: {alert.suspected_source_url or 'N/A'}\n\n"
        "Return strict JSON with keys:\n"
        "- corrective_faq_json_ld: valid JSON-LD FAQPage string directly stating the accurate truth\n"
        "- website_clarity_snippet: clean 2-sentence factual block for Pricing/Docs page\n"
        "- third_party_update_email: short polite update email to the third-party publisher"
    )
    llm_res = await run_structured_json_completion(prompt=prompt, response_schema=CorrectiveKitOutput)
    if llm_res and llm_res.get("corrective_faq_json_ld"):
        return {
            "corrective_faq_json_ld": str(llm_res["corrective_faq_json_ld"]),
            "website_clarity_snippet": str(llm_res.get("website_clarity_snippet", "")),
            "third_party_update_email": str(llm_res.get("third_party_update_email", "")),
        }

    faq_json = json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": f"What is accurate about {brand_name} regarding: {alert.prompt_text[:80]}?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": alert.actual_truth,
                    },
                }
            ],
        },
        indent=2,
    )
    snippet = (
        f"{brand_name} ({brand_domain}) official specification: {alert.actual_truth}. "
        f"For the latest verified details, always refer to https://{brand_domain}."
    )
    email = (
        f"Subject: Quick factual update for your {brand_name} reference\n\n"
        f"Hi there,\n\n"
        f"Thanks for covering {brand_name} on {alert.suspected_source_url or 'your site'}. "
        f"We noticed an outdated detail ({alert.ai_false_claim}). "
        f"For accuracy, here is the verified information: {alert.actual_truth}.\n\n"
        f"Could you please update that line when you have a moment?\n\nBest,\n{brand_name} Team"
    )
    return {
        "corrective_faq_json_ld": faq_json,
        "website_clarity_snippet": snippet,
        "third_party_update_email": email,
    }
