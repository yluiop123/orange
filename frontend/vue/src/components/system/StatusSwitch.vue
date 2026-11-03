<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Status } from '@/lib/status'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const props = withDefaults(
  defineProps<{
    initial: string
    disabled?: boolean
    subjectName?: string
  }>(),
  { disabled: false, subjectName: '' },
)

const emit = defineEmits<{
  change: [status: Status]
}>()

const { t } = useI18n()
const enabled = ref(props.initial === '1')
const confirmOpen = ref(false)

watch(
  () => props.initial,
  (value) => {
    enabled.value = value === '1'
  },
)

function onChange(value: boolean | null) {
  if (value) {
    enabled.value = true
    emit('change', '1')
    return
  }
  // Keep the switch on until the user confirms disabling.
  enabled.value = true
  confirmOpen.value = true
}

function confirmDisable() {
  enabled.value = false
  confirmOpen.value = false
  emit('change', '0')
}
</script>

<template>
  <div class="status-switch">
    <v-switch
      :model-value="enabled"
      color="success"
      density="compact"
      hide-details
      inset
      :disabled="disabled"
      :aria-label="t('table.toggleStatus')"
      @update:model-value="onChange"
    />
    <ConfirmDialog
      v-model="confirmOpen"
      :title="t('table.disableTitle')"
      :description="
        subjectName
          ? t('table.disableConfirmNamed', { name: subjectName })
          : t('table.disableConfirm')
      "
      :confirm-label="t('button.disable')"
      @confirm="confirmDisable"
    />
  </div>
</template>

<style scoped>
.status-switch {
  display: inline-flex;
  align-items: center;
}
</style>
