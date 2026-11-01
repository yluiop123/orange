import { http, HttpResponse } from "msw";
import catalog from "@/config/permissions.json";
import {
  findMockUser,
  updateMockUserPassword,
  verifyMockPassword,
} from "@/mock/system/user";

const zh = {
  super: "超级管理员",
  admin: "管理员",
  user: "普通用户",
  "username.error": "用户名错误",
  "password.error": "密码错误",
  groupName: "研发部",
};
const en = {
  super: "Super",
  admin: "Admin",
  user: "User",
  "username.error": "username error",
  "password.error": "password error",
  groupName: "Develop",
};
const localeMap: Record<string, Record<string, string>> = { zh, en };

const CURRENT_USER_KEY = "orange.mock.currentUser";

function currentUsername() {
  return localStorage.getItem(CURRENT_USER_KEY) || "super";
}

function buildRolePermissions(locale: string, roleIds: string[]) {
  const lang = locale === "en" ? "en" : "zh";
  return roleIds.flatMap((role) =>
    (catalog.rolePermissions[role as keyof typeof catalog.rolePermissions] ?? [])
      .map((id) => catalog.permissions.find((permission) => permission.id === id))
      .filter((permission): permission is NonNullable<typeof permission> => Boolean(permission))
      .map((permission) => ({
        path: permission.path,
        role,
        type: permission.type,
        action: permission.action ?? undefined,
        name: permission.name[lang],
      })),
  );
}

function buildUserPermissions(locale: string, permissionIds: string[]) {
  const lang = locale === "en" ? "en" : "zh";
  return permissionIds
    .map((id) => catalog.permissions.find((permission) => permission.id === id))
    .filter((permission): permission is NonNullable<typeof permission> => Boolean(permission))
    .map((permission) => ({
      path: permission.path,
      role: "",
      type: permission.type,
      action: permission.action ?? undefined,
      name: permission.name[lang],
    }));
}

const handlers = [
  http.get<never, never>("/api/user/userInfo", ({ request }) => {
    const locale = request.headers.get("locale") || "zh";
    const dict = localeMap[locale] ?? zh;
    const user = findMockUser(currentUsername());
    if (!user) {
      return HttpResponse.json(
        { code: 40101, message: "未登录" },
        { status: 401 },
      );
    }
    return HttpResponse.json({
      code: 200,
      data: {
        username: user.username,
        email: user.email,
        groupId: user.groupId,
        groupName: dict["groupName"],
        name: user.name ?? user.username,
        mustChangePassword: user.mustChangePassword,
        roles: user.roleIds.map((id) => ({
          id,
          name: dict[id] ?? id,
        })),
        rolePermissions: buildRolePermissions(locale, user.roleIds),
        userPermissions: buildUserPermissions(locale, user.permissionIds),
      },
    });
  }),

  http.post<never, never, never>(/\/api\/user\/login$/, async ({ request }) => {
    const locale = request.headers.get("locale") || "zh";
    const body = (await request.clone().json()) as {
      username?: string;
      password?: string;
    };
    const dict = localeMap[locale] ?? zh;
    const user = body.username ? findMockUser(body.username) : undefined;

    if (!user) {
      return HttpResponse.json({
        code: 200,
        data: {
          status: "error",
          field: "username",
          msg: dict["username.error"],
        },
      });
    }
    if (!verifyMockPassword(user.username, body.password ?? "")) {
      return HttpResponse.json({
        code: 200,
        data: {
          status: "error",
          field: "password",
          msg: dict["password.error"],
        },
      });
    }
    localStorage.setItem(CURRENT_USER_KEY, user.username);
    return HttpResponse.json({
      code: 200,
      data: {
        token: "demo-access-token",
        expiresIn: 1800,
        status: "ok",
      },
    });
  }),

  http.post<never, never>("/api/user/change-password", async ({ request }) => {
    const locale = request.headers.get("locale") || "zh";
    const body = (await request.clone().json()) as {
      oldPassword?: string;
      newPassword?: string;
    };
    const username = currentUsername();
    if (!verifyMockPassword(username, body.oldPassword ?? "")) {
      return HttpResponse.json(
        { code: 40002, message: "原密码错误" },
        { status: 400 },
      );
    }
    if (!body.newPassword || body.newPassword.length < 8) {
      return HttpResponse.json(
        { code: 40001, message: "新密码至少 8 位" },
        { status: 400 },
      );
    }
    if (body.newPassword === body.oldPassword) {
      return HttpResponse.json(
        { code: 40002, message: "新密码不能与原密码相同" },
        { status: 400 },
      );
    }
    updateMockUserPassword(username, body.newPassword, false);
    return HttpResponse.json({
      code: 200,
      message: locale === "en" ? "Password changed" : "密码已修改",
    });
  }),

  // 演示环境不模拟 HttpOnly Cookie，只按同一接口契约返回新的 access token
  http.post<never, never>("/api/user/refresh", () => {
    return HttpResponse.json({
      code: 200,
      data: {
        token: "demo-access-token",
        expiresIn: 1800,
      },
    });
  }),

  http.post<never, never>("/api/user/logout", () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    return HttpResponse.json({
      code: 200,
      data: "ok",
    });
  }),
];
export default handlers;
