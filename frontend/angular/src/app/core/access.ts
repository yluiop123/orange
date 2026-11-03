import { isPathWithin, isSamePath } from './path';
import type { MenuNode, Permission } from './models';

/**
 * The single access model for the current UI role view.
 * This is view filtering, not backend authorization: directory permissions
 * only affect visibility and never authorize an API call.
 */
export interface Access {
  permissions: Permission[];
  canView(path: string): boolean;
  canAct(path: string, action: string): boolean;
  visibleMenuTree(nodes: MenuNode[]): MenuNode[];
  firstVisibleLeaf(nodes: MenuNode[]): string | null;
}

export function createAccess(permissions?: Permission[] | null): Access {
  const list = permissions ?? [];
  const menuPaths = list.filter((item) => item.type === 'menu').map((item) => item.path);
  const directoryPaths = list
    .filter((item) => item.type === 'directory')
    .map((item) => item.path);
  const actionPermissions = list.filter((item) => item.type === 'action');

  const isSelfGranted = (node: MenuNode): boolean =>
    menuPaths.some((path) => isSamePath(path, node.path)) ||
    directoryPaths.some((dir) => isPathWithin(node.path, dir));

  const isVisible = (node: MenuNode): boolean =>
    node.children.length > 0
      ? node.children.some((child) => isVisible(child))
      : isSelfGranted(node);

  const visibleMenuTree = (nodes: MenuNode[]): MenuNode[] =>
    nodes
      .filter((node) => isVisible(node))
      .map((node) => ({ ...node, children: visibleMenuTree(node.children) }));

  const firstVisibleLeaf = (nodes: MenuNode[]): string | null => {
    for (const node of nodes) {
      if (node.children.length > 0) {
        const leaf = firstVisibleLeaf(node.children);
        if (leaf) return leaf;
      } else if (isSelfGranted(node)) {
        return node.path;
      }
    }
    return null;
  };

  return {
    permissions: list,
    canView: (path: string) =>
      menuPaths.some((item) => isSamePath(item, path)) ||
      directoryPaths.some((dir) => isPathWithin(path, dir)),
    canAct: (path: string, action: string) =>
      actionPermissions.some(
        (item) => isSamePath(item.path, path) && item.action === action,
      ),
    visibleMenuTree,
    firstVisibleLeaf,
  };
}

export const EMPTY_ACCESS = createAccess([]);
