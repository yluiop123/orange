import { describe, expect, it } from "vitest";
import { createAccess } from "./access";
import type { Permission } from "@/store/permission";
import type { MenuNode } from "@/types/menu";

const permission = (
  path: string,
  type: Permission["type"],
  action = "",
): Permission => ({ path, role: "", type, action });

const access = createAccess([
  permission("/system/user", "menu"),
  permission("/system/user", "action", "add"),
  permission("/reports", "directory"),
  permission("/reports/sales", "menu"),
]);

const menus: MenuNode[] = [
  {
    id: "system",
    path: "/system",
    type: "menu",
    name: "System",
    children: [
      {
        id: "user",
        path: "/system/user",
        type: "menu",
        name: "Users",
        children: [],
      },
      {
        id: "role",
        path: "/system/role",
        type: "menu",
        name: "Roles",
        children: [],
      },
    ],
  },
  {
    id: "dashboard",
    path: "/dashboard",
    type: "menu",
    name: "Dashboard",
    children: [],
  },
  {
    id: "reports",
    path: "/reports",
    type: "menu",
    name: "Reports",
    children: [
      {
        id: "sales",
        path: "/reports/sales",
        type: "menu",
        name: "Sales",
        children: [],
      },
    ],
  },
];

describe("createAccess", () => {
  it("answers view questions from menu and directory permissions", () => {
    expect(access.canView("/system/user")).toBe(true);
    expect(access.canView("/system/role")).toBe(false);
    expect(access.canView("/reports/anything")).toBe(true);
    expect(access.canView("/dashboard")).toBe(false);
  });

  it("answers action questions only for the exact path and action", () => {
    expect(access.canAct("/system/user", "add")).toBe(true);
    expect(access.canAct("/system/user", "delete")).toBe(false);
    expect(access.canAct("/system/role", "add")).toBe(false);
  });

  it("filters the menu tree and finds the first visible leaf", () => {
    const visible = access.visibleMenuTree(menus);

    expect(visible.map((node) => node.id)).toEqual(["system", "reports"]);
    expect(visible[0].children.map((node) => node.id)).toEqual(["user"]);
    expect(visible[1].children.map((node) => node.id)).toEqual(["sales"]);
    expect(access.firstVisibleLeaf(menus)).toBe("/system/user");
  });

  it("returns empty results when there are no permissions", () => {
    const empty = createAccess();

    expect(empty.visibleMenuTree(menus)).toEqual([]);
    expect(empty.firstVisibleLeaf(menus)).toBeNull();
    expect(empty.canView("/system/user")).toBe(false);
    expect(empty.canAct("/system/user", "add")).toBe(false);
  });
});
