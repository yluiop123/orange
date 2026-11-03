import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { HTMLAttributes, PropsWithChildren, ReactElement } from 'react';
import { createContext, forwardRef, useState } from 'react';

interface LayoutContextProps {
  direction?: 'ltr' | 'rtl';
  collapsed?: boolean;
}

const LayoutContext = createContext<LayoutContextProps>({});

interface LayoutProps extends HTMLAttributes<HTMLDivElement> {
  direction?: 'ltr' | 'rtl';
}

export const Layout = forwardRef<HTMLDivElement, LayoutProps>(
  ({ direction = 'ltr', className, ...props }, ref) => {
    return (
      <LayoutContext.Provider value={{ direction }}>
        <div
          ref={ref}
          className={cn('flex min-h-screen flex-col', className)}
          {...props}
        />
      </LayoutContext.Provider>
    );
  }
);

Layout.displayName = 'Layout';

interface HeaderProps extends HTMLAttributes<HTMLHeadElement> {
  sticky?: boolean;
}

export const Header = forwardRef<HTMLHeadElement, HeaderProps>(
  ({ className, sticky = true, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          'z-10 flex h-16 items-center gap-4 border-b bg-background px-4',
          sticky && 'sticky top-0',
          className
        )}
        {...props}
      />
    );
  }
);

Header.displayName = 'Header';

interface SiderProps extends HTMLAttributes<HTMLElement> {
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  collapseIcon?: ReactElement;
  expandIcon?: ReactElement;
  trigger?: boolean;
  width?: number;
  collapsedWidth?: number;
  reverseArrow?: boolean;
  breakpoint?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Sider = forwardRef<HTMLElement, SiderProps>(
  (
    {
      className,
      collapsible = false,
      collapsed: controlledCollapsed,
      onCollapseChange,
      collapseIcon,
      expandIcon,
      trigger = true,
      width = 200,
      collapsedWidth = 48,
      reverseArrow = false,
      children,
      ...props
    },
    ref
  ) => {
    const [internalCollapsed, setInternalCollapsed] = useState(false);
    
    const isControlled = controlledCollapsed !== undefined;
    const collapsed = isControlled ? controlledCollapsed : internalCollapsed;
    
    const handleToggle = () => {
      const newCollapsed = !collapsed;
      if (!isControlled) {
        setInternalCollapsed(newCollapsed);
      }
      onCollapseChange?.(newCollapsed);
    };

    const style = {
      ...props.style,
      flex: `0 0 ${collapsed ? collapsedWidth : width}px`,
      maxWidth: `${collapsed ? collapsedWidth : width}px`,
      minWidth: `${collapsed ? collapsedWidth : width}px`,
      width: `${collapsed ? collapsedWidth : width}px`,
    };

    return (
      <aside
        ref={ref}
        className={cn(
          'relative flex h-full flex-col border-r bg-muted transition-all duration-200 ease-in-out',
          className
        )}
        style={style}
        {...props}
      >
        <div 
          className={cn(
            'h-full transition-all duration-200 ease-in-out overflow-hidden',
            collapsed ? 'w-0' : 'w-full'
          )}
        >
          <div className={cn('transition-opacity duration-200', collapsed ? 'opacity-0' : 'opacity-100')}>
            {children}
          </div>
        </div>
        {collapsible && trigger && (
          <div
            className="absolute bottom-0 right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-r-sm hover:bg-accent/50"
            onClick={handleToggle}
          >
            {reverseArrow
              ? collapsed
                ? expandIcon || <ChevronRight className="h-4 w-4 text-muted-foreground" />
                : collapseIcon || <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              : collapsed
              ? expandIcon || <ChevronRight className="h-4 w-4 text-muted-foreground" />
              : collapseIcon || <ChevronLeft className="h-4 w-4 text-muted-foreground" />}
          </div>
        )}
      </aside>
    );
  }
);

Sider.displayName = 'Sider';

type ContentProps = HTMLAttributes<HTMLDivElement>;

export const Content = forwardRef<HTMLDivElement, ContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <main
        ref={ref}
        className={cn('flex-1 overflow-auto p-6', className)}
        {...props}
      />
    );
  }
);

Content.displayName = 'Content';

type FooterProps = HTMLAttributes<HTMLElement>;

export const Footer = forwardRef<HTMLElement, FooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <footer
        ref={ref}
        className={cn('flex items-center border-t p-4 text-sm', className)}
        {...props}
      />
    );
  }
);

Footer.displayName = 'Footer';

interface LayoutSectionProps extends PropsWithChildren {
  hasSider?: boolean;
}

export const LayoutSection = forwardRef<HTMLDivElement, LayoutSectionProps>(
  ({ children, hasSider = false, ...props }, ref) => {
    const flexDirection = hasSider ? 'row' : 'column';
    
    return (
      <div
        ref={ref}
        className={cn('flex flex-1', `flex-${flexDirection}`)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

LayoutSection.displayName = 'LayoutSection';

export interface SplitLayoutProps {
  left: ReactElement;
  right: ReactElement;
  leftWidth?: number;
  rightWidth?: number;
  leftClassName?: string;
  rightClassName?: string;
}

export const SplitLayout = ({
  left,
  right,
  leftWidth = 256,
  rightWidth,
  leftClassName,
  rightClassName,
}: SplitLayoutProps) => {
  return (
    <div className="flex h-full w-full">
      <div 
        className={cn('h-full border-r', leftClassName)} 
        style={{ width: leftWidth }}
      >
        {left}
      </div>
      <div 
        className={cn('flex-1', rightClassName)} 
        style={rightWidth ? { width: rightWidth } : {}}
      >
        {right}
      </div>
    </div>
  );
};