let lockMarker = null;
let isLocked = false;
let lockedCoord = null;

export function initClickLocationLock(map, coordDisplay, crsModeSelect) {
  map.on("click", (e) => {
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
          html: `
            <div class="lock-hitbox">
              <i data-lucide="locate-fixed"></i>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        }),
      }).addTo(map);

      // 🔁 加入 icon 點擊來取消鎖定
      lockMarker.getElement().addEventListener("click", (ev) => {
        ev.stopPropagation(); // 不冒泡到地圖 click
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

    if (mode === "wgs84") {
      coordDisplay.textContent = `${currentClickedCoord[0]}\u00A0\u00A0\u00A0${currentClickedCoord[1]}`;
    } else {
      coordDisplay.textContent = `X: ${Math.round(currentClickedCoord[0])}\u00A0\u00A0\u00A0Y: ${Math.round(currentClickedCoord[1])}`;
    }

    coordDisplay.classList.add("locked");
  });

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
