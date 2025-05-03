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

  // 加入 filter toggle
  const toggleBtn = document.getElementById("toggleFilterPanel");
  const filterPanel = document.getElementById("bat-filter-panel");
  toggleBtn.addEventListener("click", () => {
    filterPanel.classList.toggle("collapsed");
  });
}

flatpickr("#dateStart", {
  dateFormat: "Y-m-d",
  maxDate: "today"
});

flatpickr("#dateEnd", {
  dateFormat: "Y-m-d",
  maxDate: "today"
});
