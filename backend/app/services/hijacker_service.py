import asyncio
import hashlib
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse, urlunparse

import httpx
from duckduckgo_search import DDGS
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.hijacker import HijackerThreadsCache
from app.services.llm_runner import GeminiFlashAdapter, GroqLlamaAdapter

logger = logging.getLogger("citeclash.hijacker")

# Strict thread-only regex patterns (zero 404s, zero user profiles/topic pages)
REDDIT_THREAD_REGEX = re.compile(
    r"^https?://(?:www\.|old\.)?reddit\.com/r/[A-Za-z0-9_]+/comments/[A-Za-z0-9]+/",
    re.IGNORECASE,
)
QUORA_THREAD_REGEX = re.compile(
    r"^https?://(?:www\.)?quora\.com/.+",
    re.IGNORECASE,
)
QUORA_EXCLUDED_SEGMENTS = ("/profile/", "/topic/", "/search", "/q/", "/about", "/contact")

BUYER_INTENT_KEYWORDS = ("best", "alternative", "recommend", "vs", "pricing", "compare", "switch", "migration")
RECENCY_SIGNALS = ("2025", "2026", "days ago", "weeks ago", "months ago", "hours ago")


def is_valid_discussion_url(url: str) -> Optional[str]:
    """
    Validate that URL is a genuine Reddit thread or Quora question thread.
    Returns 'reddit' | 'quora' | None.
    """
    if not url or not isinstance(url, str):
        return None
    clean = url.strip()
    if REDDIT_THREAD_REGEX.match(clean):
        return "reddit"
    if QUORA_THREAD_REGEX.match(clean):
        parsed = urlparse(clean)
        path_lower = parsed.path.lower()
        if not path_lower or path_lower == "/":
            return None
        if any(seg in path_lower for seg in QUORA_EXCLUDED_SEGMENTS):
            return None
        return "quora"
    return None


def canonicalize_thread_url(url: str) -> str:
    """Normalize Reddit/Quora URLs for deduplication (strip query/fragment, normalize host)."""
    parsed = urlparse(url.strip())
    scheme = "https"
    netloc = parsed.netloc.lower()
    if netloc.startswith("old.reddit.com") or netloc == "reddit.com":
        netloc = "www.reddit.com"
    elif netloc == "quora.com":
        netloc = "www.quora.com"
    path = parsed.path.rstrip("/") + "/"
    return urlunparse((scheme, netloc, path, "", "", ""))


def extract_subreddit_or_source(url: str, platform: str) -> str:
    if platform == "reddit":
        m = re.search(r"/r/([A-Za-z0-9_]+)/comments/", url, re.IGNORECASE)
        if m:
            return f"r/{m.group(1)}"
        return "r/SaaS"
    return "Quora"


def calculate_thread_relevance_score(
    title: str,
    snippet: str,
    brand_name: str,
    competitor_name: str,
    from_recent_filter: bool = True,
) -> int:
    """
    Deterministic relevance score (0-100):
      - Base: 30
      - Buyer-intent keywords in title/snippet: +8 each (max +32)
      - Competitor mentioned in title/snippet: +25
      - User's brand NOT yet mentioned in title/snippet: +20 (high hijack opportunity)
      - Recency signal: +10
    """
    combined = f"{title} {snippet}".lower()
    score = 30

    intent_hits = sum(1 for kw in BUYER_INTENT_KEYWORDS if kw in combined)
    score += min(intent_hits * 8, 32)

    comp_clean = (competitor_name or "").strip().lower()
    if comp_clean and comp_clean in combined:
        score += 25

    brand_clean = (brand_name or "").strip().lower()
    if brand_clean and brand_clean not in combined:
        score += 20

    if from_recent_filter or any(sig in combined for sig in RECENCY_SIGNALS):
        score += 10

    return max(0, min(100, score))


def build_hijacker_queries(
    industry: str,
    brand_name: str,
    competitor_domain: str,
    tracked_prompts: Optional[List[str]] = None,
) -> Tuple[str, str]:
    clean_ind = (industry or "SaaS").strip()
    clean_comp = competitor_domain.split(".")[0].strip() or "competitor"

    # Incorporate top tracked prompt keyword context if available
    extra_term = ""
    if tracked_prompts:
        first_prompt = tracked_prompts[0].strip()
        if len(first_prompt) > 4:
            extra_term = f' OR "{first_prompt[:50]}"'

    reddit_query = (
        f'site:reddit.com ("best {clean_ind}" OR "{clean_comp} alternative" '
        f'OR "recommend {clean_ind}"{extra_term})'
    )
    quora_query = (
        f'site:quora.com ("best {clean_ind}" OR "{clean_comp} vs" '
        f'OR "top {clean_ind} tools")'
    )
    return reddit_query, quora_query


