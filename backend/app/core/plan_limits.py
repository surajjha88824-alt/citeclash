from typing import Any, Dict
from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import AppException
from app.models.prompt import TrackedPrompt
from app.models.user import User
from app.models.workspace import Workspace

# Strict tier limits matrix
PLAN_LIMITS = {
    "free": {
        "max_workspaces": 1,
        "monthly_prompts": 2,
        "reddit_credits": 3,
        "all_engines": False,
        "white_label_reports": False,
        "price_usd": 0,
    },
    "starter": {
        "max_workspaces": 1,
        "monthly_prompts": 15,
        "reddit_credits": 10,
        "all_engines": False,
        "white_label_reports": False,
        "price_usd": 49,
    },
    "growth": {
        "max_workspaces": 1,
        "monthly_prompts": 50,
        "reddit_credits": 999999,  # Unlimited
        "all_engines": True,
        "white_label_reports": False,
        "price_usd": 129,
    },
    "agency": {
        "max_workspaces": 5,
        "monthly_prompts": 200,
        "reddit_credits": 999999,  # Unlimited
        "all_engines": True,
        "white_label_reports": True,
        "price_usd": 299,
    },
}


class PlanLimitExceededException(AppException):
    def __init__(self, message: str, details: Dict[str, Any]):
        super().__init__(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            message=message,
            code="PLAN_LIMIT_EXCEEDED",
            details=details,
        )


def verify_prompt_limit(workspace: Workspace, current_prompts_count: int) -> None:
    """Enforces prompt limits per tier."""
    tier = workspace.plan_tier.lower()
    limits = PLAN_LIMITS.get(tier, PLAN_LIMITS["free"])
    max_prompts = limits["monthly_prompts"]

    if current_prompts_count >= max_prompts:
        next_tier = "growth" if tier in ("free", "starter") else "agency"
        raise PlanLimitExceededException(
            message=f"Prompt limit reached for your {tier.capitalize()} plan ({current_prompts_count}/{max_prompts}). Upgrade your plan to track more queries.",
            details={
                "current_tier": tier,
                "required_tier": next_tier,
                "feature": "monthly_prompts",
                "limit": max_prompts,
                "used": current_prompts_count,
            },
        )


async def verify_workspace_creation_limit(user: User, db: AsyncSession) -> None:
    """Enforces workspace count per user based on highest tier."""
    # Count workspaces owned by user
    stmt = select(func.count(Workspace.id)).where(Workspace.owner_id == user.id)
    res = await db.execute(stmt)
    count = res.scalar_one()

    # Determine highest tier of user
    tier_stmt = select(Workspace.plan_tier).where(Workspace.owner_id == user.id)
    tier_res = await db.execute(tier_stmt)
    user_tiers = [t.lower() for t in tier_res.scalars().all()]
    effective_tier = "agency" if "agency" in user_tiers else ("growth" if "growth" in user_tiers else ("starter" if "starter" in user_tiers else "free"))

    limits = PLAN_LIMITS.get(effective_tier, PLAN_LIMITS["free"])
    max_workspaces = limits["max_workspaces"]

    if count >= max_workspaces:
        raise PlanLimitExceededException(
            message=f"Workspace limit reached ({count}/{max_workspaces}). Upgrade to the Agency plan to manage up to 5 workspaces.",
            details={
                "current_tier": effective_tier,
                "required_tier": "agency",
                "feature": "workspaces",
                "limit": max_workspaces,
                "used": count,
            },
        )


def verify_white_label_access(workspace: Workspace) -> None:
    """Ensures White-Label PDF reporting is locked to Agency tier."""
    tier = workspace.plan_tier.lower()
    limits = PLAN_LIMITS.get(tier, PLAN_LIMITS["free"])

    if not limits["white_label_reports"]:
        raise PlanLimitExceededException(
            message="White-Label PDF reports and custom agency branding require the Agency plan ($299/mo).",
            details={
                "current_tier": tier,
                "required_tier": "agency",
                "required_plan": "agency",
                "feature": "white_label_reports",
                "limit": 0,
                "used": 1,
            },
        )


def verify_paid_feature_access(
    workspace: Workspace,
    feature_name: str,
    required_plan: str = "starter",
) -> None:
    """Server-side plan tier enforcement for paid features (returns HTTP 402 PLAN_LIMIT_EXCEEDED)."""
    tier = (workspace.plan_tier or "free").lower()
    sub_status = (workspace.subscription_status or "active").lower()
    tier_order = {"free": 0, "starter": 1, "growth": 2, "agency": 3}

    if sub_status not in ("active", "trialing") or tier_order.get(tier, 0) < tier_order.get(required_plan, 1):
        raise PlanLimitExceededException(
            message=f"{feature_name} requires the {required_plan.capitalize()} plan or higher.",
            details={
                "current_tier": tier,
                "required_tier": required_plan,
                "required_plan": required_plan,
                "feature": feature_name,
            },
        )
