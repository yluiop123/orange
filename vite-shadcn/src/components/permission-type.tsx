
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { permissionTypeEnum } from "@/lib/dict";
import { useIntl } from "react-intl";
export default function PermissionType(props:{disabled?:boolean,className?:string,value?:string,onChange:(value:string|null)=>void}) {
    const { formatMessage } = useIntl();
    return (
    <Select  disabled={props.disabled} value={props.value} onValueChange={props.onChange}>
        <SelectTrigger className={props.className}>
            <SelectValue placeholder={formatMessage({ id: 'page.system.permission.header.type' })} >
                {props.value ? formatMessage({ id: `dict.permissionType.${props.value}`, defaultMessage: '' }) : formatMessage({ id: 'page.system.permission.header.type' })}
            </SelectValue>
        </SelectTrigger>
        <SelectContent>
            {Array.from(permissionTypeEnum).map(([key, value]) => {
                    return (
                        <SelectItem key={key} value={key}>{formatMessage({ id: `dict.permissionType.${key}`, defaultMessage: value })}</SelectItem>
                    )
                })}
        </SelectContent>
    </Select>
)}