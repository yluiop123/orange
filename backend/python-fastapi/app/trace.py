"""Per-request trace identifiers shared by the body, the header and the log."""

from __future__ import annotations

import re
import uuid
from contextvars import ContextVar

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

TRACE_HEADER = "X-Trace-Id"
LEGACY_TRACE_HEADER = "X-Request-Id"
_SAFE_TRACE_ID = re.compile(r"^[A-Za-z0-9._-]{8,64}$")

_trace_id_var: ContextVar[str | None] = ContextVar("orange_trace_id", default=None)


def new_trace_id() -> str:
    return uuid.uuid4().hex[:16]


def get_trace_id() -> str:
    """Return the current request trace id, generating one when absent."""
    current = _trace_id_var.get()
    if current:
        return current
    generated = new_trace_id()
    _trace_id_var.set(generated)
    return generated


class TraceIdMiddleware(BaseHTTPMiddleware):
    """Accept a caller supplied trace id or generate one, then echo it."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        incoming = request.headers.get(TRACE_HEADER) or request.headers.get(LEGACY_TRACE_HEADER)
        trace_id = incoming if incoming and _SAFE_TRACE_ID.match(incoming) else new_trace_id()

        token = _trace_id_var.set(trace_id)
        request.state.trace_id = trace_id
        try:
            response = await call_next(request)
        finally:
            _trace_id_var.reset(token)

        response.headers[TRACE_HEADER] = trace_id
        return response
