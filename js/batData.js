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
    CommonEng: "Common Name (Eng)",
    CommonChi: "Common Name (Chi)"
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
    Species: ["Family", "Genus", "CommonEng", "CommonChi"],
    Genus: ["Family", "Species", "CommonEng", "CommonChi"],
    Family: ["Genus", "Species", "CommonEng", "CommonChi"],
    CommonEng: ["Species", "Genus", "Family", "CommonChi"],
    CommonChi: ["Species", "Genus", "Family", "CommonEng"]
  };

  function updateLinkedDropdowns(changedField, selectedValue, rawData, fieldMap) {
    const getEl = id => document.getElementById("filter" + id);
  
    const allFields = ["Family", "Genus", "Species", "CommonEng", "CommonChi"];
    const speciesFields = ["Species", "CommonEng", "CommonChi"];
    const fullFields = [...allFields];
  
    function setOptions(selectEl, values) {
      selectEl.innerHTML = "";
      if (values.length > 1) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "All";
        selectEl.appendChild(opt);
      }
      values.forEach(val => {
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = val;
        selectEl.appendChild(opt);
      });
    }
  
    // 當 Family 為 All ➜ 全部重置為 All
    if (changedField === "Family" && !selectedValue) {
      fullFields.forEach(f => {
        setOptions(getEl(f), ["All"]);
      });
      return;
    }
  
    // 當 Genus 為 All ➜ 清除 Genus, Species, Common Name (Eng/Chi)，根據 Family 更新
    if (changedField === "Genus" && !selectedValue) {
      ["Genus", ...speciesFields].forEach(f => setOptions(getEl(f), ["All"]));
  
      const currentFamily = getEl("Family").value;
      if (!currentFamily) return;
  
      const filtered = rawData.filter(r => r[fieldMap["Family"]] === currentFamily);
      const genusSet = [...new Set(filtered.map(r => r[fieldMap["Genus"]]).filter(Boolean))].sort();
      setOptions(getEl("Genus"), genusSet.length ? genusSet : ["All"]);
      return;
    }
  
    // 當 Species/Common Name 為 All ➜ 清除三個 dropdown，根據 Family+Genus 更新
    if (speciesFields.includes(changedField) && !selectedValue) {
      speciesFields.forEach(f => setOptions(getEl(f), ["All"]));
  
      const currentFamily = getEl("Family").value;
      const currentGenus = getEl("Genus").value;
  
      let filtered = rawData;
      if (currentFamily) {
        filtered = filtered.filter(r => r[fieldMap["Family"]] === currentFamily);
      }
      if (currentGenus) {
        filtered = filtered.filter(r => r[fieldMap["Genus"]] === currentGenus);
      }
  
      const newSpecies = [...new Set(filtered.map(r => r[fieldMap["Species"]]).filter(Boolean))].sort();
      const newEng = [...new Set(filtered.map(r => r[fieldMap["CommonEng"]]).filter(Boolean))].sort();
      const newChi = [...new Set(filtered.map(r => r[fieldMap["CommonChi"]]).filter(Boolean))].sort();
  
      setOptions(getEl("Species"), newSpecies.length ? newSpecies : ["All"]);
      setOptions(getEl("CommonEng"), newEng.length ? newEng : ["All"]);
      setOptions(getEl("CommonChi"), newChi.length ? newChi : ["All"]);
  
      return;
    }
  
    // 其他情況（有選擇特定值）時 ➜ 篩出對應 row，再反推其他欄位值
    const filteredRows = rawData.filter(r => r[fieldMap[changedField]] === selectedValue);
  
    const targets = {
      Family: ["Genus", ...speciesFields],
      Genus: [...speciesFields],
      Species: ["Family", "Genus", "CommonEng", "CommonChi"],
      CommonEng: ["Family", "Genus", "Species", "CommonChi"],
      CommonChi: ["Family", "Genus", "Species", "CommonEng"]
    };
  
    if (targets[changedField]) {
      targets[changedField].forEach(targetField => {
        const vals = [...new Set(filteredRows.map(r => r[fieldMap[targetField]]).filter(Boolean))].sort();
        setOptions(getEl(targetField), vals.length ? vals : ["All"]);
    
        // ✅ 只剩一個選項 → 自動選取並觸發 change
        if (vals.length === 1) {
          const el = getEl(targetField);
          el.value = vals[0];
          el.dispatchEvent(new Event("change"));
        }
      });
    }
  }

  ["Family", "Genus", "Species", "CommonEng", "CommonChi"].forEach(field => {
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
