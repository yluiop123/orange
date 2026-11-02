import { http, HttpResponse } from "msw";

type Group = {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
  status: "0" | "1";
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
  "0001": "人事部",
  "0002": "后勤部",
  "0003": "研发部",
  "000301": "研发1部",
  "000302": "研发2部",
  "000303": "研发3部",
};
const en: Record<string, string> = {
  success: "Success",
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

function getGroupList(locale: string): Group[] {
  const dict = localeMap[locale] ?? zh;
  const store = readStore();
  const seed: Group[] = [
    { id: "0001", parentId: null, order: 0 },
    { id: "0002", parentId: null, order: 1 },
    { id: "0003", parentId: null, order: 2 },
    { id: "000301", parentId: "0003", order: 0 },
    { id: "000302", parentId: "0003", order: 1 },
    { id: "000303", parentId: "0003", order: 2 },
  ].map((item) => ({
    ...item,
    name: dict[item.id] ?? item.id,
    status: "1",
    createTime: "2023-01-01 00:00:00",
    updateTime: "2023-01-01 00:00:00",
  }));

  const base = seed
    .filter((item) => !store.deleted.includes(item.id))
    .map((item) => ({ ...item, ...store.updated[item.id] }));
  const created = store.created
    .filter((item) => !store.deleted.includes(item.id))
    .map((item) => ({ ...item, ...store.updated[item.id] }));

  return [...base, ...created];
}

function nextOrder(list: Group[], parentId: string | null) {
  const siblings = list.filter((item) => (item.parentId ?? null) === parentId);
  return siblings.length === 0 ? 0 : Math.max(...siblings.map((item) => item.order)) + 1;
}

function reindex(list: Group[], parentId: string | null) {
  const store = readStore();
  list
    .filter((item) => (item.parentId ?? null) === parentId)
    .sort((a, b) => a.order - b.order)
    .forEach((item, index) => {
      if (item.order !== index) {
        store.updated[item.id] = { ...store.updated[item.id], order: index };
      }
    });
  writeStore(store);
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

const handlers = [
  http.get("/api/system/groups", async ({ request }) => {
    const locale = request.headers.get("locale") || "zh";
    const url = new URL(request.url);
    const id = url.searchParams.get("id") || "";
    const name = url.searchParams.get("name") || "";
    const status = url.searchParams.get("status") || "all";
    const list = getGroupList(locale).filter((item) => {
      if (id && !item.id.startsWith(id)) return false;
      if (name && !item.name.toLowerCase().startsWith(name.toLowerCase())) return false;
      if (status !== "all" && item.status !== status) return false;
      return true;
    });
    return HttpResponse.json({ code: 200, data: list });
  }),

  http.get<{ id: string }>("/api/system/groups/:id", async ({ request, params }) => {
    const locale = request.headers.get("locale") || "zh";
    const group = getGroupList(locale).find((item) => item.id === params.id);
    if (!group) {
      return HttpResponse.json({ code: 40401, message: "组织不存在" }, { status: 404 });
    }
    return HttpResponse.json({ code: 200, data: group });
  }),

  http.post("/api/system/groups/children", async ({ request }) => {
    const locale = request.headers.get("locale") || "zh";
    const body = (await request.clone().json()) as Partial<Group>;
    const list = getGroupList(locale);
    if (!body.id || list.some((item) => item.id === body.id)) {
      return HttpResponse.json({ code: 40901, message: "组织编码已存在" }, { status: 409 });
    }
    const parentId = body.parentId || null;
    const group: Group = {
      id: body.id,
      name: body.name || body.id,
      parentId,
      order: nextOrder(list, parentId),
      status: "1",
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

  http.post("/api/system/groups/siblings", async ({ request }) => {
    const locale = request.headers.get("locale") || "zh";
    const body = (await request.clone().json()) as Partial<Group> & {
      brotherId?: string;
    };
    const list = getGroupList(locale);
    if (!body.id || list.some((item) => item.id === body.id)) {
      return HttpResponse.json({ code: 40901, message: "组织编码已存在" }, { status: 409 });
    }
    const brother = list.find((item) => item.id === body.brotherId);
    if (!brother) {
      return HttpResponse.json({ code: 40401, message: "同级组织不存在" }, { status: 404 });
    }
    const group: Group = {
      id: body.id,
      name: body.name || body.id,
      parentId: brother.parentId,
      order: brother.order,
      status: "1",
      createTime: nowText(),
      updateTime: nowText(),
    };
    persistGroup(group);
    const after = [...getGroupList(locale)].sort((a, b) => {
      if ((a.parentId ?? null) !== (b.parentId ?? null)) return 0;
      return a.order - b.order;
    });
    reindex(after, brother.parentId);
    return HttpResponse.json({
      code: 200,
      message: localeMap[locale]?.["success"] ?? zh.success,
      data: group.id,
    });
  }),

  http.patch<{ id: string }>("/api/system/groups/:id", async ({ request, params }) => {
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

  http.patch<{ id: string }>("/api/system/groups/:id/status", async ({ request, params }) => {
    const locale = request.headers.get("locale") || "zh";
    if (!getGroupList(locale).some((item) => item.id === params.id)) {
      return HttpResponse.json({ code: 40401, message: "组织不存在" }, { status: 404 });
    }
    const body = (await request.clone().json()) as { status?: "0" | "1" };
    updateGroup(params.id, { status: body.status });
    return HttpResponse.json({
      code: 200,
      message: localeMap[locale]?.["success"] ?? zh.success,
    });
  }),

  http.post<{ id: string }>("/api/system/groups/:id/move", async ({ request, params }) => {
    const locale = request.headers.get("locale") || "zh";
    const body = (await request.clone().json()) as { action?: "up" | "down" | "top" };
    const list = getGroupList(locale);
    const target = list.find((item) => item.id === params.id);
    if (!target) {
      return HttpResponse.json({ code: 40401, message: "组织不存在" }, { status: 404 });
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
      message: localeMap[locale]?.["success"] ?? zh.success,
    });
  }),

  http.delete("/api/system/groups", async ({ request }) => {
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
