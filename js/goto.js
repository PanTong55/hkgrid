export function initGotoPanel(map) {
  const panel = document.getElementById("gotoPanel");
  const toggleBtn = document.getElementById("gotoToggleBtn");
  const goBtn = document.getElementById("goBtn");
  const clearBtn = document.getElementById("clearBtn");
  const gotoTooltips = {};
  const gotoMarkers = [];

  // ✅ 防止干擾地圖操作
  L.DomEvent.disableClickPropagation(panel);
  L.DomEvent.disableScrollPropagation(panel);
  
  toggleBtn.addEventListener("click", () => {
    const isOpen = getComputedStyle(panel).display === "block";

    panel.style.display = isOpen ? "none" : "block";
    toggleBtn.innerHTML = isOpen
      ? '<i data-lucide="crosshair" style="width: 14px; height: 14px; color: black;"></i>'
      : '<i data-lucide="chevrons-left" style="width: 14px; height: 14px; color: black;"></i>';
    lucide.createIcons();
  });

  goBtn.addEventListener("click", () => {
    const mode = document.querySelector('input[name="coordMode"]:checked').value;
    let latlng = null;

    if (mode === "hk1980") {
      const x = parseFloat(document.getElementById("inputX").value);
      const y = parseFloat(document.getElementById("inputY").value);
      if (!isNaN(x) && !isNaN(y)) {
        const result = proj4("EPSG:2326", "EPSG:4326", [x, y]);
        latlng = { lat: result[1], lng: result[0] };
      }
    } else {
      const lat = parseFloat(document.getElementById("inputLat").value);
      const lng = parseFloat(document.getElementById("inputLng").value);
      if (!isNaN(lat) && !isNaN(lng)) {
        latlng = { lat, lng };
      }
    }

    if (latlng) {
      map.setView(latlng, 16);
      const marker = L.marker(latlng, { draggable: true }).addTo(map);
      marker.on("dblclick", L.DomEvent.stopPropagation);
      gotoMarkers.push(marker);
    
      // 生成 popup 內容
      const mode = document.querySelector('input[name="coordMode"]:checked').value;
      let popupContent = "";
      if (mode === "wgs84") {
        popupContent = `Lon: ${latlng.lng.toFixed(6)}<br>Lat: ${latlng.lat.toFixed(6)}`;
      } else {
        const [x, y] = proj4("EPSG:4326", "EPSG:2326", [latlng.lng, latlng.lat]);
        popupContent = `X: ${Math.round(x)}<br>Y: ${Math.round(y)}`;
      }
    
      const tooltip = createPointTooltip(marker, popupContent);
      gotoTooltips[L.stamp(marker)] = tooltip;
      moveGotoTooltip(marker);
    
      marker.on("click", () => {
        const markerId = L.stamp(marker);
        const existing = gotoTooltips[markerId];
        if (existing) {
          existing.remove();
          delete gotoTooltips[markerId];
        } else {
          updateGotoMarkerPopup(marker); // ✅ 加這行確保是最新座標
          const newContent = currentTooltipContent(marker);
          const newTooltip = createPointTooltip(marker, newContent);
          gotoTooltips[markerId] = newTooltip;
          moveGotoTooltip(marker);
        }
      });
    
      marker.on("dragstart", function () {
        this.setOpacity(0.7);
      });
    
      marker.on("drag", function () {
        updateGotoMarkerPopup(this);
        moveGotoTooltip(this);
      });
    
      marker.on("dragend", function () {
        this.setOpacity(1);
        updateGotoMarkerPopup(this);
        moveGotoTooltip(this);
      });
    }
  });

  clearBtn.addEventListener("click", () => {
    gotoMarkers.forEach((m) => {
      map.removeLayer(m);
      const id = L.stamp(m);
      if (gotoTooltips[id]) {
        gotoTooltips[id].remove();
        delete gotoTooltips[id];
      }
    });
    gotoMarkers.length = 0;
  });
  
// 自動貼上Google的Lat Long
function parseLatLngFromText(text) {
  const regex = /([-+]?\d{1,3}(?:\.\d+)?)[°\s]*([NS])?[, ]+\s*([-+]?\d{1,3}(?:\.\d+)?)[°\s]*([EW])?/i;
  const altRegex = /([-+]?\d{1,3}(?:\.\d+)?)[ ,]+([-+]?\d{1,3}(?:\.\d+)?)/;

  const match = text.match(regex);
  if (match) {
    let lat = parseFloat(match[1]);
    let lng = parseFloat(match[3]);

    if (match[2]?.toUpperCase() === 'S') lat *= -1;
    if (match[4]?.toUpperCase() === 'W') lng *= -1;

    return { lat, lng };
  }

  const altMatch = text.match(altRegex);
  if (altMatch) {
    const lat = parseFloat(altMatch[1]);
    const lng = parseFloat(altMatch[2]);
    return { lat, lng };
  }

  return null;
}

function setupAutoParseFromPaste() {
  const latInput = document.getElementById("inputLat");
  const lngInput = document.getElementById("inputLng");

  function handlePaste(e) {
    const text = (e.clipboardData || window.clipboardData).getData("text");
    const parsed = parseLatLngFromText(text);
    if (parsed) {
      e.preventDefault(); // 阻止原本的 paste
      latInput.value = parsed.lat.toFixed(6);
      lngInput.value = parsed.lng.toFixed(6);
    }
  }

  latInput.addEventListener("paste", handlePaste);
  lngInput.addEventListener("paste", handlePaste);
}

// 自動切換座標模式
function setupAutoCoordModeSwitch() {
  const modeHK = document.getElementById("modeHK");
  const modeWGS = document.getElementById("modeWGS");

  const xInput = document.getElementById("inputX");
  const yInput = document.getElementById("inputY");
  const latInput = document.getElementById("inputLat");
  const lngInput = document.getElementById("inputLng");

  xInput.addEventListener("focus", () => modeHK.checked = true);
  yInput.addEventListener("focus", () => modeHK.checked = true);
  latInput.addEventListener("focus", () => modeWGS.checked = true);
  lngInput.addEventListener("focus", () => modeWGS.checked = true);
}

function createPointTooltip(marker, content) {
  const tooltip = document.createElement("div");
  tooltip.className = "floatingTooltip";
  tooltip.innerHTML = `
    <div class="tooltip-container">
      <a href="#" class="tooltip-close" onclick="deleteGotoMarker(event, ${L.stamp(marker)});">✖</a>
      <div class="tooltip-content">${content}</div>
    </div>`;
  document.getElementById("map").appendChild(tooltip);
  return tooltip;
}

function updateGotoMarkerPopup(marker) {
  const latlng = marker.getLatLng();
  const mode = document.querySelector('input[name="coordMode"]:checked').value;
  let newContent = "";

  if (mode === "wgs84") {
    newContent = `Lon: ${latlng.lng.toFixed(6)}<br>Lat: ${latlng.lat.toFixed(6)}`;
  } else {
    const [x, y] = proj4("EPSG:4326", "EPSG:2326", [latlng.lng, latlng.lat]);
    newContent = `X: ${Math.round(x)}<br>Y: ${Math.round(y)}`;
  }

  const tooltip = gotoTooltips[L.stamp(marker)];
  if (tooltip) {
    const contentDiv = tooltip.querySelector(".tooltip-content");
    if (contentDiv) contentDiv.innerHTML = newContent;
  }
}

function moveGotoTooltip(marker) {
  const tooltip = gotoTooltips[L.stamp(marker)];
  if (!tooltip) return;

  const latlng = marker.getLatLng();
  const point = map.latLngToContainerPoint(latlng);
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

window.deleteGotoMarker = function (event, markerId) {
  event.preventDefault();
  const idx = gotoMarkers.findIndex((m) => L.stamp(m) === markerId);
  if (idx !== -1) {
    map.removeLayer(gotoMarkers[idx]);
    if (gotoTooltips[markerId]) gotoTooltips[markerId].remove();
    gotoMarkers.splice(idx, 1);
    delete gotoTooltips[markerId];
  }
};  

function currentTooltipContent(marker) {
  const latlng = marker.getLatLng();
  const mode = document.querySelector('input[name="coordMode"]:checked').value;
  if (mode === "wgs84") {
    return `Lon: ${latlng.lng.toFixed(6)}<br>Lat: ${latlng.lat.toFixed(6)}`;
  } else {
    const [x, y] = proj4("EPSG:4326", "EPSG:2326", [latlng.lng, latlng.lat]);
    return `X: ${Math.round(x)}<br>Y: ${Math.round(y)}`;
  }
}  
 
setupAutoParseFromPaste();  
setupAutoCoordModeSwitch(); 
  
map.on("zoom move", () => {
  gotoMarkers.forEach(moveGotoTooltip);
});
  
}
