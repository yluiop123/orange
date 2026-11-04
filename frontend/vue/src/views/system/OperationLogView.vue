<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listOperationLogs } from '@/api/operation-log'
import type { OperationLog, OperationLogQuery } from '@/api/types'
import { useResourceList } from '@/composables/useResourceList'
import { formatDateTime } from '@/lib/date-time'
import { useUiStore } from '@/stores/ui'
import type { TableColumn } from '@/components/system/resource-table-types'
import ResourceTable from '@/components/system/ResourceTable.vue'
import DateTimeRangePicker from '@/components/system/DateTimeRangePicker.vue'

type LogParams = OperationLogQuery & { page: number; size: number }

function pad(value: number) {
  return String(value).padStart(2, '0')
}

/** Default query range: today 00:00 – 23:59, same as the React page. */
function todayRange() {
  const today = new Date()
  const day = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
  return { from: `${day}T00:00`, to: `${day}T23:59` }
}

const { t } = useI18n()
const ui = useUiStore()

const params = ref<LogParams>({
  page: 1,
  size: 10,
  username: '',
  path: '',
  status: '',
  ...todayRange(),
})

const detail = ref<OperationLog | null>(null)

function toIso(value: string | undefined): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

const { list, total, loading, error, refetch } = useResourceList<LogParams, OperationLog>({
  params,
  errorMessage: t('table.loadError'),
  fetcher: (query, signal) =>
    listOperationLogs(
      {
        page: query.page,
        size: query.size,
        username: query.username || undefined,
        path: query.path || undefined,
        status: query.status || undefined,
        from: toIso(query.from),
        to: toIso(query.to),
      },
      signal,
    ),
})

const statusOptions = computed(() => [
  { title: t('dict.status.all'), value: '' },
  ...['200', '201', '400', '401', '403', '404', '409', '500'].map((value) => ({
    title: value,
    value,
  })),
])

const columns = computed<TableColumn[]>(() => [
  { key: 'createTime', title: t('page.system.operationLog.header.createTime') },
  { key: 'username', title: t('page.system.operationLog.header.username') },
  { key: 'method', title: t('page.system.operationLog.header.method') },
  { key: 'path', title: t('page.system.operationLog.header.path') },
  { key: 'status', title: t('page.system.operationLog.header.status') },
  { key: 'durationMs', title: t('page.system.operationLog.header.duration') },
  { key: 'ip', title: t('page.system.operationLog.header.ip') },
  { key: 'traceId', title: t('page.system.operationLog.header.traceId') },
])

function update(patch: Partial<LogParams>) {
  params.value = { ...params.value, ...patch, page: 1 }
}

function setPage(page: number) {
  params.value = { ...params.value, page }
}

function refresh() {
  refetch()
  ui.notify(t('message.success'), 'success')
}
</script>

<template>
  <div class="system-page">
    <ResourceTable
      :rows="list"
      :columns="columns"
      :row-key="(row) => String(row.id)"
      :total="total"
      :page="params.page"
      :size="params.size"
      :loading="loading"
      :error="error"
      @update:page="setPage"
      @retry="refetch"
    >
      <template #toolbar>
        <label class="system-label" for="log-filter-username">
          {{ t('page.system.operationLog.header.username') }}
        </label>
        <v-text-field
          id="log-filter-username"
          :model-value="params.username ?? ''"
          density="compact"
          variant="outlined"
          hide-details
          class="system-input--username"
          @update:model-value="(value) => update({ username: value ?? '' })"
        />
        <label class="system-label" for="log-filter-path">
          {{ t('page.system.operationLog.header.path') }}
        </label>
        <v-text-field
          id="log-filter-path"
          :model-value="params.path ?? ''"
          density="compact"
          variant="outlined"
          hide-details
          class="system-input--path"
          @update:model-value="(value) => update({ path: value ?? '' })"
        />
        <label class="system-label">{{ t('page.system.operationLog.header.status') }}</label>
        <v-select
          :model-value="params.status ?? ''"
          :items="statusOptions"
          density="compact"
          variant="outlined"
          hide-details
          class="system-input--sm"
          @update:model-value="(value) => update({ status: value ?? '' })"
        />
        <DateTimeRangePicker
          :model-value="{ from: params.from ?? '', to: params.to ?? '' }"
          @update:model-value="(range) => update({ from: range.from, to: range.to })"
        />
        <div class="system-toolbar__actions">
          <v-btn variant="outlined" @click="refresh">
            {{ t('button.refresh') }}
          </v-btn>
        </div>
      </template>

      <template #cell-createTime="{ value }">
        <span>{{ formatDateTime(value as string) }}</span>
      </template>
      <template #cell-method="{ value }">
        <span class="mono">{{ value }}</span>
      </template>
      <template #cell-path="{ value }">
        <span class="mono system-cell--path" :title="String(value)">{{ value }}</span>
      </template>
      <template #cell-status="{ value }">
        <span :class="{ 'system-cell--error': Number(value) >= 400 }">{{ value }}</span>
      </template>
      <template #cell-durationMs="{ value }">
        <span>{{ value }} ms</span>
      </template>
      <template #cell-traceId="{ value }">
        <span class="mono system-cell--truncate" :title="String(value)">{{ value }}</span>
      </template>
      <template #actions="{ row }">
        <v-menu location="bottom end">
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
            <v-list-item :title="t('button.detail')" @click="detail = row" />
          </v-list>
        </v-menu>
      </template>
    </ResourceTable>

    <v-dialog
      :model-value="Boolean(detail)"
      max-width="672"
      @update:model-value="(value) => !value && (detail = null)"
    >
      <v-card>
        <v-card-title>{{ t('button.detail') }}</v-card-title>
        <v-card-subtitle class="mono">{{ detail?.method }} {{ detail?.path }}</v-card-subtitle>
        <v-card-text>
          <dl class="system-detail-grid">
            <div>
              <dt>{{ t('page.system.operationLog.header.traceId') }}</dt>
              <dd class="mono">{{ detail?.traceId || '-' }}</dd>
            </div>
            <div>
              <dt>{{ t('page.system.operationLog.header.createTime') }}</dt>
              <dd>{{ formatDateTime(detail?.createTime) }}</dd>
            </div>
            <div>
              <dt>{{ t('page.system.operationLog.header.status') }}</dt>
              <dd>{{ detail?.status }}</dd>
            </div>
            <div>
              <dt>{{ t('page.system.operationLog.header.ip') }}</dt>
              <dd class="mono">{{ detail?.ip }}</dd>
            </div>
            <div>
              <dt>{{ t('page.system.operationLog.queryString') }}</dt>
              <dd class="system-code-block">{{ detail?.queryString || '-' }}</dd>
            </div>
            <div>
              <dt>{{ t('page.system.operationLog.requestBody') }}</dt>
              <dd class="system-code-block">{{ detail?.requestBody || '-' }}</dd>
            </div>
          </dl>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="detail = null">{{ t('button.close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
