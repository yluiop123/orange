import { computed, ref, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/stores/ui'
import { clampPageAfterDelete } from '@/lib/page-clamp'
import type { Status } from '@/lib/status'
import type { TreeConfig } from '@/lib/tree'
import { useResourceList, type ResourceFetcher } from './useResourceList'

type PageParams = { page: number; size: number }

type Options<TRow, TParams extends PageParams> = {
  initialParams: TParams
  fetcher: ResourceFetcher<TParams, TRow>
  errorMessage: string
  tree?: TreeConfig<TRow>
  getRowId: (row: TRow) => string
  labelOf: (row: TRow) => string
  deleteRows: (ids: string[]) => Promise<void>
  updateStatus?: (row: TRow, status: Status) => Promise<unknown>
  paginationMode?: 'server' | 'client'
  cascadeDelete?: boolean
  canDeleteRow?: (row: TRow) => boolean
}

/**
 * Shared lifecycle for users/roles/groups/permissions:
 * filters, selection, delete confirmation, status writes, page clamp and refresh.
 */
export function useResourcePage<TRow, TParams extends PageParams>(options: Options<TRow, TParams>) {
  const { t } = useI18n()
  const ui = useUiStore()
  const params = ref({ ...options.initialParams }) as Ref<TParams>
  const selectedRows = ref([]) as Ref<TRow[]>
  const deleteTarget = ref([]) as Ref<TRow[]>
  const deleting = ref(false)

  const { list, total, loading, error, refetch } = useResourceList<TParams, TRow>({
    params,
    fetcher: options.fetcher,
    errorMessage: options.errorMessage,
    tree: options.tree,
  })

  function updateParams(patch: Partial<TParams>, resetPage = true) {
    params.value = {
      ...params.value,
      ...patch,
      ...(resetPage ? { page: 1 } : {}),
    }
  }

  function setPage(page: number) {
    params.value = { ...params.value, page }
  }

  function requestDelete(rows: TRow[]) {
    const allowed = options.canDeleteRow ? rows.filter(options.canDeleteRow) : rows
    if (allowed.length !== rows.length) ui.notify(t('message.cannotDeleteSelf'), 'warning')
    if (allowed.length > 0) deleteTarget.value = allowed
  }

  function cancelDelete() {
    deleteTarget.value = []
  }

  async function confirmDelete() {
    if (deleteTarget.value.length === 0) return
    deleting.value = true
    const ids = deleteTarget.value.map(options.getRowId)
    try {
      await options.deleteRows(ids)
      const isServer = (options.paginationMode ?? 'server') === 'server'
      if (isServer && !options.cascadeDelete) {
        const nextPage = clampPageAfterDelete(total.value, ids.length, params.value.size, params.value.page)
        const pageChanged = nextPage !== params.value.page
        if (pageChanged) setPage(nextPage)
        if (!pageChanged) refetch()
      } else {
        refetch()
      }
      selectedRows.value = []
      deleteTarget.value = []
      ui.notify(t('message.success'), 'success')
    } catch {
      // The axios interceptor already reported the server message.
    } finally {
      deleting.value = false
    }
  }

  async function handleStatusChange(row: TRow, status: Status) {
    if (!options.updateStatus) return
    // Let the rejection bubble up: the switch rolls back to the previous value.
    await options.updateStatus(row, status)
    refetch()
  }

  const deleteDescription = computed(() => {
    if (deleteTarget.value.length === 1) {
      return t('table.deleteConfirmSingle', { name: options.labelOf(deleteTarget.value[0]) })
    }
    return t('table.deleteConfirm', { count: deleteTarget.value.length })
  })

  return {
    params,
    updateParams,
    setPage,
    list,
    total,
    loading,
    error,
    refetch,
    selectedRows,
    deleteTarget,
    deleteDescription,
    deleting,
    requestDelete,
    cancelDelete,
    confirmDelete,
    handleStatusChange,
  }
}
