<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="page-header">
    <div>
      <h1>{{ title }}</h1>
      <p v-if="subtitle">{{ subtitle }}</p>
    </div>
    <div class="page-header-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 750;
  letter-spacing: -0.01em;
}

p {
  margin: 4px 0 0;
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
