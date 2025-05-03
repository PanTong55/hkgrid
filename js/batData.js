// batData.js
const fieldMapping = {
  Family: 'Family',
  Genus: 'Genus',
  Species: 'Species',
  'Common Name (Eng)': 'Common Name (Eng)',
  'Common Name (Chi)': 'Common Name (Chi)',
};

let rawData = [];
let currentFilter = {};

export async function initBatDataLayer(map, layersControl) {
  const response = await fetch('https://opensheet.elk.sh/1Al_sWwiIU6DtQv6sMFvXb9wBUbBiE-zcYk8vEwV82x8/sheet2');
  rawData = await response.json();

  updateDropdowns(rawData);

  // 初始化 Marker
  const batLayer = renderBatMarkers(rawData);
  layersControl.addOverlay(batLayer, 'All Bat Data');

  // Toggle 控制
  const mapContainer = document.getElementById("map-container");
  const toggleBar = document.getElementById("filter-toggle-bar");
  const arrowIcon = document.getElementById("filterToggleArrow");

  toggleBar.addEventListener("click", () => {
    const isCollapsed = mapContainer.classList.toggle("collapsed");
    arrowIcon.textContent = isCollapsed ? '▶' : '◀';
    setTimeout(() => map.invalidateSize(), 300);
  });

  // Flatpickr
  flatpickr("#dateStart", { dateFormat: "Y-m-d", maxDate: "today" });
  flatpickr("#dateEnd", { dateFormat: "Y-m-d", maxDate: "today" });

  // Dropdown onchange → AJAX filter logic
  Object.keys(fieldMapping).forEach(label => {
    const domId = getDomIdFromLabel(label);
    const dropdown = document.getElementById(domId);
    if (dropdown) {
      dropdown.addEventListener("change", () => {
        const selected = dropdown.value;
        currentFilter[label] = selected;
        autoUpdateRelatedDropdowns(label);
        applyFilterToMap(map, layersControl);
      });
    }
  });
}

function getDomIdFromLabel(label) {
  return 'filter' + label.replace(/[^a-zA-Z0-9]/g, ''); // Remove space/symbols
}

function updateDropdowns(data) {
  Object.keys(fieldMapping).forEach(label => {
    const domId = getDomIdFromLabel(label);
    const field = fieldMapping[label];
    const select = document.getElementById(domId);
    if (!select) return;
    const values = [...new Set(data.map(d => d[field]).filter(v => v))].sort();
    select.innerHTML = '<option value="">All</option>' + values.map(v => `<option value="${v}">${v}</option>`).join('');
  });
}

function autoUpdateRelatedDropdowns(triggeredLabel) {
  const filtered = rawData.filter(row => {
    return Object.entries(currentFilter).every(([label, val]) => {
      if (!val) return true;
      const field = fieldMapping[label];
      return row[field] === val;
    });
  });
  updateDropdowns(filtered);
}

function applyFilterToMap(map, layersControl) {
  const filtered = rawData.filter(row => {
    return Object.entries(currentFilter).every(([label, val]) => {
      if (!val) return true;
      const field = fieldMapping[label];
      return row[field] === val;
    });
  });
  const newLayer = renderBatMarkers(filtered);
  layersControl.removeLayer(map.batLayer); // 如果之前有記錄
  layersControl.addOverlay(newLayer, 'All Bat Data');
  map.batLayer = newLayer; // 更新參考
}

function renderBatMarkers(data) {
  const seen = new Set();
  const markers = data
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
  return L.layerGroup(markers);
}
