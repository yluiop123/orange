"""User endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.envelope import success
from app.schemas.common import StatusIn
from app.schemas.user import AddUserIn, EditUserIn
from app.security.dependencies import AuthContext, authority
from app.services import users
from app.services.common import required_ids

router = APIRouter(prefix="/api/v1/system/users", tags=["users"])

MENU = "menu#/system/user"
ADD = "action#/system/user:add"
EDIT = "action#/system/user:edit"
DELETE = "action#/system/user:delete"


@router.get("")
def list_users(
    keyword: str | None = Query(None),
    status: str | None = Query(None),
    groupId: str | None = Query(None),
    sort: str | None = Query(None),
    direction: str | None = Query(None),
    page: int = Query(1, ge=1, le=10000),
    size: int = Query(10, ge=1, le=100),
    auth: AuthContext = Depends(authority(MENU)),
    db: Session = Depends(get_db),
):
    return success(
        users.list_users(
            db, keyword, status, groupId, sort, direction, page, size
        )
    )


@router.get("/{user_id}")
def get_user(
    user_id: str,
    auth: AuthContext = Depends(authority(MENU)),
    db: Session = Depends(get_db),
):
    return success(users.get_user_payload(db, user_id))


@router.post("")
def add_user(
    payload: AddUserIn,
    auth: AuthContext = Depends(authority(ADD)),
    db: Session = Depends(get_db),
):
    temporary = users.create_user(
        db,
        auth,
        payload.name,
        payload.username,
        payload.email,
        payload.group_id,
        payload.phone,
        payload.status,
        payload.roles,
        payload.permissions,
    )
    return success(temporary, message="操作成功")


@router.patch("/{user_id}")
def edit_user(
    user_id: str,
    payload: EditUserIn,
    auth: AuthContext = Depends(authority(EDIT)),
    db: Session = Depends(get_db),
):
    users.update_user(
        db,
        auth,
        user_id,
        payload.name,
        payload.username,
        payload.email,
        payload.group_id,
        payload.phone,
        payload.status,
        payload.roles,
        payload.permissions,
    )
    return success("操作成功")


@router.patch("/{user_id}/status")
def update_user_status(
    user_id: str,
    payload: StatusIn,
    auth: AuthContext = Depends(authority(EDIT)),
    db: Session = Depends(get_db),
):
    users.update_user(
        db,
        auth,
        user_id,
        None,
        None,
        None,
        None,
        None,
        payload.status,
        None,
        None,
    )
    return success("操作成功")


@router.post("/{user_id}/reset-password")
def reset_password(
    user_id: str,
    auth: AuthContext = Depends(authority(EDIT)),
    db: Session = Depends(get_db),
):
    temporary = users.reset_password(db, auth, user_id)
    return success(temporary, message="操作成功", headers={"Cache-Control": "no-store"})


@router.delete("")
def delete_users(
    ids: str | None = Query(None),
    auth: AuthContext = Depends(authority(DELETE)),
    db: Session = Depends(get_db),
):
    users.delete_users(db, auth, required_ids(ids))
    return success("删除成功")


@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    auth: AuthContext = Depends(authority(DELETE)),
    db: Session = Depends(get_db),
):
    users.delete_users(db, auth, [user_id])
    return success("删除成功")
