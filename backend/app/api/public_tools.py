from fastapi import APIRouter, Request, status
from pydantic import BaseModel, Field

from app.core.limiter import limiter
from app.services.crawl_auditor import run_live_crawl_audit
from app.services.safe_fetcher import validate_url_ssrf

router = APIRouter()


class PublicCrawlCheckRequest(BaseModel):
    domain_or_url: str = Field(..., min_length=3, max_length=512)


@router.post("/api/public/crawl-check", status_code=status.HTTP_200_OK)
@limiter.limit("5/hour")
async def public_live_crawl_check(
    request: Request,
    payload: PublicCrawlCheckRequest,
):
    """
    Public, IP rate-limited (5/hour) live AI-Bot & Crawlability Checker.
    Enforces SSRF safety via validate_url_ssrf and safe_fetch_url.
    """
    raw = payload.domain_or_url.strip()
    target = raw if raw.startswith(("http://", "https://")) else f"https://{raw}"

    is_safe, err = await validate_url_ssrf(target)
    if not is_safe:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err or "Invalid or unsafe target URL.",
        )

    return await run_live_crawl_audit(target)
