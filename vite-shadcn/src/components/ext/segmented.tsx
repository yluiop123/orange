"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import * as React from "react"

export interface SegmentedOption {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

export interface SegmentedProps {
  options?: SegmentedOption[]
  value?: string | null
  defaultValue?: string
  onChange?: (value: string | null) => void
  size?: "sm" | "default" | "lg"
  disabled?: boolean
  loading?: boolean
  error?: boolean
  className?: string
  name?: string
}

export const Segmented = React.forwardRef<HTMLDivElement, SegmentedProps>(
  (
    {
      options = [],
      value,
      defaultValue,
      onChange,
      size = "default",
      disabled = false,
      loading = false,
      error = false,
      className,
      name,
      ...rest
    },
    ref
  ) => {
    const isControlled = value !== undefined
    const [internal, setInternal] = React.useState<string | null>(
      defaultValue !== undefined ? defaultValue : null
    )

    React.useEffect(() => {
      if (isControlled) {
        setInternal(value ?? null)
      }
    }, [value, isControlled])

    const selected = isControlled ? (value ?? null) : internal

    const handleSelect = (v: string) => {
      if (disabled) return
      if (!isControlled) setInternal(v)
      onChange?.(v)
    }

    const sizeClasses = {
      sm: "text-sm h-8",
      default: "text-sm h-9",
      lg: "text-base h-11",
    }

    return (
      <div
        ref={ref}
        role="radiogroup"
        className={cn(
          "inline-flex rounded-md border bg-transparent",
          "shadow-sm",
          error ? "border-destructive" : "border-input",
          disabled || loading ? "opacity-70 pointer-events-none" : "pointer-events-auto",
          sizeClasses[size],
          className
        )}
        {...rest}
      >
        {options.map((opt, idx) => {
          const active = selected === opt.value
          const isFirst = idx === 0
          const isLast = idx === options.length - 1
          const btnClass = cn(
            "relative px-3 select-none flex items-center justify-center transition-colors border-0",
            active ? "bg-primary text-primary-foreground" : "bg-transparent text-foreground",
            !active && "hover:bg-accent/30",
            isFirst && "rounded-l-md",
            isLast && "rounded-r-md",
            !isFirst && "-ml-px"
          )



          return (
            <Button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              variant="ghost"
              name={name}
              onClick={() => !opt.disabled && handleSelect(opt.value)}
              disabled={opt.disabled}
              className={btnClass}
            >
              <span className="flex items-center gap-2">
                {opt.label}
                {loading && active && (
                  <Loader2 className="h-4 w-4 animate-spin opacity-80" />
                )}
              </span>
            </Button>
          )
        })}
      </div>
    )
  }
)

Segmented.displayName = "Segmented"

export default Segmented