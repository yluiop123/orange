"""Permission ``type`` / ``action`` shape rules.

An ``action`` permission requires a non-blank action. ``menu`` and
``directory`` permissions must not carry one. Blank actions are normalised to
``None`` by the service so the database only stores one "no action" value.
"""

from __future__ import annotations

from app.errors import invalid


def validate(type_: str, action: str | None) -> None:
    if type_ == "action":
        if action is None or not action.strip():
            raise invalid("action 类型的权限必须填写 action")
        return
    if type_ in {"menu", "directory"}:
        if action is not None and action.strip():
            raise invalid("menu/directory 类型的权限不能填写 action")
        return
    raise invalid("权限类型只能是 menu、action 或 directory")
