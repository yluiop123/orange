import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import React, { useMemo, useState } from "react";

// ------------------- 类型定义 -------------------

export type TreeNode = {
  id?: string;
  name?: string;
  value: string;
  title: string;
  children?: TreeNode[];
  /** 节点自身不可选（例如已停用），但已选中的值仍会保留并允许移除。 */
  disabled?: boolean;
  /** 节点不可选时显示在标题后的说明文字。 */
  disabledLabel?: string;
  [key: string]: unknown;
};

export type TreeSelectProps = {
  data: TreeNode[];
  multiple?: boolean;
  value?: string[] | string;
  defaultValue?: string[] | string;
  onChange?: (ids: string[] | string) => void;
  placeholder?: string;
  filterable?: boolean;
  maxTagCount?: number;
  className?: string;
  disabled?: boolean;
};

// ------------------- 工具函数 -------------------

const toArray = (val?: string | string[]) =>
  Array.isArray(val) ? val : val ? [val] : [];

function getCheckStatus(node: TreeNode, selected: string[]): boolean {
  return selected.includes(node.value);
}

function nodeMatches(node: TreeNode, keyword: string): boolean {
  if (!keyword) {
    return true;
  }
  if (node.title.toLowerCase().includes(keyword)) {
    return true;
  }
  return node.children?.some((child) => nodeMatches(child, keyword)) ?? false;
}

/**
 * 多选不再级联：选中目录/菜单只代表该权限本身，不会自动勾选子节点。
 * 展示时按树顺序列出真实选中的节点，避免把“子节点全选”误显示成父节点。
 */
function flattenSelectedNodes(
  nodes: TreeNode[],
  selectedIds: string[]
): TreeNode[] {
  const remaining = new Set(selectedIds);
  const result: TreeNode[] = [];

  const traverse = (items: TreeNode[]) => {
    for (const node of items) {
      if (remaining.delete(node.value)) {
        result.push(node);
      }
      if (node.children?.length) {
        traverse(node.children);
      }
    }
  };

  traverse(nodes);
  return result;
}

// ------------------- 子组件: Tree -------------------

