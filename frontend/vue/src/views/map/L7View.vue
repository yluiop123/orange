<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import L from '@/lib/leaflet-icon'
import { usePageTitle } from '@/composables/usePageTitle'
import PageHeader from '@/components/PageHeader.vue'

const { t } = useI18n()
const title = usePageTitle('page.title.map')
const el = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null

const categories = [
  { key: 'Natural', color: '#5ad8a6' },
  { key: 'Cultural', color: '#e8684a' },
  { key: 'Mixed', color: '#f6bd16' },
]

function random(seed: number) {
  let value = seed
  return () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

const next = random(7)
const points = Array.from({ length: 140 }, (_, index) => ({
  lat: 24 + next() * 18,
  lng: 96 + next() * 26,
  category: categories[index % categories.length],
  value: 20 + Math.round(next() * 80),
}))

function init() {
  if (!el.value) return
  map = L.map(el.value, { zoomControl: true, attributionControl: true }).setView([35, 108], 4)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  }).addTo(map)

  points.forEach((point) => {
    L.circleMarker([point.lat, point.lng], {
      radius: 3 + point.value / 22,
      color: point.category.color,
      fillColor: point.category.color,
      fillOpacity: 0.5,
      weight: 1,
    })
      .addTo(map as L.Map)
      .bindTooltip(`${point.category.key} · ${point.value}`)
  })
}

onMounted(init)

onUnmounted(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('page.map.l7')" />
    <v-alert type="info" variant="tonal" density="compact">
      AntV L7/LarkMap needs a Mapbox or AMap token in the reference app. This page keeps the same
      POI-layer demo and dark basemap with Leaflet, so it runs without a token.
    </v-alert>
    <div class="demo-map l7-map">
      <div ref="el" class="map-canvas" />
      <v-card class="l7-card" variant="flat">
        <div class="l7-title">L7-style point layer</div>
        <div class="l7-sub">{{ points.length }} POI · radius by value</div>
        <div v-for="category in categories" :key="category.key" class="l7-row">
          <span class="dot" :style="{ background: category.color }" />
          <span>{{ category.key }}</span>
          <span class="mono">{{ points.filter((point) => point.category.key === category.key).length }}</span>
        </div>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.l7-map {
  background: #0b0d12;
}

.map-canvas {
  height: 100%;
  width: 100%;
}

.l7-card {
  position: absolute;
  left: 16px;
  top: 16px;
  z-index: 500;
  width: 240px;
  padding: 12px 14px;
  background: rgba(15, 23, 42, 0.92);
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.l7-title {
  font-size: 13px;
  font-weight: 650;
}

.l7-sub {
  font-size: 11px;
  color: #94a3b8;
  margin: 4px 0 10px;
}

.l7-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 3px 0;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.l7-row .mono {
  margin-left: auto;
}
</style>
