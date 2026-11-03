<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listOperationLogs } from '@/api/operation-log'
import type { OperationLog, OperationLogQuery } from '@/api/types'
import { usePageTitle } from '@/composables/usePageTitle'
import { useResourceList } from '@/composables/useResourceList'
import { formatDateTime } from '@/lib/date-time'
import { useUiStore } from '@/stores/ui'
import type { TableColumn } from '@/components/system/resource-table-types'
import PageHeader from '@/components/PageHeader.vue'
import ResourceTable from '@/components/system/ResourceTable.vue'

type LogParams = OperationLogQuery & { page: number; size: number }

const { t } = useI18n()
const title = usePageTitle('page.title.operationLog')
const ui = useUiStore()

const params = ref<LogParams>({
  page: 1,
  size: 10,
  username: '',
  path: '',
  status: '',
  from: '',
  to: '',
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
  { key: 'createTime', title: t('page.system.operationLog.header.createTime'), width: '170px' },
  { key: 'username', title: t('page.system.operationLog.header.username'), width: '110px' },
  { key: 'method', title: t('page.system.operationLog.header.method'), width: '90px' },
  { key: 'path', title: t('page.system.operationLog.header.path') },
  { key: 'status', title: t('page.system.operationLog.header.status'), width: '90px' },
  { key: 'durationMs', title: t('page.system.operationLog.header.duration'), width: '100px' },
  { key: 'ip', title: t('page.system.operationLog.header.ip'), width: '130px' },
  { key: 'traceId', title: t('page.system.operationLog.header.traceId'), width: '180px' },
])

function update(patch: Partial<LogParams>) {
  params.value = { ...params.value, ...patch, page: 1 }
}

function setPage(page: number) {
  params.value = { ...params.value, page }
}

function setSize(size: number) {
  params.value = { ...params.value, size, page: 1 }
}

function refresh() {
  refetch()
  ui.notify(t('message.success'), 'success')
}
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('page.system.subtitle')" />

    <v-card class="filter-card">
      <div class="filters">
        <v-text-field
          :model-value="params.username ?? ''"
          :label="t('page.system.operationLog.header.username')"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          style="width: 160px"
          @update:model-value="(value) => update({ username: value ?? '' })"
        />
        <v-text-field
          :model-value="params.path ?? ''"
          :label="t('page.system.operationLog.header.path')"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          style="width: 230px"
          @update:model-value="(value) => update({ path: value ?? '' })"
        />
        <v-select
          :model-value="params.status ?? ''"
          :items="statusOptions"
          :label="t('page.system.operationLog.header.status')"
          density="compact"
          variant="outlined"
          hide-details
          style="width: 130px"
          @update:model-value="(value) => update({ status: value ?? '' })"
        />
        <v-text-field
          :model-value="params.from ?? ''"
          :label="t('page.system.operationLog.header.from')"
          type="datetime-local"
          density="compact"
          variant="outlined"
          hide-details
          style="width: 220px"
          @update:model-value="(value) => update({ from: value ?? '' })"
        />
        <v-text-field
          :model-value="params.to ?? ''"
          :label="t('page.system.operationLog.header.to')"
          type="datetime-local"
          density="compact"
          variant="outlined"
          hide-details
          style="width: 220px"
          @update:model-value="(value) => update({ to: value ?? '' })"
        />
        <v-btn variant="outlined" prepend-icon="mdi-refresh" @click="refresh">
          {{ t('button.refresh') }}
        </v-btn>
      </div>
    </v-card>

    <v-card>
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
        @update:size="setSize"
        @retry="refetch"
      >
        <template #cell-createTime="{ value }">
          <span class="text-no-wrap">{{ formatDateTime(value as string) }}</span>
        </template>
        <template #cell-method="{ value }">
          <code class="mono">{{ value }}</code>
        </template>
        <template #cell-path="{ value }">
          <code class="mono path-cell">{{ value }}</code>
        </template>
        <template #cell-status="{ value }">
          <v-chip size="small" :color="Number(value) >= 400 ? 'error' : 'success'" variant="tonal">
            {{ value }}
          </v-chip>
        </template>
        <template #cell-durationMs="{ value }">
          <span class="mono">{{ value }} ms</span>
        </template>
        <template #cell-traceId="{ value }">
          <code class="mono trace-cell" :title="String(value)">{{ value }}</code>
        </template>
        <template #actions="{ row }">
          <v-btn size="small" variant="text" prepend-icon="mdi-eye-outline" @click="detail = row">
            {{ t('button.detail') }}
          </v-btn>
        </template>
      </ResourceTable>
    </v-card>

    <v-dialog :model-value="Boolean(detail)" max-width="760" @update:model-value="(value) => !value && (detail = null)">
      <v-card>
        <v-card-title>{{ t('button.detail') }}</v-card-title>
        <v-card-subtitle class="mono">
          {{ detail?.method }} {{ detail?.path }}
        </v-card-subtitle>
        <v-card-text>
          <dl class="detail-grid">
            <div>
              <dt>{{ t('page.system.operationLog.header.traceId') }}</dt>
              <dd class="mono">{{ detail?.traceId || '—' }}</dd>
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
            <div class="detail-full">
              <dt>{{ t('page.system.operationLog.queryString') }}</dt>
              <dd class="mono code-block">{{ detail?.queryString || '—' }}</dd>
            </div>
            <div class="detail-full">
              <dt>{{ t('page.system.operationLog.requestBody') }}</dt>
              <dd class="mono code-block">{{ detail?.requestBody || '—' }}</dd>
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

.path-cell {
  display: inline-block;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.trace-cell {
  display: inline-block;
  max-width: 165px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.detail-grid dt {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 3px;
}

.detail-grid dd {
  margin: 0;
  font-size: 13px;
}

.detail-full {
  grid-column: span 2;
}

.code-block {
  max-height: 220px;
  overflow: auto;
  background: rgb(var(--v-theme-surface-variant));
  padding: 10px;
  border-radius: 8px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
