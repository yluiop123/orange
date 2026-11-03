<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageTitle } from '@/composables/usePageTitle'
import MetricCard from '@/components/demo/MetricCard.vue'
import EchartCard from '@/components/demo/EchartCard.vue'
import PageHeader from '@/components/PageHeader.vue'
import { gaugeOption, lineOption } from './chart-options'

const { t } = useI18n()
const title = usePageTitle('page.title.dashboard')

const hours = ['06', '08', '10', '12', '14', '16', '18', '20']

const outputOption = computed(() =>
  lineOption(
    hours,
    [
      { name: t('demo.metric.output'), data: [420, 460, 512, 498, 540, 566, 548, 520] },
      { name: t('demo.metric.energy'), data: [310, 325, 360, 348, 372, 390, 381, 356] },
    ],
    { area: true },
  ),
)

const oeeOption = computed(() => gaugeOption(86.4, t('demo.metric.oee')))

const equipment = computed(() => [
  { id: 'CNC-01', line: 'Line A', status: 'running', load: 82 },
  { id: 'CNC-02', line: 'Line A', status: 'running', load: 74 },
  { id: 'ROB-07', line: 'Line B', status: 'warning', load: 58 },
  { id: 'PRS-03', line: 'Line B', status: 'idle', load: 21 },
  { id: 'PACK-09', line: 'Line C', status: 'stopped', load: 0 },
])

const statusColor: Record<string, string> = {
  running: 'success',
  warning: 'warning',
  idle: 'info',
  stopped: 'error',
}
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('demo.chart.production')">
      <template #actions>
        <v-chip color="success" variant="tonal" prepend-icon="mdi-factory">
          {{ t('demo.live') }}
        </v-chip>
      </template>
    </PageHeader>

    <div class="demo-grid demo-grid--4">
      <MetricCard :label="t('demo.metric.output')" value="12,480" delta="+4.2%" icon="mdi-package-variant-closed" color="primary" />
      <MetricCard :label="t('demo.metric.oee')" value="86.4%" delta="+1.8%" icon="mdi-gauge" color="success" />
      <MetricCard :label="t('demo.metric.downtime')" value="42 min" delta="-18 min" icon="mdi-timer-off-outline" color="warning" />
      <MetricCard :label="t('demo.metric.energy')" value="3.2 MWh" delta="-2.4%" icon="mdi-lightning-bolt-outline" color="info" />
    </div>

    <v-row dense>
      <v-col cols="12" lg="8">
        <EchartCard :title="t('demo.chart.production')" :option="outputOption" :height="330" />
      </v-col>
      <v-col cols="12" lg="4">
        <EchartCard :title="t('demo.metric.oee')" :option="oeeOption" :height="330" />
      </v-col>
      <v-col cols="12">
        <v-card variant="flat" class="panel">
          <div class="panel-head">
            <span>{{ t('demo.table.equipment') }}</span>
            <v-chip size="x-small" variant="tonal">{{ equipment.length }}</v-chip>
          </div>
          <v-table density="comfortable" class="plain-table">
            <thead>
              <tr>
                <th>{{ t('demo.label.device') }}</th>
                <th>Line</th>
                <th>{{ t('demo.label.status') }}</th>
                <th>{{ t('demo.chart.equipment') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in equipment" :key="item.id">
                <td><code class="mono">{{ item.id }}</code></td>
                <td>{{ item.line }}</td>
                <td>
                  <v-chip size="x-small" :color="statusColor[item.status]" variant="tonal">
                    {{ t(`demo.status.${item.status}`) }}
                  </v-chip>
                </td>
                <td>
                  <div class="load">
                    <v-progress-linear
                      :model-value="item.load"
                      :color="statusColor[item.status]"
                      height="6"
                      rounded
                    />
                    <span class="mono">{{ item.load }}%</span>
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

.load {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 160px;
}
</style>
