import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Loader2, X } from "lucide-react";
import * as React from "react";

/* =======================
 * Types
 * ======================= */

export type AutoCompleteOption = {
  value: string;
  label?: React.ReactNode;
  disabled?: boolean;
};

export type AutoCompleteSize = "sm" | "md" | "lg";
export type AutoCompleteStatus = "default" | "error" | "warning";

export interface AutoCompleteProProps {
  value?: string;
  defaultValue?: string;
  options?: AutoCompleteOption[];

  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  loading?: boolean;

  size?: AutoCompleteSize;
  status?: AutoCompleteStatus;

  popupMatchSelectWidth?: boolean;
  notFoundContent?: React.ReactNode;

  filterOption?: (input: string, option: AutoCompleteOption) => boolean;

  onChange?: (value: string) => void;
  onSelect?: (value: string, option: AutoCompleteOption) => void;
}

/* =======================
 * Style helpers
 * ======================= */

function inputSize(size: AutoCompleteSize) {
  return cn({
    "h-8 text-sm": size === "sm",
    "h-10": size === "md",
    "h-12 text-base": size === "lg",
  });
}

function inputStatus(status: AutoCompleteStatus) {
  return cn({
    "border-border": status === "default",
    "border-destructive focus-visible:ring-destructive": status === "error",
    "border-yellow-500 focus-visible:ring-yellow-500": status === "warning",
  });
}

/* =======================
 * Component
 * ======================= */

export function AutoCompletePro({
  value,
  defaultValue,
  options = [],
  placeholder,
  disabled,
  allowClear,
  loading,

  size = "md",
  status = "default",

  popupMatchSelectWidth = true,
  notFoundContent = "暂无数据 / No Data",

  filterOption,
  onChange,
  onSelect,
}: AutoCompleteProProps) {
  const [open, setOpen] = React.useState(false);
  const [innerValue, setInnerValue] = React.useState(defaultValue ?? "");

  const inputValue = value !== undefined ? value : innerValue;

  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options;
    if (!filterOption) {
      return options.filter((opt) =>
        opt.value.toLowerCase().includes(inputValue.toLowerCase())
      );
    }
    return options.filter((opt) => filterOption(inputValue, opt));
  }, [inputValue, options, filterOption]);

  const handleChange = (val: string) => {
    setInnerValue(val);
    onChange?.(val);
    setOpen(true);
  };

  const handleSelect = (opt: AutoCompleteOption) => {
    setInnerValue(opt.value);
    onChange?.(opt.value);
    onSelect?.(opt.value, opt);
    // setOpen(false);
  };

  const showClear = allowClear && !!inputValue && !disabled;

  return (
    <Popover
      open={open && filteredOptions.length > 0}
      onOpenChange={setOpen}
    >
      <PopoverTrigger nativeButton={false} render={<div className="relative w-full" />}>
        <Input
          disabled={disabled}
          value={inputValue}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          // onFocus={() => setOpen(true)}
          className={cn(
            inputSize(size),
            inputStatus(status),
            showClear && "pr-8"
          )}
        />

        {/* suffix icons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {showClear && (
            <X
              className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={() => handleChange("")}
            />
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className={cn(
          "p-0 pointer-events-auto",
          popupMatchSelectWidth && "w-[--radix-popover-trigger-width]"
        )}
      >
        <Command>
          <CommandGroup>
            {filteredOptions.map((opt) => (
              <CommandItem
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                onSelect={() => handleSelect(opt)}
              >
                {opt.label ?? opt.value}
              </CommandItem>
            ))}
          </CommandGroup>

          {filteredOptions.length === 0 && (
            <CommandEmpty>{notFoundContent}</CommandEmpty>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
