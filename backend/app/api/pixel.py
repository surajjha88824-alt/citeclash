import hashlib
import json
import re
from datetime import datetime, timezone
from typing import Annotated, Optional
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, Request, Response, status
from fastapi.responses import PlainTextResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.limiter import limiter
from app.models.closed_loop import AiReferralVisit
from app.models.workspace import Workspace

router = APIRouter()

AI_DOMAIN_MAP = {
    "chatgpt.com": "chatgpt",
    "chat.openai.com": "chatgpt",
    "perplexity.ai": "perplexity",
    "gemini.google.com": "gemini",
    "claude.ai": "claude",
    "copilot.microsoft.com": "copilot",
    "you.com": "other_ai",
    "phind.com": "other_ai",
}


def classify_ai_source(referrer: str, utm_source: str = "") -> tuple[str, str]:
    """
    Deterministically classify AI referral source & clean referrer domain.
    Returns: (ai_source, referrer_domain)
    """
    ref_clean = (referrer or "").strip().lower()
    dom = ""
    if ref_clean:
        parsed = urlparse(ref_clean if "://" in ref_clean else f"https://{ref_clean}")
        dom = parsed.netloc.lstrip("www.")
        for key, src in AI_DOMAIN_MAP.items():
            if dom == key or dom.endswith("." + key):
                return src, dom

    utm = (utm_source or "").strip().lower()
    if "chatgpt" in utm or "openai" in utm:
        return "chatgpt", dom or "chatgpt.com"
    if "perplexity" in utm:
        return "perplexity", dom or "perplexity.ai"
    if "gemini" in utm:
        return "gemini", dom or "gemini.google.com"
    if "claude" in utm:
        return "claude", dom or "claude.ai"
    if "copilot" in utm:
        return "copilot", dom or "copilot.microsoft.com"

    return "other_ai", dom or "direct"


PIXEL_JS_TEMPLATE = r"""(function(){try{var s=document.currentScript||document.querySelector('script[data-key^="cc_px_"]');if(!s)return;var k=s.getAttribute('data-key');if(!k)return;var u=new URL(s.src).origin+'/api/track/visit';var ref=document.referrer||'';var q=new URLSearchParams(location.search);var utm=q.get('utm_source')||'';var map={'chatgpt.com':'chatgpt','chat.openai.com':'chatgpt','perplexity.ai':'perplexity','gemini.google.com':'gemini','claude.ai':'claude','copilot.microsoft.com':'copilot','you.com':'other_ai','phind.com':'other_ai'};var src='';var rdom='';if(ref){try{rdom=new URL(ref).hostname.replace(/^www\./,'').toLowerCase();for(var d in map){if(rdom===d||rdom.endsWith('.'+d)){src=map[d];break;}}}catch(e){}}if(!src&&utm){var ul=utm.toLowerCase();if(ul.indexOf('chatgpt')>-1||ul.indexOf('openai')>-1)src='chatgpt';else if(ul.indexOf('perplexity')>-1)src='perplexity';else if(ul.indexOf('gemini')>-1)src='gemini';else if(ul.indexOf('claude')>-1)src='claude';else if(ul.indexOf('copilot')>-1)src='copilot';}if(src){sessionStorage.setItem('cc_ai_src',src);sessionStorage.setItem('cc_ai_ref',rdom||utm);}else{src=sessionStorage.getItem('cc_ai_src')||'';rdom=sessionStorage.getItem('cc_ai_ref')||'';}if(!src)return;var send=function(ev){var p=JSON.stringify({pixel_key:k,ai_source:src,referrer_domain:rdom||src,landing_path:location.pathname||'/',event_type:ev,utm_source:utm});if(navigator.sendBeacon){navigator.sendBeacon(u,p);}else{fetch(u,{method:'POST',mode:'cors',keepalive:true,headers:{'Content-Type':'text/plain'},body:p}).catch(function(){});}};var conv=['/signup','/register','/checkout','/thank-you','/demo'];var lp=(location.pathname||'/').toLowerCase();var isConv=conv.some(function(c){return lp.indexOf(c)>-1;});if(!sessionStorage.getItem('cc_pv_sent')){sessionStorage.setItem('cc_pv_sent','1');send('pageview');}if(isConv){send('conversion');}window.citeclashTrack=function(ev){send(ev||'conversion');};}catch(e){}})();"""


@router.get("/pixel.js")
async def serve_pixel_js():
    return Response(
        content=PIXEL_JS_TEMPLATE,
        media_type="application/javascript",
        headers={
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.options("/api/track/visit")
async def track_visit_preflight():
    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    )


@router.post("/api/track/visit", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("120/minute")
async def ingest_ai_referral_visit(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    cors_headers = {"Access-Control-Allow-Origin": "*"}
    raw_body = await request.body()
    if not raw_body:
        return Response(status_code=status.HTTP_400_BAD_REQUEST, headers=cors_headers)

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception:
        return Response(status_code=status.HTTP_400_BAD_REQUEST, headers=cors_headers)

    pixel_key = (payload.get("pixel_key") or "").strip()
    if not pixel_key:
        return Response(status_code=status.HTTP_400_BAD_REQUEST, headers=cors_headers)

    ws = (
        await db.execute(select(Workspace).where(Workspace.pixel_key == pixel_key))
    ).scalar_one_or_none()
    if not ws:
        return Response(status_code=status.HTTP_404_NOT_FOUND, headers=cors_headers)

    raw_ref = str(payload.get("referrer_domain") or payload.get("referrer") or "")
    raw_utm = str(payload.get("utm_source") or "")
    ai_source, ref_domain = classify_ai_source(raw_ref, raw_utm)
    if payload.get("ai_source") in ("chatgpt", "perplexity", "gemini", "claude", "copilot", "other_ai"):
        ai_source = payload["ai_source"]

    landing_path = str(payload.get("landing_path") or "/")[:1024]
    event_type = "conversion" if payload.get("event_type") == "conversion" else "pageview"

    # Privacy-first daily salted hash (ZERO raw IP or PII stored)
    day_salt = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    ua_short = (request.headers.get("user-agent") or "")[:64]
    session_hash = hashlib.sha256(
        f"{day_salt}|{pixel_key}|{ai_source}|{ua_short}".encode("utf-8")
    ).hexdigest()[:32]

    visit = AiReferralVisit(
        workspace_id=ws.id,
        ai_source=ai_source,
        referrer_domain=ref_domain[:255],
        landing_path=landing_path,
        event_type=event_type,
        session_hash=session_hash,
    )
    db.add(visit)
    await db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT, headers=cors_headers)
