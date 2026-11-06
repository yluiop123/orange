<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageTitle } from '@/composables/usePageTitle'
import MetricCard from '@/components/showcase/MetricCard.vue'
import EchartCard from '@/components/showcase/EchartCard.vue'
import PageHeader from '@/components/PageHeader.vue'
import { lineOption, pieOption } from './chart-options'

const { t } = useI18n()
const title = usePageTitle('page.title.dashboard')

const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']

const attackOption = computed(() =>
  lineOption(
    hours,
    [
      { name: t('demo.metric.attacks'), data: [120, 86, 452, 310, 918, 604, 288] },
      { name: t('demo.metric.traffic'), data: [42, 35, 88, 76, 96, 81, 52] },
    ],
    { area: true },
  ),
)

const threatOption = computed(() =>
  pieOption(
    [
      { name: 'SQLi', value: 34 },
      { name: 'DDoS', value: 26 },
      { name: 'Brute force', value: 21 },
      { name: 'Botnet', value: 19 },
    ],
    { donut: true },
  ),
)

const alerts = computed(() => [
  { ip: '104.21.18.202', action: 'SQLi filter', time: '14:22:10', severity: 'critical' },
  { ip: '185.12.9.14', action: 'Impossible travel', time: '14:21:05', severity: 'high' },
  { ip: '2.56.121.8', action: 'DDoS node', time: '14:20:59', severity: 'critical' },
  { ip: '192.168.1.5', action: 'Brute force', time: '14:18:44', severity: 'medium' },
  { ip: '10.4.8.19', action: 'Port scan', time: '14:11:32', severity: 'low' },
])

const assets = computed(() => [
  { name: 'api-gateway-01', region: 'cn-east-1', status: 'online', score: 98 },
  { name: 'auth-service-02', region: 'cn-east-1', status: 'online', score: 95 },
  { name: 'billing-worker-03', region: 'cn-south-1', status: 'warning', score: 72 },
  { name: 'edge-proxy-07', region: 'cn-north-1', status: 'online', score: 91 },
  { name: 'legacy-report-01', region: 'cn-west-1', status: 'offline', score: 38 },
])

const severityColor: Record<string, string> = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'default',
}

const statusColor: Record<string, string> = {
  online: 'success',
  warning: 'warning',
  offline: 'error',
}
</script>

<template>
  <div class="orange-page">
    <PageHeader :title="title" :subtitle="t('demo.chart.attackTrend')">
      <template #actions>
        <v-chip color="error" variant="tonal" prepend-icon="mdi-shield-alert-outline">
          {{ t('demo.live') }}
        </v-chip>
      </template>
    </PageHeader>

    <div class="orange-grid orange-grid--4">
      <MetricCard :label="t('demo.metric.attacks')" value="24.5k" delta="+18.2%" icon="mdi-shield-off-outline" color="error" />
      <MetricCard :label="t('demo.metric.violations')" value="3" delta="-2" icon="mdi-bug-outline" color="warning" />
      <MetricCard :label="t('demo.metric.traffic')" value="1.2 TB" delta="+6.4%" icon="mdi-swap-horizontal" color="info" />
      <MetricCard :label="t('demo.metric.uptime')" value="99.98%" delta="+0.02%" icon="mdi-heart-pulse" color="success" />
    </div>

    <v-row dense>
      <v-col cols="12" lg="8">
        <EchartCard :title="t('demo.chart.attackTrend')" :option="attackOption" :height="340" />
      </v-col>
      <v-col cols="12" lg="4">
        <EchartCard :title="t('demo.chart.threatTypes')" :option="threatOption" :height="340" />
      </v-col>

      <v-col cols="12" lg="5">
        <v-card variant="flat" class="panel">
          <div class="panel-head">
            <span>{{ t('demo.table.alerts') }}</span>
            <v-chip size="x-small" color="error" variant="tonal">{{ alerts.length }}</v-chip>
          </div>
          <div class="alert-list">
            <div v-for="alert in alerts" :key="alert.ip" class="alert-row">
              <div class="alert-main">
                <code class="mono">{{ alert.ip }}</code>
                <span class="alert-action">{{ alert.action }}</span>
              </div>
              <div class="alert-side">
                <v-chip size="x-small" :color="severityColor[alert.severity]" variant="tonal">
                  {{ t(`demo.severity.${alert.severity}`) }}
                </v-chip>
                <span class="mono alert-time">{{ alert.time }}</span>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="7">
        <v-card variant="flat" class="panel">
          <div class="panel-head">
            <span>{{ t('demo.table.assets') }}</span>
            <v-chip size="x-small" variant="tonal">{{ assets.length }}</v-chip>
          </div>
          <v-table density="compact" class="assets-table">
            <thead>
              <tr>
                <th>{{ t('demo.label.device') }}</th>
                <th>{{ t('demo.label.region') }}</th>
                <th>{{ t('demo.label.status') }}</th>
                <th class="text-end">Score</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="asset in assets" :key="asset.name">
                <td><code class="mono">{{ asset.name }}</code></td>
                <td>{{ asset.region }}</td>
                <td>
                  <v-chip size="x-small" :color="statusColor[asset.status]" variant="tonal">
                    {{ t(`demo.status.${asset.status}`) }}
                  </v-chip>
                </td>
                <td class="text-end">
                  <div class="score">
                    <v-progress-linear
                      :model-value="asset.score"
                      :color="asset.score > 80 ? 'success' : asset.score > 50 ? 'warning' : 'error'"
                      height="6"
                      rounded
                      class="score-bar"
                    />
                    <span class="mono">{{ asset.score }}</span>
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
  border: 1px solid rgb(var(--v-border-color));
  height: 100%;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 650;
  margin-bottom: 8px;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alert-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0 8px 12px;
  border-left: 2px solid rgb(var(--v-theme-primary));
}

.alert-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.alert-action {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.alert-side {
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert-time {
  font-size: 11px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.assets-table {
  background: transparent;
}

.score {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.score-bar {
  max-width: 90px;
}
</style>
