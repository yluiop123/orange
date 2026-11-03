import http from "@/lib/axios";
import { authToken } from "./token";
import { sessionHint } from "./session";

/**
 * 用 refresh Cookie 换取新的 access token。
 * 生产环境由后端设置 HttpOnly Cookie；
 * 演示环境由 MSW 直接返回 token，不需要模拟 Cookie。
 */
export async function refreshSession(): Promise<string> {
  const res = await http.post("/auth/refresh");
  const data = res.data?.data;
  const token = data?.token;
  if (!token) {
    throw new Error("refresh response has no token");
  }
  authToken.set(token, data?.expiresIn);
  return token;
}

/**
 * 应用启动时恢复会话：
 * - 没有 session hint：直接显示登录页，避免演示环境自动登录；
 * - 有 hint：尝试 refresh，失败则清理并显示登录页。
 */
export async function bootstrapAuth(): Promise<boolean> {
  // 清理旧版本可能遗留的 localStorage token
  localStorage.removeItem("token");
  if (!sessionHint.has()) {
    return false;
  }
  try {
    await refreshSession();
    return true;
  } catch {
    authToken.clear();
    sessionHint.clear();
    return false;
  }
}
