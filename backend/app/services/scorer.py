import re
from typing import Any, Dict, List, Literal, Optional, Tuple, Union
from urllib.parse import urlparse

from pydantic import BaseModel, Field


class SentimentClassification(BaseModel):
    sentiment: Literal["positive", "neutral", "negative"] = Field(
        default="positive",
        description="Sentiment orientation of the brand mention",
    )
    confidence: float = Field(default=0.9, ge=0.0, le=1.0)
    explanation: Optional[str] = None


class LLMDisambiguationResult(BaseModel):
    is_brand_actually_recommended: bool = False
    is_competitor_recommended: bool = False
    sentiment: Literal["positive", "neutral", "negative"] = "neutral"
    matched_rank_position: Optional[int] = None
    evidence_snippet: str = ""


class BrandMentionScore(BaseModel):
    mentioned: bool
    rank: Optional[int] = None
    sentiment: Literal["positive", "neutral", "negative"] = "neutral"
    confidence: float = 1.0
    ambiguous: bool = False
    tier_used: int = 1
    evidence_windows: List[str] = []


class DeterministicAuditResult(BaseModel):
    brand_mentioned: bool
    brand_rank: Optional[int] = None
    competitor_mentioned: bool
    competitor_rank: Optional[int] = None
    sentiment: Literal["positive", "neutral", "negative"]
    cited_urls: List[Any] = []
    brand_score: float
    competitor_score: float


# Built-in ~170 common English words frequently used as SaaS/tech brand names
COMMON_ENGLISH_BRAND_WORDS = {
    "linear", "close", "monday", "notion", "fresh", "base", "drift", "slack",
    "zoom", "square", "stripe", "spark", "wave", "pulse", "scale", "front",
    "target", "oracle", "apple", "amazon", "mint", "sage", "loom", "pitch",
    "craft", "clear", "smart", "swift", "prime", "core", "peak", "atlas",
    "nova", "aura", "echo", "bolt", "fuse", "flow", "grid", "heap",
    "kite", "leap", "mesh", "nest", "orbit", "path", "rise", "seed",
    "tide", "unit", "vast", "wish", "zero", "able", "ace", "act",
    "aim", "air", "ally", "amp", "arc", "art", "ask", "beam",
    "bell", "best", "bit", "blue", "bold", "bond", "book", "boom",
    "box", "brave", "brief", "bright", "build", "calm", "care", "case",
    "cast", "chain", "chart", "check", "chief", "choice", "claim", "click",
    "cloud", "coach", "code", "coin", "crew", "crown", "cube", "curve",
    "dash", "data", "deal", "deep", "desk", "direct", "dock", "door",
    "dot", "draft", "dream", "drive", "drop", "edge", "ever", "fact",
    "fair", "fast", "feed", "field", "file", "fine", "fire", "first",
    "fit", "fix", "flag", "flash", "flex", "flip", "focus", "force",
    "form", "frame", "free", "full", "gain", "gate", "gear", "gem",
    "gift", "glide", "glow", "goal", "gold", "good", "grade", "grand",
    "grant", "great", "green", "grow", "guard", "guide", "halo", "hand",
    "head", "heart", "help", "hero", "high", "hint", "hive", "hold",
    "home", "hook", "hope", "host", "hub", "icon", "idea", "index",
    "ink", "input", "iron", "item", "join", "jump", "just", "keep",
    "key", "kind", "king", "knot", "know", "lab", "land", "lane",
    "last", "lead", "leaf", "lean", "left", "lens", "level", "life",
    "lift", "light", "like", "line", "link", "list", "live", "load",
    "lock", "loop", "luck", "made", "main", "make", "map", "mark",
    "match", "mate", "max", "maze", "mean", "meet", "mend", "merge",
    "meta", "mind", "mine", "mode", "more", "move", "near", "neat",
    "need", "net", "new", "next", "nice", "node", "note", "open",
    "pace", "pack", "page", "pair", "part", "pass", "past", "pay",
    "peer", "pick", "pin", "ping", "pipe", "plan", "play", "plot",
    "plus", "point", "pole", "poll", "pool", "port", "post", "power",
    "press", "price", "proof", "pure", "push", "quest", "quick", "quiet",
    "quote", "race", "rank", "rate", "reach", "read", "ready", "real",
    "relay", "rest", "rich", "ride", "right", "ring", "road", "rock",
    "role", "roll", "room", "root", "route", "rule", "run", "rush",
    "safe", "sail", "same", "save", "scan", "scope", "score", "scout",
    "seal", "search", "seat", "seek", "send", "sense", "serve", "set",
    "shape", "share", "sharp", "shift", "shine", "ship", "shop", "short",
    "shot", "show", "side", "sight", "sign", "simple", "site", "size",
    "skill", "skip", "slate", "slice", "slide", "snap", "solid", "solve",
    "sort", "sound", "source", "space", "span", "speak", "speed", "spend",
    "spin", "split", "spot", "spring", "stack", "stage", "stand", "star",
    "start", "state", "stay", "steady", "step", "stick", "still", "stock",
    "stone", "stop", "store", "story", "stream", "strong", "study", "style",
    "suite", "super", "sure", "surge", "sweep", "sweet", "swing", "sync",
    "table", "tag", "take", "talk", "tap", "task", "team", "tech",
    "term", "test", "text", "theme", "think", "tier", "tight", "time",
    "title", "today", "tone", "tool", "top", "topic", "total", "touch",
    "trace", "track", "trade", "trail", "train", "trend", "trial", "trim",
    "trip", "true", "trust", "truth", "tune", "turn", "twin", "type",
    "value", "vault", "vector", "view", "visit", "vital", "voice", "vote",
    "wait", "wake", "walk", "watch", "way", "web", "week", "well",
    "wide", "will", "win", "wind", "wire", "wise", "word", "work",
    "world", "worth", "write", "yield", "young", "zone",
}