function Tree({
  nodes,
  selected,
  onToggle,
  filter,
  multiple = true,
  level = 0,
}: {
  nodes: TreeNode[];
  selected: string[];
  onToggle: (node: TreeNode, checked: boolean) => void;
  filter: string;
  multiple?: boolean;
  level?: number;
}) {
  const [expanded, setExpanded] = useState<string[]>([]);

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpanded((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const keyword = filter.toLowerCase();
  const filteredNodes = nodes.filter((node) => nodeMatches(node, keyword));

  return (
    <ul
      className={cn(
        "space-y-1",
        level > 0 &&
          "ml-3 pl-2 border-l border-muted-foreground/20"
      )}
    >
      {filteredNodes.map((node) => {
        const isExpanded =
          expanded.includes(node.value) || filter !== "";
        const hasChildren = !!node.children?.length;
        const checked = getCheckStatus(node, selected);
        // 已停用节点不可新选；已经选中的保留，允许取消授权。
        const unselectable = multiple
          ? !!node.disabled && !checked
          : !!node.disabled;

        return (
          <li key={node.value} className="relative">
            <div
              className={cn(
                "flex items-center space-x-2 py-1 rounded-sm px-1 transition-colors group/item hover:bg-accent/50",
                node.disabled && "text-muted-foreground"
              )}
            >
              {/* 展开箭头 */}
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                {hasChildren && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) =>
                      toggleExpand(node.value, e)
                    }
                    aria-label={node.title}
                    aria-expanded={isExpanded}
                    className="size-4 min-h-0 rounded p-0.5 hover:bg-accent"
                  >
                    <ChevronRight
                      className={cn(
                        "h-3 w-3 text-muted-foreground transition-transform duration-200",
                        isExpanded && "rotate-90"
                      )}
                    />
                  </Button>
                )}
              </div>

              {/* 选择控制 */}
              {multiple ? (
                <Checkbox
                  className="h-4 w-4 shrink-0"
                  checked={checked}
                  disabled={unselectable}
                  aria-label={node.title}
                  onCheckedChange={(next) => {
                    if (unselectable) return;
                    onToggle(node, next === true);
                  }}
                />
              ) : (
                <RadioGroup
                  className="h-4 w-4 shrink-0"
                  value={selected[0] || ""}
                  onValueChange={() => {
                    if (unselectable) return;
                    onToggle(node, true);
                  }}
                >
                  <RadioGroupItem
                    value={node.value}
                    disabled={unselectable}
                    aria-label={node.title}
                  />
                </RadioGroup>
              )}

              {/* 标题 */}
              <span
                className={cn(
                  "select-none",
                  unselectable ? "cursor-not-allowed" : "cursor-pointer"
                )}
                aria-disabled={unselectable || undefined}
                onClick={() => {
                  if (unselectable) return;
                  onToggle(node, multiple ? !checked : true);
                }}
              >
                {node.title}
              </span>
              {node.disabled && node.disabledLabel && (
                <span className="text-[10px] text-muted-foreground">
                  {node.disabledLabel}
                </span>
              )}
            </div>

            {hasChildren && isExpanded && (
              <Tree
                nodes={node.children!}
                selected={selected}
                onToggle={onToggle}
                filter={filter}
                multiple={multiple}
                level={level + 1}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ------------------- 主组件: TreeSelect -------------------

export default function TreeSelect(props: TreeSelectProps) {
  const {
    data,
    multiple = true,
    value,
    defaultValue = [],
    onChange,
    placeholder = "",
    filterable = true,
    maxTagCount = 3,
    disabled = false,
    className,
  } = props;

  const isControlled = value !== undefined;

  const [innerSelected, setInnerSelected] =
    useState<string[]>(toArray(defaultValue));

  const mergedSelected = isControlled
    ? toArray(value)
    : innerSelected;

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");

  // 调用方负责把 DTO 归一化成 value/title/children，TreeSelect 不再二次映射。
  const treeData = data;

  const handleToggle = (node: TreeNode, checked: boolean) => {
    const isSelected = mergedSelected.includes(node.value);
    if (node.disabled && !(multiple && isSelected)) {
      return;
    }

    let next: string[];

    if (multiple) {
      // 不做级联：一个目录权限不会自动代表它的子权限。
      next = checked
        ? Array.from(new Set([...mergedSelected, node.value]))
        : mergedSelected.filter((id) => id !== node.value);
    } else {
      next = [node.value];
      setOpen(false);
    }

    if (!isControlled) {
      setInnerSelected(next);
    }

    onChange?.(
      multiple ? next : next[0] || ""
    );
  };

  const displayNodes = useMemo(() => {
    if (multiple) {
      return flattenSelectedNodes(
        treeData,
        mergedSelected
      );
    }

    const findNode = (
      nodes: TreeNode[],
      val: string
    ): TreeNode | null => {
      for (const n of nodes) {
        if (n.value === val) return n;
        if (n.children) {
          const found = findNode(
            n.children,
            val
          );
          if (found) return found;
        }
      }
      return null;
    };

    return mergedSelected[0]
      ? [findNode(treeData, mergedSelected[0])].filter((node): node is TreeNode => !!node)
      : [];
  }, [treeData, mergedSelected, multiple]);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        nativeButton={false}
        render={
          <div
            className={cn(
              "group relative flex min-h-10 w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-md border border-input bg-background py-1.5 pl-2 pr-15 text-sm transition-all duration-200",
              "hover:border-primary/50",
              "focus-within:ring-1 focus-within:ring-ring focus-within:border-primary",
              className
            )}
          />
        }
      >
          {displayNodes.length === 0 && (
            <span className="text-muted-foreground select-none">
              {placeholder}
            </span>
          )}

          {displayNodes
            .slice(0, maxTagCount)
            .map((node) => (
              <Badge
                key={node.value}
                variant="secondary"
                // className="flex items-center gap-1 px-2 py-0.5 font-normal border-primary/20 text-primary bg-primary/5"
                render={() => {    
                  return (
                    <div className={cn(
                      "h-5 gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0  focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden group/badge"                    
                      ,"flex items-center gap-1 px-2 py-0.5 font-normal border-primary/20 text-primary bg-primary/5"
                   )}>
                    {node.title}
                      {multiple && (
                        <X
                          className="pointer-events-auto h-3.5 w-3.5 cursor-pointer rounded-full p-0.5 hover:bg-destructive hover:text-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggle(node, false);
                          }}
                        />
                      )}
                    </div>
                )}}
              >
                
              </Badge>
            ))}

          {displayNodes.length > maxTagCount && (
            <Badge
              variant="outline"
              className="px-1.5 py-0.5 font-normal border-primary/20 text-primary bg-primary/5"
            >
              +{displayNodes.length - maxTagCount}
            </Badge>
          )}

          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 text-muted-foreground/50">
            {!disabled && mergedSelected.length > 0 && (
              <X
                className="h-4 w-4 hover:text-destructive transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isControlled) {
                    setInnerSelected([]);
                  }
                  onChange?.(
                    multiple ? [] : ""
                  );
                }}
              />
            )}
            <div className="w-px h-4 bg-border mx-0.5" />
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                open &&
                  "rotate-180 text-primary"
              )}
            />
          </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="p-0 min-w-60 shadow-lg border-muted"
      >
        {filterable && (
          <div className="p-2 border-b border-muted">
            <Input
              value={filter}
              aria-label={placeholder || "Filter"}
              onChange={(e) =>
                setFilter(e.target.value)
              }
              className="h-8 text-xs border-none bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:bg-background transition-all"
            />
          </div>
        )}

        <div className="max-h-80 overflow-y-auto p-2">
          {treeData.length > 0 ? (
            <Tree
              nodes={treeData}
              selected={mergedSelected}
              onToggle={handleToggle}
              filter={filter}
              multiple={multiple}
            />
          ) : (
            <div className="py-10 text-center text-xs text-muted-foreground italic">
              无匹配结果
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
