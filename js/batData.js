export async function initBatDataLayer(map, layersControl) {
  const response = await fetch('https://opensheet.elk.sh/1Al_sWwiIU6DtQv6sMFvXb9wBUbBiE-zcYk8vEwV82x8/sheet2');
  const rawData = await response.json();

  // 欄位映射表
  const fieldMap = {
    Location: "Location",
    Habitat: "Habitat",
    DataSource: "Data Source",
    Recorders: "Recorders",
    Family: "Family",
    Genus: "Genus",
    Species: "Species",
    CommonName_Eng: "Common Name (Eng)",
    CommonName_Chi: "Common Name (Chi)"
  };

  // 初始化 dropdown 選單
  const uniqueValues = {};
  for (const key in fieldMap) {
    const field = fieldMap[key];
    uniqueValues[key] = [...new Set(rawData.map(d => d[field]).filter(Boolean))].sort();

    const select = document.getElementById("filter" + key);
    if (select) {
      uniqueValues[key].forEach(val => {
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = val;
        select.appendChild(opt);
      });
    }
  }

  // Dropdown 聯動邏輯
  const linkage = {
    Species: ["Family", "Genus", "CommonName_Eng", "CommonName_Chi"],
    Genus: ["Family", "Species", "CommonName_Eng", "CommonName_Chi"],
    Family: ["Genus", "Species", "CommonName_Eng", "CommonName_Chi"],
    CommonName_Eng: ["Species", "Genus", "Family", "CommonName_Chi"],
    CommonName_Chi: ["Species", "Genus", "Family", "CommonName_Eng"]
  };

  function updateLinkedDropdowns(changedField, selectedValue) {
    if (!linkage[changedField]) return;

    const filteredRows = rawData.filter(row => row[fieldMap[changedField]] === selectedValue);

    linkage[changedField].forEach(targetField => {
      const targetSelect = document.getElementById("filter" + targetField);
      if (!targetSelect) return;

      const allowed = [...new Set(filteredRows.map(r => r[fieldMap[targetField]]).filter(Boolean))];
      targetSelect.innerHTML = '<option value="">All</option>';
      allowed.sort().forEach(val => {
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = val;
        targetSelect.appendChild(opt);
      });
    });
  }

  ["Family", "Genus", "Species", "CommonName_Eng", "CommonName_Chi"].forEach(field => {
    const select = document.getElementById("filter" + field);
    if (select) {
      select.addEventListener("change", e => {
        updateLinkedDropdowns(field, e.target.value);
      });
    }
  });

  // 建立初始 bat layer
  let seen = new Set();
  let batMarkers = rawData
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
      fillOpacity: 0.8
    }));

  let batLayer = L.layerGroup(batMarkers).addTo(map);
  layersControl.addOverlay(batLayer, 'All Bat Data');

  // 搜尋按鈕邏輯
  document.getElementById("batFilterSearch").addEventListener("click", () => {
    const filters = {};
    for (const key in fieldMap) {
      const select = document.getElementById("filter" + key);
      filters[key] = select?.value || "";
    }
    const dateStart = document.getElementById("dateStart").value;
    const dateEnd = document.getElementById("dateEnd").value;

    seen = new Set();
    const filtered = rawData
      .filter(row =>
        Object.entries(filters).every(([k, val]) => !val || row[fieldMap[k]] === val) &&
        (!dateStart || row.Date >= dateStart) &&
        (!dateEnd || row.Date <= dateEnd)
      )
      .filter(d => d.Latitude && d.Longitude)
      .filter(d => {
        const key = `${parseFloat(d.Latitude).toFixed(5)},${parseFloat(d.Longitude).toFixed(5)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    map.removeLayer(batLayer);
    batMarkers = filtered.map(d => L.circleMarker([parseFloat(d.Latitude), parseFloat(d.Longitude)], {
      radius: 4,
      fillColor: '#FFD700',
      color: '#FFD700',
      weight: 1,
      fillOpacity: 0.8
    }));
    batLayer = L.layerGroup(batMarkers).addTo(map);
  });

  // Toggle 控制
  const mapContainer = document.getElementById("map-container");
  const toggleBar = document.getElementById("filter-toggle-bar");
  const arrowIcon = document.getElementById("filterToggleArrow");

  toggleBar.addEventListener("click", () => {
    const isCollapsed = mapContainer.classList.toggle("collapsed");
    arrowIcon.textContent = isCollapsed ? '▶' : '◀';
    setTimeout(() => map.invalidateSize(), 300);
  });

  // 日期選擇器
  flatpickr("#dateStart", { dateFormat: "Y-m-d", maxDate: "today" });
  flatpickr("#dateEnd", { dateFormat: "Y-m-d", maxDate: "today" });
}
