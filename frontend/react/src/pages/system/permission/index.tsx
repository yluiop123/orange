import { deletePermissions, listPermissions, updatePermission } from "@/api/system/permission";
import type { PermissionQuery } from "@/api/system/permission";
import ActionAuth from "@/components/action-auth";
import { ConfirmDeleteDialog } from "@/components/system/confirm-delete-dialog";
import { ResourceTable, StatusSwitch } from "@/components/system/resource-list";
import type { ListParams } from "@/components/system/resource-list";
import { useResourcePage } from "@/components/system/resource-list/use-resource-page";
import { StatusFilter } from "@/components/system/status-filter";
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
import { formatDateTime } from "@/lib/date-time";
import type { Status } from "@/lib/status";
import { useLocaleStore } from "@/store";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useIntl } from "react-intl";
import AddChildDialog from "./add-child-dialog";
import EditDialog from "./edit-dialog";

type Permission = {
  name: string
  translations?: Record<string, string>
  id: string
  path?: string
  type?: string
  action?: string
  status?: Status
  createTime?: string,
  parentId?: string | null
  subRows?: Permission[]
}

type TableParams = ListParams<PermissionQuery>;

const PERMISSION_TYPES = [
  { value: 'all', label: 'dict.status.all' },
  { value: 'directory', label: 'dict.permissionType.directory' },
  { value: 'menu', label: 'dict.permissionType.menu' },
  { value: 'action', label: 'dict.permissionType.action' },
];

export default function Permission() {
  const { formatMessage } = useIntl();
  const {
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
  } = useResourcePage<Permission, TableParams>({
    initialParams: {
      page: 1,
      size: 10,
      id: '',
      name: '',
      status: 'all',
      path: '',
      type: 'all',
    },
    fetcher: (query, signal) =>
      listPermissions(
        {
          id: query.id,
          name: query.name,
          path: query.path,
          status: query.status,
          type: query.type,
        },
        signal,
      ),
    errorMessage: formatMessage({ id: 'table.loadError' }),
    tree: {
      id: (row) => row.id,
      parentId: (row) => row.parentId,
    },
    getRowId: (row) => row.id,
    labelOf: (row) => row.translations?.[locale] ?? row.name,
    deleteRows: deletePermissions,
    updateStatus: (row, status) => updatePermission(row.id, { status }),
    paginationMode: "client",
    cascadeDelete: true,
  });

  const locale = useLocaleStore((state) => state.locale);

  const [id, setId] = useState('' as string);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddChildDialogOpen, setIsAddChildDialogOpen] = useState(false);

  function handleEdit(row: Permission) {
    setId(row.id);
    setIsEditDialogOpen(true);
  }
  function handleAddChild(row: Permission | null) {
    setId(row?.id || '');
    setIsAddChildDialogOpen(true);
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
        <ActionAuth action="edit">
          <StatusSwitch
            initial={row.getValue("status") as string}
            onChange={(val) => handleStatusChange(row.original, val)} />
        </ActionAuth>
      ),
    },
    {
      accessorKey: "createTime",
      meta: { title: formatMessage({ id: "page.system.permission.header.createTime" }) },
      header: formatMessage({ id: "page.system.permission.header.createTime" }),
      cell: ({ row }) => <div className="capitalize">{formatDateTime(row.getValue("createTime"))}</div>,
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
                {/* 动作权限不能作为父节点 */}
                {permission.type !== 'action' && (
                  <ActionAuth action="add">
                    <DropdownMenuItem onClick={() => handleAddChild(permission)}>{formatMessage({ id: 'button.addChild' })}</DropdownMenuItem>
                  </ActionAuth>
                )}
                <ActionAuth action="edit">
                  <DropdownMenuItem onClick={() => handleEdit(permission)}>{formatMessage({ id: 'button.edit' })}</DropdownMenuItem>
                </ActionAuth>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    }
  ]

  return (
    <div className="flex h-[calc(100svh-4rem)] w-full flex-col p-3">
      <EditDialog id={id} setOpen={setIsEditDialogOpen} open={isEditDialogOpen}
        onSave={refetch} />
      <AddChildDialog id={id} setOpen={setIsAddChildDialogOpen} open={isAddChildDialogOpen}
        onSave={() => updateParams({}, true)} />
      <ConfirmDeleteDialog
        open={deleteTarget.length > 0}
        onOpenChange={(open) => { if (!open) cancelDelete(); }}
        description={deleteDescription}
        pending={deleting}
        onConfirm={confirmDelete}
      />

      <ResourceTable
        data={data.list}
        columns={columns}
        total={data.total}
        page={params.page}
        size={params.size}
        onPageChange={setPage}
        getRowId={(row) => row.id}
        getSubRows={(row) => row.subRows}
        selectionMode="tree"
        paginationMode="client"
        onSelectionChange={setSelectedRows}
        loading={loading}
        error={error}
        onRetry={refetch}
        toolbar={(
          <>
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap" htmlFor="permissionName">{formatMessage({ id: 'page.system.permission.header.name' })}</Label>
              <Input id="permissionName" type="text" placeholder="" value={params.name ?? ''} onChange={(e) => updateParams({ name: e.target.value })} className="w-36" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap" htmlFor="permissionId">{formatMessage({ id: 'page.system.permission.header.id' })}</Label>
              <Input id="permissionId" type="text" placeholder="" value={params.id ?? ''} onChange={(e) => updateParams({ id: e.target.value })} className="w-28" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap" htmlFor="permissionPath">{formatMessage({ id: 'page.system.permission.header.path' })}</Label>
              <Input id="permissionPath" type="text" placeholder="" value={params.path ?? ''} onChange={(e) => updateParams({ path: e.target.value })} className="w-36" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">{formatMessage({ id: 'page.system.permission.header.type' })}</Label>
              <Select
                value={params.type ?? 'all'}
                onValueChange={(value) => updateParams({ type: value || 'all' })}
              >
                <SelectTrigger className="flex items-center">
                  <SelectValue>
                    {formatMessage({
                      id: PERMISSION_TYPES.find((item) => item.value === params.type)?.label
                        ?? 'dict.status.all',
                    })}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PERMISSION_TYPES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {formatMessage({ id: item.label })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">{formatMessage({ id: 'page.system.permission.header.status' })}</Label>
              <StatusFilter value={params.status ?? 'all'} onChange={(status) => updateParams({ status })} />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ActionAuth action="add">
                <Button onClick={() => handleAddChild(null)}>{formatMessage({ id: 'button.add' })}</Button>
              </ActionAuth>
              <ActionAuth action="delete">
                <Button disabled={selectedRows.length === 0} onClick={() => requestDelete(selectedRows)}>{formatMessage({ id: 'button.delete' })}</Button>
              </ActionAuth>
            </div>
          </>
        )}
      />
    </div>
  )
}
