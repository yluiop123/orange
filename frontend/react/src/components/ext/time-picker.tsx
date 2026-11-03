"use client"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import * as React from "react"

export interface TimePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  /** 值，格式 HH:MM 或 HH:MM:SS */
  value?: string
  /** 受控变更回调，返回时间字符串 */
  onChange?: (value: string) => void
  /** 步长（秒），默认 60（按分钟步进） */
  step?: number
  /** 是否显示秒 */
  showSeconds?: boolean
}

export const TimePicker = React.forwardRef<HTMLInputElement, TimePickerProps>(
  ({ className, value, onChange, step = 60, showSeconds: _showSeconds = false, ...props }, ref) => {
    const inputStep = Math.max(1, Number(step))

    return (
      <Input
        ref={ref}
        type="time"
        step={inputStep}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        className={cn("inline-flex h-10 w-full max-w-xs items-center px-3 py-2", className)}
        {...props}
      />
    )
  }
)

TimePicker.displayName = "TimePicker"

export default TimePicker
