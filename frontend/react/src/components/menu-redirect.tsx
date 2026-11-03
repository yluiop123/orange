import { Button } from "@/components/ui/button";
import { findMenuNode } from "@/lib/menu";
import { useMenuStore } from "@/store";
import { useAccess } from "@/store/access";
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
  const access = useAccess();

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
      <div className="flex h-full items-center justify-center">
        {intl.formatMessage({ id: "sidebar.menu.loading" })}
      </div>
    );
  }

  const node = nodePath ? findMenuNode(menus, nodePath) : undefined;
  const nodes = nodePath ? (node ? [node] : []) : menus;
  // 节点在新角色视角下不可见时（例如刚切换角色），退回全站第一个可见叶子
  const target = access.firstVisibleLeaf(nodes) ?? access.firstVisibleLeaf(menus);

  return <Navigate to={target ?? "/forbidden"} replace />;
}
