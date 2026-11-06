import en from '@/locale/en-US';
import zh from '@/locale/zh-CN';
import { create } from "zustand";

export const SUPPORTED_LOCALES = [
  { id: "zh", label: "中文", htmlLang: "zh-CN", messages: zh },
  { id: "en", label: "English", htmlLang: "en", messages: en },
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number]["id"];

interface LocaleStore {
  locale: Locale;
  messages: Record<string, string>;
  setLocale: (locale: Locale) => void;
}

const localeMap = Object.fromEntries(
  SUPPORTED_LOCALES.map((item) => [item.id, item.messages]),
) as unknown as Record<Locale, Record<string, string>>;

const DEFAULT_LOCALE: Locale = "en";

function localeHtmlLang(locale: Locale): string {
  return SUPPORTED_LOCALES.find((item) => item.id === locale)?.htmlLang ?? locale;
}

function isSupported(value: string): value is Locale {
  return SUPPORTED_LOCALES.some((item) => item.id === value);
}

function getLocal(): Locale {
  // 服务端渲染没有 window/localStorage/navigator，
  // 这里必须直接返回默认语言，不能写 localStorage，也不能提前读 navigator。
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }
  const stored = localStorage.getItem("locale");
  if (stored && isSupported(stored)) {
    return stored;
  }
  const language = navigator.language.split("-")[0];
  const locale = isSupported(language) ? language : DEFAULT_LOCALE;
  localStorage.setItem("locale", locale);
  return locale;
}

const useLocaleStore = create<LocaleStore>((set) => {
  const initialLocale = getLocal();
  if (typeof document !== "undefined") {
    document.documentElement.lang = localeHtmlLang(initialLocale);
  }
  return {
    locale: initialLocale,
    messages: localeMap[initialLocale],
    setLocale: (locale) => {
      localStorage.setItem("locale", locale);
      document.documentElement.lang = localeHtmlLang(locale);
      set({ locale, messages: localeMap[locale] });
    },
  };
});
export default useLocaleStore;
