"""Request authentication, the forced-password gate and authority checks."""

from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.errors import ApiError, PASSWORD_CHANGE_REQUIRED, forbidden, unauthorized
from app.models import Permission, Role, User
from app.policies.effective_permissions import EffectivePermissions
from app.security.tokens import ACCESS, TokenClaims, decode_token, is_revoked

ALLOWED_BEFORE_PASSWORD_CHANGE = {
    "/api/v1/auth/user-info",
    "/api/v1/auth/menus",
    "/api/v1/auth/change-password",
    "/api/v1/auth/logout",
}


@dataclass
class AuthContext:
    user: User
    claims: TokenClaims
    effective: EffectivePermissions

    @property
    def authorities(self) -> set[str]:
        return self.effective.authority_set

    @property
    def role_ids(self) -> set[str]:
        return {role.id for role in self.effective.roles}

    @property
    def is_super(self) -> bool:
        return "super" in self.role_ids

    def has_authority(self, authority: str) -> bool:
        return authority in self.authorities


def load_user_with_permissions(db: Session, username: str) -> User | None:
    statement = (
        select(User)
        .where(User.username == username)
        .options(
            selectinload(User.roles).selectinload(Role.permissions),
            selectinload(User.permissions),
        )
    )
    return db.scalar(statement)


def load_user_by_id(db: Session, user_id: str) -> User | None:
    statement = (
        select(User)
        .where(User.id == user_id)
        .options(
            selectinload(User.roles).selectinload(Role.permissions),
            selectinload(User.permissions),
        )
    )
    return db.scalar(statement)


def _bearer_token(request: Request) -> str:
    header = request.headers.get("authorization")
    if not header or not header.lower().startswith("bearer "):
        raise unauthorized("未登录")
    token = header[7:].strip()
    if not token:
        raise unauthorized("未登录")
    return token


def get_auth_context(request: Request, db: Session = Depends(get_db)) -> AuthContext:
    claims = decode_token(_bearer_token(request), ACCESS)
    if is_revoked(db, claims.jti):
        raise unauthorized("登录已过期")

    user = load_user_with_permissions(db, claims.username)
    if user is None or user.status == "0":
        raise unauthorized("登录已过期")
    if claims.subject != user.id:
        raise unauthorized("登录已过期")
    if claims.version != (user.token_version or 0):
        raise unauthorized("登录已过期")

    path = request.url.path.rstrip("/") or "/"
    if user.must_change_password and path not in ALLOWED_BEFORE_PASSWORD_CHANGE:
        raise ApiError(
            "请先修改初始密码",
            PASSWORD_CHANGE_REQUIRED,
            http_status=403,
        )

    request.state.username = user.username
    effective = EffectivePermissions.of(user)
    return AuthContext(user=user, claims=claims, effective=effective)


def require(auth: AuthContext, authority: str) -> None:
    if not auth.has_authority(authority):
        raise forbidden("无权限")


def authority(required: str):
    """Dependency that enforces one authority before body/query validation.

    Declaring the check as a dependency (instead of calling `require` inside the
    handler) keeps the documented pipeline: authentication, then authorization,
    then DTO validation. An unauthorized caller must not be able to probe
    parameter rules.
    """

    def dependency(auth: AuthContext = Depends(get_auth_context)) -> AuthContext:
        require(auth, required)
        return auth

    return dependency


def get_optional_auth_context(
    request: Request, db: Session = Depends(get_db)
) -> AuthContext | None:
    """Authentication for logout: a missing or expired token is not an error."""
    header = request.headers.get("authorization")
    if not header or not header.lower().startswith("bearer "):
        return None
    try:
        return get_auth_context(request, db)
    except ApiError:
        return None


def authorities_of(permissions: list[Permission]) -> set[str]:
    return {permission.id for permission in permissions}
