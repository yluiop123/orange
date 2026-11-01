import { addPermissionSibling } from "@/api/system/permission";
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
            name: "name",
            label: "page.system.permission.header.name",
            defaultValue: "",
            validate: z.string().min(2)
        },
        {
            name: "id",
            label: "page.system.permission.header.id",
            defaultValue: "",
            validate: z.string().regex(/^[a-zA-Z0-9]{2,}$/)
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
            name: "brotherId",
            label: "page.system.permission.header.brotherPermission",
            defaultValue: '',
            validate: z.string().optional(),
            type: "permission",
            disabled: true,
        },
    ]
    const [values, setValues] = useState<Record<string, unknown>>({});

    useEffect(() => {
        setValues({ brotherId: id });
    }, [id])

    const schemaShape = fields.reduce((acc, field) => {
        acc[field.name] = field.validate || z.string().optional();
        return acc;
    }, {} as Record<string, z.ZodTypeAny>);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const formSchema = z.object(schemaShape);

    function onSubmit(fieldValues: z.infer<typeof formSchema>) {
        addPermissionSibling({
            id: fieldValues.id as string,
            name: fieldValues.name as string,
            path: fieldValues.path as string,
            type: fieldValues.type as PermissionType,
            action: fieldValues.action as string,
            brotherId: fieldValues.brotherId as string,
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
            title={intl.formatMessage({ id: 'button.addBrother' })}
            fields={fields}
            values={values}
            onSubmit={onSubmit}>
        </DialogForm>
    )
}
