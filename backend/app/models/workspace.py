import secrets
import uuid
from datetime import datetime
from typing import List
from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    owner_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    brand_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    domain_url: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
    )
    industry: Mapped[str | None] = mapped_column(
        String(128),
        nullable=True,
    )
    logo_url: Mapped[str | None] = mapped_column(
        String(1024),
        nullable=True,
    )
    plan_tier: Mapped[str] = mapped_column(
        String(50),
        default="free",
        nullable=False,
    )  # "free" | "starter" | "growth" | "agency"
    subscription_status: Mapped[str] = mapped_column(
        String(50),
        default="active",
        nullable=False,
    )  # "active" | "trialing" | "past_due" | "canceled"
    monthly_prompt_limit: Mapped[int] = mapped_column(
        Integer,
        default=50,
        nullable=False,
    )
    prompts_used_this_month: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    pixel_key: Mapped[str | None] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=True,
        default=lambda: f"cc_px_{secrets.token_urlsafe(12)}",
    )
    conversion_paths_json: Mapped[List[str] | None] = mapped_column(
        JSON,
        nullable=True,
        default=lambda: ["/signup", "/register", "/checkout", "/thank-you", "/demo"],
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        onupdate=func.now(),
        nullable=True,
    )

    # Relationships
    owner = relationship("User", back_populates="workspaces")
    tracked_prompts = relationship("TrackedPrompt", back_populates="workspace", cascade="all, delete-orphan")
    audit_runs = relationship("AuditRun", back_populates="workspace", cascade="all, delete-orphan")
    support_tickets = relationship("SupportTicket", back_populates="workspace")
