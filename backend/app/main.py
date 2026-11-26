from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, PlainTextResponse, Response
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import select, text
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import AsyncSessionLocal, Base, engine
from app.core.exceptions import setup_exception_handlers
from app.core.limiter import limiter
from app.core.security import get_password_hash
from app.models.user import User
from app.core.seo_seed import seed_default_seo_articles
from app.core.seo_renderer import (
    generate_llms_txt,
    generate_llms_full_txt,
    generate_sitemap_xml,
    is_search_or_ai_bot,
    render_crawler_html,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist in DB (useful for SQLite local dev or new PostgreSQL DB)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Idempotent column migration for existing workspaces table
        for col_sql in (
            "ALTER TABLE workspaces ADD COLUMN pixel_key VARCHAR(64)",
            "ALTER TABLE workspaces ADD COLUMN conversion_paths_json JSON",
        ):
            try:
                await conn.execute(text(col_sql))
            except Exception:
                pass

    # Backfill pixel_key for any legacy workspaces missing one
    import secrets
    from app.models.workspace import Workspace
    async with AsyncSessionLocal() as session:
        ws_res = await session.execute(select(Workspace).where(Workspace.pixel_key.is_(None)))
        legacy_ws = ws_res.scalars().all()
        for ws in legacy_ws:
            ws.pixel_key = f"cc_px_{secrets.token_urlsafe(12)}"
            if not ws.conversion_paths_json:
                ws.conversion_paths_json = ["/signup", "/register", "/checkout", "/thank-you", "/demo"]
        if legacy_ws:
            await session.commit()

    # Seed initial super-admin if configured and not yet present
    if settings.FIRST_SUPER_ADMIN_EMAIL and settings.FIRST_SUPER_ADMIN_PASSWORD:
        async with AsyncSessionLocal() as session:
            stmt = select(User).where(User.email == settings.FIRST_SUPER_ADMIN_EMAIL.lower().strip())
            result = await session.execute(stmt)
            admin = result.scalar_one_or_none()
            if not admin:
                super_admin = User(
                    email=settings.FIRST_SUPER_ADMIN_EMAIL.lower().strip(),
                    password_hash=get_password_hash(settings.FIRST_SUPER_ADMIN_PASSWORD),
                    full_name=settings.FIRST_SUPER_ADMIN_NAME,
                    role="super_admin",
                    auth_provider="email",
                    is_active=True,
                )
                session.add(super_admin)
                await session.commit()
                print(f"[CiteClash] Initial super-admin provisioned: {settings.FIRST_SUPER_ADMIN_EMAIL}")

    # Seed programmatic SEO/GEO articles
    async with AsyncSessionLocal() as session:
        await seed_default_seo_articles(session)

    yield

    # Shutdown
    await engine.dispose()


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version="1.0.0",
        description="CiteClash Backend API - AI Search / GEO Visibility & Competitor Battle-Card Platform",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        lifespan=lifespan,
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Bot detection & semantic HTML prerender middleware
    @app.middleware("http")
    async def bot_prerender_middleware(request: Request, call_next):
        user_agent = request.headers.get("user-agent", "")
        path = request.url.path

        # If user agent is a search or AI bot and requesting non-API/non-static route
        if (
            is_search_or_ai_bot(user_agent)
            and not path.startswith("/api/")
            and not path.startswith("/docs")
            and not path.startswith("/redoc")
            and not path.startswith("/openapi.json")
            and not path.endswith(".xml")
            and not path.endswith(".txt")
            and not path.endswith(".json")
        ):
            async with AsyncSessionLocal() as session:
                rendered = await render_crawler_html(path, session)
                if rendered:
                    return HTMLResponse(content=rendered, status_code=200)

        return await call_next(request)

    # Rate limiting setup
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # Setup global exception handlers
    setup_exception_handlers(app)

    # Include API router
    app.include_router(api_router, prefix=settings.API_V1_STR)
    from app.api.v1.endpoints import cron
    from app.api import pixel, public_tools
    app.include_router(cron.router, prefix="/api/cron", tags=["Automated Cron Jobs"])
    app.include_router(pixel.router, tags=["AI Referral Pixel"])
    app.include_router(public_tools.router, tags=["Public Free Tools"])

    # Root Level Technical SEO & LLM Ingestion Endpoints
    @app.get("/llms.txt", tags=["SEO & AEO"])
    async def get_llms_txt():
        """Standardized llms.txt protocol endpoint for AI search crawlers."""
        return PlainTextResponse(generate_llms_txt(), media_type="text/plain; charset=utf-8")

    @app.get("/llms-full.txt", tags=["SEO & AEO"])
    async def get_llms_full_txt():
        """Comprehensive llms-full.txt protocol endpoint for deep LLM ingestion."""
        return PlainTextResponse(generate_llms_full_txt(), media_type="text/plain; charset=utf-8")

    @app.get("/sitemap.xml", tags=["SEO & AEO"])
    async def get_sitemap():
        """Dynamic XML sitemap indexing all published battle cards, guides, and comparisons."""
        async with AsyncSessionLocal() as session:
            xml_content = await generate_sitemap_xml(session)
            return Response(content=xml_content, media_type="application/xml")

    @app.get("/", tags=["Root"])
    async def root():
        return {
            "name": settings.PROJECT_NAME,
            "version": "1.0.0",
            "status": "online",
            "docs": "/docs",
            "api": settings.API_V1_STR,
            "llms_txt": "/llms.txt",
            "sitemap": "/sitemap.xml",
        }

    return app


app = create_application()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
