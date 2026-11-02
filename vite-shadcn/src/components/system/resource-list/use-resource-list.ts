import { useEffect, useRef, useState } from "react";
import type { PageResult } from "@/api/types";
import { buildTree, type TreeConfig } from "./tree";
import type { ResourceFetcher } from "./types";

type UseResourceListOptions<TParams, TRow> = {
  params: TParams;
  fetcher: ResourceFetcher<TParams, TRow>;
  errorMessage: string;
  tree?: TreeConfig<TRow>;
};

type UseResourceListState<TRow> = {
  data: PageResult<TRow>;
  loading: boolean;
  error: string | null;
};

const emptyData = <TRow,>(): PageResult<TRow> => ({
  list: [],
  total: 0,
});

/**
 * 统一列表取数：参数变化自动重新请求，组件卸载/参数变化时取消旧请求。
 * 树形数据通过 tree 配置在模块内部构造，页面不需要重复 buildTree。
 */
export function useResourceList<TParams extends { page: number; size: number }, TRow>({
  params,
  fetcher,
  errorMessage,
  tree,
}: UseResourceListOptions<TParams, TRow>) {
  const [state, setState] = useState<UseResourceListState<TRow>>({
    data: emptyData<TRow>(),
    loading: true,
    error: null,
  });
  const [version, setVersion] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const treeRef = useRef(tree);
  treeRef.current = tree;
  const errorMessageRef = useRef(errorMessage);
  errorMessageRef.current = errorMessage;

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const timer = window.setTimeout(() => {
      fetcherRef
        .current(params, controller.signal)
        .then((result) => {
          if (controller.signal.aborted) return;
          const normalized: PageResult<TRow> = Array.isArray(result)
            ? { list: result, total: result.length }
            : result;
          const list = treeRef.current
            ? buildTree(normalized.list, treeRef.current)
            : normalized.list;
          setState({
            data: { ...normalized, list },
            loading: false,
            error: null,
          });
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setState((prev) => ({
            ...prev,
            loading: false,
            error: errorMessageRef.current,
          }));
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [params, version]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch: () => setVersion((current) => current + 1),
  };
}
