<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import {
  Chart,
  registerables,
  type ChartData,
  type ChartOptions,
  type ChartType,
} from 'chart.js'

Chart.register(...registerables)

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    type: ChartType
    data: ChartData
    options?: ChartOptions
    height?: number
  }>(),
  { title: '', subtitle: '', height: 300, options: undefined },
)

const el = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

function render() {
  if (!el.value) return
  chart?.destroy()
  chart = new Chart(el.value, {
    type: props.type,
    data: props.data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true } },
        ...props.options?.plugins,
      },
      ...props.options,
    },
  })
}

watch(() => [props.type, props.data, props.options], render, { deep: true })
watch(el, (element) => {
  if (element) render()
})

onUnmounted(() => {
  chart?.destroy()
  chart = null
})
</script>

<template>
  <v-card class="chart-card" variant="flat">
    <div v-if="title || subtitle" class="chart-head">
      <div>
        <div class="chart-title">{{ title }}</div>
        <div v-if="subtitle" class="chart-subtitle">{{ subtitle }}</div>
      </div>
      <slot name="actions" />
    </div>
    <div class="chart-body" :style="{ height: `${height}px` }">
      <canvas ref="el" />
    </div>
  </v-card>
</template>

<style scoped>
.chart-card {
  padding: 14px 16px 8px;
  border: 1px solid rgba(var(--v-border-color), 0.6);
  background: rgb(var(--v-theme-surface));
  height: 100%;
}

.chart-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.chart-title {
  font-size: 14px;
  font-weight: 650;
}

.chart-subtitle {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.chart-body {
  position: relative;
  width: 100%;
}
</style>
