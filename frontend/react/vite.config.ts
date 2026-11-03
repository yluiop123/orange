import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { ConfigEnv, defineConfig, loadEnv } from "vite";
import * as cesiumPlugin from 'vite-plugin-cesium-build';
const isAnalyze = process.env.ANALYZE === "true";
export default defineConfig(({ mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd(), "");
  // 默认为根路径
  const base = env.VITE_BASE || "/";
  return {
    base,
    // 其他配置...
    server: {
      port: 3000,
      host: "0.0.0.0",
      // 开发环境把 /api 转发到后端，浏览器视角保持同源，无需本地 CORS。
      // 仅 `pnpm dev` 生效；`vite build` 的产物不会包含代理。
      proxy: {
        "/api": {
          target: env.VITE_PROXY_TARGET || "http://localhost:8080",
          changeOrigin: true,
        },
      },
    },
    plugins: [
      react(),
      // Cesium 保持 external IIFE，由地图页在需要时动态加载，
      // 避免 5MB+ 的 Cesium.js 同步注入到每个页面的 index.html。
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((cesiumPlugin as any).default || (cesiumPlugin as any).cesium || cesiumPlugin)(),
      {
        name: 'strip-cesium-script',
        // 开发和生产都移除插件注入的全局脚本，由 /map/cesium 页面按需加载，
        // 避免每个页面都下载 5MB+ 的 Cesium.js。
        transformIndexHtml: {
          order: 'post' as const,
          handler(html: string) {
            return html
              .replace(
                /<script[^>]*src="[^"]*Cesium\.js"[^>]*><\/script>\s*/g,
                "",
              )
              .replace(
                /<script>Object\.defineProperty\(globalThis, 'CESIUM_BASE_URL'[\s\S]*?<\/script>\s*/g,
                "",
              );
          },
        },
      },
      tailwindcss(),
      ...(isAnalyze
        ? [
            visualizer({
              filename: "dist/stats.html",
              open: true,
              gzipSize: true,
              brotliSize: true,
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
  };
});
