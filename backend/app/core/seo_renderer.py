import json
import re
from datetime import datetime
from typing import Dict, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.seo import SeoArticle


BOT_USER_AGENTS = [
    "googlebot", "bingbot", "yandexbot", "duckduckbot", "baiduspider",
    "oai-searchbot", "chatgpt-user", "gptbot", "perplexitybot",
    "claudebot", "anthropic-ai", "google-extended", "bytespider",
    "applebot", "facebookexternalhit", "twitterbot", "linkedinbot",
    "slackbot", "whatsapp", "telegrambot"
]

PROGRAMMATIC_SEO_ROUTES: Dict[str, Dict[str, str]] = {
    "/compare": {
        "title": "Compare AI Visibility & GEO Platforms (2026 Directory)",
        "description": "Compare CiteClash against Peec AI, Otterly.AI, Profound, Scrunch AI, AthenaHQ, Ahrefs Brand Radar, Semrush AI, and Rankscale.",
        "priority": "0.9",
        "schema_type": "CollectionPage",
    },
    "/compare/peec-ai": {
        "title": "CiteClash vs Peec AI (2026): Pricing, Closed-Loop Fixes & Traffic Pixel",
        "description": "Honest comparison of CiteClash ($49/mo) vs Peec AI (~€85–$95/mo): closed-loop fix verification, Brand Lie Guard, 1-line AI referral pixel, and viral Battle Cards.",
        "priority": "0.9",
        "schema_type": "SoftwareApplication",
    },
    "/compare/otterly-ai": {
        "title": "CiteClash vs Otterly.AI (2026): Execution vs Passive AI Monitoring",
        "description": "Compare CiteClash vs Otterly.AI across prompt limits, live AI-bot crawlability audits, citation gap outreach, Brand Lie Guard, and AI traffic attribution.",
        "priority": "0.9",
        "schema_type": "SoftwareApplication",
    },
    "/compare/profound": {
        "title": "CiteClash vs Profound (2026): Self-Serve GEO Growth Without Enterprise Bloat",
        "description": "Compare CiteClash ($49–$299/mo self-serve) vs Profound ($99–$499+/mo): instant 15-second Free Battle, Root-Cause Plan-B engine, and 1-line AI traffic pixel.",
        "priority": "0.9",
        "schema_type": "SoftwareApplication",
    },
    "/compare/scrunch-ai": {
        "title": "CiteClash vs Scrunch AI (2026): Affordable Closed-Loop GEO Comparison",
        "description": "Compare CiteClash ($49/mo start) vs Scrunch AI ($250/mo entry) across Battle Cards, Reddit Hijacker, live Page Diff, and Brand Lie Guard.",
        "priority": "0.8",
        "schema_type": "SoftwareApplication",
    },
    "/compare/athenahq": {
        "title": "CiteClash vs AthenaHQ (2026): Predictable Flat Pricing & Fix Verification",
        "description": "Compare CiteClash flat-tier pricing vs AthenaHQ ($295/mo credit-based): verified Fix-to-Impact loop, AI visitor pixel, and white-label PDFs.",
        "priority": "0.8",
        "schema_type": "SoftwareApplication",
    },
    "/compare/ahrefs-brand-radar": {
        "title": "CiteClash vs Ahrefs Brand Radar (2026): Purpose-Built Standalone GEO",
        "description": "Compare CiteClash standalone GEO platform ($49/mo) vs Ahrefs Brand Radar ($199+/mo per index add-on): live crawlability auditor, citation gap pitches, and traffic pixel.",
        "priority": "0.8",
        "schema_type": "SoftwareApplication",
    },
    "/compare/semrush-ai": {
        "title": "CiteClash vs Semrush AI Toolkit (2026): Dedicated AEO & Lie Guard",
        "description": "Compare CiteClash vs Semrush AI Toolkit ($99/mo add-on): 3x Quorum Stability, Ground-Truth Brand Lie Guard, and automated fix verification.",
        "priority": "0.8",
        "schema_type": "SoftwareApplication",
    },
    "/compare/rankscale": {
        "title": "CiteClash vs Rankscale (2026): Closed-Loop Growth vs Credit Tracking",
        "description": "Compare CiteClash vs Rankscale across closed-loop fix verification, AI hallucination protection, ChatGPT/Perplexity referral pixel, and agency PDFs.",
        "priority": "0.8",
        "schema_type": "SoftwareApplication",
    },
    "/alternatives/peec-ai-alternatives": {
        "title": "7 Best Peec AI Alternatives in 2026 — Pricing, Fixes & Traffic Tracking Compared",
        "description": "Objective 2026 guide comparing top Peec AI alternatives: CiteClash, Otterly.AI, Profound, Scrunch AI, AthenaHQ, and Ahrefs Brand Radar.",
        "priority": "0.9",
        "schema_type": "Article",
    },
    "/alternatives/otterly-ai-alternatives": {
        "title": "Best Otterly.AI Alternatives for Growing Startups & Agencies (2026)",
        "description": "Compare the best Otterly.AI alternatives with closed-loop fix verification, citation gap outreach, and AI referral traffic tracking.",
        "priority": "0.9",
        "schema_type": "Article",
    },
    "/alternatives/profound-alternatives": {
        "title": "Best Affordable Profound Alternatives Under $150/mo (2026)",
        "description": "Self-serve Profound alternatives under $150/mo offering AI visibility tracking, hallucination protection, and live technical crawl audits.",
        "priority": "0.9",
        "schema_type": "Article",
    },
    "/best-geo-tools": {
        "title": "Top AI Visibility & GEO Platforms Compared (2026 Buyer Guide)",
        "description": "Complete 2026 buyer guide to Generative Engine Optimization platforms: pricing, fix verification, Brand Lie Guard, and referral attribution.",
        "priority": "0.9",
        "schema_type": "Article",
    },
    "/trackers/chatgpt-rank-tracker": {
        "title": "ChatGPT Rank & Citation Tracker (OAI-SearchBot & Referral Pixel)",
        "description": "Track brand mentions, OAI-SearchBot crawlability, pricing lies, and real chatgpt.com referral signups with CiteClash.",
        "priority": "0.9",
        "schema_type": "WebApplication",
    },
    "/trackers/perplexity-citation-tracker": {
        "title": "Perplexity Citation Tracker & Reddit Gap Finder",
        "description": "Monitor PerplexityBot access, Reddit & editorial citation gaps, page diff tables, and real perplexity.ai referral conversions.",
        "priority": "0.9",
        "schema_type": "WebApplication",
    },
    "/trackers/gemini-visibility-tracker": {
        "title": "Google Gemini & AI Overview Visibility Tracker",
        "description": "Track live Google Search Grounding citations, Google-Extended crawlability, FAQ JSON-LD, and gemini.google.com referrals.",
        "priority": "0.9",
        "schema_type": "WebApplication",
    },
    "/tools/ai-battle-card": {
        "title": "Free AI Battle Card Generator (1200×630 Viral VS PNG)",
        "description": "Run a free 15-second head-to-head AI visibility battle across ChatGPT, Perplexity, and Gemini and export a Retina 1200×630 Battle Card PNG.",
        "priority": "0.9",
        "schema_type": "WebApplication",
    },
    "/tools/llms-txt-generator": {
        "title": "Free llms.txt & FAQ JSON-LD Generator for AI Crawlers",
        "description": "Generate a standardized, crawler-optimized llms.txt and FAQPage JSON-LD schema for ChatGPT, Perplexity, and Claude in 10 seconds.",
        "priority": "0.9",
        "schema_type": "WebApplication",
    },
    "/tools/ai-crawler-checker": {
        "title": "Free Live AI Bot & Crawlability Checker (robots.txt + JS Trap)",
        "description": "Check live whether OAI-SearchBot, GPTBot, PerplexityBot, ClaudeBot, and Google-Extended can crawl your website without JS blank-page traps.",
        "priority": "0.9",
        "schema_type": "WebApplication",
    },
}


