"use client"


import { SidebarMenuTree } from "@/components/sidebar-menutree";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu
} from "@/components/ui/sidebar";
import type { MenuNode } from "@/types/menu";
export function NavMain({items}: {items: MenuNode[]}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
           <SidebarMenuTree item={item} key={item.id}></SidebarMenuTree>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
