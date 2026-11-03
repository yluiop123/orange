<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageTitle } from '@/composables/usePageTitle'
import PageHeader from '@/components/PageHeader.vue'
import DemoSection from '@/components/demo/DemoSection.vue'

const { t } = useI18n()
const title = usePageTitle('page.title.component')
const panel = ref([0])
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('page.component.layout')" />

    <DemoSection title="Responsive grid" subtitle="v-row / v-col across breakpoints">
      <v-row>
        <v-col cols="12" md="8">
          <div class="box box--primary">cols=12 md=8</div>
        </v-col>
        <v-col cols="12" md="4">
          <div class="box box--info">cols=12 md=4</div>
        </v-col>
      </v-row>
      <v-row>
        <v-col v-for="index in 4" :key="index" cols="6" md="3">
          <div class="box box--muted">cols=6 md=3 · {{ index }}</div>
        </v-col>
      </v-row>
      <v-row dense>
        <v-col v-for="index in 6" :key="index" cols="4" sm="2">
          <div class="box box--small">{{ index }}</div>
        </v-col>
      </v-row>
    </DemoSection>

    <div class="two-col">
      <DemoSection title="Flex utilities" subtitle="Alignment, gap and wrapping">
        <div class="flex-demo">
          <span class="pill">Start</span>
          <span class="pill">Center</span>
          <span class="pill">End</span>
        </div>
        <div class="flex-demo flex-demo--between">
          <span class="pill">Left</span>
          <span class="pill">Right</span>
        </div>
        <div class="flex-demo flex-demo--column">
          <span class="pill">Column</span>
          <span class="pill">Stack</span>
          <span class="pill">Gap 8</span>
        </div>
      </DemoSection>

      <DemoSection title="Elevation & radius">
        <div class="elevation-grid">
          <div v-for="level in 5" :key="level" class="elevation-item" :class="`elevation-${level}`">
            {{ level }}
          </div>
        </div>
        <div class="radius-row">
          <div class="radius-item">0</div>
          <div class="radius-item radius-item--lg">lg</div>
          <div class="radius-item radius-item--pill">pill</div>
        </div>
      </DemoSection>
    </div>

    <DemoSection title="Expansion panels" subtitle="Collapsible content sections">
      <v-expansion-panels v-model="panel" multiple variant="accordion">
        <v-expansion-panel title="Overview" text="A compact summary of the module and its current state." />
        <v-expansion-panel title="Configuration" text="Environment variables, feature flags and access rules." />
        <v-expansion-panel title="Audit" text="Recent writes, actor and trace id for every operation." />
      </v-expansion-panels>
    </DemoSection>

    <DemoSection title="Application layout" subtitle="A page skeleton with header, sidebar and content">
      <div class="app-preview">
        <div class="app-preview__side">
          <span v-for="index in 4" :key="index" class="side-line" :class="{ 'side-line--active': index === 1 }" />
        </div>
        <div class="app-preview__main">
          <div class="app-preview__header" />
          <div class="app-preview__content">
            <div class="content-block" />
            <div class="content-row">
              <div class="content-block" />
              <div class="content-block" />
            </div>
          </div>
        </div>
      </div>
    </DemoSection>
  </div>
</template>

<style scoped>
.box {
  border-radius: 10px;
  padding: 18px;
  color: #fff;
  font-size: 13px;
  text-align: center;
}

.box--primary {
  background: linear-gradient(135deg, #ea580c, #f97316);
}

.box--info {
  background: linear-gradient(135deg, #0369a1, #0ea5e9);
}

.box--muted {
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface));
}

.box--small {
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface));
  padding: 12px;
}

.two-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.flex-demo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border: 1px dashed rgba(var(--v-border-color), 0.8);
  border-radius: 10px;
}

.flex-demo--between {
  justify-content: space-between;
}

.flex-demo--column {
  flex-direction: column;
  align-items: flex-start;
}

.pill {
  background: rgb(var(--v-theme-primary));
  color: #fff;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 12px;
}

.elevation-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.elevation-item {
  width: 62px;
  height: 62px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), 0.5);
}

.radius-row {
  display: flex;
  gap: 12px;
}

.radius-item {
  width: 70px;
  height: 42px;
  display: grid;
  place-items: center;
  background: rgb(var(--v-theme-surface-variant));
  font-size: 12px;
}

.radius-item--lg {
  border-radius: 16px;
}

.radius-item--pill {
  border-radius: 999px;
}

.app-preview {
  display: grid;
  grid-template-columns: 150px 1fr;
  min-height: 210px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), 0.6);
}

.app-preview__side {
  background: rgb(var(--v-theme-surface-variant));
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.side-line {
  height: 10px;
  border-radius: 999px;
  background: rgba(128, 128, 140, 0.28);
}

.side-line--active {
  background: rgb(var(--v-theme-primary));
  width: 76%;
}

.app-preview__main {
  display: flex;
  flex-direction: column;
}

.app-preview__header {
  height: 44px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.5);
}

.app-preview__content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.content-block {
  flex: 1;
  min-height: 48px;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface-variant));
}

.content-row {
  display: flex;
  gap: 12px;
}

@media (max-width: 900px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>
