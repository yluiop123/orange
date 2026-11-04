import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import * as vuetifyComponents from 'vuetify/components'
import * as vuetifyDirectives from 'vuetify/directives'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import 'leaflet/dist/leaflet.css'
import 'ol/ol.css'
import '@/styles/main.css'
import '@/styles/system.css'

import App from './App.vue'
import { i18n } from './i18n'
import router from './router'
import { pinia } from './stores/pinia'
import { bootstrapAuth } from './auth/service'
import { onSessionExpired } from './auth/events'
import { useAuthStore } from './stores/auth'

const storedTheme = localStorage.getItem('orange.theme') === 'dark' ? 'dark' : 'light'

const vuetify = createVuetify({
  components: vuetifyComponents,
  directives: vuetifyDirectives,
  theme: {
    defaultTheme: storedTheme,
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#18181b',
          'primary-darken-1': '#27272a',
          secondary: '#f4f4f5',
          accent: '#f4f4f5',
          background: '#ffffff',
          surface: '#ffffff',
          'surface-variant': '#f4f4f5',
          'on-surface': '#18181b',
          'on-surface-variant': '#71717a',
          'on-primary': '#fafafa',
          'on-secondary': '#18181b',
          error: '#ef4444',
          info: '#0284c7',
          success: '#22c55e',
          warning: '#f59e0b',
          border: '#e4e4e7',
          sidebar: '#fafafa',
        },
        variables: {
          'border-color': '#e4e4e7',
          'border-opacity': 1,
          'high-emphasis-opacity': 1,
          'medium-emphasis-opacity': 0.7,
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#fafafa',
          'primary-darken-1': '#e4e4e7',
          secondary: '#27272a',
          accent: '#27272a',
          background: '#0a0a0a',
          surface: '#18181b',
          'surface-variant': '#27272a',
          'on-surface': '#fafafa',
          'on-surface-variant': '#a1a1aa',
          'on-primary': '#18181b',
          'on-secondary': '#fafafa',
          error: '#ef4444',
          info: '#38bdf8',
          success: '#22c55e',
          warning: '#f59e0b',
          border: '#27272a',
          sidebar: '#18181b',
        },
        variables: {
          'border-color': '#ffffff',
          'border-opacity': 0.1,
          'high-emphasis-opacity': 1,
          'medium-emphasis-opacity': 0.7,
        },
      },
    },
  },
  defaults: {
    VCard: { elevation: 0 },
    VTextField: { variant: 'outlined', density: 'comfortable', color: 'primary' },
    VTextarea: { variant: 'outlined', density: 'comfortable', color: 'primary' },
    VSelect: { variant: 'outlined', density: 'comfortable', color: 'primary' },
    VAutocomplete: { variant: 'outlined', density: 'comfortable', color: 'primary' },
    VDialog: { scrim: true },
    VSnackbar: { rounded: 'lg' },
    VCheckboxBtn: { density: 'compact' },
  },
  icons: {
    defaultSet: 'mdi',
  },
})

async function start() {
  if (import.meta.env.VITE_MOCK_ENABLE === 'true') {
    const { installMock } = await import('@/mock')
    installMock()
    console.info('[mock] enabled — local demo data')
  }

  await bootstrapAuth()

  const app = createApp(App)
  app.use(pinia)
  app.use(router)
  app.use(i18n)
  app.use(vuetify)

  onSessionExpired(() => {
    useAuthStore(pinia).clearSession()
    const current = router.currentRoute.value
    if (current.path !== '/login') {
      void router.replace({ path: '/login', query: { redirect: current.fullPath } })
    }
  })

  app.mount('#app')
}

void start()
