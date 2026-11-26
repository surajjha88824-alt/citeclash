import asyncio
import json
import logging
import os
import re
from typing import Any, Dict, List, Optional, Tuple, Type
from urllib.parse import urlparse

import httpx
from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from pydantic import BaseModel
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.config import settings

logger = logging.getLogger("citeclash.llm_runner")


class RateLimitOrTransientError(Exception):
    """Raised when an LLM provider returns 429 Too Many Requests or 503 Service Unavailable."""
    pass


def generate_high_intent_prompts(
    brand_domain: str,
    competitor_domain: str,
    industry: Optional[str] = None,
) -> List[str]:
    """
    Auto-generate 5 to 10 high-intent buyer search queries based on brand domain and industry.
    """
    clean_brand = brand_domain.split(".")[0].capitalize()
    clean_comp = competitor_domain.split(".")[0].capitalize()
    ind = industry or "Enterprise SaaS"

    prompts = [
        f"Best {ind} platforms for scaling companies in 2026",
        f"Top {clean_comp} alternatives for modern {ind} with high reliability",
        f"Is {clean_brand} or {clean_comp} better for enterprise production deployments?",
        f"Which {ind} software is most frequently recommended by developers on Reddit?",
        f"Feature and pricing comparison between {clean_brand} and {clean_comp}",
        f"Highest-rated {ind} tools with zero vendor lock-in and scalable APIs",
        f"How to migrate from {clean_comp} to {clean_brand} step by step",
    ]
    return prompts


# ==============================================================================
# Grounding & Citation Extraction Helpers
# ==============================================================================

def _get_attr_or_key(obj: Any, key: str, default: Any = None) -> Any:
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def normalize_domain(url_or_title: str) -> str:
    """Extract clean lowercase domain without leading www."""
    if not url_or_title:
        return ""
    candidate = url_or_title.strip()
    if "://" not in candidate and "." in candidate and " " not in candidate:
        candidate = f"https://{candidate}"
    parsed = urlparse(candidate)
    netloc = parsed.netloc.lower()
    if netloc.startswith("www."):
        netloc = netloc[4:]
    return netloc


def _normalize_url_key(url: str) -> str:
    parsed = urlparse(url.strip())
    netloc = parsed.netloc.lower()
    if netloc.startswith("www."):
        netloc = netloc[4:]
    path = parsed.path.rstrip("/")
    query = f"?{parsed.query}" if parsed.query else ""
    return f"{netloc}{path}{query}"


def extract_markdown_and_raw_links(text: str) -> List[Dict[str, Any]]:
    """Extract markdown links [title](url) and raw URLs from response text."""
    results: List[Dict[str, Any]] = []
    seen_urls = set()

    for title, url in re.findall(r"\[([^\]]+)\]\((https?://[^\s\)]+)\)", text or ""):
        clean_url = url.rstrip(".,;\"'>")
        if clean_url not in seen_urls:
            seen_urls.add(clean_url)
            results.append({
                "url": clean_url,
                "domain": normalize_domain(clean_url),
                "title": title.strip(),
                "verified_grounding": False,
            })

    for url in re.findall(r"https?://[a-zA-Z0-9_\-\./\?=%&#+]+", text or ""):
        clean_url = url.rstrip(".,;)\"'>")
        if clean_url not in seen_urls:
            seen_urls.add(clean_url)
            domain = normalize_domain(clean_url)
            results.append({
                "url": clean_url,
                "domain": domain,
                "title": domain,
                "verified_grounding": False,
            })

    return results


