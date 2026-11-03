<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { usePageTitle } from '@/composables/usePageTitle'
import PageHeader from '@/components/PageHeader.vue'

type CesiumEntity = Record<string, unknown>

type CesiumViewer = {
  entities: { add: (options: CesiumEntity) => unknown }
  camera: {
    setView: (options: Record<string, unknown>) => void
    flyTo: (options: Record<string, unknown>) => void
  }
  scene: { globe: { enableLighting: boolean } }
  destroy: () => void
}

type CesiumGlobal = {
  Viewer: new (container: HTMLElement, options?: Record<string, unknown>) => CesiumViewer
  UrlTemplateImageryProvider: new (options: Record<string, unknown>) => unknown
  ImageryLayer: new (provider: unknown) => unknown
  Cartesian3: {
    fromDegrees: (lon: number, lat: number, height?: number) => unknown
    fromDegreesArray: (coordinates: number[]) => unknown
  }
  Cartesian2: new (x: number, y: number) => unknown
  Color: { ORANGE: unknown; WHITE: unknown; CYAN: unknown }
}

type CesiumWindow = Window & { Cesium?: CesiumGlobal }

const { t } = useI18n()
const title = usePageTitle('page.title.map')
const el = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const error = ref('')
let viewer: CesiumViewer | null = null
let cesium: CesiumGlobal | null = null

const cities = [
  { name: 'Beijing', lon: 116.4074, lat: 39.9042 },
  { name: 'Shanghai', lon: 121.4737, lat: 31.2304 },
  { name: 'Guangzhou', lon: 113.2644, lat: 23.1291 },
  { name: 'Chengdu', lon: 104.0668, lat: 30.5728 },
  { name: 'Xi’an', lon: 108.9398, lat: 34.3416 },
]

function loadCesium(): Promise<CesiumGlobal> {
  const cesiumWindow = window as CesiumWindow
  if (cesiumWindow.Cesium) return Promise.resolve(cesiumWindow.Cesium)
  return new Promise((resolve, reject) => {
    const base = `${import.meta.env.BASE_URL}cesium-package/`.replace(/\/{2,}/g, '/')
    cesiumWindow.CESIUM_BASE_URL = base
    const script = document.createElement('script')
    script.src = `${base}Cesium.js`
    script.async = true
    script.onload = () => {
      if (cesiumWindow.Cesium) resolve(cesiumWindow.Cesium)
      else reject(new Error('Cesium global missing'))
    }
    script.onerror = () => reject(new Error('Cesium.js failed to load'))
    document.head.appendChild(script)
  })
}

function addScene(api: CesiumGlobal, instance: CesiumViewer) {
  cities.forEach((city) => {
    instance.entities.add({
      position: api.Cartesian3.fromDegrees(city.lon, city.lat, 80000),
      point: {
        pixelSize: 9,
        color: api.Color.ORANGE,
        outlineColor: api.Color.WHITE,
        outlineWidth: 2,
      },
      label: {
        text: city.name,
        font: '12px sans-serif',
        fillColor: api.Color.WHITE,
        pixelOffset: new api.Cartesian2(0, -18),
        style: 2,
      },
    })
  })

  instance.entities.add({
    polyline: {
      positions: api.Cartesian3.fromDegreesArray(
        cities.flatMap((city) => [city.lon, city.lat]),
      ),
      width: 2,
      material: api.Color.CYAN,
    },
  })
}

async function init() {
  if (!el.value) return
  try {
    const api = await loadCesium()
    cesium = api
    const provider = new api.UrlTemplateImageryProvider({
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      maximumLevel: 19,
      credit: '© OpenStreetMap contributors',
    })
    viewer = new api.Viewer(el.value, {
      baseLayer: new api.ImageryLayer(provider),
      animation: false,
      timeline: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      baseLayerPicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      shouldAnimate: true,
    })
    viewer.scene.globe.enableLighting = false
    viewer.camera.setView({
      destination: api.Cartesian3.fromDegrees(108, 32, 9_000_000),
    })
    addScene(api, viewer)
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Cesium failed to load'
  } finally {
    loading.value = false
  }
}

function flyTo(city: { lon: number; lat: number }) {
  if (!viewer || !cesium) return
  viewer.camera.flyTo({
    destination: cesium.Cartesian3.fromDegrees(city.lon, city.lat, 1_600_000),
    duration: 1.4,
  })
}

function resetView() {
  if (!viewer || !cesium) return
  viewer.camera.flyTo({
    destination: cesium.Cartesian3.fromDegrees(108, 32, 9_000_000),
    duration: 1.2,
  })
}

onMounted(init)

onUnmounted(() => {
  viewer?.destroy()
  viewer = null
})
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('page.map.cesium')" />
    <div class="demo-map cesium-map">
      <div v-if="loading" class="cesium-state">
        <v-progress-circular indeterminate color="primary" />
        <span>Loading Cesium…</span>
      </div>
      <div v-else-if="error" class="cesium-state">
        <v-alert type="error" variant="tonal" :text="error" max-width="440" />
        <p class="demo-note">Cesium assets are copied to /cesium-package by vite-plugin-cesium-build.</p>
      </div>
      <div v-show="!loading && !error" ref="el" class="map-canvas" />
      <v-card v-if="!loading && !error" class="cesium-card" variant="flat">
        <div class="cesium-title">CesiumJS · OSM imagery</div>
        <div class="cesium-actions">
          <v-btn
            v-for="city in cities"
            :key="city.name"
            size="x-small"
            variant="tonal"
            color="primary"
            @click="flyTo(city)"
          >
            {{ city.name }}
          </v-btn>
          <v-btn size="x-small" variant="outlined" @click="resetView">Reset</v-btn>
        </div>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.cesium-map {
  background: #05070d;
}

.map-canvas {
  height: 100%;
  width: 100%;
}

.cesium-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #cbd5e1;
}

.cesium-card {
  position: absolute;
  left: 16px;
  top: 16px;
  z-index: 500;
  width: 300px;
  padding: 12px 14px;
  background: rgba(15, 23, 42, 0.92);
  color: #e2e8f0;
  border: 1px solid rgba(56, 189, 248, 0.25);
}

.cesium-title {
  font-size: 13px;
  font-weight: 650;
  color: #7dd3fc;
  margin-bottom: 8px;
}

.cesium-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cesium-map :deep(.cesium-viewer-bottom) {
  display: none;
}
</style>
