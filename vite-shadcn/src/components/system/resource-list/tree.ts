export type TreeRow<T> = T & {
  subRows?: TreeRow<T>[];
};

export type TreeChild<T> = T & {
  children?: TreeChild<T>[];
};

export type TreeConfig<T> = {
  id: (row: T) => string;
  parentId: (row: T) => string | null | undefined;
};

export type ChildrenTreeConfig<T> = TreeConfig<T> & {
  /** 父节点缺失时提升为根，还是丢弃整个分支。 */
  orphan?: "root" | "drop";
};

type ChildKey = "children" | "subRows";
type OrphanPolicy = "root" | "drop";
type AssembledNode<T> = T & {
  children?: AssembledNode<T>[];
  subRows?: AssembledNode<T>[];
};

/**
 * 唯一的树装配实现。表用 subRows，选择器和菜单用 children；
 * 两个导出函数只是 childKey 的薄 adapter。
 */
function assemble<T>(
  rows: T[],
  config: TreeConfig<T>,
  childKey: ChildKey,
  orphan: OrphanPolicy,
): AssembledNode<T>[] {
  const map = new Map<string, AssembledNode<T>>();
  const roots: AssembledNode<T>[] = [];

  for (const row of rows) {
    map.set(config.id(row), { ...row, [childKey]: [] } as AssembledNode<T>);
  }

  for (const row of rows) {
    const node = map.get(config.id(row));
    if (!node) continue;
    const parentId = config.parentId(row);
    if (parentId && map.has(parentId)) {
      const parent = map.get(parentId)!;
      (parent[childKey] ??= []).push(node);
    } else if (!parentId || orphan === "root") {
      roots.push(node);
    }
  }

  const sortByCode = (nodes: AssembledNode<T>[]) => {
    nodes.sort((a, b) => compareCode(config.id(a), config.id(b)));
    for (const node of nodes) {
      const children = node[childKey];
      if (children?.length) {
        sortByCode(children);
      }
    }
  };
  sortByCode(roots);
  return roots;
}

/** 系统管理表格使用：同级按编码排序，父节点缺失时提升为根。 */
export function buildTree<T>(rows: T[], config: TreeConfig<T>): TreeRow<T>[] {
  return assemble(rows, config, "subRows", "root") as TreeRow<T>[];
}

/** 选择器和菜单使用：子节点放在 children，可配置缺失父节点时丢弃分支。 */
export function buildChildrenTree<T>(
  rows: T[],
  config: ChildrenTreeConfig<T>,
): TreeChild<T>[] {
  return assemble(rows, config, "children", config.orphan ?? "root") as TreeChild<T>[];
}

/** 编码是有固定宽度的数字串，直接按字符串比较即可 */
export function compareCode(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/** 收集某个节点及其所有后代的 id */
export function collectTreeIds<T extends { id: string; subRows?: T[] }>(
  row: T,
): string[] {
  const ids = [row.id];
  for (const child of row.subRows ?? []) {
    ids.push(...collectTreeIds(child));
  }
  return ids;
}
