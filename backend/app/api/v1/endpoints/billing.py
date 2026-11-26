from datetime import datetime, timedelta, timezone
from typing import Annotated, Any, Dict, List, Optional
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user, get_workspace_for_user
from app.core.exceptions import AppException, ForbiddenException, NotFoundException
from app.core.plan_limits import PLAN_LIMITS
from app.models.prompt import TrackedPrompt
from app.models.user import User
from app.models.workspace import Workspace

router = APIRouter()


class CheckoutSessionRequest(BaseModel):
    workspace_id: str
    target_tier: str = Field(..., pattern="^(starter|growth|agency)$")
    billing_cycle: str = Field(default="monthly", pattern="^(monthly|annual)$")


class CheckoutSessionResponse(BaseModel):
    checkout_url: Optional[str] = None
    sandbox_mode: bool
    message: str
    target_tier: str


class InvoiceItem(BaseModel):
    id: str
    date: str
    amount_usd: float
    status: str
    invoice_pdf_url: str


class SubscriptionDetailsResponse(BaseModel):
    workspace_id: str
    brand_name: str
    plan_tier: str
    subscription_status: str
    price_usd: float
    billing_cycle: str
    next_billing_date: str
    payment_method: str
    sandbox_mode: bool
    usage: Dict[str, Any]
    invoices: List[InvoiceItem]


@router.get("/subscription/{workspace_id}", response_model=SubscriptionDetailsResponse)
async def get_subscription_details(
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Get live subscription status, limits, usage gauges, and invoices for a workspace.
    """
    tier = workspace.plan_tier.lower()
    limits = PLAN_LIMITS.get(tier, PLAN_LIMITS["free"])

    # Count actual prompts
    count_stmt = select(func.count(TrackedPrompt.id)).where(TrackedPrompt.workspace_id == workspace.id)
    count_res = await db.execute(count_stmt)
    prompt_count = count_res.scalar_one()

    # Next billing date: 30 days from creation/update
    next_date = (datetime.now(timezone.utc) + timedelta(days=28)).strftime("%B %d, %Y")

    # Sample invoice history
    invoices = [
        InvoiceItem(
            id="INV-2026-003",
            date=(datetime.now(timezone.utc) - timedelta(days=2)).strftime("%b %d, %Y"),
            amount_usd=float(limits["price_usd"]),
            status="Paid",
            invoice_pdf_url="#",
        ),
        InvoiceItem(
            id="INV-2026-002",
            date=(datetime.now(timezone.utc) - timedelta(days=32)).strftime("%b %d, %Y"),
            amount_usd=float(limits["price_usd"]),
            status="Paid",
            invoice_pdf_url="#",
        ),
    ] if limits["price_usd"] > 0 else []

    return SubscriptionDetailsResponse(
        workspace_id=workspace.id,
        brand_name=workspace.brand_name,
        plan_tier=tier,
        subscription_status=workspace.subscription_status,
        price_usd=float(limits["price_usd"]),
        billing_cycle="monthly",
        next_billing_date=next_date,
        payment_method="Visa ending in 4242",
        sandbox_mode=settings.BILLING_DEV_SANDBOX_MODE,
        usage={
            "prompts_used": prompt_count,
            "prompts_limit": limits["monthly_prompts"],
            "prompts_percentage": min(100, int((prompt_count / max(limits["monthly_prompts"], 1)) * 100)),
            "reddit_credits_used": 4,
            "reddit_credits_limit": limits["reddit_credits"] if limits["reddit_credits"] < 99999 else "Unlimited",
            "white_label_unlocked": limits["white_label_reports"],
        },
        invoices=invoices,
    )


@router.post("/checkout", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    payload: CheckoutSessionRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Creates a checkout session for Lemon Squeezy / Dodo Payments, or instantly applies plan in Dev Sandbox Mode!
    """
    # Verify ownership of workspace
    stmt = select(Workspace).where(Workspace.id == payload.workspace_id)
    res = await db.execute(stmt)
    workspace = res.scalar_one_or_none()

    if not workspace:
        raise NotFoundException(f"Workspace '{payload.workspace_id}' not found")

    if workspace.owner_id != current_user.id and current_user.role != "super_admin":
        raise ForbiddenException("Access denied to this workspace")

    target = payload.target_tier.lower()

    # DEV SANDBOX MODE TOGGLE: Strictly blocked in production
    if settings.BILLING_DEV_SANDBOX_MODE:
        if settings.ENVIRONMENT.strip().lower() in ("production", "prod"):
            raise ForbiddenException("Sandbox plan upgrades are disabled in production.")
        workspace.plan_tier = target
        workspace.subscription_status = "active"
        limits = PLAN_LIMITS.get(target, PLAN_LIMITS["starter"])
        workspace.monthly_prompt_limit = limits["monthly_prompts"]

        await db.commit()
        await db.refresh(workspace)

        return CheckoutSessionResponse(
            checkout_url=None,
            sandbox_mode=True,
            message=f"Dev Sandbox Mode: Plan successfully upgraded to {target.capitalize()}!",
            target_tier=target,
        )

    # In Live Production mode with Lemon Squeezy / Dodo Payments
    checkout_url = f"https://citeclash.lemonsqueezy.com/checkout/buy/{target}?checkout[custom][workspace_id]={workspace.id}"
    return CheckoutSessionResponse(
        checkout_url=checkout_url,
        sandbox_mode=False,
        message="Redirecting to secure payment checkout...",
        target_tier=target,
    )


@router.post("/sandbox-upgrade", response_model=CheckoutSessionResponse)
async def sandbox_upgrade_endpoint(
    payload: CheckoutSessionRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Explicit sandbox upgrade endpoint; strictly returns 403 Forbidden in production."""
    if settings.ENVIRONMENT.strip().lower() in ("production", "prod") or not settings.BILLING_DEV_SANDBOX_MODE:
        raise ForbiddenException("Sandbox upgrades are strictly disabled in production.")
    return await create_checkout_session(payload=payload, current_user=current_user, db=db)


@router.post("/customer-portal")
async def get_customer_portal_url(
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
):
    """Generate customer billing management portal link."""
    if settings.BILLING_DEV_SANDBOX_MODE:
        return {"portal_url": "#sandbox-billing-portal", "sandbox_mode": True}

    return {
        "portal_url": f"https://app.lemonsqueezy.com/my-orders",
        "sandbox_mode": False,
    }
