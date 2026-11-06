<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ChartData, ChartOptions } from 'chart.js'
import { usePageTitle } from '@/composables/usePageTitle'
import ChartJsCard from '@/components/demo/ChartJsCard.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useUiStore } from '@/stores/ui'

const { t } = useI18n()
const title = usePageTitle('page.title.chart')
const ui = useUiStore()

const tab = ref('area')

const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
const regions = ['East', 'South', 'North', 'West', 'Central']

const orange = '#f97316'
const sky = '#0ea5e9'
const violet = '#8b5cf6'
const green = '#22c55e'
const yellow = '#eab308'
const teal = '#14b8a6'
const rose = '#f43f5e'

const gridColor = computed(() => (ui.dark ? 'rgba(148,163,184,0.2)' : 'rgba(100,116,139,0.16)'))
const tickColor = computed(() => (ui.dark ? '#cbd5e1' : '#475569'))
const dividerColor = computed(() => (ui.dark ? '#1f2937' : '#ffffff'))

const legendLabels = computed(() => ({
  color: tickColor.value,
  boxWidth: 10,
  usePointStyle: true,
}))

function cartesianScales(
  opts: { stacked?: boolean; xGrid?: boolean; yMax?: number; yStep?: number } = {},
) {
  return {
    x: {
      stacked: opts.stacked ?? false,
      grid: { color: gridColor.value, display: opts.xGrid ?? true },
      border: { color: gridColor.value },
      ticks: { color: tickColor.value },
    },
    y: {
      stacked: opts.stacked ?? false,
      beginAtZero: true,
      max: opts.yMax,
      grid: { color: gridColor.value },
      border: { color: gridColor.value },
      ticks: { color: tickColor.value, stepSize: opts.yStep },
    },
  }
}

/* ------------------------------------------------------------------ options */

const baseOptions = computed<ChartOptions>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: legendLabels.value },
    tooltip: { enabled: true },
  },
  scales: cartesianScales(),
}))

const areaAxesOptions = computed<ChartOptions>(() => ({
  ...baseOptions.value,
  scales: cartesianScales({ xGrid: false, yMax: 600, yStep: 100 }),
}))

const stackedCartesianOptions = computed<ChartOptions>(() => ({
  ...baseOptions.value,
  scales: cartesianScales({ stacked: true }),
}))

const horizontalBarOptions = computed<ChartOptions>(() => ({
  ...baseOptions.value,
  indexAxis: 'y',
}))

const circularOptions = computed<ChartOptions>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: legendLabels.value },
    tooltip: { enabled: true },
  },
}))

const cutoutOptions = computed<ChartOptions>(() => ({
  ...circularOptions.value,
  cutout: '62%',
}))

const halfCircleOptions = computed<ChartOptions>(() => ({
  ...circularOptions.value,
  rotation: -90,
  circumference: 180,
  cutout: '58%',
}))

const legendRightOptions = computed<ChartOptions>(() => ({
  ...circularOptions.value,
  plugins: {
    ...circularOptions.value.plugins,
    legend: { position: 'right', labels: legendLabels.value },
  },
}))

const radarOptions = computed<ChartOptions>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: legendLabels.value },
    tooltip: { enabled: true },
  },
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

const radarNoGridOptions = computed<ChartOptions>(() => ({
  ...radarOptions.value,
  scales: {
    r: {
      beginAtZero: true,
      max: 100,
      angleLines: { display: false },
      grid: { display: false },
      pointLabels: { color: tickColor.value },
      ticks: { display: false },
    },
  },
}))

const polarOptions = computed<ChartOptions>(() => ({
  ...circularOptions.value,
  scales: {
    r: {
      beginAtZero: true,
      angleLines: { color: gridColor.value },
      grid: { color: gridColor.value },
      pointLabels: { color: tickColor.value },
      ticks: { color: tickColor.value, backdropColor: 'transparent' },
    },
  },
}))

