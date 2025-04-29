// modules/coord-scale.js
export function initCoordScale(map) {
  // 定義 HK1980 投影參數
  proj4.defs("EPSG:2326", "+proj=tmerc +lat_0=22.31213333333334 +lon_0=114.1785555555556 +k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +towgs84=-162.619,-276.959,-161.764,0.067753,-2.24365,-1.15883,-1.09425 +units=m +no_defs");

  const crsModeSelect = document.getElementById("crsMode");
  const coordDisplay = document.getElementById("mouseCoords");

  map.on("mousemove", function (e) {
    const mode = crsModeSelect.value;
    if (mode === "wgs84") {
      coordDisplay.textContent = `Lon: ${e.latlng.lng.toFixed(6)}  Lat: ${e.latlng.lat.toFixed(6)}`;
    } else {
      const [x, y] = proj4("EPSG:4326", "EPSG:2326", [e.latlng.lng, e.latlng.lat]);
      coordDisplay.textContent = `X: ${Math.round(x)}  Y: ${Math.round(y)}`;
    }
  });

  // 加入 Leaflet 的比例尺控制
  const scaleControl = L.control.scale({ imperial: false }).addTo(map);

  map.whenReady(() => {
    const scaleEl = document.querySelector(".leaflet-control-scale");
    const wrapper = document.getElementById("coord-scale-wrapper");
    if (scaleEl && wrapper) {
      wrapper.appendChild(scaleEl);
    }
  });
}
