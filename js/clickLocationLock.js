let lockMarker = null;
let isLocked = false;
let lockedCoord = null;

export function initClickLocationLock(map, coordDisplay, crsModeSelect) {
  map.on("click", function (e) {
    const crsMode = crsModeSelect.value;
    const latlng = e.latlng;
  
    if (
      lockedMarker &&
      lockedMarker.getLatLng().lat === latlng.lat &&
      lockedMarker.getLatLng().lng === latlng.lng
    ) {
      // 點擊相同位置 → 移除鎖定
      map.removeLayer(lockedMarker);
      lockedMarker = null;
      lockedLatLng = null;
      coordLocked = false;
      return;
    }
  
    // 更新鎖定狀態
    if (!lockedMarker) {
      lockedMarker = L.marker(latlng, {
        icon: L.divIcon({
          className: "lucide-icon",
          html: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#007aff" viewBox="0 0 24 24"><path d="M12 2L6 12h12L12 2zm0 13a2 2 0 100 4 2 2 0 000-4z"/></svg>`,
          iconAnchor: [9, 9],
        }),
      }).addTo(map);
    } else {
      lockedMarker.setLatLng(latlng);
    }
  
    lockedLatLng = latlng;
    coordLocked = true;
  
    // ✅ 轉換顯示座標文字
    if (crsMode === "wgs84") {
      coordDisplay.textContent = `${latlng.lng.toFixed(4)}\u00A0\u00A0\u00A0${latlng.lat.toFixed(4)}`;
    } else {
      const [x, y] = proj4("EPSG:4326", "EPSG:2326", [latlng.lng, latlng.lat]);
      coordDisplay.textContent = `X: ${Math.round(x)}\u00A0\u00A0\u00A0Y: ${Math.round(y)}`;
    }
  });

  // 當滑鼠移動時，如果未鎖定才更新座標
  map.on("mousemove", (e) => {
    if (isLocked) return;
    const mode = crsModeSelect.value;
    if (mode === "wgs84") {
      coordDisplay.textContent = `${e.latlng.lng.toFixed(4)}\u00A0\u00A0\u00A0${e.latlng.lat.toFixed(4)}`;
    } else {
      const [x, y] = proj4("EPSG:4326", "EPSG:2326", [e.latlng.lng, e.latlng.lat]);
      coordDisplay.textContent = `X: ${Math.round(x)}\u00A0\u00A0\u00A0Y: ${Math.round(y)}`;
    }
  });
}