def is_search_or_ai_bot(user_agent: str | None) -> bool:
    if not user_agent:
        return False
    ua = user_agent.lower()
    return any(bot in ua for bot in BOT_USER_AGENTS)


def generate_llms_txt() -> str:
    return """# CiteClash
> CiteClash is a Closed-Loop AI Search Visibility & Growth Platform for B2B SaaS and agencies. It combines deterministic multi-engine citation tracking (ChatGPT, Perplexity, Google Gemini Search Grounding, Groq) with Closed-Loop Fix Verification & Root-Cause Plan-B Pivots, an AI Hallucination & Brand Lie Guard, and a privacy-safe 1-Line AI Referral Traffic & Conversion Pixel.

## Core Capabilities
- [AI Battle Card Scanner](https://citeclash.com/tools/ai-battle-card): 15-second head-to-head visibility battle with 1200×630 Retina PNG export.
- [Live AI-Crawlability Auditor](https://citeclash.com/tools/ai-crawler-checker): Deterministic HTTP checks for OAI-SearchBot, GPTBot, PerplexityBot, ClaudeBot, Google-Extended, JS-only SPA traps, /llms.txt, and JSON-LD.
- [True Citation Gap Matrix](https://citeclash.com/citation-gaps): Identifies third-party URLs citing competitors where your brand is absent, with 1-click outreach pitches.
- [Live Competitor Page Diff](https://citeclash.com/page-diff): Side-by-side structural comparison producing copy-paste FAQPage JSON-LD and HTML comparison tables.
- [Closed-Loop Fix Verification & Plan-B Pivot](https://citeclash.com/fix-tracker): Verifies applied fixes live via HTTP, checks Google indexing, and auto-rechecks Day 7/14 impact with 3x Quorum Stability.
- [AI Hallucination & Brand Lie Guard](https://citeclash.com/brand-guard): Flags pricing/feature contradictions against verified Ground Truth facts and generates corrective FAQ kits.
- [1-Line AI Referral Traffic Pixel](https://citeclash.com/ai-traffic): Cookie-free, zero-PII script attributing real ChatGPT, Perplexity, Gemini, and Claude visitors and signups.
- [Reddit & Quora Thread Hijacker](https://citeclash.com/hijacker): Fetches real live discussion threads via Serper.dev / DuckDuckGo and drafts non-promotional technical replies.

## Pricing & Plans
- Free Tier ($0/mo): 1 public scan/day, 2 tracked prompts.
- Starter Tier ($49/mo): 1 workspace, 15 prompts/month, 10 Reddit hijacker credits/month, AI Traffic Pixel & Brand Lie Guard.
- Growth Tier ($129/mo): 1 workspace, 50 prompts/month, all AI engines, 3x Quorum Stability, unlimited Reddit Hijacker & Auto-Fixer.
- Agency Tier ($299/mo): 5 workspaces, 200 prompts/month, white-label client PDF reports.

## Comparisons & Alternatives (vs Peec AI, Otterly.AI, Profound, Scrunch AI, AthenaHQ, Ahrefs Brand Radar)
- [Compare Directory](https://citeclash.com/compare)
- [CiteClash vs Peec AI](https://citeclash.com/compare/peec-ai)
- [CiteClash vs Otterly.AI](https://citeclash.com/compare/otterly-ai)
- [CiteClash vs Profound](https://citeclash.com/compare/profound)
- [CiteClash vs Scrunch AI](https://citeclash.com/compare/scrunch-ai)
- [CiteClash vs AthenaHQ](https://citeclash.com/compare/athenahq)
- [CiteClash vs Ahrefs Brand Radar](https://citeclash.com/compare/ahrefs-brand-radar)
- [Best Peec AI Alternatives (2026)](https://citeclash.com/alternatives/peec-ai-alternatives)
- [Top AI Visibility & GEO Platforms (2026)](https://citeclash.com/best-geo-tools)

## Engine Trackers
- [ChatGPT Rank Tracker](https://citeclash.com/trackers/chatgpt-rank-tracker)
- [Perplexity Citation Tracker](https://citeclash.com/trackers/perplexity-citation-tracker)
- [Gemini Visibility Tracker](https://citeclash.com/trackers/gemini-visibility-tracker)
"""


