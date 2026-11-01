/**
 * 统一路径匹配，避免 "/sys" 误匹配 "/system"。
 * - 忽略末尾斜杠
 * - 自动补前导斜杠
 */
export function normalizePath(path: string): string {
  const withLeading = path.startsWith("/") ? path : `/${path}`;
  const trimmed = withLeading.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/** path 是否等于 base，或位于 base 目录下（带路径边界） */
export function isPathWithin(path: string, base: string): boolean {
  if (!base) return false;
  const target = normalizePath(path);
  const root = normalizePath(base);
  if (root === "/") return target.startsWith("/");
  return target === root || target.startsWith(`${root}/`);
}

/** 两个路径是否相同（忽略末尾斜杠） */
export function isSamePath(a: string, b: string): boolean {
  return normalizePath(a) === normalizePath(b);
}

/** 是否为站内路径，防止开放重定向 */
export function isSafeInternalPath(path: unknown): path is string {
  return (
    typeof path === "string" &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("\\")
  );
}
