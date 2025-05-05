let lockMarker = null;
let isLocked = false;
let lockedCoord = null;

function isSameLocation(latlng1, latlng2, toleranceMeters = 10) {
  if (!latlng1 || !latlng2) return false;
  return L.latLng(latlng1[1], latlng1[0]).distanceTo(
    L.latLng(latlng2[1], latlng2[0])
  ) <= toleranceMeters;
}

export function initClickLocationLock(map, coordDisplay, crsModeSelect) {
  map.on("click", (e) => {
    const latlng = e.latlng;
    const mode = crsModeSelect.value;
  
    // 比對原始數值（不要四捨五入）確保精確
    const currentClickedCoord = mode === "wgs84"
      ? [latlng.lng, latlng.lat]
      : proj4("EPSG:4326", "EPSG:2326", [latlng.lng, latlng.lat]);

    // 正確取得座標：不做 round 處理以避免判斷錯誤
    const sameAsLocked = isSameLocation(currentClickedCoord, lockedCoord);
    
    if (isLocked && sameAsLocked) {
      if (lockMarker) {
        map.removeLayer(lockMarker);
        lockMarker = null;
      }
      isLocked = false;
      lockedCoord = null;
      coordDisplay.classList.remove("locked");
      return;
    }
  
    lockedCoord = currentClickedCoord;
    isLocked = true;
  
    if (!lockMarker) {
      lockMarker = L.marker(latlng, {
        icon: L.divIcon({
          className: "lucide-lock-icon",
          html: `
            <div class="lock-hitbox">
              <i data-lucide="locate-fixed"></i>
            </div>
          `,
          iconSize: [36, 36],       // 實際點擊區域大小
          iconAnchor: [18, 18],     // 中心對齊
        }),
      }).addTo(map);
    } else {
      lockMarker.setLatLng(latlng);
    }
  
    if (window.lucide) lucide.createIcons();
  
    // 正確顯示（在此才 round 顯示用）
    if (mode === "wgs84") {
      coordDisplay.textContent = `${currentClickedCoord[0]}\u00A0\u00A0\u00A0${currentClickedCoord[1]}`;
    } else {
      coordDisplay.textContent = `X: ${Math.round(currentClickedCoord[0])}\u00A0\u00A0\u00A0Y: ${Math.round(currentClickedCoord[1])}`;
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
