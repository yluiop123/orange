<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Deck, MapView, type PickingInfo } from '@deck.gl/core'
import { ColumnLayer, ScatterplotLayer } from '@deck.gl/layers'
import { usePageTitle } from '@/composables/usePageTitle'
import PageHeader from '@/components/PageHeader.vue'

const { t } = useI18n()
const title = usePageTitle('page.title.map')
const el = ref<HTMLDivElement | null>(null)
let deck: Deck<MapView> | null = null

type CityPoint = {
  name: string
  value: number
  coordinates: [number, number]
}

const data: CityPoint[] = [
  { name: 'Beijing', value: 92, coordinates: [116.4074, 39.9042] },
  { name: 'Shanghai', value: 86, coordinates: [121.4737, 31.2304] },
  { name: 'Guangzhou', value: 74, coordinates: [113.2644, 23.1291] },
  { name: 'Chengdu', value: 61, coordinates: [104.0668, 30.5728] },
  { name: 'Xi’an', value: 55, coordinates: [108.9398, 34.3416] },
  { name: 'Shenyang', value: 48, coordinates: [123.4315, 41.8057] },
  { name: 'Kunming', value: 43, coordinates: [102.8329, 24.8801] },
  { name: 'Urumqi', value: 35, coordinates: [87.6168, 43.8256] },
]

onMounted(() => {
  if (!el.value) return

  deck = new Deck({
    parent: el.value,
    views: new MapView({ repeat: true }),
    initialViewState: {
      longitude: 108.5,
      latitude: 34.5,
      zoom: 3.4,
      pitch: 42,
      bearing: -8,
    },
    controller: true,
    layers: [
      new ColumnLayer<CityPoint>({
        id: 'columns',
        data,
        diskResolution: 18,
        radius: 45000,
        extruded: true,
        elevationScale: 2400,
        getPosition: (item) => item.coordinates,
        getElevation: (item) => item.value,
        getFillColor: (item) => [234, 88 + Math.round(item.value * 0.6), 12, 210],
        pickable: true,
      }),
      new ScatterplotLayer<CityPoint>({
        id: 'points',
        data,
        getPosition: (item) => item.coordinates,
        getRadius: 12000,
        radiusMinPixels: 3,
        getFillColor: [56, 189, 248, 220],
        pickable: true,
      }),
    ],
    getTooltip: ({ object }: PickingInfo<CityPoint>) =>
      object ? `${object.name} · ${object.value}` : null,
  })
})

onUnmounted(() => {
  deck?.finalize()
  deck = null
})
</script>

<template>
  <div class="orange-page">
    <PageHeader :title="title" :subtitle="t('page.map.deckgl')" />
    <div class="orange-map deck-map">
      <div ref="el" class="map-canvas" />
      <v-card class="deck-card" variant="flat">
        <div class="deck-title">deck.gl · ColumnLayer</div>
        <div class="deck-note">Drag to orbit · scroll to zoom · hover for values</div>
        <div class="deck-legend">
          <span class="swatch swatch--orange" /> Elevation
          <span class="swatch swatch--blue" /> Nodes
        </div>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.deck-map {
  background: #0b0d12;
}

.map-canvas {
  height: 100%;
  width: 100%;
}

.deck-card {
  position: absolute;
  left: 16px;
  top: 16px;
  z-index: 500;
  width: 280px;
  padding: 12px 14px;
  background: rgba(15, 23, 42, 0.92);
  color: #e2e8f0;
  border: 1px solid rgba(56, 189, 248, 0.25);
}

.deck-title {
  font-size: 13px;
  font-weight: 650;
  color: #7dd3fc;
}

.deck-note {
  font-size: 11px;
  color: #94a3b8;
  margin: 6px 0 10px;
}

.deck-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #cbd5e1;
}

.swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  display: inline-block;
}

.swatch--orange {
  background: #f97316;
}

.swatch--blue {
  background: #38bdf8;
  margin-left: 12px;
}
</style>
