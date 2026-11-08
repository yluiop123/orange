"""Operation log read endpoint."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.envelope import success
from app.security.dependencies import AuthContext, authority
from app.services.operation_logs import query_logs

router = APIRouter(prefix="/api/v1/system/operation-logs", tags=["operation-logs"])

MENU = "menu#/system/operation-log"


@router.get("")
def list_operation_logs(
    username: str | None = Query(None),
    path: str | None = Query(None),
    status: str | None = Query(None, pattern=r"^$|^\d{3}$"),
    from_: datetime | None = Query(None, alias="from"),
    to: datetime | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    auth: AuthContext = Depends(authority(MENU)),
    db: Session = Depends(get_db),
):
    return success(
        query_logs(
            db,
            username=username,
            path=path,
            status=status,
            from_=from_,
            to=to,
            page=page,
            size=size,
        )
    )
