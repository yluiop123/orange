<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ChartData, ChartOptions } from 'chart.js'
import { usePageTitle } from '@/composables/usePageTitle'
import ChartJsCard from '@/components/demo/ChartJsCard.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useUiStore } from '@/stores/ui'

const { t } = useI18n()
const title = usePageTitle('page.title.chart')
const ui = useUiStore()

const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
const gridColor = computed(() => (ui.dark ? 'rgba(148,163,184,0.2)' : 'rgba(100,116,139,0.16)'))
const tickColor = computed(() => (ui.dark ? '#cbd5e1' : '#475569'))

const baseOptions = computed<ChartOptions>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { color: tickColor.value, boxWidth: 10, usePointStyle: true },
    },
    tooltip: { enabled: true },
  },
  scales: {
    x: {
      ticks: { color: tickColor.value },
      grid: { color: gridColor.value },
      border: { color: gridColor.value },
    },
    y: {
      beginAtZero: true,
      ticks: { color: tickColor.value },
      grid: { color: gridColor.value },
      border: { color: gridColor.value },
    },
  },
}))

const lineData = computed<ChartData<'line'>>(() => ({
  labels,
  datasets: [
    {
      label: 'Revenue',
      data: [320, 380, 350, 440, 470, 520, 560],
      borderColor: '#ea580c',
      backgroundColor: 'rgba(234,88,12,0.16)',
      fill: true,
      tension: 0.35,
      pointRadius: 2,
    },
    {
      label: 'Cost',
      data: [220, 240, 260, 250, 280, 300, 320],
      borderColor: '#0ea5e9',
      backgroundColor: 'rgba(14,165,233,0.12)',
      fill: true,
      tension: 0.35,
      pointRadius: 2,
    },
  ],
}))

const barData = computed<ChartData<'bar'>>(() => ({
  labels: ['East', 'South', 'North', 'West', 'Central'],
  datasets: [
    {
      label: 'Orders',
      data: [420, 360, 290, 210, 380],
      backgroundColor: ['#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa'],
      borderRadius: 6,
      barThickness: 22,
    },
  ],
}))

const doughnutData = computed<ChartData<'doughnut'>>(() => ({
  labels: ['Direct', 'Search', 'Social', 'Email'],
  datasets: [
    {
      data: [38, 27, 21, 14],
      backgroundColor: ['#ea580c', '#0ea5e9', '#16a34a', '#eab308'],
      borderWidth: 0,
      hoverOffset: 6,
    },
  ],
}))

const radarData = computed<ChartData<'radar'>>(() => ({
  labels: ['Speed', 'Reliability', 'Comfort', 'Safety', 'Efficiency', 'Cost'],
  datasets: [
    {
      label: 'Fleet A',
      data: [82, 74, 68, 90, 77, 63],
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139,92,246,0.2)',
      pointBackgroundColor: '#8b5cf6',
    },
    {
      label: 'Fleet B',
      data: [68, 82, 72, 76, 84, 71],
      borderColor: '#16a34a',
      backgroundColor: 'rgba(22,163,74,0.16)',
      pointBackgroundColor: '#16a34a',
    },
  ],
}))

const radarOptions = computed<ChartOptions>(() => ({
  ...baseOptions.value,
  scales: {
    r: {
      beginAtZero: true,
      max: 100,
      angleLines: { color: gridColor.value },
      grid: { color: gridColor.value },
      pointLabels: { color: tickColor.value },
      ticks: { display: false },
    },
  },
}))
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('page.chart.rechart')" />

    <div class="demo-grid demo-grid--2">
      <ChartJsCard :title="t('chart.line')" type="line" :data="lineData" :options="baseOptions" :height="320" />
      <ChartJsCard :title="t('chart.bar')" type="bar" :data="barData" :options="baseOptions" :height="320" />
      <ChartJsCard :title="t('chart.donut')" type="doughnut" :data="doughnutData" :options="baseOptions" :height="320" />
      <ChartJsCard :title="t('chart.radar')" type="radar" :data="radarData" :options="radarOptions" :height="320" />
    </div>
  </div>
</template>
