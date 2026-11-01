/**
 * 只记录“可能已登录”的非敏感标记，不存任何凭证。
 * 生产环境用于判断是否需要尝试 refresh；演示环境同理。
 */
const SESSION_HINT_KEY = "orange.session";

export const sessionHint = {
  has: () => localStorage.getItem(SESSION_HINT_KEY) === "1",
  set: () => localStorage.setItem(SESSION_HINT_KEY, "1"),
  clear: () => localStorage.removeItem(SESSION_HINT_KEY),
};
