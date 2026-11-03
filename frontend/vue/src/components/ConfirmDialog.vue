<script setup lang="ts">
import { useI18n } from 'vue-i18n'

withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    description: string
    confirmLabel?: string
    pending?: boolean
    confirmColor?: string
  }>(),
  { confirmLabel: '', pending: false, confirmColor: 'error' },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
}>()

const { t } = useI18n()

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="460"
    :persistent="pending"
    @update:model-value="(value) => emit('update:modelValue', value)"
  >
    <v-card :title="title">
      <v-card-text class="text-body-2">{{ description }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="pending" @click="close">{{ t('button.cancel') }}</v-btn>
        <v-btn :color="confirmColor" :loading="pending" variant="flat" @click="emit('confirm')">
          {{ confirmLabel || t('button.confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
