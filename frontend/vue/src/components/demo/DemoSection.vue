<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <v-card variant="flat" class="demo-section">
    <div class="section-head">
      <div>
        <div class="section-title">{{ title }}</div>
        <div v-if="subtitle" class="section-subtitle">{{ subtitle }}</div>
      </div>
      <slot name="actions" />
    </div>
    <div class="section-body">
      <slot />
    </div>
  </v-card>
</template>

<style scoped>
.demo-section {
  padding: 16px 18px;
  border: 1px solid rgb(var(--v-border-color));
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 650;
}

.section-subtitle {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 2px;
}

.section-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
