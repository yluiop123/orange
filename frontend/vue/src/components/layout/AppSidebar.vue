<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAccess } from '@/composables/useAccess'
import { useMenuStore } from '@/stores/menu'
import { useUiStore } from '@/stores/ui'
import { findMenuChain } from '@/lib/menu'
import MenuTreeItem from './MenuTreeItem.vue'

const { t } = useI18n()
const route = useRoute()
const menuStore = useMenuStore()
const ui = useUiStore()
const access = useAccess()

const visibleMenus = computed(() => access.visibleMenuTree(menuStore.menus))
const opened = ref<string[]>([])

function syncOpened() {
  const chain = findMenuChain(menuStore.menus, route.path)
  const next = chain.filter((node) => node.children.length > 0).map((node) => node.id)
  opened.value = [...new Set([...opened.value, ...next])]
}

watch(() => route.path, syncOpened, { immediate: true })
watch(
  () => menuStore.menus,
  () => syncOpened(),
  { deep: true },
)
</script>

<template>
  <v-navigation-drawer
    :rail="ui.sidebarCollapsed"
    :permanent="true"
    width="256"
    rail-width="48"
    class="app-drawer"
  >
    <div class="brand" :class="{ 'brand--rail': ui.sidebarCollapsed }">
      <div class="brand-mark">O</div>
      <div v-if="!ui.sidebarCollapsed" class="brand-text">
        <span class="brand-title">ORANGE</span>
        <span class="brand-subtitle">admin console</span>
      </div>
    </div>

    <v-divider />

    <div v-if="menuStore.loading && visibleMenus.length === 0" class="drawer-state">
      {{ t('sidebar.menu.loading') }}
    </div>
    <div v-else-if="menuStore.error && visibleMenus.length === 0" class="drawer-state">
      <p>{{ t('sidebar.menu.error') }}</p>
      <v-btn size="small" variant="outlined" class="mt-2" @click="menuStore.fetchMenus()">
        {{ t('sidebar.menu.retry') }}
      </v-btn>
    </div>
    <v-list v-else v-model:opened="opened" density="comfortable" nav class="menu-list">
      <MenuTreeItem v-for="item in visibleMenus" :key="item.id" :node="item" />
    </v-list>
  </v-navigation-drawer>
</template>

<style scoped>
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px;
  min-height: 76px;
}

@media (max-width: 600px) {
  .app-drawer:not(.v-navigation-drawer--rail) {
    width: var(--orange-sidebar-mobile-width) !important;
  }
}

.brand--rail {
  justify-content: center;
  padding-inline: 0;
}

.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: var(--orange-radius);
  display: grid;
  place-items: center;
  font-weight: 800;
  color: rgb(var(--v-theme-on-primary));
  background: linear-gradient(135deg, #fb923c, rgb(var(--v-theme-primary)));
  box-shadow: 0 8px 18px -10px rgba(249, 115, 22, 0.55);
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.brand-title {
  font-weight: 800;
  letter-spacing: 0.14em;
  font-size: 14px;
}

.brand-subtitle {
  font-size: 11px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.drawer-state {
  padding: 20px;
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.menu-list {
  padding-top: 8px;
}

.menu-list :deep(.v-list-item) {
  border-radius: 0.5rem;
  margin-block: 2px;
}
</style>
