"""Guards that stop lower-privileged accounts escalating grants."""

from __future__ import annotations

from collections.abc import Iterable

from app.errors import invalid
from app.security.dependencies import AuthContext


class GrantGuard:
    def __init__(self, auth: AuthContext) -> None:
        self._auth = auth

    def assert_can_assign_roles(self, role_ids: Iterable[str] | None) -> None:
        if not role_ids:
            return
        if "super" in set(role_ids) and not self._auth.is_super:
            raise invalid("只有超级管理员可以授予 super 角色")

    def assert_can_assign_permissions(self, permission_ids: Iterable[str] | None) -> None:
        if not permission_ids:
            return
        owned = self._auth.authorities
        for permission_id in permission_ids:
            if permission_id not in owned:
                raise invalid("不能授予当前账号没有的权限")
