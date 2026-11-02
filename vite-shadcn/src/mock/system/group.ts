import { http, HttpResponse } from "msw";
import { STATUS_ENABLED, type Status } from "@/lib/status";

type Group = {
  id: string;
  name: string;
  parentId: string | null;
  status: Status;
  createTime: string;
  updateTime?: string;
};

type GroupStore = {
  created: Group[];
  updated: Record<string, Partial<Group>>;
  deleted: string[];
};

const STORAGE_KEY = "orange.mock.system.groups";

const zh: Record<string, string> = {
  success: "操作成功",
  "00": "总公司",
  "0001": "人事部",
  "0002": "后勤部",
  "0003": "研发部",
  "000301": "研发1部",
  "000302": "研发2部",
  "000303": "研发3部",
};
const en: Record<string, string> = {
  success: "Success",
  "00": "Headquarters",
  "0001": "Human Resources Department",
  "0002": "Logistics Department",
  "0003": "Development Department",
  "000301": "Development 1 Department",
  "000302": "Development 2 Department",
  "000303": "Development 3 Department",
};
const localeMap: Record<string, Record<string, string>> = { zh, en };

function emptyStore(): GroupStore {
  return { created: [], updated: {}, deleted: [] };
}

function readStore(): GroupStore {
  if (typeof localStorage === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<GroupStore>;
    return {
      created: Array.isArray(parsed.created) ? parsed.created : [],
      updated: parsed.updated ?? {},
      deleted: Array.isArray(parsed.deleted) ? parsed.deleted : [],
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: GroupStore) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function nowText() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function byCode(a: { id: string }, b: { id: string }) {
  return a.id === b.id ? 0 : a.id < b.id ? -1 : 1;
}

export function getGroupList(locale: string): Group[] {
  const dict = localeMap[locale] ?? zh;
  const store = readStore();
  const seed: Group[] = [
    { id: "00", parentId: null },
    { id: "0001", parentId: "00" },
    { id: "0002", parentId: "00" },
    { id: "0003", parentId: "00" },
    { id: "000301", parentId: "0003" },
    { id: "000302", parentId: "0003" },
    { id: "000303", parentId: "0003" },
  ].map((item) => ({
    ...item,
    name: dict[item.id] ?? item.id,
    status: STATUS_ENABLED,
    createTime: "2023-01-01 00:00:00",
    updateTime: "2023-01-01 00:00:00",
  }));

  const base = seed
    .filter((item) => !store.deleted.includes(item.id))
    .map((item) => ({ ...item, ...store.updated[item.id] }));
  const created = store.created
    .filter((item) => !store.deleted.includes(item.id))
    .map((item) => ({ ...item, ...store.updated[item.id] }));

  return [...base, ...created].sort(byCode);
}

function persistGroup(group: Group) {
  const store = readStore();
  store.deleted = store.deleted.filter((id) => id !== group.id);
  const index = store.created.findIndex((item) => item.id === group.id);
  if (index >= 0) store.created[index] = group;
  else store.created.push(group);
  writeStore(store);
}

function updateGroup(id: string, patch: Partial<Group>) {
  const store = readStore();
  const created = store.created.find((item) => item.id === id);
  if (created) Object.assign(created, patch, { updateTime: nowText() });
  else store.updated[id] = { ...store.updated[id], ...patch, updateTime: nowText() };
  writeStore(store);
}

function validateCode(id: string, parentId: string | null): string | null {
  if (!/^\d+$/.test(id)) return "组织编码只能包含数字";
  if (parentId === null) {
    return id.length === 2 ? null : "根组织编码长度必须为2";
  }
  if (id.length !== parentId.length + 2) {
    return `组织编码长度必须为${parentId.length + 2}`;
  }
  if (!id.startsWith(parentId)) return `组织编码必须以${parentId}开头`;
  return null;
}

const handlers = [
  http.get("/api/v1/system/groups", async ({ request }) => {
    const locale = request.headers.get("locale") || "zh";
    const url = new URL(request.url);
    const id = url.searchParams.get("id") || "";
    const name = url.searchParams.get("name") || "";
    const status = url.searchParams.get("status") || "all";
    const all = getGroupList(locale);
    const list = all.filter((item) => {
      if (id && !item.id.startsWith(id)) return false;
      if (name && !item.name.toLowerCase().startsWith(name.toLowerCase())) return false;
      if (status !== "all" && item.status !== status) return false;
      return true;
    });
    if (!id && !name) {
      return HttpResponse.json({ code: 200, data: list });
    }
    // 文本筛选时带上祖先，前端才能保持树层级
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

  http.get<{ id: string }>("/api/v1/system/groups/:id", async ({ request, params }) => {
    const locale = request.headers.get("locale") || "zh";
    const group = getGroupList(locale).find((item) => item.id === params.id);
    if (!group) {
      return HttpResponse.json({ code: 40401, message: "组织不存在" }, { status: 404 });
    }
    return HttpResponse.json({ code: 200, data: group });
  }),

  http.post("/api/v1/system/groups/children", async ({ request }) => {
    const locale = request.headers.get("locale") || "zh";
    const body = (await request.clone().json()) as Partial<Group>;
    const list = getGroupList(locale);
    const id = body.id ?? "";
    const parentId = body.parentId || null;
    if (!id || list.some((item) => item.id === id)) {
      return HttpResponse.json({ code: 40901, message: "组织编码已存在" }, { status: 409 });
    }
    if (parentId !== null && !list.some((item) => item.id === parentId)) {
      return HttpResponse.json({ code: 40401, message: "父组织不存在" }, { status: 404 });
    }
    const codeError = validateCode(id, parentId);
    if (codeError) {
      return HttpResponse.json({ code: 40001, message: codeError }, { status: 400 });
    }
    const group: Group = {
      id,
      name: body.name || id,
      parentId,
      status: STATUS_ENABLED,
      createTime: nowText(),
      updateTime: nowText(),
    };
    persistGroup(group);
    return HttpResponse.json({
      code: 200,
      message: localeMap[locale]?.["success"] ?? zh.success,
      data: group.id,
    });
  }),

  http.patch<{ id: string }>("/api/v1/system/groups/:id", async ({ request, params }) => {
    const locale = request.headers.get("locale") || "zh";
    if (!getGroupList(locale).some((item) => item.id === params.id)) {
      return HttpResponse.json({ code: 40401, message: "组织不存在" }, { status: 404 });
    }
    const body = (await request.clone().json()) as Partial<Group>;
    updateGroup(params.id, body);
    return HttpResponse.json({
      code: 200,
      message: localeMap[locale]?.["success"] ?? zh.success,
    });
  }),

  http.patch<{ id: string }>("/api/v1/system/groups/:id/status", async ({ request, params }) => {
    const locale = request.headers.get("locale") || "zh";
    if (!getGroupList(locale).some((item) => item.id === params.id)) {
      return HttpResponse.json({ code: 40401, message: "组织不存在" }, { status: 404 });
    }
    const body = (await request.clone().json()) as { status?: Status };
    updateGroup(params.id, { status: body.status });
    return HttpResponse.json({
      code: 200,
      message: localeMap[locale]?.["success"] ?? zh.success,
    });
  }),

  http.delete("/api/v1/system/groups", async ({ request }) => {
    const locale = request.headers.get("locale") || "zh";
    const url = new URL(request.url);
    const ids = (url.searchParams.get("ids") || "").split(",").filter(Boolean);
    const all = getGroupList(locale);
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
    const store = readStore();
    const users = JSON.parse(localStorage.getItem("orange.mock.users") || "[]") as Array<{ groupId?: string }>;
    if (users.some((user) => user.groupId && toDelete.has(user.groupId))) {
      return HttpResponse.json(
        { code: 40901, message: "组织或其子组织下有用户，不能删除" },
        { status: 409 },
      );
    }
    store.deleted = [...new Set([...store.deleted, ...toDelete])];
    store.created = store.created.filter((item) => !toDelete.has(item.id));
    writeStore(store);
    return HttpResponse.json({
      code: 200,
      message: localeMap[locale]?.["success"] ?? zh.success,
    });
  }),
];

export default handlers;
