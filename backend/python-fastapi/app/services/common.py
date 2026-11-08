"""Query helpers shared by the services."""

from __future__ import annotations

import math
from collections.abc import Mapping, Sequence
from typing import Any

from sqlalchemy import ColumnElement

from app.errors import bad_request, invalid


def like_prefix(value: str) -> str:
    """Escape LIKE wildcards and build a case-insensitive prefix pattern."""
    escaped = (
        (value or "")
        .lower()
        .replace("\\", "\\\\")
        .replace("%", "\\%")
        .replace("_", "\\_")
    )
    return escaped + "%"


def prefix_filter(column: Any, value: str) -> ColumnElement[bool]:
    return column.ilike(like_prefix(value), escape="\\")


def split_ids(raw: str | None) -> list[str]:
    if not raw:
        return []
    return [item.strip() for item in raw.split(",") if item.strip()]


def required_ids(raw: str | None) -> list[str]:
    """The `?ids=` batch-delete parameter: missing or blank is a 40001."""
    ids = split_ids(raw)
    if not ids:
        raise bad_request("ids 不能为空")
    return ids


def normalize_status(status: str | None) -> str | None:
    """``None``, blank and ``all`` mean "no status filter"."""
    if status is None:
        return None
    value = status.strip()
    if value in {"", "all"}:
        return None
    return value


def resolve_sort(
    sort: str | None,
    direction: str | None,
    whitelist: Mapping[str, Any],
    default_field: str,
) -> tuple[Any, bool]:
    """Return (column, ascending) following the Java whitelist fallback rules."""
    requested = (sort or "").strip()
    explicit = requested in whitelist
    field = requested if explicit else default_field
    column = whitelist[field]

    requested_direction = (direction or "").strip().lower()
    if requested_direction not in {"", "asc", "desc"}:
        raise invalid("排序方向只能是 asc 或 desc")
    if requested_direction == "":
        return column, explicit
    return column, requested_direction == "asc"


def page_payload(total: int, items: Sequence[Any], page: int, size: int) -> dict[str, Any]:
    return {
        "total": total,
        "list": list(items),
        "page": page,
        "size": size,
        "totalPages": 0 if total == 0 else math.ceil(total / size),
    }