const polarGridOptions = computed<ChartOptions>(() => ({
  ...polarOptions.value,
  scales: {
    r: {
      beginAtZero: true,
      angleLines: { color: gridColor.value, lineWidth: 1 },
      grid: { color: gridColor.value, circular: true },
      pointLabels: { color: tickColor.value },
      ticks: { display: false },
    },
  },
}))

const tooltipIndexOptions = computed<ChartOptions>(() => ({
  ...baseOptions.value,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    ...baseOptions.value.plugins,
    tooltip: { mode: 'index', intersect: false },
  },
}))

const tooltipNoLabelOptions = computed<ChartOptions>(() => ({
  ...baseOptions.value,
  plugins: {
    ...baseOptions.value.plugins,
    tooltip: {
      callbacks: { title: () => '' },
    },
  },
}))

const tooltipFormatterOptions = computed<ChartOptions>(() => ({
  ...baseOptions.value,
  plugins: {
    ...baseOptions.value.plugins,
    tooltip: {
      callbacks: {
        label: (context) => {
          const raw = context.raw
          const value = typeof raw === 'number' ? raw : Number(raw)
          return ` ${context.dataset.label ?? '数值'}: ${value.toLocaleString()} 单`
        },
      },
    },
  },
}))

const tooltipNoIndicatorOptions = computed<ChartOptions>(() => ({
  ...baseOptions.value,
  plugins: {
    ...baseOptions.value.plugins,
    tooltip: { displayColors: false },
  },
}))

const tooltipCustomLabelOptions = computed<ChartOptions>(() => ({
  ...baseOptions.value,
  plugins: {
    ...baseOptions.value.plugins,
    tooltip: {
      callbacks: {
        title: (items) => {
          const first = items[0]
          return first ? `期间 · ${first.label}` : ''
        },
      },
    },
  },
}))

/* --------------------------------------------------------------- area data */

const areaDefaultData = computed<ChartData<'line'>>(() => ({
  labels,
  datasets: [
    {
      label: '访问量',
      data: [186, 305, 237, 273, 209, 314, 420],
      borderColor: orange,
      backgroundColor: 'rgba(249,115,22,0.18)',
      fill: true,
      tension: 0.4,
      pointRadius: 2,
    },
  ],
}))

const areaGradientData = computed<ChartData<'line'>>(() => ({
  labels,
  datasets: [
    {
      label: '营收',
      data: [120, 190, 160, 240, 280, 310, 360],
      borderColor: orange,
      backgroundColor: (context) => {
        const { ctx, chartArea } = context.chart
        if (!chartArea) return 'rgba(249,115,22,0.16)'
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, 'rgba(249,115,22,0.45)')
        gradient.addColorStop(1, 'rgba(249,115,22,0.02)')
        return gradient
      },
      fill: true,
      tension: 0.4,
      pointRadius: 0,
    },
  ],
}))

const areaStepData = computed<ChartData<'line'>>(() => ({
  labels,
  datasets: [
    {
      label: '订单',
      data: [150, 230, 190, 260, 210, 300, 340],
      borderColor: sky,
      backgroundColor: 'rgba(14,165,233,0.18)',
      fill: true,
      stepped: true,
      pointRadius: 2,
    },
  ],
}))

const areaLinearData = computed<ChartData<'line'>>(() => ({
  labels,
  datasets: [
    {
      label: '转化',
      data: [90, 140, 120, 180, 160, 220, 240],
      borderColor: violet,
      backgroundColor: 'rgba(139,92,246,0.18)',
      fill: true,
      tension: 0,
      pointRadius: 2,
    },
  ],
}))

const areaStackedData = computed<ChartData<'line'>>(() => ({
  labels,
  datasets: [
    {
      label: '桌面端',
      data: [120, 160, 140, 190, 210, 240, 260],
      borderColor: orange,
      backgroundColor: 'rgba(249,115,22,0.24)',
      fill: true,
      tension: 0.35,
      pointRadius: 2,
    },
    {
      label: '移动端',
      data: [90, 110, 130, 140, 160, 180, 200],
      borderColor: sky,
      backgroundColor: 'rgba(14,165,233,0.2)',
      fill: true,
      tension: 0.35,
      pointRadius: 2,
    },
  ],
}))

