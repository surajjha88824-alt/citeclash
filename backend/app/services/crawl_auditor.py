import asyncio
import json
import re
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from bs4 import BeautifulSoup

from app.services.safe_fetcher import safe_fetch_url

AI_BOTS = [
    "OAI-SearchBot",
    "GPTBot",
    "ChatGPT-User",
    "PerplexityBot",
    "ClaudeBot",
    "Google-Extended",
    "*",
]

HIGH_VALUE_GEO_SCHEMAS = ["Organization", "SoftwareApplication", "Product", "FAQPage"]


def parse_robots_txt_for_ai_bots(robots_text: Optional[str]) -> Dict[str, Any]:
    """
    Deterministically parse robots.txt rules for major AI crawlers.
    Returns status per bot: 'allowed' | 'blocked' | 'not_specified'.
    """
    if not robots_text:
        return {
            "found": False,
            "bots": {bot: "not_specified" for bot in AI_BOTS},
            "blocked_bots": [],
            "robots_txt_fix": None,
        }

    groups: List[Dict[str, Any]] = []
    current_agents: List[str] = []
    current_rules: List[tuple] = []
    in_rules = False

    for raw_line in robots_text.splitlines():
        line = raw_line.split("#", 1)[0].strip()
        if not line:
            if current_agents and current_rules:
                groups.append({"agents": current_agents, "rules": current_rules})
                current_agents = []
                current_rules = []
                in_rules = False
            continue

        if ":" not in line:
            continue
        directive, value = line.split(":", 1)
        directive = directive.strip().lower()
        value = value.strip()

        if directive == "user-agent":
            if in_rules and current_agents:
                groups.append({"agents": current_agents, "rules": current_rules})
                current_agents = []
                current_rules = []
                in_rules = False
            current_agents.append(value.lower())
        elif directive in ("disallow", "allow"):
            in_rules = True
            current_rules.append((directive, value))

    if current_agents:
        groups.append({"agents": current_agents, "rules": current_rules})

    def _eval_group_rules(rules: List[tuple]) -> str:
        # Longest-match / explicit root rule check
        has_disallow_all = any(d == "disallow" and v == "/" for d, v in rules)
        has_allow_all = any(d == "allow" and v == "/" for d, v in rules)
        has_empty_disallow = any(d == "disallow" and v == "" for d, v in rules)
        if has_allow_all:
            return "allowed"
        if has_disallow_all:
            return "blocked"
        if has_empty_disallow or rules:
            return "allowed"
        return "not_specified"

    wildcard_status = "not_specified"
    for grp in groups:
        if "*" in grp["agents"]:
            wildcard_status = _eval_group_rules(grp["rules"])
            break

    bot_statuses: Dict[str, str] = {}
    for bot in AI_BOTS:
        bot_lower = bot.lower()
        matched_status = None
        for grp in groups:
            if bot_lower in grp["agents"]:
                matched_status = _eval_group_rules(grp["rules"])
                break
        if matched_status is not None:
            bot_statuses[bot] = matched_status
        elif bot != "*" and wildcard_status == "blocked":
            bot_statuses[bot] = "blocked"
        elif bot == "*":
            bot_statuses[bot] = wildcard_status
        else:
            bot_statuses[bot] = "not_specified"

    blocked_bots = [b for b in AI_BOTS if b != "*" and bot_statuses.get(b) == "blocked"]
    fix_snippet = None
    if blocked_bots:
        lines = ["# Add these rules to robots.txt to allow AI search & citation crawlers:"]
        for b in blocked_bots:
            lines.append(f"User-agent: {b}")
            lines.append("Allow: /\n")
        fix_snippet = "\n".join(lines).strip()

    return {
        "found": True,
        "bots": bot_statuses,
        "blocked_bots": blocked_bots,
        "robots_txt_fix": fix_snippet,
    }


