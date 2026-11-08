"""The response envelope shared by every endpoint, including errors."""

from __future__ import annotations

import time
from typing import Any

from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

from app.trace import TRACE_HEADER, get_trace_id

SUCCESS_CODE = 200


class EnvelopeJSONResponse(JSONResponse):
    media_type = "application/json; charset=utf-8"


def envelope(
    code: int, message: str, data: Any = None, trace_id: str | None = None
) -> dict[str, Any]:
    return {
        "code": code,
        "message": message,
        "data": jsonable_encoder(data) if data is not None else None,
        "timestamp": int(time.time() * 1000),
        "traceId": trace_id or get_trace_id(),
    }


def _headers(
    extra: dict[str, str] | None, trace_id: str | None = None
) -> dict[str, str]:
    headers = {TRACE_HEADER: trace_id or get_trace_id()}
    if extra:
        headers.update(extra)
    return headers


def success(
    data: Any = None,
    message: str = "success",
    status_code: int = 200,
    headers: dict[str, str] | None = None,
    trace_id: str | None = None,
) -> EnvelopeJSONResponse:
    # The other five stacks copy a string payload into both `message` and
    # `data`; keep the envelope identical here instead of special-casing every
    # call site.
    if message == "success" and isinstance(data, str):
        message = data
    return EnvelopeJSONResponse(
        status_code=status_code,
        content=envelope(SUCCESS_CODE, message, data, trace_id),
        headers=_headers(headers, trace_id),
    )


def failure(
    code: int,
    message: str,
    status_code: int,
    data: Any = None,
    headers: dict[str, str] | None = None,
    trace_id: str | None = None,
) -> EnvelopeJSONResponse:
    return EnvelopeJSONResponse(
        status_code=status_code,
        content=envelope(code, message, data, trace_id),
        headers=_headers(headers, trace_id),
    )
