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
            validate: z.string().regex(/^[a-zA-Z0-9]{2,}$/, {
                message: intl.formatMessage({ id: 'validate.groupId' }),
            }),
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
        if (id === '') {
            return;
        }
        let cancelled = false;
        getGroup(id).then((group) => {
            if (!cancelled) setValues(group);
        });
        return () => {
            cancelled = true;
        };
    }, [id])

    const schemaShape = fields.reduce((acc, field) => {
        acc[field.name] = field.validate || z.string().optional();
        return acc;
    }, {} as Record<string, z.ZodTypeAny>);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const formSchema = z.object(schemaShape);

    function onSubmit(fieldValues: z.infer<typeof formSchema>) {
        updateGroup(id, {
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
