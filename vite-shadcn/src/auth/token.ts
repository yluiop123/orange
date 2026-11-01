import { useSyncExternalStore } from "react";

let accessToken: string | null = null;
let expiresAt = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

/**
 * access token 只保存在内存中，不写入 localStorage。
 * 页面刷新后通过 refresh 接口恢复会话。
 */
export const authToken = {
  get: () => accessToken,
  getExpiresAt: () => expiresAt,
  isExpiring: (thresholdMs = 30_000) =>
    Boolean(accessToken) && expiresAt > 0 && expiresAt - Date.now() < thresholdMs,
  set: (token: string | null, expiresInSeconds?: number) => {
    const nextExpiresAt = expiresInSeconds
      ? Date.now() + expiresInSeconds * 1000
      : 0;
    if (token === accessToken) {
      expiresAt = nextExpiresAt;
      return;
    }
    accessToken = token;
    expiresAt = nextExpiresAt;
    emit();
  },
  clear: () => {
    accessToken = null;
    expiresAt = 0;
    emit();
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useAccessToken() {
  return useSyncExternalStore(authToken.subscribe, authToken.get, authToken.get);
}
