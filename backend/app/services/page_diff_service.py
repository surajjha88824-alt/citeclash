import asyncio
import json
import re
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from bs4 import BeautifulSoup
from pydantic import BaseModel

from app.services.llm_runner import run_structured_json_completion
from app.services.safe_fetcher import safe_fetch_url


class SurgicalFixes(BaseModel):
    ready_faq_json_ld: str
    ready_comparison_table_html: str
    recommended_h2_sections: List[str]


class PageDiffLLMOutput(BaseModel):
    why_ai_cites_competitor: List[str]
    exact_gaps_on_your_page: List[str]
    surgical_fixes: SurgicalFixes


def extract_page_structural_features(content: str, is_raw_text: bool = False) -> Dict[str, Any]:
    """
    Deterministic BeautifulSoup structural feature extractor for live HTML or pasted text.
    """
    if is_raw_text:
        clean_text = re.sub(r"\s+", " ", (content or "").strip())
        words = re.findall(r"\b\w+\b", clean_text)
        stats_matches = re.findall(
            r"(?:\$\s?\d[\d,\.]*|\b\d+(?:\.\d+)?%|\b\d+(?:\.\d+)?x\b|\b\d+(?:\.\d+)?\s?(?:ms|sec|seconds|mins|minutes|hours|days|users|teams|k|m|gb|tb)\b)",
            clean_text,
            re.IGNORECASE,
        )
        return {
            "word_count": len(words),
            "h1": clean_text.splitlines()[0][:120] if clean_text else "",
            "h2_list": [],
            "table_count": 0,
            "list_item_count": 0,
            "schema_types": [],
            "has_faq_section": bool(re.search(r"\b(faq|frequently asked questions)\b", clean_text, re.I)),
            "has_explicit_pricing": bool(re.search(r"(\$\s?\d+|/mo\b|/month|free tier|per seat)", clean_text, re.I)),
            "concrete_stats_count": len(stats_matches),
            "clean_body_excerpt": clean_text[:4500],
        }

    soup = BeautifulSoup(content or "", "lxml")

    schema_types: List[str] = []
    for script in soup.find_all("script", attrs={"type": re.compile(r"application/ld\+json", re.I)}):
        raw_json = (script.string or script.get_text() or "").strip()
        if not raw_json:
            continue
        try:
            parsed = json.loads(raw_json)
            items = parsed if isinstance(parsed, list) else [parsed]
            for obj in items:
                if isinstance(obj, dict):
                    if "@graph" in obj and isinstance(obj["@graph"], list):
                        for node in obj["@graph"]:
                            if isinstance(node, dict) and node.get("@type"):
                                t = node["@type"]
                                schema_types.extend(t if isinstance(t, list) else [str(t)])
                    elif obj.get("@type"):
                        t = obj["@type"]
                        schema_types.extend(t if isinstance(t, list) else [str(t)])
        except Exception:
            continue
    schema_types = list(dict.fromkeys(schema_types))

    h1_tag = soup.find("h1")
    h1_text = h1_tag.get_text(" ", strip=True) if h1_tag else ""
    h2_list = [
        h.get_text(" ", strip=True)
        for h in soup.find_all("h2")
        if h.get_text(strip=True)
    ][:12]
    table_count = len(soup.find_all("table"))
    list_item_count = len(soup.find_all("li"))

    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()

    clean_text = re.sub(r"\s+", " ", soup.get_text(" ", strip=True))
    words = re.findall(r"\b\w+\b", clean_text)

    has_faq = ("FAQPage" in schema_types) or any(
        "faq" in h.lower() or "frequently asked" in h.lower() for h in h2_list
    ) or bool(re.search(r"\bfrequently asked questions\b", clean_text, re.I))

    has_pricing = bool(re.search(r"(\$\s?\d+|/mo\b|/month|free tier|per user|per seat)", clean_text, re.I))
    stats_matches = re.findall(
        r"(?:\$\s?\d[\d,\.]*|\b\d+(?:\.\d+)?%|\b\d+(?:\.\d+)?x\b|\b\d+(?:\.\d+)?\s?(?:ms|sec|seconds|mins|minutes|hours|days|users|teams|k|m|gb|tb)\b)",
        clean_text,
        re.IGNORECASE,
    )

    return {
        "word_count": len(words),
        "h1": h1_text,
        "h2_list": h2_list,
        "table_count": table_count,
        "list_item_count": list_item_count,
        "schema_types": schema_types,
        "has_faq_section": has_faq,
        "has_explicit_pricing": has_pricing,
        "concrete_stats_count": len(stats_matches),
        "clean_body_excerpt": clean_text[:4500],
    }


