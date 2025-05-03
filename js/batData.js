// js/batData.js
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

  // ✅ Filter toggle 控制邏輯
  document.addEventListener("DOMContentLoaded", () => {
    const filterPanel = document.getElementById("bat-filter-panel");
    const toggleBar = document.getElementById("filter-toggle-bar");
    const arrowIcon = document.getElementById("filterToggleArrow");
  
    if (toggleBar && arrowIcon && filterPanel) {
      toggleBar.addEventListener("click", () => {
        const isCollapsed = filterPanel.classList.toggle("collapsed");
        arrowIcon.textContent = isCollapsed ? '▶' : '◀';
      });
    }
  });

  // ✅ 初始化 flatpickr（要確保 DOM 已加載完成）
  if (typeof flatpickr !== "undefined") {
    flatpickr("#dateStart", {
      dateFormat: "Y-m-d",
      maxDate: "today"
    });

    flatpickr("#dateEnd", {
      dateFormat: "Y-m-d",
      maxDate: "today"
    });
  } else {
    console.warn("flatpickr not loaded");
  }

