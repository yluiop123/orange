"""User services, credential lifecycle and the ``/user-info`` projection."""

from __future__ import annotations

import uuid

from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.errors import conflict, invalid, not_found
from app.models import Group, Permission, Role, User, sys_user_permission, sys_user_role
from app.models.entities import utcnow
from app.policies.effective_permissions import EffectivePermissions
from app.security.dependencies import AuthContext
from app.security.grants import GrantGuard
from app.security.login_attempts import LoginAttemptService, SqlAlchemyAttemptRepository
from app.security.passwords import (
    generate_temporary_password,
    hash_password,
    verify_password,
)
from app.services.common import (
    normalize_status,
    page_payload,
    prefix_filter,
    resolve_sort,
)

STATUS_ENABLE = "1"
STATUS_DISABLE = "0"

SORT_FIELDS = {
    "id": User.id,
    "name": User.name,
    "username": User.username,
    "email": User.email,
    "status": User.status,
    "createTime": User.create_time,
    "updateTime": User.update_time,
}


def _with_roles_and_permissions():
    return (
        selectinload(User.roles).selectinload(Role.permissions),
        selectinload(User.permissions),
    )


def _load(db: Session, user_id: str) -> User:
    user = db.scalar(
        select(User).where(User.id == user_id).options(*_with_roles_and_permissions())
    )
    if user is None:
        raise not_found("用户不存在")
    return user


def _group_names(db: Session) -> dict[str, str]:
    return {
        group.id: (group.name or "")
        for group in db.scalars(select(Group))
    }


def _serialize(user: User, group_name: str) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "username": user.username,
        "email": user.email,
        "groupId": user.group_id,
        "groupName": group_name,
        "phone": user.phone,
        "status": user.status,
        "createTime": user.create_time,
        "updateTime": user.update_time,
    }


def list_users(
    db: Session,
    keyword: str | None,
    status: str | None,
    group_id: str | None,
    sort: str | None,
    direction: str | None,
    page: int,
    size: int,
) -> dict:
    conditions = []
    trimmed_keyword = (keyword or "").strip()
    if trimmed_keyword:
        conditions.append(
            or_(
                prefix_filter(User.name, trimmed_keyword),
                prefix_filter(User.username, trimmed_keyword),
                prefix_filter(User.email, trimmed_keyword),
                prefix_filter(User.phone, trimmed_keyword),
            )
        )
    normalized_status = normalize_status(status)
    if normalized_status is not None:
        conditions.append(User.status == normalized_status)
    if group_id:
        conditions.append(prefix_filter(User.group_id, group_id))

    column, ascending = resolve_sort(sort, direction, SORT_FIELDS, "createTime")
    order = column.asc() if ascending else column.desc()

    total = db.scalar(select(func.count()).select_from(User).where(*conditions)) or 0
    statement = (
        select(User)
        .where(*conditions)
        .order_by(order, User.id)
        .offset((page - 1) * size)
        .limit(size)
    )
    groups = _group_names(db)
    rows = [
        _serialize(user, groups.get(user.group_id or "", ""))
        for user in db.scalars(statement)
    ]
    return page_payload(total, rows, page, size)


def get_user_payload(db: Session, user_id: str) -> dict:
    user = _load(db, user_id)
    group = db.get(Group, user.group_id) if user.group_id else None
    payload = _serialize(user, (group.name or "") if group else "")
    payload["roles"] = [
        {"id": role.id, "name": role.name}
        for role in sorted(user.roles, key=lambda item: item.id)
    ]
    payload["permissions"] = sorted(permission.id for permission in user.permissions)
    return payload


def create_user(
    db: Session,
    auth: AuthContext,
    name: str,
    username: str,
    email: str,
    group_id: str,
    phone: str,
    status: str | None,
    role_ids: list[str] | None,
    permission_ids: list[str] | None,
) -> str:
    if db.scalar(select(User.id).where(User.username == username).limit(1)) is not None:
        raise conflict("用户名已存在")
    guard = GrantGuard(auth)
    guard.assert_can_assign_roles(role_ids)
    guard.assert_can_assign_permissions(permission_ids)
    if db.get(Group, group_id) is None:
        raise not_found("组织不存在")

    temporary = generate_temporary_password()
    now = utcnow()
    user = User(
        id=str(uuid.uuid4()),
        name=name,
        username=username,
        email=email,
        group_id=group_id,
        phone=phone,
        status=status or STATUS_ENABLE,
        password=hash_password(temporary),
        must_change_password=True,
        token_version=0,
        create_time=now,
        update_time=now,
        created_by=auth.user.username,
        updated_by=auth.user.username,
        version=0,
    )
    user.roles = _resolve_roles(db, role_ids)
    user.permissions = _resolve_permissions(db, permission_ids)
    db.add(user)
    db.commit()
    return temporary


