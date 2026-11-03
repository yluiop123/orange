<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { useUiStore } from '@/stores/ui'

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    option: EChartsOption
    height?: number
    forceDark?: boolean
  }>(),
  { title: '', subtitle: '', height: 320, forceDark: false },
)

const ui = useUiStore()
const el = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let observer: ResizeObserver | null = null

function render() {
  if (!el.value) return
  chart?.dispose()
  const dark = props.forceDark || ui.dark
  chart = echarts.init(el.value, dark ? 'dark' : undefined, { renderer: 'canvas' })
  chart.setOption({ backgroundColor: 'transparent', ...props.option }, true)
}

function resize() {
  chart?.resize()
}

watch(() => props.option, render, { deep: true })
watch(
  () => [ui.dark, props.forceDark],
  () => render(),
)

watch(el, (element) => {
  observer?.disconnect()
  if (!element) return
  render()
  observer = new ResizeObserver(resize)
  observer.observe(element)
})

onUnmounted(() => {
  observer?.disconnect()
  chart?.dispose()
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
    <div ref="el" class="chart-body" :style="{ height: `${height}px` }" />
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
  width: 100%;
}
</style>
