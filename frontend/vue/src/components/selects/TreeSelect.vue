<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { buildChildrenTree, type TreeChild } from '@/lib/tree'

export type TreeSelectItem = {
  id: string
  name: string
  parentId?: string | null
  disabled?: boolean
}

type TreeNode = TreeChild<TreeSelectItem>

const props = withDefaults(
  defineProps<{
    items: TreeSelectItem[]
    modelValue?: string | string[]
    multiple?: boolean
    placeholder?: string
    filterable?: boolean
    disabled?: boolean
    allowEmpty?: boolean
    emptyLabel?: string
  }>(),
  {
    modelValue: '',
    multiple: false,
    placeholder: '',
    filterable: false,
    disabled: false,
    allowEmpty: false,
    emptyLabel: 'dict.status.all',
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: string | string[]] }>()
const { t } = useI18n()

const open = ref(false)
const search = ref('')
const expanded = ref<Set<string>>(new Set())

const tree = computed<TreeNode[]>(() =>
  buildChildrenTree(
    props.items.map((item) => ({ ...item })),
    { id: (item) => item.id, parentId: (item) => item.parentId },
  ),
)

const selectedIds = computed(() => {
  const value = props.modelValue
  return new Set(Array.isArray(value) ? value : value ? [value] : [])
})

const selectedItems = computed(() => props.items.filter((item) => selectedIds.value.has(item.id)))
const selectedTitle = computed(() => {
  if (props.multiple) return ''
  const value = props.modelValue
  const id = Array.isArray(value) ? value[0] : value
  return props.items.find((item) => item.id === id)?.name ?? ''
})

const rows = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  const result: Array<{ node: TreeNode; depth: number; hasChildren: boolean; expanded: boolean }> = []
  const matches = (node: TreeNode): boolean =>
    node.name.toLowerCase().includes(keyword)
    || (node.children ?? []).some((child) => matches(child))
  const walk = (nodes: TreeNode[], depth: number) => {
    for (const node of nodes) {
      if (keyword && !matches(node)) continue
      const children = node.children ?? []
      const isExpanded = keyword !== '' || expanded.value.has(node.id)
      result.push({ node, depth, hasChildren: children.length > 0, expanded: isExpanded })
      if (children.length > 0 && isExpanded) walk(children, depth + 1)
    }
  }
  walk(tree.value, 0)
  return result
})

const emptyText = computed(() => t('table.empty'))

function isSelected(id: string) {
  return selectedIds.value.has(id)
}

function toggleExpand(event: Event, id: string) {
  event.stopPropagation()
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expanded.value = next
}

function toggleCheck(node: TreeNode, checked: boolean) {
  if (node.disabled && !isSelected(node.id) && checked) return
  const next = new Set(selectedIds.value)
  if (checked) next.add(node.id)
  else next.delete(node.id)
  emit(
    'update:modelValue',
    props.items.filter((item) => next.has(item.id)).map((item) => item.id),
  )
}

function choose(node: TreeNode) {
  if (node.disabled && !isSelected(node.id)) return
  if (props.multiple) {
    toggleCheck(node, !isSelected(node.id))
    return
  }
  emit('update:modelValue', node.id)
  open.value = false
}

function chooseEmpty() {
  emit('update:modelValue', props.multiple ? [] : '')
  open.value = false
}

function remove(id: string, event: Event) {
  event.stopPropagation()
  const next = new Set(selectedIds.value)
  next.delete(id)
  emit(
    'update:modelValue',
    props.items.filter((item) => next.has(item.id)).map((item) => item.id),
  )
}
</script>

