import uuid
from datetime import datetime
from typing import Any, Dict
from sqlalchemy import DateTime, Float, ForeignKey, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class AuditRun(Base):
    __tablename__ = "audit_runs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    workspace_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    competitor_domain: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="queued",
        nullable=False,
    )  # "queued" | "processing" | "completed" | "failed"
    overall_visibility_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )
    competitor_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )
    raw_results_json: Mapped[Dict[str, Any] | None] = mapped_column(
        JSON,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    workspace = relationship("Workspace", back_populates="audit_runs")
    citations = relationship("CitationSource", back_populates="audit_run", cascade="all, delete-orphan")
