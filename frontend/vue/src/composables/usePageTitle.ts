import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMenuStore } from '@/stores/menu'
import { findMenuChain } from '@/lib/menu'

/**
 * Page title comes from the backend menu tree first, so the DB remains the
 * single source of truth for menu names.
 */
export function usePageTitle(fallbackKey: string) {
  const route = useRoute()
  const menuStore = useMenuStore()
  const { t } = useI18n()

  return computed(() => {
    const chain = findMenuChain(menuStore.menus, route.path)
    return chain.length > 0 ? chain[chain.length - 1].name : t(fallbackKey)
  })
}
