"""ASGI middleware that records audited writes after the response is produced."""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

from app.db import SessionLocal
from app.services.operation_logs import (
    client_ip,
    is_sensitive_path,
    record,
    should_record,
)
from app.services.operation_logs import query_string as truncate_query
from app.trace import get_trace_id

logger = logging.getLogger("orange.operation-log")


def _header(scope: dict[str, Any], name: str) -> str | None:
    for key, value in scope.get("headers", ()):
        if key.decode("latin-1").lower() == name:
            return value.decode("latin-1")
    return None


def _is_json(scope: dict[str, Any]) -> bool:
    content_type = _header(scope, "content-type") or ""
    return "json" in content_type.lower()


class OperationLogMiddleware:
    def __init__(self, app: Any) -> None:
        self.app = app

    async def __call__(self, scope: dict[str, Any], receive: Any, send: Any) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        method = scope.get("method", "GET")
        path = scope.get("path", "")
        audited = should_record(method, path)

        body_text: str | None = None
        if audited and not is_sensitive_path(path) and _is_json(scope):
            messages: list[dict[str, Any]] = []
            while True:
                message = await receive()
                messages.append(message)
                if message["type"] != "http.request" or not message.get("more_body", False):
                    break
            body_text = b"".join(
                message.get("body", b"")
                for message in messages
                if message["type"] == "http.request"
            ).decode("utf-8", errors="replace")
            pending = list(messages)

            async def replay() -> dict[str, Any]:
                if pending:
                    return pending.pop(0)
                return {"type": "http.request", "body": b"", "more_body": False}

            receive = replay

        started = time.perf_counter()
        status = 500

        async def send_wrapper(message: dict[str, Any]) -> None:
            nonlocal status
            if message["type"] == "http.response.start":
                status = int(message.get("status", 500))
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            if audited:
                duration_ms = int((time.perf_counter() - started) * 1000)
                await asyncio.to_thread(
                    self._persist,
                    scope=scope,
                    method=method,
                    path=path,
                    body=body_text,
                    status=status,
                    duration_ms=duration_ms,
                )

    def _persist(
        self,
        *,
        scope: dict[str, Any],
        method: str,
        path: str,
        body: str | None,
        status: int,
        duration_ms: int,
    ) -> None:
        client = scope.get("client") or (None, None)
        headers = {
            key.decode("latin-1").lower(): value.decode("latin-1")
            for key, value in scope.get("headers", ())
        }
        username = (scope.get("state") or {}).get("username") or "anonymous"
        try:
            session = SessionLocal()
            try:
                record(
                    session,
                    trace_id=scope.get("state", {}).get("trace_id") or get_trace_id(),
                    username=username,
                    method=method,
                    path=path,
                    query=truncate_query(scope.get("query_string", b"").decode("latin-1")),
                    body=body,
                    status=status,
                    duration_ms=duration_ms,
                    ip=client_ip(headers, client[0]),
                )
            finally:
                session.close()
        except Exception as exc:  # never fail a request because auditing failed
            logger.warning("failed to write operation log: %s", exc)
