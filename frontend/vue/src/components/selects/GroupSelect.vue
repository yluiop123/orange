<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { listGroups } from '@/api/group'
import type { Group } from '@/api/types'
import TreeSelect, { type TreeSelectItem } from './TreeSelect.vue'

withDefaults(
  defineProps<{
    modelValue?: string
    disabled?: boolean
    clearable?: boolean
    label?: string
    placeholder?: string
  }>(),
  { modelValue: '', disabled: false, clearable: false, label: '', placeholder: '' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const groups = ref<Group[]>([])
const loading = ref(false)

const items = computed<TreeSelectItem[]>(() =>
  groups.value.map((group) => ({
    id: group.id,
    name: group.name,
    parentId: group.parentId,
    disabled: group.status === '0',
  })),
)

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
  <TreeSelect
    :items="items"
    :model-value="modelValue"
    :placeholder="loading ? '加载中…' : (label || placeholder)"
    :disabled="disabled"
    :allow-empty="clearable"
    empty-label="dict.status.all"
    filterable
    @update:model-value="(value) => emit('update:modelValue', String(value ?? ''))"
  />
</template>
