import { ColorSwitcher } from "@/components/color-switcher";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { findMenuChain } from "@/lib/menu";
import { useLocaleStore, useMenuStore, useThemeStore } from '@/store/index';
import React from 'react';
import { useIntl } from 'react-intl';
import { useLocation } from 'react-router';
export function SiteHeader() {
  const location = useLocation();
  const intl = useIntl()
  const {mode,setMode} = useThemeStore();
  const menus = useMenuStore((state) => state.menus);
  const pathname: string = location.pathname;
  const titles: string[] = findMenuChain(menus, pathname).map((node) => node.name);
  const {locale,setLocale} = useLocaleStore();
  function setLanguage(language:string) {
    setLocale(language as "zh" | "en" );
  } 
  return (
    <header className="sticky top-0 z-50 bg-background flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
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
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-15 border border-foreground/10 bg-foreground/10 px-1 text-xs"
                />
              }
            >
              {intl.formatMessage({id:'header.language'})}
            </DropdownMenuTrigger>
            <DropdownMenuContent >
              <DropdownMenuRadioGroup value={locale} onValueChange={setLanguage}>
                <DropdownMenuRadioItem value="zh">中文</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="en">EN</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Switch id="airplane-mode" checked={mode === 'dark'}
            // className="bg-white dark:bg-white data-[state=checked]:bg-black"
            onCheckedChange={(checked) => setMode(checked ? 'dark' : 'light')} />
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
