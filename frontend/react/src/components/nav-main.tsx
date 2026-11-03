"use client"


import { SidebarMenuTree } from "@/components/sidebar-menutree";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu
} from "@/components/ui/sidebar";
import type { MenuNode } from "@/types/menu";
import { useIntl } from "react-intl";
export function NavMain({items}: {items: MenuNode[]}) {
  const intl = useIntl();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{intl.formatMessage({ id: "sidebar.menu.title" })}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
           <SidebarMenuTree item={item} key={item.id}></SidebarMenuTree>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
