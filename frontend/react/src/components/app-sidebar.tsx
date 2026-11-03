"use client"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useMenuStore } from "@/store"
import { useAccess } from "@/store/access"
import orangeLogo from "@/assets/orange.png"
import * as React from "react"
import { useIntl } from "react-intl"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const intl = useIntl()
  const menus = useMenuStore((state) => state.menus)
  const loading = useMenuStore((state) => state.loading)
  const error = useMenuStore((state) => state.error)
  const fetchMenus = useMenuStore((state) => state.fetchMenus)
  const access = useAccess()

  const visibleMenus = React.useMemo(
    () => access.visibleMenuTree(menus),
    [access, menus],
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
          <Avatar className="h-15 w-15 rounded-lg ml-15 group-data-[state=collapsed]:hidden">
            <AvatarImage src={orangeLogo} />
            <AvatarFallback className="rounded-lg">Orange</AvatarFallback>
          </Avatar>
      </SidebarHeader>

      <SidebarContent
        className={cn(
          "flex-1 overflow-y-auto",
          // 1. 基础样式：定义滚动条宽度和轨道颜色
          "scrollbar-thin scrollbar-track-transparent",
          // 2. 滑块样式：圆角及颜色 (适配暗黑模式)
          "scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40",
          "dark:scrollbar-thumb-slate-700 dark:hover:scrollbar-thumb-slate-600",
          // 3. 细节：滑块圆角
          "scrollbar-thumb-rounded-full"
        )}
      >
        {visibleMenus.length > 0 ? (
          <NavMain items={visibleMenus} />
        ) : loading ? (
          <div className="px-4 py-3 text-sm text-muted-foreground">
            {intl.formatMessage({ id: "sidebar.menu.loading" })}
          </div>
        ) : error ? (
          <div className="px-4 py-3 text-sm text-muted-foreground">
            <p>{intl.formatMessage({ id: "sidebar.menu.error" })}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => fetchMenus()}
            >
              {intl.formatMessage({ id: "sidebar.menu.retry" })}
            </Button>
          </div>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <NavUser/>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
