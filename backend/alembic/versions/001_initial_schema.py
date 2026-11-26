"""Initial schema for CiteClash

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-11-24 19:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users table
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False, server_default="user"),
        sa.Column("auth_provider", sa.String(length=50), nullable=False, server_default="email"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    # 2. workspaces table
    op.create_table(
        "workspaces",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("owner_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("brand_name", sa.String(length=255), nullable=False),
        sa.Column("domain_url", sa.String(length=512), nullable=False),
        sa.Column("industry", sa.String(length=128), nullable=True),
        sa.Column("logo_url", sa.String(length=1024), nullable=True),
        sa.Column("plan_tier", sa.String(length=50), nullable=False, server_default="free"),
        sa.Column("subscription_status", sa.String(length=50), nullable=False, server_default="active"),
        sa.Column("monthly_prompt_limit", sa.Integer(), nullable=False, server_default="50"),
        sa.Column("prompts_used_this_month", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(op.f("ix_workspaces_id"), "workspaces", ["id"], unique=False)
    op.create_index(op.f("ix_workspaces_owner_id"), "workspaces", ["owner_id"], unique=False)

    # 3. tracked_prompts table
    op.create_table(
        "tracked_prompts",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("workspace_id", sa.String(length=36), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("prompt_text", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_tracked_prompts_id"), "tracked_prompts", ["id"], unique=False)
    op.create_index(op.f("ix_tracked_prompts_workspace_id"), "tracked_prompts", ["workspace_id"], unique=False)

    # 4. audit_runs table
    op.create_table(
        "audit_runs",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("workspace_id", sa.String(length=36), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("competitor_domain", sa.String(length=512), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="queued"),
        sa.Column("overall_visibility_score", sa.Float(), nullable=True),
        sa.Column("competitor_score", sa.Float(), nullable=True),
        sa.Column("raw_results_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_audit_runs_id"), "audit_runs", ["id"], unique=False)
    op.create_index(op.f("ix_audit_runs_workspace_id"), "audit_runs", ["workspace_id"], unique=False)

    # 5. citation_sources table
    op.create_table(
        "citation_sources",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("audit_run_id", sa.String(length=36), sa.ForeignKey("audit_runs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("engine_name", sa.String(length=100), nullable=False),
        sa.Column("prompt_text", sa.Text(), nullable=False),
        sa.Column("brand_mentioned", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("brand_rank", sa.Integer(), nullable=True),
        sa.Column("competitor_mentioned", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("sentiment", sa.String(length=50), nullable=True),
        sa.Column("cited_urls_json", sa.JSON(), nullable=True),
        sa.Column("raw_response", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_citation_sources_id"), "citation_sources", ["id"], unique=False)
    op.create_index(op.f("ix_citation_sources_audit_run_id"), "citation_sources", ["audit_run_id"], unique=False)

    # 6. support_tickets table
    op.create_table(
        "support_tickets",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("workspace_id", sa.String(length=36), sa.ForeignKey("workspaces.id", ondelete="SET NULL"), nullable=True),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("priority", sa.String(length=50), nullable=False, server_default="medium"),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="open"),
        sa.Column("attachment_url", sa.String(length=1024), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(op.f("ix_support_tickets_id"), "support_tickets", ["id"], unique=False)
    op.create_index(op.f("ix_support_tickets_user_id"), "support_tickets", ["user_id"], unique=False)
    op.create_index(op.f("ix_support_tickets_workspace_id"), "support_tickets", ["workspace_id"], unique=False)

    # 7. ticket_messages table
    op.create_table(
        "ticket_messages",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("ticket_id", sa.String(length=36), sa.ForeignKey("support_tickets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sender_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("is_admin_reply", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_ticket_messages_id"), "ticket_messages", ["id"], unique=False)
    op.create_index(op.f("ix_ticket_messages_ticket_id"), "ticket_messages", ["ticket_id"], unique=False)
    op.create_index(op.f("ix_ticket_messages_sender_id"), "ticket_messages", ["sender_id"], unique=False)


def downgrade() -> None:
    op.drop_table("ticket_messages")
    op.drop_table("support_tickets")
    op.drop_table("citation_sources")
    op.drop_table("audit_runs")
    op.drop_table("tracked_prompts")
    op.drop_table("workspaces")
    op.drop_table("users")
