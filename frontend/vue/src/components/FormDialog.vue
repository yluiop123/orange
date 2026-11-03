<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import GroupSelect from '@/components/selects/GroupSelect.vue'
import PermissionSelect from '@/components/selects/PermissionSelect.vue'
import RoleSelect from '@/components/selects/RoleSelect.vue'
import { extractFieldErrors } from '@/lib/form-errors'
import type { FormField } from './form-types'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    fields: FormField[]
    initialValues?: Record<string, unknown>
    submit: (values: Record<string, unknown>) => Promise<void>
    width?: number
  }>(),
  { initialValues: () => ({}), width: 620 },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const { t } = useI18n()
const values = reactive<Record<string, unknown>>({})
const errors = reactive<Record<string, string>>({})
const submitting = ref(false)

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => {
    if (!submitting.value) emit('update:modelValue', value)
  },
})

function emptyValue(field: FormField): unknown {
  if (field.type === 'roles' || field.type === 'permissions') return []
  return ''
}

function reset() {
  for (const key of Object.keys(values)) delete values[key]
  for (const key of Object.keys(errors)) delete errors[key]
  for (const field of props.fields) {
    values[field.key] = emptyValue(field)
  }
  Object.assign(values, props.initialValues)
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) reset()
  },
  { immediate: true },
)

watch(
  () => props.initialValues,
  () => {
    if (props.modelValue) {
      Object.assign(values, props.initialValues)
    }
  },
  { deep: true },
)

function textValue(key: string): string {
  const value = values[key]
  return value === null || value === undefined ? '' : String(value)
}

function arrayValue(key: string): string[] {
  const value = values[key]
  return Array.isArray(value) ? (value as string[]) : []
}

function setValue(key: string, value: unknown) {
  values[key] = value
  delete errors[key]
}

function validate(): boolean {
  let valid = true
  for (const field of props.fields) {
    const message = field.validate?.(values[field.key], values) ?? null
    if (message) {
      errors[field.key] = message
      valid = false
    } else {
      delete errors[field.key]
    }
  }
  return valid
}

async function handleSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    await props.submit({ ...values })
    emit('update:modelValue', false)
    emit('saved')
  } catch (error) {
    const serverErrors = extractFieldErrors(error)
    for (const [key, message] of Object.entries(serverErrors)) {
      errors[key] = message
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <v-dialog v-model="open" :max-width="width" :persistent="submitting">
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleSubmit">
          <template v-for="field in fields" :key="field.key">
            <v-text-field
              v-if="!field.type || field.type === 'text' || field.type === 'password'"
              :model-value="textValue(field.key)"
              :label="t(field.label)"
              :type="field.type === 'password' ? 'password' : 'text'"
              :disabled="field.disabled || submitting"
              :error-messages="errors[field.key]"
              density="comfortable"
              variant="outlined"
              class="mb-1"
              @update:model-value="(value) => setValue(field.key, value)"
            />

            <v-textarea
              v-else-if="field.type === 'textarea'"
              :model-value="textValue(field.key)"
              :label="t(field.label)"
              :disabled="field.disabled || submitting"
              :error-messages="errors[field.key]"
              rows="3"
              density="comfortable"
              variant="outlined"
              class="mb-1"
              @update:model-value="(value) => setValue(field.key, value)"
            />

            <v-select
              v-else-if="field.type === 'select' || field.type === 'permissionType'"
              :model-value="textValue(field.key)"
              :items="field.options"
              :label="t(field.label)"
              :disabled="field.disabled || submitting"
              :error-messages="errors[field.key]"
              density="comfortable"
              variant="outlined"
              class="mb-1"
              @update:model-value="(value) => setValue(field.key, value)"
            />

            <GroupSelect
              v-else-if="field.type === 'group'"
              :model-value="textValue(field.key)"
              :label="t(field.label)"
              :disabled="field.disabled || submitting"
              class="mb-1"
              @update:model-value="(value) => setValue(field.key, value)"
            />

            <RoleSelect
              v-else-if="field.type === 'roles'"
              :model-value="arrayValue(field.key)"
              :label="t(field.label)"
              :disabled="field.disabled || submitting"
              class="mb-1"
              @update:model-value="(value) => setValue(field.key, value)"
            />

            <PermissionSelect
              v-else-if="field.type === 'permissions'"
              :model-value="arrayValue(field.key)"
              multiple
              :label="t(field.label)"
              :disabled="field.disabled || submitting"
              class="mb-1"
              @update:model-value="(value) => setValue(field.key, value)"
            />

            <PermissionSelect
              v-else-if="field.type === 'permission'"
              :model-value="textValue(field.key)"
              :label="t(field.label)"
              :disabled="field.disabled || submitting"
              class="mb-1"
              @update:model-value="(value) => setValue(field.key, value)"
            />

            <p v-if="errors[field.key] && field.type === 'group'" class="text-error text-caption">
              {{ errors[field.key] }}
            </p>
          </template>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="submitting" @click="open = false">
          {{ t('button.cancel') }}
        </v-btn>
        <v-btn color="primary" variant="flat" :loading="submitting" @click="handleSubmit">
          {{ t('button.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
