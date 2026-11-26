import asyncio
import httpx
import uuid
from app.core.database import AsyncSessionLocal, Base, engine
from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.models.user import User

async def test_phase8():
    print(">>> Testing Phase 8: Onboarding Progress & Checklist APIs...")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    uid = str(uuid.uuid4())[:8]
    test_email = f"checklist_{uid}@citeclash.com"

    async with AsyncSessionLocal() as session:
        user = User(
            email=test_email,
            password_hash=get_password_hash("ChecklistPass123!"),
            full_name="Checklist User",
            role="user",
            auth_provider="email",
            is_active=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

    token = create_access_token(subject=user_id, role="user")
    headers = {"Authorization": f"Bearer {token}"}

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Test GET /onboarding/progress (initial auto-provision)
        print("1. Testing GET /api/v1/onboarding/progress...")
        res = await client.get("/api/v1/onboarding/progress", headers=headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert data["step_1_brand"] is True
        assert data["completed_count"] >= 1
        assert "percentage_complete" in data
        print(f"   [PASS] Initial progress: {data['completed_count']}/5 steps ({data['percentage_complete']}%)")

        # 2. Test PATCH /onboarding/progress (mark reddit & autofix completed)
        print("2. Testing PATCH /api/v1/onboarding/progress...")
        patch_payload = {
            "step_2_audit": True,
            "step_3_reddit": True,
            "step_4_autofix": True,
        }
        res = await client.patch("/api/v1/onboarding/progress", json=patch_payload, headers=headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        updated = res.json()
        assert updated["step_2_audit"] is True
        assert updated["step_3_reddit"] is True
        assert updated["step_4_autofix"] is True
        assert updated["completed_count"] == 4
        assert updated["percentage_complete"] == 80
        print(f"   [PASS] Updated progress: {updated['completed_count']}/5 steps ({updated['percentage_complete']}%)")

    print("\n>>> All Phase 8 Backend Checklist Tests Passed (100%)! <<<")

if __name__ == "__main__":
    asyncio.run(test_phase8())
