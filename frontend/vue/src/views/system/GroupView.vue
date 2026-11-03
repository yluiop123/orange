<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as groupApi from '@/api/group'
import type { Group, GroupQuery } from '@/api/types'
import { usePageTitle } from '@/composables/usePageTitle'
import { useResourcePage } from '@/composables/useResourcePage'
import { useAccess } from '@/composables/useAccess'
import { useUiStore } from '@/stores/ui'
import { formatDateTime } from '@/lib/date-time'
import { allTreeIds, collectTreeIds, flattenTree, type FlatTreeRow } from '@/lib/tree'
import { groupNameRule, treeCodeRule } from '@/lib/validation'
import type { FormField } from '@/components/form-types'
import type { RowMeta, TableColumn } from '@/components/system/resource-table-types'
import PageHeader from '@/components/PageHeader.vue'
import ActionAuth from '@/components/ActionAuth.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import FormDialog from '@/components/FormDialog.vue'
import ResourceTable from '@/components/system/ResourceTable.vue'
import StatusFilter from '@/components/system/StatusFilter.vue'
import StatusSwitch from '@/components/system/StatusSwitch.vue'

type GroupNode = Group & { subRows?: GroupNode[] }
type GroupParams = GroupQuery & { page: number; size: number }

const { t } = useI18n()
const title = usePageTitle('page.title.group')
const ui = useUiStore()
const { canAct } = useAccess()
const currentPath = '/system/group'

const {
  params,
  updateParams,
  setPage,
  list,
  loading,
  error,
  refetch,
  selectedRows,
  deleteTarget,
  deleteDescription,
  deleting,
  requestDelete,
  cancelDelete,
  confirmDelete,
  handleStatusChange,
} = useResourcePage<GroupNode, GroupParams>({
  initialParams: { page: 1, size: 10, id: '', name: '', status: 'all' },
  fetcher: (query, signal) =>
    groupApi.listGroups({ id: query.id, name: query.name, status: query.status }, signal),
  errorMessage: t('table.loadError'),
  tree: { id: (row) => row.id, parentId: (row) => row.parentId },
  getRowId: (row) => row.id,
  labelOf: (row) => row.name,
  deleteRows: groupApi.deleteGroups,
  updateStatus: (row, status) => groupApi.updateGroupStatus(row.id, status),
  paginationMode: 'client',
  cascadeDelete: true,
})

const expanded = ref<Set<string>>(new Set())
const initialized = ref(false)

watch(
  list,
  () => {
    if (!initialized.value && list.value.length > 0) {
      expanded.value = new Set(allTreeIds(list.value as GroupNode[]))
      initialized.value = true
    }
  },
  { immediate: true },
)

const flatRows = computed(() => flattenTree(list.value as GroupNode[], expanded.value))
const pageRows = computed(() =>
  flatRows.value.slice((params.value.page - 1) * params.value.size, params.value.page * params.value.size),
)
const metaById = computed(() => {
  const map = new Map<string, RowMeta>()
  for (const item of flatRows.value) {
    map.set(item.row.id, {
      depth: item.depth,
      hasChildren: item.hasChildren,
      expanded: item.expanded,
      toggle: () => toggleExpand(item),
    })
  }
  return map
})

function toggleExpand(item: FlatTreeRow<GroupNode>) {
  const next = new Set(expanded.value)
  if (next.has(item.row.id)) next.delete(item.row.id)
  else next.add(item.row.id)
  expanded.value = next
}

function expandAll() {
  expanded.value = new Set(allTreeIds(list.value as GroupNode[]))
}

function collapseAll() {
  expanded.value = new Set()
}

const columns = computed<TableColumn[]>(() => [
  { key: 'name', title: t('page.system.group.header.name') },
  { key: 'id', title: t('page.system.group.header.id'), width: '140px' },
  { key: 'status', title: t('page.system.group.header.status'), width: '110px' },
  { key: 'createTime', title: t('page.system.group.header.createTime'), width: '170px' },
])

const addOpen = ref(false)
const addParentId = ref('')
const addInitialValues = computed(() => ({ parentId: addParentId.value }))
const editOpen = ref(false)
const editId = ref('')
const editValues = ref<Record<string, unknown> | undefined>(undefined)

const addFields = computed<FormField[]>(() => [
  {
    key: 'id',
    label: 'page.system.group.header.id',
    validate: treeCodeRule(t, 'group', addParentId.value || undefined),
  },
  { key: 'name', label: 'page.system.group.header.name', validate: groupNameRule(t) },
  {
    key: 'parentId',
    label: 'page.system.group.header.parentGroup',
    type: 'group',
    disabled: true,
  },
])

const editFields = computed<FormField[]>(() => [
  {
    key: 'id',
    label: 'page.system.group.header.id',
    disabled: true,
  },
  { key: 'name', label: 'page.system.group.header.name', validate: groupNameRule(t) },
  {
    key: 'parentId',
    label: 'page.system.group.header.parentGroup',
    type: 'group',
    disabled: true,
  },
])

function openAddChild(row: GroupNode | null) {
  addParentId.value = row?.id ?? ''
  addOpen.value = true
}

async function submitAdd(values: Record<string, unknown>) {
  await groupApi.addGroupChild({
    id: String(values.id ?? ''),
    name: String(values.name ?? ''),
    parentId: String(values.parentId ?? '') || undefined,
  })
  ui.notify(t('message.success'), 'success')
  refetch()
}

async function openEdit(row: GroupNode) {
  try {
    const group = await groupApi.getGroup(row.id)
    editId.value = row.id
    editValues.value = {
      id: group.id,
      name: group.name,
      parentId: group.parentId ?? '',
      status: group.status ?? '1',
    }
    editOpen.value = true
  } catch {
    // The interceptor reports the failure.
  }
}

