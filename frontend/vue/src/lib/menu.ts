import { isPathWithin, isSamePath } from './path'
import type { MenuNode } from './access'

/** Breadcrumb chain: every node on the path from a root to the matching leaf. */
export function findMenuChain(nodes: MenuNode[], path: string): MenuNode[] {
  for (const node of nodes) {
    if (isSamePath(node.path, path)) return [node]
    if (node.children.length > 0) {
      const rest = findMenuChain(node.children, path)
      if (rest.length > 0) return [node, ...rest]
    }
  }
  return []
}

export function findMenuNode(nodes: MenuNode[], path: string): MenuNode | undefined {
  for (const node of nodes) {
    if (isSamePath(node.path, path)) return node
    const child = findMenuNode(node.children, path)
    if (child) return child
  }
  return undefined
}

/** True when the path is inside a directory node (used to highlight parents). */
export function isMenuActive(node: MenuNode, path: string): boolean {
  if (node.children.length > 0) return node.children.some((child) => isMenuActive(child, path))
  return isSamePath(node.path, path) || isPathWithin(path, node.path)
}
