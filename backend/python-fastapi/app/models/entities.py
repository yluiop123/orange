"""SQLAlchemy models mirroring ``database/postgres/ddl.sql``."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Identity,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.types import TypeDecorator

# MySQL/MariaDB DATETIME and SQLite have no timezone type: values go in as
# naive UTC and come back the same way. PostgreSQL timestamptz keeps the offset.
_NAIVE_DIALECTS = {"mysql", "mariadb", "sqlite"}


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UTCDateTime(TypeDecorator):
    """Timezone-aware UTC timestamp that behaves identically on every engine."""

    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        value = value.astimezone(timezone.utc)
        if dialect.name in _NAIVE_DIALECTS:
            return value.replace(tzinfo=None)
        return value

    def process_result_value(self, value: datetime | None, dialect) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)


class Base(DeclarativeBase):
    pass


class AuditMixin:
    create_time: Mapped[datetime] = mapped_column(
        UTCDateTime(), default=utcnow, nullable=False
    )
    update_time: Mapped[datetime] = mapped_column(
        UTCDateTime(), default=utcnow, onupdate=utcnow, nullable=False
    )
    created_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    updated_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


sys_role_permission = Table(
    "sys_role_permission",
    Base.metadata,
    Column(
        "role_id",
        String(255),
        ForeignKey("sys_role.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "permission_id",
        String(255),
        ForeignKey("sys_permission.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

sys_user_permission = Table(
    "sys_user_permission",
    Base.metadata,
    Column(
        "user_id",
        String(255),
        ForeignKey("sys_user.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "permission_id",
        String(255),
        ForeignKey("sys_permission.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

sys_user_role = Table(
    "sys_user_role",
    Base.metadata,
    Column(
        "user_id",
        String(255),
        ForeignKey("sys_user.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "role_id",
        String(255),
        ForeignKey("sys_role.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Group(AuditMixin, Base):
    __tablename__ = "sys_group"

    id: Mapped[str] = mapped_column(String(255), primary_key=True)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(255), default="1", nullable=False)
    parent_id: Mapped[Optional[str]] = mapped_column(
        String(255), ForeignKey("sys_group.id", ondelete="RESTRICT"), nullable=True
    )


class Permission(AuditMixin, Base):
    __tablename__ = "sys_permission"

    id: Mapped[str] = mapped_column(String(255), primary_key=True)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    path: Mapped[str] = mapped_column(String(500), nullable=False)
    action: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(255), default="1", nullable=False)
    parent_id: Mapped[Optional[str]] = mapped_column(
        String(255), ForeignKey("sys_permission.id", ondelete="RESTRICT"), nullable=True
    )

    translations: Mapped[list[PermissionI18n]] = relationship(
        back_populates="permission",
        lazy="select",
        order_by="PermissionI18n.locale",
        cascade="all, delete-orphan",
    )


class PermissionI18n(Base):
    __tablename__ = "sys_permission_i18n"

    permission_id: Mapped[str] = mapped_column(
        String(255),
        ForeignKey("sys_permission.id", ondelete="CASCADE"),
        primary_key=True,
    )
    locale: Mapped[str] = mapped_column(String(16), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    permission: Mapped[Permission] = relationship(back_populates="translations")


class Role(AuditMixin, Base):
    __tablename__ = "sys_role"

    id: Mapped[str] = mapped_column(String(255), primary_key=True)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(255), default="1", nullable=False)

    permissions: Mapped[list[Permission]] = relationship(
        secondary=sys_role_permission,
        lazy="select",
        order_by="Permission.id",
    )


class User(AuditMixin, Base):
    __tablename__ = "sys_user"

    id: Mapped[str] = mapped_column(
        String(255), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    username: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    group_id: Mapped[Optional[str]] = mapped_column(
        String(255), ForeignKey("sys_group.id"), nullable=True
    )
    phone: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(255), default="1", nullable=False)
    token_version: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    must_change_password: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    roles: Mapped[list[Role]] = relationship(
        secondary=sys_user_role,
        lazy="select",
        order_by="Role.id",
    )
    permissions: Mapped[list[Permission]] = relationship(
        secondary=sys_user_permission,
        lazy="select",
        order_by="Permission.id",
    )


class RevokedToken(Base):
    __tablename__ = "sys_revoked_token"

    jti: Mapped[str] = mapped_column(String(255), primary_key=True)
    token_type: Mapped[str] = mapped_column(String(32), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False)
    create_time: Mapped[datetime] = mapped_column(
        UTCDateTime(), default=utcnow, nullable=False
    )


class LoginAttempt(Base):
    __tablename__ = "sys_login_attempt"

    attempt_key: Mapped[str] = mapped_column(String(255), primary_key=True)
    failures: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    window_start: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False)
    locked_until: Mapped[Optional[datetime]] = mapped_column(
        UTCDateTime(), nullable=True
    )
    update_time: Mapped[datetime] = mapped_column(
        UTCDateTime(), default=utcnow, nullable=False
    )


class OperationLog(Base):
    __tablename__ = "sys_operation_log"

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        Identity(),
        primary_key=True,
        autoincrement=True,
    )
    trace_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    username: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    method: Mapped[str] = mapped_column(String(16), nullable=False)
    path: Mapped[str] = mapped_column(String(500), nullable=False)
    query_string: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    request_body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_ms: Mapped[int] = mapped_column(BigInteger, nullable=False)
    ip: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    create_time: Mapped[datetime] = mapped_column(
        UTCDateTime(), default=utcnow, nullable=False
    )
