<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'
import LocaleSwitcher from './LocaleSwitcher.vue'
import ThemeToggle from './ThemeToggle.vue'
import { useMenuStore } from '@/stores/menu'
import { useUiStore } from '@/stores/ui'
import { findMenuChain } from '@/lib/menu'

const { t } = useI18n()
const route = useRoute()
const menuStore = useMenuStore()
const ui = useUiStore()
const theme = useTheme()

const THEME_COLOR_KEY = 'orange.color'
type ColorEntry = {
  key: string
  hex: string
  darkHex?: string
  lightForeground?: string
  darkForeground?: string
}
const COLORS: readonly ColorEntry[] = [
  { key: 'default', hex: '#18181b' },
  {
    key: 'blue',
    hex: '#2b7fff',
    darkHex: '#155dfc',
    lightForeground: '#eff6ff',
    darkForeground: '#1c398e',
  },
  { key: 'green', hex: '#22c55e' },
  { key: 'orange', hex: '#f97316' },
  { key: 'red', hex: '#ef4444' },
  { key: 'rose', hex: '#f43f5e' },
  { key: 'violet', hex: '#8b5cf6' },
  { key: 'yellow', hex: '#eab308' },
]

const color = ref(localStorage.getItem(THEME_COLOR_KEY) ?? 'default')
const currentColorHex = computed(() => {
  if (color.value === 'default') return ui.dark ? '#fafafa' : '#18181b'
  return COLORS.find((item) => item.key === color.value)?.hex ?? '#18181b'
})

function swatch(key: string) {
  if (key === 'default') return ui.dark ? '#fafafa' : '#18181b'
  return COLORS.find((item) => item.key === key)?.hex ?? '#18181b'
}

function checkColor(key: string) {
  if (key !== 'default') return '#ffffff'
  return ui.dark ? '#18181b' : '#fafafa'
}