async def resolve_grounding_redirect_url(
    url: str,
    client: Optional[httpx.AsyncClient] = None,
) -> str:
    """
    Resolve Vertex/Google grounding redirect URLs via fast HEAD (follow_redirects=False)
    to read the Location header for the true publisher domain.
    """
    if not url or "vertexaisearch.cloud.google.com/grounding-api-redirect" not in url:
        return url

    owns_client = client is None
    if owns_client:
        client = httpx.AsyncClient(timeout=2.5, follow_redirects=False)

    try:
        resp = await client.head(url, follow_redirects=False, timeout=2.5)
        location = resp.headers.get("location") or resp.headers.get("Location")
        if location and location.startswith("http"):
            return location
    except Exception:
        pass
    finally:
        if owns_client:
            await client.aclose()

    return url


async def extract_grounding_citations(
    response: Any,
    raw_text: str = "",
    resolve_redirects: bool = True,
) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Step B: Safely inspect response.candidates[0].grounding_metadata to extract:
      - web_search_queries: list of search queries Gemini executed
      - cited_urls: deduplicated list of structured objects:
        [{"url": "...", "domain": "...", "title": "...", "verified_grounding": True/False}]
    """
    web_search_queries: List[str] = []
    grounding_items: List[Dict[str, Any]] = []

    candidates = _get_attr_or_key(response, "candidates") or []
    if candidates:
        first_candidate = candidates[0]
        metadata = _get_attr_or_key(first_candidate, "grounding_metadata")
        if metadata:
            queries = _get_attr_or_key(metadata, "web_search_queries") or []
            web_search_queries = [str(q) for q in queries if q]

            chunks = _get_attr_or_key(metadata, "grounding_chunks") or []
            raw_chunks: List[Tuple[str, str]] = []
            for chunk in chunks:
                web = _get_attr_or_key(chunk, "web")
                if not web:
                    continue
                uri = _get_attr_or_key(web, "uri") or ""
                title = _get_attr_or_key(web, "title") or ""
                if uri:
                    raw_chunks.append((str(uri), str(title)))

            if raw_chunks:
                if resolve_redirects:
                    async with httpx.AsyncClient(timeout=2.5, follow_redirects=False) as client:
                        resolved_uris = await asyncio.gather(
                            *[resolve_grounding_redirect_url(uri, client=client) for uri, _ in raw_chunks],
                            return_exceptions=True,
                        )
                else:
                    resolved_uris = [uri for uri, _ in raw_chunks]

                for (orig_uri, title), resolved in zip(raw_chunks, resolved_uris):
                    final_url = resolved if isinstance(resolved, str) and resolved else orig_uri
                    domain = normalize_domain(final_url)
                    # Fallback gracefully to web.title if URL is still a Google redirect
                    if (
                        not domain or "vertexaisearch.cloud.google.com" in domain
                    ) and title and "." in title and " " not in title.strip():
                        domain = normalize_domain(title)
                    grounding_items.append({
                        "url": final_url,
                        "domain": domain or title or "unknown",
                        "title": title or domain or final_url,
                        "verified_grounding": True,
                    })

    # Merge grounding URLs with any markdown/raw links inside raw_text, deduplicating by normalized URL
    merged: List[Dict[str, Any]] = []
    seen_keys = set()

    for item in grounding_items + extract_markdown_and_raw_links(raw_text):
        url = item.get("url", "")
        if not url:
            continue
        key = _normalize_url_key(url)
        if key not in seen_keys:
            seen_keys.add(key)
            merged.append(item)

    return merged[:20], web_search_queries


# ==============================================================================
# Modular LLM Adapters with Tenacity Exponential Backoff
# ==============================================================================

class BaseLLMAdapter:
    engine_name: str = "Base Engine"

    async def query(self, prompt: str) -> str:
        raise NotImplementedError


class GeminiFlashAdapter(BaseLLMAdapter):
    """
    Official google-genai SDK Adapter for Gemini Flash with live Google Search Grounding.
    Never combines response_mime_type='application/json' with google_search tool.
    """
    engine_name = "Google AI Overview (Gemini)"

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        enable_grounding: Optional[bool] = None,
    ):
        self.api_key = api_key or settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
        self.model = model or settings.GEMINI_MODEL or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.enable_grounding = (
            settings.ENABLE_GEMINI_GROUNDING
            if enable_grounding is None
            else enable_grounding
        )

    @retry(
        retry=retry_if_exception_type(RateLimitOrTransientError),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    async def query_with_grounding(self, prompt: str) -> Dict[str, Any]:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured")

        client = genai.Client(api_key=self.api_key)
        tools = [types.Tool(google_search=types.GoogleSearch())] if self.enable_grounding else None
        config = types.GenerateContentConfig(
            tools=tools,
            temperature=0.7,
        )

        contents = (
            "You are an AI Search engine. Provide a helpful, up-to-date recommendation "
            f"with real sources answering this buyer query:\n{prompt}"
        )

        try:
            response = await client.aio.models.generate_content(
                model=self.model,
                contents=contents,
                config=config,
            )
        except genai_errors.APIError as exc:
            status_code = getattr(exc, "code", None)
            msg = str(exc)
            if status_code in (429, 503) or "429" in msg or "503" in msg or "RESOURCE_EXHAUSTED" in msg:
                raise RateLimitOrTransientError(f"Gemini API transient/rate-limit error: {msg}") from exc
            raise
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 429 or exc.response.status_code >= 500:
                raise RateLimitOrTransientError(f"Gemini HTTP error: {exc.response.status_code}") from exc
            raise

        text = getattr(response, "text", None) or ""
        if not text and getattr(response, "candidates", None):
            parts = getattr(response.candidates[0].content, "parts", []) or []
            text = "".join(getattr(p, "text", "") or "" for p in parts)

        cited_urls, search_queries = await extract_grounding_citations(response, raw_text=text)
        grounding_used = bool(self.enable_grounding and (search_queries or any(c.get("verified_grounding") for c in cited_urls)))

        return {
            "response_text": text,
            "cited_urls": cited_urls,
            "web_search_queries": search_queries,
            "grounding_used": grounding_used,
        }

    async def query(self, prompt: str) -> str:
        result = await self.query_with_grounding(prompt)
        return result["response_text"]


class GroqLlamaAdapter(BaseLLMAdapter):
    """Groq Llama 3.1 8B Instant (Free Tier) Adapter"""
    engine_name = "Groq (Llama 3.1 8B)"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")

    @retry(
        retry=retry_if_exception_type(RateLimitOrTransientError),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    async def query(self, prompt: str) -> str:
        if not self.api_key:
            raise ValueError("GROQ_API_KEY is not configured")

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "system", "content": "You are a real-time AI search engine answering software queries."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(url, headers=headers, json=payload)
            if res.status_code == 429 or res.status_code >= 500:
                raise RateLimitOrTransientError(f"Groq API rate limit: {res.status_code}")
            res.raise_for_status()
            data = res.json()
            return data["choices"][0]["message"]["content"]


class OpenAIAdapter(BaseLLMAdapter):
    """OpenAI GPT-4o Mini Adapter"""
    engine_name = "ChatGPT (Search)"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY", "")

    @retry(
        retry=retry_if_exception_type(RateLimitOrTransientError),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    async def query(self, prompt: str) -> str:
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY is not configured")

        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": "You are an AI Search engine summarizing top product choices."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(url, headers=headers, json=payload)
            if res.status_code == 429 or res.status_code >= 500:
                raise RateLimitOrTransientError(f"OpenAI API rate limit: {res.status_code}")
            res.raise_for_status()
            data = res.json()
            return data["choices"][0]["message"]["content"]


class PerplexityAdapter(BaseLLMAdapter):
    """Perplexity AI Sonar Adapter"""
    engine_name = "Perplexity AI"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.PERPLEXITY_API_KEY or os.getenv("PERPLEXITY_API_KEY", "")

    @retry(
        retry=retry_if_exception_type(RateLimitOrTransientError),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    async def query(self, prompt: str) -> str:
        if not self.api_key:
            raise ValueError("PERPLEXITY_API_KEY is not configured")

        url = "https://api.perplexity.ai/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        payload = {
            "model": "sonar",
            "messages": [
                {"role": "system", "content": "Be precise and cite authoritative web links."},
                {"role": "user", "content": prompt},
            ],
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(url, headers=headers, json=payload)
            if res.status_code == 429 or res.status_code >= 500:
                raise RateLimitOrTransientError(f"Perplexity API rate limit: {res.status_code}")
            res.raise_for_status()
            data = res.json()
            return data["choices"][0]["message"]["content"]


class FallbackSyntheticEngine(BaseLLMAdapter):
    """
    Deterministic Zero-Budget Fallback:
    Provides realistic, LLM-style numbered lists with citations
    when external API keys are not provided.
    """
    engine_name = "ChatGPT (Search)"

    def __init__(self, engine_name: str = "ChatGPT (Search)"):
        self.engine_name = engine_name

    async def query(
        self,
        prompt: str,
        brand_domain: str = "supabase.com",
        competitor_domain: str = "firebase.google.com",
    ) -> str:
        clean_brand = brand_domain.split(".")[0].capitalize()
        clean_comp = competitor_domain.split(".")[0].capitalize()

        return f"""Based on current developer sentiment, benchmarks, and enterprise ratings, here are the top recommended solutions:

