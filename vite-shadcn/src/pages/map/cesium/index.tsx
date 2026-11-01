import { lazy, Suspense, useEffect, useState } from "react";

const CesiumViewer = lazy(() => import("./viewer"));

let cesiumPromise: Promise<void> | null = null;

type CesiumWindow = Window & {
  Cesium?: unknown;
  CESIUM_BASE_URL?: string;
};

function loadCesiumScript() {
  const cesiumWindow = window as CesiumWindow;
  if (cesiumWindow.Cesium) {
    return Promise.resolve();
  }
  if (!cesiumPromise) {
    cesiumPromise = new Promise<void>((resolve, reject) => {
      // 本地 Cesium 资源由 vite-plugin-cesium-build 复制到 cesium-package，
      // 生产环境从构建产物加载，不依赖外部 CDN。
      const base = String(
        cesiumWindow.CESIUM_BASE_URL ||
          `${import.meta.env.BASE_URL}cesium-package/`,
      ).replace(/\/?$/, "/");
      // Cesium 通过全局变量定位 Assets/Widgets/Workers
      cesiumWindow.CESIUM_BASE_URL = base;
      const script = document.createElement("script");
      script.src = `${base}Cesium.js`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Cesium 资源加载失败"));
      document.head.appendChild(script);
    });
  }
  return cesiumPromise;
}

export default function Index() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadCesiumScript()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Cesium 资源加载失败");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        {error}
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center">
        Loading Cesium...
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          Loading Cesium...
        </div>
      }
    >
      <CesiumViewer />
    </Suspense>
  );
}
