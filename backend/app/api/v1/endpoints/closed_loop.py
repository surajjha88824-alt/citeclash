import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated, Any, Dict, List, Literal, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_workspace_for_user
from app.core.exceptions import NotFoundException
from app.core.plan_limits import verify_paid_feature_access
from app.services.roi_enhancements import (
    build_executive_roi_summary,
    generate_buyer_intent_prompt_suggestions,
)
from app.models.audit import AuditRun
from app.models.closed_loop import (
    AiReferralVisit,
    AppliedFix,
    BrandGroundTruth,
    BrandLieAlert,
)
from app.models.real_results import CrawlAudit
from app.models.workspace import Workspace
from app.services.brand_lie_detector import (
    auto_extract_ground_truths_from_website,
    generate_corrective_kit_for_alert,
)
from app.services.citation_gap_service import get_workspace_citation_gaps
from app.services.fix_loop_service import recheck_applied_fix, verify_fix_live

router = APIRouter()


# ==============================================================================
# Schemas
# ==============================================================================

class CreateAppliedFixRequest(BaseModel):
    fix_type: Literal["llms_txt", "faq_schema", "robots_txt", "page_diff", "reddit_reply", "outreach_pitch"]
    title: str = Field(..., min_length=2, max_length=255)
    target_url: str = Field(..., min_length=3, max_length=1024)
    affected_prompt_ids: Optional[List[str]] = None


class CreateGroundTruthRequest(BaseModel):
    category: Literal["pricing", "features", "integrations", "target_audience", "positioning"] = "features"
    fact_statement: str = Field(..., min_length=3, max_length=2000)


class LieStatusUpdateRequest(BaseModel):
    status: Literal["open", "fixing", "resolved"]


class PixelConfigUpdateRequest(BaseModel):
    conversion_paths: List[str]


# ==============================================================================
# Engine 1: Closed-Loop Fix Verification & Plan-B Endpoints
# ==============================================================================

