export type TreeRow<T> = T & { subRows?: TreeRow<T>[] }
export type TreeChild<T> = T & { children?: TreeChild<T>[] }

export type TreeConfig<T> = {
  id: (row: T) => string
  parentId: (row: T) => string | null | undefined
}

type AssembleOptions = {
  childKey: 'children' | 'subRows'
  orphan: 'root' | 'drop'
  sort?: boolean
}

function assemble<T>(rows: T[], config: TreeConfig<T>, options: AssembleOptions) {
  type Node = T & { children?: Node[]; subRows?: Node[] }
  const map = new Map<string, Node>()
  const roots: Node[] = []

  for (const row of rows) {
    map.set(config.id(row), { ...row } as Node)
  }

  for (const row of rows) {
    const node = map.get(config.id(row))
    if (!node) continue
    const parentId = config.parentId(row)
    if (parentId && map.has(parentId)) {
      const parent = map.get(parentId) as Node & { [key: string]: Node[] | undefined }
      const list = parent[options.childKey] ?? []
      list.push(node)
      parent[options.childKey] = list
    } else if (!parentId || options.orphan === 'root') {
      roots.push(node)
    }
  }

  if (options.sort !== false) {
    const sortByCode = (nodes: Node[]) => {
      nodes.sort((a, b) => compareCode(config.id(a), config.id(b)))
      for (const node of nodes) {
        const children = node[options.childKey]
        if (children?.length) sortByCode(children)
      }
    }
    sortByCode(roots)
  }

  return roots as (T & { children?: TreeChild<T>[]; subRows?: TreeRow<T>[] })[]
}

/** System tables: siblings order by business code; orphans are promoted to roots. */
export function buildTree<T>(rows: T[], config: TreeConfig<T>): TreeRow<T>[] {
  return assemble(rows, config, { childKey: 'subRows', orphan: 'root' }) as TreeRow<T>[]
}

/** Menu and selectors: children live in `children`; missing parents drop the branch. */
export function buildChildrenTree<T>(
  rows: T[],
  config: TreeConfig<T> & { orphan?: 'root' | 'drop' },
): TreeChild<T>[] {
  return assemble(rows, config, {
    childKey: 'children',
    orphan: config.orphan ?? 'root',
  }) as TreeChild<T>[]
}

/** Codes are fixed-width numeric strings, so lexicographic order is numeric order. */
export function compareCode(a: string, b: string): number {
  if (a === b) return 0
  return a < b ? -1 : 1
}

export function collectTreeIds<T extends { id: string; subRows?: T[] }>(row: T): string[] {
  const ids = [row.id]
  for (const child of row.subRows ?? []) {
    ids.push(...collectTreeIds(child))
  }
  return ids
}

export type FlatTreeRow<T> = {
  row: T
  depth: number
  hasChildren: boolean
  expanded: boolean
}

/** Flatten a tree for rendering, honouring an expanded-id set. */
export function flattenTree<T extends { id: string; subRows?: T[] }>(
  nodes: T[],
  expanded: ReadonlySet<string>,
  depth = 0,
): FlatTreeRow<T>[] {
  const output: FlatTreeRow<T>[] = []
  for (const node of nodes) {
    const children = node.subRows ?? []
    const isExpanded = expanded.has(node.id)
    output.push({ row: node, depth, hasChildren: children.length > 0, expanded: isExpanded })
    if (children.length > 0 && isExpanded) {
      output.push(...flattenTree(children, expanded, depth + 1))
    }
  }
  return output
}

/** All ids in the tree, used by "expand all". */
export function allTreeIds<T extends { id: string; subRows?: T[] }>(nodes: T[]): string[] {
  const ids: string[] = []
  for (const node of nodes) {
    ids.push(node.id)
    ids.push(...allTreeIds(node.subRows ?? []))
  }
  return ids
}
