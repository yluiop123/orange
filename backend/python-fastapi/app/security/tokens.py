"""JWT access / refresh tokens and ``jti`` revocation."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import jwt
from sqlalchemy import delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.errors import unauthorized
from app.models import RevokedToken, User

ACCESS = "access"
REFRESH = "refresh"


@dataclass(frozen=True)
class IssuedToken:
    token: str
    jti: str
    expires_at: datetime


@dataclass(frozen=True)
class TokenClaims:
    jti: str
    type: str
    username: str
    subject: str
    version: int
    issued_at: datetime
    expires_at: datetime


def create_token(user: User, token_type: str, expires_seconds: int) -> IssuedToken:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=expires_seconds)
    jti = str(uuid.uuid4())
    payload = {
        "sub": user.id,
        "username": user.username,
        "typ": token_type,
        "ver": user.token_version or 0,
        "jti": jti,
        "iss": settings.jwt_issuer,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return IssuedToken(token=token, jti=jti, expires_at=expires_at)


def decode_token(token: str, expected_type: str) -> TokenClaims:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            issuer=settings.jwt_issuer,
            options={"require": ["exp", "iat", "sub", "jti", "iss"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise unauthorized("登录已过期") from exc
    except jwt.PyJWTError as exc:
        raise unauthorized("登录已过期") from exc

    if payload.get("typ") != expected_type:
        raise unauthorized("登录已过期")

    try:
        return TokenClaims(
            jti=str(payload["jti"]),
            type=str(payload["typ"]),
            username=str(payload["username"]),
            subject=str(payload["sub"]),
            version=int(payload.get("ver", 0)),
            issued_at=datetime.fromtimestamp(int(payload["iat"]), tz=timezone.utc),
            expires_at=datetime.fromtimestamp(int(payload["exp"]), tz=timezone.utc),
        )
    except (KeyError, TypeError, ValueError) as exc:
        raise unauthorized("登录已过期") from exc


def is_revoked(db: Session, jti: str | None) -> bool:
    if not jti:
        return False
    return db.get(RevokedToken, jti) is not None


def revoke_token(
    db: Session, jti: str | None, token_type: str, expires_at: datetime | None
) -> bool:
    """Persist a jti as revoked. Returns False when it was already revoked."""
    if not jti or expires_at is None:
        return False

    now = datetime.now(timezone.utc)
    db.execute(delete(RevokedToken).where(RevokedToken.expires_at < now))
    row = RevokedToken(jti=jti, token_type=token_type, expires_at=expires_at)
    db.add(row)
    try:
        db.commit()
        return True
    except IntegrityError:
        db.rollback()
        return False
