"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, Minus, Plus } from "lucide-react"
import * as React from "react"

interface InputNumberProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type" | "value" | "size" | "onBlur"> {
  /** Minimum value */
  min?: number
  /** Maximum value */
  max?: number
  /** Step increment/decrement */
  step?: number
  /** Current value */
  value?: number | null
  /** Callback when value changes */
  onChange?: (value: number | null) => void
  /** Callback when value is finalized */
  onBlur?: (value: number | null) => void
  /** Show +/- buttons on left side */
  showLeftButtons?: boolean
  /** Show up/down buttons on right side (spinner style) */
  showSpinner?: boolean
  /** Precision for decimal places */
  precision?: number
  /** Size variant */
  size?: "default" | "sm" | "lg"
  /** Variant style */
  variant?: "default" | "compact"
  /** Allow empty value */
  allowClear?: boolean
  /** Disabled state */
  disabled?: boolean
}

const InputNumber = React.forwardRef<HTMLInputElement, InputNumberProps>(
  (
    {
      min,
      max,
      step = 1,
      value,
      onChange,
      onBlur,
      showLeftButtons = false,
      showSpinner = false,
      precision = 0,
      size = "default",
      variant = "default",
      allowClear = false,
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const [inputValue, setInputValue] = React.useState<string>(
      value !== null && value !== undefined ? String(value) : ""
    )

    // Sync external value changes
    React.useEffect(() => {
      setInputValue(value !== null && value !== undefined ? String(value) : "")
    }, [value])

    // Validate and format number
    const formatNumber = (num: number): number => {
      let formatted = num
      if (min !== undefined && formatted < min) formatted = min
      if (max !== undefined && formatted > max) formatted = max
      if (precision > 0) {
        formatted = parseFloat(formatted.toFixed(precision))
      }
      return formatted
    }

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.trim()
      setInputValue(val)

      if (val === "" || val === "-") {
        if (allowClear) {
          onChange?.(null)
        }
        return
      }

      const num = parseFloat(val)
      if (!isNaN(num)) {
        onChange?.(num)
      }
    }

    // Handle blur - finalize value
    const handleBlur = () => {
      if (inputValue === "" || inputValue === "-") {
        setInputValue("")
        onBlur?.(null)
        return
      }

      const num = parseFloat(inputValue)
      if (!isNaN(num)) {
        const formatted = formatNumber(num)
        setInputValue(String(formatted))
        onBlur?.(formatted)
      } else {
        setInputValue(value !== null && value !== undefined ? String(value) : "")
      }
    }

    // Increment/Decrement logic
    const handleStepChange = (delta: number) => {
      const current = parseFloat(inputValue) || 0
      const newValue = formatNumber(current + delta * step)
      setInputValue(String(newValue))
      onChange?.(newValue)
    }

    const handleIncrement = () => handleStepChange(1)
    const handleDecrement = () => handleStepChange(-1)

    // Size classes
    const sizeClasses = {
      sm: "h-8 px-2 text-sm",
      default: "h-9 px-3",
      lg: "h-11 px-4 text-lg",
    }

    // Input classes
    const baseInputClass = cn(
      "flex items-center rounded-md border border-input bg-transparent font-mono transition-colors outline-none",
      "placeholder:text-muted-foreground",
      "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      sizeClasses[size],
      variant === "compact" && "border-0 bg-muted/30",
      className
    )

    return (
      <div className="flex items-center gap-0">
        {/* Left +/- Buttons */}
        {showLeftButtons && (
          <div className="flex items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDecrement}
              disabled={disabled || (min !== undefined && parseFloat(inputValue) <= min)}
              className={cn(
                "rounded-r-none border-r-0 px-2",
                size === "sm" && "h-8",
                size === "default" && "h-9",
                size === "lg" && "h-11"
              )}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleIncrement}
              disabled={disabled || (max !== undefined && parseFloat(inputValue) >= max)}
              className={cn(
                "rounded-l-none border-l-0 px-2",
                size === "sm" && "h-8",
                size === "default" && "h-9",
                size === "lg" && "h-11"
              )}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Main Input with Spinner */}
        <div className={cn("relative w-full min-w-0", showSpinner && "group", showLeftButtons && "[&_input]:rounded-l-none")}>
          <Input
            ref={ref}
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={disabled}
            className={cn(
              baseInputClass,
              showSpinner && "pr-6",
              showLeftButtons && "rounded-l-none",
              "w-full"
            )}
            {...props}
          />

          {/* Right Spinner Buttons */}
          {showSpinner && (
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={handleIncrement}
                disabled={disabled || (max !== undefined && parseFloat(inputValue) >= max)}
                className="flex items-center justify-center w-5 h-2.5 min-h-0 rounded-sm p-0"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleDecrement}
                disabled={disabled || (min !== undefined && parseFloat(inputValue) <= min)}
                className="flex items-center justify-center w-5 h-2.5 min-h-0 rounded-sm p-0"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }
)

InputNumber.displayName = "InputNumber"

export { InputNumber }
export type { InputNumberProps }

