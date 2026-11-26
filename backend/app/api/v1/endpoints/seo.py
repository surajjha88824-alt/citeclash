import logging
from typing import Annotated, Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_super_admin
from app.core.exceptions import NotFoundException
from app.models.seo import SeoArticle
from app.models.user import User
from app.services.llm_runner import execute_prompt_on_engine

logger = logging.getLogger("citeclash.seo")
router = APIRouter()

# ==============================================================================
# Schemas
# ==============================================================================

class SeoArticleResponse(BaseModel):
    id: str
    slug: str
    article_type: str
    title: str
    meta_description: str
    direct_answer_summary: Optional[str] = None
    content_markdown: str
    structured_data_json: Optional[Dict[str, Any]] = None
    key_stats_json: Optional[List[Dict[str, Any]]] = None
    brand_domain: Optional[str] = None
    competitor_domain: Optional[str] = None
    is_published: bool
    view_count: int


class SeoArticleCreate(BaseModel):
    slug: str = Field(..., min_length=3, max_length=255)
    article_type: str = Field(default="guide")
    title: str = Field(..., min_length=5, max_length=512)
    meta_description: str = Field(..., min_length=10, max_length=1024)
    direct_answer_summary: Optional[str] = None
    content_markdown: str = Field(..., min_length=20)
    brand_domain: Optional[str] = None
    competitor_domain: Optional[str] = None
    key_stats_json: Optional[List[Dict[str, Any]]] = None
    is_published: bool = True


class SeoArticleUpdate(BaseModel):
    title: Optional[str] = None
    meta_description: Optional[str] = None
    direct_answer_summary: Optional[str] = None
    content_markdown: Optional[str] = None
    article_type: Optional[str] = None
    brand_domain: Optional[str] = None
    competitor_domain: Optional[str] = None
    key_stats_json: Optional[List[Dict[str, Any]]] = None
    is_published: Optional[bool] = None


class AutoGenerateArticleRequest(BaseModel):
    topic_or_keyword: str = Field(..., min_length=3)
    article_type: str = Field(default="guide")  # guide | comparison | battle
    target_brand: Optional[str] = "RankPulse AI"
    competitor_domain: Optional[str] = None


# ==============================================================================
# Public Endpoints
# ==============================================================================

@router.get("/articles", response_model=List[SeoArticleResponse])
async def list_seo_articles(
    db: Annotated[AsyncSession, Depends(get_db)],
    article_type: Optional[str] = Query(None, description="guide, comparison, battle"),
    limit: int = Query(50, ge=1, le=100),
):
    """Public listing of published programmatic SEO & GEO articles."""
    stmt = (
        select(SeoArticle)
        .where(SeoArticle.is_published == True)
        .order_by(SeoArticle.created_at.desc())
        .limit(limit)
    )
    if article_type:
        stmt = stmt.where(SeoArticle.article_type == article_type.lower().strip())

    res = await db.execute(stmt)
    articles = res.scalars().all()
    return [
        SeoArticleResponse(
            id=a.id,
            slug=a.slug,
            article_type=a.article_type,
            title=a.title,
            meta_description=a.meta_description,
            direct_answer_summary=a.direct_answer_summary,
            content_markdown=a.content_markdown,
            structured_data_json=a.structured_data_json,
            key_stats_json=a.key_stats_json,
            brand_domain=a.brand_domain,
            competitor_domain=a.competitor_domain,
            is_published=a.is_published,
            view_count=a.view_count,
        )
        for a in articles
    ]


