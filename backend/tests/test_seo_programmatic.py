import os
import sys
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.core.database import Base
from app.core.seo_renderer import generate_llms_txt, generate_sitemap_xml
from app.main import app


def test_public_crawl_check_ssrf_and_rate_limit():
    client = TestClient(app)

    # 1. SSRF rejection on loopback & cloud metadata IP
    for bad_target in ("http://127.0.0.1:8000", "http://169.254.169.254/latest/meta-data/"):
        resp = client.post("/api/public/crawl-check", json={"domain_or_url": bad_target})
        assert resp.status_code in (400, 429)
        if resp.status_code == 400:
            detail = resp.json().get("detail") or resp.json().get("error", {}).get("message", "")
            assert "Blocked" in detail

    # 2. Verify rate limit (5/hour) triggers 429 after 5 requests from same IP
    with patch("app.api.public_tools.validate_url_ssrf", new=AsyncMock(return_value=(True, None))), \
         patch("app.api.public_tools.run_live_crawl_audit", new=AsyncMock(return_value={
             "target_url": "https://example.com",
             "readiness_score": 85,
             "critical_blockers_count": 0,
             "checks": {"robots_txt": {"bots": {}}, "html_analysis": {"is_js_blank_trap": False, "visible_words": 300}, "llms_txt": {"found": True, "length_chars": 250}, "actions": []},
         })):
        statuses = [
            client.post("/api/public/crawl-check", json={"domain_or_url": "https://example.com"}).status_code
            for _ in range(6)
        ]
        assert 429 in statuses


@pytest.mark.asyncio
async def test_sitemap_and_llms_txt_contain_programmatic_urls(tmp_path):
    db_path = tmp_path / "test_seo.db"
    test_engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}")
    TestSession = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSession() as session:
        xml = await generate_sitemap_xml(session)
        for expected_url in (
            "https://citeclash.com/compare",
            "https://citeclash.com/compare/peec-ai",
            "https://citeclash.com/alternatives/peec-ai-alternatives",
            "https://citeclash.com/best-geo-tools",
            "https://citeclash.com/trackers/chatgpt-rank-tracker",
            "https://citeclash.com/tools/ai-crawler-checker",
        ):
            assert expected_url in xml

    llms_text = generate_llms_txt()
    assert "Closed-Loop Fix Verification" in llms_text
    assert "Brand Lie Guard" in llms_text
    assert "AI Referral Traffic" in llms_text
    assert "Peec AI" in llms_text

    client = TestClient(app)
    llms_resp = client.get("/llms.txt")
    assert llms_resp.status_code == 200
    assert "Closed-Loop Fix Verification" in llms_resp.text

    await test_engine.dispose()
