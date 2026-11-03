import * as roleApi from "@/api/system/role";
import type { Role, RoleQuery } from "@/api/system/role";
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
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useIntl } from "react-intl";
import AddDialog from "./add-dialog";
import EditDialog from "./edit-dialog";

type TableParams = ListParams<RoleQuery>;

export default function Role() {
    const intl = useIntl();
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
    } = useResourcePage<Role, TableParams>({
        initialParams: {
            page: 1,
            size: 10,
            id: '',
            name: '',
            status: 'all'
        },
        fetcher: roleApi.listRoles,
        errorMessage: intl.formatMessage({ id: 'table.loadError' }),
        getRowId: (row) => row.id,
        labelOf: (row) => row.name,
        deleteRows: roleApi.deleteRoles,
        updateStatus: (row, status) => roleApi.updateRole(row.id, { status }),
        paginationMode: "server",
    });

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [id, setId] = useState('' as string);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    function handleEdit(row: Role) {
        setId(row.id);
        setIsEditDialogOpen(true);
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
                        updateParams({ direction: isAsc ? "desc" : "asc", sort: 'name' });
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
            cell: ({ row }) => <div>{formatDateTime(row.getValue("createTime"))}</div>,
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
                onSave={refetch} />
            <ConfirmDeleteDialog
                open={deleteTarget.length > 0}
                onOpenChange={(open) => { if (!open) cancelDelete(); }}
                description={deleteDescription}
                pending={deleting}
                onConfirm={confirmDelete}
            />

            <div className="flex items-center py-3 gap-4">
                <div className="flex items-center gap-4">
                    <Label className="whitespace-nowrap" htmlFor="roleName">{intl.formatMessage({ id: 'page.system.role.header.name' })}</Label>
                    <Input id="roleName" type="text" placeholder="" value={params.name ?? ''} onChange={(e) => updateParams({ name: e.target.value })} />
                </div>
                <div className="flex items-center gap-4">
                    <Label className="whitespace-nowrap" htmlFor="roleId">{intl.formatMessage({ id: 'page.system.role.header.role' })}</Label>
                    <Input id="roleId" type="text" placeholder="" value={params.id ?? ''} onChange={(e) => updateParams({ id: e.target.value })} />
                </div>

                <div className="flex items-center gap-2">
                    <Label className="whitespace-nowrap">{intl.formatMessage({ id: 'page.system.role.header.status' })}</Label>
                    <StatusFilter value={params.status ?? 'all'} onChange={(status) => updateParams({ status })} />
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <ActionAuth action="add">
                        <Button onClick={() => setIsAddDialogOpen(true)}>{intl.formatMessage({ id: 'button.add' })}</Button>
                    </ActionAuth>
                    <AddDialog open={isAddDialogOpen} setOpen={setIsAddDialogOpen} onSave={() => updateParams({}, true)} />
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
                onPageChange={setPage}
                getRowId={(row) => row.id}
                onSelectionChange={setSelectedRows}
                loading={loading}
                error={error}
                onRetry={refetch}
            />
        </div>
    )
}
