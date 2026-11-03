<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { setLocale, type AppLocale } from '@/i18n'
import { useAccess } from '@/composables/useAccess'
import { useAuthStore } from '@/stores/auth'
import { useMenuStore } from '@/stores/menu'
import { useUiStore } from '@/stores/ui'
import { findMenuChain } from '@/lib/menu'
import { isSamePath } from '@/lib/path'
import ChangePasswordDialog from '@/components/ChangePasswordDialog.vue'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const menuStore = useMenuStore()
const ui = useUiStore()
const access = useAccess()

const changePasswordOpen = ref(false)

const breadcrumbs = computed(() => {
  const chain = findMenuChain(menuStore.menus, route.path)
  const items =
    chain.length > 0
      ? chain.map((node, index) => ({
          title: node.name,
          to: index === chain.length - 1 ? undefined : node.path,
          disabled: index === chain.length - 1,
        }))
      : [{ title: route.path === '/' ? 'ORANGE' : route.path, disabled: true }]
  return items
})

const roleItems = computed(() => [
  { title: t('header.role.all'), value: 'all' },
  ...auth.roles.map((role) => ({ title: role.name || role.id, value: role.id })),
])

const currentRole = computed(() => auth.userInfo?.currentRole ?? 'all')
const displayName = computed(() => auth.userInfo?.name || auth.userInfo?.username || 'ORANGE')
const initial = computed(() => displayName.value.slice(0, 1).toUpperCase())

const containerPaths = ['/', '/dashboard', '/chart', '/map', '/three', '/component', '/system']

function onRoleChange(role: string) {
  auth.setRole(role)
  const path = route.path
  if (containerPaths.some((item) => isSamePath(item, path))) return
  if (!access.canView(path)) {
    const target = access.firstVisibleLeaf(menuStore.menus)
    router.replace(target ?? '/forbidden')
  }
}

function switchLocale(next: AppLocale) {
  setLocale(next)
  // Backend menu and role names are localized by the Locale header, so refetch them.
  menuStore.clearMenus()
  void menuStore.fetchMenus()
  void auth.fetchUser()
}

async function logout() {
  auth.logout()
  await router.replace('/login')
}
</script>

<template>
  <v-app-bar flat height="64" class="app-header">
    <v-app-bar-nav-icon
      :aria-label="ui.sidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')"
      @click="ui.toggleSidebar()"
    >
      <v-icon>{{ ui.sidebarCollapsed ? 'mdi-menu' : 'mdi-menu-open' }}</v-icon>
    </v-app-bar-nav-icon>

    <v-breadcrumbs :items="breadcrumbs" density="compact" class="header-breadcrumbs">
      <template #divider>
        <v-icon size="16">mdi-chevron-right</v-icon>
      </template>
    </v-breadcrumbs>

    <v-spacer />

    <v-select
      :model-value="currentRole"
      :items="roleItems"
      density="compact"
      variant="outlined"
      hide-details
      class="role-switch"
      :aria-label="t('header.roleSwitch')"
      @update:model-value="onRoleChange"
    />

    <v-menu location="bottom end">
      <template #activator="{ props: activatorProps }">
        <v-btn
          v-bind="activatorProps"
          variant="text"
          :aria-label="t('header.language')"
          prepend-icon="mdi-translate"
        >
          <span class="d-none d-sm-inline">{{ locale === 'en' ? 'EN' : '中文' }}</span>
        </v-btn>
      </template>
      <v-list density="compact">
        <v-list-item
          :active="locale === 'zh'"
          title="中文"
          @click="switchLocale('zh')"
        />
        <v-list-item :active="locale === 'en'" title="English" @click="switchLocale('en')" />
      </v-list>
    </v-menu>

    <v-btn
      icon
      variant="text"
      :aria-label="ui.dark ? t('header.theme.light') : t('header.theme.dark')"
      @click="ui.setDark(!ui.dark)"
    >
      <v-icon>{{ ui.dark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
    </v-btn>

    <v-menu location="bottom end">
      <template #activator="{ props: activatorProps }">
        <v-btn v-bind="activatorProps" variant="text" class="user-button">
          <v-avatar size="30" color="primary" class="mr-2">
            <span class="text-caption font-weight-bold">{{ initial }}</span>
          </v-avatar>
          <span class="d-none d-md-inline text-body-2">{{ displayName }}</span>
          <v-icon end size="18">mdi-chevron-down</v-icon>
        </v-btn>
      </template>
      <v-list density="compact" min-width="220">
        <v-list-item
          :title="auth.userInfo?.username || '—'"
          :subtitle="auth.userInfo?.groupName || ''"
        />
        <v-divider />
        <v-list-item
          prepend-icon="mdi-lock-reset"
          :title="t('sidebar.user.changePassword')"
          @click="changePasswordOpen = true"
        />
        <v-list-item
          prepend-icon="mdi-logout"
          :title="t('sidebar.user.logout')"
          @click="logout"
        />
      </v-list>
    </v-menu>

    <ChangePasswordDialog v-model="changePasswordOpen" />
  </v-app-bar>
</template>

<style scoped>
.app-header {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.5);
  backdrop-filter: blur(8px);
}

.header-breadcrumbs {
  padding-inline: 4px;
}

.role-switch {
  max-width: 190px;
  min-width: 130px;
  margin-inline-end: 8px;
}

.user-button {
  text-transform: none;
  letter-spacing: 0;
}

@media (max-width: 700px) {
  .header-breadcrumbs {
    display: none;
  }

  .role-switch {
    max-width: 130px;
  }
}
</style>
