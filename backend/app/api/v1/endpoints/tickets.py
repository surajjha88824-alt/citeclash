from typing import Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.exceptions import AppException, ForbiddenException, NotFoundException
from app.models.ticket import SupportTicket, TicketMessage
from app.models.user import User
from app.schemas.ticket import (
    TicketCreate,
    TicketListResponse,
    TicketMessageCreate,
    TicketMessageResponse,
    TicketResponse,
    TicketUpdate,
)

router = APIRouter()


@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    payload: TicketCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Submit a new support ticket."""
    ticket = SupportTicket(
        user_id=current_user.id,
        workspace_id=payload.workspace_id,
        subject=payload.subject.strip(),
        category=payload.category,
        priority=payload.priority,
        status="open",
        attachment_url=payload.attachment_url,
    )
    db.add(ticket)
    await db.flush()

    # Initial message
    first_message = TicketMessage(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        message=payload.message.strip(),
        is_admin_reply=False,
    )
    db.add(first_message)
    await db.commit()

    # Reload with messages
    stmt = (
        select(SupportTicket)
        .options(selectinload(SupportTicket.messages))
        .where(SupportTicket.id == ticket.id)
    )
    full_ticket = (await db.execute(stmt)).scalar_one()
    return TicketResponse.model_validate(full_ticket)


@router.get("/", response_model=TicketListResponse)
async def list_tickets(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    List tickets. Super-admins see all tickets, standard users see only their own.
    """
    stmt = select(SupportTicket).options(selectinload(SupportTicket.messages))
    if current_user.role != "super_admin":
        stmt = stmt.where(SupportTicket.user_id == current_user.id)

    stmt = stmt.order_by(SupportTicket.created_at.desc())
    res = await db.execute(stmt)
    tickets = res.scalars().all()

    return TicketListResponse(
        tickets=[TicketResponse.model_validate(t) for t in tickets],
        total=len(tickets),
    )


@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get ticket details and conversation thread."""
    stmt = (
        select(SupportTicket)
        .options(selectinload(SupportTicket.messages))
        .where(SupportTicket.id == ticket_id)
    )
    res = await db.execute(stmt)
    ticket = res.scalar_one_or_none()

    if not ticket:
        raise NotFoundException(f"Ticket '{ticket_id}' not found")

    if ticket.user_id != current_user.id and current_user.role != "super_admin":
        raise ForbiddenException("Access denied to this ticket")

    return TicketResponse.model_validate(ticket)


@router.post("/{ticket_id}/messages", response_model=TicketMessageResponse, status_code=status.HTTP_201_CREATED)
async def add_ticket_message(
    ticket_id: str,
    payload: TicketMessageCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Add a response message to a support ticket thread."""
    stmt = select(SupportTicket).where(SupportTicket.id == ticket_id)
    res = await db.execute(stmt)
    ticket = res.scalar_one_or_none()

    if not ticket:
        raise NotFoundException(f"Ticket '{ticket_id}' not found")

    if ticket.user_id != current_user.id and current_user.role != "super_admin":
        raise ForbiddenException("Access denied to this ticket")

    is_admin = current_user.role == "super_admin"
    msg = TicketMessage(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        message=payload.message.strip(),
        is_admin_reply=is_admin,
    )
    db.add(msg)

    # If ticket was resolved and user writes, reopen ticket
    if not is_admin and ticket.status == "resolved":
        ticket.status = "in_progress"

    await db.commit()
    await db.refresh(msg)
    return TicketMessageResponse.model_validate(msg)


@router.patch("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: str,
    payload: TicketUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update ticket status or priority (Super-admins or ticket owner)."""
    stmt = select(SupportTicket).options(selectinload(SupportTicket.messages)).where(SupportTicket.id == ticket_id)
    res = await db.execute(stmt)
    ticket = res.scalar_one_or_none()

    if not ticket:
        raise NotFoundException(f"Ticket '{ticket_id}' not found")

    if ticket.user_id != current_user.id and current_user.role != "super_admin":
        raise ForbiddenException("Access denied to update this ticket")

    if payload.status:
        ticket.status = payload.status
    if payload.priority:
        ticket.priority = payload.priority

    await db.commit()
    await db.refresh(ticket)
    return TicketResponse.model_validate(ticket)
