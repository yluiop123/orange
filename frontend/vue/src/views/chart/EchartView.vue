<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EChartsOption } from 'echarts'
import { usePageTitle } from '@/composables/usePageTitle'
import EchartCard from '@/components/demo/EchartCard.vue'
import PageHeader from '@/components/PageHeader.vue'
import { barOption, gaugeOption, lineOption, pieOption, radarOption } from '../dashboard/chart-options'

const { t } = useI18n()
const title = usePageTitle('page.title.chart')

const categories = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const line = computed(() =>
  lineOption(
    categories,
    [
      { name: 'Desktop', data: [820, 932, 901, 934, 1290, 1330, 1320] },
      { name: 'Mobile', data: [620, 732, 701, 734, 1090, 1130, 1120] },
    ],
    { area: true },
  ),
)

const bar = computed(() =>
  barOption(categories, [
    { name: 'Orders', data: [120, 200, 150, 80, 70, 110, 130] },
    { name: 'Refunds', data: [20, 32, 18, 12, 9, 15, 11] },
  ]),
)

const pie = computed(() =>
  pieOption([
    { name: 'Search', value: 1048 },
    { name: 'Direct', value: 735 },
    { name: 'Email', value: 580 },
    { name: 'Union Ads', value: 484 },
    { name: 'Video Ads', value: 300 },
  ]),
)

const radar = computed(() =>
  radarOption(
    [
      { name: 'AQI', max: 100 },
      { name: 'PM2.5', max: 100 },
      { name: 'PM10', max: 100 },
      { name: 'SO₂', max: 100 },
      { name: 'NO₂', max: 100 },
      { name: 'CO', max: 100 },
    ],
    [82, 68, 74, 56, 63, 71],
    'Air quality',
  ),
)

const gauge = computed(() => gaugeOption(72, t('chart.gauge')))

const scatter = computed<EChartsOption>(() => ({
  grid: { left: 44, right: 20, top: 24, bottom: 30 },
  tooltip: { trigger: 'item' },
  xAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(128,128,140,0.18)' } } },
  yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(128,128,140,0.18)' } } },
  series: [
    {
      type: 'scatter',
      symbolSize: (value: unknown) => {
        const pair = value as [number, number]
        return Math.max(8, pair[1] * 2)
      },
      itemStyle: { color: '#8b5cf6', opacity: 0.7 },
      data: [
        [10, 8], [18, 15], [24, 12], [32, 22], [38, 18], [45, 30], [52, 26], [60, 38],
        [66, 32], [74, 44], [82, 40], [90, 52],
      ],
    },
  ],
}))
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('page.chart.echart')" />

    <div class="demo-grid demo-grid--2">
      <EchartCard :title="t('chart.line')" :option="line" :height="320" />
      <EchartCard :title="t('chart.bar')" :option="bar" :height="320" />
      <EchartCard :title="t('chart.pie')" :option="pie" :height="320" />
      <EchartCard :title="t('chart.radar')" :option="radar" :height="320" />
      <EchartCard :title="t('chart.gauge')" :option="gauge" :height="320" />
      <EchartCard :title="t('chart.scatter')" :option="scatter" :height="320" />
    </div>
  </div>
</template>
