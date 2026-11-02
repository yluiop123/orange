import * as roleApi from "@/api/system/role";
import type { Role, RoleQuery } from "@/api/system/role";
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
import { statusEnum } from "@/lib/dict";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useIntl } from "react-intl";
import { toast } from "sonner";
import AddDialog from "./add-dialog";
import EditDialog from "./edit-dialog";

type TableParams = ListParams<RoleQuery>;

export default function Role() {
    const intl = useIntl();
    const [params, setParams] = useState<TableParams>({
        page: 1,
        size: 10,
        id: '',
        name: '',
        status: 'all'
    });

    const { data, loading, error, refetch } = useResourceList<TableParams, Role>({
        params,
        errorMessage: intl.formatMessage({ id: 'table.loadError' }),
        fetcher: (query, signal) => roleApi.listRoles(query, signal),
    });

    const [selectedRows, setSelectedRows] = useState<Role[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<Role[]>([]);
    const [deleting, setDeleting] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [id, setId] = useState('' as string);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    function handleEdit(row: Role) {
        setId(row.id);
        setIsEditDialogOpen(true);
    }
    function requestDelete(rows: Role[]) {
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
            await roleApi.deleteRoles(deleteTarget.map(item => item.id));
            const remaining = Math.max(0, data.total - deleteTarget.length);
            const maxPage = Math.max(1, Math.ceil(remaining / params.size));
            setParams(prev => ({ ...prev, page: Math.min(prev.page, maxPage) }));
            setSelectedRows([]);
            setDeleteTarget([]);
            toast.success(intl.formatMessage({ id: 'message.success' }));
        } finally {
            setDeleting(false);
        }
    }
    function handleStatusChange(row: Role, status: "0" | "1") {
        return roleApi.updateRole(row.id, { status }).then(() => {
            setParams(prev => ({ ...prev }));
        })
    }

    const columns: ColumnDef<Role>[] = [
        {
            meta: { title: intl.formatMessage({ id: 'page.system.role.header.name' }) },
            enableHiding: false,
            accessorKey: "name",
            header: ({ column, table }) => (
                <Button
                    variant="ghost"
                    onClick={() => {
                        const isAsc = column.getIsSorted() === "asc";
                        table.setSorting([{ id: "name", desc: isAsc }]);
                        setParams(prev => ({ ...prev, orderValue: isAsc ? "desc" : "asc", orderField: 'name', page: 1 }))
                    }}
                >
                    {intl.formatMessage({ id: 'page.system.role.header.name' })}
                    <ArrowUpDown />
                </Button>
            ),
            cell: ({ row }) => <div>{row.getValue("name")}</div>,
        },
        {
            meta: { title: intl.formatMessage({ id: 'page.system.role.header.role' }) },
            accessorKey: "id",
            header: intl.formatMessage({ id: 'page.system.role.header.role' }),
            cell: ({ row }) => <div>{row.getValue("id")}</div>,
        },
        {
            meta: { title: intl.formatMessage({ id: 'page.system.role.header.createTime' }) },
            accessorKey: "createTime",
            header: intl.formatMessage({ id: 'page.system.role.header.createTime' }),
            cell: ({ row }) => <div>{row.getValue("createTime")}</div>,
        },
        {
            meta: { title: intl.formatMessage({ id: 'page.system.role.header.status' }) },
            accessorKey: "status",
            header: intl.formatMessage({ id: 'page.system.role.header.status' }),
            cell: ({ row }) =>
                <ActionAuth action="edit">
                    <StatusSwitch
                        initial={row.getValue("status") as string}
                        onChange={(val) => handleStatusChange(row.original, val)} />
                </ActionAuth>
            ,
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const role = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                            <span className="sr-only">{intl.formatMessage({ id: 'table.openMenu' })}</span>
                            <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>{intl.formatMessage({ id: 'table.actions' })}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <ActionAuth action="edit">
                                    <DropdownMenuItem onClick={() => handleEdit(role)}>{intl.formatMessage({ id: 'button.edit' })}</DropdownMenuItem>
                                </ActionAuth>
                                <ActionAuth action="delete">
                                    <DropdownMenuItem onClick={() => requestDelete([role])}>{intl.formatMessage({ id: 'button.delete' })}</DropdownMenuItem>
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
            <ConfirmDeleteDialog
                open={deleteTarget.length > 0}
                onOpenChange={(open) => { if (!open) setDeleteTarget([]); }}
                description={deleteTarget.length === 1
                    ? intl.formatMessage(
                        { id: 'table.deleteConfirmSingle' },
                        { name: deleteTarget[0].name },
                    )
                    : intl.formatMessage(
                        { id: 'table.deleteConfirm' },
                        { count: deleteTarget.length },
                    )}
                pending={deleting}
                onConfirm={confirmDelete}
            />

            <div className="flex items-center py-3 gap-4">
                <div className="flex items-center gap-4">
                    <Label className="whitespace-nowrap" htmlFor="roleName">{intl.formatMessage({ id: 'page.system.role.header.name' })}</Label>
                    <Input id="roleName" type="text" placeholder="" value={params.name} onChange={(e) => setParams(prev => ({ ...prev, name: e.target.value, page: 1 }))} />
                </div>
                <div className="flex items-center gap-4">
                    <Label className="whitespace-nowrap" htmlFor="roleId">{intl.formatMessage({ id: 'page.system.role.header.role' })}</Label>
                    <Input id="roleId" type="text" placeholder="" value={params.id} onChange={(e) => setParams(prev => ({ ...prev, id: e.target.value, page: 1 }))} />
                </div>

                <div className="flex items-center gap-2">
                    <Label className="whitespace-nowrap">{intl.formatMessage({ id: 'page.system.role.header.status' })}</Label>
                    <Select
                        onValueChange={(value) =>
                            setParams(prev => ({ ...prev, status: value ? value : '', page: 1 }))
                        } defaultValue={params.status}>
                        <SelectTrigger className="flex items-center">
                            <SelectValue placeholder="Status">
                                {intl.formatMessage({ id: `dict.status.${statusEnum.get(params.status || '') || ''}` })}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from(statusEnum).map(([key, value]) => (
                                <SelectItem key={value} value={key}>{intl.formatMessage({ id: `dict.status.${value}` })}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <ActionAuth action="add">
                        <Button onClick={() => setIsAddDialogOpen(true)}>{intl.formatMessage({ id: 'button.add' })}</Button>
                    </ActionAuth>
                    <AddDialog open={isAddDialogOpen} setOpen={setIsAddDialogOpen} onSave={() => setParams(prev => ({ ...prev, page: 1 }))} />
                    <ActionAuth action="delete">
                        <Button disabled={selectedRows.length === 0} onClick={() => requestDelete(selectedRows)}>{intl.formatMessage({ id: 'button.delete' })}</Button>
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
                onSelectionChange={setSelectedRows}
                loading={loading}
                error={error}
                onRetry={refetch}
            />
        </div>
    )
}
