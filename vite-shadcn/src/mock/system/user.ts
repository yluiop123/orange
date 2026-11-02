import { http, HttpResponse } from "msw";
import { STATUS_ENABLED, type Status } from "@/lib/status";

const zh = {
  roles:{    
    'super':'超级管理员',
    'admin':'管理员',
    'user':'普通用户',
  },
  user: "用户",
  group: "组织",
  success: "操作成功",
  "0001": "人事部",
  "0002": "后勤部",
  "0003": "研发部",
  "000301": "研发1部",
  "000302": "研发2部",
  "000303": "研发3部",
};
const en = {
  roles:{    
    'super':'Super',
    'admin':'Admin',
    'user':'User',
  },
  user: "User",
  group: "Group",
  success: "Success",
  "0001": "Human Resources Department",
  "0002": "IT Department",
  "0003": "Development Department",
  "000301": "Development 1 Department",
  "000302": "Development 2 Department",
  "000303": "Development 3 Department",
};
const localeMap: Record<string, Record<string, string|Record<string,string>>> = {
  zh,
  en,
};
type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  groupId: string;
  groupName: string;
  status: Status;
  createTime: string;
  updateTime: string;
  phone: string;
  roles: Record<string,string>[];
  permissions: string[];
};

// 内存/本地存储中的用户数据，Mock 的新增、编辑、删除都会真正修改它
type UserRecord = {
  id: string;
  name?: string;
  username: string;
  email: string;
  groupId: string;
  status: Status;
  createTime: string;
  updateTime: string;
  phone: string;
  roleIds: string[];
  permissionIds: string[];
  password: string;
  mustChangePassword: boolean;
};

type UserBody = {
  name?: string;
  username?: string;
  email?: string;
  groupId?: string;
  status?: Status;
  phone?: string;
  roles?: string[];
  permissions?: string[];
  id?: string;
};

const STORAGE_KEY = "orange.mock.users";
const GROUPS = ["0001", "0002", "0003", "000301", "000302", "000303"];
const ROLES = ["super", "admin", "user"];
const SEED_COUNT = 23;
const SEED_TIME = "2025-01-01 23:59:59";

function createSeedUsers(): UserRecord[] {
  const accounts: UserRecord[] = [
    {
      id: "super",
      name: "YL",
      username: "super",
      email: "yluiop123@qq.com",
      groupId: "0003",
      status: STATUS_ENABLED,
      phone: "13800000000",
      createTime: SEED_TIME,
      updateTime: SEED_TIME,
      roleIds: ["super"],
      permissionIds: [],
      password: "super",
      mustChangePassword: false,
    },
    {
      id: "admin",
      name: "Admin",
      username: "admin",
      email: "admin@example.com",
      groupId: "0003",
      status: STATUS_ENABLED,
      phone: "13800000001",
      createTime: SEED_TIME,
      updateTime: SEED_TIME,
      roleIds: ["admin"],
      permissionIds: [],
      password: "admin",
      mustChangePassword: false,
    },
    {
      id: "user",
      name: "User",
      username: "user",
      email: "user@example.com",
      groupId: "0001",
      status: STATUS_ENABLED,
      phone: "13800000002",
      createTime: SEED_TIME,
      updateTime: SEED_TIME,
      roleIds: ["user"],
      permissionIds: [],
      password: "user",
      mustChangePassword: false,
    },
  ];
  return [
    ...accounts,
    ...Array.from({ length: SEED_COUNT }, (_, i): UserRecord => {
      const userId = i.toString().padStart(3, "0");
      return {
        id: `${i + 100000000}`,
        username: `user${userId}`,
        email: `user${userId}@example.com`,
        groupId: GROUPS[i % GROUPS.length],
        status: STATUS_ENABLED,
        phone: `${13800000000 + i}`,
        createTime: SEED_TIME,
        updateTime: SEED_TIME,
        roleIds: ROLES.slice(0, (i % 3) + 1),
        permissionIds: ["0000", "0001"],
        password: `user${userId}`,
        mustChangePassword: false,
      };
    }),
  ];
}

