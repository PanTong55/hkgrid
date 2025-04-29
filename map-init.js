// modules/map-init.js
import 'https://unpkg.com/leaflet/dist/leaflet.js';

export let mapInstance = null;
export let layersControl = null;

// 香港地理範圍，供其他功能用
export const hongKongBounds = [
  [22.15, 113.825],
  [22.55, 114.4],
];

export function initMap() {
  mapInstance = L.map("map");
  mapInstance.fitBounds(hongKongBounds);

  // 定義底圖圖層
  const streets = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(mapInstance);

  const esriSatellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Tiles © Esri" }
  );

  const cartoLight = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    { attribution: "CARTO" }
  );

  const googleStreets = L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
    attribution: "Map data ©2024 Google",
  });

  const googleSatellite = L.tileLayer("https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
    attribution: "Imagery ©2024 Google",
  });

  const googleHybrid = L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
    attribution: "Imagery ©2024 Google",
  });

  const baseMaps = {
    "街道圖 (OSM)": streets,
    "衛星圖 (Esri)": esriSatellite,
    "街道圖 (Carto)": cartoLight,
    "Google 街道圖": googleStreets,
    "Google 衛星圖": googleSatellite,
    "Google 混合圖": googleHybrid,
  };

  // 加入底圖切換控制
  layersControl = L.control.layers(baseMaps, {}, { collapsed: true }).addTo(mapInstance);

  // 圖標初始化（Lucide）
  mapInstance.whenReady(() => {
    lucide.createIcons();
  });
}
