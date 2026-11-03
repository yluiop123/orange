"use client";

import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, ChevronRight, Search, X } from "lucide-react";
import * as React from "react";

export type CascaderOption = {
  value: string;
  label: string;
  children?: CascaderOption[];
  disabled?: boolean;
};

export interface CascaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: CascaderOption[];
  value: string[] | string[][];
  onChange: (value: string[] | string[][]) => void;
  multiple?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
}

export function Cascader({
  options,
  value = [],
  onChange,
  multiple = false,
  placeholder = "请选择",
  searchPlaceholder = "搜索...",
  allowClear = true,
  disabled = false,
  className,
  ...props
}: CascaderProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [activePath, setActivePath] = React.useState<string[]>([]);
  const triggerRef = React.useRef<HTMLDivElement | null>(null);
  const [triggerWidth, setTriggerWidth] = React.useState<number>(0);

  const flattenedOptions = React.useMemo(() => {
    const result: { path: string[]; label: string; fullLabel: string }[] = [];
    const traverse = (opts: CascaderOption[], pPath: string[], pLabels: string[]) => {
      opts.forEach((o) => {
        const cPath = [...pPath, o.value];
        const cLabels = [...pLabels, o.label];
        if (!o.children || o.children.length === 0) {
          result.push({ path: cPath, label: o.label, fullLabel: cLabels.join(" / ") });
        } else {
          traverse(o.children, cPath, cLabels);
        }
      });
    };
    traverse(options, [], []);
    return result;
  }, [options]);

  const filteredOptions = flattenedOptions.filter((opt) =>
    opt.fullLabel.toLowerCase().includes(searchValue.toLowerCase())
  );

  const isPathSelected = (path: string[]) => {
    const pathStr = path.join(",");
    if (multiple) return (value as string[][]).some((v) => v.join(",") === pathStr);
    return (value as string[]).join(",") === pathStr;
  };

  const handleSelect = (path: string[], isLeaf: boolean) => {
    if (!isLeaf || disabled) {
      if (!disabled) setActivePath(path);
      return;
    }
    if (multiple) {
      const currentVal = value as string[][];
      const alreadySelected = currentVal.some((v) => v.join(",") === path.join(","));
      const newVal = alreadySelected ? currentVal.filter((v) => v.join(",") !== path.join(",")) : [...currentVal, path];
      onChange(newVal);
    } else {
      onChange(path);
      setOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(multiple ? [] : []);
    setActivePath([]);
  };

  const renderColumns = () => {
    const columns = [];
    let currentOptions = options;
    for (let i = 0; i <= activePath.length; i++) {
      if (!currentOptions || currentOptions.length === 0) break;
      const level = i;
      columns.push(
        <div key={level} className="min-w-160px max-h-300px overflow-y-auto border-r border-border/50 last:border-r-0 p-1">
          {currentOptions.map((opt) => {
            const currentPath = [...activePath.slice(0, level), opt.value];
            const isLeaf = !opt.children || opt.children.length === 0;
            const active = activePath[level] === opt.value;
            return (
              <div
                key={opt.value}
                className={cn(
                  "flex items-center px-2.5 py-2 text-sm rounded-md cursor-pointer mb-0.5 transition-colors",
                  active ? "bg-primary/10 text-primary" : "hover:bg-accent text-muted-foreground",
                  opt.disabled && "opacity-40 pointer-events-none"
                )}
                onMouseEnter={() => !isLeaf && setActivePath(currentPath)}
                onClick={() => handleSelect(currentPath, isLeaf)}
              >
                <span className="flex-1 truncate">{opt.label}</span>
                {!isLeaf && <ChevronRight className="ml-2 w-3.5 h-3.5 opacity-40" />}
                {isLeaf && isPathSelected(currentPath) && <Check className="ml-2 w-4 h-4 text-primary" />}
              </div>
            );
          })}
        </div>
      );
      currentOptions = currentOptions.find(o => o.value === activePath[level])?.children || [];
    }
    return <div className="flex bg-popover">{columns}</div>;
  };

  return (
    <Popover open={open} onOpenChange={(val) => {
      if (disabled) return;
      setOpen(val);
      if (val && triggerRef.current) setTriggerWidth(triggerRef.current.getBoundingClientRect().width);
    }}>
      {/* 核心修复：PopoverTrigger 现在包裹了整个带边框的容器 */}
      <PopoverTrigger
        nativeButton={false}
        render={
          <div
            ref={triggerRef}
            {...props}
            className={cn(
              "group relative flex items-center justify-between w-full min-h-40px px-3 py-1 rounded-md border border-input bg-background transition-all shadow-sm cursor-pointer",
              !disabled && "hover:border-primary/50",
              open && "ring-2 ring-primary/20 border-primary",
              disabled && "opacity-50 cursor-not-allowed bg-muted",
              className
            )}
          />
        }
      >
          {/* 内容区域 */}
          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0 mr-2">
            {multiple ? (
              (value as string[][]).length > 0 ? (
                (value as string[][]).map(p => (
                  <span key={p.join(',')} className="px-2 py-0.5 bg-secondary text-secondary-foreground border rounded text-[11px] flex items-center gap-1">
                    {p[p.length - 1]}
                    <X onClick={(e) => { e.stopPropagation(); handleSelect(p, true); }} className="w-3 h-3 hover:text-destructive shrink-0" />
                  </span>
                ))
              ) : <span className="text-muted-foreground text-sm">{placeholder}</span>
            ) : (
              <span className={cn("text-sm truncate", (value as string[]).length === 0 && "text-muted-foreground")}>
                {(value as string[]).length > 0 ? (value as string[]).join(" / ") : placeholder}
              </span>
            )}
          </div>

          {/* 右侧图标组：受 justify-between 控制 */}
          <div className="flex items-center gap-2 shrink-0 ml-auto pl-1">
            {allowClear && !disabled && (multiple ? (value as string[][]).length > 0 : (value as string[]).length > 0) && (
              <X onClick={handleClear} className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            )}
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
          </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={4}
        className="p-0 z-1000 bg-popover border border-border shadow-xl rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ width: searchValue ? triggerWidth : 'auto' }}
      >
        <div className="p-2 border-b bg-muted/30 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            autoFocus
            className="w-full pl-8 pr-3"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
        <div>
          {searchValue ? (
             <div className="max-h-300px overflow-y-auto p-1">
             {filteredOptions.length > 0 ? (
               filteredOptions.map((opt) => (
                 <div
                   key={opt.path.join(",")}
                   className={cn(
                     "flex items-center px-3 py-2 text-sm hover:bg-accent cursor-pointer rounded-md",
                     isPathSelected(opt.path) && "bg-primary/5 text-primary"
                   )}
                   onClick={() => handleSelect(opt.path, true)}
                 >
                   <span>{opt.fullLabel}</span>
                   {isPathSelected(opt.path) && <Check className="ml-auto w-4 h-4" />}
                 </div>
               ))
             ) : (
               <div className="py-6 text-center text-muted-foreground text-sm">未搜索到结果</div>
             )}
           </div>
          ) : renderColumns()}
        </div>
      </PopoverContent>
    </Popover>
  );
}