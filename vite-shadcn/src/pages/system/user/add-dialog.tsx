import { createUser } from "@/api/system/user";
import type { UserPayload } from "@/api/system/user";
import DialogForm, { Field } from "@/components/dialog-form";
import { applyServerFieldErrors } from "@/lib/form-errors";
import { useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useIntl } from "react-intl";
import { toast } from "sonner";
import { z } from "zod";

export default function Index(props: { open: boolean, setOpen: (open: boolean) => void, onSave: () => void, onCreated?: (password: string, username: string) => void }) {
    const { open, setOpen, onSave, onCreated } = props;
    const intl = useIntl();
    const formRef = useRef<UseFormReturn<Record<string, unknown>>>(null);
    const rolesSchema = z.object({
        label: z.string(),
        value: z.string(),
        disable: z.boolean().optional(),
    });
    const fields: Field[] = [
        {
            name: "username",
            label: "page.system.user.header.userName",
            defaultValue: "",
            validate: z.string().min(4, {
                message: intl.formatMessage({ id: 'validate.username' }),
            })
        },
        {
            name: "name",
            label: "page.system.user.header.name",
            defaultValue: "",
            validate: z.string().min(2, {
                message: intl.formatMessage({ id: 'validate.name' }),
            })
        },
        {
            name: "email",
            label: "page.system.user.header.email",
            defaultValue: "",
            validate: z.string().email({
                message: intl.formatMessage({ id: 'validate.email' }),
            }),
        },
        {
            name: "phone",
            label: "page.system.user.header.phone",
            defaultValue: "",
            validate: z.string().regex(/^1[3-9]\d{9}$/, {
                message: intl.formatMessage({ id: 'validate.phone' }),
            })
        },
        {
            name: "groupId",
            label: "page.system.user.header.groupName",
            defaultValue: "",
            validate: z.string().min(1, {
                message: intl.formatMessage({ id: 'validate.groupRequired' }),
            }),
            type: "group"
        },
        {
            name: "roles",
            label: "page.system.user.header.roles",
            defaultValue: [],
            validate: z.array(rolesSchema).optional(),
            type: "roles"
        },
        {
            name: "permissions",
            label: "page.system.user.header.permissions",
            defaultValue: [],
            validate: z.array(z.string()).optional(),
            type: "permissions"
        },
    ]
function onSubmit(values: Record<string, unknown>) {
        const payload: UserPayload = {
            username: values.username as string,
            name: values.name as string,
            email: values.email as string,
            phone: values.phone as string,
            groupId: (values.groupId as string) || '',
            roles: (values.roles as { value: string }[] | undefined)?.map((item) => item.value) ?? [],
            permissions: (values.permissions as string[] | undefined) ?? [],
        };
        return createUser(payload).then((password) => {
            setOpen(false);
            toast.success(intl.formatMessage({ id: 'message.success' }));
            onCreated?.(password, values.username as string);
            onSave();
        }).catch((error) => {
            applyServerFieldErrors(formRef, error);
            // 错误提示由 axios 拦截器统一处理
        })
    }
    return (
        <DialogForm
            ref={formRef}
            open={open}
            setOpen={setOpen}
            title={intl.formatMessage({ id: 'button.add' })}
            fields={fields}
            onSubmit={onSubmit}>
        </DialogForm>
    )
}
