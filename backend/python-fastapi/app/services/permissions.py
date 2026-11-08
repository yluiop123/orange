"""Permission tree services and the ``(type, path, action)`` identity rule."""

from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app.errors import conflict, invalid, not_found
from app.models import (
    Permission,
    PermissionI18n,
    sys_role_permission,
    sys_user_permission,
)
from app.models.entities import utcnow
from app.policies.permission_shape import validate as validate_shape
from app.policies.tree_code import PERMISSION as PERMISSION_CODE_POLICY
from app.policies.tree_index import TreeIndex
from app.services.common import normalize_status, prefix_filter

STATUS_ENABLE = "1"
STATUS_DISABLE = "0"
TYPES = {"menu", "action", "directory"}


def serialize(permission: Permission) -> dict:
    return {
        "id": permission.id,
        "name": permission.name,
        "path": permission.path,
        "action": permission.action,
        "type": permission.type,
        "status": permission.status,
        "parentId": permission.parent_id,
        "createTime": permission.create_time,
        "updateTime": permission.update_time,
        "translations": {
            translation.locale: translation.name
            for translation in permission.translations
        },
    }


def _all(db: Session) -> list[Permission]:
    return list(
        db.scalars(
            select(Permission)
            .options(selectinload(Permission.translations))
            .order_by(Permission.id)
        )
    )


def _index(permissions: list[Permission]) -> TreeIndex[Permission]:
    return TreeIndex(permissions, lambda node: node.id, lambda node: node.parent_id)


def list_permissions(
    db: Session,
    permission_id: str | None,
    name: str | None,
    path: str | None,
    status: str | None,
    type_: str | None,
) -> list[dict]:
    statement = select(Permission).options(selectinload(Permission.translations))
    conditions = []
    if permission_id:
        conditions.append(prefix_filter(Permission.id, permission_id))
    if name:
        conditions.append(prefix_filter(Permission.name, name))
    if path:
        conditions.append(prefix_filter(Permission.path, path))
    normalized_status = normalize_status(status)
    if normalized_status is not None:
        conditions.append(Permission.status == normalized_status)

    normalized_type = (type_ or "").strip()
    type_filter = normalized_type not in {"", "all"}
    if type_filter:
        conditions.append(Permission.type == normalized_type)
    if conditions:
        statement = statement.where(*conditions)

    matched = list(db.scalars(statement.order_by(Permission.id)))
    text_filter = bool(
        (permission_id or "").strip()
        or (name or "").strip()
        or (path or "").strip()
        or type_filter
    )
    if not text_filter:
        return [serialize(permission) for permission in matched]

    all_permissions = _all(db)
    wanted = _index(all_permissions).with_ancestor_ids(matched)
    return [
        serialize(permission)
        for permission in all_permissions
        if permission.id in wanted
    ]


def get_permission(db: Session, permission_id: str) -> Permission:
    permission = db.get(
        Permission,
        permission_id,
        options=[selectinload(Permission.translations)],
    )
    if permission is None:
        raise not_found("权限不存在")
    return permission


def get_permission_payload(db: Session, permission_id: str) -> dict:
    return serialize(get_permission(db, permission_id))


def create_permission(
    db: Session,
    code: str,
    name: str,
    path: str,
    action: str | None,
    type_: str,
    parent_id: str | None,
    translations: dict[str, str] | None,
    actor: str,
) -> dict:
    parent = (parent_id or "").strip() or None
    normalized_path = _require_path(path)
    normalized_action = _normalize_action(action)

    PERMISSION_CODE_POLICY.validate(code, parent)
    if db.get(Permission, code) is not None:
        raise conflict("权限编码已存在")
    if parent is not None:
        parent_node = db.get(Permission, parent)
        if parent_node is None:
            raise not_found("父权限不存在")
        if parent_node.type == "action":
            raise invalid("动作权限不能添加子节点")

    _assert_unique(db, type_, normalized_path, normalized_action, None)

    permission = Permission(
        id=code,
        name=name,
        path=normalized_path,
        action=normalized_action,
        type=type_,
        parent_id=parent,
        status=STATUS_ENABLE,
        create_time=utcnow(),
        update_time=utcnow(),
        created_by=actor,
        updated_by=actor,
        version=0,
    )
    permission.translations = [
        PermissionI18n(locale=locale, name=translation_name)
        for locale, translation_name in (translations or {}).items()
    ]
    db.add(permission)
    db.commit()
    db.refresh(permission)
    return serialize(permission)


