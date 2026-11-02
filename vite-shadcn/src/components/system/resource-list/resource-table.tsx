import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type ColumnDef,
  type ExpandedState,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Table as TanStackTable,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { collectTreeIds } from "./tree";

type SelectionMode = "simple" | "tree";

type ResourceTableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData>[];
  total: number;
  page: number;
  size: number;
  onPageChange: (page: number) => void;
  paginationMode?: "server" | "client";
  getRowId?: (row: TData) => string;
  getSubRows?: (row: TData) => TData[] | undefined;
  selectionMode?: SelectionMode;
  onSelectionChange?: (rows: TData[]) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

function toggleTreeRow<TData>(
  row: Row<TData>,
  checked: boolean,
  table: TanStackTable<TData>,
) {
  table.setRowSelection((previous) => {
    const next: RowSelectionState = { ...previous };
    for (const id of collectTreeIds(row)) {
      next[id] = checked;
    }
    let parent = row.getParentRow();
    while (parent) {
      next[parent.id] = parent.subRows.every((child) => next[child.id] === true);
      parent = parent.getParentRow();
    }
    return next;
  });
}

function columnTitle<TData>(column: ColumnDef<TData>) {
  if (typeof column.header === "string") return column.header;
  return column.meta?.title ?? String(column.id ?? "");
}

/**
 * 系统管理列表的表格外壳：选择列、树形展开、排序、列显隐、分页、加载/错误。
 * 页面只提供列定义和数据源。
 */
export function ResourceTable<TData>({
  data,
  columns,
  total,
  page,
  size,
  onPageChange,
  paginationMode = "server",
  getRowId,
  getSubRows,
  selectionMode = "simple",
  onSelectionChange,
  loading = false,
  error = null,
  onRetry,
}: ResourceTableProps<TData>) {
  const intl = useIntl();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: Math.max(0, page - 1),
    pageSize: size,
  });
  const isClientPagination = paginationMode === "client";

  useEffect(() => {
    setPagination({ pageIndex: Math.max(0, page - 1), pageSize: size });
  }, [page, size]);

  const selectionColumn: ColumnDef<TData> = {
    id: "select",
    header: ({ table }) => {
      const tree = selectionMode === "tree";
      const checked = tree
        ? table.getIsAllRowsSelected()
        : table.getIsAllPageRowsSelected();
      const indeterminate = tree
        ? table.getIsSomeRowsSelected()
        : table.getIsSomePageRowsSelected();
      return (
        <Checkbox
          checked={checked}
          indeterminate={indeterminate}
          onCheckedChange={(value) =>
            tree
              ? table.toggleAllRowsSelected(!!value)
              : table.toggleAllPageRowsSelected(!!value)
          }
          aria-label={intl.formatMessage({ id: "table.selectAll" })}
        />
      );
    },
    cell: ({ row, table }) => (
      <Checkbox
        checked={row.getIsSelected()}
        indeterminate={selectionMode === "tree" ? row.getIsSomeSelected() : false}
        onCheckedChange={(value) =>
          selectionMode === "tree"
            ? toggleTreeRow(row, !!value, table)
            : row.toggleSelected(!!value)
        }
        aria-label={intl.formatMessage({ id: "table.selectRow" })}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };

  const expandColumn: ColumnDef<TData> | null = getSubRows
    ? {
        id: "expand",
        header: ({ table }) => (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={table.getToggleAllRowsExpandedHandler()}
            aria-label={intl.formatMessage({ id: "table.expandAll" })}
          >
            {table.getIsAllRowsExpanded() ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        ),
        cell: ({ row }) =>
          row.getCanExpand() ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={row.getToggleExpandedHandler()}
              aria-label={intl.formatMessage({ id: "table.toggleExpand" })}
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          ) : (
            <span className="size-6" />
          ),
        enableSorting: false,
        enableHiding: false,
      }
    : null;

  const table = useReactTable({
    data,
    columns: [
      selectionColumn,
      ...(expandColumn ? [expandColumn] : []),
      ...columns,
    ],
    getRowId,
    getSubRows,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      expanded,
      ...(paginationMode === "client" ? { pagination } : {}),
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    enableRowSelection: true,
    enableSubRowSelection: selectionMode === "tree",
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: isClientPagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getSubRows ? getExpandedRowModel() : undefined,
  });

  const selectionChangeRef = useRef(onSelectionChange);
  selectionChangeRef.current = onSelectionChange;
  const tableRef = useRef(table);
  tableRef.current = table;

  useEffect(() => {
    if (!selectionChangeRef.current) return;
    selectionChangeRef.current(
      tableRef.current.getSelectedRowModel().flatRows.map((row) => row.original),
    );
  }, [rowSelection, data]);

  useEffect(() => {
    // 数据变化（翻页/筛选/刷新）后清空选择，避免隐藏行被误删
    setRowSelection({});
  }, [data]);

  useEffect(() => {
    if (!isClientPagination) return;
    const maxPageIndex = Math.max(0, Math.ceil(data.length / size) - 1);
    setPagination((previous) =>
      previous.pageIndex > maxPageIndex
        ? { ...previous, pageIndex: maxPageIndex }
        : previous,
    );
  }, [data.length, size, isClientPagination]);

  const pageTotal = paginationMode === "client" ? data.length : total;
  const totalPages = Math.max(1, Math.ceil(pageTotal / size));
  const displayPage = isClientPagination ? pagination.pageIndex + 1 : page;
  const selectedCount = table.getSelectedRowModel().flatRows.length;
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  const changePage = (nextPage: number) => {
    if (isClientPagination) {
      setPagination((previous) => ({
        ...previous,
        pageIndex: Math.max(0, nextPage - 1),
      }));
      return;
    }
    onPageChange(nextPage);
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 px-1">
        <p className="text-sm text-destructive">{error}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            {intl.formatMessage({ id: "table.retry" })}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {loading && (
        <p className="px-1 text-sm text-muted-foreground">
          {intl.formatMessage({ id: "table.loading" })}
        </p>
      )}

      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="sm" className="ml-auto" />}
          >
            {intl.formatMessage({ id: "table.columns" })} <ChevronDown />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {columnTitle(column.columnDef)}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  className="h-24 text-center"
                >
                  {loading
                    ? intl.formatMessage({ id: "table.loading" })
                    : intl.formatMessage({ id: "table.empty" })}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-2">
        <div className="text-muted-foreground flex-1 text-sm">
          {intl.formatMessage(
            { id: "table.selectedCount" },
            { selected: selectedCount, total },
          )}
        </div>
        <div className="space-x-2">
          {displayPage} / {totalPages}
          <Button
            variant="outline"
            size="sm"
            onClick={() => changePage(displayPage - 1)}
            disabled={displayPage <= 1}
          >
            {intl.formatMessage({ id: "table.previous" })}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => changePage(displayPage + 1)}
            disabled={displayPage >= totalPages}
          >
            {intl.formatMessage({ id: "table.next" })}
          </Button>
        </div>
      </div>
    </div>
  );
}
