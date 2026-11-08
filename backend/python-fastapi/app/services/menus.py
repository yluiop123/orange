"""The menu tree: enabled ``menu`` / ``directory`` nodes only, ordered by code.

Names come from `sys_permission`; the `Locale` request header picks
`name_en` when it is available, so the frontend never has to ship a menu
catalogue of its own.
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Permission

MENU_TYPES = ("menu", "directory")
STATUS_ENABLE = "1"


def localized_name(permission: Permission, locale: str | None) -> str | None:
    if (locale or "").lower().startswith("en"):
        return permission.name_en or permission.name
    return permission.name


def menu_tree(db: Session, locale: str | None = None) -> list[dict]:
    rows = list(
        db.scalars(
            select(Permission)
            .where(Permission.status == STATUS_ENABLE, Permission.type.in_(MENU_TYPES))
            .order_by(Permission.id)
        )
    )

    nodes: dict[str, dict] = {
        permission.id: {
            "id": permission.id,
            "path": permission.path,
            "type": permission.type,
            "name": localized_name(permission, locale),
            "children": [],
        }
        for permission in rows
    }

    roots: list[dict] = []
    for permission in rows:
        node = nodes[permission.id]
        parent_id = (permission.parent_id or "").strip()
        if not parent_id:
            roots.append(node)
            continue
        parent = nodes.get(parent_id)
        if parent is not None:
            parent["children"].append(node)
        # A disabled / missing parent hides the whole branch.
    return roots
