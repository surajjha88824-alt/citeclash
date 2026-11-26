import json
import os
import sys
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.core.database import Base, get_db
from app.main import app
from app.models.audit import AuditRun
from app.models.citation import CitationSource
from app.models.closed_loop import AiReferralVisit, AppliedFix, BrandGroundTruth
from app.models.user import User
from app.models.workspace import Workspace
from app.services.brand_lie_detector import scan_audit_for_brand_lies
from app.services.fix_loop_service import (
    evaluate_instant_verification,
    evaluate_recheck_outcome,
)


# ==============================================================================
# 1. Applied Fixes Instant Verification Tests
# ==============================================================================

def test_instant_verification_catches_invalid_jsonld_and_approves_valid_llms_txt():
    bad_html = """<html><head>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question", "name": "Pricing?"}
  ],
}
</script>
</head><body>Hello</body></html>"""

    fail_res = evaluate_instant_verification(
        fix_type="faq_schema",
        target_url="https://example.com",
        fetch_res={"ok": True, "status_code": 200, "html": bad_html, "content_type": "text/html"},
    )
    assert fail_res["passed"] is False
    assert fail_res["status"] == "verify_failed"
    assert "Invalid JSON" in fail_res["message"]

    valid_llms = "# CiteClash\n\n> Authoritative AI Search & GEO platform for B2B SaaS.\n\n## Core Docs\n- https://example.com/docs\n- https://example.com/pricing\n"
    pass_res = evaluate_instant_verification(
        fix_type="llms_txt",
        target_url="https://example.com/llms.txt",
        fetch_res={"ok": True, "status_code": 200, "html": valid_llms, "content_type": "text/plain"},
    )
    assert pass_res["passed"] is True
    assert pass_res["status"] == "verified_live"


# ==============================================================================
# 2. Stalled Fix -> Root-Cause Plan-B vs Verified Win Tests
# ==============================================================================

def test_recheck_outcome_stalled_triggers_plan_b_and_positive_sets_won():
    now = datetime.now(timezone.utc)

    stalled_fix = AppliedFix(
        workspace_id="ws-test",
        fix_type="llms_txt",
        title="Published llms.txt",
        target_url="https://example.com/llms.txt",
        baseline_visibility_score=40.0,
        status="verified_live",
        recheck_due_at=now,
    )
    evaluate_recheck_outcome(
        fix=stalled_fix,
        current_visibility_score=38.0,  # delta = -2.0 <= 0
        is_indexed=False,
        has_open_lie_alert=False,
        citation_gaps_count=5,
    )
    assert stalled_fix.status == "stalled_pivoted"
    assert stalled_fix.diagnosis_code == "not_indexed"
    assert stalled_fix.plan_b_json is not None
    assert "Request Indexing" in " ".join(stalled_fix.plan_b_json["pivot_steps"])

    winning_fix = AppliedFix(
        workspace_id="ws-test",
        fix_type="faq_schema",
        title="Added FAQPage Schema",
        target_url="https://example.com",
        baseline_visibility_score=40.0,
        status="indexed",
        recheck_due_at=now,
    )
    evaluate_recheck_outcome(
        fix=winning_fix,
        current_visibility_score=55.0,  # delta = +15.0 >= 5.0
        is_indexed=True,
        has_open_lie_alert=False,
        citation_gaps_count=1,
    )
    assert winning_fix.status == "won"
    assert winning_fix.score_delta == 15.0
    assert winning_fix.plan_b_json is None


# ==============================================================================
# 3. Pixel Ingest Endpoint (/api/track/visit) Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_pixel_track_visit_accepts_text_plain_cors_and_rejects_invalid_key(tmp_path):
    db_path = tmp_path / "test_pixel.db"
    test_engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}")
    TestSession = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSession() as session:
        user = User(id="u-1", email="px@example.com", password_hash="x", full_name="PX", role="user", auth_provider="email")
        ws = Workspace(
            id="ws-px",
            owner_id="u-1",
            brand_name="PixelBrand",
            domain_url="pixelbrand.com",
            pixel_key="cc_px_valid_test_key",
        )
        session.add_all([user, ws])
        await session.commit()

    async def override_get_db():
        async with TestSession() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    try:
        client = TestClient(app)
        # Valid text/plain sendBeacon payload
        resp = client.post(
            "/api/track/visit",
            content=json.dumps({
                "pixel_key": "cc_px_valid_test_key",
                "referrer_domain": "https://www.perplexity.ai/search/best-tools",
                "landing_path": "/pricing",
                "event_type": "pageview",
            }),
            headers={"Content-Type": "text/plain"},
        )
        assert resp.status_code == 204
        assert resp.headers.get("access-control-allow-origin") == "*"

        # Invalid pixel_key -> 404
        bad_resp = client.post(
            "/api/track/visit",
            content=json.dumps({
                "pixel_key": "cc_px_does_not_exist",
                "referrer_domain": "chatgpt.com",
                "landing_path": "/",
                "event_type": "pageview",
            }),
            headers={"Content-Type": "text/plain"},
        )
        assert bad_resp.status_code == 404

        # Verify DB stored perplexity and zero raw IP columns
        async with TestSession() as session:
            from sqlalchemy import select
            visits = (await session.execute(select(AiReferralVisit))).scalars().all()
            assert len(visits) == 1
            assert visits[0].ai_source == "perplexity"
            assert visits[0].landing_path == "/pricing"
            assert not hasattr(visits[0], "ip_address")
    finally:
        app.dependency_overrides.clear()
        await test_engine.dispose()


# ==============================================================================
# 4. Brand Lie Detector Pricing Contradiction Test
# ==============================================================================

@pytest.mark.asyncio
async def test_brand_lie_detector_flags_pricing_contradiction(tmp_path):
    db_path = tmp_path / "test_lies.db"
    test_engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}")
    TestSession = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSession() as session:
        user = User(id="u-2", email="lie@example.com", password_hash="x", full_name="Lie", role="user", auth_provider="email")
        ws = Workspace(id="ws-lie", owner_id="u-2", brand_name="Acme", domain_url="acme.io")
        audit = AuditRun(id="aud-1", workspace_id="ws-lie", competitor_domain="rival.io", status="completed")
        gt = BrandGroundTruth(
            id="gt-1",
            workspace_id="ws-lie",
            category="pricing",
            fact_statement="Starter plan costs $49/month, not $99",
            is_active=True,
        )
        cit = CitationSource(
            id="cit-1",
            audit_run_id="aud-1",
            engine_name="ChatGPT (Search)",
            prompt_text="How much does Acme cost?",
            brand_mentioned=True,
            brand_rank=1,
            competitor_mentioned=False,
            sentiment="neutral",
            cited_urls_json=[{"url": "https://oldblog.example.com/acme-review", "domain": "oldblog.example.com"}],
            raw_response="Acme is a great tool, and its Starter plan costs $99/month.",
        )
        session.add_all([user, ws, audit, gt, cit])
        await session.commit()

        alerts = await scan_audit_for_brand_lies(
            workspace_id="ws-lie",
            audit_run_id="aud-1",
            citations=[cit],
            db=session,
        )
        assert len(alerts) == 1
        assert alerts[0].severity == "critical"
        assert "$99" in alerts[0].ai_false_claim
        assert alerts[0].suspected_source_url == "https://oldblog.example.com/acme-review"

    await test_engine.dispose()