def build_side_by_side_metrics(user_feat: Dict[str, Any], comp_feat: Dict[str, Any]) -> List[Dict[str, Any]]:
    return [
        {
            "metric": "Word Count",
            "user_value": user_feat["word_count"],
            "competitor_value": comp_feat["word_count"],
            "winner": "user" if user_feat["word_count"] >= comp_feat["word_count"] else "competitor",
        },
        {
            "metric": "HTML Comparison Tables",
            "user_value": user_feat["table_count"],
            "competitor_value": comp_feat["table_count"],
            "winner": "user" if user_feat["table_count"] >= comp_feat["table_count"] else "competitor",
        },
        {
            "metric": "FAQ Schema / Section",
            "user_value": "Yes" if user_feat["has_faq_section"] else "No",
            "competitor_value": "Yes" if comp_feat["has_faq_section"] else "No",
            "winner": "user" if (user_feat["has_faq_section"] and not comp_feat["has_faq_section"]) else (
                "tie" if user_feat["has_faq_section"] == comp_feat["has_faq_section"] else "competitor"
            ),
        },
        {
            "metric": "Transparent Pricing",
            "user_value": "Yes" if user_feat["has_explicit_pricing"] else "No",
            "competitor_value": "Yes" if comp_feat["has_explicit_pricing"] else "No",
            "winner": "user" if (user_feat["has_explicit_pricing"] and not comp_feat["has_explicit_pricing"]) else (
                "tie" if user_feat["has_explicit_pricing"] == comp_feat["has_explicit_pricing"] else "competitor"
            ),
        },
        {
            "metric": "Quantifiable Proof Points",
            "user_value": user_feat["concrete_stats_count"],
            "competitor_value": comp_feat["concrete_stats_count"],
            "winner": "user" if user_feat["concrete_stats_count"] >= comp_feat["concrete_stats_count"] else "competitor",
        },
        {
            "metric": "Heading Depth (H2s)",
            "user_value": len(user_feat["h2_list"]),
            "competitor_value": len(comp_feat["h2_list"]),
            "winner": "user" if len(user_feat["h2_list"]) >= len(comp_feat["h2_list"]) else "competitor",
        },
    ]


def _deterministic_page_diff_fallback(
    user_url: str,
    competitor_url: str,
    user_feat: Dict[str, Any],
    comp_feat: Dict[str, Any],
) -> Dict[str, Any]:
    user_host = urlparse(user_url).netloc or user_url
    comp_host = urlparse(competitor_url).netloc or competitor_url

    why_comp = []
    if comp_feat["word_count"] > user_feat["word_count"]:
        why_comp.append(
            f"Competitor page has {comp_feat['word_count']} words vs {user_feat['word_count']} on your page, giving AI retrievers deeper context."
        )
    if comp_feat["table_count"] > user_feat["table_count"]:
        why_comp.append(
            f"Competitor uses {comp_feat['table_count']} structured HTML <table> element(s) that LLMs parse cleanly for comparisons."
        )
    if comp_feat["has_faq_section"]:
        why_comp.append("Competitor includes an explicit FAQ section/schema matching buyer question prompts.")
    if comp_feat["concrete_stats_count"] > user_feat["concrete_stats_count"]:
        why_comp.append(
            f"Competitor presents {comp_feat['concrete_stats_count']} concrete numeric/metric proof points vs {user_feat['concrete_stats_count']} on your page."
        )
    if not why_comp:
        why_comp.append(f"Competitor page ({comp_host}) organizes core product capabilities under clear H2 headings ({len(comp_feat['h2_list'])} detected).")

    gaps = []
    if not user_feat["has_faq_section"]:
        gaps.append("Missing FAQPage JSON-LD schema and Q&A headings grounded in your product docs.")
    if user_feat["table_count"] == 0:
        gaps.append("Zero HTML <table> comparison blocks found on your page.")
    if not user_feat["has_explicit_pricing"]:
        gaps.append("No explicit pricing/tier markers detected in server-rendered HTML.")
    if len(user_feat["h2_list"]) < 4:
        gaps.append(f"Shallow heading structure ({len(user_feat['h2_list'])} H2 tags) limits section-level passage retrieval.")
    if not gaps:
        gaps.append("Add more explicit side-by-side comparison criteria and verifiable benchmark metrics.")

    faq_json_ld = json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": f"What does {user_host} do?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": user_feat["h1"] or f"{user_host} provides software solutions detailed on {user_url}.",
                    },
                },
                {
                    "@type": "Question",
                    "name": f"How does {user_host} compare to {comp_host}?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": f"Evaluate {user_host} and {comp_host} side by side based on your team's workflow, deployment needs, and documented capabilities.",
                    },
                },
            ],
        },
        indent=2,
    )

    comp_table_html = (
        "<table>\n"
        "  <thead>\n"
        f"    <tr><th>Criteria</th><th>{user_host}</th><th>{comp_host}</th></tr>\n"
        "  </thead>\n"
        "  <tbody>\n"
        f"    <tr><td>Primary Focus</td><td>{user_feat['h1'] or user_host}</td><td>{comp_feat['h1'] or comp_host}</td></tr>\n"
        "    <tr><td>Structured FAQ</td><td>Yes</td><td>Verify</td></tr>\n"
        "    <tr><td>Setup &amp; Docs</td><td>Self-serve</td><td>Verify</td></tr>\n"
        "  </tbody>\n"
        "</table>"
    )

    h2_sections = [
        f"## How {user_host} Solves Core Workflow Bottlenecks\nSummarize your exact architecture and primary use case in 2-3 factual sentences.",
        f"## {user_host} vs {comp_host}: Key Differences\nProvide an objective comparison of strengths, tradeoffs, and ideal team size.",
        "## Frequently Asked Questions\nAdd 3-5 concise Q&A pairs matching real buyer prompts.",
    ]

    return {
        "why_ai_cites_competitor": why_comp,
        "exact_gaps_on_your_page": gaps,
        "surgical_fixes": {
            "ready_faq_json_ld": faq_json_ld,
            "ready_comparison_table_html": comp_table_html,
            "recommended_h2_sections": h2_sections,
        },
    }


