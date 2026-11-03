import { isSamePath } from './path';
import type { MenuNode } from './models';

export function findMenuNode(nodes: MenuNode[], path: string): MenuNode | undefined {
  for (const node of nodes) {
    if (isSamePath(node.path, path)) return node;
    const child = findMenuNode(node.children ?? [], path);
    if (child) return child;
  }
  return undefined;
}

/** Root-to-node chain, used by the breadcrumb. */
export function findMenuChain(nodes: MenuNode[], path: string): MenuNode[] {
  for (const node of nodes) {
    if (isSamePath(node.path, path)) return [node];
    const childChain = findMenuChain(node.children ?? [], path);
    if (childChain.length > 0) return [node, ...childChain];
  }
  return [];
}

/** All ancestor paths of a route, e.g. `/a/b/c` -> `/a`, `/a/b`. */
export function ancestorPaths(path: string): string[] {
  const segments = path.split('/').filter(Boolean);
  const ancestors: string[] = [];
  for (let index = 1; index < segments.length; index += 1) {
    ancestors.push(`/${segments.slice(0, index).join('/')}`);
  }
  return ancestors;
}
