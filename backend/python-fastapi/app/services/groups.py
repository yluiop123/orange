"""Organisation tree services."""

from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.errors import conflict, invalid, not_found
from app.models import Group, User
from app.models.entities import utcnow
from app.policies.tree_code import GROUP as GROUP_CODE_POLICY
from app.policies.tree_index import TreeIndex
from app.services.common import normalize_status, prefix_filter

STATUS_ENABLE = "1"
STATUS_DISABLE = "0"


def serialize(group: Group) -> dict:
    return {
        "id": group.id,
        "name": group.name,
        "status": group.status,
        "parentId": group.parent_id,
        "createTime": group.create_time,
        "updateTime": group.update_time,
    }


def _all(db: Session) -> list[Group]:
    return list(db.scalars(select(Group).order_by(Group.id)))


def _index(groups: list[Group]) -> TreeIndex[Group]:
    return TreeIndex(groups, lambda node: node.id, lambda node: node.parent_id)


def list_groups(
    db: Session,
    group_id: str | None,
    name: str | None,
    status: str | None,
) -> list[dict]:
    statement = select(Group)
    conditions = []
    if group_id:
        conditions.append(prefix_filter(Group.id, group_id))
    if name:
        conditions.append(prefix_filter(Group.name, name))
    normalized_status = normalize_status(status)
    if normalized_status is not None:
        conditions.append(Group.status == normalized_status)
    if conditions:
        statement = statement.where(*conditions)

    matched = list(db.scalars(statement.order_by(Group.id)))
    text_filter = bool((group_id or "").strip() or (name or "").strip())
    if not text_filter:
        return [serialize(group) for group in matched]

    all_groups = _all(db)
    wanted = _index(all_groups).with_ancestor_ids(matched)
    return [serialize(group) for group in all_groups if group.id in wanted]


def get_group(db: Session, group_id: str) -> Group:
    group = db.get(Group, group_id)
    if group is None:
        raise not_found("组织不存在")
    return group


def get_group_payload(db: Session, group_id: str) -> dict:
    return serialize(get_group(db, group_id))


def create_group(
    db: Session,
    code: str,
    name: str,
    parent_id: str | None,
    actor: str,
) -> dict:
    parent = (parent_id or "").strip() or None
    GROUP_CODE_POLICY.validate(code, parent)
    if db.get(Group, code) is not None:
        raise conflict("组织编码已存在")
    if parent is not None and db.get(Group, parent) is None:
        raise not_found("父组织不存在")

    group = Group(
        id=code,
        name=name,
        parent_id=parent,
        status=STATUS_ENABLE,
        create_time=utcnow(),
        update_time=utcnow(),
        created_by=actor,
        updated_by=actor,
        version=0,
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return serialize(group)


def update_group(
    db: Session,
    group_id: str,
    name: str | None,
    status: str | None,
    actor: str,
) -> dict:
    group = get_group(db, group_id)
    if name is not None:
        group.name = name
    if status is not None:
        disabling = group.status != STATUS_DISABLE and status == STATUS_DISABLE
        if disabling:
            _assert_no_enabled_descendants(db, group.id)
        group.status = status
    group.updated_by = actor
    group.update_time = utcnow()
    group.version = (group.version or 0) + 1
    db.commit()
    db.refresh(group)
    return serialize(group)


def delete_groups(db: Session, ids: list[str], actor: str) -> None:
    if not ids:
        return
    all_groups = _all(db)
    index = _index(all_groups)
    requested = list(dict.fromkeys(ids))
    if any(index.get(group_id) is None for group_id in requested):
        raise not_found("组织不存在")

    subtree = index.subtree_ids(requested)
    user_exists = db.scalar(select(User.id).where(User.group_id.in_(subtree)).limit(1))
    if user_exists is not None:
        raise conflict("组织或其子组织下有用户，不能删除")

    # Children before parents: the FK is ON DELETE RESTRICT.
    for group in index.delete_order(subtree):
        db.execute(delete(Group).where(Group.id == group.id))
        db.flush()
    db.commit()


def _assert_no_enabled_descendants(db: Session, group_id: str) -> None:
    index = _index(_all(db))
    if index.has_enabled_descendant(group_id, lambda group: group.status == STATUS_ENABLE):
        raise invalid("请先禁用子组织")