def clean_domain_str(domain_or_url: str) -> str:
    clean = (domain_or_url or "").strip().lower()
    clean = re.sub(r"^https?://", "", clean)
    clean = clean.split("/")[0].split("?")[0]
    if clean.startswith("www."):
        clean = clean[4:]
    return clean


def extract_clean_brand_tokens(domain_or_name: str) -> List[str]:
    """
    Extract search tokens for brand detection.
    e.g., 'supabase.com' -> ['supabase.com', 'supabase']
    'firebase.google.com' -> ['firebase.google.com', 'firebase']
    """
    clean = clean_domain_str(domain_or_name)
    tokens: List[str] = [clean] if clean else []

    parts = clean.split(".")
    if len(parts) >= 2:
        main_token = parts[0] if parts[0] not in ("www", "app", "api", "docs") else parts[1]
        if main_token and len(main_token) > 2 and main_token not in tokens:
            tokens.append(main_token)

    return tokens


def extract_cited_urls(text: str) -> List[str]:
    """
    Deterministically extract all cited URLs from markdown links and raw URLs.
    """
    urls: List[str] = []
    md_urls = re.findall(r"\[([^\]]+)\]\((https?://[^\s\)]+)\)", text or "")
    for _, url in md_urls:
        clean_url = url.rstrip(".,;\"'>")
        if clean_url not in urls:
            urls.append(clean_url)

    raw_urls = re.findall(r"https?://[a-zA-Z0-9_\-\./\?=%&#+]+", text or "")
    for url in raw_urls:
        clean_url = url.rstrip(".,;)\"'>")
        if clean_url not in urls:
            urls.append(clean_url)

    return urls[:15]


def parse_recommendation_list_items(text: str) -> List[Tuple[int, str]]:
    """
    Extract numbered AND bulleted recommendation list items:
      - Numbered: '1. **Linear** - Best for...', '2) Close CRM: ...', '### 1. Brand'
      - Bulleted: '- **Linear**: ...', '* **Close** - ...'
    Returns list of (1-based rank, item_text).
    """
    items: List[Tuple[int, str]] = []

    numbered_pattern = re.compile(
        r"(?:^|\n)\s*(?:###\s*)?(?:\*{0,2})([1-9]|10)[\.\)](?:\*{0,2})\s*([^\n\r]+)",
        re.MULTILINE,
    )
    for rank_str, line in numbered_pattern.findall(text or ""):
        try:
            items.append((int(rank_str), line.strip()))
        except ValueError:
            continue

    if not items:
        bullet_pattern = re.compile(
            r"(?:^|\n)\s*[-\*•]\s+([^\n\r]+)",
            re.MULTILINE,
        )
        for idx, line in enumerate(bullet_pattern.findall(text or ""), start=1):
            items.append((min(idx, 10), line.strip()))

    return items


