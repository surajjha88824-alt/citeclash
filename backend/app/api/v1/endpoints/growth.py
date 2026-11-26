from typing import Annotated, Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.prompt import TrackedPrompt
from app.models.workspace import Workspace
from app.services.autofix_service import (
    generate_geo_content_brief,
    generate_jsonld_schemas,
    generate_llms_txt_file,
)
from app.services.hijacker_service import (
    discover_community_discussions_async,
    draft_value_first_community_reply,
)

router = APIRouter()


# ------------------------------------------------------------------------------
# Schemas
# ------------------------------------------------------------------------------

class ReplyDraftRequest(BaseModel):
    thread_title: str
    thread_context: str
    brand_name: str = "Supabase"
    brand_domain: str = "supabase.com"
    competitor_domain: str = "firebase.google.com"
    platform: str = "reddit"
    subreddit: str = "r/SaaS"
    competitor_mentioned: Optional[str] = None
    brand_usp: Optional[str] = None


class ReplyDraftResponse(BaseModel):
    reply_text: str
    thread_title: str


class LLMsTxtRequest(BaseModel):
    brand_name: str = "Supabase"
    brand_domain: str = "supabase.com"
    industry: str = "SaaS & Developer Tools"


class SchemaRequest(BaseModel):
    brand_name: str = "Supabase"
    brand_domain: str = "supabase.com"
    industry: str = "SaaS & Developer Tools"


class ContentBriefRequest(BaseModel):
    prompt_text: str = Field(..., min_length=3)
    brand_name: str = "Supabase"
    competitor_name: str = "Firebase"


# ------------------------------------------------------------------------------
# Hijacker Endpoints
# ------------------------------------------------------------------------------

@router.get("/hijacker/threads")
async def get_hijacker_threads(
    db: Annotated[AsyncSession, Depends(get_db)],
    niche: str = Query("SaaS & Developer Tools"),
    brand_domain: str = Query("supabase.com"),
    competitor_domain: str = Query("firebase.google.com"),
    brand_name: Optional[str] = Query(None),
    workspace_id: Optional[str] = Query(None),
    refresh: bool = Query(False),
):
    """
    Search and return 100% real, live Reddit and Quora discussions where competitors are mentioned.
    Uses Serper.dev Google Search (with DuckDuckGo free fallback) and 24-hour DB caching.
    """
    resolved_niche = niche
    resolved_brand_name = brand_name
    tracked_prompts: List[str] = []

    if workspace_id:
        ws_res = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
        ws = ws_res.scalar_one_or_none()
        if ws:
            resolved_niche = ws.industry or resolved_niche
            resolved_brand_name = ws.brand_name or resolved_brand_name
            p_res = await db.execute(
                select(TrackedPrompt.prompt_text).where(
                    TrackedPrompt.workspace_id == ws.id,
                    TrackedPrompt.is_active == True,
                )
            )
            tracked_prompts = [row[0] for row in p_res.all()]

    result = await discover_community_discussions_async(
        niche=resolved_niche,
        competitor_domain=competitor_domain,
        brand_domain=brand_domain,
        brand_name=resolved_brand_name,
        workspace_id=workspace_id or "default",
        tracked_prompts=tracked_prompts or None,
        refresh=refresh,
        db=db,
    )
    return result


@router.post("/hijacker/reply", response_model=ReplyDraftResponse)
async def create_hijacker_reply(payload: ReplyDraftRequest):
    """
    Draft a value-first, non-spammy community response naturally positioning the user's brand.
    """
    reply = await draft_value_first_community_reply(
        thread_title=payload.thread_title,
        thread_context=payload.thread_context,
        brand_name=payload.brand_name,
        brand_domain=payload.brand_domain,
        competitor_domain=payload.competitor_domain,
        platform=payload.platform,
        subreddit=payload.subreddit,
        competitor_mentioned=payload.competitor_mentioned,
        brand_usp=payload.brand_usp,
    )
    return ReplyDraftResponse(reply_text=reply, thread_title=payload.thread_title)


# ------------------------------------------------------------------------------
# AI Auto-Fixer Endpoints
# ------------------------------------------------------------------------------

@router.post("/autofix/llms-txt")
async def get_llms_txt(payload: LLMsTxtRequest):
    """
    Generate authoritative standard 'llms.txt' file tailored for AI search crawlers.
    """
    content = generate_llms_txt_file(
        brand_name=payload.brand_name,
        brand_domain=payload.brand_domain,
        industry=payload.industry,
    )
    return {"llms_txt": content, "filename": "llms.txt"}


@router.post("/autofix/jsonld")
async def get_jsonld_schemas(payload: SchemaRequest):
    """
    Generate validated Schema.org Organization and FAQPage schemas.
    """
    schemas = generate_jsonld_schemas(
        brand_name=payload.brand_name,
        brand_domain=payload.brand_domain,
        industry=payload.industry,
    )
    return schemas


@router.post("/autofix/brief")
async def get_content_brief(payload: ContentBriefRequest):
    """
    Generate structured SEO/GEO content brief for prompts where brand is missing or trailing.
    """
    brief = generate_geo_content_brief(
        prompt_text=payload.prompt_text,
        brand_name=payload.brand_name,
        competitor_name=payload.competitor_name,
    )
    return brief
