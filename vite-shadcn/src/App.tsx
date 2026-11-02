import { ForbiddenDialog } from "@/components/forbidden-dialog";
import { MenuRedirect } from "@/components/menu-redirect";
import { Toaster } from "@/components/ui/sonner";
import { containerPaths, getPageLoader, pageRoutes } from '@/lib/page-routes';
import { useLocaleStore } from "@/store/index";
import { lazy, Suspense } from 'react';
import { IntlProvider } from 'react-intl';
import {
    BrowserRouter,
    HashRouter,
    Route,
    Routes
} from "react-router";

const Login = lazy(() => import("@/pages/login"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Forbidden = lazy(() => import("@/pages/forbidden"));
// 布局也懒加载，登录页不必下载侧边栏和站点头部
const PageLayout = lazy(() => import("@/layout"));

const pageComponentCache = new Map<string, ReturnType<typeof lazy>>();

const getLazyComponent = (path: string) => {
    const loader = getPageLoader(path);
    if (!loader) throw new Error(`Module not found for page: ${path}`);
    if (!pageComponentCache.has(path)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pageComponentCache.set(path, lazy(loader as any));
    }
    return pageComponentCache.get(path)!;
};

const isHashRouter = import.meta.env.VITE_ROUTE === 'hashRouter';
const Router = isHashRouter ? HashRouter : BrowserRouter;

export default function Index() {
    const { locale, messages } = useLocaleStore();
    // 路由组件懒加载
    return (
        <IntlProvider locale={locale} messages={messages}>
            <Router>
                <Suspense fallback={<div className="flex h-svh items-center justify-center">Loading...</div>}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/forbidden" element={<Forbidden />} />
                        <Route path="/" Component={PageLayout}>
                            <Route index element={<MenuRedirect />} />
                            {containerPaths.map(path => (
                                <Route
                                    key={`${path}:redirect`}
                                    path={path}
                                    element={<MenuRedirect nodePath={path} />}
                                />
                            ))}
                            {pageRoutes.map(({ path }) => (
                                <Route
                                    key={path}
                                    path={path}
                                    Component={getLazyComponent(path)}
                                />
                            ))}
                        </Route>
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Suspense>
            </Router>
            <Toaster />
            <ForbiddenDialog />
        </IntlProvider>
    )
}
