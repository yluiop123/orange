<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import LineString from 'ol/geom/LineString'
import { fromLonLat } from 'ol/proj'
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style'
import { usePageTitle } from '@/composables/usePageTitle'
import PageHeader from '@/components/PageHeader.vue'

const { t } = useI18n()
const title = usePageTitle('page.title.map')
const el = ref<HTMLDivElement | null>(null)
let map: Map | null = null

const cities = [
  { name: 'Beijing', lon: 116.4074, lat: 39.9042 },
  { name: 'Shanghai', lon: 121.4737, lat: 31.2304 },
  { name: 'Guangzhou', lon: 113.2644, lat: 23.1291 },
  { name: 'Chengdu', lon: 104.0668, lat: 30.5728 },
  { name: 'Xi’an', lon: 108.9398, lat: 34.3416 },
]

const nodes = computed(() => cities.length)

onMounted(() => {
  if (!el.value) return

  const pointStyle = new Style({
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({ color: '#f97316' }),
      stroke: new Stroke({ color: '#ffffff', width: 2 }),
    }),
  })

  const features: Feature[] = cities.map((city) => {
    const feature = new Feature({
      geometry: new Point(fromLonLat([city.lon, city.lat])),
      name: city.name,
    })
    feature.setStyle(pointStyle)
    return feature
  })

  features.push(
    new Feature({
      geometry: new LineString(cities.map((city) => fromLonLat([city.lon, city.lat]))),
      name: 'route',
    }),
  )

  const vector = new VectorLayer({
    source: new VectorSource({ features }),
    style: new Style({ stroke: new Stroke({ color: '#0ea5e9', width: 2, lineDash: [6, 8] }) }),
  })

  map = new Map({
    target: el.value,
    layers: [
      new TileLayer({
        source: new XYZ({
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          crossOrigin: 'anonymous',
        }),
      }),
      vector,
    ],
    view: new View({ center: fromLonLat([108.5, 35.5]), zoom: 4 }),
  })
})

onUnmounted(() => {
  map?.setTarget(undefined)
  map = null
})
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('page.map.openlayers')" />
    <div class="demo-map">
      <div ref="el" class="map-canvas" />
      <v-card class="map-card" variant="flat">
        <div class="card-title">OpenLayers · XYZ + Vector</div>
        <div class="card-line">
          <span>Vector nodes</span><strong>{{ nodes }}</strong>
        </div>
        <div class="card-line"><span>Projection</span><strong>EPSG:3857</strong></div>
        <div class="card-line"><span>Source</span><strong>OSM</strong></div>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.map-canvas {
  height: 100%;
  width: 100%;
}

.map-card {
  position: absolute;
  left: 16px;
  top: 16px;
  z-index: 500;
  width: 240px;
  padding: 12px 14px;
  background: rgb(var(--v-theme-surface));
  box-shadow: var(--orange-shadow);
}

.card-title {
  font-size: 13px;
  font-weight: 650;
  margin-bottom: 8px;
}

.card-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  padding: 3px 0;
}
</style>
