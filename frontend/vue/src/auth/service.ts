import { authToken } from './token'
import { sessionHint } from './session'
import { refresh } from '@/api/auth'

/**
 * Restore the in-memory access token from the HttpOnly refresh cookie.
 * Without a session hint there is nothing to restore, so the login page shows
 * immediately instead of firing a guaranteed 401.
 */
export async function bootstrapAuth(): Promise<boolean> {
  // Drop tokens left by older builds; the access token must never come from storage.
  localStorage.removeItem('token')
  if (!sessionHint.has()) return false
  try {
    const data = await refresh()
    if (!data?.token) throw new Error('refresh returned no token')
    authToken.set(data.token, data.expiresIn)
    return true
  } catch {
    authToken.clear()
    sessionHint.clear()
    return false
  }
}
