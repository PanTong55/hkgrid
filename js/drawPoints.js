export function initDrawPoint(map, crsModeSelect) {
  let drawMode = false;
  const drawnPoints = [];
  const drawnTooltips = {};

  const drawPointBtn = document.getElementById("drawPointBtn");

  drawPointBtn.addEventListener("click", () => {
    drawMode = !drawMode;
    drawPointBtn.classList.toggle("active", drawMode);
  });

  map.on("click", function (e) {
    const el = e.originalEvent.target;
    if (["a", "button", "input", "label", "select", "i", "svg", "path"].includes(el.tagName.toLowerCase()) || el.closest(".leaflet-control")) return;
    if (!drawMode) return;

    const latlng = e.latlng;
    const mode = crsModeSelect.value;
    let popupContent = "";

    if (mode === "wgs84") {
      popupContent = `Lon: ${latlng.lng.toFixed(6)}<br>Lat: ${latlng.lat.toFixed(6)}`;
    } else {
      const [x, y] = proj4("EPSG:4326", "EPSG:2326", [latlng.lng, latlng.lat]);
      popupContent = `X: ${Math.round(x)}<br>Y: ${Math.round(y)}`;
    }

    const marker = L.marker(latlng, { draggable: true }).addTo(map);
    drawnPoints.push(marker);

    marker.on("dragstart", () => marker.setOpacity(0.7));
    marker.on("drag", () => {
      updateTooltipContent(marker);
      updateTooltipPosition(marker);
    });
    marker.on("dragend", () => {
      marker.setOpacity(1);
      updateTooltipContent(marker);
      updateTooltipPosition(marker);
    });

    marker.on("click", () => {
      const id = L.stamp(marker);
      if (drawnTooltips[id]) {
        drawnTooltips[id].remove();
        delete drawnTooltips[id];
      } else {
        const tooltip = createTooltip(marker, popupContent, id);
        drawnTooltips[id] = tooltip;
        updateTooltipPosition(marker);
      }
    });
  });

  function createTooltip(marker, content, markerId) {
    const tooltip = document.createElement("div");
    tooltip.className = "floatingTooltip";
    tooltip.innerHTML = `
      <div class="tooltip-container">
        <a href="#" class="tooltip-close" onclick="deleteDrawnMarker(event, ${markerId});">✖</a>
        <div class="tooltip-content">${content}</div>
      </div>`;
    document.getElementById("map").appendChild(tooltip);
    return tooltip;
  }

  function updateTooltipContent(marker) {
    const latlng = marker.getLatLng();
    const mode = crsModeSelect.value;
    const id = L.stamp(marker);

    let newContent = "";
    if (mode === "wgs84") {
      newContent = `Lon: ${latlng.lng.toFixed(6)}<br>Lat: ${latlng.lat.toFixed(6)}`;
    } else {
      const [x, y] = proj4("EPSG:4326", "EPSG:2326", [latlng.lng, latlng.lat]);
      newContent = `X: ${Math.round(x)}<br>Y: ${Math.round(y)}`;
    }

    const tooltip = drawnTooltips[id];
    if (tooltip) {
      const contentDiv = tooltip.querySelector(".tooltip-content");
      if (contentDiv) contentDiv.innerHTML = newContent;
    }
  }

  function updateTooltipPosition(marker) {
    const id = L.stamp(marker);
    const tooltip = drawnTooltips[id];
    if (!tooltip) return;

    const point = map.latLngToContainerPoint(marker.getLatLng());
    const mapSize = map.getSize();

    let left = point.x + 5;
    let top = point.y + 5;

    if (left + tooltip.offsetWidth > mapSize.x) left = point.x - tooltip.offsetWidth - 15;
    if (top + tooltip.offsetHeight > mapSize.y) top = point.y - tooltip.offsetHeight - 15;
    if (left < 0) left = 10;
    if (top < 0) top = 10;

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  map.on("move zoom", () => {
    drawnPoints.forEach((marker) => updateTooltipPosition(marker));
  });

  // 全域刪除 function（必須綁在 window）
  window.deleteDrawnMarker = function (event, markerId) {
    event.preventDefault();
    const idx = drawnPoints.findIndex((m) => L.stamp(m) === markerId);
    if (idx !== -1) {
      map.removeLayer(drawnPoints[idx]);
      if (drawnTooltips[markerId]) drawnTooltips[markerId].remove();
      drawnPoints.splice(idx, 1);
      delete drawnTooltips[markerId];
    }
  };
}
