import {
  IconDotsVertical,
  IconKey,
  IconLogout,
  IconUserCircle,
} from "@tabler/icons-react";
import { useState } from "react";

import orangeLogo from "@/assets/orange.png";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { cn } from "@/lib/utils";
import { useUserStore } from "@/store";
import { useIntl } from "react-intl";
import { toast } from "sonner";

export function NavUser() {
  const { isMobile } = useSidebar();
  const intl = useIntl();
  const { logout, userInfo, updateUserInfo } = useUserStore();
  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  return (
    <>
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className={cn(
                  open && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={orangeLogo} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{userInfo?.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {userInfo?.email}
                  </span>
                </div>

                <IconDotsVertical className="ml-auto size-4" />
              </SidebarMenuButton>
            }
          />

          <DropdownMenuContent
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
            className="min-w-56"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      {userInfo?.name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 leading-tight">
                    <span className="truncate font-medium">{userInfo?.name}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {userInfo?.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() =>
                toast.info(
                  intl.formatMessage({ id: "sidebar.user.profile.todo" }),
                )
              }
            >
              <IconUserCircle className="size-4" />
              {intl.formatMessage({ id: "sidebar.user.message" })}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => setPasswordOpen(true)}>
              <IconKey className="size-4" />
              {intl.formatMessage({ id: "sidebar.user.changePassword" })}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuRadioGroup
              value={userInfo?.currentRole ?? "all"}
              onValueChange={(value) => updateUserInfo({ currentRole: value })}
            >
              <DropdownMenuRadioItem value="all">
                {intl.formatMessage({ id: "sidebar.user.all" })}
              </DropdownMenuRadioItem>
              {userInfo?.roles?.map((role) => (
                <DropdownMenuRadioItem key={role.id} value={role.id}>
                  {role.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem variant="destructive" onClick={logout}>
              <IconLogout className="size-4" />
              {intl.formatMessage({ id: "sidebar.user.logout" })}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
    <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </>
  );
}
