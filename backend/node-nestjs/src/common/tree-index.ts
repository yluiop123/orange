/**
 * Pure in-memory index over a tree: descendants, ancestors, depth and delete
 * order. Kept free of TypeORM so it can be unit tested.
 */
export class TreeIndex<T> {
  private readonly byId = new Map<string, T>();
  private readonly childrenByParent = new Map<string, T[]>();

  constructor(
    all: T[],
    private readonly idOf: (node: T) => string,
    private readonly parentOf: (node: T) => string | null | undefined,
  ) {
    for (const node of all) {
      this.byId.set(idOf(node), node);
    }
    for (const node of all) {
      const parentId = parentOf(node);
      if (parentId !== null && parentId !== undefined) {
        const bucket = this.childrenByParent.get(parentId);
        if (bucket) {
          bucket.push(node);
        } else {
          this.childrenByParent.set(parentId, [node]);
        }
      }
    }
  }

  get(id: string | null | undefined): T | undefined {
    return id === null || id === undefined ? undefined : this.byId.get(id);
  }

  /** Includes the roots themselves, breadth-first. */
  subtreeIds(roots: Iterable<string>): Set<string> {
    const visited = new Set<string>();
    const queue = [...roots];
    while (queue.length > 0) {
      const id = queue.shift() as string;
      if (visited.has(id)) {
        continue;
      }
      visited.add(id);
      for (const child of this.childrenByParent.get(id) ?? []) {
        queue.push(this.idOf(child));
      }
    }
    return visited;
  }

  /** Matched node ids plus every ancestor id. */
  withAncestorIds(matched: T[]): Set<string> {
    const ids = new Set<string>();
    for (const node of matched) {
      ids.add(this.idOf(node));
    }
    for (const node of matched) {
      let parentId = this.parentOf(node) ?? null;
      while (parentId !== null && !ids.has(parentId)) {
        ids.add(parentId);
        const parent = this.byId.get(parentId);
        parentId = parent ? this.parentOf(parent) ?? null : null;
      }
    }
    return ids;
  }

  /** Descendants only; the node itself is not checked. */
  hasEnabledDescendant(id: string, enabled: (node: T) => boolean): boolean {
    const queue = (this.childrenByParent.get(id) ?? []).map((child) => this.idOf(child));
    const visited = new Set<string>();
    while (queue.length > 0) {
      const childId = queue.shift() as string;
      if (visited.has(childId)) {
        continue;
      }
      visited.add(childId);
      const child = this.byId.get(childId);
      if (child && enabled(child)) {
        return true;
      }
      for (const item of this.childrenByParent.get(childId) ?? []) {
        queue.push(this.idOf(item));
      }
    }
    return false;
  }

  /** Deepest nodes first so a subtree can be deleted without FK violations. */
  deleteOrder(ids: Iterable<string>): T[] {
    const target = new Set(ids);
    return [...this.byId.values()]
      .filter((node) => target.has(this.idOf(node)))
      .map((node) => ({ node, depth: this.depth(this.idOf(node)) }))
      .sort((a, b) => b.depth - a.depth)
      .map((item) => item.node);
  }

  depth(id: string): number {
    let depth = 0;
    const visited = new Set<string>();
    let current: string | null = id;
    while (current !== null && !visited.has(current)) {
      visited.add(current);
      const node = this.byId.get(current);
      current = node ? this.parentOf(node) ?? null : null;
      if (current !== null) {
        depth += 1;
      }
    }
    return depth;
  }
}
