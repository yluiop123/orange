<script setup lang="ts" generic="T">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RowMeta, SortState, TableColumn } from './resource-table-types'

const props = withDefaults(
  defineProps<{
    rows: T[]
    columns: TableColumn[]
    rowKey: (row: T) => string
    total: number
    page: number
    size: number
    loading?: boolean
    error?: string | null
    selectable?: boolean
    selection?: string[]
    rowMeta?: (row: T) => RowMeta
    descendantIds?: (row: T) => string[]
    sortKey?: string
    sortDirection?: 'asc' | 'desc' | ''
    pageSizes?: number[]
  }>(),
  {
    loading: false,
    error: null,
    selectable: false,
    selection: () => [],
    rowMeta: undefined,
    descendantIds: undefined,
    sortKey: '',
    sortDirection: '',
    pageSizes: () => [10, 20, 50, 100],
  },
)

const emit = defineEmits<{
  'update:page': [page: number]
  'update:size': [size: number]
  'update:selection': [selection: string[]]
  'update:sort': [sort: SortState]
  retry: []
}>()

const { t } = useI18n()

const hiddenKeys = ref<string[]>([])

const visibleColumns = computed(() =>
  props.columns.filter((column) => !hiddenKeys.value.includes(column.key)),
)
const hideableColumns = computed(() =>
  props.columns.filter((column) => !column.fixed && column.key !== 'actions'),
)
const treeColumnKey = computed(() => props.columns[0]?.key)
const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.size)))
const visibleIds = computed(() => props.rows.map(props.rowKey))
const selectedSet = computed(() => new Set(props.selection))
const allSelected = computed(
  () => visibleIds.value.length > 0 && visibleIds.value.every((id) => selectedSet.value.has(id)),
)
const someSelected = computed(
  () => !allSelected.value && visibleIds.value.some((id) => selectedSet.value.has(id)),
)
const expandableMetas = computed(() =>
  props.rows.map((row) => metaFor(row)).filter((meta) => meta.hasChildren),
)
const allExpanded = computed(
  () => expandableMetas.value.length > 0 && expandableMetas.value.every((meta) => meta.expanded),
)

function toggleAllExpanded() {
  const expand = !allExpanded.value
  for (const meta of expandableMetas.value) {
    if (meta.expanded !== expand) meta.toggle()
  }
}

function toggleColumn(key: string) {
  hiddenKeys.value = hiddenKeys.value.includes(key)
    ? hiddenKeys.value.filter((item) => item !== key)
    : [...hiddenKeys.value, key]
}

function idsFor(row: T): string[] {
  const base = [props.rowKey(row)]
  const descendants = props.descendantIds?.(row) ?? []
  return [...new Set([...base, ...descendants])]
}

function toggleRow(row: T, value: boolean) {
  const next = new Set(props.selection)
  const ids = idsFor(row)
  if (value) ids.forEach((id) => next.add(id))
  else ids.forEach((id) => next.delete(id))
  emit('update:selection', [...next])
}

function toggleAll(value: boolean) {
  const next = new Set(props.selection)
  if (value) props.rows.forEach((row) => idsFor(row).forEach((id) => next.add(id)))
  else visibleIds.value.forEach((id) => next.delete(id))
  emit('update:selection', [...next])
}

function onAllCheck(event: Event) {
  toggleAll((event.target as HTMLInputElement).checked)
}

function onRowCheck(row: T, event: Event) {
  toggleRow(row, (event.target as HTMLInputElement).checked)
}

function sortBy(column: TableColumn) {
  if (!column.sortable) return
  const direction = props.sortKey === column.key && props.sortDirection === 'asc' ? 'desc' : 'asc'
  emit('update:sort', { key: column.key, direction })
}

function sortIcon(column: TableColumn) {
  if (props.sortKey !== column.key) return 'mdi-arrow-up-down'
  return props.sortDirection === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'
}

function cellValue(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key]
}

