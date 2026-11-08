import {
  buildChildrenTree,
  type TreeChild,
} from "@/components/system/resource-list/tree";
import { getPermissionList } from "@/mock/system/permission";
import { http, HttpResponse } from "msw";

type MenuNode = {
  id: string;
  path: string;
  type: "menu" | "directory";
  name: string;
  children: MenuNode[];
};

type MenuRow = Omit<MenuNode, "children"> & {
  parentId?: string | null;
};

function toMenuNode(node: TreeChild<MenuRow>): MenuNode {
  return {
    id: node.id,
    path: node.path,
    type: node.type,
    name: node.name,
    children: (node.children ?? []).map(toMenuNode),
  };
}

function buildMenuTree(locale: string): MenuNode[] {
  const rows: MenuRow[] = getPermissionList(locale)
    .filter(
      (permission) =>
        permission.status === "1"
        && (permission.type === "menu" || permission.type === "directory"),
    )
    .map((permission) => ({
      id: permission.id,
      path: permission.path ?? "",
      type: permission.type as MenuNode["type"],
      name: permission.name,
      parentId: permission.parentId,
    }));

  // 与后端 MenuServiceImpl 一致：父节点被停用或缺失时丢弃整个分支。
  return buildChildrenTree(rows, {
    id: (node) => node.id,
    parentId: (node) => node.parentId,
    orphan: "drop",
  }).map(toMenuNode);
}

const handlers = [
  http.get("/api/v1/auth/menus", ({ request }) => {
    const locale = request.headers.get("locale") || "zh";
    return HttpResponse.json({ code: 200, data: buildMenuTree(locale) });
  }),
];

export default handlers;
