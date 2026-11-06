<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EChartsOption } from 'echarts'
import { usePageTitle } from '@/composables/usePageTitle'
import MetricCard from '@/components/showcase/MetricCard.vue'
import EchartCard from '@/components/showcase/EchartCard.vue'
import PageHeader from '@/components/PageHeader.vue'
import { radarOption } from './chart-options'

const { t } = useI18n()
const title = usePageTitle('page.title.dashboard')

const readinessOption = computed(() =>
  radarOption(
    [
      { name: 'Air', max: 100 },
      { name: 'Sea', max: 100 },
      { name: 'Land', max: 100 },
      { name: 'Cyber', max: 100 },
      { name: 'Logistics', max: 100 },
      { name: 'Intel', max: 100 },
    ],
    [86, 72, 91, 68, 77, 84],
    t('demo.chart.forceReadiness'),
  ),
)

const sweepOption = computed<EChartsOption>(() => ({
  grid: { left: 8, right: 8, top: 8, bottom: 8 },
  xAxis: { show: false, min: 0, max: 100 },
  yAxis: { show: false, min: 0, max: 100 },
  series: [
    {
      type: 'scatter',
      symbolSize: 10,
      itemStyle: { color: '#38bdf8', opacity: 0.85 },
      data: [
        [28, 62], [35, 55], [48, 74], [58, 46], [66, 66], [75, 38], [82, 58], [42, 32],
      ],
    },
    {
      type: 'effectScatter',
      rippleEffect: { scale: 3, brushType: 'stroke' },
      symbolSize: 14,
      itemStyle: { color: '#fb923c' },
      data: [[52, 52], [70, 30]],
    },
  ],
}))

const missions = computed(() => [
  { code: 'M-2041', target: 'Coastal patrol', progress: 78, severity: 'high' },
  { code: 'M-2040', target: 'Signal relay', progress: 54, severity: 'medium' },
  { code: 'M-2039', target: 'Logistics convoy', progress: 92, severity: 'low' },
  { code: 'M-2038', target: 'Cyber drill', progress: 38, severity: 'critical' },
  { code: 'M-2037', target: 'Recon sweep', progress: 66, severity: 'medium' },
])

const severityColor: Record<string, string> = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'success',
}
</script>

<template>
  <div class="orange-page military">
    <PageHeader :title="title" :subtitle="t('demo.chart.radarSweep')">
      <template #actions>
        <v-chip color="warning" variant="tonal" prepend-icon="mdi-alert-decagram-outline">
          DEFCON 4
        </v-chip>
        <v-chip color="error" variant="tonal" prepend-icon="mdi-access-point">
          {{ t('demo.live') }}
        </v-chip>
      </template>
    </PageHeader>

    <div class="orange-grid orange-grid--4">
      <MetricCard :label="t('demo.metric.assets')" value="1,284" delta="+24" icon="mdi-satellite-variant" color="info" />
      <MetricCard :label="t('demo.metric.attacks')" value="37" delta="-12" icon="mdi-target" color="error" />
      <MetricCard :label="t('demo.metric.response')" value="4m 12s" delta="-38s" icon="mdi-timer-outline" color="warning" />
      <MetricCard :label="t('demo.metric.uptime')" value="99.7%" delta="+0.1%" icon="mdi-shield-check-outline" color="success" />
    </div>

    <div class="command-grid">
      <v-card variant="flat" class="command-panel">
        <div class="command-head">
          <span>{{ t('demo.chart.forceReadiness') }}</span>
          <span class="mono command-tag">GRID-7 / ACTIVE</span>
        </div>
        <div class="command-charts">
          <EchartCard :option="readinessOption" :height="290" force-dark />
          <EchartCard :title="t('demo.chart.radarSweep')" :option="sweepOption" :height="290" force-dark />
        </div>
      </v-card>

      <v-card variant="flat" class="command-panel mission-panel">
        <div class="command-head">
          <span>{{ t('demo.chart.missionStatus') }}</span>
          <span class="mono command-tag">{{ missions.length }} TRACKS</span>
        </div>
        <div class="mission-list">
          <div v-for="mission in missions" :key="mission.code" class="mission">
            <div class="mission-top">
              <code class="mono">{{ mission.code }}</code>
              <span class="mission-target">{{ mission.target }}</span>
              <v-chip size="x-small" :color="severityColor[mission.severity]" variant="tonal">
                {{ t(`demo.severity.${mission.severity}`) }}
              </v-chip>
            </div>
            <v-progress-linear
              :model-value="mission.progress"
              :color="severityColor[mission.severity]"
              height="5"
              rounded
            />
          </div>
        </div>
        <div class="command-foot">
          <span class="dot" /> AIS · SATCOM · SIGINT connected
        </div>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.military {
  color: rgb(var(--v-theme-on-surface));
}

.command-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 16px;
}

.command-panel {
  background:
    linear-gradient(180deg, rgba(2, 6, 23, 0.98), rgba(15, 23, 42, 0.98)),
    repeating-linear-gradient(0deg, transparent 0 23px, rgba(56, 189, 248, 0.12) 24px),
    repeating-linear-gradient(90deg, transparent 0 23px, rgba(56, 189, 248, 0.12) 24px);
  border: 1px solid rgba(56, 189, 248, 0.25);
  color: #e2e8f0;
  padding: 14px 16px;
  overflow: hidden;
}

.command-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 650;
  letter-spacing: 0.04em;
  color: #7dd3fc;
  margin-bottom: 6px;
}

.command-tag {
  font-size: 10px;
  color: #38bdf8;
  opacity: 0.85;
  letter-spacing: 0.12em;
}

.command-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.command-charts :deep(.chart-card) {
  background: transparent;
  border-color: rgba(56, 189, 248, 0.18);
}

.command-charts :deep(.chart-title) {
  color: #bae6fd;
}

.mission-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 10px;
}

.mission-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
  font-size: 12px;
}

.mission-target {
  flex: 1;
  color: #cbd5e1;
}

.command-foot {
  margin-top: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #7dd3fc;
  letter-spacing: 0.06em;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 12px #22c55e;
}

@media (max-width: 1100px) {
  .command-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .command-charts {
    grid-template-columns: 1fr;
  }
}
</style>