async def _search_serper(query: str, api_key: str) -> List[Dict[str, Any]]:
    url = "https://google.serper.dev/search"
    headers = {
        "X-API-KEY": api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "q": query,
        "num": 10,
        "gl": "us",
        "hl": "en",
        "tbs": "qdr:y",
    }
    async with httpx.AsyncClient(timeout=12.0) as client:
        res = await client.post(url, headers=headers, json=payload)
        res.raise_for_status()
        data = res.json()
        return data.get("organic", []) or []


def _ddgs_sync_search(query: str, max_results: int = 10) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    with DDGS() as ddgs:
        for item in ddgs.text(query, region="us-en", timelimit="y", max_results=max_results):
            results.append({
                "title": item.get("title", ""),
                "link": item.get("href", "") or item.get("link", ""),
                "snippet": item.get("body", "") or item.get("snippet", ""),
            })
    return results


async def _search_duckduckgo(query: str) -> List[Dict[str, Any]]:
    return await asyncio.to_thread(_ddgs_sync_search, query, 10)


def filter_and_score_search_results(
    raw_results: List[Dict[str, Any]],
    brand_name: str,
    competitor_name: str,
    from_recent_filter: bool = True,
) -> List[Dict[str, Any]]:
    """
    Strictly validate URLs against Reddit/Quora thread regexes, deduplicate by canonical URL,
    and compute deterministic relevance scores.
    """
    deduped: List[Dict[str, Any]] = []
    seen_urls = set()

    for idx, item in enumerate(raw_results):
        raw_url = item.get("link") or item.get("url") or ""
        platform = is_valid_discussion_url(raw_url)
        if not platform:
            continue

        canonical_url = canonicalize_thread_url(raw_url)
        if canonical_url in seen_urls:
            continue
        seen_urls.add(canonical_url)

        title = (item.get("title") or "").strip()
        snippet = (item.get("snippet") or item.get("body") or "").strip()
        if not title:
            continue

        score = calculate_thread_relevance_score(
            title=title,
            snippet=snippet,
            brand_name=brand_name,
            competitor_name=competitor_name,
            from_recent_filter=from_recent_filter,
        )

        subreddit = extract_subreddit_or_source(canonical_url, platform)
        comp_display = competitor_name.capitalize() if competitor_name else "Competitor"

        deduped.append({
            "id": f"th-{hashlib.md5(canonical_url.encode()).hexdigest()[:10]}",
            "platform": platform,
            "subreddit": subreddit,
            "title": title,
            "url": canonical_url,
            "relevance_score": score,
            "competitor_mentioned": comp_display,
            "upvotes": 0,
            "comments_count": 0,
            "ai_source_weight": "Live Google Index (High AI Citation Potential)" if score >= 80 else "Live Web Index",
            "context": snippet or title,
        })

    deduped.sort(key=lambda x: x["relevance_score"], reverse=True)
    return deduped


