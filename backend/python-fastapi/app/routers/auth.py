"""Authentication endpoints: login, refresh, logout, password, identity, menus."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.envelope import failure, success
from app.errors import ApiError
from app.models import User
from app.models.entities import utcnow
from app.schemas.auth import ChangePasswordIn, LoginIn
from app.security.cookies import COOKIE_NAME, clear_refresh_cookie, set_refresh_cookie
from app.security.dependencies import (
    AuthContext,
    get_auth_context,
    load_user_with_permissions,
)
from app.security.login_attempts import LoginAttemptService, SqlAlchemyAttemptRepository
from app.security.passwords import verify_password
from app.security.tokens import (
    ACCESS,
    REFRESH,
    create_token,
    decode_token,
    is_revoked,
    revoke_token,
)
from app.services.menus import menu_tree
from app.services.users import change_password, user_info_payload

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

RATE_LIMITED_MESSAGE = "登录失败次数过多，请稍后再试"


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded and forwarded.strip():
        return forwarded.split(",", 1)[0].strip()
    return request.client.host if request.client else ""


def _login_payload(access_token: str) -> dict:
    return {
        "token": access_token,
        "status": "ok",
        "field": None,
        "msg": None,
        "expiresIn": settings.access_token_expire_seconds,
        "refreshExpiresIn": settings.refresh_token_expire_seconds,
    }


def _unauthorized_with_cleared_cookie(message: str):
    response = failure(40101, message, 401)
    clear_refresh_cookie(response)
    return response


@router.post("/login")
def login(payload: LoginIn, request: Request, db: Session = Depends(get_db)):
    ip = _client_ip(request)
    attempts = LoginAttemptService(SqlAlchemyAttemptRepository(db))

    if attempts.is_blocked(ip, payload.username):
        return failure(429, RATE_LIMITED_MESSAGE, 429)

    user = db.scalar(select(User).where(User.username == payload.username))
    if (
        user is None
        or user.status == "0"
        or not verify_password(payload.password, user.password)
    ):
        attempts.on_failure(ip, payload.username)
        return _unauthorized_with_cleared_cookie("用户名或密码错误")

    attempts.on_success(ip, payload.username)
    access = create_token(user, ACCESS, settings.access_token_expire_seconds)
    refresh = create_token(user, REFRESH, settings.refresh_token_expire_seconds)

    response = success(_login_payload(access.token))
    set_refresh_cookie(response, refresh.token)
    return response


@router.post("/refresh")
def refresh_token(request: Request, db: Session = Depends(get_db)):
    raw_refresh = request.cookies.get(COOKIE_NAME)
    if not raw_refresh:
        return _unauthorized_with_cleared_cookie("未登录")

    try:
        claims = decode_token(raw_refresh, REFRESH)
    except ApiError:
        return _unauthorized_with_cleared_cookie("登录已过期")

    if is_revoked(db, claims.jti):
        return _unauthorized_with_cleared_cookie("登录已过期")

    user = load_user_with_permissions(db, claims.username)
    if (
        user is None
        or user.status == "0"
        or claims.version != (user.token_version or 0)
        or claims.subject != user.id
    ):
        return _unauthorized_with_cleared_cookie("登录已过期")

    # Rotate: the previous refresh jti is revoked atomically (PK conflict means replay).
    if not revoke_token(db, claims.jti, REFRESH, claims.expires_at):
        return _unauthorized_with_cleared_cookie("登录已过期")

    access = create_token(user, ACCESS, settings.access_token_expire_seconds)
    new_refresh = create_token(user, REFRESH, settings.refresh_token_expire_seconds)
    response = success(_login_payload(access.token))
    set_refresh_cookie(response, new_refresh.token)
    return response


@router.post("/logout")
def logout(
    request: Request,
    auth: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    raw_refresh = request.cookies.get(COOKIE_NAME)
    if raw_refresh:
        try:
            refresh_claims = decode_token(raw_refresh, REFRESH)
            revoke_token(db, refresh_claims.jti, REFRESH, refresh_claims.expires_at)
        except ApiError:
            pass

    revoke_token(db, auth.claims.jti, ACCESS, auth.claims.expires_at)

    user = db.get(User, auth.user.id)
    if user is not None:
        # Bumping the version invalidates every other access/refresh token too.
        user.token_version = (user.token_version or 0) + 1
        user.update_time = utcnow()
        db.commit()

    response = success("ok", message="ok")
    clear_refresh_cookie(response)
    return response


@router.get("/user-info")
def user_info(
    auth: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    return success(user_info_payload(db, auth))


@router.get("/menus")
def menus(
    auth: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    return success(menu_tree(db))


@router.post("/change-password")
def change_password_endpoint(
    payload: ChangePasswordIn,
    auth: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    change_password(
        db,
        auth.user.username,
        payload.old_password,
        payload.new_password,
    )
    response = success("密码已修改，请重新登录")
    clear_refresh_cookie(response)
    return response
