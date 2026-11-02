import { createRole } from "@/api/system/role";
import DialogForm, { Field } from "@/components/dialog-form";
import { applyServerFieldErrors } from "@/lib/form-errors";
import { useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useIntl } from "react-intl";
import { toast } from "sonner";
import { z } from "zod";

export default function Index(props: { open: boolean, setOpen: (open: boolean) => void, onSave: () => void }) {
    const { open, setOpen, onSave } = props;
    const intl = useIntl();
    const formRef = useRef<UseFormReturn<Record<string, unknown>>>(null);
    const fields: Field[] = [
        {
            name: "id",
            label: "page.system.role.header.role",
            defaultValue: "",
            validate: z.string().regex(/^[a-zA-Z0-9]{2,}$/, {
                message: intl.formatMessage({ id: 'validate.role' }),
            })
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
function onSubmit(values: Record<string, unknown>) {
        return createRole({
            id: values.id as string,
            name: values.name as string,
            permissions: values.permissions as string[],
        }).then(() => {
            setOpen(false);
            toast.success(intl.formatMessage({ id: 'message.success' }));
            onSave();
        }).catch((error) => {
            applyServerFieldErrors(formRef, error);
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
