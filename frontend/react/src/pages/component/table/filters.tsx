// DataTable.tsx
"use client"

import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable
} from "@tanstack/react-table"

import { Input } from "@/components/ui/input"
import { useState } from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Person = {
  id: number
  firstName: string
  lastName: string
  age: number
  status: "single" | "relationship" | "complicated"
}
const data: Person[] = [
  {
    id: 1,
    firstName: "Alice",
    lastName: "Smith",
    age: 24,
    status: "single",
  },
  {
    id: 2,
    firstName: "Bob",
    lastName: "Johnson",
    age: 32,
    status: "relationship",
  },
  {
    id: 3,
    firstName: "Carol",
    lastName: "White",
    age: 28,
    status: "complicated",
  },
]

const columns: ColumnDef<Person, unknown>[] = [
  {
    header: "Name",
    columns: [
      {
        accessorKey: "firstName",
        header: "First Name",
      },
      {
        accessorKey: "lastName",
        header: "Last Name",
      },
    ],
  },
  {
    header: "Info",
    columns: [
      {
        accessorKey: "age",
        header: "Age",
      },
      {
        accessorKey: "status",
        header: "Status",
      },
    ],
  },
]

function ColumnFilter<TData>({
  column,
}: {
  column: Column<TData, unknown>
}) {
  return (
    <Input
      value={(column.getFilterValue() ?? "") as string}
      onChange={(e) => column.setFilterValue(e.target.value)}
      placeholder="Filter..."
      className="h-8 text-xs"
    />
  )
}
export default function FiltersTable() {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        {/* sticky header */}
        <TableHeader className="sticky top-0 bg-background z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="border-r last:border-r-0 align-bottom"
                >
                  {header.isPlaceholder ? null : (
                    <div className="space-y-1">
                      <div className="font-medium">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </div>

                      {header.column.getCanFilter() && (
                        <ColumnFilter column={header.column} />
                      )}
                    </div>
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
                className="hover:bg-muted/50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="border-r last:border-r-0"
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="text-center text-muted-foreground h-24"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
