"use client"

import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub
} from "@/components/ui/sidebar"
import { getMenuIcon } from "@/config/menu-icons"
import { menuTitleKey } from "@/lib/menu"
import { isPathWithin, isSamePath } from "@/lib/path"
import { cn } from "@/lib/utils"
import type { MenuNode } from "@/types/menu"
import { ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { useIntl } from "react-intl"
import { useLocation, useNavigate } from "react-router"

export function SidebarMenuTree({ item }: { item: MenuNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const intl = useIntl()
  const Icon = getMenuIcon(item.path, item.type)
  const hasChildren = item.children.length > 0
  const defaultOpen = isPathWithin(location.pathname, item.path)
  const [open, setOpen] = useState(defaultOpen)
  // 数据库 name 是兜底；有对应 i18n key 时随语言切换
  const title = intl.formatMessage({
    id: menuTitleKey(item.path),
    defaultMessage: item.name,
  })

  // 路由变化时自动展开当前路径上的父节点
  useEffect(() => {
    if (defaultOpen) setOpen(true)
  }, [defaultOpen])

  if (hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={title}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "px-4 py-2 flex items-center",
            "hover:bg-sidebar hover:text-sidebar-active-foreground",
            defaultOpen
              ? "bg-sidebar text-primary font-medium"
              : "text-sidebar-foreground",
          )}
        >
          <Icon />
          <span>{title}</span>
          <ChevronRight
            className={cn(
              "ml-auto transition-transform duration-200",
              open && "rotate-90",
            )}
          />
        </SidebarMenuButton>

        {open && (
          <SidebarMenuSub>
            {item.children.map((subItem) => (
              <SidebarMenuTree item={subItem} key={subItem.id} />
            ))}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
    )
  }

  const active = isSamePath(location.pathname, item.path)
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={title}
        onClick={() => navigate(item.path)}
        aria-current={active ? "page" : undefined}
        className={cn(
          "px-4 py-2 flex items-center",
          active
            ? "bg-sidebar-active hover:bg-sidebar hover:text-sidebar-active-foreground font-medium"
            : "hover:bg-sidebar hover:text-sidebar-active-foreground",
        )}
      >
        <Icon />
        <span>{title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
