"""Effective permissions: enabled roles union direct grants, minus disabled.

Both the Spring authorities and ``/auth/user-info`` derive from this single
function so the two checks can never diverge.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol

STATUS_DISABLE = "0"


class PermissionLike(Protocol):
    id: str
    type: str
    path: str
    action: str | None
    status: str


class RoleLike(Protocol):
    id: str
    name: str | None
    status: str
    permissions: Any


class UserLike(Protocol):
    roles: Any
    permissions: Any


@dataclass(frozen=True)
class RolePermission:
    role_id: str
    permission: PermissionLike


@dataclass(frozen=True)
class EffectivePermissions:
    roles: list[RoleLike]
    role_permissions: list[RolePermission]
    direct_permissions: list[PermissionLike]
    permissions: list[PermissionLike]
    authorities: list[str]

    @classmethod
    def of(cls, user: UserLike) -> "EffectivePermissions":
        active_roles = sorted(
            (role for role in (user.roles or []) if role.status != STATUS_DISABLE),
            key=lambda role: role.id,
        )

        role_permissions: list[RolePermission] = []
        for role in active_roles:
            for permission in sorted(role.permissions or [], key=lambda item: item.id):
                if permission.status != STATUS_DISABLE:
                    role_permissions.append(RolePermission(role.id, permission))

        direct_permissions = sorted(
            (
                permission
                for permission in (user.permissions or [])
                if permission.status != STATUS_DISABLE
            ),
            key=lambda permission: permission.id,
        )

        merged: dict[str, PermissionLike] = {}
        for entry in role_permissions:
            merged.setdefault(entry.permission.id, entry.permission)
        for permission in direct_permissions:
            merged.setdefault(permission.id, permission)

        permissions = [merged[key] for key in sorted(merged)]
        authorities: list[str] = []
        seen: set[str] = set()
        for permission in permissions:
            for authority in (permission.id, authority_of(permission)):
                if authority not in seen:
                    seen.add(authority)
                    authorities.append(authority)

        return cls(
            roles=active_roles,
            role_permissions=role_permissions,
            direct_permissions=direct_permissions,
            permissions=permissions,
            authorities=authorities,
        )

    @property
    def authority_set(self) -> set[str]:
        return set(self.authorities)


def authority_of(permission: PermissionLike) -> str:
    authority = f"{permission.type}#{permission.path}"
    action = permission.action
    if action is not None and action.strip():
        authority += f":{action}"
    return authority
