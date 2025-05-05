let lockMarker = null;
let isLocked = false;
let lockedCoord = null;

export function initClickLocationLock(map, coordDisplay, crsModeSelect) {
  map.on("click", (e) => {
    const latlng = e.latlng;
    const mode = crsModeSelect.value;

    const currentClickedCoord = mode === "wgs84"
      ? [latlng.lng.toFixed(4), latlng.lat.toFixed(4)]
      : proj4("EPSG:4326", "EPSG:2326", [latlng.lng, latlng.lat].map(Math.round));

    // Check if clicking same location
    const sameAsLocked = lockedCoord &&
      currentClickedCoord[0] === lockedCoord[0] &&
      currentClickedCoord[1] === lockedCoord[1];

    if (isLocked && sameAsLocked) {
      // 取消鎖定
      if (lockMarker) {
        map.removeLayer(lockMarker);
        lockMarker = null;
      }
      isLocked = false;
      lockedCoord = null;
      coordDisplay.classList.remove("locked");
      return;
    }

    // 更新鎖定
    lockedCoord = currentClickedCoord;
    isLocked = true;

    // 建立或更新 marker
    if (!lockMarker) {
      lockMarker = L.marker(latlng, {
        icon: L.divIcon({
          className: "lucide-lock-icon",
          html: '<i data-lucide="locate-fixed"></i>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      }).addTo(map);
    } else {
      lockMarker.setLatLng(latlng);
    }

    if (window.lucide) lucide.createIcons(); // 初始化 lucide 圖示

    // 更新座標顯示
    if (mode === "wgs84") {
      coordDisplay.textContent = `${currentClickedCoord[0]}\u00A0\u00A0\u00A0${currentClickedCoord[1]}`;
    } else {
      coordDisplay.textContent = `X: ${currentClickedCoord[0]}\u00A0\u00A0\u00A0Y: ${currentClickedCoord[1]}`;
    }

    coordDisplay.classList.add("locked");
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