/* ---------------------------------------------------------------- bar data */

const barDefaultData = computed<ChartData<'bar'>>(() => ({
  labels: regions,
  datasets: [
    {
      label: '订单',
      data: [420, 360, 290, 210, 380],
      backgroundColor: ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'],
      borderRadius: 6,
      barThickness: 22,
    },
  ],
}))

const barMultipleData = computed<ChartData<'bar'>>(() => ({
  labels: regions,
  datasets: [
    {
      label: '线上',
      data: [320, 280, 240, 180, 300],
      backgroundColor: orange,
      borderRadius: 5,
      barThickness: 16,
    },
    {
      label: '门店',
      data: [100, 80, 50, 30, 80],
      backgroundColor: sky,
      borderRadius: 5,
      barThickness: 16,
    },
  ],
}))

const barStackedData = computed<ChartData<'bar'>>(() => ({
  labels: regions,
  datasets: [
    {
      label: '已完成',
      data: [300, 260, 220, 160, 280],
      backgroundColor: green,
      borderRadius: 4,
      barThickness: 24,
    },
    {
      label: '处理中',
      data: [120, 100, 70, 50, 100],
      backgroundColor: yellow,
      borderRadius: 4,
      barThickness: 24,
    },
  ],
}))

const barNegativeData = computed<ChartData<'bar'>>(() => ({
  labels: regions,
  datasets: [
    {
      label: '净增长',
      data: [180, -120, 240, -80, 160],
      backgroundColor: ['#22c55e', '#f43f5e', '#22c55e', '#f43f5e', '#22c55e'],
      borderRadius: 5,
      barThickness: 22,
    },
  ],
}))

const barRoundedData = computed<ChartData<'bar'>>(() => ({
  labels: regions,
  datasets: [
    {
      label: '活跃用户',
      data: [260, 310, 180, 220, 290],
      backgroundColor: violet,
      hoverBackgroundColor: '#a78bfa',
      borderRadius: 12,
      barThickness: 24,
    },
  ],
}))

/* --------------------------------------------------------------- line data */

const lineDefaultData = computed<ChartData<'line'>>(() => ({
  labels,
  datasets: [
    {
      label: 'Revenue',
      data: [320, 380, 350, 440, 470, 520, 560],
      borderColor: orange,
      backgroundColor: 'rgba(249,115,22,0.16)',
      fill: true,
      tension: 0.35,
      pointRadius: 2,
    },
    {
      label: 'Cost',
      data: [220, 240, 260, 250, 280, 300, 320],
      borderColor: sky,
      backgroundColor: 'rgba(14,165,233,0.12)',
      fill: true,
      tension: 0.35,
      pointRadius: 2,
    },
  ],
}))

const lineLinearData = computed<ChartData<'line'>>(() => ({
  labels,
  datasets: [
    {
      label: '线性',
      data: [180, 230, 200, 280, 320, 300, 380],
      borderColor: teal,
      backgroundColor: 'rgba(20,184,166,0.12)',
      fill: false,
      tension: 0,
      pointRadius: 3,
    },
  ],
}))

const lineStepData = computed<ChartData<'line'>>(() => ({
  labels,
  datasets: [
    {
      label: '阶梯',
      data: [120, 120, 180, 180, 240, 240, 300],
      borderColor: violet,
      backgroundColor: 'rgba(139,92,246,0.12)',
      fill: false,
      stepped: true,
      pointRadius: 2,
    },
  ],
}))

const lineMultipleData = computed<ChartData<'line'>>(() => ({
  labels,
  datasets: [
    {
      label: '移动端',
      data: [280, 320, 300, 380, 420, 460, 500],
      borderColor: orange,
      backgroundColor: 'rgba(249,115,22,0.12)',
      fill: false,
      tension: 0.3,
      pointRadius: 2,
    },
    {
      label: '桌面端',
      data: [220, 240, 260, 300, 280, 330, 360],
      borderColor: sky,
      backgroundColor: 'rgba(14,165,233,0.12)',
      fill: false,
      tension: 0.3,
      pointRadius: 2,
    },
    {
      label: '平板',
      data: [120, 140, 130, 170, 160, 190, 210],
      borderColor: green,
      backgroundColor: 'rgba(34,197,94,0.12)',
      fill: false,
      tension: 0.3,
      pointRadius: 2,
    },
  ],
}))

