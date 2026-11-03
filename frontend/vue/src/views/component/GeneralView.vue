<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { usePageTitle } from '@/composables/usePageTitle'
import PageHeader from '@/components/PageHeader.vue'
import DemoSection from '@/components/demo/DemoSection.vue'

const { t } = useI18n()
const title = usePageTitle('page.title.component')
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('page.component.general')" />

    <DemoSection title="Buttons" subtitle="Variants, colors, sizes, icon buttons and groups">
      <div class="row">
        <v-btn>Default</v-btn>
        <v-btn color="primary">Primary</v-btn>
        <v-btn color="secondary">Secondary</v-btn>
        <v-btn variant="outlined">Outlined</v-btn>
        <v-btn variant="tonal" color="primary">Tonal</v-btn>
        <v-btn variant="text">Text</v-btn>
        <v-btn variant="plain">Plain</v-btn>
        <v-btn color="error" prepend-icon="mdi-delete-outline">Delete</v-btn>
        <v-btn :loading="true" variant="tonal">Loading</v-btn>
        <v-btn disabled>Disabled</v-btn>
      </div>
      <div class="row">
        <v-btn size="x-small" color="primary">x-small</v-btn>
        <v-btn size="small" color="primary">small</v-btn>
        <v-btn color="primary">default</v-btn>
        <v-btn size="large" color="primary">large</v-btn>
        <v-btn size="x-large" color="primary">x-large</v-btn>
        <v-btn icon="mdi-heart-outline" variant="text" aria-label="Favorite" />
        <v-btn icon="mdi-share-variant-outline" variant="tonal" color="info" aria-label="Share" />
        <v-btn append-icon="mdi-chevron-right" variant="outlined">Continue</v-btn>
        <v-btn rounded="pill" color="primary">Pill</v-btn>
      </div>
    </DemoSection>

    <DemoSection title="Chips, badges & avatars">
      <div class="row">
        <v-chip>Default</v-chip>
        <v-chip color="primary" variant="tonal">Tonal</v-chip>
        <v-chip color="success" closable>Closable</v-chip>
        <v-chip prepend-icon="mdi-account">With icon</v-chip>
        <v-chip color="warning" variant="outlined">Outlined</v-chip>
        <v-badge content="12" color="error">
          <v-icon size="28">mdi-bell-outline</v-icon>
        </v-badge>
        <v-badge dot color="success" inline>
          <span>Online</span>
        </v-badge>
      </div>
      <div class="row">
        <v-avatar color="primary" size="40"><span>OR</span></v-avatar>
        <v-avatar color="info" size="40"><v-icon>mdi-account</v-icon></v-avatar>
        <v-avatar size="40" variant="tonal" color="success"><span>V</span></v-avatar>
        <v-avatar size="40" rounded="lg" color="secondary"><span>3D</span></v-avatar>
        <div class="avatar-stack">
          <v-avatar color="primary"><span>A</span></v-avatar>
          <v-avatar color="info"><span>B</span></v-avatar>
          <v-avatar color="success"><span>C</span></v-avatar>
          <v-avatar color="warning"><span>+9</span></v-avatar>
        </div>
      </div>
    </DemoSection>

    <DemoSection title="Typography">
      <div class="text-h3">Heading 3</div>
      <div class="text-h5">Heading 5</div>
      <div class="text-subtitle-1">Subtitle 1 · interface label</div>
      <div class="text-body-1">Body 1 · The quick brown fox jumps over the lazy dog.</div>
      <div class="text-body-2 text-medium-emphasis">Body 2 · Secondary supporting copy.</div>
      <div class="text-caption text-disabled">Caption · metadata and hints</div>
      <div><code class="mono">const orange = 'vue'</code></div>
    </DemoSection>

    <DemoSection title="Floating action">
      <div class="row">
        <v-btn color="primary" icon="mdi-plus" size="large" elevation="6" aria-label="Create" />
        <v-btn color="info" icon="mdi-pencil" size="large" variant="tonal" aria-label="Edit" />
        <v-btn color="success" prepend-icon="mdi-check" rounded="pill" elevation="4">
          Approve
        </v-btn>
      </div>
    </DemoSection>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.avatar-stack {
  display: flex;
}

.avatar-stack :deep(.v-avatar) {
  margin-left: -8px;
  border: 2px solid rgb(var(--v-theme-surface));
}

.avatar-stack :deep(.v-avatar:first-child) {
  margin-left: 0;
}
</style>