<template>
  <v-menu
    v-model="open"
    :close-on-content-click="false"
    location="bottom start"
    :offset="4"
    attach="body"
    :z-index="3000"
  >
    <template #activator="{ props: activatorProps }">
      <button
        v-bind="activatorProps"
        type="button"
        class="tree-trigger"
        :disabled="disabled"
        :aria-label="placeholder"
      >
        <span class="tree-value">
          <template v-if="multiple && selectedItems.length > 0">
            <span v-for="item in selectedItems" :key="item.id" class="tree-chip">
              {{ item.name }}
              <span class="tree-chip-x" @click="remove(item.id, $event)">×</span>
            </span>
          </template>
          <span v-else class="tree-placeholder">{{ selectedTitle || placeholder }}</span>
        </span>
        <v-icon size="16" class="tree-caret">mdi-chevron-down</v-icon>
      </button>
    </template>

    <div class="tree-popover">
      <input
        v-if="filterable"
        v-model="search"
        class="tree-search"
        type="text"
        :aria-label="t('table.search')"
      />
      <button
        v-if="allowEmpty && !multiple"
        type="button"
        class="tree-row"
        @click="chooseEmpty"
      >
        <span class="tree-chevron"></span>
        <span class="tree-name">{{ t(emptyLabel) }}</span>
      </button>
      <div
        v-for="row in rows"
        :key="row.node.id"
        class="tree-row"
        :class="{ selected: isSelected(row.node.id), disabled: row.node.disabled && !isSelected(row.node.id) }"
        :style="{ paddingLeft: `${8 + row.depth * 16}px` }"
        @click="choose(row.node)"
      >
        <button
          v-if="row.hasChildren"
          type="button"
          class="tree-chevron"
          :aria-label="row.node.name"
          @click="toggleExpand($event, row.node.id)"
        >
          <v-icon size="16">{{ row.expanded ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
        </button>
        <span v-else class="tree-chevron"></span>
        <input
          v-if="multiple"
          class="tree-check"
          type="checkbox"
          :checked="isSelected(row.node.id)"
          :disabled="row.node.disabled && !isSelected(row.node.id)"
          :aria-label="row.node.name"
          @click.stop
          @change="toggleCheck(row.node, ($event.target as HTMLInputElement).checked)"
        />
        <span class="tree-name">{{ row.node.name }}</span>
        <v-icon v-if="!multiple && isSelected(row.node.id)" size="16" class="tree-check-mark">
          mdi-check
        </v-icon>
      </div>
      <div v-if="rows.length === 0" class="tree-empty">{{ emptyText }}</div>
    </div>
  </v-menu>
</template>

<style scoped>
.tree-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 36px;
  padding: 4px 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-surface));
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}

.tree-trigger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tree-value {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
}

.tree-placeholder {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgb(var(--v-theme-on-surface-variant));
}

.tree-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 1px 6px;
  border-radius: 5px;
  background: rgb(var(--v-theme-surface-variant));
  font-size: 12px;
  white-space: nowrap;
}

.tree-chip-x {
  padding: 0 2px;
  color: rgb(var(--v-theme-on-surface-variant));
  cursor: pointer;
}

.tree-chip-x:hover {
  color: rgb(var(--v-theme-on-surface));
}

.tree-caret {
  opacity: 0.7;
}

.tree-popover {
  width: 288px;
  max-width: min(336px, 92vw);
  max-height: 340px;
  overflow: auto;
  padding: 4px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 16px 40px -20px rgba(0, 0, 0, 0.45);
}

.tree-search {
  width: 100%;
  min-height: 30px;
  margin-bottom: 4px;
  padding: 4px 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-surface));
  font: inherit;
  font-size: 13px;
  outline: none;
}

.tree-row {
  display: flex;
  align-items: center;
  gap: 5px;
  min-height: 28px;
  padding: 2px 6px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: rgb(var(--v-theme-on-surface));
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.tree-row:hover {
  background: rgb(var(--v-theme-surface-variant));
}

.tree-row.selected {
  background: color-mix(in srgb, rgb(var(--v-theme-primary)) 12%, transparent);
}

.tree-row.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.tree-chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgb(var(--v-theme-on-surface-variant));
  cursor: pointer;
}

.tree-check {
  width: 14px;
  height: 14px;
  margin: 0 2px 0 0;
  accent-color: rgb(var(--v-theme-primary));
}

.tree-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-check-mark {
  margin-left: auto;
}

.tree-empty {
  padding: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 13px;
  text-align: center;
}
</style>
