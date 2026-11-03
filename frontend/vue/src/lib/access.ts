import { isPathWithin, isSamePath } from './path'

export type PermissionType = 'menu' | 'directory' | 'action'

/** The user-info contract uses `role` only on rolePermissions. */
export type Permission = {
  path: string
  type: PermissionType | string
  action?: string | null
  role?: string
}

export type MenuNode = {
  id: string
  path: string
  type: 'menu' | 'directory'
  name: string
  children: MenuNode[]
}

/**
 * The only access model for the current role view.
 * This is UI filtering, not backend authorization; directory permissions only
 * control visibility and never authorize an API call.
 */
export type Access = {
  permissions: Permission[]
  canView: (path: string) => boolean
  canAct: (path: string, action: string) => boolean
  visibleMenuTree: (nodes: MenuNode[]) => MenuNode[]
  firstVisibleLeaf: (nodes: MenuNode[]) => string | null
}

export function createAccess(permissions?: Permission[] | null): Access {
  const list = permissions ?? []
  const menuPaths = list.filter((item) => item.type === 'menu').map((item) => item.path)
  const directoryPaths = list.filter((item) => item.type === 'directory').map((item) => item.path)
  const actionPermissions = list.filter((item) => item.type === 'action')

  const isSelfGranted = (node: MenuNode) =>
    menuPaths.some((path) => isSamePath(path, node.path)) ||
    directoryPaths.some((dir) => isPathWithin(node.path, dir))

  const isVisible = (node: MenuNode): boolean =>
    node.children.length > 0 ? node.children.some((child) => isVisible(child)) : isSelfGranted(node)

  const visibleMenuTree = (nodes: MenuNode[]): MenuNode[] =>
    nodes
      .filter((node) => isVisible(node))
      .map((node) => ({
        ...node,
        children: visibleMenuTree(node.children),
      }))

  const firstVisibleLeaf = (nodes: MenuNode[]): string | null => {
    for (const node of nodes) {
      if (node.children.length > 0) {
        const leaf = firstVisibleLeaf(node.children)
        if (leaf) return leaf
      } else if (isSelfGranted(node)) {
        return node.path
      }
    }
    return null
  }

  return {
    permissions: list,
    canView: (path: string) =>
      menuPaths.some((item) => isSamePath(item, path)) ||
      directoryPaths.some((dir) => isPathWithin(path, dir)),
    canAct: (path: string, action: string) =>
      actionPermissions.some((item) => isSamePath(item.path, path) && item.action === action),
    visibleMenuTree,
    firstVisibleLeaf,
  }
}

/** Merge direct grants with the selected role's grants. Role switching never changes backend authority. */
export const ALL_ROLES = 'all'

export function computePermissions(source: {
  currentRole?: string
  userPermissions?: Permission[] | null
  rolePermissions?: Permission[] | null
}): Permission[] {
  const currentRole = source.currentRole || ALL_ROLES
  return [
    ...(source.userPermissions ?? []),
    ...(source.rolePermissions ?? []).filter(
      (item) => currentRole === ALL_ROLES || item.role === currentRole,
    ),
  ]
}
