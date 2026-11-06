import { createI18n } from 'vue-i18n'
import en from './en-US'
import zh from './zh-CN'

export const SUPPORTED_LOCALES = [
  { id: 'zh', label: '中文', htmlLang: 'zh-CN', messages: zh },
  { id: 'en', label: 'English', htmlLang: 'en', messages: en },
] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]['id']

const STORAGE_KEY = 'locale'

const localeMap = Object.fromEntries(
  SUPPORTED_LOCALES.map((item) => [item.id, item.messages]),
) as unknown as Record<AppLocale, Record<string, string>>

function isSupported(value: string): value is AppLocale {
  return SUPPORTED_LOCALES.some((item) => item.id === value)
}

function htmlLang(locale: AppLocale): string {
  return SUPPORTED_LOCALES.find((item) => item.id === locale)?.htmlLang ?? locale
}

function initialLocale(): AppLocale {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && isSupported(stored)) return stored
  const language = navigator.language.toLowerCase().split('-')[0]
  return isSupported(language) ? language : 'zh'
}

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'zh',
  messages: localeMap,
})

export function setLocale(locale: AppLocale) {
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
  document.documentElement.lang = htmlLang(locale)
}

export function currentLocale(): AppLocale {
  const value = i18n.global.locale.value
  return isSupported(value) ? value : 'zh'
}

document.documentElement.lang = htmlLang(currentLocale())
