// modules/draw-point.js
export function initDrawPoint(map) {
  const drawPointBtn = document.getElementById("drawPointBtn");
  const crsModeSelect = document.getElementById("crsMode");
  let drawMode = false;
  let drawnPoints = [];
  let drawnTooltips = {};

  drawPointBtn.addEventListener("click", () => {
    drawMode = !drawMode;
    drawPointBtn.classList.toggle("active", drawMode);
  });

  map.on("click", (e) => {
    // 避免誤點控制元件
    const el = e.originalEvent.target;
    if (["a", "button", "input", "label", "select", "i", "svg", "path"].includes(el.tagName.toLowerCase()) || el.closest(".leaflet-control")) return;
    if (!drawMode) return;

    const latlng = e.latlng;
    let popupContent = getCoordText(latlng);

    const marker = L.marker(latlng, { draggable: true }).addTo(map);
    drawnPoints.push(marker);

    marker.on("click", () => {
      const markerId = L.stamp(marker);
      if (drawnTooltips[markerId]) {
        drawnTooltips[markerId].remove();
        delete drawnTooltips[markerId];
      } else {
        const tooltip = createPointTooltip(marker, popupContent, markerId);
        drawnTooltips[markerId] = tooltip;
        updateAllTooltips();
      }
    });

    marker.on("dragstart", () => marker.setOpacity(0.7));

    marker.on("drag", function () {
      const id = L.stamp(this);
      if (drawnTooltips[id]) {
        drawnTooltips[id].querySelector(".tooltip-content").innerHTML = getCoordText(this.getLatLng());
        updateTooltipPosition(this, drawnTooltips[id]);
      }
    });

    marker.on("dragend", function () {
      this.setOpacity(1);
    });
  });

  function getCoordText(latlng) {
    const mode = crsModeSelect.value;
    if (mode === "wgs84") {
      return `Lon: ${latlng.lng.toFixed(6)}<br>Lat: ${latlng.lat.toFixed(6)}`;
    } else {
      const [x, y] = proj4("EPSG:4326", "EPSG:2326", [latlng.lng, latlng.lat]);
      return `X: ${Math.round(x)}<br>Y: ${Math.round(y)}`;
    }
  }

  function createPointTooltip(marker, content, markerId) {
    const tooltip = document.createElement("div");
    tooltip.className = "floatingTooltip";
    tooltip.innerHTML = `
      <div class="tooltip-container">
        <a href="#" class="tooltip-close" onclick="event.preventDefault(); deleteDrawnMarker(${markerId});">✖</a>
        <div class="tooltip-content">${content}</div>
      </div>`;
    document.getElementById("map").appendChild(tooltip);
    return tooltip;
  }

  function updateTooltipPosition(marker, tooltip) {
    const point = map.latLngToContainerPoint(marker.getLatLng());
    let left = point.x + 5;
    let top = point.y + 5;
    const mapSize = map.getSize();
    if (left + tooltip.offsetWidth > mapSize.x) left = point.x - tooltip.offsetWidth - 15;
    if (top + tooltip.offsetHeight > mapSize.y) top = point.y - tooltip.offsetHeight - 15;
    if (left < 0) left = 10;
    if (top < 0) top = 10;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function updateAllTooltips() {
    drawnPoints.forEach((marker) => {
      const id = L.stamp(marker);
      const tooltip = drawnTooltips[id];
      if (tooltip) updateTooltipPosition(marker, tooltip);
    });
  }

  map.on("move zoom", updateAllTooltips);

  window.deleteDrawnMarker = function (markerId) {
    const idx = drawnPoints.findIndex((m) => L.stamp(m) === markerId);
    if (idx !== -1) {
      map.removeLayer(drawnPoints[idx]);
      if (drawnTooltips[markerId]) drawnTooltips[markerId].remove();
      drawnPoints.splice(idx, 1);
      delete drawnTooltips[markerId];
    }
  };
}
