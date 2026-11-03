import 'cesium/Build/Cesium/Widgets/widgets.css';
import * as Cesium from 'cesium';
import { Viewer } from "resium";

const ionToken = import.meta.env.VITE_CESIUM_TOKEN;
if (ionToken) {
  Cesium.Ion.defaultAccessToken = ionToken;
}

// 没有 Ion token 时回退到 OpenStreetMap，保证演示页离线/无 token 也能渲染。
const fallbackImagery = ionToken
  ? undefined
  : new Cesium.ImageryLayer(
      new Cesium.UrlTemplateImageryProvider({
        url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        credit: "© OpenStreetMap contributors",
      }),
    );

export default function CesiumViewer() {
    return (
    // flex-1 + min-h-0 保证本层能占满并允许内部高度为 100%
    <div className="flex-1 min-h-0 relative">
      {/* 直接用 h-full 让 Viewer 填满父容器 */}
      <div className="w-full h-full min-h-0">
        <Viewer
        baseLayer={fallbackImagery}
        style={{ width: "100%", height: "100%" }}
        // fullscreenButton={false}
        // timeline={false}
        // animation={false}
        />
      </div>
    </div>
    )
}
