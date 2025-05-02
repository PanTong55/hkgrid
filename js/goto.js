export function initGotoPanel(map) {
  const panel = document.getElementById("gotoPanel");
  const toggleBtn = document.getElementById("gotoToggleBtn");
  const goBtn = document.getElementById("goBtn");
  const clearBtn = document.getElementById("clearBtn");
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
      const marker = L.marker(latlng).addTo(map);
      gotoMarkers.push(marker);
    }
  });

  clearBtn.addEventListener("click", () => {
    gotoMarkers.forEach((m) => map.removeLayer(m));
    gotoMarkers.length = 0;
  });
}