async def run_live_page_diff(
    user_url: str,
    competitor_url: str,
    manual_competitor_text: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Fetch user_url and competitor_url concurrently via safe_fetch_url,
    extract deterministic structural features, and generate surgical page fixes.
    """
    clean_user_url = user_url.strip()
    if not clean_user_url.startswith(("http://", "https://")):
        clean_user_url = f"https://{clean_user_url}"

    clean_comp_url = competitor_url.strip()
    if not clean_comp_url.startswith(("http://", "https://")):
        clean_comp_url = f"https://{clean_comp_url}"

    if manual_competitor_text and manual_competitor_text.strip():
        user_fetch = await safe_fetch_url(clean_user_url)
        comp_fetch = None
        comp_feat = extract_page_structural_features(manual_competitor_text, is_raw_text=True)
    else:
        user_fetch, comp_fetch = await asyncio.gather(
            safe_fetch_url(clean_user_url),
            safe_fetch_url(clean_comp_url),
        )
        if comp_fetch.get("blocked_by_waf"):
            return {
                "needs_manual_paste": True,
                "blocked_url": clean_comp_url,
                "message": (
                    "Competitor site blocks automated crawlers (Cloudflare/WAF). "
                    "Paste the visible text from their page below to run the exact diff."
                ),
            }
        comp_feat = extract_page_structural_features(comp_fetch.get("html") or "", is_raw_text=False)

    user_feat = extract_page_structural_features(user_fetch.get("html") or "", is_raw_text=False)
    side_by_side = build_side_by_side_metrics(user_feat, comp_feat)

    # Try LLM surgical synthesis grounded strictly in real extracted excerpts
    prompt = (
        f"You are an AI Search / GEO analyst comparing two real web pages.\n"
        f"STRICT RULE: NEVER invent fake prices, integrations, or customer counts. "
        f"Ground every claim and JSON-LD answer strictly in the provided text.\n\n"
        f"USER PAGE ({clean_user_url}):\n"
        f"Stats: words={user_feat['word_count']}, tables={user_feat['table_count']}, "
        f"h1='{user_feat['h1']}', h2s={user_feat['h2_list']}, schemas={user_feat['schema_types']}\n"
        f"Excerpt: {user_feat['clean_body_excerpt'][:2500]}\n\n"
        f"COMPETITOR PAGE ({clean_comp_url}):\n"
        f"Stats: words={comp_feat['word_count']}, tables={comp_feat['table_count']}, "
        f"h1='{comp_feat['h1']}', h2s={comp_feat['h2_list']}, schemas={comp_feat['schema_types']}\n"
        f"Excerpt: {comp_feat['clean_body_excerpt'][:2500]}\n\n"
        f"Return strict JSON matching:\n"
        f"{{\n"
        f'  "why_ai_cites_competitor": ["3-5 concrete factual reasons grounded in competitor excerpt"],\n'
        f'  "exact_gaps_on_your_page": ["3-5 specific missing facts/structures on user page"],\n'
        f'  "surgical_fixes": {{\n'
        f'    "ready_faq_json_ld": "<valid JSON-LD FAQPage string grounded in user page>",\n'
        f'    "ready_comparison_table_html": "<clean semantic HTML <table> snippet>",\n'
        f'    "recommended_h2_sections": ["markdown section 1", "markdown section 2", "markdown section 3"]\n'
        f"  }}\n"
        f"}}"
    )

    llm_raw = await run_structured_json_completion(prompt=prompt, response_schema=PageDiffLLMOutput)
    if llm_raw:
        try:
            validated = PageDiffLLMOutput.model_validate(llm_raw)
            analysis = validated.model_dump()
        except Exception:
            analysis = _deterministic_page_diff_fallback(clean_user_url, clean_comp_url, user_feat, comp_feat)
    else:
        analysis = _deterministic_page_diff_fallback(clean_user_url, clean_comp_url, user_feat, comp_feat)

    return {
        "needs_manual_paste": False,
        "user_url": clean_user_url,
        "competitor_url": clean_comp_url,
        "user_fetch_ok": bool(user_fetch.get("ok")),
        "user_fetch_error": user_fetch.get("error"),
        "side_by_side_metrics": side_by_side,
        "why_ai_cites_competitor": analysis["why_ai_cites_competitor"],
        "exact_gaps_on_your_page": analysis["exact_gaps_on_your_page"],
        "surgical_fixes": analysis["surgical_fixes"],
    }
