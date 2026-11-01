import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import catalog from "./permissions.json";
import { routeSetting, type NavItem } from "@/routes";
import zh from "@/locale/zh-CN";
import en from "@/locale/en-US";

function flatten(nodes: NavItem[], parents: string[] = []) {
  const result: { path: string; title: string; leaf: boolean }[] = [];
  for (const node of nodes) {
    const keys = [...parents, node.key];
    const fullPath = "/" + keys.join("/");
    result.push({ path: fullPath, title: node.title, leaf: !node.children?.length });
    if (node.children?.length) {
      result.push(...flatten(node.children, keys));
    }
  }
  return result;
}

const routeNodes = flatten(routeSetting);
const routePaths = new Set(routeNodes.map((node) => node.path));
const catalogPaths = new Set(
  catalog.permissions
    .filter((permission) => permission.type !== "action")
    .map((permission) => permission.path),
);

describe("permission catalog", () => {
  it("has unique ids and valid parents", () => {
    const ids = new Set<string>();
    for (const permission of catalog.permissions) {
      expect(ids.has(permission.id), `duplicate id ${permission.id}`).toBe(false);
      ids.add(permission.id);
    }
    for (const permission of catalog.permissions) {
      if (permission.parentId) {
        expect(ids.has(permission.parentId), `missing parent ${permission.parentId}`).toBe(true);
      }
    }
  });

  it("covers every route leaf with a menu permission", () => {
    for (const node of routeNodes.filter((item) => item.leaf)) {
      expect(catalogPaths.has(node.path), `missing permission for ${node.path}`).toBe(true);
    }
  });

  it("does not keep permission paths that no longer exist in routes", () => {
    for (const permissionPath of catalogPaths) {
      expect(routePaths.has(permissionPath), `stale permission path ${permissionPath}`).toBe(true);
    }
  });

  it("has locale messages for every menu title", () => {
    for (const node of routeNodes) {
      expect(zh[node.title as keyof typeof zh], `missing zh title ${node.title}`).toBeTruthy();
      expect(en[node.title as keyof typeof en], `missing en title ${node.title}`).toBeTruthy();
    }
  });

  it("keeps dml.sql permission seed in sync with the catalog", () => {
    const dmlPath = path.resolve(import.meta.dirname, "../../../database/postgres/dml.sql");
    const dml = fs.readFileSync(dmlPath, "utf8");
    const block = dml.match(
      /-- BEGIN GENERATED PERMISSIONS[\s\S]*?-- END GENERATED PERMISSIONS/,
    )?.[0];
    expect(block, "dml.sql is missing generated permission markers").toBeTruthy();

    const ids = [...(block ?? "").matchAll(/\('([^']*)','[^']*','([^']*)'/g)];
    expect(ids).toHaveLength(catalog.permissions.length);
    for (const permission of catalog.permissions) {
      expect(
        ids.some((match) => match[1] === permission.id && match[2] === permission.path),
        `dml.sql missing ${permission.id} ${permission.path}`,
      ).toBe(true);
    }

    const grantsBlock = dml.match(
      /-- BEGIN GENERATED ROLE_PERMISSIONS[\s\S]*?-- END GENERATED ROLE_PERMISSIONS/,
    )?.[0];
    const grants = [...(grantsBlock ?? "").matchAll(/\('([^']*)','([^']*)'\)/g)];
    expect(grants.length).toBe(Object.values(catalog.rolePermissions).flat().length);
  });
});
