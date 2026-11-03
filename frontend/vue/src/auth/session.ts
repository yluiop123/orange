/**
 * Only records "a session may exist" so the app knows whether trying a refresh
 * on boot is worth it. No credentials are stored here.
 */
const SESSION_HINT_KEY = 'orange.session'

export const sessionHint = {
  has: () => localStorage.getItem(SESSION_HINT_KEY) === '1',
  set: () => localStorage.setItem(SESSION_HINT_KEY, '1'),
  clear: () => localStorage.removeItem(SESSION_HINT_KEY),
}