const lineDashedData = computed<ChartData<'line'>>(() => ({
  labels,
  datasets: [
    {
      label: '目标',
      data: [200, 220, 260, 300, 340, 380, 420],
      borderColor: rose,
      backgroundColor: 'rgba(244,63,94,0.1)',
      fill: false,
      tension: 0.2,
      borderDash: [6, 4],
      pointRadius: 0,
    },
    {
      label: '实际',
      data: [180, 240, 230, 290, 360, 350, 400],
      borderColor: sky,
      backgroundColor: 'rgba(14,165,233,0.1)',
      fill: false,
      tension: 0.3,
      pointRadius: 2,
    },
  ],
}))

const lineDotsData = computed<ChartData<'line'>>(() => ({
  labels,
  datasets: [
    {
      label: '评分',
      data: [62, 74, 68, 82, 78, 88, 92],
      borderColor: violet,
      backgroundColor: 'rgba(139,92,246,0.16)',
      pointBackgroundColor: ['#f97316', '#0ea5e9', '#22c55e', '#eab308', '#8b5cf6', '#14b8a6', '#f43f5e'],
      pointBorderColor: dividerColor.value,
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 8,
      fill: false,
      tension: 0.3,
    },
  ],
}))

/* ---------------------------------------------------------------- pie data */

const pieData = computed<ChartData<'pie'>>(() => ({
  labels: ['直接访问', '搜索引擎', '社交媒体', '邮件营销', '联盟广告'],
  datasets: [
    {
      data: [38, 27, 21, 9, 5],
      backgroundColor: ['#f97316', '#0ea5e9', '#22c55e', '#eab308', '#8b5cf6'],
      borderColor: dividerColor.value,
      borderWidth: 2,
      hoverOffset: 6,
    },
  ],
}))

const pieNoBorderData = computed<ChartData<'pie'>>(() => ({
  labels: ['直接访问', '搜索引擎', '社交媒体', '邮件营销', '联盟广告'],
  datasets: [
    {
      data: [38, 27, 21, 9, 5],
      backgroundColor: ['#f97316', '#0ea5e9', '#22c55e', '#eab308', '#8b5cf6'],
      borderWidth: 0,
      hoverOffset: 4,
    },
  ],
}))

const pieOffsetData = computed<ChartData<'pie'>>(() => ({
  labels: ['直接访问', '搜索引擎', '社交媒体', '邮件营销', '联盟广告'],
  datasets: [
    {
      data: [38, 27, 21, 9, 5],
      backgroundColor: ['#f97316', '#0ea5e9', '#22c55e', '#eab308', '#8b5cf6'],
      borderColor: dividerColor.value,
      borderWidth: 2,
      offset: [14, 0, 0, 0, 0],
      hoverOffset: 6,
    },
  ],
}))

const pieStackedData = computed<ChartData<'doughnut'>>(() => ({
  labels: ['直接访问', '搜索引擎', '社交媒体', '邮件营销', '联盟广告'],
  datasets: [
    {
      label: '本年',
      data: [38, 27, 21, 9, 5],
      backgroundColor: ['#f97316', '#0ea5e9', '#22c55e', '#eab308', '#8b5cf6'],
      borderColor: dividerColor.value,
      borderWidth: 2,
      weight: 1,
    },
    {
      label: '去年',
      data: [30, 24, 26, 12, 8],
      backgroundColor: ['#fdba74', '#7dd3fc', '#86efac', '#fde047', '#c4b5fd'],
      borderColor: dividerColor.value,
      borderWidth: 2,
      weight: 0.7,
    },
  ],
}))

/* -------------------------------------------------------------- radar data */

