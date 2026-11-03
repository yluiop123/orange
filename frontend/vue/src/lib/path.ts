/**
 * Path matching helpers shared by the access model and the menu.
 * Boundary-aware so `/sys` never matches `/system`.
 */
export function normalizePath(path: string): string {
  const withLeading = path.startsWith('/') ? path : `/${path}`
  const trimmed = withLeading.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

export function isPathWithin(path: string, base: string): boolean {
  if (!base) return false
  const target = normalizePath(path)
  const root = normalizePath(base)
  if (root === '/') return target.startsWith('/')
  return target === root || target.startsWith(`${root}/`)
}

export function isSamePath(a: string, b: string): boolean {
  return normalizePath(a) === normalizePath(b)
}

/** Guard against open redirects: only absolute, single-slash, internal paths. */
export function isSafeInternalPath(path: unknown): path is string {
  return (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !path.includes('\\')
  )
}