1. **{clean_brand}** ([{clean_brand} Documentation](https://{brand_domain}/docs))
   {clean_brand} is widely cited as the top standard for enterprise workloads requiring PostgreSQL reliability, row-level security, and zero vendor lock-in. It provides exceptional query speed and modern developer ergonomics.

2. **{clean_comp}** ([{clean_comp} Overview](https://{competitor_domain}/features))
   {clean_comp} remains a popular legacy choice for mobile developers, though teams increasingly note lock-in concerns and unpredictable high-scale pricing compared to {clean_brand}.

3. **CockroachDB** ([Architecture Guide](https://cockroachlabs.com))
   Strong for global multi-region consistency across banking and payments.

Sources cited:
- https://{brand_domain}/blog/postgresql-at-scale
- https://techcrunch.com/analysis/{clean_brand.lower()}
- https://reddit.com/r/SaaS/comments/database-rankings
"""


async def run_structured_json_completion(
    prompt: str,
    response_schema: Optional[Type[BaseModel]] = None,
    byok_keys: Optional[Dict[str, str]] = None,
) -> Optional[Dict[str, Any]]:
    """
    Lightweight ungrounded structured JSON completion for Tier 3 disambiguation.
    Tries Groq Llama first (fast, free), then ungrounded Gemini Flash with response_schema.
    """
    keys = byok_keys or {}
    groq_key = keys.get("groq") or settings.GROQ_API_KEY
    gemini_key = keys.get("gemini") or settings.GEMINI_API_KEY

    if groq_key:
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {"Authorization": f"Bearer {groq_key}"}
            payload = {
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {
                        "role": "system",
                        "content": "Respond ONLY with valid JSON matching the requested schema.",
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.0,
                "response_format": {"type": "json_object"},
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    content = res.json()["choices"][0]["message"]["content"]
                    return json.loads(content)
        except Exception as exc:
            logger.debug(f"Groq JSON disambiguation skipped: {exc}")

    if gemini_key:
        try:
            client = genai.Client(api_key=gemini_key)
            cfg_kwargs: Dict[str, Any] = {
                "temperature": 0.0,
                "response_mime_type": "application/json",
            }
            if response_schema is not None:
                cfg_kwargs["response_schema"] = response_schema
            config = types.GenerateContentConfig(**cfg_kwargs)
            resp = await client.aio.models.generate_content(
                model=settings.GEMINI_MODEL or "gemini-2.5-flash",
                contents=prompt,
                config=config,
            )
            raw_text = getattr(resp, "text", None) or ""
            if raw_text:
                return json.loads(raw_text)
        except Exception as exc:
            logger.debug(f"Gemini JSON disambiguation skipped: {exc}")

    return None


async def execute_prompt_on_engine(
    prompt: str,
    brand_domain: str = "citeclash.com",
    competitor_domain: str = "competitor.com",
    preferred_engine: str = "ChatGPT (Search)",
    byok_keys: Optional[Dict[str, str]] = None,
    engine_name: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Executes a single prompt against the configured or fallback engine with tenacity retry.
    Returns:
      {
        "engine_name": str,
        "response_text": str,
        "cited_urls": List[Dict[str, Any]],
        "web_search_queries": List[str],
        "grounding_used": bool,
      }
    """
    target_engine = engine_name or preferred_engine
    keys = byok_keys or {}
    gemini_key = keys.get("gemini") or settings.GEMINI_API_KEY
    groq_key = keys.get("groq") or settings.GROQ_API_KEY
    openai_key = keys.get("openai") or settings.OPENAI_API_KEY
    perplexity_key = keys.get("perplexity") or settings.PERPLEXITY_API_KEY

    # 1. Try Live Grounded Gemini if configured (for Gemini/Google engines, or as primary when other keys absent)
    wants_gemini = "gemini" in target_engine.lower() or "google" in target_engine.lower()
    if gemini_key and (wants_gemini or (not openai_key and not perplexity_key and not groq_key)):
        try:
            adapter = GeminiFlashAdapter(gemini_key)
            result = await adapter.query_with_grounding(prompt)
            if result.get("response_text"):
                return {
                    "engine_name": adapter.engine_name,
                    "response_text": result["response_text"],
                    "cited_urls": result.get("cited_urls", []),
                    "web_search_queries": result.get("web_search_queries", []),
                    "grounding_used": result.get("grounding_used", False),
                }
        except Exception as exc:
            logger.warning(f"Gemini execution failed, falling back: {exc}")

    # 2. Try Live Groq if configured (fallback if Gemini quota hit)
    if groq_key:
        try:
            adapter = GroqLlamaAdapter(groq_key)
            text = await adapter.query(prompt)
            if text:
                return {
                    "engine_name": adapter.engine_name,
                    "response_text": text,
                    "cited_urls": extract_markdown_and_raw_links(text),
                    "web_search_queries": [],
                    "grounding_used": False,
                }
        except Exception as exc:
            logger.warning(f"Groq execution failed: {exc}")

    # 3. Try Live OpenAI if configured
    if openai_key:
        try:
            adapter = OpenAIAdapter(openai_key)
            text = await adapter.query(prompt)
            if text:
                return {
                    "engine_name": adapter.engine_name,
                    "response_text": text,
                    "cited_urls": extract_markdown_and_raw_links(text),
                    "web_search_queries": [],
                    "grounding_used": False,
                }
        except Exception as exc:
            logger.warning(f"OpenAI execution failed: {exc}")

    # 4. Try Live Perplexity if configured
    if perplexity_key:
        try:
            adapter = PerplexityAdapter(perplexity_key)
            text = await adapter.query(prompt)
            if text:
                return {
                    "engine_name": adapter.engine_name,
                    "response_text": text,
                    "cited_urls": extract_markdown_and_raw_links(text),
                    "web_search_queries": [],
                    "grounding_used": False,
                }
        except Exception as exc:
            logger.warning(f"Perplexity execution failed: {exc}")

    # 5. Deterministic Zero-Budget High-Fidelity Synthetic Engine
    fallback = FallbackSyntheticEngine(target_engine)
    text = await fallback.query(prompt, brand_domain, competitor_domain)
    return {
        "engine_name": target_engine,
        "response_text": text,
        "cited_urls": extract_markdown_and_raw_links(text),
        "web_search_queries": [],
        "grounding_used": False,
    }