def generate_llms_full_txt() -> str:
    summary = generate_llms_txt()
    return f"""{summary}

## Technical Architecture & Differentiators

### Closed-Loop Self-Correcting AI Growth System
Unlike passive monitoring dashboards (e.g., Peec AI, Otterly.AI, Rankscale), CiteClash closes the loop from diagnosis to revenue attribution:
1. **3-Tier Hybrid Brand Disambiguation:** Eliminates common-word false positives ("Linear", "Close", "Monday", "Drift") by combining domain/list fast-pass detection with lightweight ungrounded JSON verification.
2. **Gemini Google Search Grounding:** Extracts verified `grounding_chunks` and resolves redirect URIs so citations reflect live web search.
3. **Instant HTTP Verification & Day-7/14 Recheck:** Confirms `/llms.txt`, `FAQPage` JSON-LD, and `robots.txt` are live, checks Google index status, and triggers Root-Cause Diagnosis + Plan-B Pivots when `score_delta <= 0`.
4. **Privacy-Safe AI Referral Pixel (`GET /pixel.js`):** Zero cookies and zero raw IP storage; attributes real conversions from `chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `claude.ai`, and `copilot.microsoft.com`.

### Contact & Support
- Website: https://citeclash.com
- Support: support@citeclash.com
"""


