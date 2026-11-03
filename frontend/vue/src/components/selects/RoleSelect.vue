<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listRoles } from '@/api/role'
import type { Role } from '@/api/types'

withDefaults(
  defineProps<{
    modelValue?: string[]
    disabled?: boolean
    label?: string
  }>(),
  { modelValue: () => [], disabled: false, label: '' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()
const { t } = useI18n()
const roles = ref<Role[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const page = await listRoles({ page: 1, size: 100 })
    roles.value = page.list.filter((role) => role.status !== '0')
  } catch {
    roles.value = []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <v-select
    :model-value="modelValue"
    :items="roles"
    item-title="name"
    item-value="id"
    :label="label || t('page.system.user.header.roles')"
    :disabled="disabled"
    :loading="loading"
    multiple
    chips
    density="comfortable"
    variant="outlined"
    hide-details="auto"
    @update:model-value="(value) => emit('update:modelValue', value ?? [])"
  />
</template>
