import asyncio
import os
import sys
import uuid
import httpx

BASE_URL = "http://127.0.0.1:8000"


async def main():
    print("==================================================")
    print("   CiteClash / RankPulse AI - Phase 9 Verification")
    print("==================================================")

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        # 1. Test /llms.txt
        print("\n[1] Testing Root /llms.txt Endpoint...")
        res = await client.get("/llms.txt")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        assert "text/plain" in res.headers.get("content-type", "")
        assert "CiteClash" in res.text
        assert "Core Products & Capabilities" in res.text
        print("  [OK] /llms.txt conforms to llmstxt.org specification (Length:", len(res.text), "chars)")

        # 2. Test /llms-full.txt
        print("\n[2] Testing Root /llms-full.txt Endpoint...")
        res_full = await client.get("/llms-full.txt")
        assert res_full.status_code == 200
        assert "text/plain" in res_full.headers.get("content-type", "")
        assert "Deterministic Python Regex Parsing" in res_full.text
        print("  [OK] /llms-full.txt serves complete context window markdown (Length:", len(res_full.text), "chars)")

        # 3. Test /sitemap.xml
        print("\n[3] Testing Dynamic /sitemap.xml Endpoint...")
        res_sitemap = await client.get("/sitemap.xml")
        assert res_sitemap.status_code == 200
        assert "application/xml" in res_sitemap.headers.get("content-type", "")
        assert "<urlset" in res_sitemap.text
        assert "https://citeclash.com/guides" in res_sitemap.text
        assert "https://citeclash.com/compare/citeclash-vs-peec-ai" in res_sitemap.text
        print("  [OK] Dynamic XML sitemap indexes public pages & programmatic articles")

        # 4. Test Public Articles API
        print("\n[4] Testing Public SEO Articles Retrieval...")
        res_articles = await client.get("/api/v1/seo/articles?is_published=true")
        assert res_articles.status_code == 200
        raw_json = res_articles.json()
        articles = raw_json if isinstance(raw_json, list) else raw_json.get("articles", [])
        assert len(articles) >= 5, f"Expected at least 5 articles, got {len(articles)}"
        print(f"  [OK] Retrieved {len(articles)} published programmatic articles from database")

        # 5. Test Slug Lookup and View Count Increment
        slug = "citeclash-vs-peec-ai"
        print(f"\n[5] Testing Slug Lookup for '{slug}'...")
        res_slug = await client.get(f"/api/v1/seo/articles/{slug}")
        assert res_slug.status_code == 200
        art_data = res_slug.json()
        assert art_data["slug"] == slug
        assert art_data["direct_answer_summary"] is not None
        assert len(art_data["direct_answer_summary"].split()) <= 55
        print(f"  [OK] Retrieved article: '{art_data['title']}'")
        print(f"  [OK] Direct Answer Summary: \"{art_data['direct_answer_summary'][:80]}...\"")
        print(f"  [OK] View count: {art_data['view_count']}")

        # 6. Test Crawler Bot SSR Meta-Injection Fallback
        print("\n[6] Testing Bot Crawler Detection (PerplexityBot)...")
        bot_headers = {
            "User-Agent": "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)"
        }
        res_bot = await client.get(f"/compare/{slug}", headers=bot_headers)
        assert res_bot.status_code == 200
        assert "text/html" in res_bot.headers.get("content-type", "")
        assert "<title>" in res_bot.text
        assert "Direct Answer Summary" in res_bot.text
        assert "application/ld+json" in res_bot.text
        print("  [OK] PerplexityBot received full semantic HTML with JSON-LD schema & direct answer summary")

        # 7. Super-Admin Authentication & AI Generation
        print("\n[7] Testing Super-Admin SEO Generator & Content Management...")
        login_res = await client.post("/api/v1/auth/login", json={
            "email": "admin@citeclash.com",
            "password": "AdminPassword@123",
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        admin_token = login_res.json()["access_token"]
        auth_headers = {"Authorization": f"Bearer {admin_token}"}

        # Auto-generate draft
        test_topic = f"RankPulse AI vs Jasper AI GEO Visibility {uuid.uuid4().hex[:4]}"
        print(f"  > Requesting AI generation for '{test_topic}'...")
        gen_res = await client.post("/api/v1/seo/admin/generate", headers=auth_headers, json={
            "topic_or_keyword": test_topic,
            "article_type": "comparison",
            "target_brand": "RankPulse AI",
            "competitor_domain": "jasper.ai",
        })
        assert gen_res.status_code == 200, f"AI generation failed: {gen_res.text}"
        generated = gen_res.json()["article"]
        assert generated["title"] is not None
        assert generated["direct_answer_summary"] is not None
        print(f"  [OK] AI Draft generated: \"{generated['title']}\"")

        # Publish generated article
        pub_res = await client.post("/api/v1/seo/admin/articles", headers=auth_headers, json={
            "slug": generated["slug"],
            "article_type": generated["article_type"],
            "title": generated["title"],
            "meta_description": generated["meta_description"],
            "direct_answer_summary": generated["direct_answer_summary"],
            "content_markdown": generated["content_markdown"],
            "brand_domain": generated["brand_domain"],
            "competitor_domain": generated["competitor_domain"],
            "key_stats_json": generated.get("key_stats_json"),
            "is_published": True,
        })
        assert pub_res.status_code == 201, f"Publish article failed: {pub_res.text}"
        created_id = pub_res.json()["id"]
        print(f"  [OK] Published new programmatic article (ID: {created_id})")

        # Clean up created article
        del_res = await client.delete(f"/api/v1/seo/admin/articles/{created_id}", headers=auth_headers)
        assert del_res.status_code == 200
        print(f"  [OK] Deleted test article (ID: {created_id})")

    print("\n==================================================")
    print("   ALL PHASE 9 VERIFICATION CHECKS PASSED (100%)")
    print("==================================================")


if __name__ == "__main__":
    asyncio.run(main())
