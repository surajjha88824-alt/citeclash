from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, health, workspaces, audits, tickets, growth, billing, webhooks, admin, cron, onboarding, seo, real_results, closed_loop
)

api_router = APIRouter()

# Health check
api_router.include_router(health.router, tags=["Health"])

# Authentication & User Management
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Workspace Management & Tracked Prompts (Strict Isolation)
api_router.include_router(workspaces.router, prefix="/workspaces", tags=["Workspaces"])
api_router.include_router(real_results.router, prefix="/workspaces", tags=["Real Result Engines"])
api_router.include_router(closed_loop.router, prefix="/workspaces", tags=["Closed-Loop Growth System"])

# AI Search / GEO Audits & Citations
api_router.include_router(audits.router, prefix="/audits", tags=["Audits & Citations"])

# Growth Modules (Reddit & Quora Hijacker, 1-Click AI Auto-Fixer)
api_router.include_router(growth.router, prefix="/growth", tags=["Growth Modules"])

# Phase 5: Billing & Subscriptions (Lemon Squeezy / Dodo Payments / Dev Sandbox)
api_router.include_router(billing.router, prefix="/billing", tags=["Billing & Subscriptions"])

# Phase 5: Webhooks (HMAC Signature Verified)
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["Payment Webhooks"])

# Support Tickets & Messages
api_router.include_router(tickets.router, prefix="/tickets", tags=["Support Tickets"])

# Phase 6: Super-Admin Control Panel
api_router.include_router(admin.router, prefix="/admin", tags=["Super Admin"])

# Automated Daily Tracking Cron & Email Notifications
api_router.include_router(cron.router, prefix="/cron", tags=["Automated Cron Jobs"])

# Phase 8: Onboarding Milestone Checklist Progress
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["Onboarding Progress"])

# Phase 9: Technical SEO, AEO & Programmatic Content Engine
api_router.include_router(seo.router, prefix="/seo", tags=["SEO & AEO Engine"])
