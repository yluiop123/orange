import { getRole, updateRole } from "@/api/system/role";
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
    const fields: Field[] = [
        {
            name: "id",
            label: "page.system.role.header.role",
            defaultValue: "",
            validate: z.string().regex(/^[a-zA-Z0-9]{2,}$/, {
                message: intl.formatMessage({ id: 'validate.role' }),
            }),
            disabled: true,
        },
        {
            name: "name",
            label: "page.system.role.header.name",
            defaultValue: "",
            validate: z.string().min(2, {
                message: intl.formatMessage({ id: 'validate.roleName' }),
            })
        },
        {
            name: "permissions",
            label: "page.system.user.header.permissions",
            defaultValue: [],
            validate: z.array(z.string()),
            type: "permissions"
        },
    ]
    const [values, setValues] = useState<Record<string, unknown>>({});

    useEffect(() => {
        if (id === '') {
            return;
        }
        let cancelled = false;
        getRole(id).then((role) => {
            if (!cancelled) setValues(role);
        });
        return () => {
            cancelled = true;
        };
    }, [id])
function onSubmit(fieldValues: Record<string, unknown>) {
        updateRole(id, fieldValues).then(() => {
            setOpen(false);
            toast.success(intl.formatMessage({ id: 'message.success' }));
            onSave();
        }).catch((error) => {
            applyServerFieldErrors(formRef, error);
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