def analyze_html_for_ai_crawlers(html: str) -> Dict[str, Any]:
    """
    Run deterministic HTML checks:
      - JS-only blank page trap (visible words < 120 + empty #root/#app/#__next)
      - JSON-LD schema extraction & syntax validation
      - Entity & fact clarity (h1, title, meta description, canonical, tables, pricing markers)
    """
    soup = BeautifulSoup(html or "", "lxml")

    # Extract JSON-LD before stripping <script> tags
    detected_schemas: List[str] = []
    invalid_jsonld_count = 0
    for script in soup.find_all("script", attrs={"type": re.compile(r"application/ld\+json", re.I)}):
        raw_json = (script.string or script.get_text() or "").strip()
        if not raw_json:
            continue
        try:
            parsed = json.loads(raw_json)
            items = parsed if isinstance(parsed, list) else [parsed]
            for obj in items:
                if not isinstance(obj, dict):
                    continue
                if "@graph" in obj and isinstance(obj["@graph"], list):
                    for node in obj["@graph"]:
                        if isinstance(node, dict) and node.get("@type"):
                            t = node["@type"]
                            detected_schemas.extend(t if isinstance(t, list) else [str(t)])
                elif obj.get("@type"):
                    t = obj["@type"]
                    detected_schemas.extend(t if isinstance(t, list) else [str(t)])
        except Exception:
            invalid_jsonld_count += 1

    detected_schemas = list(dict.fromkeys(detected_schemas))
    missing_schemas = [s for s in HIGH_VALUE_GEO_SCHEMAS if s not in detected_schemas]

    # Entity & Fact Clarity before stripping tags
    title_tag = soup.find("title")
    title_text = title_tag.get_text(strip=True) if title_tag else ""
    h1_tag = soup.find("h1")
    h1_text = h1_tag.get_text(strip=True) if h1_tag else ""
    meta_desc_tag = soup.find("meta", attrs={"name": re.compile(r"^description$", re.I)})
    meta_desc = (meta_desc_tag.get("content") or "").strip() if meta_desc_tag else ""
    canonical_tag = soup.find("link", attrs={"rel": lambda r: r and "canonical" in [x.lower() for x in (r if isinstance(r, list) else [r])]})
    canonical_url = (canonical_tag.get("href") or "").strip() if canonical_tag else ""
    table_count = len(soup.find_all("table"))

    # Check SPA mount nodes before stripping
    spa_mounts = soup.select("#root, #app, #__next")
    has_empty_spa_mount = any(len(m.get_text(strip=True)) < 80 for m in spa_mounts)

    # Strip non-content tags for visible word count
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()

    visible_text = soup.get_text(" ", strip=True)
    visible_words = len(re.findall(r"\b\w+\b", visible_text))
    is_js_blank_trap = visible_words < 120 and (has_empty_spa_mount or visible_words < 60)

    has_pricing_markers = bool(
        re.search(r"(\$\s?\d+|/month|/mo\b|pricing|enterprise plan|free tier)", visible_text, re.I)
    )

    return {
        "visible_words": visible_words,
        "has_empty_spa_mount": has_empty_spa_mount,
        "is_js_blank_trap": is_js_blank_trap,
        "detected_schemas": detected_schemas,
        "missing_schemas": missing_schemas,
        "invalid_jsonld_count": invalid_jsonld_count,
        "title": title_text,
        "h1": h1_text,
        "meta_description": meta_desc,
        "canonical_url": canonical_url,
        "table_count": table_count,
        "has_pricing_markers": has_pricing_markers,
    }


def normalize_target_base_url(target_url: str) -> str:
    clean = target_url.strip()
    if not clean.startswith(("http://", "https://")):
        clean = f"https://{clean}"
    parsed = urlparse(clean)
    return f"{parsed.scheme}://{parsed.netloc}"


