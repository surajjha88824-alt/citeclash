import asyncio
import ipaddress
import socket
from typing import Any, Dict, Optional, Tuple
from urllib.parse import urljoin, urlparse

import httpx

DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (compatible; CiteClashBot/1.0; +https://citeclash.com/bot) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)

WAF_BODY_SIGNATURES = (
    "cf-browser-verification",
    "attention required! | cloudflare",
    "just a moment...",
    "checking your browser before accessing",
    "ddos-guard",
    "perimeterx",
    "access denied | cloudflare",
)


def is_safe_ip(ip_str: str) -> bool:
    """Return True only if IP is globally routable (not private, loopback, link-local, etc.)."""
    try:
        ip_obj = ipaddress.ip_address(ip_str)
    except ValueError:
        return False

    if (
        ip_obj.is_private
        or ip_obj.is_loopback
        or ip_obj.is_link_local
        or ip_obj.is_multicast
        or ip_obj.is_reserved
        or ip_obj.is_unspecified
    ):
        return False

    # Also explicitly check IPv4-mapped IPv6 addresses
    if isinstance(ip_obj, ipaddress.IPv6Address) and ip_obj.ipv4_mapped:
        return is_safe_ip(str(ip_obj.ipv4_mapped))

    return True


def _resolve_and_validate_host_sync(hostname: str) -> Tuple[bool, Optional[str]]:
    if not hostname:
        return False, "Missing hostname"

    clean_host = hostname.strip("[]")
    # Direct IP literal check
    try:
        ipaddress.ip_address(clean_host)
        if not is_safe_ip(clean_host):
            return False, f"Blocked private/reserved IP address: {clean_host}"
        return True, None
    except ValueError:
        pass

    if clean_host.lower() in ("localhost", "localhost.localdomain"):
        return False, "Blocked localhost address"

    try:
        addr_info = socket.getaddrinfo(clean_host, None)
    except socket.gaierror as exc:
        return False, f"DNS resolution failed for {clean_host}: {exc}"

    if not addr_info:
        return False, f"No DNS records found for {clean_host}"

    for family, _, _, _, sockaddr in addr_info:
        ip_str = sockaddr[0]
        # Strip IPv6 zone index if present
        ip_str = ip_str.split("%")[0]
        if not is_safe_ip(ip_str):
            return False, f"Blocked private/reserved resolved IP: {ip_str}"

    return True, None


async def validate_url_ssrf(url: str) -> Tuple[bool, Optional[str]]:
    """Validate URL scheme (http/https) and ensure resolved IP is public."""
    if not url or not isinstance(url, str):
        return False, "Empty URL"

    parsed = urlparse(url.strip())
    if parsed.scheme.lower() not in ("http", "https"):
        return False, f"Unsupported URL scheme: {parsed.scheme}"

    if not parsed.hostname:
        return False, "Invalid URL: missing hostname"

    return await asyncio.to_thread(_resolve_and_validate_host_sync, parsed.hostname)


def _detect_waf_block(status_code: int, body_lower: str) -> bool:
    if any(sig in body_lower for sig in WAF_BODY_SIGNATURES):
        return True
    if status_code in (403, 429) and ("cloudflare" in body_lower or "captcha" in body_lower or "access denied" in body_lower or len(body_lower) < 8000):
        return True
    if status_code == 503 and ("cloudflare" in body_lower or "just a moment" in body_lower):
        return True
    return False


async def safe_fetch_url(
    url: str,
    timeout: float = 8.0,
    max_bytes: int = 2_000_000,
) -> Dict[str, Any]:
    """
    SSRF-safe async HTTP fetcher.
    - Validates http/https scheme and resolves DNS to reject private/loopback/link-local IPs.
    - Follows up to 3 redirects, re-validating every redirect target.
    - Caps body size at max_bytes (2MB default).
    - Detects Cloudflare/WAF challenges cleanly without throwing unhandled exceptions.
    """
    current_url = url.strip()
    if not current_url.startswith(("http://", "https://")):
        current_url = f"https://{current_url}"

    headers = {
        "User-Agent": DEFAULT_USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,text/plain,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=False) as client:
            for _ in range(4):  # initial request + up to 3 redirects
                is_safe, err = await validate_url_ssrf(current_url)
                if not is_safe:
                    return {
                        "ok": False,
                        "status_code": None,
                        "final_url": current_url,
                        "html": None,
                        "content_type": "",
                        "blocked_by_waf": False,
                        "error": err or "SSRF validation failed",
                    }

                async with client.stream("GET", current_url, headers=headers) as resp:
                    status_code = resp.status_code
                    if status_code in (301, 302, 303, 307, 308):
                        location = resp.headers.get("location") or resp.headers.get("Location")
                        if not location:
                            return {
                                "ok": False,
                                "status_code": status_code,
                                "final_url": current_url,
                                "html": None,
                                "content_type": resp.headers.get("content-type", ""),
                                "blocked_by_waf": False,
                                "error": "Redirect response missing Location header",
                            }
                        current_url = urljoin(current_url, location)
                        continue

                    chunks = []
                    total_bytes = 0
                    async for chunk in resp.aiter_bytes():
                        if total_bytes + len(chunk) > max_bytes:
                            remaining = max_bytes - total_bytes
                            if remaining > 0:
                                chunks.append(chunk[:remaining])
                            break
                        chunks.append(chunk)
                        total_bytes += len(chunk)

                    raw_bytes = b"".join(chunks)
                    encoding = resp.encoding or "utf-8"
                    text = raw_bytes.decode(encoding, errors="replace")
                    content_type = (resp.headers.get("content-type") or "").lower()
                    blocked = _detect_waf_block(status_code, text[:20000].lower())

                    return {
                        "ok": 200 <= status_code < 400 and not blocked,
                        "status_code": status_code,
                        "final_url": str(resp.url),
                        "html": text,
                        "content_type": content_type,
                        "blocked_by_waf": blocked,
                        "error": "Blocked by WAF / Cloudflare challenge" if blocked else (
                            None if 200 <= status_code < 400 else f"HTTP {status_code}"
                        ),
                    }

            return {
                "ok": False,
                "status_code": None,
                "final_url": current_url,
                "html": None,
                "content_type": "",
                "blocked_by_waf": False,
                "error": "Too many redirects (exceeded 3 hops)",
            }
    except httpx.TimeoutException:
        return {
            "ok": False,
            "status_code": None,
            "final_url": current_url,
            "html": None,
            "content_type": "",
            "blocked_by_waf": False,
            "error": f"Request timed out after {timeout}s",
        }
    except Exception as exc:
        return {
            "ok": False,
            "status_code": None,
            "final_url": current_url,
            "html": None,
            "content_type": "",
            "blocked_by_waf": False,
            "error": str(exc),
        }
