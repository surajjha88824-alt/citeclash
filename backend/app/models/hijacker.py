import uuid
from datetime import datetime
from typing import Any, List
from sqlalchemy import DateTime, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class HijackerThreadsCache(Base):
    __tablename__ = "hijacker_threads_cache"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    workspace_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False,
        index=True,
        default="default",
    )
    query_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )
    threads_json: Mapped[List[Any]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )
    source_provider: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="serper",
    )
    cached_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
