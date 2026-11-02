import { getUser, updateUser } from "@/api/system/user";
import type { UserPayload } from "@/api/system/user";
import DialogForm, { Field } from "@/components/dialog-form";
import { applyServerFieldErrors } from "@/lib/form-errors";
import { useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useIntl } from "react-intl";
import { toast } from "sonner";
import { z } from "zod";

export default function Index(props: { setOpen: (open: boolean) => void, open: boolean, onSave: () => void, id: string }) {
    const { setOpen, onSave, open, id } = props;
    const intl = useIntl();
    const formRef = useRef<UseFormReturn<Record<string, unknown>>>(null);
    const rolesSchema = z.object({
        label: z.string(),
        value: z.string(),
        disable: z.boolean().optional(),
    });
    const fields: Field[] = [
        {
            name: "name",
            label: "page.system.user.header.name",
            defaultValue: "",
            validate: z.string().min(2, {
                message: intl.formatMessage({ id: 'validate.name' }),
            })
        },
        {
            name: "username",
            label: "page.system.user.header.userName",
            defaultValue: "",
            validate: z.string().min(4, {
                message: intl.formatMessage({ id: 'validate.username' }),
            })
        },
        {
            name: "email",
            label: "page.system.user.header.email",
            defaultValue: "",
            validate: z.string().email({
                message: intl.formatMessage({ id: 'validate.email' }),
            })
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
            validate: z.string(),
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
    const [values, setValues] = useState<Record<string, unknown>>({});

    useEffect(() => {
        setValues({});
        if (!open || id === '') {
            return;
        }
        let cancelled = false;
        getUser(id).then((user) => {
            if (cancelled) return;
            if (!user) {
                toast.error(intl.formatMessage({ id: 'table.loadError' }));
                return;
            }
            setValues({
                ...user,
                roles: (user.roles ?? []).map((item) => ({
                    label: item.name,
                    value: item.id,
                })),
                groupId: user.groupId || '',
            });
        }).catch(() => {
            // 错误提示由 axios 拦截器统一处理
        });
        return () => {
            cancelled = true;
        };
    }, [id, open])
function onSubmit(values: Record<string, unknown>) {
        const payload: UserPayload = {
            name: values.name as string,
            username: values.username as string,
            email: values.email as string,
            phone: values.phone as string,
            groupId: (values.groupId as string) || '',
            roles: (values.roles as { value: string }[] | undefined)?.map((item) => item.value) ?? [],
            permissions: (values.permissions as string[] | undefined) ?? [],
        };
        updateUser(id, payload).then(() => {
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
