import { addPermissionChild } from "@/api/system/permission";
import DialogForm, { Field } from "@/components/dialog-form";
import { applyServerFieldErrors } from "@/lib/form-errors";
import {
    checkPermissionShape,
    permissionShapeMessageKey,
} from "@/lib/permission-shape";
import { buildTreeCodeSchema } from "@/lib/tree-code-policy";
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
    const parentId = id;
    const codeSchema = buildTreeCodeSchema(intl, "permission", parentId);

    const fields: Field[] = [
        {
            name: "id",
            label: "page.system.permission.header.id",
            defaultValue: "",
            validate: codeSchema,
        },
        {
            name: "name",
            label: "page.system.permission.header.name",
            defaultValue: "",
            validate: z.string().min(2)
        },
        {
            name: "nameEn",
            label: "page.system.permission.header.nameEn",
            defaultValue: "",
            validate: z.string().optional(),
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
            defaultValue: parentId,
            validate: z.string().optional(),
            type: "permission",
            disabled: true,
        },
    ]
    const [values, setValues] = useState<Record<string, unknown>>({});

    useEffect(() => {
        setValues({ parentId });
    }, [parentId])
function onSubmit(fieldValues: Record<string, unknown>) {
        const name = fieldValues.name as string;
        const nameEn = (fieldValues.nameEn as string | undefined)?.trim();
        return addPermissionChild({
            id: fieldValues.id as string,
            name,
            translations: nameEn ? { zh: name, en: nameEn } : { zh: name },
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
            title={intl.formatMessage({ id: 'button.addChild' })}
            fields={fields}
            values={values}
            refine={(fieldValues) => {
                const issue = checkPermissionShape(
                    fieldValues.type as string | undefined,
                    fieldValues.action as string | undefined,
                );
                return issue
                    ? { path: "action", message: intl.formatMessage({ id: permissionShapeMessageKey(issue) }) }
                    : null;
            }}
            onSubmit={onSubmit}>
        </DialogForm>
    )
}
