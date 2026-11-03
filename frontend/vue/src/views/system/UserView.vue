<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as userApi from '@/api/user'
import type { User, UserPayload, UserQuery } from '@/api/types'
import { usePageTitle } from '@/composables/usePageTitle'
import { useResourcePage } from '@/composables/useResourcePage'
import { useAccess } from '@/composables/useAccess'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { formatDateTime } from '@/lib/date-time'
import type { FormField } from '@/components/form-types'
import type { SortState, TableColumn } from '@/components/system/resource-table-types'
import { emailRule, nameRule, phoneRule, requiredRule, usernameRule } from '@/lib/validation'
import PageHeader from '@/components/PageHeader.vue'
import ActionAuth from '@/components/ActionAuth.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import FormDialog from '@/components/FormDialog.vue'
import PasswordDialog from '@/components/PasswordDialog.vue'
import GroupSelect from '@/components/selects/GroupSelect.vue'
import ResourceTable from '@/components/system/ResourceTable.vue'
import StatusFilter from '@/components/system/StatusFilter.vue'
import StatusSwitch from '@/components/system/StatusSwitch.vue'

const { t } = useI18n()
const title = usePageTitle('page.title.user')
const auth = useAuthStore()
const ui = useUiStore()
const { canAct } = useAccess()
const currentPath = '/system/user'

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
} = useResourcePage<User, UserQuery>({
  initialParams: { page: 1, size: 10, keyword: '', status: 'all', groupId: '' },
  fetcher: (query, signal) => userApi.listUsers(query, signal),
  errorMessage: t('table.loadError'),
  getRowId: (row) => row.id,
  labelOf: (row) => row.username,
  deleteRows: userApi.deleteUsers,
  updateStatus: (row, status) => userApi.updateUserStatus(row.id, status),
  paginationMode: 'server',
  canDeleteRow: (row) => row.username !== auth.userInfo?.username,
})

const columns = computed<TableColumn[]>(() => [
  { key: 'name', title: t('page.system.user.header.name'), sortable: true },
  { key: 'username', title: t('page.system.user.header.userName') },
  { key: 'email', title: t('page.system.user.header.email') },
  { key: 'phone', title: t('page.system.user.header.phone') },
  { key: 'groupName', title: t('page.system.user.header.groupName') },
  { key: 'createTime', title: t('page.system.user.header.createTime'), width: '170px' },
  { key: 'status', title: t('page.system.user.header.status'), width: '110px' },
])

const addOpen = ref(false)
const editOpen = ref(false)
const editId = ref('')
const editValues = ref<Record<string, unknown> | undefined>(undefined)
const resetTarget = ref<User | null>(null)
const resetting = ref(false)
const passwordValue = ref('')
const passwordUsername = ref('')
const passwordOpen = ref(false)

const addFields = computed<FormField[]>(() => [
  { key: 'username', label: 'page.system.user.header.userName', validate: usernameRule(t) },
  { key: 'name', label: 'page.system.user.header.name', validate: nameRule(t) },
  { key: 'email', label: 'page.system.user.header.email', validate: emailRule(t) },
  { key: 'phone', label: 'page.system.user.header.phone', validate: phoneRule(t) },
  {
    key: 'groupId',
    label: 'page.system.user.header.groupName',
    type: 'group',
    validate: requiredRule(t),
  },
  { key: 'roles', label: 'page.system.user.header.roles', type: 'roles' },
  { key: 'permissions', label: 'page.system.user.header.permissions', type: 'permissions' },
])

const editFields = computed<FormField[]>(() =>
  addFields.value.map((field) =>
    field.key === 'username' ? { ...field, disabled: true } : field,
  ),
)

function isSelf(row: User): boolean {
  return Boolean(auth.userInfo?.username) && row.username === auth.userInfo?.username
}

function toPayload(values: Record<string, unknown>): UserPayload {
  return {
    name: String(values.name ?? ''),
    username: String(values.username ?? ''),
    email: String(values.email ?? ''),
    phone: String(values.phone ?? ''),
    groupId: String(values.groupId ?? ''),
    roles: Array.isArray(values.roles) ? (values.roles as string[]) : [],
    permissions: Array.isArray(values.permissions) ? (values.permissions as string[]) : [],
  }
}

