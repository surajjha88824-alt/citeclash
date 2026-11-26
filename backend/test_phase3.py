import asyncio
import time
import httpx
from app.main import app

async def test_phase3():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # 1. Trigger Audit Run
        t0 = time.time()
        payload = {
            "brand_domain": "supabase.com",
            "competitor_domain": "firebase.google.com",
            "industry": "SaaS & Developer Tools"
        }
        res = await client.post("/api/v1/audits/run", json=payload)
        elapsed = time.time() - t0
        print(f"Trigger response code: {res.status_code} in {elapsed*1000:.1f}ms")
        assert res.status_code == 202
        data = res.json()
        assert data["status"] == "queued"
        audit_id = data["audit_run_id"]
        print("Audit Run ID:", audit_id)

        # 2. Poll until completed
        completed = False
        for attempt in range(10):
            await asyncio.sleep(0.5)
            poll_res = await client.get(f"/api/v1/audits/{audit_id}")
            assert poll_res.status_code == 200
            poll_data = poll_res.json()
            print(f"Attempt {attempt+1}: Status={poll_data['status']}")
            if poll_data["status"] == "completed":
                completed = True
                print("Visibility Score:", poll_data["overall_visibility_score"])
                print("Competitor Score:", poll_data["competitor_score"])
                print("Citations count:", len(poll_data["citations"]))
                for c in poll_data["citations"]:
                    print(f" - [{c['engine_name']}] Prompt: '{c['prompt_text'][:40]}...' | BrandRank: #{c['brand_rank']} | Sent: {c['sentiment']}")
                break
            elif poll_data["status"] == "failed":
                raise RuntimeError(f"Audit run failed: {poll_data}")

        assert completed, "Audit run did not complete in time"
        print("\n>>> Phase 3 Background Worker & Deterministic Scorer PASSED! <<<")

if __name__ == "__main__":
    asyncio.run(test_phase3())
