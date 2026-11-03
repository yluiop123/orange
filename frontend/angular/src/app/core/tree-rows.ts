export interface FlatTreeNode<T> {
  node: T;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
}

/** Build a parent/child tree from a flat list. Preserves input order. */
export function buildTree<T>(
  rows: T[],
  idOf: (row: T) => string,
  parentIdOf: (row: T) => string | null | undefined,
): T[] {
  const map = new Map<string, T>();
  for (const row of rows) map.set(idOf(row), row);
  const roots: T[] = [];
  for (const row of rows) {
    const parentId = parentIdOf(row);
    const parent = parentId ? map.get(parentId) : undefined;
    if (parent && parent !== row) {
      const children = ((parent as { children?: T[] }).children ?? []) as T[];
      children.push(row);
      (parent as { children?: T[] }).children = children;
    } else {
      roots.push(row);
    }
  }
  return roots;
}

export function flattenTree<T>(
  nodes: T[],
  childrenOf: (node: T) => T[] | undefined,
  expanded: ReadonlySet<string>,
  idOf: (node: T) => string,
  depth = 0,
): FlatTreeNode<T>[] {
  const result: FlatTreeNode<T>[] = [];
  for (const node of nodes) {
    const children = childrenOf(node) ?? [];
    const isExpanded = expanded.has(idOf(node));
    result.push({ node, depth, hasChildren: children.length > 0, expanded: isExpanded });
    if (children.length > 0 && isExpanded) {
      result.push(...flattenTree(children, childrenOf, expanded, idOf, depth + 1));
    }
  }
  return result;
}

export function collectSubtreeIds<T>(
  node: T,
  childrenOf: (node: T) => T[] | undefined,
  idOf: (node: T) => string,
): string[] {
  const ids = [idOf(node)];
  for (const child of childrenOf(node) ?? []) {
    ids.push(...collectSubtreeIds(child, childrenOf, idOf));
  }
  return ids;
}

export function allNodeIds<T>(
  nodes: T[],
  childrenOf: (node: T) => T[] | undefined,
  idOf: (node: T) => string,
): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    ids.push(...collectSubtreeIds(node, childrenOf, idOf));
  }
  return ids;
}
