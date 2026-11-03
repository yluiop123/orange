import { useEffect, useRef, useState } from "react";

/**
 * 参考数据加载：AbortController、loading 和竞态处理只写一次。
 * key 变化时重新加载；load 用 ref 保存，避免内联函数导致重复请求。
 */
export function useReferenceData<T>(
  load: (signal: AbortSignal) => Promise<T[]>,
  key?: string,
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    loadRef
      .current(controller.signal)
      .then((rows) => {
        if (!controller.signal.aborted) {
          setData(rows);
        }
      })
      .catch(() => {
        // 错误提示由 axios 拦截器统一处理
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [key]);

  return { data, loading };
}
