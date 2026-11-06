import 'cesium/Build/Cesium/Widgets/widgets.css';
import * as Cesium from 'cesium';
import { Viewer } from "resium";

// CesiumJS is bundled locally; the demo uses OpenStreetMap imagery, so no
// Cesium Ion token is required. Ion-dependent widgets stay disabled.
const osmImagery = new Cesium.ImageryLayer(
  new Cesium.UrlTemplateImageryProvider({
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    credit: "© OpenStreetMap contributors",
  }),
);

export default function CesiumViewer() {
    return (
    // flex-1 + min-h-0 保证本层能占满并允许内部高度到 100%
    <div className="flex-1 min-h-0 relative">
      {/* 直接给 h-full 让 Viewer 填满父容器 */}
      <div className="w-full h-full min-h-0">
        <Viewer
        baseLayer={osmImagery}
        animation={false}
        timeline={false}
        geocoder={false}
        homeButton={false}
        navigationHelpButton={false}
        sceneModePicker={false}
        baseLayerPicker={false}
        fullscreenButton={false}
        infoBox={false}
        selectionIndicator={false}
        shouldAnimate
        style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
    )
}
