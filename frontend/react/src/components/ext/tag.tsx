// src/components/ui/tag.tsx
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import * as React from "react";

interface TagProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  closable?: boolean;
  onClose?: () => void;
  disabled?: boolean;
}

const tagVariants = {
  default: "bg-gray-100 text-gray-800 border-gray-200",
  primary: "bg-blue-100 text-blue-800 border-blue-200",
  secondary: "bg-purple-100 text-purple-800 border-purple-200",
  success: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  error: "bg-red-100 text-red-800 border-red-200",
  info: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

const tagSizes = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-0.5",
  lg: "text-base px-3 py-1",
};

const Tag = React.forwardRef<HTMLDivElement, TagProps>(
  ({ 
    children, 
    variant = 'default', 
    size = 'md', 
    closable = false, 
    onClose, 
    disabled = false, 
    className, 
    ...props 
  }, ref) => {
    const variantClass = tagVariants[variant];
    const sizeClass = tagSizes[size];
    
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border font-medium",
          variantClass,
          sizeClass,
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-default",
          className
        )}
        {...props}
      >
        <span>{children}</span>
        {closable && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-1.5 size-4 min-h-0 rounded-full p-0 hover:bg-transparent hover:opacity-75"
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
            aria-label="Remove tag"
          >
            <X className={size === 'sm' ? "h-3 w-3" : size === 'md' ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </Button>
        )}
      </div>
    );
  }
);
Tag.displayName = "Tag";

export { Tag, type TagProps };
