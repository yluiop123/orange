import * as userApi from "@/api/system/user";
import type { User, UserQuery } from "@/api/system/user";
import ActionAuth from "@/components/action-auth";
import GroupTreeSelect from "@/components/group-tree-select";
import { PasswordDialog } from "@/components/password-dialog";
import { ConfirmActionDialog } from "@/components/system/confirm-action-dialog";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import useUserStore from "@/store/user";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useIntl } from "react-intl";
import { toast } from "sonner";
import AddDialog from "./add-dialog";
import EditDialog from "./edit-dialog";

type TableParams = ListParams<UserQuery>;

const FILTER_FIELDS = [
    { value: "name", label: "page.system.user.header.name" },
    { value: "username", label: "page.system.user.header.userName" },
    { value: "email", label: "page.system.user.header.email" },
    { value: "phone", label: "page.system.user.header.phone" },
];

export default function User() {
    const intl = useIntl();
    const currentUsername = useUserStore((state) => state.userInfo?.username);

    const [params, setParams] = useState<TableParams>({
        page: 1,
        size: 10,
        filterField: 'name',
        filterValue: '',
        groupId: '',
    });

    const { data, loading, error, refetch } = useResourceList<TableParams, User>({
        params,
        errorMessage: intl.formatMessage({ id: 'table.loadError' }),
        fetcher: (query, signal) => userApi.listUsers(query, signal),
    });

    const [selectedRows, setSelectedRows] = useState<User[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<User[]>([]);
    const [deleting, setDeleting] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [id, setId] = useState('' as string);
    const [tempPassword, setTempPassword] = useState<{ username?: string; password: string } | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [resetTarget, setResetTarget] = useState<User | null>(null);
    const [resetting, setResetting] = useState(false);

    function isSelf(row: User) {
        return !!currentUsername && row.username === currentUsername;
    }
    function handleEdit(row: User) {
        setId(row.id);
        setIsEditDialogOpen(true);
    }
    function handleReset(row: User) {
        setResetTarget(row);
    }
    async function confirmReset() {
        if (!resetTarget) {
            return;
        }
        setResetting(true);
        try {
            const password = await userApi.resetUserPassword(resetTarget.id);
            toast.success(intl.formatMessage({ id: 'message.success' }));
            setTempPassword({ username: resetTarget.username, password });
            setResetTarget(null);
        } finally {
            setResetting(false);
        }
    }
    function requestDelete(rows: User[]) {
        const deletable = rows.filter((row) => !isSelf(row));
        if (deletable.length !== rows.length) {
            toast.warning(intl.formatMessage({ id: 'message.cannotDeleteSelf' }));
        }
        if (deletable.length === 0) {
            return;
        }
        setDeleteTarget(deletable);
    }
    async function confirmDelete() {
        if (deleteTarget.length === 0) {
            return;
        }
        setDeleting(true);
        try {
            await userApi.deleteUsers(deleteTarget.map(item => item.id));
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
    function handleStatusChange(row: User, status: "0" | "1") {
        return userApi.updateUserStatus(row.id, status).then(() => {
            setParams(prev => ({ ...prev }));
        })
    }

    const columns: ColumnDef<User>[] = [
        {
            meta: { title: intl.formatMessage({ id: 'page.system.user.header.name' }) },
            enableHiding: false,
            accessorKey: "name",
            header: ({ column, table }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            const isAsc = column.getIsSorted() === "asc";
                            table.setSorting([{ id: "name", desc: isAsc }]);
                            setParams(prev => ({ ...prev, orderValue: isAsc ? "desc" : "asc", orderField: 'name', page: 1 }))
                        }}
                    >
                        {intl.formatMessage({ id: 'page.system.user.header.name' })}
                        <ArrowUpDown />
                    </Button>
                )
            },
            cell: ({ row }) => <div>{row.getValue("name")}</div>,
        },
        {
            meta: { title: intl.formatMessage({ id: 'page.system.user.header.userName' }) },
            accessorKey: "username",
            header: intl.formatMessage({ id: 'page.system.user.header.userName' }),
            cell: ({ row }) => <div>{row.getValue("username")}</div>,
        },
        {
            meta: { title: intl.formatMessage({ id: 'page.system.user.header.email' }) },
            accessorKey: "email",
            header: intl.formatMessage({ id: 'page.system.user.header.email' }),
            cell: ({ row }) => <div>{row.getValue("email")}</div>,
        },
        {
            meta: { title: intl.formatMessage({ id: 'page.system.user.header.phone' }) },
            accessorKey: "phone",
            header: intl.formatMessage({ id: 'page.system.user.header.phone' }),
            cell: ({ row }) => <div>{row.getValue("phone")}</div>,
        },
        {
            meta: { title: intl.formatMessage({ id: 'page.system.user.header.groupName' }) },
            accessorKey: "groupName",
            header: intl.formatMessage({ id: 'page.system.user.header.groupName' }),
            cell: ({ row }) => <div>{row.getValue("groupName")}</div>,
        },
        {
            meta: { title: intl.formatMessage({ id: 'page.system.user.header.createTime' }) },
            accessorKey: "createTime",
            header: intl.formatMessage({ id: 'page.system.user.header.createTime' }),
            cell: ({ row }) => <div>{row.getValue("createTime")}</div>,
        },
        {
            meta: { title: intl.formatMessage({ id: 'page.system.user.header.status' }) },
            accessorKey: "status",
            header: intl.formatMessage({ id: 'page.system.user.header.status' }),
            cell: ({ row }) =>
                <ActionAuth action="edit">
                    <StatusSwitch
                        initial={row.getValue("status") as string}
                        disabled={isSelf(row.original)}
                        disableDescription={intl.formatMessage(
                            { id: 'table.disableConfirmNamed' },
                            { name: row.original.username },
                        )}
                        onChange={(val) => handleStatusChange(row.original, val)} />
                </ActionAuth>
            ,
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger render={
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">{intl.formatMessage({ id: 'table.openMenu' })}</span>
                                <MoreHorizontal />
                            </Button>}
                        />
                        <DropdownMenuContent className="w-40" align="end">
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>{intl.formatMessage({ id: 'table.actions' })}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <ActionAuth action="edit">
                                    <DropdownMenuItem onClick={() => handleEdit(user)}>{intl.formatMessage({ id: 'button.edit' })}</DropdownMenuItem>
                                </ActionAuth>
                                {!isSelf(user) && (
                                    <ActionAuth action="delete">
                                        <DropdownMenuItem onClick={() => requestDelete([user])}>{intl.formatMessage({ id: 'button.delete' })}</DropdownMenuItem>
                                    </ActionAuth>
                                )}
                                <ActionAuth action="edit">
                                    <DropdownMenuItem onClick={() => handleReset(user)}>{intl.formatMessage({ id: 'button.reset.password' })}</DropdownMenuItem>
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
                        { name: deleteTarget[0].username },
                    )
                    : intl.formatMessage(
                        { id: 'table.deleteConfirm' },
                        { count: deleteTarget.length },
                    )}
                pending={deleting}
                onConfirm={confirmDelete}
            />
            <ConfirmActionDialog
                open={!!resetTarget}
                onOpenChange={(open) => { if (!open) setResetTarget(null); }}
                title={intl.formatMessage({ id: 'table.resetPasswordTitle' })}
                description={intl.formatMessage(
                    { id: 'table.resetPasswordConfirm' },
                    { name: resetTarget?.username ?? '' },
                )}
                confirmLabel={intl.formatMessage({ id: 'button.reset.password' })}
                pending={resetting}
                onConfirm={confirmReset}
            />

            <div className="flex items-center py-3 gap-4">
                <GroupTreeSelect
                    className="w-60"
                    value={params.groupId}
                    onChange={(node) => {
                        setParams(prev => ({ ...prev, groupId: node, page: 1 }))
                    }}
                />
                <Select
                    onValueChange={(value) =>
                        setParams(prev => ({ ...prev, filterField: value ? value : "", page: 1 }))
                    } defaultValue={params.filterField}>
                    <SelectTrigger className="flex items-center">
                        <SelectValue>
                            {intl.formatMessage({
                                id: FILTER_FIELDS.find((field) => field.value === params.filterField)?.label
                                    ?? 'page.system.user.header.name',
                            })}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {FILTER_FIELDS.map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                                {intl.formatMessage({ id: field.label })}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input
                    placeholder={intl.formatMessage({ id: 'table.filterField' })}
                    value={params.filterValue}
                    onChange={(event) =>
                        setParams(prev => ({ ...prev, filterValue: event.target.value, page: 1 }))
                    }
                    className="max-w-sm"
                />
                <div className="ml-auto flex items-center gap-2">
                    <ActionAuth action="add">
                        <Button onClick={() => setIsAddDialogOpen(true)}>{intl.formatMessage({ id: 'button.add' })}</Button>
                    </ActionAuth>
                    <AddDialog open={isAddDialogOpen} setOpen={setIsAddDialogOpen} onSave={() => setParams(prev => ({ ...prev, page: 1 }))} onCreated={(password, username) => setTempPassword({ password, username })} />
                    <PasswordDialog
                        open={!!tempPassword}
                        onOpenChange={(open) => { if (!open) setTempPassword(null); }}
                        password={tempPassword?.password ?? ""}
                        username={tempPassword?.username}
                    />
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
