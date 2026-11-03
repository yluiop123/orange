<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageTitle } from '@/composables/usePageTitle'
import MetricCard from '@/components/demo/MetricCard.vue'
import EchartCard from '@/components/demo/EchartCard.vue'
import PageHeader from '@/components/PageHeader.vue'
import { barOption, lineOption } from './chart-options'

const { t } = useI18n()
const title = usePageTitle('page.title.dashboard')

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const trendOption = computed(() =>
  lineOption(
    days,
    [
      { name: t('demo.metric.incidents'), data: [18, 24, 12, 31, 22, 16, 9] },
      { name: t('demo.metric.resources'), data: [42, 55, 38, 68, 61, 47, 33] },
    ],
    { area: true },
  ),
)

const resourceOption = computed(() =>
  barOption(
    ['Rescue', 'Medical', 'Power', 'Water', 'Shelter'],
    [{ name: t('demo.metric.resources'), data: [86, 64, 72, 48, 91] }],
    { horizontal: true },
  ),
)

const incidents = computed(() => [
  { id: 'INC-8821', region: '滨江新区', severity: 'critical', progress: 72, owner: '消防一支队' },
  { id: 'INC-8820', region: '城北水库', severity: 'high', progress: 54, owner: '水利调度' },
  { id: 'INC-8819', region: '东港码头', severity: 'medium', progress: 88, owner: '港务集团' },
  { id: 'INC-8818', region: '南山隧道', severity: 'high', progress: 36, owner: '交通应急' },
  { id: 'INC-8817', region: '西郊变电站', severity: 'low', progress: 95, owner: '供电公司' },
])

const severityColor: Record<string, string> = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'success',
}
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('demo.chart.incidentTrend')">
      <template #actions>
        <v-chip color="error" variant="tonal" prepend-icon="mdi-alert-octagon-outline">
          Level II
        </v-chip>
        <v-chip color="success" variant="tonal" prepend-icon="mdi-access-point">{{ t('demo.live') }}</v-chip>
      </template>
    </PageHeader>

    <div class="demo-grid demo-grid--4">
      <MetricCard :label="t('demo.metric.incidents')" value="142" delta="+8" icon="mdi-alert-outline" color="error" />
      <MetricCard :label="t('demo.metric.response')" value="6m 04s" delta="-52s" icon="mdi-timer-sand" color="warning" />
      <MetricCard :label="t('demo.metric.resources')" value="386" delta="+42" icon="mdi-truck-fast-outline" color="info" />
      <MetricCard :label="t('demo.metric.uptime')" value="98.4%" delta="+0.4%" icon="mdi-broadcast" color="success" />
    </div>

    <v-row dense>
      <v-col cols="12" lg="8">
        <EchartCard :title="t('demo.chart.incidentTrend')" :option="trendOption" :height="330" />
      </v-col>
      <v-col cols="12" lg="4">
        <EchartCard :title="t('demo.chart.resourceUse')" :option="resourceOption" :height="330" />
      </v-col>
      <v-col cols="12">
        <v-card variant="flat" class="panel">
          <div class="panel-head">
            <span>{{ t('demo.table.incidents') }}</span>
            <v-chip size="x-small" variant="tonal">{{ incidents.length }}</v-chip>
          </div>
          <v-table density="comfortable" class="plain-table">
            <thead>
              <tr>
                <th>{{ t('demo.label.order') }}</th>
                <th>{{ t('demo.label.region') }}</th>
                <th>{{ t('demo.label.severity') }}</th>
                <th>{{ t('demo.label.owner') }}</th>
                <th>{{ t('demo.label.progress') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="incident in incidents" :key="incident.id">
                <td><code class="mono">{{ incident.id }}</code></td>
                <td>{{ incident.region }}</td>
                <td>
                  <v-chip size="x-small" :color="severityColor[incident.severity]" variant="tonal">
                    {{ t(`demo.severity.${incident.severity}`) }}
                  </v-chip>
                </td>
                <td>{{ incident.owner }}</td>
                <td>
                  <div class="progress-cell">
                    <v-progress-linear
                      :model-value="incident.progress"
                      :color="severityColor[incident.severity]"
                      height="6"
                      rounded
                    />
                    <span class="mono">{{ incident.progress }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.panel {
  padding: 14px 16px;
  border: 1px solid rgba(var(--v-border-color), 0.6);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 650;
  margin-bottom: 8px;
}

.plain-table {
  background: transparent;
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 160px;
}
</style>
