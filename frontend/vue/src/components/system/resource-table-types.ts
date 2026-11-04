export type TableColumn = {
  key: string
  title: string
  sortable?: boolean
  width?: string
  align?: 'start' | 'center' | 'end'
  class?: string
  /** Fixed columns (name, actions) cannot be hidden from the column menu. */
  fixed?: boolean
}

export type RowMeta = {
  depth: number
  hasChildren: boolean
  expanded: boolean
  toggle: () => void
}

export type SortState = {
  key: string
  direction: 'asc' | 'desc'
}