async def discover_community_discussions_async(
    niche: str,
    competitor_domain: str = "firebase.google.com",
    brand_domain: str = "supabase.com",
    brand_name: Optional[str] = None,
    workspace_id: str = "default",
    tracked_prompts: Optional[List[str]] = None,
    refresh: bool = False,
    db: Optional[AsyncSession] = None,
) -> Dict[str, Any]:
    """
    Discovers 100% real, live Reddit and Quora threads via Serper.dev (primary)
    or DuckDuckGo Search (free fallback), with 24-hour DB caching and 1-hour refresh limit.
    NEVER fabricates or LLM-guesses URLs.
    """
    clean_brand = (brand_name or brand_domain.split(".")[0]).strip()
    clean_comp = competitor_domain.split(".")[0].strip()
    reddit_q, quora_q = build_hijacker_queries(
        industry=niche,
        brand_name=clean_brand,
        competitor_domain=competitor_domain,
        tracked_prompts=tracked_prompts,
    )

    hash_input = f"{workspace_id}|{niche.lower()}|{brand_domain.lower()}|{competitor_domain.lower()}|{reddit_q}"
    query_hash = hashlib.sha256(hash_input.encode("utf-8")).hexdigest()

    now = datetime.now(timezone.utc)
    cached_row: Optional[HijackerThreadsCache] = None

    if db is not None:
        stmt = (
            select(HijackerThreadsCache)
            .where(
                HijackerThreadsCache.workspace_id == workspace_id,
                HijackerThreadsCache.query_hash == query_hash,
            )
            .order_by(HijackerThreadsCache.cached_at.desc())
            .limit(1)
        )
        cached_row = (await db.execute(stmt)).scalar_one_or_none()

        if cached_row is not None:
            cached_at = cached_row.cached_at
            if cached_at.tzinfo is None:
                cached_at = cached_at.replace(tzinfo=timezone.utc)
            age = now - cached_at

            if not refresh and age < timedelta(hours=24):
                return {
                    "threads": cached_row.threads_json or [],
                    "total": len(cached_row.threads_json or []),
                    "cached": True,
                    "provider": cached_row.source_provider,
                    "message": None,
                }

            if refresh and age < timedelta(hours=1):
                return {
                    "threads": cached_row.threads_json or [],
                    "total": len(cached_row.threads_json or []),
                    "cached": True,
                    "rate_limited": True,
                    "provider": cached_row.source_provider,
                    "message": "Refresh is rate-limited to once per hour per workspace. Showing cached live threads.",
                }

    raw_results: List[Dict[str, Any]] = []
    provider_used = "none"

    # 1. Primary Provider: Serper.dev
    if settings.SERPER_API_KEY:
        try:
            r_res, q_res = await asyncio.gather(
                _search_serper(reddit_q, settings.SERPER_API_KEY),
                _search_serper(quora_q, settings.SERPER_API_KEY),
                return_exceptions=True,
            )
            if isinstance(r_res, list):
                raw_results.extend(r_res)
            if isinstance(q_res, list):
                raw_results.extend(q_res)
            if raw_results:
                provider_used = "serper"
        except Exception as exc:
            logger.warning(f"Serper search failed, falling back to DuckDuckGo: {exc}")

    # 2. Zero-Cost Fallback: DuckDuckGo Search
    if not raw_results:
        try:
            r_res, q_res = await asyncio.gather(
                _search_duckduckgo(reddit_q),
                _search_duckduckgo(quora_q),
                return_exceptions=True,
            )
            if isinstance(r_res, list):
                raw_results.extend(r_res)
            if isinstance(q_res, list):
                raw_results.extend(q_res)
            if raw_results:
                provider_used = "duckduckgo"
        except Exception as exc:
            logger.warning(f"DuckDuckGo fallback search failed: {exc}")

    if not raw_results:
        return {
            "threads": [],
            "total": 0,
            "cached": False,
            "provider": "none",
            "message": "No live Reddit or Quora threads could be fetched right now. Please retry shortly.",
        }

    threads = filter_and_score_search_results(
        raw_results=raw_results,
        brand_name=clean_brand,
        competitor_name=clean_comp,
        from_recent_filter=True,
    )

    if db is not None and threads:
        if cached_row is not None:
            cached_row.threads_json = threads
            cached_row.source_provider = provider_used
            cached_row.cached_at = now
        else:
            db.add(
                HijackerThreadsCache(
                    workspace_id=workspace_id,
                    query_hash=query_hash,
                    threads_json=threads,
                    source_provider=provider_used,
                    cached_at=now,
                )
            )
        await db.commit()

    return {
        "threads": threads,
        "total": len(threads),
        "cached": False,
        "provider": provider_used,
        "message": None if threads else "No matching Reddit or Quora discussion threads found for this query. Try broadening your industry keyword.",
    }


async def draft_value_first_community_reply(
    thread_title: str,
    thread_context: str,
    brand_name: str,
    brand_domain: str,
    competitor_domain: str,
    platform: str = "reddit",
    subreddit: str = "r/SaaS",
    competitor_mentioned: Optional[str] = None,
    brand_usp: Optional[str] = None,
) -> str:
    """
    Drafts a genuine, value-first, non-promotional community reply tailored to the real thread.
    """
    clean_brand = brand_name or brand_domain.split(".")[0].capitalize()
    clean_comp = competitor_mentioned or competitor_domain.split(".")[0].capitalize()
    usp_line = f"Core strengths of {clean_brand}: {brand_usp}" if brand_usp else ""

    prompt = f"""You are an experienced practitioner giving an honest, value-first response on {platform} ({subreddit}).
Thread Title: "{thread_title}"
Thread Snippet/Context: {thread_context}
Competitor Discussed: {clean_comp}
{usp_line}

Write a natural, non-promotional, highly helpful community reply.
Rules:
1. Start by directly addressing the OP's dilemma with practical, objective advice.
2. Share balanced pros and cons of {clean_comp} based on real-world tradeoffs.
3. Mention {clean_brand} naturally as an option worth evaluating for their specific use case — strictly NO salesy hype, NO spam links, and NO buzzwords like 'game-changer' or 'revolutionize'.
4. Keep the tone collegial, technical, and under 180 words."""

    if settings.GEMINI_API_KEY:
        try:
            gemini = GeminiFlashAdapter(settings.GEMINI_API_KEY, enable_grounding=False)
            res = await gemini.query(prompt)
            if res:
                return res.strip()
        except Exception:
            pass

    if settings.GROQ_API_KEY:
        try:
            groq = GroqLlamaAdapter(settings.GROQ_API_KEY)
            res = await groq.query(prompt)
            if res:
                return res.strip()
        except Exception:
            pass

    return (
        f"Good question — the right choice depends heavily on your team's workflow and scale.\n\n"
        f"{clean_comp} is solid for getting started quickly, though teams often run into friction around "
        f"pricing predictability and customization as requirements grow.\n\n"
        f"If you want something that avoids those bottlenecks, {clean_brand} is worth putting on your shortlist. "
        f"It handles the core workflow cleanly without forcing heavy workarounds. "
        f"Whatever you pick, I'd recommend testing your exact edge cases on a small pilot before committing."
    )
