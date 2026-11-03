import { ref } from 'vue'

let accessToken: string | null = null
let expiresAt = 0

/** Reactive mirror for components that need to show a session state. */
export const accessTokenRef = ref<string | null>(null)

/**
 * The access token lives in memory only and is never written to localStorage.
 * A page reload restores the session through the HttpOnly refresh cookie.
 */
export const authToken = {
  get: () => accessToken,
  getExpiresAt: () => expiresAt,
  isExpiring: (thresholdMs = 30_000) =>
    Boolean(accessToken) && expiresAt > 0 && expiresAt - Date.now() < thresholdMs,
  set: (token: string | null, expiresInSeconds?: number) => {
    expiresAt = expiresInSeconds ? Date.now() + expiresInSeconds * 1000 : 0
    accessToken = token
    accessTokenRef.value = token
  },
  clear: () => {
    accessToken = null
    expiresAt = 0
    accessTokenRef.value = null
  },
}
