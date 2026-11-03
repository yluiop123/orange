"""The menu tree: enabled ``menu`` / ``directory`` nodes only, ordered by code."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Permission

MENU_TYPES = ("menu", "directory")
STATUS_ENABLE = "1"


def menu_tree(db: Session) -> list[dict]:
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
            "name": permission.name,
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
