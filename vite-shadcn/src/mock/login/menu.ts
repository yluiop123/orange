import { http, HttpResponse } from "msw";
import { getPermissionList } from "@/mock/system/permission";

type MenuNode = {
  id: string;
  path: string;
  type: "menu" | "directory";
  name: string;
  children: MenuNode[];
};

function buildMenuTree(): MenuNode[] {
  const permissions = getPermissionList("zh")
    .filter(
      (permission) =>
        permission.status === "1" &&
        (permission.type === "menu" || permission.type === "directory"),
    )
    .sort((a, b) => (a.id === b.id ? 0 : a.id < b.id ? -1 : 1));

  const nodes = new Map<string, MenuNode>();
  for (const permission of permissions) {
    nodes.set(permission.id, {
      id: permission.id,
      path: permission.path ?? "",
      type: permission.type as MenuNode["type"],
      name: permission.name,
      children: [],
    });
  }

  const roots: MenuNode[] = [];
  for (const permission of permissions) {
    const node = nodes.get(permission.id);
    if (!node) continue;
    const parent = permission.parentId
      ? nodes.get(permission.parentId)
      : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

const handlers = [
  http.get("/api/user/menus", () => {
    return HttpResponse.json({ code: 200, data: buildMenuTree() });
  }),
];

export default handlers;
