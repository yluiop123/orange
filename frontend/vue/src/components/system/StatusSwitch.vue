<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { isStatusEnabled, STATUS_DISABLED, STATUS_ENABLED, type Status } from '@/lib/status'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const props = withDefaults(
  defineProps<{
    initial: string
    /** Persists the status; a rejection means the write failed and the switch rolls back. */
    submit: (status: Status) => Promise<unknown> | void
    disabled?: boolean
    subjectName?: string
  }>(),
  { disabled: false, subjectName: '' },
)

const { t } = useI18n()
const enabled = ref(isStatusEnabled(props.initial))
const pending = ref(false)
const confirmOpen = ref(false)

watch(
  () => props.initial,
  (value) => {
    enabled.value = isStatusEnabled(value)
  },
)

/**
 * Flip the switch first, then persist. A failed write restores the previous
 * value so the UI never claims a status the server rejected.
 */
async function commit(value: boolean) {
  enabled.value = value
  pending.value = true
  try {
    await props.submit(value ? STATUS_ENABLED : STATUS_DISABLED)
  } catch {
    // The axios interceptor already showed the error message.
    enabled.value = !value
  } finally {
    pending.value = false
  }
}

function onChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.checked) {
    void commit(true)
    return
  }
  // Keep the switch visually on until the user confirms disabling.
  input.checked = true
  confirmOpen.value = true
}

function confirmDisable() {
  confirmOpen.value = false
  void commit(false)
}
</script>

<template>
  <div class="status-switch">
    <label class="system-switch">
      <input
        class="system-switch__input"
        type="checkbox"
        :checked="enabled"
        :disabled="disabled || pending"
        :aria-label="t('table.toggleStatus')"
        @change="onChange"
      />
      <span class="system-switch__track" aria-hidden="true">
        <span class="system-switch__thumb" />
      </span>
    </label>
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
