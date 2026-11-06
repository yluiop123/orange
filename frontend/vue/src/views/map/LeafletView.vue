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

const cities = [
  { name: '北京 Beijing', coords: [39.9042, 116.4074] as [number, number], value: 92 },
  { name: '上海 Shanghai', coords: [31.2304, 121.4737] as [number, number], value: 86 },
  { name: '广州 Guangzhou', coords: [23.1291, 113.2644] as [number, number], value: 74 },
  { name: '成都 Chengdu', coords: [30.5728, 104.0668] as [number, number], value: 61 },
  { name: '西安 Xi’an', coords: [34.3416, 108.9398] as [number, number], value: 55 },
]

function init() {
  if (!el.value) return
  map = L.map(el.value, { zoomControl: true, attributionControl: true }).setView([35.5, 108.5], 4)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  cities.forEach((city) => {
    L.marker(city.coords)
      .addTo(map as L.Map)
      .bindPopup(`<strong>${city.name}</strong><br/>index ${city.value}`)
  })

  L.polyline(
    cities.map((city) => city.coords),
    { color: '#f97316', weight: 2, dashArray: '6 8', opacity: 0.8 },
  ).addTo(map)

  cities.slice(0, 3).forEach((city, index) => {
    L.circle(city.coords, {
      radius: 120000 + index * 60000,
      color: '#0ea5e9',
      fillColor: '#0ea5e9',
      fillOpacity: 0.08,
      weight: 1,
    }).addTo(map as L.Map)
  })
}

onMounted(init)

onUnmounted(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <div class="orange-page">
    <PageHeader :title="title" :subtitle="t('page.map.leaflet')" />
    <div class="orange-map">
      <div ref="el" class="map-canvas" />
      <v-card class="map-legend" variant="flat">
        <div class="legend-title">{{ t('page.map.leaflet') }}</div>
        <div v-for="city in cities" :key="city.name" class="legend-row">
          <span>{{ city.name }}</span>
          <v-progress-linear :model-value="city.value" color="primary" height="4" rounded class="legend-bar" />
          <span class="mono">{{ city.value }}</span>
        </div>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.map-canvas {
  height: 100%;
  width: 100%;
}

.map-legend {
  position: absolute;
  right: 16px;
  bottom: 16px;
  width: 260px;
  padding: 12px 14px;
  z-index: 500;
  background: rgb(var(--v-theme-surface));
  box-shadow: var(--orange-shadow);
}

.legend-title {
  font-size: 13px;
  font-weight: 650;
  margin-bottom: 8px;
}

.legend-row {
  display: grid;
  grid-template-columns: 1fr 70px 28px;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  margin-bottom: 5px;
}

.legend-bar {
  min-width: 70px;
}
</style>
