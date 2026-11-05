<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAccess } from '@/composables/useAccess'
import { useAuthStore } from '@/stores/auth'
import { useMenuStore } from '@/stores/menu'
import { useUiStore } from '@/stores/ui'
import { findMenuChain } from '@/lib/menu'
import { isSamePath } from '@/lib/path'
import ChangePasswordDialog from '@/components/ChangePasswordDialog.vue'
import MenuTreeItem from './MenuTreeItem.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const menuStore = useMenuStore()
const ui = useUiStore()
const access = useAccess()

const visibleMenus = computed(() => access.visibleMenuTree(menuStore.menus))
const opened = ref<string[]>([])
const changePasswordOpen = ref(false)

const roleItems = computed(() => [
  { title: t('header.role.all'), value: 'all' },
  ...auth.roles.map((role) => ({ title: role.name || role.id, value: role.id })),
])
const currentRole = computed(() => auth.userInfo?.currentRole ?? 'all')
const displayName = computed(() => auth.userInfo?.name || auth.userInfo?.username || 'ORANGE')
const email = computed(() => auth.userInfo?.email || '')

const containerPaths = ['/', '/dashboard', '/chart', '/map', '/three', '/component', '/system']

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

function changeRole(role: string) {
  auth.setRole(role)
  const path = route.path
  if (containerPaths.some((item) => isSamePath(item, path))) return
  if (!access.canView(path)) {
    const target = access.firstVisibleLeaf(menuStore.menus)
    void router.replace(target ?? '/forbidden')
  }
}

function openProfile() {
  ui.notify(t('sidebar.user.profile.todo'), 'info')
}

async function logout() {
  auth.logout()
  await router.replace('/login')
}
</script>

<template>
  <v-navigation-drawer
    :rail="ui.sidebarCollapsed"
    :permanent="true"
    width="256"
    rail-width="48"
    class="app-drawer"
  >
    <div class="sidebar-inner">
      <div class="brand" :class="{ 'brand--rail': ui.sidebarCollapsed }">
        <img src="@/assets/orange.png" alt="ORANGE" class="brand-avatar" />
      </div>

      <div class="menu-region">
        <div v-if="!ui.sidebarCollapsed" class="menu-label">{{ t('sidebar.menu.title') }}</div>
        <div v-if="menuStore.loading && visibleMenus.length === 0" class="drawer-state">
          {{ t('sidebar.menu.loading') }}
        </div>
        <div v-else-if="menuStore.error && visibleMenus.length === 0" class="drawer-state">
          <p>{{ t('sidebar.menu.error') }}</p>
          <v-btn size="small" variant="outlined" class="mt-2" @click="menuStore.fetchMenus()">
            {{ t('sidebar.menu.retry') }}
          </v-btn>
        </div>
        <v-list v-else v-model:opened="opened" density="compact" nav class="menu-list">
          <MenuTreeItem v-for="item in visibleMenus" :key="item.id" :node="item" />
        </v-list>
      </div>

      <div class="sidebar-footer">
        <v-menu location="end" :close-on-content-click="true">
          <template #activator="{ props: activatorProps }">
            <button
              v-bind="activatorProps"
              type="button"
              class="user-card"
              :class="{ 'user-card--rail': ui.sidebarCollapsed }"
              :aria-label="t('header.roleSwitch')"
            >
              <img src="@/assets/orange.png" alt="" class="user-avatar" />
              <div v-if="!ui.sidebarCollapsed" class="user-meta">
                <span class="user-name">{{ displayName }}</span>
                <span class="user-email">{{ email }}</span>
              </div>
              <v-icon v-if="!ui.sidebarCollapsed" size="16" class="user-dots">
                mdi-dots-vertical
              </v-icon>
            </button>
          </template>
          <v-list density="compact" min-width="224" class="user-menu">
            <v-list-item :title="displayName" :subtitle="email" />
            <v-divider />
            <v-list-item
              prepend-icon="mdi-account-circle-outline"
              :title="t('sidebar.user.message')"
              @click="openProfile"
            />
            <v-list-item
              prepend-icon="mdi-key-outline"
              :title="t('sidebar.user.changePassword')"
              @click="changePasswordOpen = true"
            />
            <v-divider />
            <v-list-subheader>{{ t('header.roleSwitch') }}</v-list-subheader>
            <v-list-item
              v-for="role in roleItems"
              :key="role.value"
              :active="currentRole === role.value"
              :title="role.title"
              @click="changeRole(role.value)"
            />
            <v-divider />
            <v-list-item
              prepend-icon="mdi-logout"
              :title="t('sidebar.user.logout')"
              @click="logout"
            />
          </v-list>
        </v-menu>
      </div>
    </div>
    <ChangePasswordDialog v-model="changePasswordOpen" />
  </v-navigation-drawer>
</template>

<style scoped>
.app-drawer {
  height: 100vh;
  max-height: 100vh;
}

.app-drawer :deep(.v-navigation-drawer__content) {
  height: 100%;
  overflow: hidden;
}

.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.brand {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 84px;
  padding: 8px 8px 16px 68px;
}

.brand--rail {
  justify-content: center;
  min-height: 72px;
  padding: 12px 4px;
}

.brand-avatar {
  width: 60px;
  height: 60px;
  border-radius: 999px;
  object-fit: cover;
}

.brand--rail .brand-avatar {
  width: 32px;
  height: 32px;
}

.menu-region {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 8px;
  scrollbar-width: thin;
}

.menu-label {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0;
}

.menu-list :deep(.v-list-item) {
  min-height: 32px;
  height: 32px;
  padding: 0 16px !important;
  border-radius: 8px;
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface));
}

.menu-list :deep(.v-list-item-title) {
  font-size: 14px;
}

.menu-list :deep(.v-list-item__prepend > .v-icon) {
  width: 16px;
  height: 16px;
  font-size: 16px;
  margin-inline-end: 8px;
  opacity: 1;
}

.menu-list :deep(.v-list-item__append > .v-icon) {
  width: 16px;
  height: 16px;
  font-size: 16px;
  opacity: 0.7;
}

.menu-list :deep(.v-list-item--active) {
  background: rgb(var(--v-theme-sidebar-active));
  color: rgb(var(--v-theme-on-surface));
}

.menu-list :deep(.v-list-group--active > .v-list-group__header) {
  color: rgb(var(--v-theme-sidebar-active-foreground));
}

.menu-list :deep(.v-list-group--active > .v-list-group__header) {
  background: transparent !important;
  color: rgb(var(--v-theme-sidebar-active-foreground));
  font-weight: 400;
}

.menu-list :deep(.v-list-item:hover:not(.v-list-item--active)) {
  background: rgb(var(--v-theme-surface-variant));
}

.menu-list :deep(.v-list-group__items) {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0 14px;
  padding: 2px 10px;
  border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.menu-list :deep(.v-list-group__items .v-list-item) {
  min-height: 32px;
  height: 32px;
  padding: 0 16px !important;
  font-size: 14px;
}

.drawer-state {
  padding: 12px 8px;
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.sidebar-footer {
  padding: 8px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.user-card {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 48px;
  padding: 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.user-card:hover {
  background: rgb(var(--v-theme-surface-variant));
}

.user-card--rail {
  justify-content: center;
  padding: 8px 0;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  object-fit: cover;
  flex: none;
}

.user-meta {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  line-height: 1.2;
}

.user-name,
.user-email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
}

.user-email {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.user-dots {
  opacity: 0.7;
}
</style>
