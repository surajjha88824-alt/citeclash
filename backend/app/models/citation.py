import uuid
from datetime import datetime
from typing import Any, List
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class CitationSource(Base):
    __tablename__ = "citation_sources"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    audit_run_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("audit_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    engine_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )  # e.g., "ChatGPT (Search)", "Perplexity", "Google AI Overviews", "Claude", "Gemini"
    prompt_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    brand_mentioned: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    brand_rank: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    competitor_mentioned: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    sentiment: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )  # "positive" | "neutral" | "negative"
    cited_urls_json: Mapped[List[Any] | None] = mapped_column(
        JSON,
        nullable=True,
    )
    raw_response: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    audit_run = relationship("AuditRun", back_populates="citations")
