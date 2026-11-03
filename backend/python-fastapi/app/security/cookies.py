"""The rotating HttpOnly refresh cookie."""

from __future__ import annotations

from fastapi import Response

from app.config import settings

COOKIE_NAME = "refresh_token"


def _same_site() -> str:
    value = (settings.cookie_same_site or "lax").lower()
    return value if value in {"lax", "strict", "none"} else "lax"


def set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=settings.refresh_token_expire_seconds,
        path=settings.cookie_path,
        domain=settings.cookie_domain or None,
        secure=settings.cookie_secure,
        httponly=True,
        samesite=_same_site(),
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=COOKIE_NAME,
        path=settings.cookie_path,
        domain=settings.cookie_domain or None,
        secure=settings.cookie_secure,
        httponly=True,
        samesite=_same_site(),
    )