def _domain_in_cited_urls(clean_domain: str, cited_urls: Optional[List[Any]]) -> bool:
    if not clean_domain or not cited_urls:
        return False
    for entry in cited_urls:
        if isinstance(entry, dict):
            u_dom = clean_domain_str(entry.get("domain", "") or entry.get("url", ""))
            u_url = (entry.get("url", "") or "").lower()
        else:
            u_dom = clean_domain_str(str(entry))
            u_url = str(entry).lower()
        if clean_domain == u_dom or clean_domain in u_dom or clean_domain in u_url:
            return True
    return False


def _is_heading_or_bold_brand_match(line: str, brand_name: str, brand_tokens: List[str]) -> bool:
    """
    Check if brand_name matches a bolded (**Linear**) or Title-Cased list heading
    at the start of a recommendation item or markdown heading.
    """
    candidates = [c for c in ([brand_name.strip()] + brand_tokens) if c]
    # 1. Check bolded spans anywhere in the list heading line: **Linear**, **Close CRM**
    bold_spans = re.findall(r"\*\*([^*]+)\*\*", line)
    for span in bold_spans:
        for cand in candidates:
            if re.search(rf"\b{re.escape(cand)}\b", span, re.IGNORECASE):
                return True

    # 2. Check leading title-cased phrase before separator (-, :, (, —, |)
    head = re.split(r"\s+[-–—:|(]", line.strip(), maxsplit=1)[0]
    for cand in candidates:
        # Must match with uppercase initial or exact brand casing (not all-lowercase ordinary word)
        m = re.search(rf"\b({re.escape(cand)})\b", head, re.IGNORECASE)
        if m:
            matched_text = m.group(1)
            if matched_text[0].isupper() or "." in matched_text:
                return True

    return False


def _is_common_or_short_lowercase_word(brand_name: str, raw_text: str) -> bool:
    """
    Tier 2 heuristic:
    Returns True if brand_name is in COMMON_ENGLISH_BRAND_WORDS OR is a single
    dictionary-like word <= 7 chars matching in lowercase mid-sentence.
    """
    clean_name = (brand_name or "").strip().lower()
    if not clean_name:
        return False
    if clean_name in COMMON_ENGLISH_BRAND_WORDS:
        return True
    if clean_name.isalpha() and len(clean_name) <= 7:
        # Check if it appears in lowercase mid-sentence
        if re.search(rf"(?<=[a-z0-9,;:\s])\b{re.escape(clean_name)}\b", raw_text):
            return True
    return False


def _extract_context_windows(tokens: List[str], text: str, radius: int = 125) -> List[str]:
    windows: List[str] = []
    for token in tokens:
        if not token:
            continue
        for m in re.finditer(rf"\b{re.escape(token)}\b", text or "", re.IGNORECASE):
            start = max(0, m.start() - radius)
            end = min(len(text), m.end() + radius)
            snippet = text[start:end].strip()
            if snippet and snippet not in windows:
                windows.append(snippet)
    return windows[:5]


def classify_sentiment_deterministic(tokens: List[str], text: str) -> Literal["positive", "neutral", "negative"]:
    """
    Deterministic rule-based sentiment classification on brand mentions.
    """
    negative_signals = [
        "expensive", "slow", "hard to configure", "lacks", "poor", "failing",
        "downside", "drawback", "legacy", "complicated", "lock-in", "unreliable",
        "inferior", "buggy", "costly",
    ]
    positive_signals = [
        "best", "premier", "top", "leading", "recommended", "superior", "scalable",
        "easy", "fast", "modern", "reliable", "favorite", "excellent", "open-source",
        "popular", "robust", "advantage", "standard",
    ]

    snippets = _extract_context_windows(tokens, text, radius=150)
    combined_window = " ".join(s.lower() for s in snippets) or (text or "").lower()

    pos_count = sum(1 for w in positive_signals if w in combined_window)
    neg_count = sum(1 for w in negative_signals if w in combined_window)

    if pos_count > neg_count:
        return "positive"
    elif neg_count > pos_count:
        return "negative"
    return "neutral"


