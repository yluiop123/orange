<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/stores/ui'

const props = defineProps<{
  modelValue: boolean
  password: string
  username?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const { t } = useI18n()
const ui = useUiStore()

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

async function copy() {
  try {
    await navigator.clipboard.writeText(props.password)
    ui.notify(t('password.dialog.copied'), 'success')
  } catch {
    ui.notify(t('password.dialog.copy.failed'), 'error')
  }
}
</script>

<template>
  <v-dialog v-model="open" max-width="520">
    <v-card :title="t('password.dialog.title')">
      <v-card-text>
        <p class="mb-3 text-body-2">
          {{ t('password.dialog.desc', { username: username || '—' }) }}
        </p>
        <div class="password-row">
          <code class="password">{{ password }}</code>
          <v-btn
            icon="mdi-content-copy"
            variant="text"
            :aria-label="t('password.dialog.copy')"
            @click="copy"
          />
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="open = false">{{ t('button.close') }}</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-content-copy"
          @click="copy"
        >
          {{ t('password.dialog.copy') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.password-row {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px dashed rgba(var(--v-border-color), 0.6);
  border-radius: 8px;
  padding: 8px 8px 8px 16px;
}

.password {
  flex: 1;
  font-size: 18px;
  letter-spacing: 2px;
  word-break: break-all;
}
</style>
