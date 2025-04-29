import { initMap, mapInstance, layersControl, hongKongBounds } from './modules/map-init.js';
import { initCoordScale } from './modules/coord-scale.js';
import { initFullscreen } from './modules/fullscreen-control.js';
import { initGotoPoint } from './modules/goto-point.js';
import { initDrawPoint } from './modules/draw-point.js';
import { initLocateTracking } from './modules/locate-tracking.js';
import { initTooltipLegend } from './modules/tooltip-legend.js';

// 初始化地圖
initMap();  // ⬅️ 會建立 window.map / window.mapInstance 全域存取

// 座標系統、滑鼠座標與比例尺
initCoordScale(mapInstance);

// 全螢幕控制
initFullscreen(mapInstance);

// Go To Point 輸入定位功能
initGotoPoint(mapInstance);

// 畫點功能（可拖動、帶tooltip）
initDrawPoint(mapInstance);

// 手機定位 + 方向追蹤功能
initLocateTracking(mapInstance);

// Tooltip hover + Legend + Bat Grid data 載入
initTooltipLegend(mapInstance, layersControl);

// 顯示最後修改時間
const lastModified = new Date(document.lastModified);
document.getElementById("last-modified").textContent =
  "最後修改時間：" + lastModified.toLocaleString("zh-Hant", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
