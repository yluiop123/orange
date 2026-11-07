"""Application factory and ASGI entry point."""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import delete

from app.config import settings
from app.db import SessionLocal
from app.errors import register_exception_handlers
from app.middleware import OperationLogMiddleware
from app.models import OperationLog
from app.routers import auth, docs, groups, operation_logs, permissions, roles, users
from app.trace import TraceIdMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)


def cleanup_operation_logs() -> None:
    cutoff = datetime.now(timezone.utc) - timedelta(
        days=settings.operation_log_retention_days
    )
    session = SessionLocal()
    try:
        session.execute(delete(OperationLog).where(OperationLog.create_time < cutoff))
        session.commit()
    finally:
        session.close()


async def _retention_loop() -> None:
    # The first run is delayed so a demo start does not block on the database.
    await asyncio.sleep(60)
    while True:
        try:
            await asyncio.to_thread(cleanup_operation_logs)
        except Exception as exc:  # pragma: no cover - best effort maintenance
            logging.getLogger("orange.retention").warning("cleanup failed: %s", exc)
        await asyncio.sleep(24 * 60 * 60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Resolve the shared contract once so /openapi.json never walks the tree per request.
    docs.load_contract()
    task = asyncio.create_task(_retention_loop())
    try:
        yield
    finally:
        task.cancel()


def create_app() -> FastAPI:
    app = FastAPI(
        title="ORANGE API (Python / FastAPI)",
        version="1.0.0",
        lifespan=lifespan,
        # The shared contract owns the schema; /openapi.json and /swagger below replace
        # the framework-generated docs (which would otherwise also claim /openapi.json).
        openapi_url=None,
    )

    app.add_middleware(OperationLogMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "Locale",
            "X-Trace-Id",
            "X-Request-Id",
        ],
        expose_headers=["X-Trace-Id"],
        max_age=3600,
    )
    app.add_middleware(TraceIdMiddleware)

    register_exception_handlers(app)

    app.include_router(auth.router)
    app.include_router(groups.router)
    app.include_router(permissions.router)
    app.include_router(roles.router)
    app.include_router(users.router)
    app.include_router(operation_logs.router)
    app.include_router(docs.router)

    return app


app = create_app()


if __name__ == "__main__":  # pragma: no cover - manual entry point
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=False)
