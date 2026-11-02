export type TreeRow<T> = T & {
  subRows?: TreeRow<T>[];
};

export type TreeConfig<T> = {
  id: (row: T) => string;
  parentId: (row: T) => string | null | undefined;
};

/**
 * 把平铺数据构造成树，父节点缺失时按根节点处理。
 * 同级顺序由编码决定（字符串升序），编码天然是父编码的前缀。
 * 返回的新对象带 subRows，原数组不会被修改。
 */
export function buildTree<T>(rows: T[], config: TreeConfig<T>): TreeRow<T>[] {
  const map = new Map<string, TreeRow<T>>();
  const roots: TreeRow<T>[] = [];

  for (const row of rows) {
    map.set(config.id(row), { ...row, subRows: [] });
  }

  for (const row of rows) {
    const node = map.get(config.id(row));
    const parentId = config.parentId(row);
    if (node && parentId && map.has(parentId)) {
      map.get(parentId)!.subRows!.push(node);
    } else if (node) {
      roots.push(node);
    }
  }

  const sortByCode = (nodes: TreeRow<T>[]) => {
    nodes.sort((a, b) => compareCode(config.id(a), config.id(b)));
    for (const node of nodes) {
      if (node.subRows?.length) sortByCode(node.subRows);
    }
  };
  sortByCode(roots);
  return roots;
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