def update_permission(
    db: Session,
    permission_id: str,
    name: str | None,
    path: str | None,
    action: str | None,
    status: str | None,
    type_: str | None,
    translations: dict[str, str] | None,
    actor: str,
) -> dict:
    permission = get_permission(db, permission_id)

    effective_type = type_ if type_ is not None else permission.type
    effective_path = _require_path(path) if path is not None else _require_path(permission.path)
    effective_action = (
        _normalize_action(action) if action is not None else _normalize_action(permission.action)
    )

    if effective_type == "action" and type_ is not None:
        has_children = db.scalar(
            select(Permission.id).where(Permission.parent_id == permission.id).limit(1)
        )
        if has_children is not None:
            raise invalid("动作权限不能有子节点")

    _assert_unique(db, effective_type, effective_path, effective_action, permission.id)

    if name is not None:
        permission.name = name
    if path is not None:
        permission.path = effective_path
    if action is not None:
        permission.action = effective_action
    if type_ is not None:
        permission.type = type_
    if status is not None:
        disabling = permission.status != STATUS_DISABLE and status == STATUS_DISABLE
        if disabling:
            _assert_no_enabled_descendants(db, permission.id)
        permission.status = status

    if translations is not None:
        # Omitted translations keep every row; a supplied map replaces them all.
        db.execute(
            delete(PermissionI18n).where(PermissionI18n.permission_id == permission.id)
        )
        db.flush()
        db.add_all(
            PermissionI18n(
                permission_id=permission.id,
                locale=locale,
                name=translation_name,
            )
            for locale, translation_name in translations.items()
        )
        db.expire(permission, ["translations"])

    permission.updated_by = actor
    permission.update_time = utcnow()
    permission.version = (permission.version or 0) + 1
    db.commit()
    db.refresh(permission)
    return serialize(permission)


def delete_permissions(db: Session, ids: list[str], actor: str) -> None:
    if not ids:
        return
    all_permissions = _all(db)
    index = _index(all_permissions)
    requested = list(dict.fromkeys(ids))
    if any(index.get(permission_id) is None for permission_id in requested):
        raise not_found("权限不存在")

    subtree = index.subtree_ids(requested)
    referenced_by_role = db.scalar(
        select(sys_role_permission.c.role_id)
        .where(sys_role_permission.c.permission_id.in_(subtree))
        .limit(1)
    )
    if referenced_by_role is not None:
        raise conflict("权限已被角色引用，不能删除")
    referenced_by_user = db.scalar(
        select(sys_user_permission.c.user_id)
        .where(sys_user_permission.c.permission_id.in_(subtree))
        .limit(1)
    )
    if referenced_by_user is not None:
        raise conflict("权限已被用户引用，不能删除")

    db.execute(
        delete(sys_role_permission).where(sys_role_permission.c.permission_id.in_(subtree))
    )
    db.execute(
        delete(sys_user_permission).where(sys_user_permission.c.permission_id.in_(subtree))
    )
    db.execute(delete(PermissionI18n).where(PermissionI18n.permission_id.in_(subtree)))
    for permission in index.delete_order(subtree):
        db.execute(delete(Permission).where(Permission.id == permission.id))
        db.flush()
    db.commit()


def _assert_no_enabled_descendants(db: Session, permission_id: str) -> None:
    index = _index(_all(db))
    if index.has_enabled_descendant(
        permission_id, lambda permission: permission.status == STATUS_ENABLE
    ):
        raise invalid("请先禁用子权限")


def _assert_unique(
    db: Session,
    type_: str,
    path: str,
    action: str | None,
    exclude_id: str | None,
) -> None:
    validate_shape(type_, action)
    statement = select(Permission.id).where(
        Permission.type == type_,
        Permission.path == path,
        Permission.action.is_(None) if action is None else Permission.action == action,
    )
    if exclude_id is not None:
        statement = statement.where(Permission.id != exclude_id)
    if db.scalar(statement.limit(1)) is not None:
        raise conflict("权限已存在")


def _require_path(path: str | None) -> str:
    normalized = (path or "").strip()
    if not normalized:
        raise invalid("权限路径不能为空")
    return normalized


def _normalize_action(action: str | None) -> str | None:
    normalized = (action or "").strip()
    return normalized or None
