export async function initBatDataLayer(map, layersControl) {
  const response = await fetch('https://opensheet.elk.sh/1Al_sWwiIU6DtQv6sMFvXb9wBUbBiE-zcYk8vEwV82x8/sheet2');
  const rawData = await response.json();

  const seen = new Set();
  const batMarkers = rawData
    .filter(d => d.Latitude && d.Longitude)
    .filter(d => {
      const key = `${parseFloat(d.Latitude).toFixed(5)},${parseFloat(d.Longitude).toFixed(5)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(d => L.circleMarker([parseFloat(d.Latitude), parseFloat(d.Longitude)], {
      radius: 4,
      fillColor: '#FFD700',
      color: '#FFD700',
      weight: 1,
      fillOpacity: 0.8,
    }));

  const batLayer = L.layerGroup(batMarkers);
  layersControl.addOverlay(batLayer, 'All Bat Data');

 // ✅ Filter Toggle Bar
  const filterPanel = document.getElementById("bat-filter-panel");
  const toggleBar = document.getElementById("filter-toggle-bar");
  const arrowIcon = document.getElementById("filterToggleArrow");

  if (filterPanel && toggleBar && arrowIcon) {
    toggleBar.addEventListener("click", () => {
      const isCollapsed = filterPanel.classList.toggle("collapsed");
      arrowIcon.textContent = isCollapsed ? '▶' : '◀';

      // ✅ 額外控制 toggle bar 位置
      if (isCollapsed) {
        toggleBar.style.left = "0px";
      } else {
        toggleBar.style.left = "320px";
      }
    });
  } else {
    console.warn("❌ filterPanel / toggleBar / arrowIcon not found in DOM.");
  }
}

// ✅ 加上 flatpickr 初始化（外部區域）
flatpickr("#dateStart", {
  dateFormat: "Y-m-d",
  maxDate: "today"
});

flatpickr("#dateEnd", {
  dateFormat: "Y-m-d",
  maxDate: "today"
});
