<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as d3 from 'd3'
import { useUiStore } from '@/stores/ui'

type Kind = 'line' | 'bar' | 'scatter' | 'donut'

const props = withDefaults(
  defineProps<{
    kind: Kind
    title?: string
    height?: number
  }>(),
  { title: '', height: 300 },
)

const ui = useUiStore()
const el = ref<SVGSVGElement | null>(null)
let observer: ResizeObserver | null = null

const palette = ['#ea580c', '#0ea5e9', '#16a34a', '#eab308', '#8b5cf6']

function draw() {
  if (!el.value) return
  const svg = d3.select(el.value)
  svg.selectAll('*').remove()

  const width = 560
  const height = props.height
  const margin = { top: 16, right: 18, bottom: 32, left: 42 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom
  const textColor = ui.dark ? '#cbd5e1' : '#334155'
  const gridColor = ui.dark ? 'rgba(148,163,184,0.18)' : 'rgba(100,116,139,0.18)'

  svg.attr('viewBox', `0 0 ${width} ${height}`)
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const axisStyle = (axis: d3.Selection<SVGGElement, unknown, null, undefined>) => {
    axis.selectAll('text').attr('fill', textColor).attr('font-size', 11)
    axis.selectAll('line').attr('stroke', gridColor)
    axis.selectAll('path').attr('stroke', gridColor)
  }

  if (props.kind === 'line') {
    const data = [
      { x: 'Mon', y: 32 },
      { x: 'Tue', y: 48 },
      { x: 'Wed', y: 41 },
      { x: 'Thu', y: 64 },
      { x: 'Fri', y: 58 },
      { x: 'Sat', y: 78 },
      { x: 'Sun', y: 71 },
    ]
    const x = d3.scalePoint<string>().domain(data.map((d) => d.x)).range([0, innerWidth])
    const y = d3.scaleLinear().domain([0, 90]).nice().range([innerHeight, 0])

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .call(axisStyle)
    g.append('g').call(d3.axisLeft(y).ticks(5)).call(axisStyle)
    g.append('g')
      .selectAll('line')
      .data(y.ticks(5))
      .join('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d))
      .attr('stroke', gridColor)

    const line = d3
      .line<{ x: string; y: number }>()
      .x((d) => x(d.x) ?? 0)
      .y((d) => y(d.y))
      .curve(d3.curveMonotoneX)

    const area = d3
      .area<{ x: string; y: number }>()
      .x((d) => x(d.x) ?? 0)
      .y0(innerHeight)
      .y1((d) => y(d.y))
      .curve(d3.curveMonotoneX)

    g.append('path').datum(data).attr('fill', palette[0]).attr('opacity', 0.18).attr('d', area)
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', palette[0])
      .attr('stroke-width', 2.5)
      .attr('d', line)
    g.selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', (d) => x(d.x) ?? 0)
      .attr('cy', (d) => y(d.y))
      .attr('r', 4)
      .attr('fill', palette[0])
  }

  if (props.kind === 'bar') {
    const data = [
      { x: 'A', y: 42 },
      { x: 'B', y: 68 },
      { x: 'C', y: 55 },
      { x: 'D', y: 81 },
      { x: 'E', y: 62 },
      { x: 'F', y: 74 },
    ]
    const x = d3.scaleBand<string>().domain(data.map((d) => d.x)).range([0, innerWidth]).padding(0.3)
    const y = d3.scaleLinear().domain([0, 90]).nice().range([innerHeight, 0])
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .call(axisStyle)
    g.append('g').call(d3.axisLeft(y).ticks(5)).call(axisStyle)
    g.selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', (d) => x(d.x) ?? 0)
      .attr('y', (d) => y(d.y))
      .attr('width', x.bandwidth())
      .attr('height', (d) => innerHeight - y(d.y))
      .attr('rx', 5)
      .attr('fill', (_, index) => palette[index % palette.length])
  }

  if (props.kind === 'scatter') {
    const random = d3.randomLcg(0.42)
    const data = Array.from({ length: 60 }, () => ({
      x: random() * 100,
      y: random() * 100,
      r: 4 + random() * 8,
    }))
    const x = d3.scaleLinear().domain([0, 100]).range([0, innerWidth])
    const y = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0])
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(5))
      .call(axisStyle)
    g.append('g').call(d3.axisLeft(y).ticks(5)).call(axisStyle)
    g.selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', (d) => x(d.x))
      .attr('cy', (d) => y(d.y))
      .attr('r', (d) => d.r)
      .attr('fill', palette[1])
      .attr('opacity', 0.6)
  }

  if (props.kind === 'donut') {
    const data = [
      { name: 'Direct', value: 38 },
      { name: 'Search', value: 27 },
      { name: 'Social', value: 21 },
      { name: 'Email', value: 14 },
    ]
    const radius = Math.min(innerWidth, innerHeight) / 2 - 8
    const pie = d3
      .pie<{ name: string; value: number }>()
      .value((d) => d.value)
      .sort(null)
    const arc = d3
      .arc<d3.PieArcDatum<{ name: string; value: number }>>()
      .innerRadius(radius * 0.58)
      .outerRadius(radius)
    const labelArc = d3
      .arc<d3.PieArcDatum<{ name: string; value: number }>>()
      .innerRadius(radius * 0.78)
      .outerRadius(radius * 0.78)
    const group = g
      .append('g')
      .attr('transform', `translate(${innerWidth / 2},${innerHeight / 2})`)
    group
      .selectAll('path')
      .data(pie(data))
      .join('path')
      .attr('d', arc)
      .attr('fill', (_, index) => palette[index % palette.length])
      .attr('stroke', ui.dark ? '#141821' : '#ffffff')
      .attr('stroke-width', 2)
    group
      .selectAll('text')
      .data(pie(data))
      .join('text')
      .attr('transform', (d) => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', 11)
      .attr('font-weight', 600)
      .text((d) => `${d.data.value}%`)
  }
}

onMounted(() => {
  draw()
  observer = new ResizeObserver(() => draw())
  if (el.value) observer.observe(el.value)
})

watch(
  () => ui.dark,
  () => draw(),
)

onUnmounted(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <v-card variant="flat" class="d3-card">
    <div v-if="title" class="d3-title">{{ title }}</div>
    <svg ref="el" class="d3-svg" :style="{ height: `${height}px` }" role="img" :aria-label="title" />
  </v-card>
</template>

<style scoped>
.d3-card {
  padding: 14px 16px;
  border: 1px solid rgba(var(--v-border-color), 0.6);
  height: 100%;
}

.d3-title {
  font-size: 14px;
  font-weight: 650;
  margin-bottom: 4px;
}

.d3-svg {
  width: 100%;
  display: block;
}
</style>
