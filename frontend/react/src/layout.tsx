import { useAccessToken } from "@/auth/token";
import { AppSidebar } from "@/components/app-sidebar";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { containerPaths } from "@/lib/page-routes";
import { isSamePath } from "@/lib/path";
import { useMenuStore, useUserStore } from '@/store';
import { useAccess } from "@/store/access";
import { Suspense, useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation } from "react-router";
//根据用户登录信息进行权限控制
export default function Index() {
    const token = useAccessToken();
    const { userInfo, fetchUser } = useUserStore();
    const access = useAccess();
    const { loaded: menusLoaded, fetchMenus } = useMenuStore();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const hasFetchedRef = useRef(false);
    useEffect(() => {
        const check = async () => {
            if (token && !userInfo) {
                if (!hasFetchedRef.current) {
                    hasFetchedRef.current = true;
                    await fetchUser().finally(() => {
                        setLoading(false);
                    }); // ✅ 这里能拿到 userInfo
                }
            } else {
                setLoading(false);
            }
        };
        check();
    }, [userInfo, token, fetchUser]);
    useEffect(() => {
        if (token && !menusLoaded) {
            fetchMenus();
        }
    }, [token, menusLoaded, fetchMenus]);
    if (loading) return <div>Loading...</div>;

    // 没有登录或没有权限
    // 1. 获取当前路径
    const currentPath = location.pathname;

    // 2. 判定逻辑
    const hasPermission = access.canView(currentPath);
    // 根路径和菜单父级路径由 MenuRedirect 处理，不直接判定 403
    const isHome = currentPath === "/";
    const isMenuContainer = containerPaths.some(path => isSamePath(path, currentPath));

    // 3. 组合判断
    if (!token) {
        return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    }
    if (!isHome && !isMenuContainer && !hasPermission && !userInfo?.mustChangePassword) {
        return <Navigate to="/forbidden" replace state={{ from: location.pathname + location.search }} />;
    }
    return (
        <SidebarProvider>
            <AppSidebar variant="sidebar" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col min-h-0">
                <div className="@container/main flex flex-1 flex-col gap-2 min-h-0">
                    <div className="flex flex-col gap-4 py-0 md:gap-6 md:py-0 px-0 flex-1 min-h-0">
                    <Suspense fallback={<div>Loading...</div>}>
                        <Outlet />
                    </Suspense>
                    </div>
                </div>
                </div>
            </SidebarInset>
            {userInfo?.mustChangePassword && (
                <ChangePasswordDialog open onOpenChange={() => {}} forced />
            )}
        </SidebarProvider>
    )
}
