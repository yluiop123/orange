import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import catalog from "./permissions.json";
import { containerPaths, pageRoutes } from "@/lib/page-routes";

const menuPermissions = catalog.permissions.filter(
  (permission) => permission.type === "menu",
);
const directoryPermissions = catalog.permissions.filter(
  (permission) => permission.type === "directory",
);
const menuPaths = new Set(menuPermissions.map((permission) => permission.path));
const pagePaths = new Set(pageRoutes.map((route) => route.path));

// 菜单/目录节点如果有菜单或目录子节点，就只作为容器，不再对应页面
const nonActionPermissions = catalog.permissions.filter(
  (permission) => permission.type !== "action",
);
const containerIds = new Set(
  nonActionPermissions
    .map((permission) => permission.parentId)
    .filter((parentId): parentId is string => Boolean(parentId)),
);
const menuContainerPaths = new Set(
  nonActionPermissions
    .filter((permission) => containerIds.has(permission.id))
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

  it("keeps menu permission paths unique", () => {
    expect(menuPaths.size).toBe(menuPermissions.length);
  });

  it("has a page component for every leaf menu permission", () => {
    for (const permission of menuPermissions) {
      if (menuContainerPaths.has(permission.path)) {
        expect(
          pagePaths.has(permission.path),
          `container ${permission.path} must not be a page`,
        ).toBe(false);
        continue;
      }
      expect(
        pagePaths.has(permission.path),
        `missing page src/pages${permission.path}/index.tsx`,
      ).toBe(true);
    }
  });

  it("has a menu permission for every page", () => {
    for (const route of pageRoutes) {
      expect(menuPaths.has(route.path), `missing menu permission for ${route.path}`).toBe(true);
    }
  });

  it("does not attach pages to directory permissions", () => {
    for (const permission of directoryPermissions) {
      expect(
        pagePaths.has(permission.path),
        `directory ${permission.path} must not be a page`,
      ).toBe(false);
    }
  });

  it("does not register a page and a container on the same path", () => {
    for (const path of containerPaths) {
      expect(pagePaths.has(path), `container ${path} must not be a page`).toBe(false);
    }
  });

  it("has a display name for every menu and directory", () => {
    for (const permission of [...menuPermissions, ...directoryPermissions]) {
      expect(permission.name.zh, `missing zh name for ${permission.id}`).toBeTruthy();
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
