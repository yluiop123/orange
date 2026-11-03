"use client"

import { Command, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import * as React from "react"

export interface MentionOption {
  value: string
  label: string
  avatar?: string
  description?: string
}

export interface MentionsProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "onBlur"> {
  /** Mention options */
  options?: MentionOption[]
  /** Placeholder text */
  placeholder?: string
  /** Trigger character (default: @) */
  trigger?: string
  /** Callback when text changes */
  onChange?: (value: string) => void
  /** Callback when value is finalized */
  onBlur?: (value: string) => void
  /** Callback when mention is selected */
  onMention?: (option: MentionOption) => void
  /** Loading state */
  loading?: boolean
  /** Size variant */
  size?: "default" | "sm" | "lg"
  /** Disabled state */
  disabled?: boolean
  /** Custom filter function */
  filterOption?: (input: string, option: MentionOption) => boolean
}

const Mentions = React.forwardRef<HTMLTextAreaElement, MentionsProps>(
  (
    {
      options = [],
      placeholder = "输入内容，使用 @ 提及他人...",
      trigger = "@",
      onChange,
      onBlur,
      onMention,
      loading = false,
      size = "default",
      disabled = false,
      filterOption,
      className,
      ...props
    },
    ref
  ) => {
    const [textValue, setTextValue] = React.useState("")
    const [isOpen, setIsOpen] = React.useState(false)
    const [searchText, setSearchText] = React.useState("")
    const [mentionPosition, setMentionPosition] = React.useState(0)
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    // Combine refs
    React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement)

    // Extract search text after trigger
    const extractSearchText = (text: string, cursorPos: number) => {
      const lastTriggerIndex = text.lastIndexOf(trigger, cursorPos - 1)
      if (lastTriggerIndex === -1) return null

      const searchText = text.slice(lastTriggerIndex + trigger.length, cursorPos)
      
      // Only trigger if search text doesn't contain spaces or newlines
      if (searchText.includes(" ") || searchText.includes("\n")) return null

      return searchText
    }

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value
      setTextValue(value)
      onChange?.(value)

      const cursorPos = e.target.selectionStart || 0
      const search = extractSearchText(value, cursorPos)
      if (search !== null) {
        setSearchText(search)
        setMentionPosition(cursorPos)
        setIsOpen(true)
      } else {
        setIsOpen(false)
      }
    }

    // Handle mention selection
    const handleSelectMention = (option: MentionOption) => {
      const cursorPos = mentionPosition
      const beforeMention = textValue.slice(0, textValue.lastIndexOf(trigger, cursorPos - 1))
      const afterMention = textValue.slice(cursorPos)

      const mentionText = `${trigger}${option.label}`
      const newValue = `${beforeMention}${mentionText}${afterMention}`

      setTextValue(newValue)
      onChange?.(newValue)
      onMention?.(option)
      setIsOpen(false)
      setSearchText("")
    }

    // Filter options
    const filteredOptions = React.useMemo(() => {
      if (!searchText) return options

      return options.filter((option) => {
        if (filterOption) {
          return filterOption(searchText.toLowerCase(), option)
        }
        return option.label.toLowerCase().includes(searchText.toLowerCase())
      })
    }, [searchText, options, filterOption])

    // Size classes
    const sizeClasses = {
      sm: "min-h-20 text-sm",
      default: "min-h-24 text-base",
      lg: "min-h-32 text-lg",
    }

    // Textarea classes
    const textareaClasses = cn(
      "flex w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono transition-colors outline-none",
      "placeholder:text-muted-foreground",
      "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "resize-none",
      sizeClasses[size],
      className
    )

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={(triggerProps) => {
          const { 
            // onClick, 
            // onPointerDown, 
            // onKeyDown, 
            ref: triggerRef, // 这里的 ref 可能是一个函数，也可能是一个对象
            ...restProps 
          } = triggerProps;
          const mergedAttributes = {...restProps,disabled,placeholder,...props}
          return (
            <Textarea
              {...restProps} 
              ref={(node) => {
                // 1. 赋值给你本地的 ref
                if (textareaRef) {
                  (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
                }
                
                // 2. 兼容性处理 Base UI 传过来的 triggerRef
                if (typeof triggerRef === 'function') {
                  triggerRef(node);
                } else if (triggerRef) {
                  (triggerRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
                }
              }}
              value={textValue}
              onChange={handleInputChange}
              onBlur={(e) => {
                if (e.relatedTarget?.closest('[data-base-ui-popover-popup]')) return;
                if(textValue.endsWith(trigger)) return;
                setIsOpen(false);
                onBlur?.(textValue);
              }}
              
              className={textareaClasses}
              {...mergedAttributes}
            />
          );
        }}
      />
        {/* <PopoverTrigger >
          <textarea
            ref={textareaRef}
            value={textValue}
            onChange={handleInputChange}
            // onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={textareaClasses}
            {...props}
          />
        </PopoverTrigger> */}

        {isOpen && (
          <PopoverContent className="w-56 p-0" side="bottom" align="start">
            <Command>
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {filteredOptions.length === 0 ? (
                    <CommandEmpty>
                      {searchText ? "未找到匹配的用户 / No users found" : "搜索用户... / Search users..."}
                    </CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {filteredOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={() => handleSelectMention(option)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          {option.avatar && (
                            <img
                              src={option.avatar}
                              alt={option.label}
                              className="h-6 w-6 rounded-full"
                            />
                          )}
                          <div className="flex flex-col">
                            <span className="font-semibold">{option.label}</span>
                            {option.description && (
                              <span className="text-xs text-muted-foreground">{option.description}</span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </Command>
          </PopoverContent>
        )}
      </Popover>
    )
  }
)

Mentions.displayName = "Mentions"

export { Mentions }

