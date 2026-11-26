import os
import sys

import pytest

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.services.citation_gap_service import compute_citation_gaps_from_rows
from app.services.crawl_auditor import (
    analyze_html_for_ai_crawlers,
    parse_robots_txt_for_ai_bots,
)
from app.services.safe_fetcher import safe_fetch_url, validate_url_ssrf


# ==============================================================================
# 1. SSRF Guard Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_ssrf_guard_blocks_private_loopback_and_metadata_ips():
    for bad_url in (
        "http://127.0.0.1:8000",
        "http://169.254.169.254/latest/meta-data/",
        "http://10.0.0.5",
        "file:///etc/passwd",
    ):
        is_safe, err = await validate_url_ssrf(bad_url)
        assert is_safe is False, f"Expected {bad_url} to be blocked"
        assert err

    fetch_res = await safe_fetch_url("http://169.254.169.254/latest/meta-data/")
    assert fetch_res["ok"] is False
    assert fetch_res["status_code"] is None
    assert "Blocked" in (fetch_res["error"] or "")


# ==============================================================================
# 2. robots.txt AI Crawler Parser Tests
# ==============================================================================

def test_robots_txt_parser_flags_blocked_gptbot_and_oai_searchbot():
    robots_txt = """
User-agent: GPTBot
Disallow: /

User-agent: OAI-SearchBot
Disallow: /

User-agent: PerplexityBot
Allow: /

User-agent: *
Allow: /
"""
    res = parse_robots_txt_for_ai_bots(robots_txt)
    assert res["found"] is True
    assert res["bots"]["GPTBot"] == "blocked"
    assert res["bots"]["OAI-SearchBot"] == "blocked"
    assert res["bots"]["PerplexityBot"] == "allowed"
    assert res["bots"]["ClaudeBot"] == "not_specified"
    assert set(res["blocked_bots"]) == {"OAI-SearchBot", "GPTBot"}
    assert "User-agent: GPTBot" in (res["robots_txt_fix"] or "")
    assert "User-agent: OAI-SearchBot" in (res["robots_txt_fix"] or "")


# ==============================================================================
# 3. JS-Only Blank SPA HTML Trap Tests
# ==============================================================================

def test_js_only_blank_spa_html_triggers_critical_blocker():
    spa_html = """<!doctype html>
<html>
  <head><title>My SPA</title></head>
  <body>
    <div id="root"></div>
    <script src="/assets/index.js"></script>
  </body>
</html>"""
    analysis = analyze_html_for_ai_crawlers(spa_html)
    assert analysis["has_empty_spa_mount"] is True
    assert analysis["visible_words"] < 120
    assert analysis["is_js_blank_trap"] is True


# ==============================================================================
# 4. Citation Gap Set-Difference Tests
# ==============================================================================

def test_citation_gap_set_difference_excludes_user_cited_urls():
    rows = [
        # Row 1: User IS cited on reddit.com/r/SaaS/comments/abc/
        {
            "brand_mentioned": True,
            "competitor_mentioned": True,
            "engine_name": "Perplexity AI",
            "competitor_domain": "firebase.google.com",
            "cited_urls_json": [
                {"url": "https://www.reddit.com/r/SaaS/comments/abc/", "domain": "reddit.com", "title": "SaaS DB"},
                {"url": "https://supabase.com/docs", "domain": "supabase.com", "title": "Supabase Docs"},
            ],
        },
        # Row 2: Competitor mentioned, User NOT mentioned -> g2.com and techcrunch.com are gaps,
        # while reddit.com/r/SaaS/comments/abc/ must be excluded because user was already cited in Row 1,
        # and supabase.com must be excluded as user's own domain.
        {
            "brand_mentioned": False,
            "competitor_mentioned": True,
            "engine_name": "Google AI Overview (Gemini)",
            "competitor_domain": "firebase.google.com",
            "cited_urls_json": [
                {"url": "https://www.reddit.com/r/SaaS/comments/abc/", "domain": "reddit.com", "title": "SaaS DB"},
                {"url": "https://www.g2.com/products/firebase/reviews", "domain": "g2.com", "title": "G2 Reviews"},
                {"url": "https://techcrunch.com/best-baas-2026", "domain": "techcrunch.com", "title": "Best BaaS"},
                {"url": "https://supabase.com/blog", "domain": "supabase.com", "title": "Supabase Blog"},
            ],
        },
    ]

    gaps = compute_citation_gaps_from_rows(
        rows=rows,
        brand_domain="supabase.com",
        workspace_id="ws-1",
    )
    gap_domains = [g["domain"] for g in gaps]
    assert "g2.com" in gap_domains
    assert "techcrunch.com" in gap_domains
    assert "reddit.com" not in gap_domains
    assert "supabase.com" not in gap_domains

    g2_item = next(g for g in gaps if g["domain"] == "g2.com")
    assert g2_item["source_category"] == "Review Directory"
    tc_item = next(g for g in gaps if g["domain"] == "techcrunch.com")
    assert tc_item["source_category"] == "Editorial / Listicle"
