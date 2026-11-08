"""Permission endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.envelope import success
from app.schemas.permission import AddChildPermissionIn, EditPermissionIn
from app.security.dependencies import AuthContext, authority
from app.services import permissions
from app.services.common import required_ids

router = APIRouter(prefix="/api/v1/system/permissions", tags=["permissions"])

MENU = "menu#/system/permission"
ADD = "action#/system/permission:add"
EDIT = "action#/system/permission:edit"
DELETE = "action#/system/permission:delete"


@router.get("")
def list_permissions(
    id: str | None = Query(None),
    name: str | None = Query(None),
    path: str | None = Query(None),
    status: str | None = Query(None),
    type: str | None = Query(None),
    auth: AuthContext = Depends(authority(MENU)),
    db: Session = Depends(get_db),
):
    return success(permissions.list_permissions(db, id, name, path, status, type))


@router.get("/{permission_id}")
def get_permission(
    permission_id: str,
    auth: AuthContext = Depends(authority(MENU)),
    db: Session = Depends(get_db),
):
    return success(permissions.get_permission_payload(db, permission_id))


@router.patch("/{permission_id}")
def edit_permission(
    permission_id: str,
    payload: EditPermissionIn,
    auth: AuthContext = Depends(authority(EDIT)),
    db: Session = Depends(get_db),
):
    permissions.update_permission(
        db,
        permission_id,
        payload.name,
        payload.path,
        payload.action,
        payload.status,
        payload.type,
        payload.translations,
        auth.user.username,
    )
    return success("操作成功")


@router.post("/children")
def add_child_permission(
    payload: AddChildPermissionIn,
    auth: AuthContext = Depends(authority(ADD)),
    db: Session = Depends(get_db),
):
    return success(
        permissions.create_permission(
            db,
            payload.id,
            payload.name,
            payload.path,
            payload.action,
            payload.type,
            payload.parent_id,
            payload.translations,
            auth.user.username,
        )
    )


@router.delete("")
def delete_permissions(
    ids: str | None = Query(None),
    auth: AuthContext = Depends(authority(DELETE)),
    db: Session = Depends(get_db),
):
    permissions.delete_permissions(db, required_ids(ids), auth.user.username)
    return success("操作成功")


@router.delete("/{permission_id}")
def delete_permission(
    permission_id: str,
    auth: AuthContext = Depends(authority(DELETE)),
    db: Session = Depends(get_db),
):
    permissions.delete_permissions(db, [permission_id], auth.user.username)
    return success("操作成功")
