import asyncio
import hashlib
import hmac
import json
import httpx
from app.main import app
from app.core.config import settings

async def test_phase5():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # 1. Signup to get user & token
        signup_payload = {
            "email": f"billing_tester_{hash(asyncio.get_event_loop())}@citeclash.com",
            "password": "UltraSecurePassword2026!",
            "full_name": "Billing Test User"
        }
        res = await client.post("/api/v1/auth/signup", json=signup_payload)
        assert res.status_code == 201
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get workspace
        ws_res = await client.get("/api/v1/workspaces/", headers=headers)
        assert ws_res.status_code == 200
        ws = ws_res.json()["workspaces"][0]
        ws_id = ws["id"]
        print("Workspace created. ID:", ws_id, "Initial Plan Tier:", ws["plan_tier"])

        # 3. Get Subscription details
        sub_res = await client.get(f"/api/v1/billing/subscription/{ws_id}", headers=headers)
        assert sub_res.status_code == 200
        sub_data = sub_res.json()
        print("Subscription verified. Next billing date:", sub_data["next_billing_date"])
        assert sub_data["sandbox_mode"] is True

        # 4. Dev Sandbox Checkout: Upgrade from Free to Starter
        upgrade_res = await client.post(
            "/api/v1/billing/checkout",
            headers=headers,
            json={"workspace_id": ws_id, "target_tier": "starter"}
        )
        assert upgrade_res.status_code == 200
        print("Upgrade result:", upgrade_res.json()["message"])

        # Verify updated workspace plan
        ws_check = await client.get(f"/api/v1/workspaces/{ws_id}", headers=headers)
        assert ws_check.json()["plan_tier"] == "starter"
        print("Workspace plan successfully verified as 'starter'!")

        # 5. Guardrail test: Try adding prompts up to Starter limit (15) + 1 to trigger 402 Payment Required!
        print("Testing plan guardrail enforcement...")
        for i in range(15):
            p_res = await client.post(
                f"/api/v1/workspaces/{ws_id}/prompts",
                headers=headers,
                json={"prompt_text": f"Test prompt intent {i+1}"}
            )
            assert p_res.status_code == 201

        # 16th prompt should be rejected with 402 Payment Required!
        blocked_res = await client.post(
            f"/api/v1/workspaces/{ws_id}/prompts",
            headers=headers,
            json={"prompt_text": "This prompt should exceed limit"}
        )
        print("16th Prompt response code:", blocked_res.status_code)
        assert blocked_res.status_code == 402
        blocked_data = blocked_res.json()
        print("402 Response detail:", blocked_data["error"]["code"], "-", blocked_data["error"]["message"])
        assert blocked_data["error"]["code"] == "PLAN_LIMIT_EXCEEDED"
        assert blocked_data["error"]["details"]["required_tier"] == "growth"

        # 6. Test Webhook Handler with HMAC signature: simulate Lemon Squeezy subscription.updated to 'growth'
        webhook_payload = {
            "meta": {
                "event_name": "subscription.updated",
                "custom_data": {"workspace_id": ws_id}
            },
            "data": {
                "attributes": {
                    "product_name": "CiteClash Growth Plan"
                }
            }
        }
        raw_body = json.dumps(webhook_payload).encode("utf-8")
        signature = hmac.new(
            settings.BILLING_WEBHOOK_SECRET.encode("utf-8"),
            raw_body,
            hashlib.sha256
        ).hexdigest()

        wh_res = await client.post(
            "/api/v1/webhooks/billing",
            content=raw_body,
            headers={"X-Signature": signature, "Content-Type": "application/json"}
        )
        assert wh_res.status_code == 200
        wh_data = wh_res.json()
        print("Webhook processed successfully:", wh_data["event"], "New Tier:", wh_data["plan_tier"])
        assert wh_data["plan_tier"] == "growth"

        print("\n>>> Phase 5 Billing, Guardrails & Webhook Tests PASSED 100%! <<<")

if __name__ == "__main__":
    asyncio.run(test_phase5())
