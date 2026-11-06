import useThemeStore from '@/store/theme';
import useUserStore from '@/store/user';
import useLocaleStore, { SUPPORTED_LOCALES } from '@/store/locale';
import type { Locale } from '@/store/locale';
import useMenuStore from '@/store/menu';
export { useThemeStore, useUserStore, useLocaleStore, useMenuStore, SUPPORTED_LOCALES };
export type { Locale };
