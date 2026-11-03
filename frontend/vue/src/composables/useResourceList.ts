import { onUnmounted, ref, watch, type Ref } from 'vue'
import type { PageResult } from '@/api/types'
import { buildTree, type TreeConfig } from '@/lib/tree'

export type ResourceFetcher<TParams, TRow> = (
  params: TParams,
  signal: AbortSignal,
) => Promise<PageResult<TRow> | TRow[]>

type Options<TParams, TRow> = {
  params: Ref<TParams>
  fetcher: ResourceFetcher<TParams, TRow>
  errorMessage: string
  tree?: TreeConfig<TRow>
  debounceMs?: number
}

/**
 * One request lifecycle for every system list:
 * parameter change -> debounce -> fetch -> cancel stale request.
 * Tree rows are assembled here so pages never duplicate buildTree.
 */
export function useResourceList<TParams extends { page: number; size: number }, TRow>({
  params,
  fetcher,
  errorMessage,
  tree,
  debounceMs = 250,
}: Options<TParams, TRow>) {
  const list = ref([]) as Ref<TRow[]>
  const total = ref(0)
  const loading = ref(true)
  const error = ref<string | null>(null)
  const version = ref(0)
  let controller: AbortController | null = null
  let timer: number | undefined

  async function load() {
    controller?.abort()
    controller = new AbortController()
    const current = controller
    loading.value = true
    error.value = null

    try {
      const result = await fetcher(params.value, current.signal)
      if (current.signal.aborted) return
      const normalized: PageResult<TRow> = Array.isArray(result)
        ? { list: result, total: result.length }
        : result
      list.value = tree ? buildTree(normalized.list, tree) : normalized.list
      total.value = tree ? normalized.list.length : normalized.total
      loading.value = false
    } catch (reason) {
      if (current.signal.aborted) return
      if ((reason as { code?: string })?.code === 'ERR_CANCELED') return
      loading.value = false
      error.value = errorMessage
    }
  }

  watch(
    [params, version],
    () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(load, debounceMs)
    },
    { deep: true, immediate: true },
  )

  onUnmounted(() => {
    window.clearTimeout(timer)
    controller?.abort()
  })

  function refetch() {
    version.value += 1
  }

  return { list, total, loading, error, refetch }
}
