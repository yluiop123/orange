<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: string
    delta?: string
    icon?: string
    color?: string
    hint?: string
  }>(),
  { delta: '', icon: 'mdi-chart-timeline-variant', color: 'primary', hint: '' },
)
</script>

<template>
  <v-card class="metric-card" variant="flat">
    <div class="metric-top">
      <span class="metric-label">{{ label }}</span>
      <v-avatar :color="color" variant="tonal" size="36">
        <v-icon size="20">{{ icon }}</v-icon>
      </v-avatar>
    </div>
    <div class="metric-value">{{ value }}</div>
    <div class="metric-bottom">
      <v-chip v-if="delta" size="x-small" variant="tonal" :color="delta.startsWith('-') ? 'error' : 'success'">
        {{ delta }}
      </v-chip>
      <span v-if="hint" class="metric-hint">{{ hint }}</span>
    </div>
  </v-card>
</template>

<style scoped>
.metric-card {
  padding: 16px 18px;
  border: 1px solid rgba(var(--v-border-color), 0.6);
  background: rgb(var(--v-theme-surface));
}

.metric-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.metric-label {
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.metric-value {
  font-size: 28px;
  font-weight: 750;
  letter-spacing: -0.02em;
  margin: 8px 0 6px;
}

.metric-bottom {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 22px;
}

.metric-hint {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
