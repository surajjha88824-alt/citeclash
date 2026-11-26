import logging
import httpx
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("citeclash.email")


async def _send_email_payload(to: str, subject: str, html_content: str, text_content: Optional[str] = None):
    """
    Sends transactional email using Resend API or prints to console in dev mode.
    Never throws unhandled exceptions that break core user flows.
    """
    if settings.RESEND_API_KEY and settings.RESEND_API_KEY.startswith("re_"):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "from": settings.EMAIL_FROM,
                        "to": [to],
                        "subject": subject,
                        "html": html_content,
                        "text": text_content or html_content,
                    },
                )
                if res.status_code in (200, 201):
                    logger.info(f"[Email] Dispatched via Resend to {to}: {subject}")
                    return True
                else:
                    logger.warning(f"[Email] Resend API error ({res.status_code}): {res.text}")
        except Exception as e:
            logger.error(f"[Email] Failed sending via Resend: {e}")

    # Fallback to dev console logging
    print("\n" + "=" * 60)
    print(f"[EMAIL] [TRANSACTIONAL EMAIL DISPATCH - DEV SIMULATOR]")
    print(f"To: {to}")
    print(f"From: {settings.EMAIL_FROM}")
    print(f"Subject: {subject}")
    print("-" * 60)
    print(text_content or f"(HTML Email content rendered - {len(html_content)} bytes)")
    print("=" * 60 + "\n")
    return True


async def send_welcome_email(to_email: str, full_name: str):
    """Triggered upon new user registration."""
    subject = "Welcome to CiteClash — Your AI Search Battle Card is Ready"
    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #09090b; color: #f4f4f5; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
        <div style="margin-bottom: 24px;">
            <span style="font-weight: 800; font-size: 20px; color: #a855f7;">CiteClash</span>
            <span style="font-size: 11px; text-transform: uppercase; background: rgba(168,85,247,0.2); color: #d8b4fe; padding: 2px 8px; border-radius: 4px; margin-left: 8px;">GEO Platform</span>
        </div>
        <h2 style="color: #ffffff; margin-top: 0;">Welcome aboard, {full_name}!</h2>
        <p style="color: #a1a1aa; line-height: 1.6;">
            Every day, thousands of high-intent buyers ask ChatGPT, Perplexity, and Google AI Overviews which tools to choose. CiteClash monitors your brand's citation rankings and alerts you when competitors try to jump ahead.
        </p>
        <div style="background: #18181b; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid rgba(255,255,255,0.05);">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #38bdf8;">Your Quick 3-Step Setup:</p>
            <ol style="margin: 0; padding-left: 20px; color: #d4d4d8; font-size: 13px; line-height: 1.8;">
                <li>Track your domain and key competitor websites.</li>
                <li>Benchmark top buying-intent prompts across Perplexity & Gemini.</li>
                <li>Generate your <code>llms.txt</code> file to boost your AI citations.</li>
            </ol>
        </div>
        <a href="{settings.FRONTEND_URL}" style="display: inline-block; background: linear-gradient(135deg, #9333ea, #06b6d4); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">Open My Dashboard →</a>
        <p style="color: #71717a; font-size: 11px; margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
            CiteClash Inc. • Zero AI Hallucination Deterministic Engine
        </p>
    </div>
    """
    text = f"Welcome to CiteClash, {full_name}! Your dashboard is active at: {settings.FRONTEND_URL}"
    return await _send_email_payload(to_email, subject, html, text)


async def send_password_reset_email(to_email: str, reset_token: str):
    """Triggered on forgot-password request."""
    subject = "Reset your CiteClash account password"
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #09090b; color: #f4f4f5; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
        <h2 style="color: #ffffff;">Password Reset Request</h2>
        <p style="color: #a1a1aa; line-height: 1.6;">
            We received a request to reset your password for your CiteClash account. Click the button below to choose a new password:
        </p>
        <div style="margin: 24px 0;">
            <a href="{reset_url}" style="background: #9333ea; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #71717a; font-size: 12px;">This link will expire in 60 minutes. If you did not request this, please ignore this email.</p>
    </div>
    """
    text = f"Reset your CiteClash password using this link: {reset_url} (valid for 60 minutes)"
    return await _send_email_payload(to_email, subject, html, text)


async def send_support_ticket_reply_email(to_email: str, ticket_id: str, ticket_subject: str, reply_text: str):
    """Triggered when super-admin replies to a customer support ticket."""
    subject = f"[Support Update] New reply on ticket: {ticket_subject}"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #09090b; color: #f4f4f5; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
        <h3 style="color: #ffffff; margin-top: 0;">Support Update from CiteClash Engineering</h3>
        <p style="color: #a1a1aa;">Ticket: <strong>{ticket_subject}</strong> (ID: {ticket_id[:8]})</p>
        <div style="background: rgba(168,85,247,0.1); border-left: 4px solid #a855f7; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0; color: #e4e4e7; line-height: 1.6;">
            {reply_text}
        </div>
        <a href="{settings.FRONTEND_URL}" style="display: inline-block; background: #27272a; color: #38bdf8; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600;">View in Support Center →</a>
    </div>
    """
    text = f"Support team replied to ticket '{ticket_subject}':\n\n{reply_text}\n\nView at {settings.FRONTEND_URL}"
    return await _send_email_payload(to_email, subject, html, text)


async def send_weekly_digest_email(to_email: str, brand_name: str, score: float, change_pct: float):
    """Triggered by weekly automated cron digest."""
    subject = f"Weekly GEO Digest: {brand_name} AI Search Visibility Score is {score}%"
    trend_color = "#34d399" if change_pct >= 0 else "#f43f5e"
    trend_arrow = "▲" if change_pct >= 0 else "▼"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #09090b; color: #f4f4f5; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
        <h2 style="color: #ffffff; margin-top: 0;">Weekly AI Visibility Summary</h2>
        <p style="color: #a1a1aa;">Here is how <strong>{brand_name}</strong> performed this week across ChatGPT, Perplexity, and Google AI Overviews:</p>
        <div style="text-align: center; background: #18181b; padding: 28px; border-radius: 12px; margin: 20px 0;">
            <div style="font-size: 48px; font-weight: 800; color: #ffffff; font-family: monospace;">{score}%</div>
            <div style="color: {trend_color}; font-weight: 600; font-size: 14px; margin-top: 4px;">{trend_arrow} {abs(change_pct)}% vs previous week</div>
        </div>
        <a href="{settings.FRONTEND_URL}" style="display: block; text-align: center; background: linear-gradient(135deg, #9333ea, #06b6d4); color: #ffffff; text-decoration: none; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 14px;">Inspect Full Battle Card Matrix</a>
    </div>
    """
    text = f"Weekly GEO Digest for {brand_name}: Visibility Score {score}% ({change_pct}% change). Inspect at {settings.FRONTEND_URL}"
    return await _send_email_payload(to_email, subject, html, text)
