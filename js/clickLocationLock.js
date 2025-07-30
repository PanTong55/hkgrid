let lockMarker = null;
let isLocked = false;
let lockedCoord = null;
let clickLockEnabled = true; // 🔸 控制是否啟用點擊鎖定功能

export function disableClickLock() {
  clickLockEnabled = false;
}
export function enableClickLock() {
  clickLockEnabled = true;
}

function isClickIgnored(el) {
  return (
    el.closest(".floatingTooltip") ||
    el.closest("#coord-scale-wrapper") ||
    el.closest("#gotoPanel") ||
    el.closest("#clearBtn") ||
    el.closest("#goBtn") ||
    el.closest("#fullscreenBtn") ||
    el.closest("#fullscreenBtn svg") ||
    el.closest("path.leaflet-interactive") ||    // ✅ Grid
    el.closest("circle.leaflet-interactive") ||      // ✅ Point
    el.tagName === "BUTTON" ||
    el.tagName === "A" ||
    el.tagName === "INPUT" ||
    el.tagName === "SELECT" ||
    el.tagName === "LABEL" ||
    el.closest(".leaflet-control")
  );
}

export function initClickLocationLock(map, coordDisplay, crsModeSelect) {
  map.on("click", (e) => {
    if (window.isDraggingTooltip) return; // ⛔ 拖拉 Tooltip 時不鎖定
    const el = e.originalEvent.target;
    if (isClickIgnored(el)) return;
    
    if (!clickLockEnabled) return; // ⛔ 若被禁用就不執行點擊鎖定

    const latlng = e.latlng;
    const mode = crsModeSelect.value;

    const currentClickedCoord = mode === "wgs84"
      ? [latlng.lng, latlng.lat]
      : proj4("EPSG:4326", "EPSG:2326", [latlng.lng, latlng.lat]);

    lockedCoord = currentClickedCoord;
    isLocked = true;

    if (!lockMarker) {
      lockMarker = L.marker(latlng, {
        icon: L.divIcon({
          className: "lucide-lock-icon",
          html: `<div class="lock-hitbox"><i data-lucide="locate-fixed"></i></div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        }),
      }).addTo(map);

      lockMarker.getElement().addEventListener("click", (ev) => {
        ev.stopPropagation();
        map.removeLayer(lockMarker);
        lockMarker = null;
        isLocked = false;
        lockedCoord = null;
        coordDisplay.classList.remove("locked");
      });
    } else {
      lockMarker.setLatLng(latlng);
    }

    if (window.lucide) lucide.createIcons();

    coordDisplay.textContent = mode === "wgs84"
      ? `${currentClickedCoord[0].toFixed(4)}\u00A0\u00A0\u00A0${currentClickedCoord[1].toFixed(4)}`
      : `X: ${Math.round(currentClickedCoord[0])}\u00A0\u00A0\u00A0Y: ${Math.round(currentClickedCoord[1])}`;

    coordDisplay.classList.add("locked");
  });

  map.on("mousemove", (e) => {
    if (isLocked) return;
    const el = e.originalEvent.target;
    
    const mode = crsModeSelect.value;
    if (mode === "wgs84") {
      coordDisplay.textContent = `${e.latlng.lng.toFixed(4)}\u00A0\u00A0\u00A0${e.latlng.lat.toFixed(4)}`;
    } else {
      const [x, y] = proj4("EPSG:4326", "EPSG:2326", [e.latlng.lng, e.latlng.lat]);
      coordDisplay.textContent = `X: ${Math.round(x)}\u00A0\u00A0\u00A0Y: ${Math.round(y)}`;
    }
  });
}
