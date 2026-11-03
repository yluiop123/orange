import catalog from '@/config/permissions.json'

type CatalogPermission = {
  path?: string
  type?: string
  name: { zh: string; en: string }
}

const byPath = new Map<string, CatalogPermission>()
for (const permission of catalog.permissions as CatalogPermission[]) {
  // 只取菜单/目录，action 权限也可能带同样的 path，不能覆盖菜单标题
  if (permission.path && permission.type !== 'action') {
    byPath.set(permission.path, permission)
  }
}

/**
 * 菜单标题按路径从共享权限目录取当前语言名称，找不到时回退到后端返回的名称。
 * React 使用同样的策略，因此三个前端在真实后端下行为一致。
 */
export function menuTitle(
  path: string | undefined,
  fallback: string,
  locale: string,
): string {
  const entry = path ? byPath.get(path) : undefined
  if (!entry) return fallback
  return locale === 'en' ? entry.name.en : entry.name.zh
}
