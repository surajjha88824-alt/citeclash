import asyncio
import httpx
from app.main import app
from app.core.database import Base, engine

async def test_foundation():
    # Initialize schema
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # 1. Health check
        res = await client.get("/api/v1/health")
        print("Health status code:", res.status_code)
        print("Health response:", res.json())
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"

        # 2. Signup
        signup_payload = {
            "email": "founder@citeclash.com",
            "password": "UltraSecurePassword2026!",
            "full_name": "Alex Vance"
        }
        res = await client.post("/api/v1/auth/signup", json=signup_payload)
        print("Signup status code:", res.status_code)
        assert res.status_code == 201
        data = res.json()
        token = data["access_token"]
        refresh_token = data["refresh_token"]
        user_id = data["user"]["id"]
        print("Signup successful. User ID:", user_id)

        # 3. Workspaces - Check automatically created workspace
        headers = {"Authorization": f"Bearer {token}"}
        res = await client.get("/api/v1/workspaces/", headers=headers)
        assert res.status_code == 200
        workspaces = res.json()["workspaces"]
        assert len(workspaces) >= 1
        ws_id = workspaces[0]["id"]
        print("Initial Workspace detected:", workspaces[0]["brand_name"], "ID:", ws_id)

        # 4. Add tracked prompt
        prompt_res = await client.post(
            f"/api/v1/workspaces/{ws_id}/prompts",
            headers=headers,
            json={"prompt_text": "Best AI Search optimization tool for SaaS"}
        )
        assert prompt_res.status_code == 201
        prompt_id = prompt_res.json()["id"]
        print("Prompt added successfully:", prompt_id)

        # 5. Run audit against competitor
        audit_res = await client.post(
            f"/api/v1/workspaces/{ws_id}/audits",
            headers=headers,
            json={"competitor_domain": "competitorai.com"}
        )
        assert audit_res.status_code == 201
        audit_data = audit_res.json()
        print("Audit run created. Status:", audit_data["status"], "Visibility Score:", audit_data["overall_visibility_score"])
        assert len(audit_data["citations"]) >= 1

        # 6. Strict ownership test: another user should NOT be able to access this workspace
        signup2_payload = {
            "email": "other@user.com",
            "password": "AnotherSecurePassword123!",
            "full_name": "Other User"
        }
        res2 = await client.post("/api/v1/auth/signup", json=signup2_payload)
        token2 = res2.json()["access_token"]
        headers2 = {"Authorization": f"Bearer {token2}"}

        # Try to access ws_id with user 2
        forbidden_res = await client.get(f"/api/v1/workspaces/{ws_id}", headers=headers2)
        print("Strict ownership test (user 2 accessing user 1 workspace):", forbidden_res.status_code, forbidden_res.json())
        assert forbidden_res.status_code == 403

        # 7. Support tickets test
        ticket_payload = {
            "workspace_id": ws_id,
            "subject": "Question about Perplexity citation depth",
            "category": "technical",
            "priority": "high",
            "message": "Does the engine crawl daily or weekly?"
        }
        ticket_res = await client.post("/api/v1/tickets/", headers=headers, json=ticket_payload)
        assert ticket_res.status_code == 201
        ticket_id = ticket_res.json()["id"]
        print("Support ticket created:", ticket_id, "Subject:", ticket_res.json()["subject"])

        print("\n=======================================================")
        print(" ALL BACKEND FOUNDATION TESTS PASSED WITH ZERO BUGS! ")
        print("=======================================================\n")

if __name__ == "__main__":
    asyncio.run(test_foundation())
