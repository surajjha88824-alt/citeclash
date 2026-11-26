from typing import Annotated, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.onboarding import UserOnboardingProgress
from app.models.user import User

router = APIRouter()


class OnboardingProgressResponse(BaseModel):
    step_1_brand: bool
    step_2_audit: bool
    step_3_reddit: bool
    step_4_autofix: bool
    step_5_email: bool
    completed_count: int
    total_steps: int = 5
    percentage_complete: int


class OnboardingProgressUpdate(BaseModel):
    step_1_brand: Optional[bool] = None
    step_2_audit: Optional[bool] = None
    step_3_reddit: Optional[bool] = None
    step_4_autofix: Optional[bool] = None
    step_5_email: Optional[bool] = None


def _calculate_progress(p: UserOnboardingProgress) -> OnboardingProgressResponse:
    steps = [
        p.step_1_brand,
        p.step_2_audit,
        p.step_3_reddit,
        p.step_4_autofix,
        p.step_5_email,
    ]
    completed = sum(1 for s in steps if s)
    pct = int((completed / 5) * 100)
    return OnboardingProgressResponse(
        step_1_brand=p.step_1_brand,
        step_2_audit=p.step_2_audit,
        step_3_reddit=p.step_3_reddit,
        step_4_autofix=p.step_4_autofix,
        step_5_email=p.step_5_email,
        completed_count=completed,
        total_steps=5,
        percentage_complete=pct,
    )


@router.get("/progress", response_model=OnboardingProgressResponse)
async def get_onboarding_progress(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve 5-step onboarding milestone checklist status for current user."""
    stmt = select(UserOnboardingProgress).where(UserOnboardingProgress.user_id == current_user.id)
    res = await db.execute(stmt)
    progress = res.scalar_one_or_none()

    if not progress:
        progress = UserOnboardingProgress(
            user_id=current_user.id,
            step_1_brand=True,  # User registered & provisioned default workspace
            step_2_audit=False,
            step_3_reddit=False,
            step_4_autofix=False,
            step_5_email=False,
        )
        db.add(progress)
        await db.commit()
        await db.refresh(progress)

    return _calculate_progress(progress)


@router.patch("/progress", response_model=OnboardingProgressResponse)
async def update_onboarding_progress(
    payload: OnboardingProgressUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Mark specific onboarding milestones as complete/incomplete."""
    stmt = select(UserOnboardingProgress).where(UserOnboardingProgress.user_id == current_user.id)
    res = await db.execute(stmt)
    progress = res.scalar_one_or_none()

    if not progress:
        progress = UserOnboardingProgress(user_id=current_user.id)
        db.add(progress)
        await db.flush()

    if payload.step_1_brand is not None:
        progress.step_1_brand = payload.step_1_brand
    if payload.step_2_audit is not None:
        progress.step_2_audit = payload.step_2_audit
    if payload.step_3_reddit is not None:
        progress.step_3_reddit = payload.step_3_reddit
    if payload.step_4_autofix is not None:
        progress.step_4_autofix = payload.step_4_autofix
    if payload.step_5_email is not None:
        progress.step_5_email = payload.step_5_email

    await db.commit()
    await db.refresh(progress)

    return _calculate_progress(progress)
