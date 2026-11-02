import { http, HttpResponse } from "msw";
import catalog from "@/config/permissions.json";
import { STATUS_ENABLED, type Status } from "@/lib/status";
import { checkTreeCode, treeCodeIssueZh } from "@/lib/tree-code-policy";

type Locale = "zh" | "en";

type Permission = {
  name: string;
  id: string;
  path?: string;
  type: "menu" | "directory" | "action";
  action?: string;
  status: Status;
  createTime: string;
  parentId?: string | null;
};

type PermissionStore = {
  created: Permission[];
  updated: Record<string, Partial<Permission>>;
  deleted: string[];
};

const STORAGE_KEY = "orange.mock.system.permissions";

const successMessage: Record<string, string> = {
  zh: "操作成功",
  en: "Success",
};

function emptyStore(): PermissionStore {
  return { created: [], updated: {}, deleted: [] };
}

function readStore(): PermissionStore {
  if (typeof localStorage === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<PermissionStore>;
    return {
      created: Array.isArray(parsed.created) ? parsed.created : [],
      updated: parsed.updated ?? {},
      deleted: Array.isArray(parsed.deleted) ? parsed.deleted : [],
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: PermissionStore) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function nowText() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function byCode(a: { id: string }, b: { id: string }) {
  return a.id === b.id ? 0 : a.id < b.id ? -1 : 1;
}

export function getPermissionList(locale: string): Permission[] {
  const lang: Locale = locale === "en" ? "en" : "zh";
  const store = readStore();
  const base: Permission[] = catalog.permissions
    .filter((permission) => !store.deleted.includes(permission.id))
    .map((permission) => ({
      id: permission.id,
      name: permission.name[lang] ?? permission.name.zh,
      path: permission.path,
      type: permission.type as Permission["type"],
      action: permission.action ?? undefined,
      status: (permission.status as Status) ?? STATUS_ENABLED,
      parentId: permission.parentId,
      createTime: "2023-01-01 00:00:00",
      ...store.updated[permission.id],
    }));

  const created = store.created
    .filter((permission) => !store.deleted.includes(permission.id))
    .map((permission) => ({
      ...permission,
      ...store.updated[permission.id],
    }));

  return [...base, ...created].sort(byCode);
}

function persistPermission(permission: Permission) {
  const store = readStore();
  store.deleted = store.deleted.filter((id) => id !== permission.id);
  const existing = store.created.findIndex((item) => item.id === permission.id);
  if (existing >= 0) {
    store.created[existing] = permission;
  } else {
    store.created.push(permission);
  }
  writeStore(store);
}

function updatePermission(id: string, patch: Partial<Permission>) {
  const store = readStore();
  const created = store.created.find((item) => item.id === id);
  if (created) {
    Object.assign(created, patch);
  } else {
    store.updated[id] = { ...store.updated[id], ...patch };
  }
  writeStore(store);
}

function validateCode(id: string, parentId: string | null): string | null {
  const issue = checkTreeCode("permission", id, parentId);
  return issue ? treeCodeIssueZh("permission", issue) : null;
}

const handlers = [
  http.get("/api/v1/system/permissions", async ({ request }) => {
    const locale = request.headers.get("locale") || "zh";
    const url = new URL(request.url);
    const id = url.searchParams.get("id") || "";
    const name = url.searchParams.get("name") || "";
    const path = url.searchParams.get("path") || "";
    const status = url.searchParams.get("status") || "all";
    const type = url.searchParams.get("type") || "all";
    const all = getPermissionList(locale);
    const list = all.filter((item) => {
      if (id && !item.id.startsWith(id)) return false;
      if (name && !item.name.toLowerCase().startsWith(name.toLowerCase())) return false;
      if (path && !(item.path ?? "").toLowerCase().startsWith(path.toLowerCase())) return false;
      if (status !== "all" && item.status !== status) return false;
      if (type !== "all" && item.type !== type) return false;
      return true;
    });
    if (!id && !name && !path && type === "all") {
      return HttpResponse.json({ code: 200, data: list });
    }
    // 文本/类型筛选时带上祖先，前端才能保持树层级
    const byId = new Map(all.map((item) => [item.id, item]));
    const ids = new Set(list.map((item) => item.id));
    for (const item of list) {
      let parentId = item.parentId;
      while (parentId && ids.add(parentId)) {
        parentId = byId.get(parentId)?.parentId ?? null;
      }
    }
    return HttpResponse.json({
      code: 200,
      data: all.filter((item) => ids.has(item.id)).sort(byCode),
    });
  }),

  http.get<{ id: string }>("/api/v1/system/permissions/:id", async ({ request, params }) => {
    const locale = request.headers.get("locale") || "zh";
    const permission = getPermissionList(locale).find((item) => item.id === params.id);
    if (!permission) {
      return HttpResponse.json(
        { code: 40401, message: "权限不存在" },
        { status: 404 },
      );
    }
    return HttpResponse.json({ code: 200, data: permission });
  }),

  http.post("/api/v1/system/permissions/children", async ({ request }) => {
    const locale = request.headers.get("locale") || "zh";
    const body = (await request.clone().json()) as Partial<Permission>;
    const list = getPermissionList(locale);
    const id = body.id ?? "";
    const parentId = body.parentId || null;
    if (!id || list.some((item) => item.id === id)) {
      return HttpResponse.json(
        { code: 40901, message: "权限编码已存在" },
        { status: 409 },
      );
    }
    if (parentId !== null) {
      const parent = list.find((item) => item.id === parentId);
      if (!parent) {
        return HttpResponse.json(
          { code: 40401, message: "父权限不存在" },
          { status: 404 },
        );
      }
      if (parent.type === "action") {
        return HttpResponse.json(
          { code: 40001, message: "动作权限不能添加子节点" },
          { status: 400 },
        );
      }
    }
    const codeError = validateCode(id, parentId);
    if (codeError) {
      return HttpResponse.json({ code: 40001, message: codeError }, { status: 400 });
    }
    const permission: Permission = {
      id,
      name: body.name || id,
      path: body.path,
      type: (body.type as Permission["type"]) || "menu",
      action: body.action,
      status: STATUS_ENABLED,
      parentId,
      createTime: nowText(),
    };
    persistPermission(permission);
    return HttpResponse.json({
      code: 200,
      message: successMessage[locale] ?? successMessage.zh,
      data: permission.id,
    });
  }),

  http.patch<{ id: string }>("/api/v1/system/permissions/:id", async ({ request, params }) => {
    const locale = request.headers.get("locale") || "zh";
    if (!getPermissionList(locale).some((item) => item.id === params.id)) {
      return HttpResponse.json(
        { code: 40401, message: "权限不存在" },
        { status: 404 },
      );
    }
    const body = (await request.clone().json()) as Partial<Permission>;
    updatePermission(params.id, body);
    return HttpResponse.json({
      code: 200,
      message: successMessage[locale] ?? successMessage.zh,
    });
  }),

  http.delete("/api/v1/system/permissions", async ({ request }) => {
    const locale = request.headers.get("locale") || "zh";
    const url = new URL(request.url);
    const ids = (url.searchParams.get("ids") || "").split(",").filter(Boolean);
    const store = readStore();
    const all = getPermissionList(locale);
    const toDelete = new Set(ids);
    let changed = true;
    while (changed) {
      changed = false;
      for (const item of all) {
        if (item.parentId && toDelete.has(item.parentId) && !toDelete.has(item.id)) {
          toDelete.add(item.id);
          changed = true;
        }
      }
    }
    store.deleted = [...new Set([...store.deleted, ...toDelete])];
    store.created = store.created.filter((item) => !toDelete.has(item.id));
    writeStore(store);
    return HttpResponse.json({
      code: 200,
      message: successMessage[locale] ?? successMessage.zh,
    });
  }),
];

export default handlers;