async function submitEdit(values: Record<string, unknown>) {
  await groupApi.updateGroup(editId.value, {
    name: String(values.name ?? ''),
  })
  ui.notify(t('message.success'), 'success')
  refetch()
}

function rowMeta(row: GroupNode): RowMeta {
  return (
    metaById.value.get(row.id) ?? {
      depth: 0,
      hasChildren: false,
      expanded: false,
      toggle: () => undefined,
    }
  )
}

function descendantIds(row: GroupNode): string[] {
  return collectTreeIds(row)
}

function onSelection(ids: string[]) {
  const map = new Map<string, GroupNode>()
  const walk = (rows: GroupNode[]) => {
    for (const row of rows) {
      map.set(row.id, row)
      if (row.subRows) walk(row.subRows)
    }
  }
  walk(list.value as GroupNode[])
  selectedRows.value = ids.map((id) => map.get(id)).filter((row): row is GroupNode => Boolean(row))
}

watch(params, () => {
  if (selectedRows.value.length > 0) selectedRows.value = []
})
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('page.system.subtitle')" />

    <v-card class="filter-card">
      <div class="filters">
        <v-text-field
          :model-value="params.name ?? ''"
          :label="t('page.system.group.header.name')"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          class="filter-input"
          @update:model-value="(value) => updateParams({ name: value ?? '' })"
        />
        <v-text-field
          :model-value="params.id ?? ''"
          :label="t('page.system.group.header.id')"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          class="filter-input"
          @update:model-value="(value) => updateParams({ id: value ?? '' })"
        />
        <StatusFilter
          :model-value="params.status ?? 'all'"
          @update:model-value="(value) => updateParams({ status: value })"
        />
        <v-btn variant="text" prepend-icon="mdi-unfold-more-horizontal" @click="expandAll">
          {{ t('button.expandAll') }}
        </v-btn>
        <v-btn variant="text" prepend-icon="mdi-unfold-less-horizontal" @click="collapseAll">
          {{ t('button.collapseAll') }}
        </v-btn>
        <v-spacer />
        <ActionAuth action="add">
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddChild(null)">
            {{ t('button.add') }}
          </v-btn>
        </ActionAuth>
        <ActionAuth action="delete">
          <v-btn
            variant="outlined"
            color="error"
            prepend-icon="mdi-delete-outline"
            :disabled="selectedRows.length === 0"
            @click="requestDelete(selectedRows)"
          >
            {{ t('button.delete') }}
          </v-btn>
        </ActionAuth>
      </div>
    </v-card>

    <v-card>
      <ResourceTable
        :rows="pageRows.map((item) => item.row)"
        :columns="columns"
        :row-key="(row) => row.id"
        :total="flatRows.length"
        :page="params.page"
        :size="params.size"
        :loading="loading"
        :error="error"
        selectable
        :selection="selectedRows.map((row) => row.id)"
        :row-meta="rowMeta"
        :descendant-ids="descendantIds"
        @update:page="setPage"
        @update:size="(size) => updateParams({ size }, true)"
        @update:selection="onSelection"
        @retry="refetch"
      >
        <template #cell-id="{ value }">
          <code class="mono">{{ value }}</code>
        </template>
        <template #cell-createTime="{ value }">
          <span class="text-no-wrap">{{ formatDateTime(value as string) }}</span>
        </template>
        <template #cell-status="{ row }">
          <StatusSwitch
            v-if="canAct(currentPath, 'edit')"
            :initial="row.status ?? '1'"
            :subject-name="row.name"
            @change="(status) => handleStatusChange(row, status)"
          />
          <v-chip v-else size="small" :color="row.status === '1' ? 'success' : 'default'" variant="tonal">
            {{ row.status === '1' ? t('dict.status.enabled') : t('dict.status.disabled') }}
          </v-chip>
        </template>
        <template #actions="{ row }">
          <v-menu v-if="canAct(currentPath, 'add') || canAct(currentPath, 'edit')" location="bottom end">
            <template #activator="{ props: activatorProps }">
              <v-btn
                v-bind="activatorProps"
                icon
                size="small"
                variant="text"
                :aria-label="t('table.openMenu')"
              >
                <v-icon>mdi-dots-horizontal</v-icon>
              </v-btn>
            </template>
            <v-list density="compact" min-width="180">
              <v-list-subheader>{{ t('table.actions') }}</v-list-subheader>
              <ActionAuth action="add">
                <v-list-item
                  prepend-icon="mdi-plus-box-outline"
                  :title="t('button.addChild')"
                  @click="openAddChild(row)"
                />
              </ActionAuth>
              <ActionAuth action="edit">
                <v-list-item prepend-icon="mdi-pencil-outline" :title="t('button.edit')" @click="openEdit(row)" />
              </ActionAuth>
            </v-list>
          </v-menu>
        </template>
      </ResourceTable>
    </v-card>

    <FormDialog
      v-model="addOpen"
      :title="t('button.addChild')"
      :fields="addFields"
      :initial-values="addInitialValues"
      :submit="submitAdd"
    />
    <FormDialog
      v-model="editOpen"
      :title="t('button.edit')"
      :fields="editFields"
      :initial-values="editValues"
      :submit="submitEdit"
    />
    <ConfirmDialog
      :model-value="deleteTarget.length > 0"
      :title="t('button.delete')"
      :description="deleteDescription"
      :confirm-label="t('button.delete')"
      :pending="deleting"
      @update:model-value="(value) => !value && cancelDelete()"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.filter-card {
  padding: 12px;
}

.filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-input {
  max-width: 210px;
  min-width: 160px;
}
</style>
