export async function initBatDataLayer(map, layersControl) {
  const response = await fetch('https://opensheet.elk.sh/1Al_sWwiIU6DtQv6sMFvXb9wBUbBiE-zcYk8vEwV82x8/sheet2');
  const rawData = await response.json();

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

  const uniqueValues = {};
  const initialDropdownValues = {};

  for (const key in fieldMap) {
    const field = fieldMap[key];
    const values = [...new Set(rawData.map(d => d[field]).filter(Boolean))].sort();
    uniqueValues[key] = values;
    initialDropdownValues[key] = values;

    const select = document.getElementById("filter" + key);
    if (select) {
      const optAll = document.createElement("option");
      optAll.value = "";
      optAll.textContent = "All";
      select.appendChild(optAll);

      values.forEach(val => {
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = val;
        select.appendChild(opt);
      });
    }
  }

  const triggeredFields = new Set();

  function updateLinkedDropdowns(changedField, selectedValue, rawData, fieldMap) {
    const getEl = id => document.getElementById("filter" + id);
    const allFields = ["Family", "Genus", "Species", "CommonEng", "CommonChi"];
    const speciesFields = ["Species", "CommonEng", "CommonChi"];

    if (triggeredFields.has(changedField)) return;
    triggeredFields.add(changedField);

    function setOptions(selectEl, values) {
      selectEl.innerHTML = "";
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "All";
      selectEl.appendChild(opt);
      values.forEach(val => {
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = val;
        selectEl.appendChild(opt);
      });
    }

    if (changedField === "Family" && !selectedValue) {
      allFields.forEach(f => {
        const allValues = initialDropdownValues[f] || [];
        setOptions(getEl(f), allValues);
      });
      triggeredFields.delete(changedField);
      return;
    }

    if (changedField === "Genus" && !selectedValue) {
      ["Genus", ...speciesFields].forEach(f => {
        const allValues = initialDropdownValues[f] || [];
        setOptions(getEl(f), allValues);
      });

      const currentFamily = getEl("Family").value;
      if (!currentFamily) {
        triggeredFields.delete(changedField);
        return;
      }

      const filtered = rawData.filter(r => r[fieldMap["Family"]] === currentFamily);
      const genusSet = [...new Set(filtered.map(r => r[fieldMap["Genus"]]).filter(Boolean))].sort();
      setOptions(getEl("Genus"), genusSet);
      triggeredFields.delete(changedField);
      return;
    }

    if (speciesFields.includes(changedField) && !selectedValue) {
      speciesFields.forEach(f => {
        const allValues = initialDropdownValues[f] || [];
        setOptions(getEl(f), allValues);
      });

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

      setOptions(getEl("Species"), newSpecies);
      setOptions(getEl("CommonEng"), newEng);
      setOptions(getEl("CommonChi"), newChi);

      triggeredFields.delete(changedField);
      return;
    }

    const currentFilters = {};
    ["Family", "Genus", "Species", "CommonEng", "CommonChi"].forEach(key => {
      const val = document.getElementById("filter" + key)?.value;
      if (val) currentFilters[key] = val;
    });
    
    const filteredRows = rawData.filter(row =>
      Object.entries(currentFilters).every(([k, val]) => row[fieldMap[k]] === val)
    );
    const targets = {
      Family: ["Genus", ...speciesFields],
      Genus: [...speciesFields],
      Species: ["Family", "Genus", "CommonEng", "CommonChi"],
      CommonEng: ["Family", "Genus", "Species", "CommonChi"],
      CommonChi: ["Family", "Genus", "Species", "CommonEng"]
    };

    if (targets[changedField]) {
      targets[changedField].forEach(targetField => {
        const el = getEl(targetField);
        const vals = [...new Set(filteredRows.map(r => r[fieldMap[targetField]]).filter(Boolean))].sort();
        if (vals.length === 1) {
          setOptions(el, vals);
          el.value = vals[0];
          el.dispatchEvent(new Event("change"));
        } else {
          setOptions(el, vals);
        }
      });
    }

    triggeredFields.delete(changedField);
  }

  ["Family", "Genus", "Species", "CommonEng", "CommonChi"].forEach(field => {
    const select = document.getElementById("filter" + field);
    if (select) {
      select.addEventListener("change", e => {
        updateLinkedDropdowns(field, e.target.value, rawData, fieldMap);
      });
    }
  });

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

  const mapContainer = document.getElementById("map-container");
  const toggleBar = document.getElementById("filter-toggle-bar");
  const arrowIcon = document.getElementById("filterToggleArrow");

  toggleBar.addEventListener("click", () => {
    const isCollapsed = mapContainer.classList.toggle("collapsed");
    arrowIcon.textContent = isCollapsed ? '▶' : '◀';
    setTimeout(() => map.invalidateSize(), 300);
  });

  flatpickr("#dateStart", { dateFormat: "Y-m-d", maxDate: "today" });
  flatpickr("#dateEnd", { dateFormat: "Y-m-d", maxDate: "today" });
}