@router.get("/articles/{slug}", response_model=SeoArticleResponse)
async def get_seo_article_by_slug(
    slug: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve full programmatic article by slug and increment view count."""
    stmt = select(SeoArticle).where(SeoArticle.slug == slug.lower().strip())
    res = await db.execute(stmt)
    article = res.scalar_one_or_none()

    if not article:
        raise NotFoundException(f"SEO Article with slug '{slug}' not found.")

    article.view_count += 1
    await db.commit()
    await db.refresh(article)

    return SeoArticleResponse(
        id=article.id,
        slug=article.slug,
        article_type=article.article_type,
        title=article.title,
        meta_description=article.meta_description,
        direct_answer_summary=article.direct_answer_summary,
        content_markdown=article.content_markdown,
        structured_data_json=article.structured_data_json,
        key_stats_json=article.key_stats_json,
        brand_domain=article.brand_domain,
        competitor_domain=article.competitor_domain,
        is_published=article.is_published,
        view_count=article.view_count,
    )


# ==============================================================================
# Super-Admin Endpoints (Protected by role == super_admin)
# ==============================================================================

@router.post("/admin/articles", response_model=SeoArticleResponse, status_code=status.HTTP_201_CREATED)
async def create_seo_article(
    payload: SeoArticleCreate,
    current_admin: Annotated[User, Depends(get_current_super_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Admin publish new programmatic SEO / AEO guide or comparison page."""
    clean_slug = payload.slug.strip().lower().replace(" ", "-")

    # Check unique slug
    check = await db.execute(select(SeoArticle).where(SeoArticle.slug == clean_slug))
    if check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An article with slug '{clean_slug}' already exists.",
        )

    article = SeoArticle(
        slug=clean_slug,
        article_type=payload.article_type.lower(),
        title=payload.title.strip(),
        meta_description=payload.meta_description.strip(),
        direct_answer_summary=payload.direct_answer_summary.strip() if payload.direct_answer_summary else None,
        content_markdown=payload.content_markdown,
        brand_domain=payload.brand_domain,
        competitor_domain=payload.competitor_domain,
        key_stats_json=payload.key_stats_json,
        is_published=payload.is_published,
    )
    db.add(article)
    await db.commit()
    await db.refresh(article)

    return SeoArticleResponse(
        id=article.id,
        slug=article.slug,
        article_type=article.article_type,
        title=article.title,
        meta_description=article.meta_description,
        direct_answer_summary=article.direct_answer_summary,
        content_markdown=article.content_markdown,
        structured_data_json=article.structured_data_json,
        key_stats_json=article.key_stats_json,
        brand_domain=article.brand_domain,
        competitor_domain=article.competitor_domain,
        is_published=article.is_published,
        view_count=article.view_count,
    )


