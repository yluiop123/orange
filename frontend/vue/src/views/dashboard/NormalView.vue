<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageTitle } from '@/composables/usePageTitle'
import MetricCard from '@/components/showcase/MetricCard.vue'
import EchartCard from '@/components/showcase/EchartCard.vue'
import PageHeader from '@/components/PageHeader.vue'
import { barOption, lineOption, pieOption } from './chart-options'

const { t } = useI18n()
const title = usePageTitle('page.title.dashboard')

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const trafficOption = computed(() =>
  lineOption(
    days,
    [
      { name: t('demo.metric.visitors'), data: [3120, 3680, 4010, 3890, 4620, 5480, 5120] },
      { name: t('demo.metric.sessions'), data: [2210, 2560, 2890, 2740, 3320, 3980, 3710] },
    ],
    { area: true },
  ),
)

const channelOption = computed(() =>
  pieOption(
    [
      { name: t('demo.channel.direct'), value: 38 },
      { name: t('demo.channel.search'), value: 27 },
      { name: t('demo.channel.social'), value: 21 },
      { name: t('demo.channel.email'), value: 14 },
    ],
    { donut: true },
  ),
)

const salesOption = computed(() =>
  barOption(
    ['East', 'South', 'North', 'West', 'Central'],
    [
      { name: t('demo.metric.revenue'), data: [820, 640, 510, 430, 720] },
      { name: t('demo.metric.orders'), data: [420, 360, 290, 210, 380] },
    ],
  ),
)

const orders = computed(() => [
  { id: 'OR-26031', customer: '星河科技', amount: '¥ 28,400', channel: 'Direct', status: 'paid' },
  { id: 'OR-26030', customer: '云岚设计', amount: '¥ 12,980', channel: 'Search', status: 'paid' },
  { id: 'OR-26029', customer: '北辰物流', amount: '¥ 46,200', channel: 'Partner', status: 'pending' },
  { id: 'OR-26028', customer: '海岳能源', amount: '¥ 88,600', channel: 'Direct', status: 'paid' },
  { id: 'OR-26027', customer: '青禾农业', amount: '¥ 9,800', channel: 'Social', status: 'refunded' },
])
</script>

<template>
  <div class="orange-page">
    <PageHeader :title="title" :subtitle="t('demo.updated')">
      <template #actions>
        <v-chip color="success" variant="tonal" prepend-icon="mdi-radar">
          {{ t('demo.live') }}
        </v-chip>
      </template>
    </PageHeader>

    <div class="orange-grid orange-grid--4">
      <MetricCard
        :label="t('demo.metric.revenue')"
        value="¥ 2,486,300"
        :delta="t('demo.delta.up', { value: 12.4 })"
        icon="mdi-currency-cny"
        color="primary"
      />
      <MetricCard
        :label="t('demo.metric.orders')"
        value="8,412"
        :delta="t('demo.delta.up', { value: 4.8 })"
        icon="mdi-cart-outline"
        color="info"
      />
      <MetricCard
        :label="t('demo.metric.customers')"
        value="24,918"
        :delta="t('demo.delta.up', { value: 8.1 })"
        icon="mdi-account-group-outline"
        color="success"
      />
      <MetricCard
        :label="t('demo.metric.conversion')"
        value="4.62%"
        :delta="t('demo.delta.down', { value: 0.6 })"
        icon="mdi-percent-outline"
        color="warning"
      />
    </div>

    <v-row dense>
      <v-col cols="12" lg="8">
        <EchartCard :title="t('demo.chart.trafficTrend')" :option="trafficOption" :height="340" />
      </v-col>
      <v-col cols="12" lg="4">
        <EchartCard :title="t('demo.chart.channelShare')" :option="channelOption" :height="340" />
      </v-col>
      <v-col cols="12" lg="7">
        <EchartCard :title="t('demo.chart.salesRegion')" :option="salesOption" :height="320" />
      </v-col>
      <v-col cols="12" lg="5">
        <v-card variant="flat" class="chart-card">
          <div class="card-head">
            <span class="card-title">{{ t('demo.table.recentOrders') }}</span>
            <v-chip size="x-small" variant="tonal">{{ orders.length }}</v-chip>
          </div>
          <v-table density="compact" class="orders-table">
            <thead>
              <tr>
                <th>{{ t('demo.label.order') }}</th>
                <th>{{ t('demo.label.customer') }}</th>
                <th class="text-end">{{ t('demo.label.amount') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in orders" :key="order.id">
                <td><code class="mono">{{ order.id }}</code></td>
                <td>{{ order.customer }}</td>
                <td class="text-end">{{ order.amount }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.chart-card {
  padding: 14px 16px;
  border: 1px solid rgb(var(--v-border-color));
  height: 100%;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.card-title {
  font-size: 14px;
  font-weight: 650;
}

.orders-table {
  background: transparent;
}
</style>
