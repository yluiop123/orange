import GroupTreeSelect from "@/components/group-tree-select";
import PermissionTreeSelect from "@/components/permission-tree-select";
import PermissionTreeSingleSelect from "@/components/permission-tree-single-select";
import RoleSelect from "@/components/role-select";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { forwardRef, useEffect, useImperativeHandle } from "react";
import { Controller, useForm, UseFormReturn } from "react-hook-form";
import { useIntl } from "react-intl";
import { z } from "zod";
import PermissionType from "./permission-type";
type Field = {
    name: string;
    label: string;
    validate?: z.ZodTypeAny;
    defaultValue?: string|string[];
    type?: string;
    disabled?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DialogForm =  forwardRef<UseFormReturn<any>, {
    open: boolean
    setOpen: (open:boolean)=>void
    title:string
    description?: string
    fields: Field[]
    values?: Record<string, unknown>
    onSubmit: (values: Record<string, unknown>) => void
}>(({open,setOpen,title,description,fields,values,onSubmit}, ref) => {
    const schemaShape = fields.reduce((acc, field) => {
        acc[field.name] = field.validate || z.string().optional();
        return acc;
    }, {} as Record<string, z.ZodTypeAny>);
    const formSchema = z.object(schemaShape);
    const intl = useIntl();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: Object.fromEntries(fields.map(item => [item.name, item.defaultValue || ""])),
    });
    useImperativeHandle(ref, () => form);
    useEffect(() => {
        if (open) {
            if (values) {
                form.reset(values);
            }
        }else{
            form.reset();
        }
    }, [values,form,open]);
    return (
        <Dialog open={open} 
        onOpenChange={setOpen}> 
            <DialogContent className="sm:max-w-106.25">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription className={description ? undefined : "sr-only"}>
                            {description ?? title}
                        </DialogDescription>
                    </DialogHeader>
                    {fields.map((f) => (
                        <FieldGroup key={f.name}>
                            <Controller
                            name={f.name}
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={f.name}>
                                    {intl.formatMessage({ id: f.label })}
                                </FieldLabel>
{
                                        f?.type === "permissions"?
                                        <PermissionTreeSelect disabled={f.disabled} {...field} value={field.value as string[]} className="p-3"/>
                                        :
                                        f?.type === "permission"?
                                        <PermissionTreeSingleSelect disabled={f.disabled} {...field} value={field.value as string} className="p-3"/>
                                        :
                                        f?.type === "roles"?
                                        <RoleSelect disabled={f.disabled} {...field} className="p-3"/>
                                        :
                                        f?.type === "group"?
                                        <GroupTreeSelect disabled={f.disabled}
                                            {...field} value={field.value as string | undefined} className="p-3"
                                        />
                                        :
                                        f?.type === "permissionType"?
                                        <PermissionType {...field} value={field.value as string | undefined} className="p-3"/>
                                        :
                                        <Input disabled={f.disabled} placeholder="" {...field} value={field.value as string | undefined} className="p-3"/>
                                    }
                                {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                )}
                                </Field>
                            )}
                            />                            
                        </FieldGroup>
                    ))}
                    <DialogFooter>
                        <Button type="submit">{intl.formatMessage({ id: 'button.save' })}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    )
}
)
export default DialogForm;
export type { Field };