@router.get("/{workspace_id}/fixes")
async def list_workspace_fixes(
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    res = await db.execute(
        select(AppliedFix)
        .where(AppliedFix.workspace_id == workspace.id)
        .order_by(AppliedFix.created_at.desc())
    )
    fixes = res.scalars().all()

    wins = [f for f in fixes if f.status == "won"]
    needs_attention = [f for f in fixes if f.status in ("verify_failed", "stalled_pivoted")]
    deltas = [f.score_delta for f in fixes if f.score_delta is not None]
    avg_lift = round(sum(deltas) / len(deltas), 1) if deltas else 0.0

    return {
        "fixes": [
            {
                "id": f.id,
                "workspace_id": f.workspace_id,
                "fix_type": f.fix_type,
                "title": f.title,
                "target_url": f.target_url,
                "baseline_visibility_score": f.baseline_visibility_score,
                "status": f.status,
                "instant_check_result": f.instant_check_result_json,
                "is_indexed": f.is_indexed,
                "recheck_due_at": f.recheck_due_at,
                "last_rechecked_at": f.last_rechecked_at,
                "current_visibility_score": f.current_visibility_score,
                "score_delta": f.score_delta,
                "diagnosis_code": f.diagnosis_code,
                "plan_b": f.plan_b_json,
                "created_at": f.created_at,
            }
            for f in fixes
        ],
        "kpis": {
            "active_fixes": len(fixes),
            "verified_wins": len(wins),
            "needs_attention": len(needs_attention),
            "avg_visibility_lift": avg_lift,
        },
    }


@router.post("/{workspace_id}/fixes", status_code=status.HTTP_201_CREATED)
async def create_and_verify_fix(
    payload: CreateAppliedFixRequest,
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    last_audit = (
        await db.execute(
            select(AuditRun)
            .where(AuditRun.workspace_id == workspace.id, AuditRun.status == "completed")
            .order_by(AuditRun.created_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    baseline = float(last_audit.overall_visibility_score or 0.0) if last_audit else 0.0

    target_url = payload.target_url.strip()
    if not target_url.startswith(("http://", "https://")):
        target_url = f"https://{target_url}"

    fix = AppliedFix(
        workspace_id=workspace.id,
        fix_type=payload.fix_type,
        title=payload.title.strip(),
        target_url=target_url,
        affected_prompt_ids_json=payload.affected_prompt_ids or [],
        baseline_visibility_score=baseline,
        status="pending_verify",
        recheck_due_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(fix)
    await db.commit()
    await db.refresh(fix)

    fix = await verify_fix_live(fix=fix, brand_name=workspace.brand_name, db=db)

    return {
        "id": fix.id,
        "status": fix.status,
        "instant_check_result": fix.instant_check_result_json,
        "baseline_visibility_score": fix.baseline_visibility_score,
        "recheck_due_at": fix.recheck_due_at,
    }


@router.post("/{workspace_id}/fixes/{fix_id}/verify-now")
async def verify_fix_now_endpoint(
    fix_id: str,
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    fix = (
        await db.execute(
            select(AppliedFix).where(
                AppliedFix.id == fix_id,
                AppliedFix.workspace_id == workspace.id,
            )
        )
    ).scalar_one_or_none()
    if not fix:
        raise NotFoundException("Applied fix not found")

    fix = await verify_fix_live(fix=fix, brand_name=workspace.brand_name, db=db)
    return {
        "id": fix.id,
        "status": fix.status,
        "instant_check_result": fix.instant_check_result_json,
    }


@router.post("/{workspace_id}/fixes/{fix_id}/recheck")
async def recheck_fix_impact_endpoint(
    fix_id: str,
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    verify_paid_feature_access(workspace, "Closed-Loop Fix Recheck", required_plan="starter")
    fix = (
        await db.execute(
            select(AppliedFix).where(
                AppliedFix.id == fix_id,
                AppliedFix.workspace_id == workspace.id,
            )
        )
    ).scalar_one_or_none()
    if not fix:
        raise NotFoundException("Applied fix not found")

    fix = await recheck_applied_fix(fix=fix, workspace=workspace, db=db)
    return {
        "id": fix.id,
        "status": fix.status,
        "is_indexed": fix.is_indexed,
        "current_visibility_score": fix.current_visibility_score,
        "score_delta": fix.score_delta,
        "diagnosis_code": fix.diagnosis_code,
        "plan_b": fix.plan_b_json,
    }


# ==============================================================================
# Engine 2: AI Hallucination & Brand Lie Detector Endpoints
# ==============================================================================

@router.get("/{workspace_id}/ground-truths")
async def list_ground_truths(
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    res = await db.execute(
        select(BrandGroundTruth)
        .where(BrandGroundTruth.workspace_id == workspace.id)
        .order_by(BrandGroundTruth.created_at.desc())
    )
    items = res.scalars().all()
    return {
        "ground_truths": [
            {
                "id": g.id,
                "category": g.category,
                "fact_statement": g.fact_statement,
                "is_active": g.is_active,
                "created_at": g.created_at,
            }
            for g in items
        ]
    }


@router.post("/{workspace_id}/ground-truths", status_code=status.HTTP_201_CREATED)
async def create_ground_truth(
    payload: CreateGroundTruthRequest,
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    verify_paid_feature_access(workspace, "AI Brand Lie Guard", required_plan="starter")
    gt = BrandGroundTruth(
        workspace_id=workspace.id,
        category=payload.category,
        fact_statement=payload.fact_statement.strip(),
        is_active=True,
    )
    db.add(gt)
    await db.commit()
    await db.refresh(gt)
    return {
        "id": gt.id,
        "category": gt.category,
        "fact_statement": gt.fact_statement,
        "is_active": gt.is_active,
        "created_at": gt.created_at,
    }


@router.delete("/{workspace_id}/ground-truths/{truth_id}")
async def delete_ground_truth(
    truth_id: str,
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    gt = (
        await db.execute(
            select(BrandGroundTruth).where(
                BrandGroundTruth.id == truth_id,
                BrandGroundTruth.workspace_id == workspace.id,
            )
        )
    ).scalar_one_or_none()
    if not gt:
        raise NotFoundException("Ground truth fact not found")
    await db.delete(gt)
    await db.commit()
    return {"deleted": True, "id": truth_id}


@router.post("/{workspace_id}/ground-truths/auto-extract")
async def auto_extract_ground_truths(
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    verify_paid_feature_access(workspace, "AI Brand Lie Guard", required_plan="starter")
    proposed = await auto_extract_ground_truths_from_website(
        domain_url=workspace.domain_url,
        brand_name=workspace.brand_name,
    )
    return {"proposed_facts": proposed}


@router.get("/{workspace_id}/brand-lies")
async def list_brand_lie_alerts(
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    res = await db.execute(
        select(BrandLieAlert)
        .where(BrandLieAlert.workspace_id == workspace.id)
        .order_by(BrandLieAlert.created_at.desc())
    )
    alerts = res.scalars().all()
    return {
        "alerts": [
            {
                "id": a.id,
                "engine_name": a.engine_name,
                "prompt_text": a.prompt_text,
                "ai_false_claim": a.ai_false_claim,
                "actual_truth": a.actual_truth,
                "severity": a.severity,
                "suspected_source_url": a.suspected_source_url,
                "corrective_kit": a.corrective_kit_json,
                "status": a.status,
                "created_at": a.created_at,
            }
            for a in alerts
        ],
        "open_count": sum(1 for a in alerts if a.status == "open"),
    }


@router.post("/{workspace_id}/brand-lies/{alert_id}/generate-fix")
async def generate_brand_lie_fix_kit(
    alert_id: str,
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    verify_paid_feature_access(workspace, "Brand Lie Corrective Kit", required_plan="starter")
    alert = (
        await db.execute(
            select(BrandLieAlert).where(
                BrandLieAlert.id == alert_id,
                BrandLieAlert.workspace_id == workspace.id,
            )
        )
    ).scalar_one_or_none()
    if not alert:
        raise NotFoundException("Brand lie alert not found")

    kit = await generate_corrective_kit_for_alert(
        alert=alert,
        brand_name=workspace.brand_name,
        brand_domain=workspace.domain_url,
    )
    alert.corrective_kit_json = kit
    if alert.status == "open":
        alert.status = "fixing"
    await db.commit()
    return {"alert_id": alert.id, "corrective_kit": kit, "status": alert.status}


@router.patch("/{workspace_id}/brand-lies/{alert_id}/status")
async def update_brand_lie_status(
    alert_id: str,
    payload: LieStatusUpdateRequest,
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    alert = (
        await db.execute(
            select(BrandLieAlert).where(
                BrandLieAlert.id == alert_id,
                BrandLieAlert.workspace_id == workspace.id,
            )
        )
    ).scalar_one_or_none()
    if not alert:
        raise NotFoundException("Brand lie alert not found")
    alert.status = payload.status
    await db.commit()
    return {"alert_id": alert.id, "status": alert.status}


# ==============================================================================
# Engine 3: AI Referral Traffic & Pixel Analytics Endpoints
# ==============================================================================

@router.get("/{workspace_id}/ai-traffic")
async def get_workspace_ai_traffic(
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    days: int = Query(30, ge=1, le=365),
):
    if not workspace.pixel_key:
        workspace.pixel_key = f"cc_px_{secrets.token_urlsafe(12)}"
        await db.commit()
        await db.refresh(workspace)

    since = datetime.now(timezone.utc) - timedelta(days=days)
    res = await db.execute(
        select(AiReferralVisit)
        .where(
            AiReferralVisit.workspace_id == workspace.id,
            AiReferralVisit.created_at >= since,
        )
        .order_by(AiReferralVisit.created_at.asc())
    )
    visits = res.scalars().all()

    pageviews = [v for v in visits if v.event_type == "pageview"]
    conversions = [v for v in visits if v.event_type == "conversion"]
    total_visitors = len(pageviews)
    total_conversions = len(conversions)
    conv_rate = round((total_conversions / total_visitors) * 100, 1) if total_visitors > 0 else 0.0

    # Breakdown by AI engine
    engine_counts: Dict[str, Dict[str, int]] = {}
    for v in visits:
        bucket = engine_counts.setdefault(v.ai_source, {"visitors": 0, "conversions": 0})
        if v.event_type == "conversion":
            bucket["conversions"] += 1
        else:
            bucket["visitors"] += 1

    by_engine = [
        {"engine": k, "visitors": val["visitors"], "conversions": val["conversions"]}
        for k, val in sorted(engine_counts.items(), key=lambda x: x[1]["visitors"], reverse=True)
    ]
    top_engine = by_engine[0]["engine"] if by_engine else "None yet"

    # Daily time-series
    daily_map: Dict[str, Dict[str, Any]] = {}
    for v in visits:
        day_str = v.created_at.strftime("%b %d")
        bucket = daily_map.setdefault(day_str, {"day": day_str, "visitors": 0, "conversions": 0})
        if v.event_type == "conversion":
            bucket["conversions"] += 1
        else:
            bucket["visitors"] += 1
    daily_series = list(daily_map.values())

    # Top landing pages
    lp_map: Dict[str, Dict[str, Any]] = {}
    for v in visits:
        b = lp_map.setdefault(v.landing_path, {"path": v.landing_path, "visitors": 0, "conversions": 0})
        if v.event_type == "conversion":
            b["conversions"] += 1
        else:
            b["visitors"] += 1
    top_landing_pages = sorted(lp_map.values(), key=lambda x: x["visitors"], reverse=True)[:10]

    last_event_at = visits[-1].created_at if visits else None

    return {
        "pixel_key": workspace.pixel_key,
        "conversion_paths": workspace.conversion_paths_json or ["/signup", "/register", "/checkout", "/thank-you", "/demo"],
        "pixel_verified": len(visits) > 0,
        "last_event_at": last_event_at,
        "total_visitors": total_visitors,
        "total_conversions": total_conversions,
        "conversion_rate": conv_rate,
        "top_engine": top_engine,
        "by_engine": by_engine,
        "daily_series": daily_series,
        "top_landing_pages": top_landing_pages,
    }


@router.patch("/{workspace_id}/ai-traffic/config")
async def update_pixel_config(
    payload: PixelConfigUpdateRequest,
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    verify_paid_feature_access(workspace, "AI Referral Traffic Pixel", required_plan="starter")
    cleaned = [p.strip() for p in payload.conversion_paths if p.strip()]
    workspace.conversion_paths_json = cleaned
    await db.commit()
    return {"conversion_paths": workspace.conversion_paths_json}


@router.post("/{workspace_id}/ai-traffic/send-test-ping")
async def send_test_pixel_ping(
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    verify_paid_feature_access(workspace, "AI Referral Traffic Pixel", required_plan="starter")
    if not workspace.pixel_key:
        workspace.pixel_key = f"cc_px_{secrets.token_urlsafe(12)}"

    salt = hashlib.sha256(f"test|{workspace.id}|{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()[:32]
    db.add(
        AiReferralVisit(
            workspace_id=workspace.id,
            ai_source="perplexity",
            referrer_domain="perplexity.ai",
            landing_path="/",
            event_type="pageview",
            session_hash=salt,
        )
    )
    db.add(
        AiReferralVisit(
            workspace_id=workspace.id,
            ai_source="chatgpt",
            referrer_domain="chatgpt.com",
            landing_path="/signup",
            event_type="conversion",
            session_hash=salt,
        )
    )
    await db.commit()
    return {"ok": True, "message": "Test AI referral pageview + conversion recorded."}


# ==============================================================================
# Overview Dashboard: Top 3 Moves & Chart Action Pins
# ==============================================================================

@router.get("/{workspace_id}/top-moves")
async def get_workspace_top_moves(
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    moves: List[Dict[str, Any]] = []

    # 1. Open Brand Lies first
    lies = (
        await db.execute(
            select(BrandLieAlert)
            .where(BrandLieAlert.workspace_id == workspace.id, BrandLieAlert.status == "open")
            .order_by(BrandLieAlert.created_at.desc())
            .limit(2)
        )
    ).scalars().all()
    for l in lies:
        moves.append({
            "id": f"lie-{l.id}",
            "priority": "Critical" if l.severity == "critical" else "High",
            "title": f"Fix {l.engine_name} Brand Lie: {l.ai_false_claim[:64]}",
            "impact": "+12% Trust & Conversion",
            "time_estimate": "5 mins",
            "target_tab": "brand-guard",
        })

    # 2. Failed or Stalled Plan B Pivots
    pivots = (
        await db.execute(
            select(AppliedFix)
            .where(
                AppliedFix.workspace_id == workspace.id,
                AppliedFix.status.in_(["verify_failed", "stalled_pivoted"]),
            )
            .order_by(AppliedFix.created_at.desc())
            .limit(2)
        )
    ).scalars().all()
    for p in pivots:
        plan_b = p.plan_b_json or {}
        moves.append({
            "id": f"fix-{p.id}",
            "priority": "High",
            "title": plan_b.get("pivot_action_title") or f"Resolve Fix: {p.title}",
            "impact": "+8–15% Visibility",
            "time_estimate": "10 mins",
            "target_tab": plan_b.get("target_route") or "fix-tracker",
        })

    # 3. Top Citation Gaps / Crawl Blockers
    if len(moves) < 3:
        crawl = (
            await db.execute(
                select(CrawlAudit)
                .where(CrawlAudit.workspace_id == workspace.id)
                .order_by(CrawlAudit.created_at.desc())
                .limit(1)
            )
        ).scalar_one_or_none()
        if crawl and crawl.critical_blockers_count > 0:
            moves.append({
                "id": f"crawl-{crawl.id}",
                "priority": "Critical",
                "title": f"Unblock {crawl.critical_blockers_count} Critical AI Crawler Blocker(s)",
                "impact": "+20% Crawlability",
                "time_estimate": "5 mins",
                "target_tab": "crawl-audit",
            })

    if len(moves) < 3:
        gaps_data = await get_workspace_citation_gaps(workspace.id, workspace.domain_url, db)
        for g in gaps_data.get("gaps", [])[:3 - len(moves)]:
            moves.append({
                "id": f"gap-{g['id']}",
                "priority": "Medium",
                "title": f"Pitch {g['domain']} ({g['source_category']})",
                "impact": f"+{min(18, g['citation_frequency'] * 5)}% Citation Share",
                "time_estimate": "5 mins",
                "target_tab": "citation-gaps",
            })

    # Milestone Pins for Overview Chart
    pins_res = await db.execute(
        select(AppliedFix)
        .where(
            AppliedFix.workspace_id == workspace.id,
            AppliedFix.status.in_(["verified_live", "indexed", "won"]),
        )
        .order_by(AppliedFix.created_at.asc())
    )
    pins = [
        {
            "id": f.id,
            "title": f.title,
            "status": f.status,
            "day": f.created_at.strftime("%b %d"),
            "score_delta": f.score_delta,
        }
        for f in pins_res.scalars().all()
    ]

    return {"top_moves": moves[:3], "chart_pins": pins}


# ==============================================================================
# Part 2 Enhancements: Buyer-Intent Prompt Suggester & Executive ROI Summary
# ==============================================================================

class SuggestPromptsRequest(BaseModel):
    competitors: Optional[List[str]] = None


@router.post("/{workspace_id}/prompts/suggest")
async def suggest_buyer_intent_prompts(
    payload: SuggestPromptsRequest,
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
):
    """
    Generate 8-10 high-intent buyer prompts grouped by intent
    (Best-of / Category, vs Competitor, Pricing & Alternatives, Use-Case Specific).
    """
    return await generate_buyer_intent_prompt_suggestions(
        brand_name=workspace.brand_name,
        domain_url=workspace.domain_url,
        industry=workspace.industry,
        competitors=payload.competitors,
    )


@router.get("/{workspace_id}/roi-summary")
async def get_workspace_roi_summary(
    workspace: Annotated[Workspace, Depends(get_workspace_for_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    days: int = Query(30, ge=1, le=365),
):
    """
    Executive ROI Summary aggregating visibility delta, verified wins,
    open brand lies, AI referral visitors & conversions, competitor movements, and Plan-B actions.
    """
    return await build_executive_roi_summary(workspace=workspace, days=days, db=db)
