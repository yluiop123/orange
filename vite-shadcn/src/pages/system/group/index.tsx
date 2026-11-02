import { deleteGroups, listGroups, updateGroupStatus } from "@/api/system/group";
import type { GroupQuery } from "@/api/system/group";
import ActionAuth from "@/components/action-auth";
import { ConfirmDeleteDialog } from "@/components/system/confirm-delete-dialog";
import { ResourceTable, StatusSwitch, useResourceList } from "@/components/system/resource-list";
import type { ListParams } from "@/components/system/resource-list";
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
import { statusEnum } from "@/lib/dict";
import type { Status } from "@/lib/status";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useIntl } from "react-intl";
import { toast } from "sonner";
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
  const [params, setParams] = useState<TableParams>({
    page: 1,
    size: 10,
    id: '',
    name: '',
    status: 'all'
  });

  const { data, loading, error, refetch } = useResourceList<TableParams, Group>({
    params,
    errorMessage: formatMessage({ id: 'table.loadError' }),
    fetcher: (query, signal) =>
      listGroups(
        { id: query.id, name: query.name, status: query.status },
        signal,
      ),
    tree: {
      id: (row) => row.id,
      parentId: (row) => row.parentId,
    },
  });

  const [selectedRows, setSelectedRows] = useState<Group[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Group[]>([]);
  const [deleting, setDeleting] = useState(false);
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
  function requestDelete(rows: Group[]) {
    if (rows.length === 0) {
      return;
    }
    setDeleteTarget(rows);
  }
  async function confirmDelete() {
    if (deleteTarget.length === 0) {
      return;
    }
    setDeleting(true);
    try {
      await deleteGroups(deleteTarget.map((row) => row.id));
      refetch();
      setSelectedRows([]);
      setDeleteTarget([]);
      toast.success(formatMessage({ id: 'message.success' }));
    } finally {
      setDeleting(false);
    }
  }
  function handleStatusChange(row: Group, status: Status) {
    return updateGroupStatus(row.id, status).then(() => {
      setParams(prev => ({ ...prev }));
    })
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
    <div className="w-full p-3">
      <EditDialog id={id} setOpen={setIsEditDialogOpen} open={isEditDialogOpen}
        onSave={() => setParams(prev => ({ ...prev, page: 1 }))} />
      <AddChildDialog id={id} setOpen={setIsAddChildDialogOpen} open={isAddChildDialogOpen}
        onSave={() => setParams(prev => ({ ...prev, page: 1 }))} />
      <ConfirmDeleteDialog
        open={deleteTarget.length > 0}
        onOpenChange={(open) => { if (!open) setDeleteTarget([]); }}
        description={deleteTarget.length === 1
          ? formatMessage({ id: 'table.deleteConfirmSingle' }, { name: deleteTarget[0].name })
          : formatMessage({ id: 'table.deleteConfirm' }, { count: deleteTarget.length })}
        pending={deleting}
        onConfirm={confirmDelete}
      />

      <div className="flex items-center py-3 gap-4">
        <div className="flex items-center gap-4">
          <Label className="whitespace-nowrap" htmlFor="groupName">{formatMessage({ id: 'page.system.group.header.name' })}</Label>
          <Input id="groupName" type="text" placeholder="" value={params.name} onChange={(e) => setParams(prev => ({ ...prev, name: e.target.value, page: 1 }))} />
        </div>
        <div className="flex items-center gap-4">
          <Label className="whitespace-nowrap" htmlFor="groupId">{formatMessage({ id: 'page.system.group.header.id' })}</Label>
          <Input id="groupId" type="text" placeholder="" value={params.id} onChange={(e) => setParams(prev => ({ ...prev, id: e.target.value, page: 1 }))} />
        </div>

        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap">{formatMessage({ id: 'page.system.group.header.status' })}</Label>
          <Select
            value={params.status}
            onValueChange={(value) => setParams(prev => ({ ...prev, status: value || '', page: 1 }))}
          >
            <SelectTrigger className="flex items-center">
              <SelectValue>
                {params.status
                  ? formatMessage({ id: `dict.status.${statusEnum.get(params.status)}` })
                  : 'Status'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Array.from(statusEnum).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {formatMessage({ id: `dict.status.${value}` })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ActionAuth action="add">
            <Button onClick={() => handleAddChild(null)}>{formatMessage({ id: 'button.add' })}</Button>
          </ActionAuth>
          <ActionAuth action="delete">
            <Button disabled={selectedRows.length === 0} onClick={() => requestDelete(selectedRows)}>{formatMessage({ id: 'button.delete' })}</Button>
          </ActionAuth>
        </div>
      </div>

      <ResourceTable
        data={data.list}
        columns={columns}
        total={data.total}
        page={params.page}
        size={params.size}
        onPageChange={(page) => setParams(prev => ({ ...prev, page }))}
        getRowId={(row) => row.id}
        getSubRows={(row) => row.subRows}
        selectionMode="tree"
        paginationMode="client"
        onSelectionChange={setSelectedRows}
        loading={loading}
        error={error}
        onRetry={refetch}
      />
    </div>
  )
}
