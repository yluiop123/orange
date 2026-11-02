import { http, HttpResponse } from "msw";
import catalog from "@/config/permissions.json";

type Role = {
  id: string;
  name: string;
  status: "0" | "1";
  createTime: string;
  updateTime: string;
  permissions: string[];
};

type RoleStore = {
  created: Role[];
  updated: Record<string, Partial<Role>>;
  deleted: string[];
};

const STORAGE_KEY = "orange.mock.system.roles";

const zh = {
  super: "超级管理员",
  admin: "管理员",
  user: "普通用户",
  success: "操作成功",
};
const en = {
  super: "Super",
  admin: "Admin",
  user: "User",
  success: "Success",
};
const localeMap: Record<string, Record<string, string>> = { zh, en };

function emptyStore(): RoleStore {
  return { created: [], updated: {}, deleted: [] };
}

function readStore(): RoleStore {
  if (typeof localStorage === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<RoleStore>;
    return {
      created: Array.isArray(parsed.created) ? parsed.created : [],
      updated: parsed.updated ?? {},
      deleted: Array.isArray(parsed.deleted) ? parsed.deleted : [],
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: RoleStore) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function nowText() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function getRoleList(locale: string): Role[] {
  const dict = localeMap[locale] ?? zh;
  const store = readStore();
  const seedIds = ["super", "admin", "user"];
  const base = seedIds
    .filter((id) => !store.deleted.includes(id))
    .map((id) => {
      const createTime = "2025-01-01 23:59:59";
      const role: Role = {
        id,
        name: dict[id] ?? id,
        status: "1",
        createTime,
        updateTime: createTime,
        permissions: catalog.rolePermissions[id as keyof typeof catalog.rolePermissions] ?? [],
      };
      return { ...role, ...store.updated[id] };
    });

  const created = store.created
    .filter((role) => !store.deleted.includes(role.id))
    .map((role) => ({ ...role, ...store.updated[role.id] }));

  return [...base, ...created];
}

function persistRole(role: Role) {
  const store = readStore();
  store.deleted = store.deleted.filter((id) => id !== role.id);
  const index = store.created.findIndex((item) => item.id === role.id);
  if (index >= 0) {
    store.created[index] = role;
  } else {
    store.created.push(role);
  }
  writeStore(store);
}

function updateRole(id: string, patch: Partial<Role>) {
  const store = readStore();
  const created = store.created.find((item) => item.id === id);
  if (created) {
    Object.assign(created, patch, { updateTime: nowText() });
  } else {
    store.updated[id] = { ...store.updated[id], ...patch, updateTime: nowText() };
  }
  writeStore(store);
}

const handlers = [
  http.get("/api/system/roles", async ({ request }) => {
    const locale = request.headers.get("locale") || "zh";
    const url = new URL(request.url);
    const id = url.searchParams.get("id") || "";
    const name = url.searchParams.get("name") || "";
    const status = url.searchParams.get("status") || "";
    const page = Number(url.searchParams.get("page") || 1);
    const size = Number(url.searchParams.get("size") || 10);
    const orderField = url.searchParams.get("orderField");
    const orderValue = url.searchParams.get("orderValue");
    let list = getRoleList(locale);
    if (id) list = list.filter((item) => item.id.startsWith(id));
    if (name) list = list.filter((item) => item.name.toLowerCase().startsWith(name.toLowerCase()));
    if (status && status !== "all") list = list.filter((item) => item.status === status);
    if (orderField) {
      list = [...list].sort((a, b) => {
        const av = a[orderField as keyof Role];
        const bv = b[orderField as keyof Role];
        if (av === bv) return 0;
        const result = av > bv ? 1 : -1;
        return orderValue === "desc" ? -result : result;
      });
    }
    const start = (page - 1) * size;
    return HttpResponse.json({
      code: 200,
      data: {
        list: list.slice(start, start + size),
        total: list.length,
        page,
        size,
        totalPages: Math.max(1, Math.ceil(list.length / size)),
      },
    });
  }),

  http.get<{ id: string }>("/api/system/roles/:id", async ({ request, params }) => {
    const locale = request.headers.get("locale") || "zh";
    const role = getRoleList(locale).find((item) => item.id === params.id);
    if (!role) {
      return HttpResponse.json({ code: 40401, message: "角色不存在" }, { status: 404 });
    }
    return HttpResponse.json({ code: 200, data: role });
  }),

  http.post("/api/system/roles", async ({ request }) => {
    const locale = request.headers.get("locale") || "zh";
    const body = (await request.clone().json()) as Partial<Role>;
    const list = getRoleList(locale);
    const id = body.id || crypto.randomUUID();
    if (list.some((item) => item.id === id)) {
      return HttpResponse.json({ code: 40901, message: "角色ID已存在" }, { status: 409 });
    }
    const now = nowText();
    const role: Role = {
      id,
      name: body.name || id,
      status: "1",
      createTime: now,
      updateTime: now,
      permissions: body.permissions ?? [],
    };
    persistRole(role);
    return HttpResponse.json({
      code: 200,
      message: localeMap[locale]?.["success"] ?? zh.success,
      data: role.id,
    });
  }),

  http.patch<{ id: string }>("/api/system/roles/:id", async ({ request, params }) => {
    const locale = request.headers.get("locale") || "zh";
    if (!getRoleList(locale).some((item) => item.id === params.id)) {
      return HttpResponse.json({ code: 40401, message: "角色不存在" }, { status: 404 });
    }
    const body = (await request.clone().json()) as Partial<Role>;
    updateRole(params.id, body);
    return HttpResponse.json({
      code: 200,
      message: localeMap[locale]?.["success"] ?? zh.success,
    });
  }),

  http.delete("/api/system/roles", async ({ request }) => {
    const locale = request.headers.get("locale") || "zh";
    const url = new URL(request.url);
    const ids = (url.searchParams.get("ids") || "").split(",").filter(Boolean);
    const store = readStore();
    store.deleted = [...new Set([...store.deleted, ...ids])];
    store.created = store.created.filter((item) => !ids.includes(item.id));
    writeStore(store);
    return HttpResponse.json({
      code: 200,
      message: localeMap[locale]?.["success"] ?? zh.success,
    });
  }),
];

export default handlers;