const radarDefaultData = computed<ChartData<'radar'>>(() => ({
  labels: ['Speed', 'Reliability', 'Comfort', 'Safety', 'Efficiency', 'Cost'],
  datasets: [
    {
      label: 'Fleet A',
      data: [82, 74, 68, 90, 77, 63],
      borderColor: violet,
      backgroundColor: 'rgba(139,92,246,0.2)',
      pointBackgroundColor: violet,
      pointRadius: 3,
    },
  ],
}))

const radarMultipleData = computed<ChartData<'radar'>>(() => ({
  labels: ['Speed', 'Reliability', 'Comfort', 'Safety', 'Efficiency', 'Cost'],
  datasets: [
    {
      label: 'Fleet A',
      data: [82, 74, 68, 90, 77, 63],
      borderColor: violet,
      backgroundColor: 'rgba(139,92,246,0.2)',
      pointBackgroundColor: violet,
      pointRadius: 3,
    },
    {
      label: 'Fleet B',
      data: [68, 82, 72, 76, 84, 71],
      borderColor: green,
      backgroundColor: 'rgba(22,163,74,0.16)',
      pointBackgroundColor: green,
      pointRadius: 3,
    },
  ],
}))

const radarDotsData = computed<ChartData<'radar'>>(() => ({
  labels: ['Speed', 'Reliability', 'Comfort', 'Safety', 'Efficiency', 'Cost'],
  datasets: [
    {
      label: '圆点',
      data: [70, 88, 64, 78, 82, 58],
      borderColor: sky,
      backgroundColor: 'rgba(14,165,233,0.14)',
      pointBackgroundColor: sky,
      pointBorderColor: dividerColor.value,
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 9,
    },
  ],
}))

const radarAreaData = computed<ChartData<'radar'>>(() => ({
  labels: ['Speed', 'Reliability', 'Comfort', 'Safety', 'Efficiency', 'Cost'],
  datasets: [
    {
      label: '面积',
      data: [86, 78, 92, 70, 88, 66],
      borderColor: orange,
      backgroundColor: 'rgba(249,115,22,0.35)',
      pointBackgroundColor: orange,
      pointRadius: 2,
    },
  ],
}))

const radarNoGridData = computed<ChartData<'radar'>>(() => ({
  labels: ['Speed', 'Reliability', 'Comfort', 'Safety', 'Efficiency', 'Cost'],
  datasets: [
    {
      label: '无网格',
      data: [74, 62, 84, 68, 90, 76],
      borderColor: teal,
      backgroundColor: 'rgba(20,184,166,0.2)',
      pointBackgroundColor: teal,
      pointRadius: 3,
    },
  ],
}))

const radarLinesData = computed<ChartData<'radar'>>(() => ({
  labels: ['Speed', 'Reliability', 'Comfort', 'Safety', 'Efficiency', 'Cost'],
  datasets: [
    {
      label: 'Fleet A',
      data: [82, 74, 68, 90, 77, 63],
      borderColor: violet,
      backgroundColor: 'transparent',
      pointBackgroundColor: violet,
      pointRadius: 0,
      fill: false,
    },
    {
      label: 'Fleet B',
      data: [68, 82, 72, 76, 84, 71],
      borderColor: green,
      backgroundColor: 'transparent',
      pointBackgroundColor: green,
      pointRadius: 0,
      fill: false,
    },
  ],
}))

/* ------------------------------------------------------------- radial data */

const polarData = computed<ChartData<'polarArea'>>(() => ({
  labels: ['直接访问', '搜索引擎', '社交媒体', '邮件营销'],
  datasets: [
    {
      label: '来源',
      data: [38, 27, 21, 14],
      backgroundColor: [
        'rgba(249,115,22,0.72)',
        'rgba(14,165,233,0.72)',
        'rgba(34,197,94,0.72)',
        'rgba(234,179,8,0.72)',
      ],
      borderColor: dividerColor.value,
      borderWidth: 2,
    },
  ],
}))

