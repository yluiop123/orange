import { deletePermissions, listPermissions, movePermission, updatePermission } from "@/api/system/permission";
import ActionAuth from "@/components/action-auth";
import { ResourceTable, StatusSwitch, useResourceList } from "@/components/system/resource-list";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { statusEnum } from "@/lib/dict";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useIntl } from "react-intl";
import { toast } from "sonner";
import AddBrotherDialog from "./add-brother-dialog";
import AddChildDialog from "./add-child-dialog";
import EditDialog from "./edit-dialog";

type Permission = {
  name: string
  id: string
  path?: string
  type?: string
  action?: string
  status?: "0" | "1"
  createTime?: string,
  parentId?: string | null
  order?: number
  subRows?: Permission[]
}

type TableParams = {
  page: number
  size: number
  id?: string
  name?: string
  status?: string
  path?: string
}

export default function Permission() {
  const { formatMessage } = useIntl();
  const [params, setParams] = useState<TableParams>({
    page: 1,
    size: 10,
    id: '',
    name: '',
    status: 'all',
    path: '',
  });

  const { data, loading, error } = useResourceList<TableParams, Permission>({
    params,
    errorMessage: formatMessage({ id: 'table.loadError' }),
    fetcher: (query, signal) =>
      listPermissions(
        { id: query.id, name: query.name, path: query.path, status: query.status },
        signal,
      ),
    tree: {
      id: (row) => row.id,
      parentId: (row) => row.parentId,
      order: (row) => row.order ?? 0,
    },
  });

  const [selectedRows, setSelectedRows] = useState<Permission[]>([]);
  const [id, setId] = useState('' as string);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddBrotherDialogOpen, setIsAddBrotherDialogOpen] = useState(false);
  const [isAddChildDialogOpen, setIsAddChildDialogOpen] = useState(false);

  function handleEdit(row: Permission) {
    setId(row.id);
    setIsEditDialogOpen(true);
  }
  function handleDelete(rows: Permission[]) {
    if (rows.length === 0) {
      return;
    }
    deletePermissions(rows.map((row) => row.id)).then(() => {
      setParams({ ...params, page: 1 });
      setSelectedRows([]);
      toast.success(formatMessage({ id: 'message.success' }));
    })
  }
  function handleStatusChange(row: Permission, status: "0" | "1") {
    return updatePermission(row.id, { status }).then(() => {
      setParams({ ...params });
    })
  }
  function handleAddChild(row: Permission | null) {
    setId(row?.id || '');
    setIsAddChildDialogOpen(true);
  }
  function handleAddBrother(row: Permission) {
    setId(row.id);
    setIsAddBrotherDialogOpen(true);
  }
  function handleMove(row: Permission, direction: 'up' | 'down' | 'top') {
    movePermission(row.id, direction).then(() => {
      setParams({ ...params });
    })
  }

  const columns: ColumnDef<Permission>[] = [
    {
      accessorKey: 'name',
      meta: { title: formatMessage({ id: "page.system.permission.header.name" }) },
      enableSorting: false,
      enableHiding: false,
      header: formatMessage({ id: "page.system.permission.header.name" }),
      cell: ({ row, getValue }) => (
        <div className="flex items-center" style={{ paddingLeft: `${row.depth * 2}rem` }}>
          {getValue<boolean>()}
        </div>
      ),
    },
    {
      accessorKey: "id",
      meta: { title: formatMessage({ id: "page.system.permission.header.id" }) },
      header: formatMessage({ id: "page.system.permission.header.id" }),
      cell: ({ row }) => <div className="lowercase">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "path",
      meta: { title: formatMessage({ id: "page.system.permission.header.path" }) },
      header: formatMessage({ id: "page.system.permission.header.path" }),
      cell: ({ row }) => <div className="lowercase">{row.getValue("path")}</div>,
    },
    {
      accessorKey: "type",
      meta: { title: formatMessage({ id: "page.system.permission.header.type" }) },
      header: formatMessage({ id: "page.system.permission.header.type" }),
      cell: ({ row }) => <div className="lowercase">{row.getValue("type")}</div>,
    },
    {
      accessorKey: "action",
      meta: { title: formatMessage({ id: "page.system.permission.header.action" }) },
      header: formatMessage({ id: "page.system.permission.header.action" }),
      cell: ({ row }) => <div className="lowercase">{row.getValue("action")}</div>,
    },
    {
      accessorKey: "status",
      meta: { title: formatMessage({ id: "page.system.permission.header.status" }) },
      header: formatMessage({ id: "page.system.permission.header.status" }),
      cell: ({ row }) => (
        <StatusSwitch
          initial={row.getValue("status") as string}
          onChange={(val) => {
            handleStatusChange(row.original, val);
          }} />
      ),
    },
    {
      accessorKey: "order",
      meta: { title: formatMessage({ id: "page.system.permission.header.Order" }) },
      header: formatMessage({ id: "page.system.permission.header.Order" }),
      cell: ({ row }) => <div className="lowercase">{row.getValue("order")}</div>,
    },
    {
      accessorKey: "createTime",
      meta: { title: formatMessage({ id: "page.system.permission.header.createTime" }) },
      header: formatMessage({ id: "page.system.permission.header.createTime" }),
      cell: ({ row }) => <div className="capitalize">{row.getValue("createTime")}</div>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const permission = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
              <span className="sr-only">{formatMessage({ id: 'table.openMenu' })}</span>
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{formatMessage({ id: 'table.actions' })}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ActionAuth action="add">
                  <DropdownMenuItem onClick={() => handleAddChild(permission)}>{formatMessage({ id: 'button.addChild' })}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddBrother(permission)}>{formatMessage({ id: 'button.addBrother' })}</DropdownMenuItem>
                </ActionAuth>
                <ActionAuth action="edit">
                  <DropdownMenuItem onClick={() => handleEdit(permission)}>{formatMessage({ id: 'button.edit' })}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMove(permission, 'top')}>{formatMessage({ id: 'button.moveTop' })}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMove(permission, 'up')}>{formatMessage({ id: 'button.moveUp' })}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMove(permission, 'down')}>{formatMessage({ id: 'button.moveDown' })}</DropdownMenuItem>
                </ActionAuth>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    }
  ]

  return (
    <div className="w-full p-3">
      <EditDialog id={id} setOpen={setIsEditDialogOpen} open={isEditDialogOpen}
        onSave={() => setParams({ ...params, page: 1 })} />
      <AddBrotherDialog id={id} setOpen={setIsAddBrotherDialogOpen} open={isAddBrotherDialogOpen}
        onSave={() => setParams({ ...params, page: 1 })} />
      <AddChildDialog id={id} setOpen={setIsAddChildDialogOpen} open={isAddChildDialogOpen}
        onSave={() => setParams({ ...params, page: 1 })} />

      <div className="flex items-center py-3 gap-4">
        <div className="flex items-center gap-4">
          <Label className="whitespace-nowrap" htmlFor="permissionName">{formatMessage({ id: 'page.system.permission.header.name' })}</Label>
          <Input id="permissionName" type="text" placeholder="" value={params.name} onChange={(e) => setParams({ ...params, name: e.target.value })} />
        </div>
        <div className="flex items-center gap-4">
          <Label className="whitespace-nowrap" htmlFor="permissionId">{formatMessage({ id: 'page.system.permission.header.id' })}</Label>
          <Input id="permissionId" type="text" placeholder="" value={params.id} onChange={(e) => setParams({ ...params, id: e.target.value })} />
        </div>
        <div className="flex items-center gap-4">
          <Label className="whitespace-nowrap" htmlFor="permissionPath">{formatMessage({ id: 'page.system.permission.header.path' })}</Label>
          <Input id="permissionPath" type="text" placeholder="" value={params.path} onChange={(e) => setParams({ ...params, path: e.target.value })} />
        </div>
        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap">{formatMessage({ id: 'page.system.permission.header.status' })}</Label>
          <Select
            value={params.status}
            onValueChange={(value) => setParams({ ...params, status: value || '' })}
          >
            <SelectTrigger className="flex items-center">
              <SelectValue placeholder="Status">
                {formatMessage({ id: `dict.status.${statusEnum.get(params.status || 'all') || 'all'}` })}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Array.from(statusEnum).map(([key, value]) => (
                <SelectItem key={key} value={key}>{formatMessage({ id: `dict.status.${value}` })}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ActionAuth action="add">
            <Button onClick={() => handleAddChild(null)}>{formatMessage({ id: 'button.add' })}</Button>
          </ActionAuth>
          <ActionAuth action="delete">
            <Button onClick={() => handleDelete(selectedRows)}>{formatMessage({ id: 'button.delete' })}</Button>
          </ActionAuth>
        </div>
      </div>

      <ResourceTable
        data={data.list}
        columns={columns}
        total={data.total}
        page={params.page}
        size={params.size}
        onPageChange={(page) => setParams({ ...params, page })}
        getRowId={(row) => row.id}
        getSubRows={(row) => row.subRows}
        selectionMode="tree"
        paginationMode="client"
        onSelectionChange={setSelectedRows}
        loading={loading}
        error={error}
      />
    </div>
  )
}
