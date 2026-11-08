"""Role endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.envelope import success
from app.schemas.role import AddRoleIn, EditRoleIn
from app.security.dependencies import AuthContext, authority
from app.services import roles
from app.services.common import required_ids

router = APIRouter(prefix="/api/v1/system/roles", tags=["roles"])

MENU = "menu#/system/role"
ADD = "action#/system/role:add"
EDIT = "action#/system/role:edit"
DELETE = "action#/system/role:delete"


@router.get("")
def list_roles(
    id: str | None = Query(None),
    name: str | None = Query(None),
    status: str | None = Query(None),
    sort: str | None = Query(None),
    direction: str | None = Query(None),
    page: int = Query(1, ge=1, le=10000),
    size: int = Query(10, ge=1, le=100),
    auth: AuthContext = Depends(authority(MENU)),
    db: Session = Depends(get_db),
):
    return success(
        roles.list_roles(db, id, name, status, sort, direction, page, size)
    )


@router.get("/{role_id}")
def get_role(
    role_id: str,
    auth: AuthContext = Depends(authority(MENU)),
    db: Session = Depends(get_db),
):
    return success(roles.get_role_payload(db, role_id))


@router.post("")
def add_role(
    payload: AddRoleIn,
    auth: AuthContext = Depends(authority(ADD)),
    db: Session = Depends(get_db),
):
    role_id = roles.create_role(
        db, auth, payload.id, payload.name, payload.permissions
    )
    return success(role_id, message="操作成功")


@router.patch("/{role_id}")
def edit_role(
    role_id: str,
    payload: EditRoleIn,
    auth: AuthContext = Depends(authority(EDIT)),
    db: Session = Depends(get_db),
):
    roles.update_role(
        db,
        auth,
        role_id,
        payload.name,
        payload.status,
        payload.permissions,
    )
    return success("操作成功")


@router.delete("")
def delete_roles(
    ids: str | None = Query(None),
    auth: AuthContext = Depends(authority(DELETE)),
    db: Session = Depends(get_db),
):
    roles.delete_roles(db, required_ids(ids), auth.user.username, auth.is_super)
    return success("操作成功")


@router.delete("/{role_id}")
def delete_role(
    role_id: str,
    auth: AuthContext = Depends(authority(DELETE)),
    db: Session = Depends(get_db),
):
    roles.delete_roles(db, [role_id], auth.user.username, auth.is_super)
    return success("操作成功")