def calculate_visibility_score(mentioned: bool, rank: Optional[int], sentiment: str) -> float:
    """
    Deterministic formula:
    - Mention: 40 points
    - Rank position: #1 = 40, #2 = 32, #3 = 24, #4-5 = 16, #6-10 = 8, unranked = 10
    - Sentiment: positive = 20, neutral = 10, negative = 0
    Total max: 100
    """
    if not mentioned:
        return 0.0

    score = 40.0
    if rank == 1:
        score += 40.0
    elif rank == 2:
        score += 32.0
    elif rank == 3:
        score += 24.0
    elif rank in (4, 5):
        score += 16.0
    elif rank and rank <= 10:
        score += 8.0
    else:
        score += 10.0

    if sentiment == "positive":
        score += 20.0
    elif sentiment == "neutral":
        score += 10.0

    return min(100.0, score)


def score_brand_mention(
    raw_text: str,
    brand_name: str,
    brand_domain: str,
    industry: str = "SaaS",
    cited_urls: Optional[List[Any]] = None,
) -> BrandMentionScore:
    """
    3-Tier Hybrid Scoring Pipeline (Synchronous Tier 1 + Tier 2):
      - Tier 1: High-Confidence Fast Pass (zero LLM cost)
      - Tier 2: Ambiguous Common-Word Detector (flags ambiguous=True + 250-char windows)
    """
    text = raw_text or ""
    clean_domain = clean_domain_str(brand_domain)
    tokens = extract_clean_brand_tokens(brand_domain)
    if brand_name and brand_name.strip().lower() not in [t.lower() for t in tokens]:
        tokens.append(brand_name.strip())

    sentiment = classify_sentiment_deterministic(tokens, text)
    list_items = parse_recommendation_list_items(text)

    # ---- TIER 1: High-Confidence Fast Pass ----
    domain_cited = _domain_in_cited_urls(clean_domain, cited_urls) or (
        bool(clean_domain) and bool(re.search(rf"\b{re.escape(clean_domain)}\b", text, re.IGNORECASE))
    )

    list_rank: Optional[int] = None
    for rank, item_line in list_items:
        if _is_heading_or_bold_brand_match(item_line, brand_name, tokens) or (
            clean_domain and re.search(rf"\b{re.escape(clean_domain)}\b", item_line, re.IGNORECASE)
        ):
            list_rank = rank
            break

    # Also check markdown headings (### Linear)
    heading_rank: Optional[int] = None
    if list_rank is None:
        current_rank = 1
        for line in text.split("\n"):
            stripped = line.strip()
            if stripped.startswith(("#", "**")):
                if _is_heading_or_bold_brand_match(stripped, brand_name, tokens):
                    heading_rank = min(current_rank, 10)
                    break
                current_rank += 1

    if domain_cited or list_rank is not None or heading_rank is not None:
        final_rank = list_rank or heading_rank
        if final_rank is None:
            # Domain cited in text/URLs; estimate position from first occurrence
            first_idx = min(
                [
                    m.start()
                    for tok in tokens
                    for m in [re.search(rf"\b{re.escape(tok)}\b", text, re.IGNORECASE)]
                    if m
                ]
                or [9999]
            )
            final_rank = 1 if first_idx < 300 else (2 if first_idx < 800 else 3)
        return BrandMentionScore(
            mentioned=True,
            rank=final_rank,
            sentiment=sentiment,
            confidence=1.0,
            ambiguous=False,
            tier_used=1,
        )

    # Check if any token appears in text at all
    any_match = any(re.search(rf"\b{re.escape(tok)}\b", text, re.IGNORECASE) for tok in tokens)
    if not any_match:
        return BrandMentionScore(
            mentioned=False,
            rank=None,
            sentiment="neutral",
            confidence=1.0,
            ambiguous=False,
            tier_used=1,
        )

    # ---- TIER 2: Ambiguous Common-Word Detector ----
    # Check if brand appears ONLY in lowercase prose (not bolded, not title-cased heading)
    has_bold_or_capitalized = False
    for tok in tokens:
        if re.search(rf"\*\*[^*]*\b{re.escape(tok)}\b[^*]*\*\*", text, re.IGNORECASE):
            has_bold_or_capitalized = True
            break
        # Check capitalized proper noun usage (not at start of sentence? still stronger signal if capitalized)
        if re.search(rf"\b{re.escape(tok.capitalize())}\b", text):
            has_bold_or_capitalized = True
            break

    is_common = _is_common_or_short_lowercase_word(brand_name or (tokens[-1] if tokens else ""), text)
    if is_common and not has_bold_or_capitalized:
        windows = _extract_context_windows(tokens, text, radius=125)
        return BrandMentionScore(
            mentioned=False,
            rank=None,
            sentiment="neutral",
            confidence=0.3,
            ambiguous=True,
            tier_used=2,
            evidence_windows=windows,
        )

    # Non-common unambiguous brand name mentioned in prose
    first_idx = min(
        [
            m.start()
            for tok in tokens
            for m in [re.search(rf"\b{re.escape(tok)}\b", text, re.IGNORECASE)]
            if m
        ]
        or [9999]
    )
    fallback_rank = 1 if first_idx < 300 else (2 if first_idx < 800 else 3)
    return BrandMentionScore(
        mentioned=True,
        rank=fallback_rank,
        sentiment=sentiment,
        confidence=0.85,
        ambiguous=False,
        tier_used=1,
    )


