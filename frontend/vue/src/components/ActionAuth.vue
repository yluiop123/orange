<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAccess } from '@/composables/useAccess'

const props = defineProps<{ action: string }>()
const route = useRoute()
const access = useAccess()
const allowed = computed(() => access.canAct(route.path, props.action))
</script>

<template>
  <slot v-if="allowed" />
</template>
