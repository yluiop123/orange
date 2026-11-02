import { getGroup, updateGroup } from "@/api/system/group";
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
            label: "page.system.group.header.id",
            defaultValue: "",
            disabled: true,
        },
        {
            name: "name",
            label: "page.system.group.header.name",
            defaultValue: "",
            validate: z.string().min(2, {
                message: intl.formatMessage({ id: 'validate.groupName' }),
            })
        },
        {
            name: "parentId",
            label: "page.system.group.header.parentGroup",
            defaultValue: "",
            validate: z.string().optional(),
            disabled: true,
        },
    ]
    const [values, setValues] = useState<Record<string, unknown>>({});

    useEffect(() => {
        setValues({});
        if (!open || id === '') {
            return;
        }
        let cancelled = false;
        getGroup(id).then((group) => {
            if (cancelled) return;
            if (!group) {
                toast.error(intl.formatMessage({ id: 'table.loadError' }));
                return;
            }
            setValues(group);
        }).catch(() => {
            // 错误提示由 axios 拦截器统一处理
        });
        return () => {
            cancelled = true;
        };
    }, [id, open, intl])
function onSubmit(fieldValues: Record<string, unknown>) {
        return updateGroup(id, {
            id,
            name: fieldValues.name as string,
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
