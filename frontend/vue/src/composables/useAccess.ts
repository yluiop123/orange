import { computed } from 'vue'
import { createAccess, type MenuNode } from '@/lib/access'
import { useAuthStore } from '@/stores/auth'

/**
 * Reactive access model for the selected role view.
 * Calling these helpers inside a render function tracks permission changes.
 */
export function useAccess() {
  const auth = useAuthStore()
  const access = computed(() => createAccess(auth.currentPermissions))

  return {
    access,
    canView: (path: string) => access.value.canView(path),
    canAct: (path: string, action: string) => access.value.canAct(path, action),
    visibleMenuTree: (nodes: MenuNode[]) => access.value.visibleMenuTree(nodes),
    firstVisibleLeaf: (nodes: MenuNode[]) => access.value.firstVisibleLeaf(nodes),
  }
}
