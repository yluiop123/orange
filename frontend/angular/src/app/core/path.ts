/** Path helpers shared by access filtering, menus and navigation. */

export function normalizePath(path: string): string {
  if (!path) return '/';
  const trimmed = path.split('?')[0].split('#')[0];
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (withSlash.length > 1 && withSlash.endsWith('/')) {
    return withSlash.slice(0, -1);
  }
  return withSlash;
}

export function isSamePath(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return normalizePath(a) === normalizePath(b);
}

/** True when `path` equals `dir` or sits below it. */
export function isPathWithin(path?: string | null, dir?: string | null): boolean {
  if (!path || !dir) return false;
  const p = normalizePath(path);
  const d = normalizePath(dir);
  return p === d || p.startsWith(d === '/' ? '/' : `${d}/`);
}

/** Only allow in-app redirects, never protocol-relative or absolute URLs. */
export function isSafeInternalPath(value?: string | null): boolean {
  if (!value) return false;
  if (!value.startsWith('/') || value.startsWith('//')) return false;
  return !value.includes('\\');
}
