const pageModules = import.meta.glob("../pages/**/index.tsx");

// 这些页面由 App.tsx 的固定路由直接渲染，不参与菜单路由注册
const SPECIAL_PAGES = new Set(["/login", "/swagger", "/forbidden", "/not-found"]);

function toPagePath(key: string) {
  return key.replace(/^\.\.\/pages/, "").replace(/\/index\.tsx$/, "");
}

/** 由页面文件树自动得到的页面路由，不再维护静态路由清单 */
export const pageRoutes = Object.entries(pageModules)
  .map(([key, loader]) => ({ path: toPagePath(key), loader }))
  .filter(({ path }) => !SPECIAL_PAGES.has(path))
  .sort((a, b) => a.path.localeCompare(b.path));

const pageLoaderMap = new Map(
  pageRoutes.map(({ path, loader }) => [path, loader]),
);

/** 页面路径的所有父级路径，用于注册菜单父级的跳转路由 */
export const containerPaths = [
  ...new Set(pageRoutes.flatMap(({ path }) => ancestorPaths(path))),
].sort();

function ancestorPaths(path: string): string[] {
  const segments = path.split("/").filter(Boolean);
  const ancestors: string[] = [];
  for (let index = 1; index < segments.length; index += 1) {
    ancestors.push(`/${segments.slice(0, index).join("/")}`);
  }
  return ancestors;
}

export function getPageLoader(path: string) {
  return pageLoaderMap.get(path);
}
