import { isSamePath } from "@/lib/path";
import type { MenuNode } from "@/types/menu";

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