async function submitAdd(values: Record<string, unknown>) {
  const password = await userApi.createUser(toPayload(values))
  passwordValue.value = password ?? ''
  passwordUsername.value = String(values.username ?? '')
  passwordOpen.value = true
  ui.notify(t('message.success'), 'success')
  refetch()
}

async function openEdit(row: User) {
  try {
    const user = await userApi.getUser(row.id)
    editId.value = row.id
    editValues.value = {
      ...user,
      roles: (user.roles ?? []).map((role) => role.id),
      permissions: user.permissions ?? [],
      groupId: user.groupId || '',
    }
    editOpen.value = true
  } catch {
    // The interceptor reports the failure.
  }
}

async function submitEdit(values: Record<string, unknown>) {
  await userApi.updateUser(editId.value, toPayload(values))
  ui.notify(t('message.success'), 'success')
  refetch()
}

function requestDeleteSafe(rows: User[]) {
  requestDelete(rows)
}

function confirmResetPrompt(row: User) {
  resetTarget.value = row
}

async function confirmReset() {
  if (!resetTarget.value) return
  resetting.value = true
  try {
    const password = await userApi.resetUserPassword(resetTarget.value.id)
    passwordValue.value = password ?? ''
    passwordUsername.value = resetTarget.value.username
    passwordOpen.value = true
    ui.notify(t('table.resetPasswordDone'), 'success')
    resetTarget.value = null
    refetch()
  } catch {
    // The interceptor reports the failure.
  } finally {
    resetting.value = false
  }
}

function onSelection(ids: string[]) {
  const map = new Map<string, User>()
  const walk = (rows: User[]) => {
    for (const row of rows) {
      map.set(row.id, row)
      const children = (row as User & { subRows?: User[] }).subRows
      if (children) walk(children)
    }
  }
  walk(list.value)
  selectedRows.value = ids
    .map((id) => map.get(id))
    .filter((row): row is User => Boolean(row))
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
        <GroupSelect
          :model-value="params.groupId ?? ''"
          clearable
          class="group-filter"
          :label="t('page.system.user.header.groupName')"
          @update:model-value="(value) => updateParams({ groupId: value })"
        />
        <v-text-field
          :model-value="params.keyword ?? ''"
          :placeholder="t('page.system.user.searchPlaceholder')"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          class="keyword-filter"
          @update:model-value="(value) => updateParams({ keyword: value ?? '' })"
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
            @click="requestDeleteSafe(selectedRows)"
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
        <template #cell-name="{ row }">
          <div class="name-cell">
            <v-avatar size="28" color="primary" variant="tonal">
              <span class="text-caption">{{ row.name.slice(0, 1) }}</span>
            </v-avatar>
            <span>{{ row.name }}</span>
          </div>
        </template>
        <template #cell-createTime="{ value }">
          <span class="text-no-wrap">{{ formatDateTime(value as string) }}</span>
        </template>
        <template #cell-status="{ row }">
          <StatusSwitch
            v-if="canAct(currentPath, 'edit')"
            :initial="row.status"
            :disabled="isSelf(row)"
            :subject-name="row.username"
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
              <ActionAuth action="edit">
                <v-list-item
                  prepend-icon="mdi-lock-reset"
                  :title="t('button.reset.password')"
                  @click="confirmResetPrompt(row)"
                />
              </ActionAuth>
              <ActionAuth v-if="!isSelf(row)" action="delete">
                <v-list-item
                  prepend-icon="mdi-delete-outline"
                  :title="t('button.delete')"
                  base-color="error"
                  @click="requestDeleteSafe([row])"
                />
              </ActionAuth>
            </v-list>
          </v-menu>
        </template>
      </ResourceTable>
    </v-card>

    <FormDialog
      v-model="addOpen"
      :title="t('button.add')"
      :fields="addFields"
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
    <ConfirmDialog
      :model-value="Boolean(resetTarget)"
      :title="t('table.resetPasswordTitle')"
      :description="t('table.resetPasswordConfirm', { name: resetTarget?.username ?? '' })"
      :confirm-label="t('button.reset.password')"
      :pending="resetting"
      @update:model-value="(value) => !value && (resetTarget = null)"
      @confirm="confirmReset"
    />
    <PasswordDialog
      v-model="passwordOpen"
      :password="passwordValue"
      :username="passwordUsername"
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

.group-filter {
  width: 230px;
}

.keyword-filter {
  max-width: 320px;
  min-width: 220px;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
