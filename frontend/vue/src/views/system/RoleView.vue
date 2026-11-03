<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as roleApi from '@/api/role'
import type { Role, RoleQuery } from '@/api/types'
import { usePageTitle } from '@/composables/usePageTitle'
import { useResourcePage } from '@/composables/useResourcePage'
import { useAccess } from '@/composables/useAccess'
import { useUiStore } from '@/stores/ui'
import { formatDateTime } from '@/lib/date-time'
import { roleIdRule, roleNameRule } from '@/lib/validation'
import type { FormField } from '@/components/form-types'
import type { SortState, TableColumn } from '@/components/system/resource-table-types'
import PageHeader from '@/components/PageHeader.vue'
import ActionAuth from '@/components/ActionAuth.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import FormDialog from '@/components/FormDialog.vue'
import ResourceTable from '@/components/system/ResourceTable.vue'
import StatusFilter from '@/components/system/StatusFilter.vue'
import StatusSwitch from '@/components/system/StatusSwitch.vue'

const { t } = useI18n()
const title = usePageTitle('page.title.role')
const ui = useUiStore()
const { canAct } = useAccess()
const currentPath = '/system/role'

const {
  params,
  updateParams,
  setPage,
  list,
  total,
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
} = useResourcePage<Role, RoleQuery>({
  initialParams: { page: 1, size: 10, id: '', name: '', status: 'all' },
  fetcher: (query, signal) => roleApi.listRoles(query, signal),
  errorMessage: t('table.loadError'),
  getRowId: (row) => row.id,
  labelOf: (row) => row.name,
  deleteRows: roleApi.deleteRoles,
  updateStatus: (row, status) => roleApi.updateRole(row.id, { status }),
  paginationMode: 'server',
})

const columns = computed<TableColumn[]>(() => [
  { key: 'name', title: t('page.system.role.header.name'), sortable: true },
  { key: 'id', title: t('page.system.role.header.role') },
  { key: 'permissions', title: t('page.system.role.header.permissions'), width: '120px' },
  { key: 'createTime', title: t('page.system.role.header.createTime'), width: '170px' },
  { key: 'status', title: t('page.system.role.header.status'), width: '110px' },
])

const addOpen = ref(false)
const editOpen = ref(false)
const editId = ref('')
const editValues = ref<Record<string, unknown> | undefined>(undefined)

const addFields = computed<FormField[]>(() => [
  { key: 'id', label: 'page.system.role.header.role', validate: roleIdRule(t) },
  { key: 'name', label: 'page.system.role.header.name', validate: roleNameRule(t) },
  { key: 'permissions', label: 'page.system.role.header.permissions', type: 'permissions' },
])

const editFields = computed<FormField[]>(() =>
  addFields.value.map((field) => (field.key === 'id' ? { ...field, disabled: true } : field)),
)

async function submitAdd(values: Record<string, unknown>) {
  await roleApi.createRole({
    id: String(values.id ?? ''),
    name: String(values.name ?? ''),
    permissions: Array.isArray(values.permissions) ? (values.permissions as string[]) : [],
  })
  ui.notify(t('message.success'), 'success')
  refetch()
}

async function openEdit(row: Role) {
  try {
    const role = await roleApi.getRole(row.id)
    editId.value = row.id
    editValues.value = {
      id: role.id,
      name: role.name,
      status: role.status,
      permissions: role.permissions ?? [],
    }
    editOpen.value = true
  } catch {
    // The interceptor reports the failure.
  }
}

async function submitEdit(values: Record<string, unknown>) {
  await roleApi.updateRole(editId.value, {
    name: String(values.name ?? ''),
    permissions: Array.isArray(values.permissions) ? (values.permissions as string[]) : [],
  })
  ui.notify(t('message.success'), 'success')
  refetch()
}

function onSelection(ids: string[]) {
  selectedRows.value = list.value.filter((row) => ids.includes(row.id))
}

watch(params, () => {
  if (selectedRows.value.length > 0) selectedRows.value = []
})

function onSort(sort: SortState) {
  updateParams({ sort: sort.key, direction: sort.direction })
}
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('page.system.subtitle')" />

    <v-card class="filter-card">
      <div class="filters">
        <v-text-field
          :model-value="params.name ?? ''"
          :label="t('page.system.role.header.name')"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          class="filter-input"
          @update:model-value="(value) => updateParams({ name: value ?? '' })"
        />
        <v-text-field
          :model-value="params.id ?? ''"
          :label="t('page.system.role.header.role')"
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
        <v-spacer />
        <ActionAuth action="add">
          <v-btn color="primary" prepend-icon="mdi-plus" @click="addOpen = true">
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
        :rows="list"
        :columns="columns"
        :row-key="(row) => row.id"
        :total="total"
        :page="params.page"
        :size="params.size"
        :loading="loading"
        :error="error"
        selectable
        :selection="selectedRows.map((row) => row.id)"
        :sort-key="params.sort"
        :sort-direction="params.direction"
        @update:page="setPage"
        @update:size="(size) => updateParams({ size }, true)"
        @update:selection="onSelection"
        @update:sort="onSort"
        @retry="refetch"
      >
        <template #cell-id="{ value }">
          <code class="mono">{{ value }}</code>
        </template>
        <template #cell-permissions="{ value }">
          <v-chip size="small" variant="tonal" color="primary">
            {{ Array.isArray(value) ? value.length : 0 }}
          </v-chip>
        </template>
        <template #cell-createTime="{ value }">
          <span class="text-no-wrap">{{ formatDateTime(value as string) }}</span>
        </template>
        <template #cell-status="{ row }">
          <StatusSwitch
            v-if="canAct(currentPath, 'edit')"
            :initial="row.status"
            :subject-name="row.name"
            @change="(status) => handleStatusChange(row, status)"
          />
          <v-chip v-else size="small" :color="row.status === '1' ? 'success' : 'default'" variant="tonal">
            {{ row.status === '1' ? t('dict.status.enabled') : t('dict.status.disabled') }}
          </v-chip>
        </template>
        <template #actions="{ row }">
          <v-menu v-if="canAct(currentPath, 'edit') || canAct(currentPath, 'delete')" location="bottom end">
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
              <ActionAuth action="edit">
                <v-list-item prepend-icon="mdi-pencil-outline" :title="t('button.edit')" @click="openEdit(row)" />
              </ActionAuth>
              <ActionAuth action="delete">
                <v-list-item
                  prepend-icon="mdi-delete-outline"
                  :title="t('button.delete')"
                  base-color="error"
                  @click="requestDelete([row])"
                />
              </ActionAuth>
            </v-list>
          </v-menu>
        </template>
      </ResourceTable>
    </v-card>

    <FormDialog v-model="addOpen" :title="t('button.add')" :fields="addFields" :submit="submitAdd" />
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
  max-width: 220px;
  min-width: 170px;
}
</style>
