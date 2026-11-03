import { STATUS_DISABLE } from '../common/constants';

export interface PermissionLike {
  id: string;
  type: string;
  path: string;
  action?: string | null;
  status: string;
}

export interface RoleLike {
  id: string;
  name?: string | null;
  status: string;
  permissions?: PermissionLike[];
}

export interface UserLike {
  roles: RoleLike[];
  permissions: PermissionLike[];
}

export interface RolePermission {
  roleId: string;
  permission: PermissionLike;
}

export interface EffectivePermissions {
  roles: RoleLike[];
  rolePermissions: RolePermission[];
  directPermissions: PermissionLike[];
  permissions: PermissionLike[];
  authorities: Set<string>;
}

/**
 * Effective permissions = union of enabled roles' permissions plus direct
 * permissions, minus disabled permissions. This is the only place the filter
 * rules live; both the authority set and `/auth/user-info` derive from it.
 */
export function computeEffectivePermissions(user: UserLike): EffectivePermissions {
  const roles = (user.roles ?? []).filter((role) => role.status !== STATUS_DISABLE);

  const rolePermissions: RolePermission[] = [];
  for (const role of roles) {
    for (const permission of role.permissions ?? []) {
      if (permission.status !== STATUS_DISABLE) {
        rolePermissions.push({ roleId: role.id, permission });
      }
    }
  }

  const directPermissions = (user.permissions ?? []).filter(
    (permission) => permission.status !== STATUS_DISABLE,
  );

  const permissions = new Map<string, PermissionLike>();
  for (const item of rolePermissions) {
    permissions.set(item.permission.id, item.permission);
  }
  for (const permission of directPermissions) {
    permissions.set(permission.id, permission);
  }

  const authorities = new Set<string>();
  for (const permission of permissions.values()) {
    authorities.add(permission.id);
    authorities.add(authorityOf(permission));
  }

  return {
    roles,
    rolePermissions,
    directPermissions,
    permissions: [...permissions.values()],
    authorities,
  };
}

/** `type#path` or `type#path:action`, matching every controller annotation. */
export function authorityOf(permission: PermissionLike): string {
  const action = permission.action?.trim();
  return `${permission.type}#${permission.path}${action ? `:${action}` : ''}`;
}