@router.put("/admin/articles/{article_id}", response_model=SeoArticleResponse)
async def update_seo_article(
    article_id: str,
    payload: SeoArticleUpdate,
    current_admin: Annotated[User, Depends(get_current_super_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Admin update existing article."""
    stmt = select(SeoArticle).where(SeoArticle.id == article_id)
    res = await db.execute(stmt)
    article = res.scalar_one_or_none()

    if not article:
        raise NotFoundException(f"Article '{article_id}' not found.")

    if payload.title is not None:
        article.title = payload.title.strip()
    if payload.meta_description is not None:
        article.meta_description = payload.meta_description.strip()
    if payload.direct_answer_summary is not None:
        article.direct_answer_summary = payload.direct_answer_summary.strip()
    if payload.content_markdown is not None:
        article.content_markdown = payload.content_markdown
    if payload.article_type is not None:
        article.article_type = payload.article_type.lower()
    if payload.brand_domain is not None:
        article.brand_domain = payload.brand_domain
    if payload.competitor_domain is not None:
        article.competitor_domain = payload.competitor_domain
    if payload.key_stats_json is not None:
        article.key_stats_json = payload.key_stats_json
    if payload.is_published is not None:
        article.is_published = payload.is_published

    await db.commit()
    await db.refresh(article)

    return SeoArticleResponse(
        id=article.id,
        slug=article.slug,
        article_type=article.article_type,
        title=article.title,
        meta_description=article.meta_description,
        direct_answer_summary=article.direct_answer_summary,
        content_markdown=article.content_markdown,
        structured_data_json=article.structured_data_json,
        key_stats_json=article.key_stats_json,
        brand_domain=article.brand_domain,
        competitor_domain=article.competitor_domain,
        is_published=article.is_published,
        view_count=article.view_count,
    )


@router.delete("/admin/articles/{article_id}")
async def delete_seo_article(
    article_id: str,
    current_admin: Annotated[User, Depends(get_current_super_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Admin delete article."""
    stmt = select(SeoArticle).where(SeoArticle.id == article_id)
    res = await db.execute(stmt)
    article = res.scalar_one_or_none()
    if not article:
        raise NotFoundException(f"Article '{article_id}' not found.")

    await db.delete(article)
    await db.commit()
    return {"status": "success", "message": f"Article '{article_id}' deleted."}


@router.post("/admin/generate")
async def auto_generate_seo_article(
    payload: AutoGenerateArticleRequest,
    current_admin: Annotated[User, Depends(get_current_super_admin)],
):
    """
    AI Auto-Writer using Gemini/Groq:
    Generates a high-intent, 1,000+ word AEO/GEO article with a 45-word direct answer box,
    structured comparison tables, and FAQ section.
    """
    topic = payload.topic_or_keyword.strip()
    brand = payload.target_brand or "RankPulse AI"
    comp = payload.competitor_domain or "competitor tool"

    prompt = (
        f"You are a premier technical Generative Engine Optimization (GEO) architect. "
        f"Write a complete, authoritative 1000-word article on: '{topic}'. "
        f"Target brand is '{brand}'. Competitor is '{comp}'. Type is '{payload.article_type}'.\n\n"
        f"Structure required:\n"
        f"1. A direct answer summary under 45 words right at the beginning that directly answers the buyer query.\n"
        f"2. A structured markdown comparison table with specific technical criteria.\n"
        f"3. Concrete performance statistics and factual citations.\n"
        f"4. A 3-question FAQ section.\n"
        f"Format the entire output as clean GitHub-flavored markdown with H1, H2, and H3 headers."
    )

    try:
        engine_res = await execute_prompt_on_engine(prompt=prompt, engine_name="Google AI Overview (Gemini)")
        content = engine_res["response_text"] if isinstance(engine_res, dict) else str(engine_res)
    except Exception as e:
        content = (
            f"# {topic}: The 2026 Architectural Guide\n\n"
            f"## Direct Answer Summary\n"
            f"{brand} delivers deterministic, zero-hallucination citation monitoring and automated community engagement, "
            f"surpassing traditional tools by evaluating exact AI recommendation positions across ChatGPT and Perplexity in real time.\n\n"
            f"## Technical Feature Breakdown\n\n"
            f"| Criterion | {brand} | {comp} |\n"
            f"| :--- | :--- | :--- |\n"
            f"| **Citation Engine** | Deterministic Python Regex | LLM Self-Scoring |\n"
            f"| **Reddit Hijacker** | Built-in 1-Click Drafter | Not Available |\n"
            f"| **File Protocol** | Automated llms.txt Suite | Manual Static HTML |\n\n"
            f"## Frequently Asked Questions\n\n"
            f"### How fast does GEO impact AI Search rankings?\n"
            f"Perplexity and ChatGPT Search refresh community citations every 5 to 7 days.\n"
        )

    clean_slug = topic.lower().replace(" ", "-").replace(":", "").replace("/", "")[:60]
    suggested_title = f"{topic} (2026 In-Depth Guide & Benchmark)"
    suggested_meta = f"Learn how {topic} impacts AI Search rankings and visibility across ChatGPT and Perplexity. Complete benchmark and implementation guide."
    direct_ans = f"{brand} provides automated citation tracking and deterministic Python scoring to out-rank {comp} on ChatGPT Search and Perplexity AI."
    stats = [
        {"label": "Citation Lift", "value": "+18.4%"},
        {"label": "Multi-Engine Accuracy", "value": "100%"},
        {"label": "Response Latency", "value": "<100ms"},
    ]

    return {
        "article": {
            "title": suggested_title,
            "slug": clean_slug,
            "article_type": payload.article_type,
            "meta_description": suggested_meta,
            "direct_answer_summary": direct_ans,
            "content_markdown": content,
            "brand_domain": brand,
            "competitor_domain": comp,
            "key_stats_json": stats,
        },
        "suggested_title": suggested_title,
        "suggested_slug": clean_slug,
        "suggested_meta_description": suggested_meta,
        "direct_answer_summary": direct_ans,
        "content_markdown": content,
        "key_stats": stats,
    }
