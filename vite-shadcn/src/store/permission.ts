export const ALL_ROLES = "all";

export type Permission = {
  path: string;
  role: string;
  type: string;
  action: string;
};

export type PermissionSource = {
  currentRole?: string;
  userPermissions?: Permission[];
  rolePermissions?: Permission[];
};

export type ComputedPermissions = {
  currentPermission: Permission[];
  currentMenuPermission: string[];
  currentDirectoryPermission: string[];
};

/**
 * 根据当前角色计算用户实际拥有的权限。
 * fetchUser（首次加载/刷新）与 updateUserInfo（切换角色）共用，避免两处逻辑漂移。
 */
export function computePermissions(
  source: PermissionSource,
): ComputedPermissions {
  const currentRole = source.currentRole || ALL_ROLES;
  const currentPermission = [
    ...(source.userPermissions ?? []),
    ...(source.rolePermissions ?? []).filter(
      (item) => currentRole === ALL_ROLES || item.role === currentRole,
    ),
  ];

  return {
    currentPermission,
    currentMenuPermission: currentPermission
      .filter((item) => item.type === "menu")
      .map((item) => item.path),
    currentDirectoryPermission: currentPermission
      .filter((item) => item.type === "directory")
      .map((item) => item.path),
  };
}