function mixColor(hex: string, base: string, ratio: number) {
  const parse = (value: string) => {
    const raw = value.replace('#', '')
    return [0, 2, 4].map((index) => Number.parseInt(raw.slice(index, index + 2), 16))
  }
  const source = parse(hex)
  const target = parse(base)
  const mixed = source.map((channel, index) =>
    Math.round(channel * ratio + target[index] * (1 - ratio)),
  )
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

function applySidebarColor(next: string) {
  const entry = COLORS.find((item) => item.key === next)
  const themes = theme.themes.value
  for (const name of ['light', 'dark'] as const) {
    const isDark = name === 'dark'
    const hex = next === 'default' ? '' : (isDark ? (entry?.darkHex ?? entry?.hex) : entry?.hex) ?? ''
    const base = isDark ? '#18181b' : '#fafafa'
    themes[name].colors['sidebar-active'] = hex
      ? mixColor(hex, base, 0.3)
      : (isDark ? '#27272a' : '#e7e7e7')
    themes[name].colors['sidebar-active-foreground'] = hex
      ? hex
      : (isDark ? '#fafafa' : '#18181b')
  }
}

function setColor(next: string) {
  color.value = next
  localStorage.setItem(THEME_COLOR_KEY, next)
  const entry = COLORS.find((item) => item.key === next)
  const hex = entry?.hex ?? '#18181b'
  const lightPrimary = next === 'default' ? '#18181b' : hex
  const darkPrimary = next === 'default' ? '#fafafa' : (entry?.darkHex ?? hex)
  const lightForeground = next === 'default' ? '#fafafa' : (entry?.lightForeground ?? '#fafafa')
  const darkForeground = next === 'default' ? '#18181b' : (entry?.darkForeground ?? '#18181b')
  theme.themes.value.light.colors.primary = lightPrimary
  theme.themes.value.dark.colors.primary = darkPrimary
  theme.themes.value.light.colors['on-primary'] = lightForeground
  theme.themes.value.dark.colors['on-primary'] = darkForeground
  theme.themes.value.light.colors['sidebar-primary'] = lightPrimary
  theme.themes.value.dark.colors['sidebar-primary'] = darkPrimary
  // React keeps cards on the page background for the neutral palette and on
  // the raised surface for colored palettes.
  const cardSurface = ui.dark
    ? next === 'default'
      ? '#0a0a0a'
      : '#18181b'
    : '#ffffff'
  document.documentElement.style.setProperty('--orange-card-surface', cardSurface)
  applySidebarColor(next)
}

watch(
  () => ui.dark,
  () => setColor(color.value),
)

setColor(color.value)

const breadcrumbs = computed(() => {
  const chain = findMenuChain(menuStore.menus, route.path)
  return chain.length > 0
    ? chain.map((node, index) => ({
        title: node.name,
        to: index === chain.length - 1 ? undefined : node.path,
        disabled: index === chain.length - 1,
      }))
    : [{ title: route.path === '/' ? 'ORANGE' : route.path, disabled: true }]
})

function onLocaleChanged() {
  menuStore.clearMenus()
  void menuStore.fetchMenus()
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

    <v-divider vertical class="header-separator" />

    <v-breadcrumbs :items="breadcrumbs" density="compact" class="header-breadcrumbs">
      <template #divider>
        <v-icon size="16">mdi-chevron-right</v-icon>
      </template>
    </v-breadcrumbs>

    <v-spacer />

    <LocaleSwitcher @changed="onLocaleChanged" />
    <ThemeToggle />

    <v-menu location="bottom end">
      <template #activator="{ props: activatorProps }">
        <button
          v-bind="activatorProps"
          type="button"
          class="header-color"
          aria-label="Theme color"
          :style="{ background: currentColorHex }"
        >
          <v-icon size="16" :color="checkColor(color)">mdi-check-decagram</v-icon>
        </button>
      </template>
      <div class="color-grid">
        <button
          v-for="item in COLORS"
          :key="item.key"
          type="button"
          class="color-swatch"
          :aria-label="item.key"
          :style="{ background: swatch(item.key) }"
          @click="setColor(item.key)"
        >
          <v-icon v-if="color === item.key" size="16" :color="checkColor(item.key)">
            mdi-check-decagram
          </v-icon>
        </button>
      </div>
    </v-menu>

    <a
      class="header-github"
      href="https://github.com/yluiop123/orange"
      target="_blank"
      rel="noopener noreferrer"
    >
      GitHub
    </a>
  </v-app-bar>
</template>

<style scoped>
.app-header {
  border-bottom: 0;
  box-shadow: inset 0 -1px 0 rgba(var(--v-border-color), var(--v-border-opacity));
  padding-inline: 16px 24px;
}

.header-separator {
  height: 16px !important;
  margin-inline: 8px;
}

.header-breadcrumbs {
  padding-inline: 0;
  font-size: 14px;
}

.header-breadcrumbs :deep(.v-breadcrumbs-item) {
  font-size: 14px;
}

.header-breadcrumbs :deep(.v-breadcrumbs-item--disabled) {
  opacity: 1;
  color: rgb(var(--v-theme-on-surface));
}

.header-language {
  min-width: 60px;
  height: 24px !important;
  padding-inline: 8px !important;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  font-size: 12px;
}

.language-menu {
  min-width: 140px;
  padding: 4px;
}

.language-menu :deep(.v-list-item) {
  min-height: 32px;
  height: 32px;
  border-radius: 6px;
  font-size: 14px;
}

.header-theme {
  flex: none;
  margin-inline: 8px;
}

.header-theme :deep(.v-switch__track) {
  width: 32px;
  min-width: 32px;
  height: 18px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.2) !important;
  opacity: 1;
}

.header-theme :deep(.v-switch--on .v-switch__track),
.header-theme :deep(.v-input--dirty .v-switch__track) {
  background: rgb(var(--v-theme-primary)) !important;
}

.header-theme :deep(.v-input--dirty .v-switch__thumb) {
  background: rgb(var(--v-theme-on-primary)) !important;
}

.header-theme :deep(.v-switch__thumb) {
  width: 14px;
  height: 14px;
  background: #fff !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.header-theme :deep(.v-selection-control) {
  min-height: 24px;
}

.header-theme :deep(.v-selection-control__wrapper) {
  width: 32px;
  height: 24px;
}

.header-color {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  min-width: 24px;
  padding: 0;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.15s ease;
  margin-inline-end: 8px;
}

.header-color:hover {
  transform: scale(1.05);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(4, 32px);
  gap: 8px;
  padding: 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 16px 40px -20px rgba(0, 0, 0, 0.45);
}

.color-swatch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.color-swatch:hover {
  transform: scale(1.05);
}

.header-github {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding-inline: 10px;
  border-radius: 8px;
  color: rgb(var(--v-theme-on-surface));
  font-size: 14px;
  text-decoration: none;
}

.header-github:hover {
  background: rgb(var(--v-theme-surface-variant));
}

@media (max-width: 700px) {
  .header-breadcrumbs {
    display: none;
  }

  .header-github {
    display: none;
  }
}
</style>
