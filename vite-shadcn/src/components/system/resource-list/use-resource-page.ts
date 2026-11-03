import type { Status } from "@/lib/status";
import { useIntl } from "react-intl";
import { toast } from "sonner";
import { useState } from "react";
import { useResourceList } from "./use-resource-list";
import type { ResourceFetcher } from "./types";
import type { TreeConfig } from "./tree";
import { clampPageAfterDelete } from "./page-clamp";

type ResourcePageParams = {
  page: number;
  size: number;
};

type UseResourcePageOptions<TRow, TParams extends ResourcePageParams> = {
  initialParams: TParams;
  fetcher: ResourceFetcher<TParams, TRow>;
  errorMessage: string;
  tree?: TreeConfig<TRow>;
  getRowId: (row: TRow) => string;
  labelOf: (row: TRow) => string;
  deleteRows: (ids: string[]) => Promise<void>;
  updateStatus?: (row: TRow, status: Status) => Promise<unknown>;
  paginationMode?: "server" | "client";
  cascadeDelete?: boolean;
};

/**
 * 系统列表页的统一生命周期：参数、选择、删除、状态写入、页码夹紧和刷新。
 * 页面只提供资源 adapter 和列定义。
 */
export function useResourcePage<TRow, TParams extends ResourcePageParams>({
  initialParams,
  fetcher,
  errorMessage,
  tree,
  getRowId,
  labelOf,
  deleteRows,
  updateStatus,
  paginationMode = "server",
  cascadeDelete = false,
}: UseResourcePageOptions<TRow, TParams>) {
  const intl = useIntl();
  const [params, setParams] = useState<TParams>(initialParams);
  const [selectedRows, setSelectedRows] = useState<TRow[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<TRow[]>([]);
  const [deleting, setDeleting] = useState(false);
  const { data, loading, error, refetch } = useResourceList<TParams, TRow>({
    params,
    fetcher,
    errorMessage,
    tree,
  });

  const updateParams = (patch: Partial<TParams>, resetPage = true) => {
    setParams((previous) => ({
      ...previous,
      ...patch,
      ...(resetPage ? { page: 1 } : {}),
    }));
  };

  const setPage = (page: number) => {
    setParams((previous) => ({ ...previous, page }));
  };

  const requestDelete = (rows: TRow[]) => {
    if (rows.length > 0) {
      setDeleteTarget(rows);
    }
  };

  const cancelDelete = () => setDeleteTarget([]);

  async function confirmDelete() {
    if (deleteTarget.length === 0) {
      return;
    }
    setDeleting(true);
    const ids = deleteTarget.map(getRowId);
    try {
      await deleteRows(ids);
      if (paginationMode === "server" && !cascadeDelete) {
        setParams((previous) => ({
          ...previous,
          page: clampPageAfterDelete(
            data.total,
            ids.length,
            params.size,
            previous.page,
          ),
        }));
      } else {
        refetch();
      }
      setSelectedRows([]);
      setDeleteTarget([]);
      toast.success(intl.formatMessage({ id: "message.success" }));
    } catch {
      // 错误提示由 axios 拦截器统一处理
    } finally {
      setDeleting(false);
    }
  }

  const handleStatusChange = (row: TRow, status: Status) => {
    if (!updateStatus) {
      return Promise.resolve();
    }
    return updateStatus(row, status).then(() => {
      refetch();
    });
  };

  const deleteDescription =
    deleteTarget.length === 1
      ? intl.formatMessage(
          { id: "table.deleteConfirmSingle" },
          { name: labelOf(deleteTarget[0]) },
        )
      : intl.formatMessage(
          { id: "table.deleteConfirm" },
          { count: deleteTarget.length },
        );

  return {
    params,
    updateParams,
    setPage,
    data,
    loading,
    error,
    refetch,
    selectedRows,
    setSelectedRows,
    deleteTarget,
    deleteDescription,
    requestDelete,
    cancelDelete,
    confirmDelete,
    deleting,
    handleStatusChange,
  };
}
