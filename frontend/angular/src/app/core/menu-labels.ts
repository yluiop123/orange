import { PERMISSION_CATALOG } from './permission-catalog';

type CatalogPermission = (typeof PERMISSION_CATALOG)[number];

const byPath = new Map<string, CatalogPermission>();
for (const permission of PERMISSION_CATALOG) {
  // 只取菜单/目录，action 权限也可能带同样的 path，不能覆盖菜单标题
  if (permission.path && permission.type !== 'action') {
    byPath.set(permission.path, permission);
  }
}

/**
 * 菜单标题按路径从共享权限目录取当前语言名称，找不到时回退到后端返回的名称。
 * React/Vue 使用同样的策略，保证真实后端下三端表现一致。
 */
export function menuLabel(path: string | undefined, fallback: string, locale: string): string {
  const entry = path ? byPath.get(path) : undefined;
  if (!entry) return fallback;
  return locale === 'en' ? entry.nameEn : entry.nameZh;
}
