import { createAccess } from "@/lib/access";
import useUserStore from "@/store/user";
import { useMemo } from "react";

/** 组件通过这个 hook 读取当前角色视角的访问模型。 */
export function useAccess() {
  const permissions = useUserStore((state) => state.userInfo?.currentPermission);
  return useMemo(() => createAccess(permissions), [permissions]);
}
