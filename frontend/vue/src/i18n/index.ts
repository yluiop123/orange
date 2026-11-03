import { createI18n } from 'vue-i18n'
import en from './en-US'
import zh from './zh-CN'

export type AppLocale = 'zh' | 'en'

const STORAGE_KEY = 'locale'

function initialLocale(): AppLocale {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'zh' || stored === 'en') return stored
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'zh'
}

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'zh',
  messages: { zh, en },
})

export function setLocale(locale: AppLocale) {
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
}

export function currentLocale(): AppLocale {
  return i18n.global.locale.value === 'en' ? 'en' : 'zh'
}

document.documentElement.lang = currentLocale() === 'zh' ? 'zh-CN' : 'en'
