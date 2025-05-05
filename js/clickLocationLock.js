let lockedMarker = null;
let isLocked = false;
let lockedLatLng = null;

export function initClickLocationLock(map, coordDisplay, crsModeSelect) {
  map.on("click", function (e) {
    const crsMode = crsModeSelect.value;
    const latlng = e.latlng;

    // 🔁 點擊相同位置 → 解除鎖定
    if (
      isLocked &&
      lockedMarker &&
      lockedLatLng &&
      lockedLatLng.lat === latlng.lat &&
      lockedLatLng.lng === latlng.lng
    ) {
      map.removeLayer(lockedMarker);
      lockedMarker = null;
      lockedLatLng = null;
      isLocked = false;
      return;
    }

    // 🔐 鎖定新位置
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
    isLocked = true;

    // 🧭 顯示座標（依據 crsMode）
    if (crsMode === "wgs84") {
      coordDisplay.textContent = `${latlng.lng.toFixed(4)}\u00A0\u00A0\u00A0${latlng.lat.toFixed(4)}`;
    } else {
      const [x, y] = proj4("EPSG:4326", "EPSG:2326", [latlng.lng, latlng.lat]);
      coordDisplay.textContent = `X: ${Math.round(x)}\u00A0\u00A0\u00A0Y: ${Math.round(y)}`;
    }
  });

  // 📍 滑鼠移動更新座標（未鎖定時）
  map.on("mousemove", function (e) {
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
