"""Organisation endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.envelope import success
from app.schemas.common import StatusIn
from app.schemas.group import AddChildGroupIn, EditGroupIn
from app.security.dependencies import AuthContext, get_auth_context, require
from app.services import groups
from app.services.common import split_ids

router = APIRouter(prefix="/api/v1/system/groups", tags=["groups"])

MENU = "menu#/system/group"
ADD = "action#/system/group:add"
EDIT = "action#/system/group:edit"
DELETE = "action#/system/group:delete"


@router.get("")
def list_groups(
    id: str | None = Query(None),
    name: str | None = Query(None),
    status: str | None = Query(None),
    auth: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    require(auth, MENU)
    return success(groups.list_groups(db, id, name, status))


@router.get("/{group_id}")
def get_group(
    group_id: str,
    auth: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    require(auth, MENU)
    return success(groups.get_group_payload(db, group_id))


@router.patch("/{group_id}")
def edit_group(
    group_id: str,
    payload: EditGroupIn,
    auth: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    require(auth, EDIT)
    return success(
        groups.update_group(
            db, group_id, payload.name, payload.status, auth.user.username
        ),
        message="操作成功",
    )


@router.patch("/{group_id}/status")
def update_group_status(
    group_id: str,
    payload: StatusIn,
    auth: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    require(auth, EDIT)
    return success(
        groups.update_group(db, group_id, None, payload.status, auth.user.username),
        message="操作成功",
    )


@router.post("/children")
def add_child_group(
    payload: AddChildGroupIn,
    auth: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    require(auth, ADD)
    return success(
        groups.create_group(
            db,
            payload.id,
            payload.name,
            payload.parent_id,
            auth.user.username,
        )
    )


@router.delete("")
def delete_groups(
    ids: str = Query(...),
    auth: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    require(auth, DELETE)
    groups.delete_groups(db, split_ids(ids), auth.user.username)
    return success("操作成功")


@router.delete("/{group_id}")
def delete_group(
    group_id: str,
    auth: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    require(auth, DELETE)
    groups.delete_groups(db, [group_id], auth.user.username)
    return success("操作成功")
