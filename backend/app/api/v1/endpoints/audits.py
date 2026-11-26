import asyncio
from typing import Annotated, List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal, get_db
from app.core.deps import get_current_user, get_workspace_for_user
from app.core.exceptions import AppException, NotFoundException
from app.core.limiter import limiter
from app.models.audit import AuditRun
from app.models.citation import CitationSource
from app.models.prompt import TrackedPrompt
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.audit import AuditRunResponse, CitationSourceResponse
from app.services.brand_lie_detector import scan_audit_for_brand_lies
from app.services.llm_runner import execute_prompt_on_engine, generate_high_intent_prompts
from app.services.scorer import score_audit_citation_async

router = APIRouter()


class AuditRunTriggerRequest(BaseModel):
    workspace_id: Optional[str] = None
    brand_domain: str = Field(..., min_length=2, max_length=512)
    competitor_domain: str = Field(..., min_length=2, max_length=512)
    industry: Optional[str] = "SaaS & Developer Tools"
    prompts: Optional[List[str]] = None


class GeneratePromptsRequest(BaseModel):
    brand_name: str
    website_url: Optional[str] = None
    industry: Optional[str] = "SaaS & Developer Tools"
    competitor_domain: Optional[str] = None


class AuditTriggerResponse(BaseModel):
    audit_run_id: str
    status: str
    message: str


@router.post("/generate-prompts")
async def generate_buyer_prompts(payload: GeneratePromptsRequest):
    """Auto-generate 5 high-intent buyer prompts using Gemini Flash (with local fallback)."""
    prompts = generate_high_intent_prompts(
        brand_domain=payload.website_url or payload.brand_name,
        competitor_domain=payload.competitor_domain or "competitor.com",
        industry=payload.industry or "SaaS & Developer Tools",
    )
    return {"prompts": prompts[:5]}


# ==============================================================================
# Async Background Task Pipeline (Swappable with Celery / Redis Worker)
# ==============================================================================

async def execute_audit_background_job(
    audit_run_id: str,
    brand_domain: str,
    competitor_domain: str,
    industry: Optional[str],
    custom_prompts: Optional[List[str]],
):
    """
    Zero-timeout async background worker.
    Executes multi-engine queries and deterministic Python ranking extraction.
    """
    async with AsyncSessionLocal() as session:
        try:
            # 1. Update status to 'processing'
            stmt = select(AuditRun).where(AuditRun.id == audit_run_id)
            res = await session.execute(stmt)
            audit = res.scalar_one_or_none()
            if not audit:
                return

            audit.status = "processing"
            await session.commit()

            # 5. Automated Post-Audit Brand Lie Scanner (Engine 2)
            if audit.workspace_id:
                try:
                    await scan_audit_for_brand_lies(
                        workspace_id=audit.workspace_id,
                        audit_run_id=audit.id,
                        citations=citations_to_add,
                        db=session,
                    )
                except Exception:
                    pass

            # 2. Determine prompts
            prompts = custom_prompts or generate_high_intent_prompts(
                brand_domain=brand_domain,
                competitor_domain=competitor_domain,
                industry=industry,
            )
            prompts = prompts[:5]  # benchmark top 5 intent prompts

            engines = ["ChatGPT (Search)", "Perplexity AI", "Google AI Overview (Gemini)"]
            brand_scores = []
            competitor_scores = []
            citations_to_add = []

            # 3. Query engines and parse deterministically
            for idx, prompt_text in enumerate(prompts):
                engine_name = engines[idx % len(engines)]
                engine_result = await execute_prompt_on_engine(
                    prompt=prompt_text,
                    brand_domain=brand_domain,
                    competitor_domain=competitor_domain,
                    preferred_engine=engine_name,
                )

                raw_text = engine_result["response_text"]
                structured_urls = engine_result.get("cited_urls")

                # 3-Tier Hybrid Scorer (Deterministic Tier 1/2 + LLM Disambiguation Tier 3)
                scored = await score_audit_citation_async(
                    raw_response=raw_text,
                    brand_domain=brand_domain,
                    competitor_domain=competitor_domain,
                    industry=industry or "SaaS",
                    cited_urls=structured_urls,
                )

                brand_scores.append(scored.brand_score)
                competitor_scores.append(scored.competitor_score)

                citation = CitationSource(
                    audit_run_id=audit.id,
                    engine_name=engine_result["engine_name"],
                    prompt_text=prompt_text,
                    brand_mentioned=scored.brand_mentioned,
                    brand_rank=scored.brand_rank,
                    competitor_mentioned=scored.competitor_mentioned,
                    sentiment=scored.sentiment,
                    cited_urls_json=scored.cited_urls,
                    raw_response=raw_text,
                )
                citations_to_add.append(citation)

            session.add_all(citations_to_add)

            # 4. Final aggregate visibility calculation
            overall_brand = round(sum(brand_scores) / max(len(brand_scores), 1), 1)
            overall_comp = round(sum(competitor_scores) / max(len(competitor_scores), 1), 1)

            audit.overall_visibility_score = overall_brand
            audit.competitor_score = overall_comp
            audit.status = "completed"
            audit.raw_results_json = {
                "total_prompts": len(prompts),
                "brand_avg_visibility": f"{overall_brand}%",
                "competitor_avg_visibility": f"{overall_comp}%",
                "rank_1_mentions": sum(1 for c in citations_to_add if c.brand_rank == 1),
                "analyzed_engines": list(set(c.engine_name for c in citations_to_add)),
            }

            # Update workspace counters if workspace exists
            if audit.workspace_id:
                ws_res = await session.execute(
                    select(Workspace).where(Workspace.id == audit.workspace_id)
                )
                ws = ws_res.scalar_one_or_none()
                if ws:
                    ws.prompts_used_this_month += len(prompts)

            await session.commit()

            # 5. Automated Post-Audit Brand Lie Scanner (Engine 2)
            if audit.workspace_id:
                try:
                    await scan_audit_for_brand_lies(
                        workspace_id=audit.workspace_id,
                        audit_run_id=audit.id,
                        citations=citations_to_add,
                        db=session,
                    )
                except Exception:
                    pass

        except Exception as e:
            await session.rollback()
            # Mark audit as failed with error log
            err_res = await session.execute(
                select(AuditRun).where(AuditRun.id == audit_run_id)
            )
            audit_rec = err_res.scalar_one_or_none()
            if audit_rec:
                audit_rec.status = "failed"
                audit_rec.raw_results_json = {"error": str(e)}
                await session.commit()

            # 5. Automated Post-Audit Brand Lie Scanner (Engine 2)
            if audit.workspace_id:
                try:
                    await scan_audit_for_brand_lies(
                        workspace_id=audit.workspace_id,
                        audit_run_id=audit.id,
                        citations=citations_to_add,
                        db=session,
                    )
                except Exception:
                    pass


