import { deleteGroups, listGroups, moveGroup, updateGroupStatus } from "@/api/system/group";
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

type Group = {
  name: string
  id: string
  status?: "0" | "1"
  remark?: string
  createTime?: string,
  parentId?: string | null
  order?: number
  subRows?: Group[]
}

type TableParams = {
  page: number
  size: number
  id?: string
  name?: string
  status?: string
}

export default function Group() {
  const { formatMessage } = useIntl();
  const [params, setParams] = useState<TableParams>({
    page: 1,
    size: 10,
    id: '',
    name: '',
    status: 'all'
  });

  const { data, loading, error } = useResourceList<TableParams, Group>({
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
      order: (row) => row.order ?? 0,
    },
  });

  const [selectedRows, setSelectedRows] = useState<Group[]>([]);
  const [id, setId] = useState('' as string);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddBrotherDialogOpen, setIsAddBrotherDialogOpen] = useState(false);
  const [isAddChildDialogOpen, setIsAddChildDialogOpen] = useState(false);

  function handleEdit(row: Group) {
    setId(row.id);
    setIsEditDialogOpen(true);
  }
  function handleAddBrother(row: Group) {
    setId(row.id);
    setIsAddBrotherDialogOpen(true);
  }
  function handleAddChild(row: Group | null) {
    setId(row?.id || '');
    setIsAddChildDialogOpen(true);
  }
  function handleDelete(rows: Group[]) {
    if (rows.length === 0) {
      return;
    }
    deleteGroups(rows.map((row) => row.id)).then(() => {
      setParams({ ...params, page: 1 });
      setSelectedRows([]);
      toast.success(formatMessage({ id: 'message.success' }));
    })
  }
  function handleMove(row: Group, direction: 'up' | 'down' | 'top') {
    moveGroup(row.id, direction).then(() => {
      setParams({ ...params });
    })
  }
  function handleStatusChange(row: Group, status: "0" | "1") {
    return updateGroupStatus(row.id, status).then(() => {
      setParams({ ...params });
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
      accessorKey: "status",
      meta: { title: formatMessage({ id: "page.system.group.header.status" }) },
      header: formatMessage({ id: "page.system.group.header.status" }),
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
      meta: { title: formatMessage({ id: "page.system.group.header.Order" }) },
      header: formatMessage({ id: "page.system.group.header.Order" }),
      cell: ({ row }) => <div className="lowercase">{row.getValue("order")}</div>,
    },
    {
      accessorKey: "createTime",
      meta: { title: formatMessage({ id: "page.system.group.header.createTime" }) },
      header: formatMessage({ id: "page.system.group.header.createTime" }),
      cell: ({ row }) => <div className="capitalize">{row.getValue("createTime")}</div>,
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
                  <DropdownMenuItem onClick={() => handleAddBrother(group)}>{formatMessage({ id: 'button.addBrother' })}</DropdownMenuItem>
                </ActionAuth>
                <ActionAuth action="edit">
                  <DropdownMenuItem onClick={() => handleMove(group, 'top')}>{formatMessage({ id: 'button.moveTop' })}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMove(group, 'up')}>{formatMessage({ id: 'button.moveUp' })}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMove(group, 'down')}>{formatMessage({ id: 'button.moveDown' })}</DropdownMenuItem>
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
        onSave={() => setParams({ ...params, page: 1 })} />
      <AddBrotherDialog id={id} setOpen={setIsAddBrotherDialogOpen} open={isAddBrotherDialogOpen}
        onSave={() => setParams({ ...params, page: 1 })} />
      <AddChildDialog id={id} setOpen={setIsAddChildDialogOpen} open={isAddChildDialogOpen}
        onSave={() => setParams({ ...params, page: 1 })} />

      <div className="flex items-center py-3 gap-4">
        <div className="flex items-center gap-4">
          <Label className="whitespace-nowrap" htmlFor="groupName">{formatMessage({ id: 'page.system.group.header.name' })}</Label>
          <Input id="groupName" type="text" placeholder="" value={params.name} onChange={(e) => setParams({ ...params, name: e.target.value })} />
        </div>
        <div className="flex items-center gap-4">
          <Label className="whitespace-nowrap" htmlFor="groupId">{formatMessage({ id: 'page.system.group.header.id' })}</Label>
          <Input id="groupId" type="text" placeholder="" value={params.id} onChange={(e) => setParams({ ...params, id: e.target.value })} />
        </div>

        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap">{formatMessage({ id: 'page.system.group.header.status' })}</Label>
          <Select
            value={params.status}
            onValueChange={(value) => setParams({ ...params, status: value || '' })}
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