def update_user(
    db: Session,
    auth: AuthContext,
    user_id: str,
    name: str | None,
    username: str | None,
    email: str | None,
    group_id: str | None,
    phone: str | None,
    status: str | None,
    role_ids: list[str] | None,
    permission_ids: list[str] | None,
) -> None:
    user = _load(db, user_id)

    if name is not None:
        user.name = name
    if username is not None and username != user.username:
        raise invalid("用户名创建后不可修改")
    if email is not None:
        user.email = email
    if group_id is not None:
        if not group_id.strip() or db.get(Group, group_id) is None:
            raise not_found("组织不存在")
        user.group_id = group_id
    if phone is not None:
        user.phone = phone

    if status is not None:
        disabling = user.status != STATUS_DISABLE and status == STATUS_DISABLE
        if disabling:
            _assert_not_self(auth, user.id, "禁用")
            _assert_not_last_super(db, user, "禁用")
        user.status = status
        if disabling:
            user.token_version = (user.token_version or 0) + 1

    if role_ids is not None:
        GrantGuard(auth).assert_can_assign_roles(role_ids)
        user.roles = _resolve_roles(db, role_ids)
    if permission_ids is not None:
        GrantGuard(auth).assert_can_assign_permissions(permission_ids)
        user.permissions = _resolve_permissions(db, permission_ids)

    user.updated_by = auth.user.username
    user.update_time = utcnow()
    user.version = (user.version or 0) + 1
    db.commit()


def delete_users(db: Session, auth: AuthContext, ids: list[str]) -> None:
    if not ids:
        raise not_found("用户不存在")
    users = list(
        db.scalars(
            select(User)
            .where(User.id.in_(ids))
            .options(selectinload(User.roles))
        )
    )
    if not users:
        raise not_found("用户不存在")

    enabled_supers = _count_enabled_supers(db)
    deleting_supers = sum(
        1
        for user in users
        if user.status != STATUS_DISABLE and _has_role(user, "super")
    )
    if deleting_supers and enabled_supers - deleting_supers < 1:
        raise invalid("系统至少需要保留一个启用的超级管理员")

    for user in users:
        _assert_not_self(auth, user.id, "删除")

    user_ids = [user.id for user in users]
    db.execute(delete(sys_user_role).where(sys_user_role.c.user_id.in_(user_ids)))
    db.execute(delete(sys_user_permission).where(sys_user_permission.c.user_id.in_(user_ids)))
    db.execute(delete(User).where(User.id.in_(user_ids)))
    db.commit()


def reset_password(db: Session, auth: AuthContext, user_id: str) -> str:
    user = _load(db, user_id)
    if _has_role(user, "super") and not auth.is_super:
        raise invalid("无权重置超级管理员密码")

    temporary = generate_temporary_password()
    user.password = hash_password(temporary)
    user.must_change_password = True
    # Password reset invalidates every token issued before it.
    user.token_version = (user.token_version or 0) + 1
    user.updated_by = auth.user.username
    user.update_time = utcnow()
    user.version = (user.version or 0) + 1
    db.commit()
    LoginAttemptService(SqlAlchemyAttemptRepository(db)).clear_user_attempts(user.username)
    return temporary


def change_password(db: Session, username: str, old_password: str, new_password: str) -> None:
    user = db.scalar(select(User).where(User.username == username))
    if user is None:
        raise not_found("用户不存在")
    if not verify_password(old_password, user.password):
        raise invalid("原密码错误")
    if verify_password(new_password, user.password):
        raise invalid("新密码不能与原密码相同")

    user.password = hash_password(new_password)
    user.must_change_password = False
    user.token_version = (user.token_version or 0) + 1
    user.update_time = utcnow()
    user.version = (user.version or 0) + 1
    db.commit()
    LoginAttemptService(SqlAlchemyAttemptRepository(db)).clear_user_attempts(user.username)


def user_info_payload(db: Session, auth: AuthContext) -> dict:
    user = auth.user
    group = db.get(Group, user.group_id) if user.group_id else None
    effective = EffectivePermissions.of(user)

    return {
        "id": user.id,
        "name": user.name,
        "username": user.username,
        "email": user.email,
        "groupId": user.group_id,
        "groupName": (group.name or "") if group else "",
        "phone": user.phone,
        "status": user.status,
        "mustChangePassword": bool(user.must_change_password),
        "createTime": user.create_time,
        "updateTime": user.update_time,
        "roles": [
            {"id": role.id, "name": role.name}
            for role in sorted(effective.roles, key=lambda item: item.id)
        ],
        "rolePermissions": [
            {
                "role": entry.role_id,
                "type": entry.permission.type,
                "path": entry.permission.path,
                "action": entry.permission.action,
            }
            for entry in effective.role_permissions
        ],
        "userPermissions": [
            {
                "type": permission.type,
                "path": permission.path,
                "action": permission.action,
            }
            for permission in effective.direct_permissions
        ],
    }


def _assert_not_self(auth: AuthContext, target_id: str, action: str) -> None:
    if target_id == auth.user.id:
        raise invalid(f"不能{action}当前登录用户")


def _has_role(user: User, role_id: str) -> bool:
    return any(role.id == role_id for role in (user.roles or []))


def _count_enabled_supers(db: Session) -> int:
    statement = (
        select(func.count(func.distinct(User.id)))
        .select_from(User)
        .join(sys_user_role, sys_user_role.c.user_id == User.id)
        .where(sys_user_role.c.role_id == "super", User.status != STATUS_DISABLE)
    )
    return int(db.scalar(statement) or 0)


def _assert_not_last_super(db: Session, user: User, action: str) -> None:
    if not _has_role(user, "super") or user.status == STATUS_DISABLE:
        return
    if _count_enabled_supers(db) <= 1:
        raise invalid(f"系统至少需要保留一个启用的超级管理员，不能{action}")


def _resolve_roles(db: Session, role_ids: list[str] | None) -> list[Role]:
    if not role_ids:
        return []
    return list(
        db.scalars(
            select(Role)
            .where(Role.id.in_(list(dict.fromkeys(role_ids))))
            .order_by(Role.id)
        )
    )


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
