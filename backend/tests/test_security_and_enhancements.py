import hashlib
import hmac
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.core.config import Settings, settings
from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.main import app
from app.models.audit import AuditRun
from app.models.user import User
from app.models.workspace import Workspace


@pytest.mark.asyncio
async def test_security_idor_killswitch_plan_limits_and_roi_enhancements(tmp_path):
    db_path = tmp_path / "test_sec.db"
    test_engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}")
    TestSession = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSession() as session:
        user_a = User(id="user-a", email="a@example.com", password_hash="x", full_name="User A", role="user", auth_provider="email")
        user_b = User(id="user-b", email="b@example.com", password_hash="x", full_name="User B", role="user", auth_provider="email")
        ws_a_free = Workspace(
            id="ws-a",
            owner_id="user-a",
            brand_name="AlphaApp",
            domain_url="alphaapp.io",
            industry="Project Management",
            plan_tier="free",
            subscription_status="active",
        )
        ws_b_growth = Workspace(
            id="ws-b",
            owner_id="user-b",
            brand_name="BetaApp",
            domain_url="betaapp.io",
            industry="Analytics",
            plan_tier="growth",
            subscription_status="active",
        )
        now = datetime.now(timezone.utc)
        audit_1 = AuditRun(
            id="aud-b-1",
            workspace_id="ws-b",
            competitor_domain="rival.io",
            status="completed",
            overall_visibility_score=60.0,
            competitor_score=45.0,
            created_at=now - timedelta(days=1),
        )
        audit_2 = AuditRun(
            id="aud-b-2",
            workspace_id="ws-b",
            competitor_domain="rival.io",
            status="completed",
            overall_visibility_score=72.0,
            competitor_score=55.0,
            created_at=now,
        )
        session.add_all([user_a, user_b, ws_a_free, ws_b_growth, audit_1, audit_2])
        await session.commit()

    async def override_get_db():
        async with TestSession() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    token_a = create_access_token(subject="user-a", role="user")
    token_b = create_access_token(subject="user-b", role="user")
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    try:
        client = TestClient(app)

        # 1. IDOR check: User A cannot access User B's workspace
        idor_resp = client.get("/api/v1/workspaces/ws-b/roi-summary", headers=headers_a)
        assert idor_resp.status_code in (403, 404)

        # 2. Server-side 402 PLAN_LIMIT_EXCEEDED on Free workspace for paid features
        paid_block_resp = client.post(
            "/api/v1/workspaces/ws-a/page-diff",
            json={"user_url": "https://alphaapp.io", "competitor_url": "https://rival.io"},
            headers=headers_a,
        )
        assert paid_block_resp.status_code == 402
        body_402 = paid_block_resp.json()
        assert body_402.get("code") == "PLAN_LIMIT_EXCEEDED"
        assert body_402.get("required_plan") == "starter"

        # 3. Production Kill-Switch forces BILLING_DEV_SANDBOX_MODE = False
        prod_settings = Settings(ENVIRONMENT="production", BILLING_DEV_SANDBOX_MODE=True)
        assert prod_settings.BILLING_DEV_SANDBOX_MODE is False

        with patch.object(settings, "ENVIRONMENT", "production"):
            kill_resp = client.post(
                "/api/v1/billing/sandbox-upgrade",
                json={"workspace_id": "ws-a", "target_tier": "growth", "billing_cycle": "monthly"},
                headers=headers_a,
            )
            assert kill_resp.status_code == 403

        # 4. Webhook signature verification + auto-downgrade on cancellation
        bad_wh = client.post(
            "/api/v1/webhooks/billing",
            content=json.dumps({"event": "subscription.cancelled", "workspace_id": "ws-b"}),
        )
        assert bad_wh.status_code == 401

        wh_payload = json.dumps({"event": "subscription.cancelled", "workspace_id": "ws-b"}).encode("utf-8")
        valid_sig = hmac.new(
            settings.BILLING_WEBHOOK_SECRET.encode("utf-8"),
            wh_payload,
            hashlib.sha256,
        ).hexdigest()
        ok_wh = client.post(
            "/api/v1/webhooks/billing",
            content=wh_payload,
            headers={"X-Signature": valid_sig},
        )
        assert ok_wh.status_code == 200
        assert ok_wh.json()["plan_tier"] == "free"

        # 5. Prompt Suggester & ROI Summary return structured data
        with patch("app.services.roi_enhancements.safe_fetch_url", new=AsyncMock(return_value={"ok": False})), \
             patch("app.services.roi_enhancements.run_structured_json_completion", new=AsyncMock(return_value=None)):
            sug_resp = client.post(
                "/api/v1/workspaces/ws-b/prompts/suggest",
                json={"competitors": ["rival.io"]},
                headers=headers_b,
            )
            assert sug_resp.status_code == 200
            groups = sug_resp.json()["groups"]
            assert len(groups) == 4
            total_prompts = sum(len(g["prompts"]) for g in groups)
            assert 8 <= total_prompts <= 12

        roi_resp = client.get("/api/v1/workspaces/ws-b/roi-summary?days=30", headers=headers_b)
        assert roi_resp.status_code == 200
        roi_data = roi_resp.json()
        assert roi_data["brand_name"] == "BetaApp"
        assert "executive_summary_text" in roi_data
        assert len(roi_data["competitor_movements"]) >= 1
    finally:
        app.dependency_overrides.clear()
        await test_engine.dispose()
