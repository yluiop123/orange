import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import * as cesiumPluginModule from 'vite-plugin-cesium-build'

const cesiumPlugin =
  (cesiumPluginModule as { default?: () => unknown }).default ??
  (cesiumPluginModule as unknown as () => unknown)

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: '/',
    plugins: [
      vue(),
      cesiumPlugin() as never,
      {
        name: 'strip-cesium-script',
        // The Cesium IIFE bundle is >5 MB. Load it only on /map/cesium instead of
        // injecting it into every page's index.html.
        transformIndexHtml: {
          order: 'post' as const,
          handler(html: string) {
            return html
              .replace(/<script[^>]*src="[^"]*Cesium\.js"[^>]*><\/script>\s*/g, '')
              .replace(
                /<script>Object\.defineProperty\(globalThis, 'CESIUM_BASE_URL'[\s\S]*?<\/script>\s*/g,
                '',
              )
          },
        },
      },
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: Number(env.VITE_PORT) || 5174,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://127.0.0.1:8080',
          changeOrigin: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 2000,
    },
  }
})
