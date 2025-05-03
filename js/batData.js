let allBatData = [];
let batLayer = null;

export async function initBatDataLayer(map, layersControl) {
  const response = await fetch('https://opensheet.elk.sh/1Al_sWwiIU6DtQv6sMFvXb9wBUbBiE-zcYk8vEwV82x8/sheet2');
  const rawData = await response.json();

  allBatData = rawData.filter(d => d.Latitude && d.Longitude);

  populateFilterOptions(allBatData);
  renderBatMarkers(allBatData, map, layersControl);

  setupFilterToggle(map);
  setupFilterSearch(map, layersControl);
}

function renderBatMarkers(data, map, layersControl) {
  const seen = new Set();

  const markers = data
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

  if (batLayer) {
    batLayer.clearLayers();
  }

  batLayer = L.layerGroup(markers).addTo(map);
  if (!layersControl._layers['All Bat Data']) {
    layersControl.addOverlay(batLayer, 'All Bat Data');
  }
}

function populateFilterOptions(data) {
  const fields = [
    { id: "filterLocation", key: "Location" },
    { id: "filterHabitat", key: "Habitat" },
    { id: "filterDataSource", key: "Data Source" },
    { id: "filterRecorders", key: "Recorders" },
    { id: "filterFamily", key: "Family" },
    { id: "filterGenus", key: "Genus" },
    { id: "filterSpecies", key: "Species" },
    { id: "filterCommonEng", key: "Common Name (Eng)" },
    { id: "filterCommonChi", key: "Common Name (Chi)" }
  ];

  fields.forEach(({ id, key }) => {
    const select = document.getElementById(id);
    const values = [...new Set(data.map(d => d[key]).filter(Boolean))].sort();
    values.forEach(v => {
      const option = document.createElement("option");
      option.value = v;
      option.textContent = v;
      select.appendChild(option);
    });
  });
}

function setupFilterSearch(map, layersControl) {
  document.getElementById("batFilterSearch").addEventListener("click", () => {
    const dateStart = document.getElementById("dateStart").value;
    const dateEnd = document.getElementById("dateEnd").value;

    const filters = {
      Location: document.getElementById("filterLocation").value,
      Habitat: document.getElementById("filterHabitat").value,
      "Data Source": document.getElementById("filterDataSource").value,
      Recorders: document.getElementById("filterRecorders").value,
      Family: document.getElementById("filterFamily").value,
      Genus: document.getElementById("filterGenus").value,
      Species: document.getElementById("filterSpecies").value,
      "Common Name (Eng)": document.getElementById("filterCommonEng").value,
      "Common Name (Chi)": document.getElementById("filterCommonChi").value,
    };

    const filtered = allBatData.filter(d => {
      const dateOk = (!dateStart || d.Date >= dateStart) && (!dateEnd || d.Date <= dateEnd);
      const matchAll = Object.entries(filters).every(([key, val]) => !val || d[key] === val);
      return dateOk && matchAll;
    });

    renderBatMarkers(filtered, map, layersControl);
  });
}

function setupFilterToggle(map) {
  const mapContainer = document.getElementById("map-container");
  const toggleBar = document.getElementById("filter-toggle-bar");
  const arrowIcon = document.getElementById("filterToggleArrow");

  toggleBar.addEventListener("click", () => {
    const isCollapsed = mapContainer.classList.toggle("collapsed");
    arrowIcon.textContent = isCollapsed ? '▶' : '◀';
    setTimeout(() => map.invalidateSize(), 300);
  });
}

// 日期選擇器初始化
flatpickr("#dateStart", { dateFormat: "Y-m-d", maxDate: "today" });
flatpickr("#dateEnd", { dateFormat: "Y-m-d", maxDate: "today" });
