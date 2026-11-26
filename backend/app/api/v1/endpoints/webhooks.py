import hashlib
import hmac
import json
from typing import Annotated
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.core.plan_limits import PLAN_LIMITS
from app.models.workspace import Workspace

router = APIRouter()


def verify_webhook_signature(payload_bytes: bytes, signature_header: str | None) -> bool:
    """Verify HMAC SHA256 webhook signature against secret key."""
    if not signature_header or not settings.BILLING_WEBHOOK_SECRET:
        return False

    computed = hmac.new(
        settings.BILLING_WEBHOOK_SECRET.encode("utf-8"),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(computed, signature_header.strip())


@router.post("/billing")
async def billing_webhook_handler(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    x_signature: str | None = Header(default=None, alias="X-Signature"),
):
    """
    Secure webhook endpoint for Lemon Squeezy and Dodo Payments.
    Processes subscription.created, subscription.updated, subscription.cancelled, and payment.failed.
    """
    body_bytes = await request.body()

    if not verify_webhook_signature(body_bytes, x_signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook HMAC signature",
        )

    try:
        data = json.loads(body_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON body")

    event_name = data.get("meta", {}).get("event_name") or data.get("event") or data.get("type", "")
    custom_data = data.get("meta", {}).get("custom_data") or data.get("data", {}).get("attributes", {}).get("custom_data", {})
    workspace_id = custom_data.get("workspace_id") or data.get("workspace_id")

    if not workspace_id:
        return {"status": "ignored", "reason": "No workspace_id in webhook payload"}

    stmt = select(Workspace).where(Workspace.id == workspace_id)
    res = await db.execute(stmt)
    workspace = res.scalar_one_or_none()

    if not workspace:
        return {"status": "ignored", "reason": f"Workspace {workspace_id} not found"}

    # Process events
    if event_name in ("subscription.created", "subscription_created", "subscription.updated", "subscription_updated"):
        # Extract plan tier
        plan_name = (
            data.get("data", {}).get("attributes", {}).get("product_name", "")
            or data.get("plan_name", "")
            or "growth"
        ).lower()

        target_tier = "growth"
        if "starter" in plan_name:
            target_tier = "starter"
        elif "agency" in plan_name:
            target_tier = "agency"

        workspace.plan_tier = target_tier
        workspace.subscription_status = "active"
        limits = PLAN_LIMITS.get(target_tier, PLAN_LIMITS["growth"])
        workspace.monthly_prompt_limit = limits["monthly_prompts"]

    elif event_name in ("subscription.cancelled", "subscription_cancelled", "subscription.expired"):
        workspace.subscription_status = "canceled"
        # Downgrade to free tier limits
        workspace.plan_tier = "free"
        workspace.monthly_prompt_limit = PLAN_LIMITS["free"]["monthly_prompts"]

    elif event_name in ("payment.failed", "subscription_payment_failed", "subscription.paused"):
        workspace.subscription_status = "past_due"
        workspace.plan_tier = "free"
        workspace.monthly_prompt_limit = PLAN_LIMITS["free"]["monthly_prompts"]

    await db.commit()
    await db.refresh(workspace)

    return {
        "status": "processed",
        "event": event_name,
        "workspace_id": workspace.id,
        "plan_tier": workspace.plan_tier,
        "subscription_status": workspace.subscription_status,
    }
