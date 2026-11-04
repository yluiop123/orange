<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    modelValue: string
    width?: number
  }>(),
  { width: 112 },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const { t } = useI18n()

const items = computed(() => [
  { title: t('dict.status.all'), value: 'all' },
  { title: t('dict.status.enabled'), value: '1' },
  { title: t('dict.status.disabled'), value: '0' },
])
</script>

<template>
  <v-select
    :model-value="props.modelValue || 'all'"
    :items="items"
    :style="{ width: `${width}px` }"
    density="compact"
    variant="outlined"
    hide-details
    :aria-label="t('page.system.user.header.status')"
    @update:model-value="(value) => emit('update:modelValue', value || 'all')"
  />
</template>
