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

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const moistureOption = computed(() =>
  lineOption(
    days,
    [
      { name: 'A-01', data: [62, 58, 64, 61, 57, 66, 63] },
      { name: 'B-04', data: [48, 52, 46, 44, 51, 55, 53] },
      { name: 'C-02', data: [71, 69, 72, 68, 70, 74, 73] },
    ],
    { area: false },
  ),
)

const cropOption = computed(() =>
  pieOption([
    { name: 'Rice', value: 38 },
    { name: 'Wheat', value: 26 },
    { name: 'Corn', value: 19 },
    { name: 'Orchard', value: 17 },
  ]),
)

const parcels = computed(() => [
  { id: 'A-01', crop: 'Rice', area: '128 ha', status: 'online', moisture: 63 },
  { id: 'B-04', crop: 'Wheat', area: '96 ha', status: 'warning', moisture: 51 },
  { id: 'C-02', crop: 'Corn', area: '212 ha', status: 'online', moisture: 73 },
  { id: 'D-07', crop: 'Orchard', area: '64 ha', status: 'online', moisture: 58 },
  { id: 'E-11', crop: 'Rice', area: '150 ha', status: 'offline', moisture: 39 },
])

const statusColor: Record<string, string> = {
  online: 'success',
  warning: 'warning',
  offline: 'error',
}
</script>

<template>
  <div class="orange-page">
    <PageHeader :title="title" :subtitle="t('demo.chart.soilMoisture')">
      <template #actions>
        <v-chip color="success" variant="tonal" prepend-icon="mdi-sprout-outline">
          {{ t('demo.live') }}
        </v-chip>
      </template>
    </PageHeader>

    <div class="orange-grid orange-grid--4">
      <MetricCard :label="t('demo.metric.temperature')" value="24.8 °C" delta="+1.2" icon="mdi-thermometer" color="warning" />
      <MetricCard :label="t('demo.metric.humidity')" value="63%" delta="-4%" icon="mdi-water-percent" color="info" />
      <MetricCard :label="t('demo.metric.plots')" value="86" delta="+3" icon="mdi-terrain" color="success" />
      <MetricCard :label="t('demo.metric.harvest')" value="12.4k t" delta="+6.8%" icon="mdi-basket-outline" color="primary" />
    </div>

    <v-row dense>
      <v-col cols="12" lg="8">
        <EchartCard :title="t('demo.chart.soilMoisture')" :option="moistureOption" :height="330" />
      </v-col>
      <v-col cols="12" lg="4">
        <EchartCard :title="t('demo.chart.cropShare')" :option="cropOption" :height="330" />
      </v-col>
      <v-col cols="12">
        <v-card variant="flat" class="panel">
          <div class="panel-head">
            <span>{{ t('demo.table.parcels') }}</span>
            <v-chip size="x-small" variant="tonal">{{ parcels.length }}</v-chip>
          </div>
          <v-table density="comfortable" class="plain-table">
            <thead>
              <tr>
                <th>{{ t('demo.label.device') }}</th>
                <th>{{ t('demo.label.crop') }}</th>
                <th>{{ t('demo.label.area') }}</th>
                <th>{{ t('demo.label.status') }}</th>
                <th>{{ t('demo.chart.soilMoisture') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="parcel in parcels" :key="parcel.id">
                <td><code class="mono">{{ parcel.id }}</code></td>
                <td>{{ parcel.crop }}</td>
                <td>{{ parcel.area }}</td>
                <td>
                  <v-chip size="x-small" :color="statusColor[parcel.status]" variant="tonal">
                    {{ t(`demo.status.${parcel.status}`) }}
                  </v-chip>
                </td>
                <td>
                  <div class="moisture">
                    <v-progress-linear
                      :model-value="parcel.moisture"
                      :color="parcel.moisture > 55 ? 'success' : 'warning'"
                      height="6"
                      rounded
                    />
                    <span class="mono">{{ parcel.moisture }}%</span>
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

.moisture {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 160px;
}
</style>