async def generate_sitemap_xml(session: AsyncSession) -> str:
    res = await session.execute(
        select(SeoArticle)
        .where(SeoArticle.is_published.is_(True))
        .order_by(SeoArticle.created_at.desc())
    )
    articles = res.scalars().all()
    now_iso = datetime.utcnow().strftime("%Y-%m-%d")

    static_urls = [
        {"loc": "https://citeclash.com/", "priority": "1.0", "changefreq": "daily"},
        {"loc": "https://citeclash.com/guides", "priority": "0.9", "changefreq": "daily"},
        {"loc": "https://citeclash.com/privacy-policy", "priority": "0.3", "changefreq": "monthly"},
        {"loc": "https://citeclash.com/terms-of-service", "priority": "0.3", "changefreq": "monthly"},
        {"loc": "https://citeclash.com/refund-policy", "priority": "0.3", "changefreq": "monthly"},
        {"loc": "https://citeclash.com/contact", "priority": "0.4", "changefreq": "monthly"},
    ]

    for route_path, meta in PROGRAMMATIC_SEO_ROUTES.items():
        static_urls.append({
            "loc": f"https://citeclash.com{route_path}",
            "priority": meta["priority"],
            "changefreq": "weekly",
        })

    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]

    seen_locs = set()
    for item in static_urls:
        if item["loc"] in seen_locs:
            continue
        seen_locs.add(item["loc"])
        xml_lines.append(f"""  <url>
    <loc>{item['loc']}</loc>
    <lastmod>{now_iso}</lastmod>
    <changefreq>{item['changefreq']}</changefreq>
    <priority>{item['priority']}</priority>
  </url>""")

    for art in articles:
        if art.article_type == "battle":
            url = f"https://citeclash.com/battle/{art.slug}"
        elif art.article_type == "comparison":
            url = f"https://citeclash.com/compare/{art.slug}"
        else:
            url = f"https://citeclash.com/guides/{art.slug}"

        if url in seen_locs:
            continue
        seen_locs.add(url)
        lastmod = art.updated_at.strftime("%Y-%m-%d") if art.updated_at else now_iso
        xml_lines.append(f"""  <url>
    <loc>{url}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>""")

    xml_lines.append("</urlset>")
    return "\n".join(xml_lines)


def _simple_markdown_to_html(md: str) -> str:
    """Lightweight deterministic markdown converter for crawler fallback."""
    lines = md.split("\n")
    html_lines = []
    in_list = False

    for line in lines:
        line_s = line.strip()
        if not line_s:
            if in_list:
                html_lines.append("</ul>")
                in_list = False
            continue

        if line_s.startswith("### "):
            html_lines.append(f"<h3>{line_s[4:]}</h3>")
        elif line_s.startswith("## "):
            html_lines.append(f"<h2>{line_s[3:]}</h2>")
        elif line_s.startswith("# "):
            html_lines.append(f"<h1>{line_s[2:]}</h1>")
        elif line_s.startswith("- ") or line_s.startswith("* "):
            if not in_list:
                html_lines.append("<ul>")
                in_list = True
            html_lines.append(f"<li>{line_s[2:]}</li>")
        elif "|" in line_s and ("---" in line_s or line_s.startswith("|")):
            if "---" in line_s:
                continue
            cells = [c.strip() for c in line_s.split("|") if c.strip()]
            row_html = "".join(f"<td>{c}</td>" for c in cells)
            html_lines.append(f"<tr>{row_html}</tr>")
        else:
            if in_list:
                html_lines.append("</ul>")
                in_list = False
            formatted = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", line_s)
            html_lines.append(f"<p>{formatted}</p>")

    if in_list:
        html_lines.append("</ul>")

    return "\n".join(html_lines)


