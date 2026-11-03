"""Operation log policy (pure functions) and storage."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import OperationLog
from app.models.entities import utcnow
from app.services.common import page_payload

QUERY_LIMIT = 500
BODY_LIMIT = 4000
SYSTEM_PREFIX = "/api/v1/system/"
PASSWORD_PATH = "/api/v1/auth/change-password"

_SENSITIVE_JSON_FIELD = re.compile(
    r'(?i)("[^"]*(?:password|token|secret)[^"]*"\s*:\s*)"(?:[^"\\]|\\.)*"'
)


def should_record(method: str, path: str) -> bool:
    if method.upper() in {"GET", "OPTIONS"}:
        return False
    return path.startswith(SYSTEM_PREFIX) or path == PASSWORD_PATH


def is_sensitive_path(path: str) -> bool:
    lowered = path.lower()
    return lowered.endswith(
        ("/login", "/refresh", "/change-password", "/reset-password")
    )


def sanitize_body(body: str | None) -> str | None:
    if body is None:
        return None
    redacted = _SENSITIVE_JSON_FIELD.sub(r'\1"***"', body)
    return redacted[:BODY_LIMIT]


def query_string(query: str | None) -> str | None:
    if query is None:
        return None
    return query[:QUERY_LIMIT]


def client_ip(headers: dict[str, str], remote: str | None) -> str | None:
    forwarded = headers.get("x-forwarded-for")
    if forwarded and forwarded.strip():
        return forwarded.split(",", 1)[0].strip()
    return remote


def record(
    db: Session,
    *,
    trace_id: str | None,
    username: str | None,
    method: str,
    path: str,
    query: str | None,
    body: str | None,
    status: int,
    duration_ms: int,
    ip: str | None,
) -> None:
    db.add(
        OperationLog(
            trace_id=trace_id,
            username=username,
            method=method,
            path=path,
            query_string=query_string(query),
            request_body=sanitize_body(body),
            status=status,
            duration_ms=duration_ms,
            ip=ip,
            create_time=utcnow(),
        )
    )
    db.commit()


def query_logs(
    db: Session,
    *,
    username: str | None,
    path: str | None,
    status: str | None,
    from_: datetime | None,
    to: datetime | None,
    page: int,
    size: int,
) -> dict[str, Any]:
    conditions = []
    if username and username.strip():
        conditions.append(
            func.lower(OperationLog.username).contains(username.strip().lower(), autoescape=True)
        )
    if path and path.strip():
        conditions.append(
            func.lower(OperationLog.path).contains(path.strip().lower(), autoescape=True)
        )
    if status and status.strip():
        conditions.append(OperationLog.status == int(status.strip()))
    if from_ is not None:
        conditions.append(OperationLog.create_time >= from_)
    if to is not None:
        conditions.append(OperationLog.create_time <= to)

    total = db.scalar(select(func.count()).select_from(OperationLog).where(*conditions)) or 0
    rows = list(
        db.scalars(
            select(OperationLog)
            .where(*conditions)
            .order_by(OperationLog.id.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
    )
    items = [
        {
            "id": row.id,
            "traceId": row.trace_id,
            "username": row.username,
            "method": row.method,
            "path": row.path,
            "queryString": row.query_string,
            "requestBody": row.request_body,
            "status": row.status,
            "durationMs": row.duration_ms,
            "ip": row.ip,
            "createTime": row.create_time,
        }
        for row in rows
    ]
    return page_payload(total, items, page, size)
