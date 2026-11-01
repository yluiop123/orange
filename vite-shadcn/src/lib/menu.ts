import { isPathWithin, isSamePath } from "@/lib/path";
import type { MenuNode } from "@/types/menu";

/** 节点自身是否被菜单权限或目录权限覆盖 */
function isSelfGranted(
  node: MenuNode,
  menuPaths: string[],
  directoryPaths: string[],
): boolean {
  return (
    menuPaths.some((path) => isSamePath(path, node.path)) ||
    directoryPaths.some((dir) => isPathWithin(node.path, dir))
  );
}

/**
 * 节点是否可见。
 * 有子节点时只作为容器：至少一个子节点可见才显示；
 * 叶子节点需要自身被权限覆盖。
 */
export function isMenuNodeVisible(
  node: MenuNode,
  menuPaths: string[],
  directoryPaths: string[],
): boolean {
  if (node.children.length > 0) {
    return node.children.some((child) =>
      isMenuNodeVisible(child, menuPaths, directoryPaths),
    );
  }
  return isSelfGranted(node, menuPaths, directoryPaths);
}

/** 过滤出当前角色视角下可见的菜单树 */
export function filterVisibleMenus(
  nodes: MenuNode[],
  menuPaths: string[],
  directoryPaths: string[],
): MenuNode[] {
  return nodes
    .filter((node) => isMenuNodeVisible(node, menuPaths, directoryPaths))
    .map((node) => ({
      ...node,
      children: filterVisibleMenus(node.children, menuPaths, directoryPaths),
    }));
}

/** 按顺序找到第一个可见叶子菜单的路径 */
export function firstVisibleLeaf(
  nodes: MenuNode[],
  menuPaths: string[],
  directoryPaths: string[],
): string | null {
  for (const node of nodes) {
    if (node.children.length > 0) {
      const leaf = firstVisibleLeaf(node.children, menuPaths, directoryPaths);
      if (leaf) return leaf;
    } else if (isSelfGranted(node, menuPaths, directoryPaths)) {
      return node.path;
    }
  }
  return null;
}

export function findMenuNode(
  nodes: MenuNode[],
  path: string,
): MenuNode | undefined {
  for (const node of nodes) {
    if (isSamePath(node.path, path)) return node;
    const child = findMenuNode(node.children, path);
    if (child) return child;
  }
  return undefined;
}

/** 返回从根节点到目标路径的菜单链，用于面包屑 */
export function findMenuChain(nodes: MenuNode[], path: string): MenuNode[] {
  for (const node of nodes) {
    if (isSamePath(node.path, path)) return [node];
    const childChain = findMenuChain(node.children, path);
    if (childChain.length > 0) return [node, ...childChain];
  }
  return [];
}

