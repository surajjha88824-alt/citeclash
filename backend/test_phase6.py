import asyncio
import httpx
from app.core.database import AsyncSessionLocal, Base, engine
from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.models.user import User
from app.models.workspace import Workspace

async def run_tests():
    print(">>> Running Phase 6 Backend Test Suite...")

    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Seed test admin & test regular user if not exist
        import uuid
        uid = str(uuid.uuid4())[:8]
        admin_email = f"admin_{uid}@citeclash.com"
        user_email = f"user_{uid}@citeclash.com"

        async with AsyncSessionLocal() as session:
            admin = User(
                email=admin_email,
                password_hash=get_password_hash("AdminPass123!"),
                full_name="Super Admin Tester",
                role="super_admin",
                auth_provider="email",
                is_active=True,
            )
            user = User(
                email=user_email,
                password_hash=get_password_hash("UserPass123!"),
                full_name="Regular User Tester",
                role="user",
                auth_provider="email",
                is_active=True,
            )
            session.add_all([admin, user])
            await session.commit()
            await session.refresh(admin)
            await session.refresh(user)

            ws = Workspace(
                owner_id=user.id,
                brand_name="RegUser Brand",
                domain_url="https://reguser.com",
                plan_tier="free",
                subscription_status="active",
                monthly_prompt_limit=15,
            )
            session.add(ws)
            await session.commit()
            await session.refresh(ws)

            admin_id = admin.id
            user_id = user.id
            ws_id = ws.id

        admin_token = create_access_token(subject=admin_id, role="super_admin")
        user_token = create_access_token(subject=user_id, role="user")

        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        user_headers = {"Authorization": f"Bearer {user_token}"}

        # 1. Standard user forbidden from /admin/kpis
        print("1. Testing role restriction on /admin/kpis...")
        res = await client.get("/api/v1/admin/kpis", headers=user_headers)
        assert res.status_code == 403, f"Expected 403, got {res.status_code}"
        print("   [PASS] Non-admin properly blocked (403 Forbidden)")

        # 2. Super admin access /admin/kpis
        print("2. Testing Super Admin access to /admin/kpis...")
        res = await client.get("/api/v1/admin/kpis", headers=admin_headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        kpis = res.json()
        assert "total_users" in kpis
        assert "estimated_mrr" in kpis
        assert "total_audits_run" in kpis
        print(f"   [PASS] Admin KPIs retrieved: {kpis['total_users']} users, MRR: ${kpis['estimated_mrr']}")

        # 3. Super admin lists users
        print("3. Testing Super Admin /admin/users listing...")
        res = await client.get("/api/v1/admin/users", headers=admin_headers)
        assert res.status_code == 200
        users_list = res.json()
        assert len(users_list) >= 2
        print(f"   [PASS] Admin users listed: {len(users_list)} registered users")

        # 4. Standard user creates a support ticket
        print("4. Testing user ticket creation...")
        ticket_payload = {
            "workspace_id": ws_id,
            "subject": "Need help setting up llms.txt",
            "category": "technical",
            "priority": "medium",
            "message": "Hello support, where should I put the llms.txt on my server?",
        }
        res = await client.post("/api/v1/tickets/", json=ticket_payload, headers=user_headers)
        assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
        ticket_data = res.json()
        ticket_id = ticket_data["id"]
        assert ticket_data["status"] == "open"
        print(f"   [PASS] Support ticket created successfully (ID: {ticket_id})")

        # 5. Super Admin lists global tickets
        print("5. Testing Super Admin /admin/tickets queue...")
        res = await client.get("/api/v1/admin/tickets", headers=admin_headers)
        assert res.status_code == 200
        admin_tickets = res.json()
        found = any(t["id"] == ticket_id for t in admin_tickets)
        assert found, "Created ticket not found in admin queue"
        print("   [PASS] Created ticket visible in admin queue")

        # 6. Super Admin replies to ticket
        print("6. Testing Super Admin reply to ticket...")
        reply_payload = {
            "message": "Hi! You can place llms.txt in the root directory (https://reguser.com/llms.txt).",
            "status": "in_progress",
        }
        res = await client.post(f"/api/v1/admin/tickets/{ticket_id}/reply", json=reply_payload, headers=admin_headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        print("   [PASS] Super Admin posted official reply")

        # 7. User verifies reply in their ticket thread
        print("7. Testing user reading updated ticket thread...")
        res = await client.get(f"/api/v1/tickets/{ticket_id}", headers=user_headers)
        assert res.status_code == 200
        updated_ticket = res.json()
        assert len(updated_ticket["messages"]) == 2
        assert updated_ticket["status"] == "in_progress"
        print(f"   [PASS] User thread updated with {len(updated_ticket['messages'])} messages")

        # 8. Super Admin overrides workspace plan
        print("8. Testing Super Admin plan tier override...")
        override_payload = {"plan_tier": "agency"}
        res = await client.patch(f"/api/v1/admin/workspaces/{ws_id}/plan", json=override_payload, headers=admin_headers)
        assert res.status_code == 200
        override_data = res.json()
        assert override_data["plan_tier"] == "agency"
        assert override_data["monthly_prompt_limit"] == 200
        print("   [PASS] Workspace plan tier upgraded to 'agency' with 200 prompt limit")

    print("\n>>> All Phase 6 Backend Tests Passed (100%)! <<<")

if __name__ == "__main__":
    asyncio.run(run_tests())
