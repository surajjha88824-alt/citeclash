from datetime import datetime, timezone
from typing import Annotated, List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_super_admin
from app.core.exceptions import AppException, BadRequestException, NotFoundException
from app.core.plan_limits import PLAN_LIMITS
from app.models.audit import AuditRun
from app.models.ticket import SupportTicket, TicketMessage
from app.models.user import User
from app.models.workspace import Workspace
from app.services.email_service import send_support_ticket_reply_email

router = APIRouter(dependencies=[Depends(get_current_super_admin)])

# ==============================================================================
# Schemas
# ==============================================================================

class AdminKPIsResponse(BaseModel):
    total_users: int
    active_paid_subscribers: int
    estimated_mrr: float
    total_audits_run: int
    audits_run_today: int
    api_error_rate_pct: float
    total_tickets: int
    open_tickets: int


class WorkspaceAdminView(BaseModel):
    id: str
    brand_name: str
    domain_url: str
    plan_tier: str
    subscription_status: str
    monthly_prompt_limit: int
    prompts_used_this_month: int
    created_at: Optional[datetime] = None


class UserAdminView(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    workspaces: List[WorkspaceAdminView] = []


class PlanOverrideRequest(BaseModel):
    plan_tier: str = Field(..., description="Target plan tier: free, starter, growth, agency")


class UserStatusUpdateRequest(BaseModel):
    is_active: bool


class AdminTicketReplyRequest(BaseModel):
    message: str = Field(..., min_length=1)
    status: Optional[str] = Field(default=None, description="open | in_progress | resolved")


class AdminTicketStatusRequest(BaseModel):
    status: str = Field(..., description="open | in_progress | resolved")


# ==============================================================================
# Endpoints
# ==============================================================================

@router.get("/kpis", response_model=AdminKPIsResponse)
async def get_platform_kpis(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Platform-wide analytics and performance metrics for Super Admins."""
    # 1. Total users
    user_count_res = await db.execute(select(func.count(User.id)))
    total_users = user_count_res.scalar() or 0

    # 2. Paid subscribers and MRR
    ws_res = await db.execute(select(Workspace.plan_tier, Workspace.subscription_status))
    ws_rows = ws_res.all()

    active_paid = 0
    estimated_mrr = 0.0
    tier_pricing = {
        "starter": 49.0,
        "growth": 129.0,
        "agency": 299.0,
    }

    for tier, sub_status in ws_rows:
        if tier != "free" and sub_status in ("active", "trialing"):
            active_paid += 1
            estimated_mrr += tier_pricing.get(tier.lower(), 0.0)

    # 3. Audits statistics
    total_audits_res = await db.execute(select(func.count(AuditRun.id)))
    total_audits = total_audits_res.scalar() or 0

    failed_audits_res = await db.execute(
        select(func.count(AuditRun.id)).where(AuditRun.status == "failed")
    )
    failed_audits = failed_audits_res.scalar() or 0
    error_rate = round((failed_audits / total_audits * 100), 2) if total_audits > 0 else 0.0

    # Audits run today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    audits_today_res = await db.execute(
        select(func.count(AuditRun.id)).where(AuditRun.created_at >= today_start)
    )
    audits_today = audits_today_res.scalar() or 0

    # 4. Support Tickets
    total_tickets_res = await db.execute(select(func.count(SupportTicket.id)))
    total_tickets = total_tickets_res.scalar() or 0

    open_tickets_res = await db.execute(
        select(func.count(SupportTicket.id)).where(SupportTicket.status == "open")
    )
    open_tickets = open_tickets_res.scalar() or 0

    return AdminKPIsResponse(
        total_users=total_users,
        active_paid_subscribers=active_paid,
        estimated_mrr=estimated_mrr,
        total_audits_run=total_audits,
        audits_run_today=audits_today,
        api_error_rate_pct=error_rate,
        total_tickets=total_tickets,
        open_tickets=open_tickets,
    )


@router.get("/users", response_model=List[UserAdminView])
async def list_admin_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    search: Optional[str] = Query(None, description="Search by email or full name"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """List all registered users, their workspaces, and subscription details."""
    stmt = (
        select(User)
        .options(selectinload(User.workspaces))
        .order_by(User.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    if search:
        pattern = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            func.lower(User.email).like(pattern) | func.lower(User.full_name).like(pattern)
        )

    res = await db.execute(stmt)
    users = res.scalars().all()

    output = []
    for u in users:
        ws_views = [
            WorkspaceAdminView(
                id=w.id,
                brand_name=w.brand_name,
                domain_url=w.domain_url,
                plan_tier=w.plan_tier,
                subscription_status=w.subscription_status,
                monthly_prompt_limit=w.monthly_prompt_limit,
                prompts_used_this_month=w.prompts_used_this_month,
                created_at=w.created_at,
            )
            for w in u.workspaces
        ]
        output.append(
            UserAdminView(
                id=u.id,
                email=u.email,
                full_name=u.full_name,
                role=u.role,
                is_active=u.is_active,
                created_at=u.created_at,
                workspaces=ws_views,
            )
        )

    return output


@router.patch("/workspaces/{workspace_id}/plan")
async def override_workspace_plan(
    workspace_id: str,
    payload: PlanOverrideRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Admin manual override of workspace plan tier (for testing, gifting, or VIP accounts)."""
    target_tier = payload.plan_tier.lower().strip()
    if target_tier not in PLAN_LIMITS:
        raise BadRequestException(f"Invalid plan tier. Valid options: {list(PLAN_LIMITS.keys())}")

    ws_res = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    workspace = ws_res.scalar_one_or_none()
    if not workspace:
        raise NotFoundException(f"Workspace '{workspace_id}' not found")

    workspace.plan_tier = target_tier
    workspace.monthly_prompt_limit = PLAN_LIMITS[target_tier]["monthly_prompts"]
    workspace.subscription_status = "active"
    await db.commit()
    await db.refresh(workspace)

    return {
        "status": "success",
        "message": f"Workspace '{workspace.brand_name}' updated to tier '{target_tier}'",
        "workspace_id": workspace.id,
        "plan_tier": workspace.plan_tier,
        "monthly_prompt_limit": workspace.monthly_prompt_limit,
    }


@router.patch("/users/{user_id}/status")
async def toggle_user_status(
    user_id: str,
    payload: UserStatusUpdateRequest,
    current_admin: Annotated[User, Depends(get_current_super_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Suspend or reactivate an account (cannot deactivate self)."""
    if current_admin.id == user_id:
        raise BadRequestException("You cannot suspend your own super-admin account.")

    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalar_one_or_none()
    if not user:
        raise NotFoundException(f"User '{user_id}' not found")

    user.is_active = payload.is_active
    await db.commit()
    await db.refresh(user)

    action = "activated" if user.is_active else "suspended"
    return {
        "status": "success",
        "message": f"User account {user.email} has been {action}",
        "user_id": user.id,
        "is_active": user.is_active,
    }


@router.get("/tickets")
async def list_all_admin_tickets(
    db: Annotated[AsyncSession, Depends(get_db)],
    status_filter: Optional[str] = Query(None, description="open, in_progress, resolved"),
    priority_filter: Optional[str] = Query(None, description="low, medium, high, urgent"),
):
    """Global support ticket queue for Super Admins with filters and user details."""
    stmt = (
        select(SupportTicket)
        .options(
            selectinload(SupportTicket.messages),
            selectinload(SupportTicket.user),
        )
        .order_by(SupportTicket.created_at.desc())
    )

    if status_filter and status_filter.lower() != "all":
        stmt = stmt.where(SupportTicket.status == status_filter.lower().strip())
    if priority_filter and priority_filter.lower() != "all":
        stmt = stmt.where(SupportTicket.priority == priority_filter.lower().strip())

    res = await db.execute(stmt)
    tickets = res.scalars().all()

    output = []
    for t in tickets:
        user_email = t.user.email if t.user else "unknown@user.com"
        user_name = t.user.full_name if t.user else "Unknown User"
        output.append({
            "id": t.id,
            "user_id": t.user_id,
            "user_email": user_email,
            "user_name": user_name,
            "workspace_id": t.workspace_id,
            "subject": t.subject,
            "category": t.category,
            "priority": t.priority,
            "status": t.status,
            "attachment_url": t.attachment_url,
            "created_at": t.created_at,
            "messages_count": len(t.messages),
            "messages": [
                {
                    "id": m.id,
                    "sender_id": m.sender_id,
                    "message": m.message,
                    "is_admin_reply": m.is_admin_reply,
                    "created_at": m.created_at,
                }
                for m in t.messages
            ],
        })

    return output


@router.post("/tickets/{ticket_id}/reply")
async def admin_reply_ticket(
    ticket_id: str,
    payload: AdminTicketReplyRequest,
    background_tasks: BackgroundTasks,
    current_admin: Annotated[User, Depends(get_current_super_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Post an official admin response to a customer support ticket."""
    stmt = (
        select(SupportTicket)
        .options(
            selectinload(SupportTicket.messages),
            selectinload(SupportTicket.user),
        )
        .where(SupportTicket.id == ticket_id)
    )
    res = await db.execute(stmt)
    ticket = res.scalar_one_or_none()
    if not ticket:
        raise NotFoundException(f"Ticket '{ticket_id}' not found")

    reply = TicketMessage(
        ticket_id=ticket.id,
        sender_id=current_admin.id,
        message=payload.message.strip(),
        is_admin_reply=True,
    )
    db.add(reply)

    if payload.status:
        ticket.status = payload.status
    elif ticket.status == "open":
        ticket.status = "in_progress"

    await db.commit()
    await db.refresh(reply)

    # Dispatch email alert to ticket creator if email available
    if ticket.user and ticket.user.email:
        background_tasks.add_task(
            send_support_ticket_reply_email,
            to_email=ticket.user.email,
            ticket_id=ticket.id,
            ticket_subject=ticket.subject,
            reply_text=payload.message.strip(),
        )

    return {
        "status": "success",
        "message": "Admin reply sent successfully",
        "ticket_id": ticket.id,
        "ticket_status": ticket.status,
        "reply_id": reply.id,
    }


@router.patch("/tickets/{ticket_id}/status")
async def update_ticket_status_admin(
    ticket_id: str,
    payload: AdminTicketStatusRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update ticket resolution status."""
    stmt = select(SupportTicket).where(SupportTicket.id == ticket_id)
    res = await db.execute(stmt)
    ticket = res.scalar_one_or_none()
    if not ticket:
        raise NotFoundException(f"Ticket '{ticket_id}' not found")

    ticket.status = payload.status
    await db.commit()
    await db.refresh(ticket)

    return {
        "status": "success",
        "ticket_id": ticket.id,
        "new_status": ticket.status,
    }
