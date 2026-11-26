import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import Boolean, DateTime, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class SeoArticle(Base):
    __tablename__ = "seo_articles"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    slug: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    article_type: Mapped[str] = mapped_column(
        String(50),
        default="guide",
        index=True,
        nullable=False,
    )  # "guide" | "comparison" | "battle"
    title: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
    )
    meta_description: Mapped[str] = mapped_column(
        String(1024),
        nullable=False,
    )
    direct_answer_summary: Mapped[str | None] = mapped_column(
        String(1024),
        nullable=True,
    )  # 45-word direct answer snippet for AEO / Perplexity
    content_markdown: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    structured_data_json: Mapped[Dict[str, Any] | None] = mapped_column(
        JSON,
        nullable=True,
    )
    key_stats_json: Mapped[List[Dict[str, Any]] | None] = mapped_column(
        JSON,
        nullable=True,
    )
    brand_domain: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    competitor_domain: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    is_published: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        index=True,
        nullable=False,
    )
    view_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
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
