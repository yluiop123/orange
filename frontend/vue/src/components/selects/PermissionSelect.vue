<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listPermissions } from '@/api/permission'
import type { Permission } from '@/api/types'
import { allTreeIds, buildTree, flattenTree } from '@/lib/tree'

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

const items = computed(() => {
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

  const rows = permissions.value
    .filter((permission) => !excluded.has(permission.id))
    .map((permission) => ({
      id: permission.id,
      name: permission.name,
      path: permission.path,
      type: permission.type ?? 'menu',
      parentId: permission.parentId,
    }))
  const tree = buildTree(rows, { id: (row) => row.id, parentId: (row) => row.parentId })
  const expanded = new Set(allTreeIds(tree))
  return flattenTree(tree, expanded).map(({ row, depth }) => ({
    title: `${'— '.repeat(depth)}${row.name} · ${row.path}${row.type === 'action' ? `:${row.id}` : ''}`,
    value: row.id,
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
  <v-select
    :model-value="modelValue"
    :items="items"
    item-title="title"
    item-value="value"
    :label="label || t('page.system.user.header.permissions')"
    :disabled="disabled"
    :loading="loading"
    :multiple="multiple"
    :chips="multiple"
    density="comfortable"
    variant="outlined"
    hide-details="auto"
    @update:model-value="(value) => emit('update:modelValue', multiple ? (value ?? []) : (value ?? ''))"
  />
</template>