function loadUsers(): UserRecord[] {
  if (typeof window === "undefined") {
    return createSeedUsers();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UserRecord[];
      if (Array.isArray(parsed)) {
        const normalized = parsed.map((item) => ({
          ...item,
          password: item.password ?? item.username,
          mustChangePassword: item.mustChangePassword ?? false,
        }));
        const accounts = createSeedUsers().slice(0, 3);
        const missing = accounts.filter(
          (account) =>
            !normalized.some((item) => item.username === account.username),
        );
        const result = [...missing, ...normalized];
        if (missing.length > 0) saveUsers(result);
        return result;
      }
    }
  } catch {
    // 存储损坏时回退到种子数据
  }
  const seed = createSeedUsers();
  saveUsers(seed);
  return seed;
}

function saveUsers(list: UserRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

let users = loadUsers();

export function findMockUser(username: string) {
  return users.find((item) => item.username === username);
}

export function getMockUser(username: string) {
  return findMockUser(username);
}

export function updateMockUserPassword(
  username: string,
  password: string,
  mustChangePassword: boolean,
) {
  users = users.map((item) =>
    item.username === username
      ? { ...item, password, mustChangePassword, updateTime: nowText() }
      : item,
  );
  saveUsers(users);
}

export function verifyMockPassword(username: string, password: string) {
  const user = findMockUser(username);
  return Boolean(user && user.status === "1" && user.password === password);
}

function groupName(groupId: string, locale: string) {
  return String(localeMap[locale][groupId] ?? groupId);
}

function toUser(record: UserRecord, locale: string): User {
  const roles = localeMap[locale]["roles"] as Record<string,string>;
  const userLabel = String(localeMap[locale]["user"]);
  return {
    id: record.id,
    name: record.name ?? `${userLabel}${record.username.slice(4)}`,
    username: record.username,
    email: record.email,
    groupId: record.groupId,
    groupName: groupName(record.groupId, locale),
    status: record.status,
    createTime: record.createTime,
    updateTime: record.updateTime,
    phone: record.phone,
    roles: record.roleIds
      .filter((id) => roles[id])
      .map((id) => ({ id, name: roles[id] })),
    permissions: record.permissionIds,
  };
}

function nowText() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

const PASSWORD_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function randomPassword() {
  return Array.from({ length: 12 }, () =>
    PASSWORD_CHARS.charAt(Math.floor(Math.random() * PASSWORD_CHARS.length)),
  ).join("");
}

const handlers = [
  http.get("/api/v1/system/users", async ({ request }) => {
    const locale = request.headers.get("locale") || "zh";
    const url = new URL(request.url);
    const keyword = (
      url.searchParams.get("keyword")
      || url.searchParams.get("filterValue")
      || ""
    ).toLowerCase();
    const filterField = url.searchParams.get("filterField");
    const status = url.searchParams.get("status") || "all";
    const groupId = url.searchParams.get("groupId") || "";
    const page = Number(url.searchParams.get("page") || 1);
    const size = Number(url.searchParams.get("size") || 10);
    const sort = url.searchParams.get("sort")
      || url.searchParams.get("orderField")
      || "createTime";
    const direction = url.searchParams.get("direction")
      || url.searchParams.get("orderValue")
      || "desc";
    const filterList = users
      .map((item) => toUser(item, locale))
      .filter((item) => {
        const matchesKeyword = keyword
          ? [item.name, item.username, item.email, item.phone]
            .some((value) => value.toLowerCase().startsWith(keyword))
          : true;
        const matchesLegacy = filterField
          ? item[filterField as keyof User].toString().startsWith(keyword)
          : true;
        const matchesStatus = status !== "all" ? item.status === status : true;
        return matchesKeyword && matchesLegacy && matchesStatus && item.groupId.startsWith(groupId);
      });
    if (sort) {
      filterList.sort((a, b) => {
        const left = a[sort as keyof User];
        const right = b[sort as keyof User];
        if (left === right) return 0;
        const result = left > right ? 1 : -1;
        return direction === "desc" ? -result : result;
      });
    }
    const start = (page - 1) * size;
    const result = filterList.slice(start, start + size);
    return HttpResponse.json({
      code: 200,
      data: {
        list: result,
        total: filterList.length,
      },
    });
  }),
  http.delete("/api/v1/system/users", async ({ request }) => {
    const locale = request.headers.get("locale") || "zh";
    const url = new URL(request.url);
    const ids = (url.searchParams.get("ids") || "").split(",").filter(Boolean);
    users = users.filter((item) => !ids.includes(item.id));
    saveUsers(users);
    return HttpResponse.json({
      code: 200,
      message: localeMap[locale]["success"],
    });
  }),
  http.post("/api/v1/system/users", async ({ request }) => {
    const locale = request.headers.get("locale") || "zh";
    const body = (await request.clone().json()) as UserBody;
    const password = randomPassword();
    const record: UserRecord = {
      id: crypto.randomUUID(),
      name: body.name,
      username: body.username ?? "",
      email: body.email ?? "",
      groupId: body.groupId ?? "",
      status: body.status ?? "1",
      phone: body.phone ?? "",
      createTime: nowText(),
      updateTime: nowText(),
      roleIds: body.roles ?? [],
      permissionIds: body.permissions ?? [],
      password,
      mustChangePassword: true,
    };
    users = [record, ...users];
    saveUsers(users);
    return HttpResponse.json({
      code: 200,
      message: localeMap[locale]["success"],
      data: password,
    });
  }),
  http.patch<{ id: string }>("/api/v1/system/users/:id", async ({ request, params }) => {
    const locale = request.headers.get("locale") || "zh";
    const body = (await request.clone().json()) as UserBody;
    users = users.map((item) => {
      if (item.id !== params.id) return item;
      return {
        ...item,
        name: body.name ?? item.name,
        username: body.username ?? item.username,
        email: body.email ?? item.email,
        groupId: body.groupId ?? item.groupId,
        phone: body.phone ?? item.phone,
        status: body.status ?? item.status,
        roleIds: body.roles ?? item.roleIds,
        permissionIds: body.permissions ?? item.permissionIds,
        updateTime: nowText(),
      };
    });
    saveUsers(users);
    return HttpResponse.json({
      code: 200,
      message: localeMap[locale]["success"],
    });
  }),
  http.patch<{ id: string }>("/api/v1/system/users/:id/status", async ({ request, params }) => {
    const locale = request.headers.get("locale") || "zh";
    const body = (await request.clone().json()) as UserBody;
    users = users.map((item) =>
      item.id === params.id
        ? { ...item, status: body.status ?? item.status, updateTime: nowText() }
        : item
    );
    saveUsers(users);
    return HttpResponse.json({
      code: 200,
      message: localeMap[locale]["success"],
    });
  }),
  http.post<{ id: string }>("/api/v1/system/users/:id/reset-password", async ({ request, params }) => {
    const locale = request.headers.get("locale") || "zh";
    const password = randomPassword();
    users = users.map((item) =>
      item.id === params.id
        ? { ...item, password, mustChangePassword: true, updateTime: nowText() }
        : item,
    );
    saveUsers(users);
    return HttpResponse.json({
      code: 200,
      message: localeMap[locale]["success"],
      data: password,
    });
  }),
  http.get<{ id: string }>("/api/v1/system/users/:id", async ({ request, params }) => {
    const locale = request.headers.get("locale") || "zh";
    const user = users.find((item) => item.id === params.id);
    return HttpResponse.json({
      code: 200,
      data: user ? toUser(user, locale) : null,
    });
  }),
];

export default handlers;
