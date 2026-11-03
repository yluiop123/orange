"use client";
import {
    ColumnDef,
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/* ---------------- 数据类型 ---------------- */

type Person = {
  firstName: string;
  lastName: string;
  age: number;
  visits: number;
  status: string;
  progress: number;
};

/* ---------------- 静态数据 ---------------- */

const data: Person[] = [
  {
    firstName: "Tanner",
    lastName: "Linsley",
    age: 24,
    visits: 100,
    status: "relationship",
    progress: 50,
  },
  {
    firstName: "Tandy",
    lastName: "Miller",
    age: 40,
    visits: 40,
    status: "single",
    progress: 80,
  },
  {
    firstName: "Joe",
    lastName: "Dirte",
    age: 45,
    visits: 20,
    status: "complicated",
    progress: 10,
  },
];

/* ---------------- 列分组定义 ---------------- */

const columnHelper = createColumnHelper<Person>();

const columns: ColumnDef<Person>[] = [
  columnHelper.group({
    header: "Name",
    columns: [
      columnHelper.accessor("firstName", {
        header: "First Name",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("lastName", {
        header: "Last Name",
        cell: (info) => info.getValue(),
      }),
    ],
  }),
  columnHelper.group({
    header: "Info",
    columns: [
      columnHelper.accessor("age", {
        header: "Age",
      }),
      columnHelper.group({
        header: "More",
        columns: [
          columnHelper.accessor("visits", {
            header: "Visits",
          }),
          columnHelper.accessor("status", {
            header: "Status",
          }),
          columnHelper.accessor("progress", {
            header: "Progress",
          }),
        ],
      }),
    ],
  }),
];

/* ---------------- 页面组件 ---------------- */

export default function ColumnGroupsStickyTable() {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-6">
      <div className="rounded-md border border-border overflow-auto max-h-90">
        <Table>
          {/* -------- sticky 表头 -------- */}
          <TableHeader className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      "border-r border-border last:border-r-0",
                      "bg-muted/40 text-xs font-medium text-muted-foreground",
                      "h-10"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          {/* -------- 表体 -------- */}
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="hover:bg-muted/50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      "border-r border-border last:border-r-0",
                      "py-2 text-sm"
                    )}
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
