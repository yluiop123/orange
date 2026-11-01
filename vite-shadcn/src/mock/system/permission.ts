import { http, HttpResponse } from "msw";
import catalog from "@/config/permissions.json";

type Locale = "zh" | "en";

type Permission = {
  name: string;
  id: string;
  path?: string;
  type: "menu" | "directory" | "action";
  action?: string;
  status: "0" | "1";
  createTime: string;
  parentId?: string | null;
  order: number;
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
      status: (permission.status as "0" | "1") ?? "1",
      parentId: permission.parentId,
      order: permission.order ?? 0,
      createTime: "2023-01-01 00:00:00",
      ...store.updated[permission.id],
    }));

  const created = store.created
    .filter((permission) => !store.deleted.includes(permission.id))
    .map((permission) => ({
      ...permission,
      ...store.updated[permission.id],
    }));

  return [...base, ...created];
}

function reindexSiblings(list: Permission[], parentId: string | null | undefined) {
  const siblings = list
    .filter((item) => (item.parentId ?? null) === (parentId ?? null))
    .sort((a, b) => a.order - b.order);
  const store = readStore();
  siblings.forEach((item, index) => {
    if (item.order !== index) {
      store.updated[item.id] = { ...store.updated[item.id], order: index };
    }
  });
  writeStore(store);
  return siblings.map((item, index) => ({ ...item, order: index }));
}

function persistPermission(permission: Permission) {
  const store = readStore();
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

const handlers = [
  http.get("/api/system/permissions", async ({ request }) => {
    const locale = request.headers.get("locale") || "zh";
    const url = new URL(request.url);
    const id = url.searchParams.get("id") || "";
    const name = url.searchParams.get("name") || "";
    const path = url.searchParams.get("path") || "";
    const status = url.searchParams.get("status") || "all";
    const list = getPermissionList(locale).filter((item) => {
      if (id && !item.id.startsWith(id)) return false;
      if (name && !item.name.toLowerCase().startsWith(name.toLowerCase())) return false;
      if (path && !(item.path ?? "").toLowerCase().startsWith(path.toLowerCase())) return false;
      if (status !== "all" && item.status !== status) return false;
      return true;
    });
    return HttpResponse.json({ code: 200, data: list });
  }),

  http.get<{ id: string }>("/api/system/permissions/:id", async ({ request, params }) => {
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

  http.post("/api/system/permissions/children", async ({ request }) => {
    const locale = request.headers.get("locale") || "zh";
    const body = (await request.clone().json()) as Partial<Permission>;
    if (!body.id || getPermissionList(locale).some((item) => item.id === body.id)) {
      return HttpResponse.json(
        { code: 40901, message: "权限编码已存在" },
        { status: 409 },
      );
    }
    const parentId = body.parentId || null;
    const siblings = getPermissionList(locale).filter(
      (item) => (item.parentId ?? null) === parentId,
    );
    const permission: Permission = {
      id: body.id,
      name: body.name || body.id,
      path: body.path,
      type: (body.type as Permission["type"]) || "menu",
      action: body.action,
      status: "1",
      parentId,
      order: siblings.length,
      createTime: nowText(),
    };
    persistPermission(permission);
    return HttpResponse.json({
      code: 200,
      message: successMessage[locale] ?? successMessage.zh,
      data: permission.id,
    });
  }),

  http.post("/api/system/permissions/siblings", async ({ request }) => {
    const locale = request.headers.get("locale") || "zh";
    const body = (await request.clone().json()) as Partial<Permission> & {
      brotherId?: string;
    };
    const list = getPermissionList(locale);
    if (!body.id || list.some((item) => item.id === body.id)) {
      return HttpResponse.json(
        { code: 40901, message: "权限编码已存在" },
        { status: 409 },
      );
    }
    const brother = list.find((item) => item.id === body.brotherId);
    if (!brother) {
      return HttpResponse.json(
        { code: 40401, message: "同级权限不存在" },
        { status: 404 },
      );
    }
    const permission: Permission = {
      id: body.id,
      name: body.name || body.id,
      path: body.path,
      type: (body.type as Permission["type"]) || "menu",
      action: body.action,
      status: "1",
      parentId: brother.parentId ?? null,
      order: brother.order,
      createTime: nowText(),
    };
    persistPermission(permission);
    const after = reindexSiblings(getPermissionList(locale), permission.parentId);
    const created = after.find((item) => item.id === permission.id);
    if (created) updatePermission(created.id, { order: created.order });
    return HttpResponse.json({
      code: 200,
      message: successMessage[locale] ?? successMessage.zh,
      data: permission.id,
    });
  }),

  http.patch<{ id: string }>("/api/system/permissions/:id", async ({ request, params }) => {
    const locale = request.headers.get("locale") || "zh";
    const body = (await request.clone().json()) as Partial<Permission>;
    updatePermission(params.id, body);
    return HttpResponse.json({
      code: 200,
      message: successMessage[locale] ?? successMessage.zh,
    });
  }),

  http.post<{ id: string }>("/api/system/permissions/:id/move", async ({ request, params }) => {
    const locale = request.headers.get("locale") || "zh";
    const body = (await request.clone().json()) as { action?: "up" | "down" | "top" };
    const list = getPermissionList(locale);
    const target = list.find((item) => item.id === params.id);
    if (!target) {
      return HttpResponse.json(
        { code: 40401, message: "权限不存在" },
        { status: 404 },
      );
    }
    const siblings = list
      .filter((item) => (item.parentId ?? null) === (target.parentId ?? null))
      .sort((a, b) => a.order - b.order);
    const index = siblings.findIndex((item) => item.id === target.id);
    if (body.action === "top") {
      siblings.splice(index, 1);
      siblings.unshift(target);
    } else if (body.action === "up" && index > 0) {
      [siblings[index - 1], siblings[index]] = [siblings[index], siblings[index - 1]];
    } else if (body.action === "down" && index < siblings.length - 1) {
      [siblings[index + 1], siblings[index]] = [siblings[index], siblings[index + 1]];
    }
    const store = readStore();
    siblings.forEach((item, order) => {
      store.updated[item.id] = { ...store.updated[item.id], order };
    });
    writeStore(store);
    return HttpResponse.json({
      code: 200,
      message: successMessage[locale] ?? successMessage.zh,
    });
  }),

  http.delete("/api/system/permissions", async ({ request }) => {
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
