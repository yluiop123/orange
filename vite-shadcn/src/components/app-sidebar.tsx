"use client"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { routeSetting } from "@/routes"
import orangeLogo from "@/assets/orange.png"
import * as React from "react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavMain items={routeSetting} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser/>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}