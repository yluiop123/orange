<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EChartsOption } from 'echarts'
import { usePageTitle } from '@/composables/usePageTitle'
import EchartCard from '@/components/showcase/EchartCard.vue'
import PageHeader from '@/components/PageHeader.vue'

const { t } = useI18n()
const title = usePageTitle('page.title.chart')

const palette = ['#5b8ff9', '#5ad8a6', '#5d7092', '#f6bd16', '#e8684a', '#6dc8ec']

const column = computed<EChartsOption>(() => ({
  color: palette,
  tooltip: { trigger: 'axis' },
  legend: { top: 0, right: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
  grid: { left: 44, right: 20, top: 36, bottom: 28 },
  xAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4'], axisTick: { show: false } },
  yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(128,128,140,0.18)' } } },
  series: [
    {
      name: '2025',
      type: 'bar',
      barWidth: 18,
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      data: [320, 412, 380, 460],
    },
    {
      name: '2026',
      type: 'bar',
      barWidth: 18,
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      data: [360, 468, 420, 512],
    },
  ],
}))

const rose = computed<EChartsOption>(() => ({
  color: palette,
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
  series: [
    {
      type: 'pie',
      radius: ['26%', '66%'],
      center: ['50%', '46%'],
      roseType: 'radius',
      itemStyle: { borderRadius: 6, borderColor: 'transparent', borderWidth: 2 },
      label: { formatter: '{b}\n{d}%' },
      data: [
        { name: 'Search', value: 40 },
        { name: 'Direct', value: 32 },
        { name: 'Email', value: 24 },
        { name: 'Social', value: 18 },
        { name: 'Referral', value: 14 },
      ],
    },
  ],
}))

const dual = computed<EChartsOption>(() => ({
  color: palette,
  tooltip: { trigger: 'axis' },
  legend: { top: 0, right: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
  grid: { left: 44, right: 44, top: 36, bottom: 28 },
  xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], axisTick: { show: false } },
  yAxis: [
    { type: 'value', name: 'Revenue', splitLine: { lineStyle: { color: 'rgba(128,128,140,0.18)' } } },
    { type: 'value', name: 'Rate', splitLine: { show: false } },
  ],
  series: [
    { name: 'Revenue', type: 'bar', barWidth: 18, itemStyle: { borderRadius: [4, 4, 0, 0] }, data: [320, 380, 350, 440, 470, 520] },
    { name: 'Rate', type: 'line', smooth: true, yAxisIndex: 1, data: [12, 14, 13, 17, 19, 22] },
  ],
}))

const stacked = computed<EChartsOption>(() => ({
  color: palette,
  tooltip: { trigger: 'axis' },
  legend: { top: 0, right: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
  grid: { left: 44, right: 20, top: 36, bottom: 28 },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['00', '04', '08', '12', '16', '20', '24'],
    axisTick: { show: false },
  },
  yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(128,128,140,0.18)' } } },
  series: [
    { name: 'API', type: 'line', stack: 'total', smooth: true, areaStyle: { opacity: 0.25 }, showSymbol: false, data: [120, 132, 101, 134, 90, 230, 210] },
    { name: 'Web', type: 'line', stack: 'total', smooth: true, areaStyle: { opacity: 0.25 }, showSymbol: false, data: [220, 182, 191, 234, 290, 330, 310] },
    { name: 'Mobile', type: 'line', stack: 'total', smooth: true, areaStyle: { opacity: 0.25 }, showSymbol: false, data: [150, 232, 201, 154, 190, 330, 410] },
  ],
}))
</script>

<template>
  <div class="orange-page">
    <PageHeader :title="title" :subtitle="t('page.chart.antv')" />
    <v-alert type="info" variant="tonal" density="compact">
      AntV G2/L7 are React-oriented in the reference app. This page keeps the AntV palette and
      chart grammar with ECharts so the Vue bundle stays consistent.
    </v-alert>

    <div class="orange-grid orange-grid--2">
      <EchartCard :title="`${t('chart.bar')} · AntV palette`" :option="column" :height="320" />
      <EchartCard :title="`${t('chart.pie')} · Rose`" :option="rose" :height="320" />
      <EchartCard :title="t('chart.line')" :option="dual" :height="320" />
      <EchartCard :title="t('chart.stacked')" :option="stacked" :height="320" />
    </div>
  </div>
</template>
