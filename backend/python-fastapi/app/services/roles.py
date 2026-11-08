"""Role services with grant guards and reference checks."""

from __future__ import annotations

import uuid

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.errors import conflict, forbidden, not_found
from app.models import Permission, Role, sys_role_permission, sys_user_role
from app.models.entities import utcnow
from app.security.dependencies import AuthContext
from app.security.grants import GrantGuard
from app.services.common import (
    normalize_status,
    page_payload,
    prefix_filter,
    resolve_sort,
)

STATUS_ENABLE = "1"

SORT_FIELDS = {
    "id": Role.id,
    "name": Role.name,
    "status": Role.status,
    "createTime": Role.create_time,
    "updateTime": Role.update_time,
}


def serialize(role: Role) -> dict:
    return {
        "id": role.id,
        "name": role.name,
        "status": role.status,
        "createTime": role.create_time,
        "updateTime": role.update_time,
    }


def list_roles(
    db: Session,
    role_id: str | None,
    name: str | None,
    status: str | None,
    sort: str | None,
    direction: str | None,
    page: int,
    size: int,
) -> dict:
    conditions = []
    if role_id:
        conditions.append(prefix_filter(Role.id, role_id))
    if name:
        conditions.append(prefix_filter(Role.name, name))
    normalized_status = normalize_status(status)
    if normalized_status is not None:
        conditions.append(Role.status == normalized_status)

    column, ascending = resolve_sort(sort, direction, SORT_FIELDS, "createTime")
    order = column.asc() if ascending else column.desc()

    total = db.scalar(select(func.count()).select_from(Role).where(*conditions)) or 0
    statement = (
        select(Role)
        .where(*conditions)
        .order_by(order, Role.id)
        .offset((page - 1) * size)
        .limit(size)
    )
    rows = [serialize(role) for role in db.scalars(statement)]
    return page_payload(total, rows, page, size)


def get_role(db: Session, role_id: str) -> Role:
    role = db.get(Role, role_id)
    if role is None:
        raise not_found("角色不存在")
    return role


def get_role_payload(db: Session, role_id: str) -> dict:
    role = get_role(db, role_id)
    payload = serialize(role)
    payload["permissions"] = sorted(permission.id for permission in role.permissions)
    return payload


def create_role(
    db: Session,
    auth: AuthContext,
    role_id: str | None,
    name: str,
    permission_ids: list[str] | None,
) -> str:
    guard = GrantGuard(auth)
    guard.assert_can_assign_permissions(permission_ids)

    new_id = (role_id or "").strip() or str(uuid.uuid4())
    if db.get(Role, new_id) is not None:
        raise conflict("角色ID已存在")

    role = Role(
        id=new_id,
        name=name,
        status=STATUS_ENABLE,
        create_time=utcnow(),
        update_time=utcnow(),
        created_by=auth.user.username,
        updated_by=auth.user.username,
        version=0,
    )
    role.permissions = _resolve_permissions(db, permission_ids)
    db.add(role)
    db.commit()
    return role.id


def update_role(
    db: Session,
    auth: AuthContext,
    role_id: str,
    name: str | None,
    status: str | None,
    permission_ids: list[str] | None,
) -> None:
    role = get_role(db, role_id)
    if role.id == "super" and not auth.is_super:
        raise forbidden("只有超级管理员可以修改 super 角色")

    if name is not None:
        role.name = name
    if status is not None:
        role.status = status
    if permission_ids is not None:
        GrantGuard(auth).assert_can_assign_permissions(permission_ids)
        role.permissions = _resolve_permissions(db, permission_ids)

    role.updated_by = auth.user.username
    role.update_time = utcnow()
    role.version = (role.version or 0) + 1
    db.commit()


def delete_roles(db: Session, ids: list[str], actor: str, is_super: bool) -> None:
    if not ids:
        raise not_found("角色不存在")
    roles = list(db.scalars(select(Role).where(Role.id.in_(ids))))
    if not roles:
        raise not_found("角色不存在")
    if any(role.id == "super" for role in roles) and not is_super:
        raise forbidden("只有超级管理员可以删除 super 角色")

    for role in roles:
        referenced = db.scalar(
            select(sys_user_role.c.user_id)
            .where(sys_user_role.c.role_id == role.id)
            .limit(1)
        )
        if referenced is not None:
            raise conflict(f"角色{role.id}已被用户引用，不能删除")

    role_ids = [role.id for role in roles]
    db.execute(delete(sys_role_permission).where(sys_role_permission.c.role_id.in_(role_ids)))
    db.execute(delete(Role).where(Role.id.in_(role_ids)))
    db.commit()


def _resolve_permissions(db: Session, permission_ids: list[str] | None) -> list[Permission]:
    if not permission_ids:
        return []
    return list(
        db.scalars(
            select(Permission)
            .where(Permission.id.in_(list(dict.fromkeys(permission_ids))))
            .order_by(Permission.id)
        )
    )
