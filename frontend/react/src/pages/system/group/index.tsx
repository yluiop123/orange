import { deleteGroups, listGroups, updateGroupStatus } from "@/api/system/group";
import type { GroupQuery } from "@/api/system/group";
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
import { formatDateTime } from "@/lib/date-time";
import type { Status } from "@/lib/status";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useIntl } from "react-intl";
import AddChildDialog from "./add-child-dialog";
import EditDialog from "./edit-dialog";

type Group = {
  name: string
  id: string
  status?: Status
  remark?: string
  createTime?: string,
  parentId?: string | null
  subRows?: Group[]
}

type TableParams = ListParams<GroupQuery>;

export default function Group() {
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
  } = useResourcePage<Group, TableParams>({
    initialParams: {
      page: 1,
      size: 10,
      id: '',
      name: '',
      status: 'all'
    },
    fetcher: (query, signal) =>
      listGroups(
        { id: query.id, name: query.name, status: query.status },
        signal,
      ),
    errorMessage: formatMessage({ id: 'table.loadError' }),
    tree: {
      id: (row) => row.id,
      parentId: (row) => row.parentId,
    },
    getRowId: (row) => row.id,
    labelOf: (row) => row.name,
    deleteRows: deleteGroups,
    updateStatus: (row, status) => updateGroupStatus(row.id, status),
    paginationMode: "client",
    cascadeDelete: true,
  });

  const [id, setId] = useState('' as string);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddChildDialogOpen, setIsAddChildDialogOpen] = useState(false);

  function handleEdit(row: Group) {
    setId(row.id);
    setIsEditDialogOpen(true);
  }
  function handleAddChild(row: Group | null) {
    setId(row?.id || '');
    setIsAddChildDialogOpen(true);
  }

  const columns: ColumnDef<Group>[] = [
    {
      accessorKey: 'name',
      meta: { title: formatMessage({ id: "page.system.group.header.name" }) },
      enableSorting: false,
      enableHiding: false,
      header: formatMessage({ id: "page.system.group.header.name" }),
      cell: ({ row, getValue }) => (
        <div className="flex items-center" style={{ paddingLeft: `${row.depth * 2}rem` }}>
          {getValue<boolean>()}
        </div>
      ),
    },
    {
      accessorKey: 'id',
      meta: { title: formatMessage({ id: "page.system.group.header.id" }) },
      header: formatMessage({ id: "page.system.group.header.id" }),
      cell: ({ row }) => <div className="lowercase">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "status",
      meta: { title: formatMessage({ id: "page.system.group.header.status" }) },
      header: formatMessage({ id: "page.system.group.header.status" }),
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
      meta: { title: formatMessage({ id: "page.system.group.header.createTime" }) },
      header: formatMessage({ id: "page.system.group.header.createTime" }),
      cell: ({ row }) => <div className="capitalize">{formatDateTime(row.getValue("createTime"))}</div>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const group = row.original;
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
                  <DropdownMenuItem onClick={() => handleAddChild(group)}>{formatMessage({ id: 'button.addChild' })}</DropdownMenuItem>
                </ActionAuth>
                <ActionAuth action="edit">
                  <DropdownMenuItem onClick={() => handleEdit(group)}>{formatMessage({ id: 'button.edit' })}</DropdownMenuItem>
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
              <Label className="whitespace-nowrap" htmlFor="groupName">{formatMessage({ id: 'page.system.group.header.name' })}</Label>
              <Input id="groupName" type="text" placeholder="" value={params.name ?? ''} onChange={(e) => updateParams({ name: e.target.value })} className="w-40" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap" htmlFor="groupId">{formatMessage({ id: 'page.system.group.header.id' })}</Label>
              <Input id="groupId" type="text" placeholder="" value={params.id ?? ''} onChange={(e) => updateParams({ id: e.target.value })} className="w-32" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">{formatMessage({ id: 'page.system.group.header.status' })}</Label>
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
