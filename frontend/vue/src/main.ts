import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import * as vuetifyComponents from 'vuetify/components'
import * as vuetifyDirectives from 'vuetify/directives'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import 'leaflet/dist/leaflet.css'
import 'ol/ol.css'
import '@/styles/main.css'

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
          primary: '#ea580c',
          'primary-darken-1': '#c2410c',
          secondary: '#0f172a',
          accent: '#f59e0b',
          background: '#f7f7f8',
          surface: '#ffffff',
          'surface-variant': '#f1f1f3',
          'on-surface': '#1f2937',
          'on-surface-variant': '#5b6472',
          'on-primary': '#ffffff',
          'on-secondary': '#ffffff',
          error: '#dc2626',
          info: '#0284c7',
          success: '#16a34a',
          warning: '#d97706',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#fb923c',
          'primary-darken-1': '#ea580c',
          secondary: '#e2e8f0',
          accent: '#fbbf24',
          background: '#0b0d12',
          surface: '#141821',
          'surface-variant': '#1d2230',
          'on-surface': '#e5e7eb',
          'on-surface-variant': '#9aa4b2',
          'on-primary': '#ffffff',
          'on-secondary': '#0b0d12',
          error: '#f87171',
          info: '#38bdf8',
          success: '#4ade80',
          warning: '#fbbf24',
        },
      },
    },
  },
  defaults: {
    VBtn: { rounded: 'lg' },
    VCard: { rounded: 'lg' },
    VTextField: { variant: 'outlined', density: 'comfortable', color: 'primary' },
    VTextarea: { variant: 'outlined', density: 'comfortable', color: 'primary' },
    VSelect: { variant: 'outlined', density: 'comfortable', color: 'primary' },
    VAutocomplete: { variant: 'outlined', density: 'comfortable', color: 'primary' },
    VDialog: { scrim: true },
    VSnackbar: { rounded: 'lg' },
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