function display(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function metaFor(row: T): RowMeta {
  return props.rowMeta?.(row) ?? { depth: 0, hasChildren: false, expanded: false, toggle: () => {} }
}

function indentFor(column: TableColumn, row: T): Record<string, string> | undefined {
  if (!props.rowMeta || column.key !== treeColumnKey.value) return undefined
  return { paddingLeft: `${metaFor(row).depth * 32 + 8}px` }
}
</script>

<template>
  <div class="system-table">
    <div class="system-toolbar">
      <div class="system-toolbar__slot">
        <slot name="toolbar" />
      </div>

      <v-menu location="bottom end" :close-on-content-click="false">
        <template #activator="{ props: activatorProps }">
          <v-btn
            v-bind="activatorProps"
            variant="outlined"
            class="system-columns"
            :aria-label="t('table.columns')"
          >
            {{ t('table.columns') }}
            <v-icon size="16">mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list density="compact" class="system-column-menu">
          <v-list-item
            v-for="column in hideableColumns"
            :key="column.key"
            @click="toggleColumn(column.key)"
          >
            <template #prepend>
              <input
                class="system-checkbox"
                type="checkbox"
                tabindex="-1"
                :checked="!hiddenKeys.includes(column.key)"
                :aria-label="column.title"
                @click.stop="toggleColumn(column.key)"
              />
            </template>
            <v-list-item-title>{{ column.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <div v-if="error" class="system-error">
      <p>{{ error }}</p>
      <v-btn variant="outlined" size="small" @click="emit('retry')">
        {{ t('table.retry') }}
      </v-btn>
    </div>

    <template v-else>
      <div class="system-table__scroll">
        <table>
          <thead>
            <tr>
              <th v-if="selectable" class="system-cell--select">
                <input
                  class="system-checkbox"
                  type="checkbox"
                  :checked="allSelected"
                  :indeterminate="someSelected"
                  :aria-label="t('table.selectAll')"
                  @change="onAllCheck"
                />
              </th>
              <th v-if="rowMeta" class="system-cell--expand">
                <button
                  v-if="expandableMetas.length > 0"
                  type="button"
                  class="system-expand"
                  :aria-label="t('table.expandAll')"
                  @click="toggleAllExpanded"
                >
                  <v-icon size="18">
                    {{ allExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
                  </v-icon>
                </button>
              </th>
              <th
                v-for="column in visibleColumns"
                :key="column.key"
                :style="column.width ? { width: column.width } : undefined"
                :class="column.class"
                scope="col"
              >
                <button
                  v-if="column.sortable"
                  type="button"
                  class="system-sort"
                  :aria-label="column.title"
                  @click="sortBy(column)"
                >
                  {{ column.title }}
                  <v-icon size="14" :icon="sortIcon(column)" />
                </button>
                <span v-else>{{ column.title }}</span>
              </th>
              <th v-if="$slots.actions" class="system-cell--actions" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="rowKey(row)" :class="{ 'is-selected': selectedSet.has(rowKey(row)) }">
              <td v-if="selectable" class="system-cell--select">
                <input
                  class="system-checkbox"
                  type="checkbox"
                  :checked="selectedSet.has(rowKey(row))"
                  :aria-label="t('table.selectRow')"
                  @change="onRowCheck(row, $event)"
                />
              </td>
              <td v-if="rowMeta" class="system-cell--expand">
                <button
                  v-if="metaFor(row).hasChildren"
                  type="button"
                  class="system-expand"
                  :aria-label="t('table.toggleExpand')"
                  @click="metaFor(row).toggle()"
                >
                  <v-icon size="18">
                    {{ metaFor(row).expanded ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
                  </v-icon>
                </button>
                <span v-else class="system-expand__spacer" />
              </td>
              <td
                v-for="column in visibleColumns"
                :key="column.key"
                :class="column.class"
                :style="indentFor(column, row)"
              >
                <slot
                  :name="`cell-${column.key}`"
                  :row="row"
                  :value="cellValue(row, column.key)"
                  :meta="metaFor(row)"
                >
                  {{ display(cellValue(row, column.key)) }}
                </slot>
              </td>
              <td v-if="$slots.actions" class="system-cell--actions">
                <slot name="actions" :row="row" />
              </td>
            </tr>
            <tr v-if="rows.length === 0">
              <td
                class="system-table__empty"
                :colspan="
                  visibleColumns.length + (selectable ? 1 : 0) + (rowMeta ? 1 : 0) + ($slots.actions ? 1 : 0)
                "
              >
                {{ loading ? t('table.loading') : t('table.empty') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="system-footer">
        <div class="system-footer__count">
          {{
            loading
              ? t('table.loading')
              : t('table.selectedCount', { selected: selection.length, total })
          }}
        </div>
        <div class="system-footer__pager">
          <span class="system-footer__page">{{ page }} / {{ pageCount }}</span>
          <v-btn
            variant="outlined"
            size="small"
            :disabled="page <= 1"
            @click="emit('update:page', page - 1)"
          >
            {{ t('table.previous') }}
          </v-btn>
          <v-btn
            variant="outlined"
            size="small"
            :disabled="page >= pageCount"
            @click="emit('update:page', page + 1)"
          >
            {{ t('table.next') }}
          </v-btn>
        </div>
      </div>
    </template>
  </div>
</template>
