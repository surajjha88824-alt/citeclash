import asyncio
import httpx
from app.core.config import settings
from app.core.database import AsyncSessionLocal, Base, engine
from app.main import app
from app.models.user import User
from app.models.workspace import Workspace
from app.services.email_service import (
    send_welcome_email,
    send_password_reset_email,
    send_support_ticket_reply_email,
    send_weekly_digest_email,
)

async def test_cron_and_emails():
    print(">>> Testing Automated Daily Cron & Transactional Email System...")

    # Ensure tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    import uuid
    uid = str(uuid.uuid4())[:8]
    test_email = f"paid_{uid}@cron-test.com"

    # 1. Seed a paid workspace
    async with AsyncSessionLocal() as session:
        user = User(
            email=test_email,
            full_name="Paid Founder",
            role="user",
            auth_provider="email",
            is_active=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        ws = Workspace(
            owner_id=user.id,
            brand_name="CronTester AI",
            domain_url="https://crontester.ai",
            plan_tier="growth",
            subscription_status="active",
            monthly_prompt_limit=50,
        )
        session.add(ws)
        await session.commit()

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 2. Test unauthorized access to cron
        print("1. Testing unauthorized call to /api/v1/cron/daily-audits...")
        res = await client.post("/api/v1/cron/daily-audits")
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
        print("   [PASS] Cron endpoint correctly blocked (401 Unauthorized)")

        # 3. Test authorized call with CRON_SECRET header
        print("2. Testing authorized call with CRON_SECRET header...")
        headers = {"CRON_SECRET": settings.CRON_SECRET}
        res = await client.post("/api/v1/cron/daily-audits", headers=headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert data["status"] == "success"
        assert data["audits_dispatched_count"] >= 1
        print(f"   [PASS] Daily cron queued {data['audits_dispatched_count']} audits successfully via CRON_SECRET header")

        # 4. Test alias endpoint /api/cron/daily-audits
        print("3. Testing alias /api/cron/daily-audits endpoint...")
        res_alias = await client.post("/api/cron/daily-audits", headers={"X-Cron-Secret": settings.CRON_SECRET})
        assert res_alias.status_code == 200
        print("   [PASS] Alias /api/cron/daily-audits confirmed working")

        # 5. Test Onboarding Step 3 prompt generation
        print("4. Testing Step 3 prompt auto-generation endpoint...")
        res_prompts = await client.post("/api/v1/audits/generate-prompts", json={
            "brand_name": "CiteClash",
            "website_url": "https://citeclash.com",
            "industry": "SaaS & Developer Tools",
            "competitor_domain": "peec.ai",
        })
        assert res_prompts.status_code == 200
        prompts = res_prompts.json().get("prompts", [])
        assert len(prompts) >= 3
        print(f"   [PASS] Generated {len(prompts)} high-intent buyer prompts for onboarding")

        # 6. Test all 4 transactional email functions
        print("5. Testing transactional email service...")
        welc_res = await send_welcome_email("tester@example.com", "Test Founder")
        assert welc_res is True
        print("   [PASS] Welcome email generated and logged")

        reset_res = await send_password_reset_email("tester@example.com", "mock_reset_token_12345")
        assert reset_res is True
        print("   [PASS] Password reset email generated and logged")

        ticket_res = await send_support_ticket_reply_email(
            "tester@example.com",
            "ticket-uuid-777",
            "Billing query regarding Agency plan",
            "We have processed your request.",
        )
        assert ticket_res is True
        print("   [PASS] Support ticket reply email generated and logged")

        dig_res = await send_weekly_digest_email("tester@example.com", "CronTester AI", 88.4, 6.2)
        assert dig_res is True
        print("   [PASS] Weekly digest email generated and logged")

    print("\n>>> All Automated Cron, Onboarding Prompts & Email Tests Passed (100%)! <<<")

if __name__ == "__main__":
    asyncio.run(test_cron_and_emails())
