import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { statusEnum } from "@/lib/dict";
import { useIntl } from "react-intl";

export type StatusFilterValue = "0" | "1" | "all";

type StatusFilterProps = {
  value: string;
  onChange: (value: StatusFilterValue) => void;
  className?: string;
};

/** 系统列表统一的状态筛选器，避免四个页面各写一份 fallback。 */
export function StatusFilter({ value, onChange, className }: StatusFilterProps) {
  const intl = useIntl();
  const current = statusEnum.get(value) ?? "all";

  return (
    <Select
      value={value || "all"}
      onValueChange={(next) => onChange((next || "all") as StatusFilterValue)}
    >
      <SelectTrigger className={className}>
        <SelectValue>
          {intl.formatMessage({ id: `dict.status.${current}` })}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Array.from(statusEnum).map(([key, label]) => (
          <SelectItem key={key} value={key}>
            {intl.formatMessage({ id: `dict.status.${label}` })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
