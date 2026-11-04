<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as roleApi from '@/api/role'
import type { Role, RoleQuery } from '@/api/types'
import { useResourcePage } from '@/composables/useResourcePage'
import { useAccess } from '@/composables/useAccess'
import { useUiStore } from '@/stores/ui'
import { formatDateTime } from '@/lib/date-time'
import { roleIdRule, roleNameRule } from '@/lib/validation'
import type { FormField } from '@/components/form-types'
import type { SortState, TableColumn } from '@/components/system/resource-table-types'
import ActionAuth from '@/components/ActionAuth.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import FormDialog from '@/components/FormDialog.vue'
import ResourceTable from '@/components/system/ResourceTable.vue'
import StatusFilter from '@/components/system/StatusFilter.vue'
import StatusSwitch from '@/components/system/StatusSwitch.vue'

const { t } = useI18n()
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
  { key: 'name', title: t('page.system.role.header.name'), sortable: true, fixed: true },
  { key: 'id', title: t('page.system.role.header.role') },
  { key: 'createTime', title: t('page.system.role.header.createTime') },
  { key: 'status', title: t('page.system.role.header.status') },
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
  <div class="system-page">
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
      @update:selection="onSelection"
      @update:sort="onSort"
      @retry="refetch"
    >
      <template #toolbar>
        <label class="system-label" for="role-name-filer">
          {{ t('page.system.role.header.name') }}
        </label>
        <v-text-field
          id="role-name-filer"
          :model-value="params.name ?? ''"
          density="compact"
          variant="outlined"
          hide-details
          class="system-input--lg"
          @update:model-value="(value) => updateParams({ name: value ?? '' })"
        />
        <label class="system-label" for="role-id-filer">
          {{ t('page.system.role.header.role') }}
        </label>
        <v-text-field
          id="role-id-filer"
          :model-value="params.id ?? ''"
          density="compact"
          variant="outlined"
          hide-details
          class="system-input--md"
          @update:model-value="(value) => updateParams({ id: value ?? '' })"
        />
        <label class="system-label">{{ t('page.system.role.header.status') }}</label>
        <StatusFilter
          :model-value="params.status ?? 'all'"
          @update:model-value="(value) => updateParams({ status: value })"
        />
        <div class="system-toolbar__actions">
          <ActionAuth action="add">
            <v-btn variant="flat" color="primary" @click="addOpen = true">
              {{ t('button.add') }}
            </v-btn>
          </ActionAuth>
          <ActionAuth action="delete">
            <v-btn
              variant="flat"
              color="primary"
              :disabled="selectedRows.length === 0"
              @click="requestDelete(selectedRows)"
            >
              {{ t('button.delete') }}
            </v-btn>
          </ActionAuth>
        </div>
      </template>

      <template #cell-createTime="{ value }">
        <span>{{ formatDateTime(value as string) }}</span>
      </template>
      <template #cell-status="{ row }">
        <StatusSwitch
          v-if="canAct(currentPath, 'edit')"
          :initial="row.status"
          :subject-name="row.name"
          :submit="(status) => handleStatusChange(row, status)"
        />
        <span v-else class="system-cell--muted">
          {{ row.status === '1' ? t('dict.status.enabled') : t('dict.status.disabled') }}
        </span>
      </template>
      <template #actions="{ row }">
        <v-menu
          v-if="canAct(currentPath, 'edit') || canAct(currentPath, 'delete')"
          location="bottom end"
        >
          <template #activator="{ props: activatorProps }">
            <v-btn
              v-bind="activatorProps"
              icon
              size="small"
              variant="text"
              class="system-row-action"
              :aria-label="t('table.openMenu')"
            >
              <v-icon icon="mdi-dots-horizontal" />
            </v-btn>
          </template>
          <v-list density="compact" class="system-column-menu">
            <v-list-subheader>{{ t('table.actions') }}</v-list-subheader>
            <v-divider />
            <ActionAuth action="edit">
              <v-list-item :title="t('button.edit')" @click="openEdit(row)" />
            </ActionAuth>
            <ActionAuth action="delete">
              <v-list-item :title="t('button.delete')" @click="requestDelete([row])" />
            </ActionAuth>
          </v-list>
        </v-menu>
      </template>
    </ResourceTable>

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