const radialStackedData = computed<ChartData<'doughnut'>>(() => ({
  labels: ['直接访问', '搜索引擎', '社交媒体', '邮件营销'],
  datasets: [
    {
      label: '本年',
      data: [38, 27, 21, 14],
      backgroundColor: ['#f97316', '#0ea5e9', '#22c55e', '#eab308'],
      borderColor: dividerColor.value,
      borderWidth: 2,
      weight: 1,
    },
    {
      label: '去年',
      data: [30, 24, 26, 20],
      backgroundColor: ['#fdba74', '#7dd3fc', '#86efac', '#fde047'],
      borderColor: dividerColor.value,
      borderWidth: 2,
      weight: 0.75,
    },
  ],
}))

/* ------------------------------------------------------------ tooltip data */

const tooltipOrderData = computed<ChartData<'bar'>>(() => ({
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: '线上订单',
      data: [120, 180, 150, 220, 260, 300, 280],
      backgroundColor: orange,
      borderRadius: 4,
      barThickness: 14,
    },
    {
      label: '门店订单',
      data: [80, 100, 120, 130, 150, 170, 160],
      backgroundColor: sky,
      borderRadius: 4,
      barThickness: 14,
    },
  ],
}))

const tooltipSingleData = computed<ChartData<'bar'>>(() => ({
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: '订单量',
      data: [120, 180, 150, 220, 260, 300, 280],
      backgroundColor: [orange, '#fb923c', '#fdba74', sky, violet, green, teal],
      borderRadius: 6,
      barThickness: 22,
    },
  ],
}))
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('page.chart.rechart')" />

    <v-tabs v-model="tab" color="primary">
      <v-tab value="area">{{ t('chart.area') }}</v-tab>
      <v-tab value="bar">{{ t('chart.bar') }}</v-tab>
      <v-tab value="line">{{ t('chart.line') }}</v-tab>
      <v-tab value="pie">{{ t('chart.pie') }}</v-tab>
      <v-tab value="radar">{{ t('chart.radar') }}</v-tab>
      <v-tab value="radial">{{ t('chart.radial') }}</v-tab>
      <v-tab value="tooltip">{{ t('chart.tooltip') }}</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <!-- Area Chart -->
      <v-window-item value="area">
        <div class="demo-grid demo-grid--3 tab-body">
          <ChartJsCard
            title="面积图"
            subtitle="Area Chart"
            type="line"
            :data="areaDefaultData"
            :options="baseOptions"
            :height="300"
          />
          <ChartJsCard
            title="面积图 - 渐变色"
            subtitle="Area Chart - Gradient"
            type="line"
            :data="areaGradientData"
            :options="baseOptions"
            :height="300"
          />
          <ChartJsCard
            title="面积图 - 阶梯"
            subtitle="Area Chart - Step"
            type="line"
            :data="areaStepData"
            :options="baseOptions"
            :height="300"
          />
          <ChartJsCard
            title="面积图 - 线性"
            subtitle="Area Chart - Linear"
            type="line"
            :data="areaLinearData"
            :options="baseOptions"
            :height="300"
          />
          <ChartJsCard
            title="面积图 - 堆叠"
            subtitle="Area Chart - Stacked"
            type="line"
            :data="areaStackedData"
            :options="stackedCartesianOptions"
            :height="300"
          />
          <ChartJsCard
            title="面积图 - 坐标轴"
            subtitle="Area Chart - Axes"
            type="line"
            :data="areaDefaultData"
            :options="areaAxesOptions"
            :height="300"
          />
        </div>
      </v-window-item>

      <!-- Bar Chart -->
      <v-window-item value="bar">
        <div class="demo-grid demo-grid--3 tab-body">
          <ChartJsCard
            title="柱状图"
            subtitle="Bar Chart"
            type="bar"
            :data="barDefaultData"
            :options="baseOptions"
            :height="300"
          />
          <ChartJsCard
            title="柱状图 - 水平"
            subtitle="Bar Chart - Horizontal"
            type="bar"
            :data="barDefaultData"
            :options="horizontalBarOptions"
            :height="300"
          />
          <ChartJsCard
            title="柱状图 - 多个"
            subtitle="Bar Chart - Multiple"
            type="bar"
            :data="barMultipleData"
            :options="baseOptions"
            :height="300"
          />
          <ChartJsCard
            title="柱状图 - 堆叠"
            subtitle="Bar Chart - Stacked + Legend"
            type="bar"
            :data="barStackedData"
            :options="stackedCartesianOptions"
            :height="300"
          />
          <ChartJsCard
            title="柱状图 - 负数"
            subtitle="Bar Chart - Negative"
            type="bar"
            :data="barNegativeData"
            :options="baseOptions"
            :height="300"
          />
          <ChartJsCard
            title="柱状图 - 活跃"
            subtitle="Bar Chart - Active"
            type="bar"
            :data="barRoundedData"
            :options="baseOptions"
            :height="300"
          />
        </div>
      </v-window-item>

      <!-- Line Chart -->
      <v-window-item value="line">
        <div class="demo-grid demo-grid--3 tab-body">
          <ChartJsCard
            title="折线图 - 默认"
            subtitle="Line Chart"
            type="line"
            :data="lineDefaultData"
            :options="baseOptions"
            :height="300"
          />
          <ChartJsCard
            title="折线图 - 线性"
            subtitle="Line Chart - Linear"
            type="line"
            :data="lineLinearData"
            :options="baseOptions"
            :height="300"
          />
          <ChartJsCard
            title="折线图 - 阶梯"
            subtitle="Line Chart - Step"
            type="line"
            :data="lineStepData"
            :options="baseOptions"
            :height="300"
          />
          <ChartJsCard
            title="折线图 - 多条折线"
            subtitle="Line Chart - Multiple"
            type="line"
            :data="lineMultipleData"
            :options="baseOptions"
            :height="300"
          />
          <ChartJsCard
            title="折线图 - 虚线"
            subtitle="Line Chart - Dashed"
            type="line"
            :data="lineDashedData"
            :options="baseOptions"
            :height="300"
          />
          <ChartJsCard
            title="折线图 - 自定义点颜色"
            subtitle="Line Chart - Dots Colors"
            type="line"
            :data="lineDotsData"
            :options="baseOptions"
            :height="300"
          />
        </div>
      </v-window-item>

      <!-- Pie Chart -->
      <v-window-item value="pie">
        <div class="demo-grid demo-grid--3 tab-body">
          <ChartJsCard
            title="饼图"
            subtitle="Pie Chart"
            type="pie"
            :data="pieData"
            :options="circularOptions"
            :height="300"
          />
          <ChartJsCard
            title="饼图 - 环形"
            subtitle="Pie Chart - Donut"
            type="doughnut"
            :data="pieData"
            :options="cutoutOptions"
            :height="300"
          />
          <ChartJsCard
            title="饼图 - 图例"
            subtitle="Pie Chart - Legend"
            type="pie"
            :data="pieData"
            :options="legendRightOptions"
            :height="300"
          />
          <ChartJsCard
            title="饼图 - 无分隔符"
            subtitle="Pie Chart - Separator None"
            type="pie"
            :data="pieNoBorderData"
            :options="circularOptions"
            :height="300"
          />
          <ChartJsCard
            title="饼图 - 分离"
            subtitle="Pie Chart - Offset"
            type="pie"
            :data="pieOffsetData"
            :options="circularOptions"
            :height="300"
          />
          <ChartJsCard
            title="饼图 - 堆叠"
            subtitle="Pie Chart - Stacked"
            type="doughnut"
            :data="pieStackedData"
            :options="cutoutOptions"
            :height="300"
          />
        </div>
      </v-window-item>

      <!-- Radar Chart -->
      <v-window-item value="radar">
        <div class="demo-grid demo-grid--3 tab-body">
          <ChartJsCard
            title="雷达图"
            subtitle="Radar Chart"
            type="radar"
            :data="radarDefaultData"
            :options="radarOptions"
            :height="300"
          />
          <ChartJsCard
            title="雷达图 - 多条"
            subtitle="Radar Chart - Multiple"
            type="radar"
            :data="radarMultipleData"
            :options="radarOptions"
            :height="300"
          />
          <ChartJsCard
            title="雷达图 - 圆点"
            subtitle="Radar Chart - Dots"
            type="radar"
            :data="radarDotsData"
            :options="radarOptions"
            :height="300"
          />
          <ChartJsCard
            title="雷达图 - 面积"
            subtitle="Radar Chart - Filled"
            type="radar"
            :data="radarAreaData"
            :options="radarOptions"
            :height="300"
          />
          <ChartJsCard
            title="雷达图 - 无网格"
            subtitle="Radar Chart - Grid None"
            type="radar"
            :data="radarNoGridData"
            :options="radarNoGridOptions"
            :height="300"
          />
          <ChartJsCard
            title="雷达图 - 折线图"
            subtitle="Radar Chart - Lines Only"
            type="radar"
            :data="radarLinesData"
            :options="radarOptions"
            :height="300"
          />
        </div>
      </v-window-item>

      <!-- Radial Chart -->
      <v-window-item value="radial">
        <div class="demo-grid demo-grid--3 tab-body">
          <ChartJsCard
            title="扇形图"
            subtitle="Radial Chart"
            type="polarArea"
            :data="polarData"
            :options="polarOptions"
            :height="300"
          />
          <ChartJsCard
            title="扇形图 - 环形"
            subtitle="Radial Chart - Donut"
            type="doughnut"
            :data="pieData"
            :options="cutoutOptions"
            :height="300"
          />
          <ChartJsCard
            title="扇形图 - 网格"
            subtitle="Radial Chart - Grid"
            type="polarArea"
            :data="polarData"
            :options="polarGridOptions"
            :height="300"
          />
          <ChartJsCard
            title="扇形图 - 堆叠"
            subtitle="Radial Chart - Stacked"
            type="doughnut"
            :data="radialStackedData"
            :options="circularOptions"
            :height="300"
          />
          <ChartJsCard
            title="扇形图 - 标签"
            subtitle="Radial Chart - Label"
            type="polarArea"
            :data="polarData"
            :options="polarOptions"
            :height="300"
          />
          <ChartJsCard
            title="扇形图 - 半圆"
            subtitle="Radial Chart - Half Circle"
            type="doughnut"
            :data="pieData"
            :options="halfCircleOptions"
            :height="300"
          />
        </div>
      </v-window-item>

      <!-- Tooltip -->
      <v-window-item value="tooltip">
        <div class="demo-grid demo-grid--3 tab-body">
          <ChartJsCard
            title="提示 - 默认"
            subtitle="Tooltip - Default"
            type="bar"
            :data="tooltipOrderData"
            :options="baseOptions"
            :height="300"
          />
          <ChartJsCard
            title="提示 - 索引模式"
            subtitle="Tooltip - Index Mode"
            type="bar"
            :data="tooltipOrderData"
            :options="tooltipIndexOptions"
            :height="300"
          />
          <ChartJsCard
            title="提示 - 无标签"
            subtitle="Tooltip - No Label"
            type="bar"
            :data="tooltipSingleData"
            :options="tooltipNoLabelOptions"
            :height="300"
          />
          <ChartJsCard
            title="提示 - 格式化程序"
            subtitle="Tooltip - Formatter"
            type="bar"
            :data="tooltipOrderData"
            :options="tooltipFormatterOptions"
            :height="300"
          />
          <ChartJsCard
            title="提示 - 无指示器"
            subtitle="Tooltip - No Indicator"
            type="bar"
            :data="tooltipSingleData"
            :options="tooltipNoIndicatorOptions"
            :height="300"
          />
          <ChartJsCard
            title="提示 - 自定义标签"
            subtitle="Tooltip - Custom Label"
            type="bar"
            :data="tooltipSingleData"
            :options="tooltipCustomLabelOptions"
            :height="300"
          />
        </div>
      </v-window-item>
    </v-window>
  </div>
</template>

<style scoped>
.tab-body {
  padding-top: var(--orange-content-gap);
}
</style>
