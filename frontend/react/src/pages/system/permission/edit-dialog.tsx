import { getPermission, updatePermission } from "@/api/system/permission";
import DialogForm, { Field } from "@/components/dialog-form";
import { applyServerFieldErrors } from "@/lib/form-errors";
import { useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useIntl } from "react-intl";
import { toast } from "sonner";
import { z } from "zod";

type PermissionType = "menu" | "action" | "directory";

export default function Index(props: { setOpen: (open: boolean) => void, open: boolean, onSave: () => void, id: string }) {
    const { setOpen, onSave, open, id } = props;
    const intl = useIntl();
    const formRef = useRef<UseFormReturn<Record<string, unknown>>>(null);
    const fields: Field[] = [
        {
            name: "id",
            label: "page.system.permission.header.id",
            defaultValue: "",
            disabled: true,
        },
        {
            name: "name",
            label: "page.system.permission.header.name",
            defaultValue: "",
            validate: z.string().min(2)
        },
        {
            name: "path",
            label: "page.system.permission.header.path",
            defaultValue: "",
            validate: z.string().regex(/^[a-zA-Z0-9/]{2,}$/)
        },
        {
            name: "type",
            label: "page.system.permission.header.type",
            defaultValue: "",
            validate: z.string().optional(),
            type: "permissionType"
        },
        {
            name: "action",
            label: "page.system.permission.header.action",
            defaultValue: "",
            validate: z.string().optional(),
        },
        {
            name: "parentId",
            label: "page.system.permission.header.parentPermission",
            defaultValue: '',
            validate: z.string().optional(),
            type: "permission",
            excludeId: id,
        },
    ]
    const [values, setValues] = useState<Record<string, unknown>>({});

    useEffect(() => {
        setValues({});
        if (!open || id === '') {
            return;
        }
        let cancelled = false;
        getPermission(id).then((permission) => {
            if (cancelled) return;
            if (!permission) {
                toast.error(intl.formatMessage({ id: 'table.loadError' }));
                return;
            }
            setValues(permission);
        }).catch(() => {
            // 错误提示由 axios 拦截器统一处理
        });
        return () => {
            cancelled = true;
        };
    }, [id, open, intl])
function onSubmit(fieldValues: Record<string, unknown>) {
        return updatePermission(id, {
            id,
            name: fieldValues.name as string,
            path: fieldValues.path as string,
            type: fieldValues.type as PermissionType,
            action: fieldValues.action as string,
            parentId: fieldValues.parentId as string,
        }).then(() => {
            setOpen(false);
            toast.success(intl.formatMessage({ id: 'message.success' }));
            onSave();
        }).catch((error) => {
            applyServerFieldErrors(formRef, error);
            // 错误提示由 axios 拦截器统一处理
        })
    }
    return (
        open && Object.keys(values).length > 0 && <DialogForm
            ref={formRef}
            setOpen={setOpen}
            open={open}
            title={intl.formatMessage({ id: 'button.edit' })}
            fields={fields}
            values={values}
            onSubmit={onSubmit}>
        </DialogForm>
    )
}
