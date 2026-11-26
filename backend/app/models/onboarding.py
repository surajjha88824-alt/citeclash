import uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class UserOnboardingProgress(Base):
    __tablename__ = "user_onboarding_progress"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    step_1_brand: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    step_2_audit: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    step_3_reddit: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    step_4_autofix: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    step_5_email: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

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

    # Relationship
    user = relationship("User", back_populates="onboarding_progress")
