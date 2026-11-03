import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as authApi from '@/api/auth'
import type { MenuInfo } from '@/api/types'
import type { MenuNode } from '@/lib/access'

function normalize(nodes: MenuInfo[] | undefined): MenuNode[] {
  return (nodes ?? []).map((node) => ({
    id: node.id,
    path: node.path,
    type: node.type,
    name: node.name,
    children: normalize(node.children),
  }))
}

export const useMenuStore = defineStore('menu', () => {
  const menus = ref<MenuNode[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref(false)

  async function fetchMenus() {
    if (loading.value) return
    loading.value = true
    error.value = false
    try {
      menus.value = normalize(await authApi.fetchMenus())
      loaded.value = true
    } catch {
      error.value = true
    } finally {
      loading.value = false
    }
  }

  function clearMenus() {
    menus.value = []
    loading.value = false
    loaded.value = false
    error.value = false
  }

  return { menus, loading, loaded, error, fetchMenus, clearMenus }
})
