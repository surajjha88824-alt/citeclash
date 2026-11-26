from typing import Annotated, Literal, Optional
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_workspace_for_user
from app.core.plan_limits import verify_paid_feature_access
from app.models.real_results import CitationGapAction, CrawlAudit, PageDiffReport
from app.models.workspace import Workspace
from app.services.citation_gap_service import (
    generate_gap_outreach_pitch,
    get_workspace_citation_gaps,
)
from app.services.crawl_auditor import run_live_crawl_audit
from app.services.page_diff_service import run_live_page_diff

router = APIRouter()


# ==============================================================================
# Schemas
# ==============================================================================

class CrawlAuditRequest(BaseModel):
    target_url: Optional[str] = Field(default=None, max_length=1024)


class GapPitchRequest(BaseModel):
    gap_id: str
    source_url: str
    source_title: str = ""
    source_category: str = "Editorial / Listicle"
    competitor_name: str = "Competitor"


class GapStatusUpdateRequest(BaseModel):
    status: Literal["open", "pitched", "won", "ignored"]
    source_url: Optional[str] = None
    source_domain: Optional[str] = None


class PageDiffRequest(BaseModel):
    user_url: str = Field(..., min_length=3, max_length=1024)
    competitor_url: str = Field(..., min_length=3, max_length=1024)
    manual_competitor_text: Optional[str] = None


# ==============================================================================
# Engine 1: Live AI-Crawlability & Technical Blocker Auditor
# ==============================================================================

@router.post("/{workspace_id}/crawl-audit", status_code=status.HTTP_200_OK)
async def trigger_workspace_crawl_audit(
    payload: CrawlAuditRequest,
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    target = (payload.target_url or workspace.domain_url).strip()
    result = await run_live_crawl_audit(target)

    record = CrawlAudit(
        workspace_id=workspace.id,
        target_url=result["target_url"],
        readiness_score=result["readiness_score"],
        checks_json=result["checks"],
        critical_blockers_count=result["critical_blockers_count"],
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    return {
        "id": record.id,
        "workspace_id": workspace.id,
        "target_url": record.target_url,
        "readiness_score": record.readiness_score,
        "critical_blockers_count": record.critical_blockers_count,
        "checks": record.checks_json,
        "created_at": record.created_at,
    }


@router.get("/{workspace_id}/crawl-audit/latest")
async def get_latest_workspace_crawl_audit(
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    stmt = (
        select(CrawlAudit)
        .where(CrawlAudit.workspace_id == workspace.id)
        .order_by(CrawlAudit.created_at.desc())
        .limit(1)
    )
    record = (await db.execute(stmt)).scalar_one_or_none()
    if not record:
        return {"audit": None}

    return {
        "audit": {
            "id": record.id,
            "workspace_id": record.workspace_id,
            "target_url": record.target_url,
            "readiness_score": record.readiness_score,
            "critical_blockers_count": record.critical_blockers_count,
            "checks": record.checks_json,
            "created_at": record.created_at,
        }
    }


# ==============================================================================
# Engine 2: True Citation Gap Matrix + 1-Click Outreach Engine
# ==============================================================================

@router.get("/{workspace_id}/citation-gaps")
async def list_workspace_citation_gaps(
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await get_workspace_citation_gaps(
        workspace_id=workspace.id,
        brand_domain=workspace.domain_url,
        db=db,
    )


@router.post("/{workspace_id}/citation-gaps/generate-pitch")
async def generate_citation_gap_pitch(
    payload: GapPitchRequest,
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    verify_paid_feature_access(workspace, "Citation Gap 1-Click Outreach Pitch", required_plan="starter")
    pitch_text = await generate_gap_outreach_pitch(
        source_url=payload.source_url,
        source_title=payload.source_title or payload.source_url,
        source_category=payload.source_category,
        brand_name=workspace.brand_name,
        brand_domain=workspace.domain_url,
        competitor_name=payload.competitor_name,
    )

    existing = (
        await db.execute(
            select(CitationGapAction).where(
                CitationGapAction.id == payload.gap_id,
                CitationGapAction.workspace_id == workspace.id,
            )
        )
    ).scalar_one_or_none()

    if existing:
        existing.last_pitch_text = pitch_text
    else:
        from urllib.parse import urlparse

        dom = urlparse(payload.source_url).netloc.lower().lstrip("www.") or payload.source_url
        db.add(
            CitationGapAction(
                id=payload.gap_id,
                workspace_id=workspace.id,
                source_url=payload.source_url,
                source_domain=dom,
                status="open",
                last_pitch_text=pitch_text,
            )
        )
    await db.commit()

    return {"gap_id": payload.gap_id, "pitch_text": pitch_text}


@router.patch("/{workspace_id}/citation-gaps/{gap_id}/status")
async def update_citation_gap_status(
    gap_id: str,
    payload: GapStatusUpdateRequest,
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    existing = (
        await db.execute(
            select(CitationGapAction).where(
                CitationGapAction.id == gap_id,
                CitationGapAction.workspace_id == workspace.id,
            )
        )
    ).scalar_one_or_none()

    if existing:
        existing.status = payload.status
    else:
        db.add(
            CitationGapAction(
                id=gap_id,
                workspace_id=workspace.id,
                source_url=payload.source_url or "",
                source_domain=payload.source_domain or "",
                status=payload.status,
            )
        )
    await db.commit()

    return {"gap_id": gap_id, "status": payload.status}


# ==============================================================================
# Engine 3: Live Competitor-vs-User Page Diff Engine
# ==============================================================================

@router.post("/{workspace_id}/page-diff")
async def execute_workspace_page_diff(
    payload: PageDiffRequest,
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    verify_paid_feature_access(workspace, "Live Competitor Page Diff", required_plan="starter")
    result = await run_live_page_diff(
        user_url=payload.user_url,
        competitor_url=payload.competitor_url,
        manual_competitor_text=payload.manual_competitor_text,
    )

    if not result.get("needs_manual_paste"):
        report = PageDiffReport(
            workspace_id=workspace.id,
            user_url=result["user_url"],
            competitor_url=result["competitor_url"],
            report_json=result,
        )
        db.add(report)
        await db.commit()
        await db.refresh(report)
        result["report_id"] = report.id

    return result
