import { describe, expect, it } from "vitest";
import { ALL_ROLES, computePermissions, type Permission } from "./permission";

const permission = (
  path: string,
  role: string,
  type: "menu" | "directory" | "action",
): Permission => ({ path, role, type, action: type === "action" ? "add" : "" });

const userPermissions = [permission("/profile", "", "menu")];
const rolePermissions = [
  permission("/system", "admin", "directory"),
  permission("/system/user", "admin", "menu"),
  permission("/system/role", "admin", "menu"),
  permission("/dashboard", "user", "directory"),
  permission("/dashboard/normal", "user", "menu"),
];

describe("computePermissions", () => {
  it("merges user permissions with the selected role permissions", () => {
    const result = computePermissions({
      currentRole: "admin",
      userPermissions,
      rolePermissions,
    });

    expect(result.currentPermission.map((item) => item.path)).toEqual([
      "/profile",
      "/system",
      "/system/user",
      "/system/role",
    ]);
    expect(result.currentMenuPermission).toEqual([
      "/profile",
      "/system/user",
      "/system/role",
    ]);
    expect(result.currentDirectoryPermission).toEqual(["/system"]);
  });

  it("includes every role when currentRole is all", () => {
    const result = computePermissions({
      currentRole: ALL_ROLES,
      userPermissions: [],
      rolePermissions,
    });

    expect(result.currentMenuPermission).toContain("/system/user");
    expect(result.currentMenuPermission).toContain("/dashboard/normal");
    expect(result.currentDirectoryPermission).toEqual([
      "/system",
      "/dashboard",
    ]);
  });

  it("falls back to all when currentRole is missing", () => {
    const result = computePermissions({ rolePermissions });
    expect(result.currentPermission).toHaveLength(rolePermissions.length);
  });

  it("returns empty lists when there are no permissions", () => {
    const result = computePermissions({ currentRole: "admin" });
    expect(result.currentPermission).toEqual([]);
    expect(result.currentMenuPermission).toEqual([]);
    expect(result.currentDirectoryPermission).toEqual([]);
  });
});