async def score_brand_mention_async(
    raw_text: str,
    brand_name: str,
    brand_domain: str,
    industry: str = "SaaS",
    cited_urls: Optional[List[Any]] = None,
    competitor_name: Optional[str] = None,
    competitor_domain: Optional[str] = None,
) -> BrandMentionScore:
    """
    Full 3-Tier async scorer. Runs Tier 1 + Tier 2, and invokes Tier 3 LLM disambiguation
    ONLY when ambiguous=True.
    """
    tier12 = score_brand_mention(
        raw_text=raw_text,
        brand_name=brand_name,
        brand_domain=brand_domain,
        industry=industry,
        cited_urls=cited_urls,
    )

    if not tier12.ambiguous:
        return tier12

    # Tier 3: Lightweight LLM Disambiguation (Pydantic Strict JSON)
    from app.services.llm_runner import run_structured_json_completion

    windows_text = "\n---\n".join(tier12.evidence_windows) or raw_text[:500]
    prompt = (
        f"Verify whether '{brand_name}' ({brand_domain}, industry: {industry}) is being referred to "
        f"as the actual software/product/company, NOT as an ordinary English word.\n"
        f"Also check if competitor '{competitor_name or competitor_domain or 'N/A'}' is recommended.\n\n"
        f"Context excerpts:\n{windows_text}\n\n"
        f"Return strict JSON with keys: is_brand_actually_recommended (bool), "
        f"is_competitor_recommended (bool), sentiment ('positive'|'neutral'|'negative'), "
        f"matched_rank_position (int or null), evidence_snippet (str)."
    )

    llm_data = await run_structured_json_completion(
        prompt=prompt,
        response_schema=LLMDisambiguationResult,
    )

    if not llm_data:
        # Safe conservative fallback: do NOT inflate score on lowercase common-word matches
        return BrandMentionScore(
            mentioned=False,
            rank=None,
            sentiment="neutral",
            confidence=0.5,
            ambiguous=True,
            tier_used=2,
            evidence_windows=tier12.evidence_windows,
        )

    try:
        parsed = LLMDisambiguationResult.model_validate(llm_data)
    except Exception:
        return BrandMentionScore(
            mentioned=False,
            rank=None,
            sentiment="neutral",
            confidence=0.5,
            ambiguous=True,
            tier_used=3,
            evidence_windows=tier12.evidence_windows,
        )

    if not parsed.is_brand_actually_recommended:
        return BrandMentionScore(
            mentioned=False,
            rank=None,
            sentiment=parsed.sentiment,
            confidence=0.95,
            ambiguous=False,
            tier_used=3,
            evidence_windows=tier12.evidence_windows,
        )

    return BrandMentionScore(
        mentioned=True,
        rank=parsed.matched_rank_position or 2,
        sentiment=parsed.sentiment,
        confidence=0.95,
        ambiguous=False,
        tier_used=3,
        evidence_windows=tier12.evidence_windows,
    )


