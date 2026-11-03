"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Column,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
  getFilteredRowModel,
  useReactTable
} from "@tanstack/react-table";
import * as React from "react";

// -------------------- 数据类型 --------------------
type Person = {
  firstName: string;
  lastName: string;
  age: number;
  visits: number;
  status: "relationship" | "single" | "complicated";
  progress: number;
};

// -------------------- mock 数据 --------------------
const data: Person[] = [
  {
    firstName: "Tanner",
    lastName: "Linsley",
    age: 36,
    visits: 123,
    status: "relationship",
    progress: 50,
  },
  {
    firstName: "Bob",
    lastName: "Martin",
    age: 28,
    visits: 200,
    status: "single",
    progress: 80,
  },
  {
    firstName: "Alice",
    lastName: "Johnson",
    age: 24,
    visits: 55,
    status: "complicated",
    progress: 20,
  },
];

// -------------------- FacetFilter 组件 --------------------
function FacetFilter<TData>({ column }: { column: Column<TData, unknown> }) {
  const facetValues = Array.from(column.getFacetedUniqueValues().keys());
  const selected = (column.getFilterValue() ?? []) as string[];

  return (
    <div className="flex flex-wrap gap-1">
      {facetValues.map((val) => (
        <Button
          key={String(val)}
          variant="outline"
          size="xs"
          className={cn(
            "text-xs px-2 py-0.5 rounded-md border transition-all",
            selected?.includes(val as string)
              ? "bg-primary text-white border-primary hover:bg-primary/90 hover:text-white"
              : "bg-muted text-muted-foreground border-border"
          )}
          onClick={() => {
            const next = selected?.includes(val as string)
              ? selected.filter((x) => x !== val)
              : [...(selected ?? []), val as string];
            column.setFilterValue(next);
          }}
        >
          {val} ({column.getFacetedUniqueValues().get(val)})
        </Button>
      ))}
    </div>
  );
}


// -------------------- 列定义 --------------------
const columns = [
  {
    accessorKey: "firstName",
    header: "First Name",
  },
  {
    accessorKey: "lastName",
    header: "Last Name",
  },
  {
    accessorKey: "age",
    header: "Age",
  },
  {
    accessorKey: "visits",
    header: "Visits",
  },
  {
    accessorKey: "status",
    header: "Status",
    enableFacetedFilter: true,
  },
  {
    accessorKey: "progress",
    header: "Progress",
  },
];
// -------------------- 主组件 --------------------
export default function FacetedTable() {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
  });

  return (
    <div className="p-6">
      <div className="rounded-md border border-border overflow-auto max-h-125">
        <Table>
          {/* ---------- Sticky Header ---------- */}
          <TableHeader className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="border-r border-border last:border-r-0 align-bottom"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}

            {/* ---------- Facet Filter 行 ---------- */}
            <TableRow className="bg-muted/10">
              {table.getHeaderGroups()[0].headers.map((header) => (
                <TableCell
                  key={header.id}
                  className="border-r border-border last:border-r-0 p-1"
                >
                  {header.column.getCanFilter() &&
                  header.column.getFacetedUniqueValues().size > 0 ? (
                    <FacetFilter column={header.column} />
                  ) : null}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>

          {/* ---------- 表体 ---------- */}
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="border-r border-border last:border-r-0">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getAllLeafColumns().length} className="text-center text-muted-foreground h-20">
                  No results
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
