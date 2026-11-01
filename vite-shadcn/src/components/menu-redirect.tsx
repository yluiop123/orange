import { Button } from "@/components/ui/button";
import { firstVisibleLeaf, findMenuNode } from "@/lib/menu";
import { useMenuStore, useUserStore } from "@/store";
import { useIntl } from "react-intl";
import { Navigate } from "react-router";

/**
 * 菜单父级路径和站点根路径的跳转：
 * 取当前角色视角下第一个可见叶子菜单。
 */
export function MenuRedirect({ nodePath }: { nodePath?: string }) {
  const intl = useIntl();
  const menus = useMenuStore((state) => state.menus);
  const loaded = useMenuStore((state) => state.loaded);
  const error = useMenuStore((state) => state.error);
  const fetchMenus = useMenuStore((state) => state.fetchMenus);
  const menuPaths = useUserStore(
    (state) => state.userInfo?.currentMenuPermission,
  );
  const directoryPaths = useUserStore(
    (state) => state.userInfo?.currentDirectoryPermission,
  );

  if (!loaded) {
    if (error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2">
          <p className="text-sm text-muted-foreground">
            {intl.formatMessage({ id: "sidebar.menu.error" })}
          </p>
          <Button variant="outline" size="sm" onClick={() => fetchMenus()}>
            {intl.formatMessage({ id: "sidebar.menu.retry" })}
          </Button>
        </div>
      );
    }
    return (
      <div className="flex h-full items-center justify-center">Loading...</div>
    );
  }

  const node = nodePath ? findMenuNode(menus, nodePath) : undefined;
  const nodes = nodePath ? (node ? [node] : []) : menus;
  const target = firstVisibleLeaf(nodes, menuPaths ?? [], directoryPaths ?? []);

  return <Navigate to={target ?? "/forbidden"} replace />;
}