# ==============================================================================
# Endpoints
# ==============================================================================

@router.post("/run", response_model=AuditTriggerResponse, status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("25/minute")
async def trigger_audit_run(
    request: Request,
    payload: AuditRunTriggerRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Triggers an async Battle Card scan or Workspace Audit.
    Creates audit record with status 'queued' and dispatches background worker in <100ms.
    """
    workspace_id = payload.workspace_id
    if not workspace_id:
        ws_res = await db.execute(select(Workspace).limit(1))
        first_ws = ws_res.scalar_one_or_none()
        if first_ws:
            workspace_id = first_ws.id
        else:
            dummy_ws = Workspace(
                owner_id="system-audit",
                brand_name=payload.brand_domain,
                domain_url=payload.brand_domain,
                plan_tier="free",
                subscription_status="active",
            )
            db.add(dummy_ws)
            await db.flush()
            workspace_id = dummy_ws.id

    audit = AuditRun(
        workspace_id=workspace_id,
        competitor_domain=payload.competitor_domain.strip().lower(),
        status="queued",
    )
    db.add(audit)
    await db.commit()
    await db.refresh(audit)

    # Dispatch to background task worker
    background_tasks.add_task(
        execute_audit_background_job,
        audit_run_id=audit.id,
        brand_domain=payload.brand_domain,
        competitor_domain=payload.competitor_domain,
        industry=payload.industry,
        custom_prompts=payload.prompts,
    )

    return AuditTriggerResponse(
        audit_run_id=audit.id,
        status="queued",
        message="Battle audit job successfully queued. Check status via polling endpoint.",
    )


@router.get("/{audit_run_id}", response_model=AuditRunResponse)
async def poll_audit_status(
    audit_run_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Polling endpoint for audit runs.
    Frontend polls every 2.5s until status is 'completed' or 'failed'.
    """
    stmt = (
        select(AuditRun)
        .options(selectinload(AuditRun.citations))
        .where(AuditRun.id == audit_run_id)
    )
    res = await db.execute(stmt)
    audit = res.scalar_one_or_none()

    if not audit:
        raise NotFoundException(f"Audit run '{audit_run_id}' not found")

    return AuditRunResponse.model_validate(audit)
