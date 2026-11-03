import en from '@/locale/en-US';
import zh from '@/locale/zh-CN';
import { create } from "zustand";

type Locale = "zh" | "en";

interface LocaleStore {
  locale: Locale;
  messages: Record<string, string>;
  setLocale: (locale: Locale) => void;
}

const localeMap = {
  zh,
  en,
};
const DEFAULT_LOCALE: Locale = "en";
function getLocal(): Locale {
  // 服务端渲染没有 window/localStorage/navigator，
  // 这里必须直接返回默认语言，不能写 localStorage，也不能提前读 navigator。
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }
  const lang = navigator.language.split("-")[0] as Locale;
  const stored = localStorage.getItem("locale");
  if (!stored) {
    localStorage.setItem("locale", lang);
    return lang;
  }
  return stored as Locale;
}
const useLocaleStore = create<LocaleStore>((set) => {
  const initialLocale = getLocal();
  return {
    locale: initialLocale,
    messages: localeMap[initialLocale],
    setLocale: (locale) => {
      localStorage.setItem("locale", locale);
      set({ locale, messages: localeMap[locale] });
    },
  };
});
export default useLocaleStore;
