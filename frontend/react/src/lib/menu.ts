import { isSamePath, normalizePath } from "@/lib/path";
import type { MenuNode } from "@/types/menu";

/**
 * 菜单标题的 i18n key：/system/user -> menu.system.user。
 * 后端仍返回 name，作为没有翻译时的兜底。
 */
export function menuTitleKey(path: string): string {
  return `menu.${normalizePath(path).replace(/^\//, "").split("/").join(".")}`;
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
