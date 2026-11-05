<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listPermissions } from '@/api/permission'
import type { Permission } from '@/api/types'
import TreeSelect, { type TreeSelectItem } from './TreeSelect.vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string | string[]
    multiple?: boolean
    disabled?: boolean
    excludeId?: string
    label?: string
  }>(),
  { modelValue: '', multiple: false, disabled: false, excludeId: '', label: '' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string | string[]] }>()
const { t } = useI18n()
const permissions = ref<Permission[]>([])
const loading = ref(false)

const items = computed<TreeSelectItem[]>(() => {
  const excluded = new Set<string>()
  if (props.excludeId) {
    excluded.add(props.excludeId)
    let growing = true
    while (growing) {
      growing = false
      for (const permission of permissions.value) {
        if (permission.parentId && excluded.has(permission.parentId) && !excluded.has(permission.id)) {
          excluded.add(permission.id)
          growing = true
        }
      }
    }
  }
  return permissions.value
    .filter((permission) => !excluded.has(permission.id))
    .map((permission) => ({
      id: permission.id,
      name: permission.name,
      parentId: permission.parentId,
      disabled:
        permission.status === '0'
        || (!props.multiple && permission.type === 'action'),
    }))
})

onMounted(async () => {
  loading.value = true
  try {
    permissions.value = await listPermissions()
  } catch {
    permissions.value = []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <TreeSelect
    :items="items"
    :model-value="modelValue"
    :multiple="multiple"
    filterable
    :placeholder="loading ? t('table.loading') : (label || t('page.system.user.header.permissions'))"
    :disabled="disabled"
    @update:model-value="(value) => emit('update:modelValue', multiple ? (value as string[]) : String(value ?? ''))"
  />
</template>
