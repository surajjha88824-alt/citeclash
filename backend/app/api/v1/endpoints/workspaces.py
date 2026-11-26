from typing import Annotated, List
from fastapi import APIRouter, Depends, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user, get_workspace_for_user
from app.core.exceptions import AppException, ForbiddenException, NotFoundException
from app.core.plan_limits import verify_prompt_limit, verify_workspace_creation_limit
from app.models.prompt import TrackedPrompt
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.auth import MessageResponse
from app.schemas.prompt import PromptCreate, PromptListResponse, PromptResponse
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceListResponse,
    WorkspaceResponse,
    WorkspaceUpdate,
)

router = APIRouter()


@router.post("/", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    payload: WorkspaceCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new workspace owned by the authenticated user."""
    # Enforce workspace tier limit (Free/Starter/Growth = 1, Agency = 5)
    await verify_workspace_creation_limit(current_user, db)

    workspace = Workspace(
        owner_id=current_user.id,
        brand_name=payload.brand_name.strip(),
        domain_url=payload.domain_url.strip().lower(),
        industry=payload.industry.strip() if payload.industry else None,
        logo_url=payload.logo_url,
        plan_tier="free",
        subscription_status="active",
        monthly_prompt_limit=50,
        prompts_used_this_month=0,
    )
    db.add(workspace)
    await db.commit()
    await db.refresh(workspace)
    return WorkspaceResponse.model_validate(workspace)


@router.get("/", response_model=WorkspaceListResponse)
async def list_user_workspaces(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    List all workspaces owned by the authenticated user.
    Strict isolation: only workspaces where owner_id matches current_user.id are returned.
    """
    stmt = (
        select(Workspace)
        .where(Workspace.owner_id == current_user.id)
        .order_by(Workspace.created_at.desc())
    )
    result = await db.execute(stmt)
    workspaces = result.scalars().all()

    return WorkspaceListResponse(
        workspaces=[WorkspaceResponse.model_validate(w) for w in workspaces],
        total=len(workspaces),
    )


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
):
    """
    Retrieve single workspace by ID.
    Guarded by strict ownership dependency `get_workspace_for_user`.
    """
    return WorkspaceResponse.model_validate(workspace)


@router.put("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    payload: WorkspaceUpdate,
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Update workspace details.
    Guarded by strict ownership dependency `get_workspace_for_user`.
    """
    if payload.brand_name is not None:
        workspace.brand_name = payload.brand_name.strip()
    if payload.domain_url is not None:
        workspace.domain_url = payload.domain_url.strip().lower()
    if payload.industry is not None:
        workspace.industry = payload.industry.strip()
    if payload.logo_url is not None:
        workspace.logo_url = payload.logo_url
    if payload.plan_tier is not None:
        workspace.plan_tier = payload.plan_tier
    if payload.subscription_status is not None:
        workspace.subscription_status = payload.subscription_status

    await db.commit()
    await db.refresh(workspace)
    return WorkspaceResponse.model_validate(workspace)


@router.delete("/{workspace_id}", response_model=MessageResponse)
async def delete_workspace(
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Delete a workspace and cascade all child records.
    Guarded by strict ownership dependency `get_workspace_for_user`.
    """
    await db.delete(workspace)
    await db.commit()
    return MessageResponse(message=f"Workspace '{workspace.brand_name}' has been successfully deleted")


# ==============================================================================
# Workspace Tracked Prompts Sub-resources
# ==============================================================================

@router.post("/{workspace_id}/prompts", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
async def add_tracked_prompt(
    payload: PromptCreate,
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Add a new search/GEO prompt to track for the workspace."""
    # Check limit against plan tier
    count_stmt = select(func.count(TrackedPrompt.id)).where(TrackedPrompt.workspace_id == workspace.id)
    count_res = await db.execute(count_stmt)
    current_count = count_res.scalar_one()

    # Enforce strict 402 Payment Required guardrail
    verify_prompt_limit(workspace, current_count)

    prompt = TrackedPrompt(
        workspace_id=workspace.id,
        prompt_text=payload.prompt_text.strip(),
        is_active=payload.is_active,
    )
    db.add(prompt)
    await db.commit()
    await db.refresh(prompt)
    return PromptResponse.model_validate(prompt)


@router.get("/{workspace_id}/prompts", response_model=PromptListResponse)
async def list_workspace_prompts(
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all tracked prompts for the workspace."""
    stmt = (
        select(TrackedPrompt)
        .where(TrackedPrompt.workspace_id == workspace.id)
        .order_by(TrackedPrompt.created_at.desc())
    )
    result = await db.execute(stmt)
    prompts = result.scalars().all()
    return PromptListResponse(
        prompts=[PromptResponse.model_validate(p) for p in prompts],
        total=len(prompts),
    )


@router.delete("/{workspace_id}/prompts/{prompt_id}", response_model=MessageResponse)
async def delete_workspace_prompt(
    prompt_id: str,
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a tracked prompt from the workspace."""
    stmt = select(TrackedPrompt).where(
        TrackedPrompt.id == prompt_id,
        TrackedPrompt.workspace_id == workspace.id,
    )
    res = await db.execute(stmt)
    prompt = res.scalar_one_or_none()
    if not prompt:
        raise NotFoundException(f"Prompt with ID '{prompt_id}' not found in this workspace")

    await db.delete(prompt)
    await db.commit()
    return MessageResponse(message="Prompt deleted successfully")
