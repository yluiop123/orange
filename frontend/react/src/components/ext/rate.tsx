"use client"

import { cn } from "@/lib/utils"
import { Star } from "lucide-react"
import * as React from "react"

export interface RateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Number of stars to display */
  count?: number
  /** Current rating value */
  value?: number
  /** Default rating value */
  defaultValue?: number
  /** Custom rating increment (1 = full star, 0.5 = half star) */
  allowHalf?: boolean
  /** Allow clearing rating */
  allowClear?: boolean
  /** Disabled state */
  disabled?: boolean
  /** Star size: "sm" | "md" | "lg" */
  size?: "sm" | "md" | "lg"
  /** Star color */
  color?: string
  /** Callback when rating changes */
  onChange?: (value: number) => void
  /** Custom tooltips for each star */
  tooltips?: string[]
  /** Custom star icon */
  character?: React.ReactNode
}

const RateComponent = React.forwardRef<HTMLDivElement, RateProps>(
  (
    {
      count = 5,
      value,
      defaultValue = 0,
      allowHalf = false,
      allowClear = false,
      disabled = false,
      size = "md",
      color = "text-yellow-400",
      onChange,
      tooltips,
      character,
      className,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(value ?? defaultValue)
    const [hoverValue, setHoverValue] = React.useState(0)

    // Sync external value changes
    React.useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value)
      }
    }, [value])

    // Size classes
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-8 w-8",
    }

    // Handle star click
    const handleStarClick = (index: number, isHalf: boolean) => {
      if (disabled) return

      let newValue = index + 1
      if (allowHalf && isHalf) {
        newValue = index + 0.5
      }

      // Allow clearing if clicking the same value
      if (allowClear && internalValue === newValue) {
        newValue = 0
      }

      setInternalValue(newValue)
      onChange?.(newValue)
    }

    // Get displayed value (hover or actual)
    const displayValue = hoverValue || internalValue

    // Render stars
    const renderStars = () => {
      const stars = []

      for (let i = 0; i < count; i++) {
        const starValue = i + 1

        // Determine if star should be filled, half-filled, or empty
        let fillState: "full" | "half" | "empty" = "empty"
        if (displayValue >= starValue) {
          fillState = "full"
        } else if (displayValue > i && displayValue < starValue) {
          fillState = "half"
        }

        stars.push(
          <div
            key={i}
            className="relative inline-flex cursor-pointer group"
            onMouseMove={(e) => {
              if (disabled) return
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              const halfWidth = rect.width / 2

              if (allowHalf && x < halfWidth) {
                setHoverValue(i + 0.5)
              } else {
                setHoverValue(i + 1)
              }
            }}
            onMouseLeave={() => setHoverValue(0)}
            onClick={(e) => {
              if (disabled) return
              const rect = e.currentTarget.getBoundingClientRect()
              const x = (e as React.MouseEvent).clientX - rect.left
              const halfWidth = rect.width / 2

              if (allowHalf && x < halfWidth) {
                handleStarClick(i, true)
              } else {
                handleStarClick(i, false)
              }
            }}
          >
            {/* Background star */}
            <div className={cn(sizeClasses[size], "text-gray-300 dark:text-gray-600")}>
              {character || <Star className="h-full w-full fill-current" />}
            </div>

            {/* Filled/Half star overlay */}
            <div
              className={cn(
                "absolute top-0 left-0 overflow-hidden transition-all",
                sizeClasses[size],
                fillState === "full" ? "w-full" : fillState === "half" ? "w-1/2" : "w-0",
                disabled ? color + " opacity-50" : color
              )}
            >
              {character || <Star className="h-full w-full fill-current" />}
            </div>

            {/* Tooltip */}
            {tooltips?.[i] && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {tooltips[i]}
              </div>
            )}
          </div>
        )
      }

      return stars
    }

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        {renderStars()}
      </div>
    )
  }
)

RateComponent.displayName = "Rate"

export { RateComponent as Rate }

