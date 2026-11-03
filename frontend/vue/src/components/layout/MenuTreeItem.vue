<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getMenuIcon } from '@/config/menu-icons'
import { isSamePath } from '@/lib/path'
import type { MenuNode } from '@/lib/access'

defineOptions({ name: 'MenuTreeItem' })

const props = defineProps<{ node: MenuNode }>()
const route = useRoute()

const icon = computed(() => getMenuIcon(props.node.path, props.node.type))
const leafActive = computed(
  () => props.node.children.length === 0 && isSamePath(route.path, props.node.path),
)
</script>

<template>
  <v-list-group v-if="node.children.length > 0" :value="node.id">
    <template #activator="{ props: activatorProps }">
      <v-list-item
        v-bind="activatorProps"
        :prepend-icon="icon"
        :title="node.name"
        class="menu-item"
      />
    </template>
    <MenuTreeItem v-for="child in node.children" :key="child.id" :node="child" />
  </v-list-group>
  <v-list-item
    v-else
    :to="node.path"
    :prepend-icon="icon"
    :title="node.name"
    :active="leafActive"
    class="menu-item"
  />
</template>
