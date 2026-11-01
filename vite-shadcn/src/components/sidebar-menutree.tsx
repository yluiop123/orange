"use client"

import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { isPathWithin, isSamePath } from "@/lib/path"
import { NavItem } from "@/routes"
import { useUserStore } from "@/store"
import { ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { useIntl } from "react-intl"
import { Link, useLocation } from "react-router"

export function SidebarMenuTree({ item }: { item: NavItem }) {
  const location = useLocation()
  const { userInfo } = useUserStore()
  const intl = useIntl()

  function checkIsActive(href: string) {
    if (!href) return false
    return isPathWithin(location.pathname, href)
  }

  const itemPath = "/" + item.keys?.join("/")

  const hasPermission =
    (userInfo?.currentMenuPermission || []).some((path) => isSamePath(path, itemPath)) ||
    (userInfo?.currentDirectoryPermission || []).some((dir) => isPathWithin(itemPath, dir))

  // 是否默认展开（命中当前路由）
  const defaultOpen = checkIsActive(item.keys?.join("/") ?? "")
  const [open, setOpen] = useState(defaultOpen)

  // 路由变化时自动展开
  useEffect(() => {
    if (defaultOpen) setOpen(true)
  }, [defaultOpen])

  if (!hasPermission) return null

  const hasChildren = !!item.children?.length

  return (
    <SidebarMenuItem>
      {/* ===== Trigger / Item ===== */}
      {hasChildren ? (
        <SidebarMenuButton
          onClick={() => setOpen(v => !v)}
          className={cn(
            "px-4 py-2 flex items-center",
            "hover:bg-sidebar hover:text-sidebar-active-foreground",
            defaultOpen ? "bg-sidebar text-sidebar-active-foreground" : "text-sidebar-foreground"
          )}
        >
          {item.icon && <item.icon />}
          <span>{intl.formatMessage({ id: item.title })}</span>

          <ChevronRight
            className={cn(
              "ml-auto transition-transform duration-200",
              open && "rotate-90"
            )}
          />
        </SidebarMenuButton>
      ) : (
        <SidebarMenuButton
          render={
            <Link
              to={{
                pathname: "/" + item.keys?.join("/"),
              }}
            />
          }
          onClick={() => setOpen(v => !v)}
          className={cn(
            "px-4 py-2 flex items-center",
            defaultOpen
              ? "bg-sidebar-active hover:bg-sidebar hover:text-sidebar-active-foreground" // 激活状态：背景 bg-sidebar，文字 text-sidebar-active-foreground
              : "hover:bg-sidebar hover:text-sidebar-active-foreground"
          )}
        >
            {item.icon && <item.icon />}
            <span>{intl.formatMessage({ id: item.title })}</span>
          </SidebarMenuButton>
      )}

      {/* ===== Children ===== */}
      {hasChildren && open && (
        <SidebarMenuSub>
          {item.children?.map((subItem, index) => (
            <SidebarMenuTree item={subItem} key={index} />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  )
}
