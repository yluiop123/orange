// components/ActionGuard.tsx
import { useUserStore } from "@/store"
import { isSamePath } from "@/lib/path"
import { useLocation } from "react-router"

export default function ActionAuth({
  action,
  children
}: {
  action: string
  children: React.ReactNode
}) {
    const { pathname } = useLocation()
    const { userInfo } = useUserStore()
    const actionPermission = (userInfo?.currentPermission || [])
        .filter((item) => item?.type == "action");
    const hasPermission = actionPermission.some((item) => isSamePath(item.path, pathname) && item.action==action);
    if (!hasPermission) return null
  return <>{children}</>
}
