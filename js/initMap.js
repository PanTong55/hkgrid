// js/initMap.js
export async function initMap() {
  const map = L.map("map");
  const hongKongBounds = [
    [22.15, 113.825],
    [22.55, 114.4],
  ];
  map.fitBounds(hongKongBounds);

  proj4.defs("EPSG:2326", "+proj=tmerc +lat_0=22.31213333333334 +lon_0=114.1785555555556 +k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +towgs84=-162.619,-276.959,-161.764,0.067753,-2.24365,-1.15883,-1.09425 +units=m +no_defs");

  const scaleControl = L.control.scale({ imperial: false }).addTo(map);
  map.whenReady(() => {
    const scaleEl = document.querySelector(".leaflet-control-scale");
    const wrapper = document.getElementById("coord-scale-wrapper");
    if (scaleEl && wrapper) {
      wrapper.appendChild(scaleEl);
    }
    lucide.createIcons();
  });

  const streets = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors" }).addTo(map);
  const esriSatellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution: "Tiles © Esri" });
  const cartoLight = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { attribution: "CARTO" });
  const googleStreets = L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", { attribution: "Map data ©2024 Google" });
  const googleSatellite = L.tileLayer("https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", { attribution: "Imagery ©2024 Google" });
  const googleHybrid = L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", { attribution: "Imagery ©2024 Google" });

  const baseMaps = {
    "街道圖 (OSM)": streets,
    "街道圖 (Carto)": cartoLight,
    "街道圖 (Google)": googleStreets,
    "街道圖 (Esri)": esriSatellite,
    "街道圖 (Google Mix)": googleHybrid,
    "街道圖 (Google Satellite)": googleSatellite,
  };

  const layersControl = L.control.layers(baseMaps, {}, { collapsed: true }).addTo(map);

  fetch("https://raw.githubusercontent.com/PanTong55/hkgrid/main/OSM_CP.geojson")
    .then((r) => r.json())
    .then((hkcpData) => {
      const hkcpLayer = L.geoJSON(hkcpData, {
        style: {
          color: "#228B22",
          weight: 2,
          fillColor: "#ADFF2F",
          fillOpacity: 0.1,
        },
      });
      layersControl.addOverlay(hkcpLayer, "郊野公園邊界 (OSM)");
    });

  return { map, layersControl };
}
