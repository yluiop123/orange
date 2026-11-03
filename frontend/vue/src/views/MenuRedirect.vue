<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAccess } from '@/composables/useAccess'
import { useMenuStore } from '@/stores/menu'
import { findMenuNode } from '@/lib/menu'

const props = defineProps<{ nodePath?: string }>()
const { t } = useI18n()
const router = useRouter()
const menuStore = useMenuStore()
const access = useAccess()

const target = computed(() => {
  if (!menuStore.loaded) return null
  if (!props.nodePath) return access.firstVisibleLeaf(menuStore.menus)
  const node = findMenuNode(menuStore.menus, props.nodePath)
  return node ? access.firstVisibleLeaf([node]) : null
})

watchEffect(() => {
  if (!menuStore.loaded) return
  const next = target.value
  void router.replace(next ?? '/forbidden')
})
</script>

<template>
  <div class="menu-redirect">
    <v-progress-circular indeterminate color="primary" />
    <p class="mt-3 text-body-2">
      {{ menuStore.error && !menuStore.loaded ? t('sidebar.menu.error') : t('app.loading') }}
    </p>
    <v-btn
      v-if="menuStore.error && !menuStore.loaded"
      variant="outlined"
      size="small"
      class="mt-3"
      @click="menuStore.fetchMenus()"
    >
      {{ t('sidebar.menu.retry') }}
    </v-btn>
  </div>
</template>

<style scoped>
.menu-redirect {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}
</style>
