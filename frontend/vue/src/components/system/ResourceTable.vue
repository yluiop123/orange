<script setup lang="ts" generic="T">
import { computed } from 'vue'
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

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.size)))
const visibleIds = computed(() => props.rows.map(props.rowKey))
const selectedSet = computed(() => new Set(props.selection))
const allSelected = computed(
  () => visibleIds.value.length > 0 && visibleIds.value.every((id) => selectedSet.value.has(id)),
)
const someSelected = computed(
  () => !allSelected.value && visibleIds.value.some((id) => selectedSet.value.has(id)),
)

function idsFor(row: T): string[] {
  const base = [props.rowKey(row)]
  const descendants = props.descendantIds?.(row) ?? []
  return [...new Set([...base, ...descendants])]
}

function toggleRow(row: T, value: boolean | null) {
  const next = new Set(props.selection)
  const ids = idsFor(row)
  if (value) ids.forEach((id) => next.add(id))
  else ids.forEach((id) => next.delete(id))
  emit('update:selection', [...next])
}

function toggleAll(value: boolean | null) {
  const next = new Set(props.selection)
  if (value) props.rows.forEach((row) => idsFor(row).forEach((id) => next.add(id)))
  else visibleIds.value.forEach((id) => next.delete(id))
  emit('update:selection', [...next])
}

function sortBy(column: TableColumn) {
  if (!column.sortable) return
  const direction = props.sortKey === column.key && props.sortDirection === 'asc' ? 'desc' : 'asc'
  emit('update:sort', { key: column.key, direction })
}

function sortIcon(column: TableColumn) {
  if (props.sortKey !== column.key) return 'mdi-unfold-more-horizontal'
  return props.sortDirection === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'
}

function cellValue(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key]
}

function display(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function metaFor(row: T): RowMeta {
  return props.rowMeta?.(row) ?? { depth: 0, hasChildren: false, expanded: false, toggle: () => {} }
}
</script>

<template>
  <div class="resource-table">
    <v-progress-linear v-if="loading" indeterminate color="primary" height="2" />

    <div v-if="error" class="py-10 text-center">
      <v-alert type="error" variant="tonal" class="mx-auto" max-width="520" :text="error" />
      <v-btn class="mt-4" variant="outlined" prepend-icon="mdi-refresh" @click="emit('retry')">
        {{ t('table.retry') }}
      </v-btn>
    </div>

    <template v-else>
      <div v-if="selectable && selection.length > 0" class="selection-bar">
        {{ t('table.selectedCount', { selected: selection.length, total }) }}
        <v-btn size="small" variant="text" @click="emit('update:selection', [])">
          {{ t('button.clear') }}
        </v-btn>
      </div>

      <v-table class="table" density="comfortable" hover>
        <thead>
          <tr>
            <th v-if="selectable" class="checkbox-cell">
              <v-checkbox-btn
                :model-value="allSelected"
                :indeterminate="someSelected"
                :aria-label="t('table.selectAll')"
                @update:model-value="toggleAll"
              />
            </th>
            <th
              v-for="column in columns"
              :key="column.key"
              :style="column.width ? { width: column.width } : undefined"
              :class="[column.class, `text-${column.align ?? 'start'}`]"
              scope="col"
            >
              <button
                v-if="column.sortable"
                type="button"
                class="sort-button"
                :aria-label="column.title"
                @click="sortBy(column)"
              >
                {{ column.title }}
                <v-icon size="16" :icon="sortIcon(column)" />
              </button>
              <span v-else>{{ column.title }}</span>
            </th>
            <th v-if="$slots.actions" class="text-end">{{ t('table.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="rowKey(row)">
            <td v-if="selectable" class="checkbox-cell">
              <v-checkbox-btn
                :model-value="selectedSet.has(rowKey(row))"
                :aria-label="t('table.selectRow')"
                @update:model-value="(value) => toggleRow(row, value)"
              />
            </td>
            <td
              v-for="column in columns"
              :key="column.key"
              :class="[column.class, `text-${column.align ?? 'start'}`]"
            >
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="cellValue(row, column.key)"
                :meta="metaFor(row)"
              >
                <div
                  v-if="columns.length > 0 && column.key === columns[0].key && rowMeta"
                  class="tree-cell"
                  :style="{ paddingLeft: `${metaFor(row).depth * 20}px` }"
                >
                  <v-btn
                    v-if="metaFor(row).hasChildren"
                    icon
                    size="x-small"
                    variant="text"
                    :aria-label="t('table.toggleExpand')"
                    @click="metaFor(row).toggle()"
                  >
                    <v-icon size="18">
                      {{ metaFor(row).expanded ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
                    </v-icon>
                  </v-btn>
                  <span v-else class="tree-spacer" />
                  <span>{{ display(cellValue(row, column.key)) }}</span>
                </div>
                <span v-else>{{ display(cellValue(row, column.key)) }}</span>
              </slot>
            </td>
            <td v-if="$slots.actions" class="text-end">
              <slot name="actions" :row="row" />
            </td>
          </tr>
          <tr v-if="rows.length === 0 && !loading">
            <td :colspan="columns.length + (selectable ? 1 : 0) + ($slots.actions ? 1 : 0)">
              <div class="empty-state">{{ t('table.empty') }}</div>
            </td>
          </tr>
        </tbody>
      </v-table>

      <div class="table-footer">
        <div class="footer-total">{{ t('table.total', { total }) }}</div>
        <div class="footer-size">
          <span>{{ t('table.perPage') }}</span>
          <v-select
            :model-value="size"
            :items="pageSizes"
            density="compact"
            variant="outlined"
            hide-details
            class="size-select"
            @update:model-value="(value) => emit('update:size', value)"
          />
        </div>
        <v-pagination
          :model-value="page"
          :length="pageCount"
          :total-visible="7"
          density="comfortable"
          @update:model-value="(value) => emit('update:page', value)"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.resource-table {
  position: relative;
}

.table {
  background: transparent;
}

.checkbox-cell {
  width: 48px;
  padding-inline: 8px !important;
}

.selection-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface-variant));
  padding: 4px 8px;
}

.table-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 12px 4px 4px;
}

.footer-total {
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.footer-size {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.size-select {
  width: 92px;
}

.table-footer :deep(.v-pagination) {
  margin-left: auto;
}

.sort-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  color: inherit;
}

.tree-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tree-spacer {
  display: inline-block;
  width: 32px;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
