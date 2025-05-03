export async function initBatDataLayer(map, layersControl) {
  const response = await fetch('https://opensheet.elk.sh/1Al_sWwiIU6DtQv6sMFvXb9wBUbBiE-zcYk8vEwV82x8/sheet2');
  const rawData = await response.json();

  // 整理 dropdown options（所有欄位唯一值）
  const uniqueValues = {};
  const filterFields = [
    "Location", "Habitat", "DataSource", "Recorders",
    "Family", "Genus", "Species", "CommonName_Eng", "CommonName_Chi"
  ];

  filterFields.forEach(field => {
    uniqueValues[field] = [...new Set(rawData.map(d => d[field]).filter(Boolean))].sort();
    const select = document.getElementById("filter" + field);
    uniqueValues[field].forEach(val => {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = val;
      select.appendChild(opt);
    });
  });

  // Dropdown 之間的聯動規則
  const linkage = {
    Species: ["Family", "Genus", "CommonName_Eng", "CommonName_Chi"],
    Genus: ["Family", "Species", "CommonName_Eng", "CommonName_Chi"],
    Family: ["Genus", "Species", "CommonName_Eng", "CommonName_Chi"],
    CommonName_Eng: ["Species", "Genus", "Family", "CommonName_Chi"],
    CommonName_Chi: ["Species", "Genus", "Family", "CommonName_Eng"]
  };

  function updateLinkedDropdowns(changedField, selectedValue) {
    if (!linkage[changedField]) return;

    // 篩選出與選定值相關的資料列
    const filteredRows = rawData.filter(row => row[changedField] === selectedValue);

    linkage[changedField].forEach(targetField => {
      const targetSelect = document.getElementById("filter" + targetField);
      const allowedValues = [...new Set(filteredRows.map(r => r[targetField]).filter(Boolean))];

      // 保留第一個 "All" 選項
      targetSelect.innerHTML = '<option value="">All</option>';
      allowedValues.sort().forEach(val => {
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = val;
        targetSelect.appendChild(opt);
      });
    });
  }

  // 設定 onchange 監聽器
  ["Family", "Genus", "Species", "CommonName_Eng", "CommonName_Chi"].forEach(field => {
    const select = document.getElementById("filter" + field);
    select.addEventListener("change", (e) => {
      updateLinkedDropdowns(field, e.target.value);
    });
  });

  // 建立 bat 標記圖層（初始載入）
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
      fillOpacity: 0.8,
    }));

  let batLayer = L.layerGroup(batMarkers).addTo(map);
  layersControl.addOverlay(batLayer, 'All Bat Data');

  // Search 按鈕邏輯
  document.getElementById("batFilterSearch").addEventListener("click", () => {
    const filters = {
      Location: document.getElementById("filterLocation").value,
      Habitat: document.getElementById("filterHabitat").value,
      DataSource: document.getElementById("filterDataSource").value,
      Recorders: document.getElementById("filterRecorders").value,
      Family: document.getElementById("filterFamily").value,
      Genus: document.getElementById("filterGenus").value,
      Species: document.getElementById("filterSpecies").value,
      CommonName_Eng: document.getElementById("filterCommonEng").value,
      CommonName_Chi: document.getElementById("filterCommonChi").value,
      DateStart: document.getElementById("dateStart").value,
      DateEnd: document.getElementById("dateEnd").value,
    };

    seen = new Set();
    const filtered = rawData
      .filter(row => {
        return Object.entries(filters).every(([key, val]) => {
          if (!val || key === "DateStart" || key === "DateEnd") return true;
          return row[key] === val;
        }) &&
        (!filters.DateStart || row.Date >= filters.DateStart) &&
        (!filters.DateEnd || row.Date <= filters.DateEnd);
      })
      .filter(d => d.Latitude && d.Longitude)
      .filter(d => {
        const key = `${parseFloat(d.Latitude).toFixed(5)},${parseFloat(d.Longitude).toFixed(5)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    // 移除舊圖層，重建
    map.removeLayer(batLayer);
    batMarkers = filtered.map(d => L.circleMarker([parseFloat(d.Latitude), parseFloat(d.Longitude)], {
      radius: 4,
      fillColor: '#FFD700',
      color: '#FFD700',
      weight: 1,
      fillOpacity: 0.8,
    }));
    batLayer = L.layerGroup(batMarkers).addTo(map);
  });

  // ✅ Filter Toggle 控制邏輯
  const mapContainer = document.getElementById("map-container");
  const toggleBar = document.getElementById("filter-toggle-bar");
  const arrowIcon = document.getElementById("filterToggleArrow");

  toggleBar.addEventListener("click", () => {
    const isCollapsed = mapContainer.classList.toggle("collapsed");
    arrowIcon.textContent = isCollapsed ? '▶' : '◀';
    setTimeout(() => map.invalidateSize(), 300);
  });

  // ✅ flatpickr 日期初始化
  flatpickr("#dateStart", {
    dateFormat: "Y-m-d",
    maxDate: "today"
  });

  flatpickr("#dateEnd", {
    dateFormat: "Y-m-d",
    maxDate: "today"
  });
}