def score_audit_citation(
    raw_response: str,
    brand_domain: str,
    competitor_domain: str,
    industry: str = "SaaS",
    cited_urls: Optional[List[Any]] = None,
) -> DeterministicAuditResult:
    """
    Synchronous Tier 1 + Tier 2 audit citation scorer.
    Applies identical disambiguation logic to both brand and competitor.
    """
    brand_name = clean_domain_str(brand_domain).split(".")[0].capitalize()
    comp_name = clean_domain_str(competitor_domain).split(".")[0].capitalize()

    extracted_urls = cited_urls if cited_urls is not None else extract_cited_urls(raw_response)

    brand_res = score_brand_mention(
        raw_text=raw_response,
        brand_name=brand_name,
        brand_domain=brand_domain,
        industry=industry,
        cited_urls=extracted_urls,
    )
    comp_res = score_brand_mention(
        raw_text=raw_response,
        brand_name=comp_name,
        brand_domain=competitor_domain,
        industry=industry,
        cited_urls=extracted_urls,
    )

    brand_score = calculate_visibility_score(brand_res.mentioned, brand_res.rank, brand_res.sentiment)
    comp_score = calculate_visibility_score(comp_res.mentioned, comp_res.rank, comp_res.sentiment)

    return DeterministicAuditResult(
        brand_mentioned=brand_res.mentioned,
        brand_rank=brand_res.rank,
        competitor_mentioned=comp_res.mentioned,
        competitor_rank=comp_res.rank,
        sentiment=brand_res.sentiment if brand_res.mentioned else "neutral",
        cited_urls=extracted_urls,
        brand_score=brand_score,
        competitor_score=comp_score,
    )


async def score_audit_citation_async(
    raw_response: str,
    brand_domain: str,
    competitor_domain: str,
    industry: str = "SaaS",
    cited_urls: Optional[List[Any]] = None,
) -> DeterministicAuditResult:
    """
    Full 3-Tier async audit citation scorer with LLM disambiguation for ambiguous common words.
    """
    brand_name = clean_domain_str(brand_domain).split(".")[0].capitalize()
    comp_name = clean_domain_str(competitor_domain).split(".")[0].capitalize()

    extracted_urls = cited_urls if cited_urls is not None else extract_cited_urls(raw_response)

    brand_res = await score_brand_mention_async(
        raw_text=raw_response,
        brand_name=brand_name,
        brand_domain=brand_domain,
        industry=industry,
        cited_urls=extracted_urls,
        competitor_name=comp_name,
        competitor_domain=competitor_domain,
    )
    comp_res = await score_brand_mention_async(
        raw_text=raw_response,
        brand_name=comp_name,
        brand_domain=competitor_domain,
        industry=industry,
        cited_urls=extracted_urls,
        competitor_name=brand_name,
        competitor_domain=brand_domain,
    )

    brand_score = calculate_visibility_score(brand_res.mentioned, brand_res.rank, brand_res.sentiment)
    comp_score = calculate_visibility_score(comp_res.mentioned, comp_res.rank, comp_res.sentiment)

    return DeterministicAuditResult(
        brand_mentioned=brand_res.mentioned,
        brand_rank=brand_res.rank,
        competitor_mentioned=comp_res.mentioned,
        competitor_rank=comp_res.rank,
        sentiment=brand_res.sentiment if brand_res.mentioned else "neutral",
        cited_urls=extracted_urls,
        brand_score=brand_score,
        competitor_score=comp_score,
    )
