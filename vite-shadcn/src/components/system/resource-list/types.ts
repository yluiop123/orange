import type { RowData } from "@tanstack/react-table";
import type { PageResult } from "@/api/types";

export type ResourceFetcher<TParams, T> = (
  params: TParams,
  signal: AbortSignal,
) => Promise<PageResult<T> | T[]>;

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** 列显示名称，用于列显隐菜单 */
    title?: string;
  }
}