async def run_live_crawl_audit(target_url: str) -> Dict[str, Any]:
    """
    Execute all 6 deterministic HTTP checks on the live domain and compute
    the composite AI-Readiness Score (0-100).
    """
    clean_target = target_url.strip()
    if not clean_target.startswith(("http://", "https://")):
        clean_target = f"https://{clean_target}"
    base_url = normalize_target_base_url(clean_target)

    robots_url = f"{base_url}/robots.txt"
    llms_url = f"{base_url}/llms.txt"

    html_res, robots_res, llms_res = await asyncio.gather(
        safe_fetch_url(clean_target),
        safe_fetch_url(robots_url),
        safe_fetch_url(llms_url),
    )

    # 1. Robots.txt check
    robots_text = robots_res["html"] if robots_res["ok"] else None
    robots_check = parse_robots_txt_for_ai_bots(robots_text)

    # 2. HTML + JS trap + Schema + Entity checks
    if html_res["ok"] and html_res["html"]:
        html_analysis = analyze_html_for_ai_crawlers(html_res["html"])
    else:
        html_analysis = {
            "visible_words": 0,
            "has_empty_spa_mount": False,
            "is_js_blank_trap": False,
            "detected_schemas": [],
            "missing_schemas": HIGH_VALUE_GEO_SCHEMAS,
            "invalid_jsonld_count": 0,
            "title": "",
            "h1": "",
            "meta_description": "",
            "canonical_url": "",
            "table_count": 0,
            "has_pricing_markers": False,
            "fetch_error": html_res.get("error"),
            "blocked_by_waf": html_res.get("blocked_by_waf", False),
        }

    # 3. llms.txt check
    llms_body = (llms_res.get("html") or "").strip()
    llms_is_html_soft_404 = llms_body.lower().startswith(("<!doctype html", "<html")) or "text/html" in (
        llms_res.get("content_type") or ""
    )
    llms_valid = bool(llms_res["ok"] and not llms_is_html_soft_404 and len(llms_body) > 100)
    llms_check = {
        "url": llms_url,
        "found": llms_valid,
        "status_code": llms_res.get("status_code"),
        "length_chars": len(llms_body) if llms_valid else 0,
        "is_soft_404": llms_is_html_soft_404,
    }

    # 4. Deterministic Score & Prioritized Actions
    score = 0
    actions: List[Dict[str, Any]] = []

    # Weight 1: Robots.txt (25 pts)
    blocked_count = len(robots_check["blocked_bots"])
    if blocked_count == 0:
        score += 25
        actions.append({
            "severity": "Passed",
            "title": "AI Crawlers Allowed in robots.txt",
            "detail": "Major AI search & citation bots (OAI-SearchBot, GPTBot, PerplexityBot, ClaudeBot) are not blocked.",
            "fix_snippet": None,
        })
    else:
        score += max(0, 25 - blocked_count * 6)
        actions.append({
            "severity": "Critical",
            "title": f"{blocked_count} AI Crawler(s) Blocked in robots.txt",
            "detail": f"Blocked bots: {', '.join(robots_check['blocked_bots'])}. AI search engines cannot index or cite your site.",
            "fix_snippet": robots_check["robots_txt_fix"],
        })

    # Weight 2: Raw HTML / JS-only trap (25 pts)
    if html_res.get("blocked_by_waf"):
        actions.append({
            "severity": "Warning",
            "title": "Target Site Protected by WAF / Cloudflare",
            "detail": "Automated crawlers received a WAF/Cloudflare challenge. Verify AI bots are allowlisted in your WAF.",
            "fix_snippet": None,
        })
    elif not html_res["ok"]:
        actions.append({
            "severity": "Critical",
            "title": "Homepage Could Not Be Fetched",
            "detail": html_res.get("error") or "Target URL returned a non-200 status.",
            "fix_snippet": None,
        })
    elif html_analysis["is_js_blank_trap"]:
        actions.append({
            "severity": "Critical",
            "title": "Client-Side JS-Only Blank Page Trap",
            "detail": "AI crawlers see a mostly blank page because content relies on client-side JavaScript.",
            "fix_snippet": None,
        })
    elif html_analysis["visible_words"] < 250:
        score += 15
        actions.append({
            "severity": "Warning",
            "title": f"Thin Server-Rendered Content ({html_analysis['visible_words']} words)",
            "detail": "AI parsers prefer rich SSR/static copy (>= 250 visible words) with clear product facts.",
            "fix_snippet": None,
        })
    else:
        score += 25
        actions.append({
            "severity": "Passed",
            "title": f"Strong Server-Rendered HTML ({html_analysis['visible_words']} visible words)",
            "detail": "AI crawlers can read your core copy immediately without executing client-side JavaScript.",
            "fix_snippet": None,
        })

    # Weight 3: llms.txt (15 pts)
    if llms_check["found"]:
        score += 15
        actions.append({
            "severity": "Passed",
            "title": "Valid /llms.txt Endpoint Detected",
            "detail": f"Found {llms_check['length_chars']} chars of clean plain-text/markdown instructions at /llms.txt.",
            "fix_snippet": None,
        })
    else:
        actions.append({
            "severity": "Warning",
            "title": "Missing or Invalid /llms.txt File",
            "detail": "No valid plain-text /llms.txt (> 100 chars) found. Use CiteClash Auto-Fixer to publish one.",
            "fix_snippet": None,
        })

    # Weight 4: JSON-LD Schema (15 pts)
    if html_analysis["detected_schemas"]:
        schema_pts = 15 if len(html_analysis["detected_schemas"]) >= 2 else 10
        score += schema_pts
        actions.append({
            "severity": "Passed" if not html_analysis["missing_schemas"] else "Warning",
            "title": f"JSON-LD Schemas Detected: {', '.join(html_analysis['detected_schemas'])}",
            "detail": (
                f"Missing high-value GEO schemas: {', '.join(html_analysis['missing_schemas'])}"
                if html_analysis["missing_schemas"]
                else "Core Organization, Product/Software, and FAQ schemas are present."
            ),
            "fix_snippet": None,
        })
    else:
        actions.append({
            "severity": "Warning",
            "title": "No Valid JSON-LD Structured Data Found",
            "detail": f"Add structured JSON-LD ({', '.join(HIGH_VALUE_GEO_SCHEMAS)}) so LLMs extract verified entity facts.",
            "fix_snippet": None,
        })

    # Weight 5: Entity & Fact Clarity (20 pts)
    clarity_pts = 0
    if html_analysis["h1"]:
        clarity_pts += 5
    if html_analysis["title"]:
        clarity_pts += 4
    if html_analysis["meta_description"]:
        clarity_pts += 4
    if html_analysis["canonical_url"]:
        clarity_pts += 3
    if html_analysis["table_count"] > 0 or html_analysis["has_pricing_markers"]:
        clarity_pts += 4
    score += clarity_pts

    if clarity_pts < 12:
        actions.append({
            "severity": "Warning",
            "title": "Incomplete Entity & Fact Clarity Signals",
            "detail": "Ensure clear <h1>, <title>, <meta name='description'>, canonical tag, and structured pricing/comparison tables.",
            "fix_snippet": None,
        })
    else:
        actions.append({
            "severity": "Passed",
            "title": "Entity & Fact Clarity Signals Present",
            "detail": f"Title, H1, metadata, and {html_analysis['table_count']} HTML table(s) detected.",
            "fix_snippet": None,
        })

    critical_count = sum(1 for a in actions if a["severity"] == "Critical")
    score = max(0, min(100, score))

    return {
        "target_url": clean_target,
        "readiness_score": score,
        "critical_blockers_count": critical_count,
        "checks": {
            "robots_txt": robots_check,
            "html_analysis": html_analysis,
            "llms_txt": llms_check,
            "actions": actions,
        },
    }
