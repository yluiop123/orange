<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listGroups } from '@/api/group'
import type { Group } from '@/api/types'
import { buildTree, allTreeIds, flattenTree } from '@/lib/tree'

withDefaults(
  defineProps<{
    modelValue?: string
    disabled?: boolean
    clearable?: boolean
    label?: string
  }>(),
  { modelValue: '', disabled: false, clearable: false, label: '' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const { t } = useI18n()
const groups = ref<Group[]>([])
const loading = ref(false)

const items = computed(() => {
  const tree = buildTree(groups.value, { id: (row) => row.id, parentId: (row) => row.parentId })
  const expanded = new Set(allTreeIds(tree))
  return flattenTree(tree, expanded).map(({ row }) => ({
    title: row.name,
    value: row.id,
  }))
})

onMounted(async () => {
  loading.value = true
  try {
    groups.value = await listGroups()
  } catch {
    groups.value = []
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
    :label="label || t('page.system.user.header.groupName')"
    :disabled="disabled"
    :clearable="clearable"
    :loading="loading"
    density="comfortable"
    variant="outlined"
    hide-details="auto"
    @update:model-value="(value) => emit('update:modelValue', value ?? '')"
  />
</template>
