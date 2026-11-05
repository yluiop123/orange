import { defineStore } from 'pinia'
import { ref } from 'vue'

export type SnackbarColor = 'success' | 'error' | 'warning' | 'info'

const THEME_KEY = 'orange.theme'
const SIDEBAR_KEY = 'orange.sidebar'

export const useUiStore = defineStore('ui', () => {
  const snackbar = ref<{ show: boolean; text: string; color: SnackbarColor }>({
    show: false,
    text: '',
    color: 'success',
  })

  function notify(text: string, color: SnackbarColor = 'success') {
    snackbar.value = { show: true, text, color }
  }

  const forbidden = ref<{ show: boolean; message: string; path: string }>({
    show: false,
    message: '',
    path: '',
  })

  function showForbidden(path: string, message: string) {
    forbidden.value = { show: true, message, path }
  }

  const dark = ref(localStorage.getItem(THEME_KEY) !== 'light')

  function setDark(value: boolean) {
    dark.value = value
    localStorage.setItem(THEME_KEY, value ? 'dark' : 'light')
  }

  const sidebarCollapsed = ref(localStorage.getItem(SIDEBAR_KEY) === '1')

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed.value ? '1' : '0')
  }

  return {
    snackbar,
    notify,
    forbidden,
    showForbidden,
    dark,
    setDark,
    sidebarCollapsed,
    toggleSidebar,
  }
})
