<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageTitle } from '@/composables/usePageTitle'
import PageHeader from '@/components/PageHeader.vue'
import DemoSection from '@/components/demo/DemoSection.vue'

const { t } = useI18n()
const title = usePageTitle('page.title.component')
const slide = ref(0)
const expanded = ref([0])

const svg = (from: string, to: string, label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><text x="50%" y="52%" text-anchor="middle" fill="white" font-family="sans-serif" font-size="34" font-weight="700">${label}</text></svg>`,
  )}`

const images = [
  svg('#f97316', '#f59e0b', 'ORANGE'),
  svg('#0ea5e9', '#22d3ee', 'VUE'),
  svg('#16a34a', '#84cc16', 'VUETIFY'),
]

const events = [
  { time: '09:12', title: 'Deployment completed', text: 'release 2026.11.03 promoted to production.' },
  { time: '10:04', title: 'Role updated', text: 'admin gained action#/system/role:edit.' },
  { time: '11:36', title: 'Login blocked', text: 'Five failures from 203.0.113.8 triggered a 15-minute lock.' },
  { time: '14:20', title: 'Permission tree synced', text: 'Catalog 0005 subtree written to the seed file.' },
]
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('page.component.display')" />

    <v-row dense>
      <v-col cols="12" md="6">
        <DemoSection title="Card & image">
          <v-card class="display-card">
            <v-img :src="images[0]" height="170" cover />
            <v-card-title>ORANGE console</v-card-title>
            <v-card-subtitle>Vue 3 · Vuetify 3 · RBAC</v-card-subtitle>
            <v-card-text class="text-body-2">
              A card combines media, title, supporting text and actions. The image is an inline SVG,
              so the demo works offline.
            </v-card-text>
            <v-card-actions>
              <v-btn variant="text" color="primary">Open</v-btn>
              <v-spacer />
              <v-btn icon="mdi-share-variant-outline" variant="text" aria-label="Share" />
            </v-card-actions>
          </v-card>
        </DemoSection>
      </v-col>

      <v-col cols="12" md="6">
        <DemoSection title="Carousel">
          <v-carousel v-model="slide" height="220" hide-delimiters show-arrows="hover">
            <v-carousel-item v-for="(image, index) in images" :key="image" :src="image" :alt="`Slide ${index + 1}`" />
            <template #prev="{ props: prevProps }">
              <v-btn v-bind="prevProps" icon="mdi-chevron-left" variant="text" aria-label="Previous slide" />
            </template>
            <template #next="{ props: nextProps }">
              <v-btn v-bind="nextProps" icon="mdi-chevron-right" variant="text" aria-label="Next slide" />
            </template>
          </v-carousel>
          <div class="text-caption text-medium-emphasis">Slide {{ slide + 1 }} / {{ images.length }}</div>
        </DemoSection>
      </v-col>
    </v-row>

    <v-row dense>
      <v-col cols="12" lg="7">
        <DemoSection title="Timeline">
          <v-timeline density="compact" side="end">
            <v-timeline-item
              v-for="event in events"
              :key="event.time"
              :dot-color="event.title.includes('blocked') ? 'error' : 'primary'"
              size="small"
            >
              <div class="timeline-time">{{ event.time }}</div>
              <div class="timeline-title">{{ event.title }}</div>
              <div class="timeline-text">{{ event.text }}</div>
            </v-timeline-item>
          </v-timeline>
        </DemoSection>
      </v-col>

      <v-col cols="12" lg="5">
        <DemoSection title="Tooltip & expansion">
          <div class="row">
            <v-tooltip text="Tooltip on top" location="top">
              <template #activator="{ props: tooltipProps }">
                <v-btn v-bind="tooltipProps" variant="outlined">Hover me</v-btn>
              </template>
            </v-tooltip>
            <v-tooltip text="Tooltip on the bottom with a longer description." location="bottom">
              <template #activator="{ props: tooltipProps }">
                <v-chip v-bind="tooltipProps" color="info" variant="tonal">Chip tooltip</v-chip>
              </template>
            </v-tooltip>
          </div>
          <v-expansion-panels v-model="expanded" multiple>
            <v-expansion-panel title="Details" text="Ordered metadata, ownership and audit references." />
            <v-expansion-panel title="History" text="A compact activity log with trace ids." />
          </v-expansion-panels>
        </DemoSection>

        <DemoSection title="Rating & avatars">
          <div class="row">
            <v-rating :model-value="4.5" half-increments color="warning" />
            <span class="text-caption">4.5 / 5</span>
          </div>
          <div class="row">
            <v-avatar color="primary" size="36"><span>OR</span></v-avatar>
            <v-avatar size="36"><v-img :src="images[1]" alt="Vue" /></v-avatar>
            <v-avatar size="36" color="success"><v-icon>mdi-check</v-icon></v-avatar>
          </div>
        </DemoSection>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.display-card {
  overflow: hidden;
}

.timeline-time {
  font-size: 11px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.timeline-title {
  font-size: 13px;
  font-weight: 650;
}

.timeline-text {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
