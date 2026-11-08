import { ColorSwitcher } from "@/components/color-switcher";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { findMenuChain } from "@/lib/menu";
import { useMenuStore } from '@/store/index';
import React from 'react';
import { useLocation } from 'react-router';
export function SiteHeader() {
  const location = useLocation();
  const menus = useMenuStore((state) => state.menus);
  const pathname: string = location.pathname;
  // 面包屑标题同样来自 /auth/menus，而不是前端翻译表
  const titles: string[] = findMenuChain(menus, pathname).map((node) => node.name);
  return (
    <header className="sticky top-0 z-50 bg-background flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {titles.map((title, index) => (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  <BreadcrumbLink >
                    {title}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {index !== titles.length - 1 && (
                  <BreadcrumbSeparator />
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          <ColorSwitcher />
          <Button variant="ghost" size="sm" className="hidden sm:flex" title="code">
            <a
              href="https://github.com/yluiop123/orange"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}
