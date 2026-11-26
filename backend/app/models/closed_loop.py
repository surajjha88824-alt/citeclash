import uuid
from datetime import datetime
from typing import Any, Dict, List
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class AppliedFix(Base):
    __tablename__ = "applied_fixes"

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
    fix_type: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
    )  # llms_txt | faq_schema | robots_txt | page_diff | reddit_reply | outreach_pitch
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    target_url: Mapped[str] = mapped_column(
        String(1024),
        nullable=False,
    )
    affected_prompt_ids_json: Mapped[List[str] | None] = mapped_column(
        JSON,
        nullable=True,
        default=list,
    )
    baseline_visibility_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="pending_verify",
        index=True,
    )  # pending_verify | verify_failed | verified_live | indexed | won | stalled_pivoted
    instant_check_result_json: Mapped[Dict[str, Any] | None] = mapped_column(
        JSON,
        nullable=True,
    )
    index_checked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    is_indexed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    recheck_due_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    last_rechecked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    current_visibility_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )
    score_delta: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )
    diagnosis_code: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )  # not_indexed | weak_offpage_authority | buried_community_thread | hallucination_conflict | weak_fact_density
    plan_b_json: Mapped[Dict[str, Any] | None] = mapped_column(
        JSON,
        nullable=True,
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


class BrandGroundTruth(Base):
    __tablename__ = "brand_ground_truths"

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
    category: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default="features",
    )  # pricing | features | integrations | target_audience | positioning
    fact_statement: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class BrandLieAlert(Base):
    __tablename__ = "brand_lie_alerts"

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
    audit_run_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("audit_runs.id", ondelete="SET NULL"),
        nullable=True,
    )
    citation_source_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("citation_sources.id", ondelete="SET NULL"),
        nullable=True,
    )
    engine_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    prompt_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    ground_truth_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("brand_ground_truths.id", ondelete="SET NULL"),
        nullable=True,
    )
    ai_false_claim: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    actual_truth: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    severity: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="moderate",
    )  # critical | moderate
    suspected_source_url: Mapped[str | None] = mapped_column(
        String(1024),
        nullable=True,
    )
    corrective_kit_json: Mapped[Dict[str, Any] | None] = mapped_column(
        JSON,
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="open",
        index=True,
    )  # open | fixing | resolved
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class AiReferralVisit(Base):
    __tablename__ = "ai_referral_visits"

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
    ai_source: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        index=True,
    )  # chatgpt | perplexity | gemini | claude | copilot | other_ai
    referrer_domain: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    landing_path: Mapped[str] = mapped_column(
        String(1024),
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="pageview",
    )  # pageview | conversion
    session_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
