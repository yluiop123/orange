"""The menu tree: enabled ``menu`` / ``directory`` nodes only, ordered by code.

Names come from ``sys_permission_i18n``; the `Locale` request header picks the
best translation (exact tag, then its language part) and ``sys_permission.name``
is the final fallback, so the frontend never has to ship a menu catalogue.
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Permission, PermissionI18n

MENU_TYPES = ("menu", "directory")
STATUS_ENABLE = "1"


def localized_name(
    permission: Permission,
    locale: str | None,
    translations: dict[str, str] | None = None,
) -> str | None:
    if translations:
        requested = (locale or "").strip().lower()
        if requested:
            exact = translations.get(requested)
            if exact:
                return exact
            language = requested.split("-", 1)[0]
            if language:
                language_match = translations.get(language)
                if language_match:
                    return language_match
    return permission.name


def _translations(
    db: Session, permission_ids: list[str]
) -> dict[str, dict[str, str]]:
    if not permission_ids:
        return {}
    rows = db.execute(
        select(
            PermissionI18n.permission_id,
            PermissionI18n.locale,
            PermissionI18n.name,
        ).where(PermissionI18n.permission_id.in_(permission_ids))
    )
    by_permission: dict[str, dict[str, str]] = {}
    for permission_id, locale, name in rows:
        # Locale matching is case-insensitive: normalise the stored keys once.
        key = (locale or "").strip().lower()
        if key and name:
            by_permission.setdefault(permission_id, {})[key] = name
    return by_permission


def menu_tree(db: Session, locale: str | None = None) -> list[dict]:
    rows = list(
        db.scalars(
            select(Permission)
            .where(Permission.status == STATUS_ENABLE, Permission.type.in_(MENU_TYPES))
            .order_by(Permission.id)
        )
    )
    translations = _translations(db, [permission.id for permission in rows])

    nodes: dict[str, dict] = {
        permission.id: {
            "id": permission.id,
            "path": permission.path,
            "type": permission.type,
            "name": localized_name(permission, locale, translations.get(permission.id)),
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