async def render_crawler_html(path: str, session: AsyncSession) -> Optional[str]:
    """Generates a complete, semantic HTML document for search engine & AI bots."""
    clean_path = "/" + path.strip("/")
    if clean_path == "/tools/geo-readiness-checker":
        clean_path = "/tools/ai-crawler-checker"

    prog_meta = PROGRAMMATIC_SEO_ROUTES.get(clean_path)
    slug = path.strip("/").split("/")[-1]

    art: Optional[SeoArticle] = None
    if not prog_meta and slug and slug not in ["", "guides", "tools", "privacy-policy", "terms-of-service", "refund-policy", "contact"]:
        res = await session.execute(select(SeoArticle).where(SeoArticle.slug == slug))
        art = res.scalar_one_or_none()

    schema_type = "SoftwareApplication"
    if prog_meta:
        title = f"{prog_meta['title']} | CiteClash"
        description = prog_meta["description"]
        canonical = f"https://citeclash.com{clean_path}"
        schema_type = prog_meta["schema_type"]
        answer_box = (
            f'<div style="background:#F7F7F8;border-left:3px solid #111113;padding:16px;margin:20px 0;">'
            f'<strong>Direct Answer Summary:</strong> <p>{description}</p>'
            f'</div>'
        )
        content_html = f"<h1>{prog_meta['title']}</h1><p>{description}</p>"
    elif art:
        title = f"{art.title} | CiteClash"
        description = art.meta_description
        canonical = f"https://citeclash.com/{art.article_type}/{art.slug}"
        schema_type = "Article"
        content_html = _simple_markdown_to_html(art.content_markdown)
        answer_box = (
            f'<div style="background:#F7F7F8;border-left:3px solid #111113;padding:16px;margin:20px 0;">'
            f'<h3>Direct Answer Summary</h3><p>{art.direct_answer_summary}</p></div>'
            if art.direct_answer_summary else ""
        )
    elif clean_path == "/":
        title = "CiteClash — Closed-Loop AI Search Visibility & GEO Growth Platform"
        description = "Monitor and improve AI search citations across ChatGPT, Perplexity, and Google Gemini with Closed-Loop Fix Verification, Brand Lie Guard, and 1-Line AI Referral Traffic Pixel."
        canonical = "https://citeclash.com/"
        answer_box = ""
        content_html = (
            "<h1>CiteClash: Closed-Loop AI Search Visibility &amp; GEO Platform</h1>"
            "<p>Track citations, verify fixes live, catch AI brand lies, and attribute real AI referral signups.</p>"
        )
    elif "guides" in clean_path:
        title = "Generative Engine Optimization (GEO) Knowledge Hub & Guides | CiteClash"
        description = "In-depth research, architectural breakdowns, and playbooks on ranking #1 in ChatGPT, Perplexity, and Google AI Overviews."
        canonical = "https://citeclash.com/guides"
        schema_type = "Article"
        answer_box = ""
        content_html = "<h1>Generative Engine Optimization (GEO) Guides &amp; Knowledge Hub</h1>"
    else:
        return None

    json_ld = {
        "@context": "https://schema.org",
        "@type": schema_type,
        "name": title,
        "headline": title,
        "description": description,
        "url": canonical,
        "publisher": {
            "@type": "Organization",
            "name": "CiteClash",
            "url": "https://citeclash.com",
            "logo": "https://citeclash.com/favicon.svg",
        },
    }
    json_ld_str = json.dumps(json_ld, ensure_ascii=False)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <meta name="description" content="{description}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="{canonical}">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{description}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="CiteClash">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{title}">
  <meta name="twitter:description" content="{description}">
  <script type="application/ld+json">{json_ld_str}</script>
</head>
<body style="font-family:Inter,sans-serif;background:#ffffff;color:#111113;max-width:900px;margin:0 auto;padding:40px 20px;">
  <header><a href="https://citeclash.com">CiteClash</a> | <a href="https://citeclash.com/compare">Compare</a> | <a href="https://citeclash.com/best-geo-tools">Best GEO Tools</a></header>
  <main>{answer_box}{content_html}</main>
  <footer><p>&copy; {datetime.utcnow().year} CiteClash Inc. <a href="https://citeclash.com/llms.txt">llms.txt</a> | <a href="https://citeclash.com/sitemap.xml">sitemap.xml</a></p></footer>
</body>
</html>
"""
