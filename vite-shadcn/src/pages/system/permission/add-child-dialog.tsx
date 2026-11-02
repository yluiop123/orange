import { addPermissionChild } from "@/api/system/permission";
import DialogForm, { Field } from "@/components/dialog-form";
import { applyServerFieldErrors } from "@/lib/form-errors";
import { useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useIntl } from "react-intl";
import { toast } from "sonner";
import { z } from "zod";

type PermissionType = "menu" | "action" | "directory";

const ROOT_CODE_LENGTH = 4;
const CODE_SEGMENT_LENGTH = 2;

export default function Index(props: { setOpen: (open: boolean) => void, open: boolean, onSave: () => void, id: string }) {
    const { setOpen, onSave, open, id } = props;
    const intl = useIntl();
    const formRef = useRef<UseFormReturn<Record<string, unknown>>>(null);
    const parentId = id;
    const expectedLength = parentId ? parentId.length + CODE_SEGMENT_LENGTH : ROOT_CODE_LENGTH;
    const codeSchema = z.string()
        .regex(/^\d+$/, { message: intl.formatMessage({ id: 'validate.permissionCode.digits' }) })
        .length(expectedLength, {
            message: intl.formatMessage(
                { id: 'validate.permissionCode.length' },
                { length: expectedLength },
            ),
        })
        .refine((value) => !parentId || value.startsWith(parentId), {
            message: intl.formatMessage(
                { id: 'validate.permissionCode.prefix' },
                { parentId },
            ),
        });

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
        return addPermissionChild({
            id: fieldValues.id as string,
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
            title={intl.formatMessage({ id: 'button.addChild' })}
            fields={fields}
            values={values}
            onSubmit={onSubmit}>
        </DialogForm>
    )
}
