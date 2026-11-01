import { ForbiddenDialog } from "@/components/forbidden-dialog";
import { Toaster } from "@/components/ui/sonner";
import { routes } from '@/routes';
import { useLocaleStore } from "@/store/index";
import { lazy, Suspense } from 'react';
import { IntlProvider } from 'react-intl';
import {
    BrowserRouter,
    HashRouter,
    Navigate,
    Route,
    Routes
} from "react-router";

const Swagger = lazy(() => import("@/pages/swagger"));
const Login = lazy(() => import("@/pages/login"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Forbidden = lazy(() => import("@/pages/forbidden"));
// 布局也懒加载，登录页不必下载侧边栏和站点头部
const PageLayout = lazy(() => import("@/layout"));

const pageModules = import.meta.glob('./pages/**/index.tsx');
const pageComponentCache = new Map<string, ReturnType<typeof lazy>>();

const getLazyComponent = (path: string) => {
    const key = `./pages${path}/index.tsx`;
    const module = pageModules[key];
    if (!module) throw new Error(`Module not found: ${key}`);
    if (!pageComponentCache.has(key)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pageComponentCache.set(key, lazy(module as any));
    }
    return pageComponentCache.get(key)!;
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
                        <Route path="/swagger" element={<Swagger />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/forbidden" element={<Forbidden />} />
                        {routes.length > 0 && <Route path="/" element={<Navigate to={routes[0].path} />} />}
                        <Route path="*" element={<NotFound />} />
                        <Route path="/" Component={PageLayout}>
                            {routes.map(route => (
                                route.redirect ?
                                    <Route
                                        key={`${route.path}:redirect`}
                                        path={route.path}
                                        element={<Navigate to={route.redirect} replace />}
                                    />
                                    :
                                    <Route
                                        key={route.path}
                                        path={route.path}
                                        Component={getLazyComponent(route.element ?? '')}
                                    />
                            ))}
                        </Route>
                    </Routes>
                </Suspense>
            </Router>
            <Toaster />
            <ForbiddenDialog />
        </IntlProvider>
    )
}
