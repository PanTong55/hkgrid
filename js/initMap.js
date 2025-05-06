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

  function isMobile() {
    return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  }
  
  // 建立通用 attribution 設定
  const osmAttr = isMobile() ? {} : { attribution: "© OpenStreetMap contributors" };
  const esriAttr = isMobile() ? {} : { attribution: "Tiles © Esri" };
  const cartoAttr = isMobile() ? {} : { attribution: '© <a href="https://carto.com/">Carto</a>' };
  const googleAttr = isMobile() ? {} : { attribution: "Map data ©2024 Google" };
  const imageryAttr = isMobile()
    ? {}
    : {
        attribution:
          'Image ©2002 NASA/USGS | Image ©2016 NASA/USGS | Contains modified Copernicus Sentinel data [2022] | ' +
          '<a href="https://api.portal.hkmapservice.gov.hk/disclaimer" target="_blank">&copy; 地圖資料由地政總署提供</a> ' +
          '<img src="https://api.hkmapservice.gov.hk/mapapi/landsdlogo.jpg" style="height:14px; vertical-align:middle;">'
      };
  const landsdAttr = isMobile()
    ? {}
    : {
        attribution:
          '<a href="https://api.portal.hkmapservice.gov.hk/disclaimer" target="_blank">&copy; 地圖資料由地政總署提供</a> ' +
          '<img src="https://api.hkmapservice.gov.hk/mapapi/landsdlogo.jpg" style="height:14px; vertical-align:middle;">'
      };
  
  // 建立各底圖圖層
  const streets = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", osmAttr).addTo(map);
  const esriSatellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", esriAttr);
  const cartoLight = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", cartoAttr);
  const cartoDark = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", cartoAttr);
  const googleStreets = L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", googleAttr);
  const googleSatellite = L.tileLayer("https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", googleAttr);
  const googleHybrid = L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", googleAttr);
  
  const hkImageryLayer = L.tileLayer(
    'https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/imagery/wgs84/{z}/{x}/{y}.png',
    { ...imageryAttr, minZoom: 0, maxZoom: 19 }
  );
  
  const hkVectorBase = L.tileLayer(
    'https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/basemap/wgs84/{z}/{x}/{y}.png',
    { ...landsdAttr, maxZoom: 20, minZoom: 10 }
  );
  
  const hkVectorLabel = L.tileLayer(
    'https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/label/hk/tc/wgs84/{z}/{x}/{y}.png',
    { attribution: false, maxZoom: 20, minZoom: 0 }
  );
  
  // Grouped basemaps
  const hkVectorGroup = L.layerGroup([hkVectorBase, hkVectorLabel]);
  const hkImageryGroup = L.layerGroup([hkImageryLayer, hkVectorLabel]);

  map.on("zoomend", () => {
    const currentZoom = map.getZoom();
    if (currentZoom > 19 && map.hasLayer(hkImageryGroup)) {
      map.setZoom(19); // 強制縮回
    }
  });  

  const baseMaps = {
    "Street (OSM)": streets,
    "Street (Carto) Light": cartoLight,
    "Street (Carto) Dark": cartoDark,
    "Street (Google)": googleStreets,
    "Hybrid (Google)": googleHybrid,
    "Satellite (Google)": googleSatellite,
    "Satellite (Esri)": esriSatellite,
    "Satellite (HKMap)": hkImageryGroup,
    "Street (HKMap)": hkVectorGroup,
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
      layersControl.addOverlay(hkcpLayer, "CP Boundary (OSM)");
    });
  
  return { map, layersControl };
}
