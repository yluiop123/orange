import { cn } from "@/lib/utils"
import * as React from "react"

interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "horizontal" | "vertical"
  orientation?: "left" | "center" | "right"
  dashed?: boolean
  children?: React.ReactNode
  color?: string // Tailwind class，如 border-red-500
  size?: "sm" | "md" | "lg" | "xl"
  length?: string | number // 横向宽度 / 纵向高度
  textClassName?: string
}

export function Divider({
  type = "horizontal",
  orientation = "center",
  dashed = false,
  children,
  className,
  color,
  size = "sm",
  length,
  textClassName,
  ...props
}: DividerProps) {
  // Tailwind 边框宽度映射
const sizeClass =
  size === "sm"
    ? "border"      // 1px
    : size === "md"
    ? "border-2"    // 2px
    : size === "lg"
    ? "border-4"    // 4px
    : size === "xl"
    ? "border-8"    // 8px
    : "border"

  // Tailwind 长度类映射
  const lengthStyle =
    typeof length === "number"
      ? { width: `${length}px` }
      : typeof length === "string"
      ? { width: length }
      : {}

  if (type === "vertical") {
  const verticalSizeClass =
    size === "sm"
      ? "border-r"
      : size === "md"
      ? "border-r-2"
      : size === "lg"
      ? "border-r-4"
      : size === "xl"
      ? "border-r-8"
      : "border-r"

  const verticalStyle = {
    ...{
      height: "1.5rem" // 默认高度
    },
    ...(typeof length === "number"
      ? { height: `${length}px` }
      : typeof length === "string"
      ? { height: length }
      : {})
  }

  return (
    <div
      className={cn(
        "inline-block",
        verticalSizeClass,
        dashed && "border-dashed",
        color || "border-border",
        className
      )}
      style={verticalStyle}
      {...props}
    />
  )
}


return (
    <div 
      className={cn("relative flex items-center w-full my-4", className)} 
      style={lengthStyle}
      {...props}
    >
      {/* Left Line: Don't show if orientation is left and we want the text at the very start */}
      {orientation !== "left" && (
        <div
          className={cn(
            "flex-grow border-t",
            sizeClass,
            dashed && "border-dashed",
            color || "border-border"
          )}
        />
      )}

      {children && (
        <span
          className={cn(
            "px-3 text-sm text-foreground whitespace-nowrap",
            textClassName
          )}
        >
          {children}
        </span>
      )}

      {/* Right Line: Don't show if orientation is right and we want the text at the very end */}
      {orientation !== "right" && (
        <div
          className={cn(
            "flex-grow border-t",
            sizeClass,
            dashed && "border-dashed",
            color || "border-border"
          )}
        />
      )}
    </div>
  )
}