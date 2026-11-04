import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { useIntl } from "react-intl";

export type DateTimeRangeValue = {
  /** 本地时间，格式 yyyy-MM-ddTHH:mm；空字符串表示未选择。 */
  from: string;
  to: string;
};

type DateTimeRangePickerProps = {
  value: DateTimeRangeValue;
  onChange: (value: DateTimeRangeValue) => void;
  className?: string;
};

const DAY_FORMAT = "yyyy-MM-dd";
const DISPLAY_FORMAT = "yyyy-MM-dd HH:mm";

function parseValue(value: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function timePart(value: string, fallback: string) {
  const match = /T(\d{2}:\d{2})/.exec(value);
  return match?.[1] ?? fallback;
}

function withTime(date: Date, time: string) {
  return `${format(date, DAY_FORMAT)}T${time}`;
}

/**
 * 开始/结束时间成对选择：日历范围 + 起止时刻。
 * 输出本地时间字符串，页面负责转成后端需要的 ISO 时间。
 */
export function DateTimeRangePicker({
  value,
  onChange,
  className,
}: DateTimeRangePickerProps) {
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const fromDate = parseValue(value.from);
  const toDate = parseValue(value.to);
  const fromTime = timePart(value.from, "00:00");
  const toTime = timePart(value.to, "23:59");
  const [range, setRange] = useState<DateRange | undefined>(
    fromDate ? { from: fromDate, to: toDate } : undefined,
  );

  useEffect(() => {
    const nextFrom = parseValue(value.from);
    setRange(nextFrom ? { from: nextFrom, to: parseValue(value.to) } : undefined);
  }, [value.from, value.to]);

  function selectRange(next: DateRange | undefined) {
    setRange(next);
    if (!next?.from) {
      onChange({ from: "", to: "" });
      return;
    }
    onChange({
      from: withTime(next.from, fromTime),
      to: next.to ? withTime(next.to, toTime) : "",
    });
  }

  function changeFromTime(nextTime: string) {
    const date = fromDate ?? toDate ?? new Date();
    onChange({
      from: withTime(date, nextTime),
      to: value.to || withTime(toDate ?? date, toTime),
    });
  }

  function changeToTime(nextTime: string) {
    const date = toDate ?? fromDate ?? new Date();
    onChange({
      from: value.from || withTime(fromDate ?? date, fromTime),
      to: withTime(date, nextTime),
    });
  }

  function selectToday() {
    const today = new Date();
    onChange({
      from: withTime(today, "00:00"),
      to: withTime(today, "23:59"),
    });
  }

  function clear() {
    setRange(undefined);
    onChange({ from: "", to: "" });
  }

  const label =
    fromDate && toDate
      ? `${format(fromDate, DISPLAY_FORMAT)} ~ ${format(toDate, DISPLAY_FORMAT)}`
      : intl.formatMessage({ id: "page.system.operationLog.dateRange" });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn("justify-start gap-2 font-normal", className)}
          />
        }
      >
        <CalendarIcon className="text-muted-foreground" />
        <span className="truncate">{label}</span>
        {fromDate && (
          <span
            role="button"
            tabIndex={0}
            className="text-muted-foreground hover:text-foreground ml-1 rounded-sm p-0.5"
            aria-label={intl.formatMessage({ id: "button.clear" })}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              clear();
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              event.stopPropagation();
              clear();
            }}
          >
            <X className="size-3.5" />
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          selected={range}
          onSelect={selectRange}
          defaultMonth={fromDate ?? new Date()}
          numberOfMonths={2}
          autoFocus
        />
        <div className="flex flex-wrap items-end gap-3 border-t p-3">
          <div className="grid gap-1.5">
            <Label htmlFor="date-range-from" className="text-xs">
              {intl.formatMessage({ id: "page.system.operationLog.header.from" })}
            </Label>
            <Input
              id="date-range-from"
              type="time"
              value={value.from ? fromTime : ""}
              disabled={!value.from}
              onChange={(event) => changeFromTime(event.target.value)}
              className="h-8 w-28"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="date-range-to" className="text-xs">
              {intl.formatMessage({ id: "page.system.operationLog.header.to" })}
            </Label>
            <Input
              id="date-range-to"
              type="time"
              value={value.to ? toTime : ""}
              disabled={!value.to}
              onChange={(event) => changeToTime(event.target.value)}
              className="h-8 w-28"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clear}>
              {intl.formatMessage({ id: "button.clear" })}
            </Button>
            <Button variant="outline" size="sm" onClick={selectToday}>
              {intl.formatMessage({ id: "page.system.operationLog.today" })}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
