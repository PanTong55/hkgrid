const lockedLayers = [];
const tooltipElements = [];
const manualMoved = [];
const hoverTooltip = document.getElementById("hoverTooltip");
import { makeTooltipDraggable } from './draggableTooltip.js';

export async function initBatDataLayer(map, layersControl) {
  const response = await fetch('https://opensheet.elk.sh/1Al_sWwiIU6DtQv6sMFvXb9wBUbBiE-zcYk8vEwV82x8/sheet2');
  const rawData = await response.json();

  const gridGeoJson = await fetch('https://raw.githubusercontent.com/PanTong55/hkgrid/main/hkgrid.geojson')
    .then(res => res.json());
  
  let gridLayer = null;
  
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
    let values = rawData.map(d => d[field]).filter(Boolean);

    if (key === "Habitat") {
      values = values.flatMap(v => v.split(',').map(s => s.trim()));
    }

    values = [...new Set(values)].sort().filter(val => val !== "All");
    uniqueValues[key] = values;
    initialDropdownValues[key] = values;

    const select = document.getElementById("filter" + key);
    if (select) {
      select.innerHTML = "";
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

      // === ComboBox enhancement ===
      select.addEventListener("input", e => {
        const inputText = e.target.value.toLowerCase();
        const fullList = initialDropdownValues[key] || [];
        const filtered = fullList.filter(v => v.toLowerCase().includes(inputText));

        const currentValue = select.value;
        select.innerHTML = "";
        const optAll = document.createElement("option");
        optAll.value = "";
        optAll.textContent = "All";
        select.appendChild(optAll);
        filtered.forEach(val => {
          const opt = document.createElement("option");
          opt.value = val;
          opt.textContent = val;
          select.appendChild(opt);
        });
        select.value = currentValue;
      });

      select.addEventListener("keydown", e => {
        if (e.key === "Enter") {
          const inputText = e.target.value.trim().toLowerCase();
          const fullList = initialDropdownValues[key] || [];
          const matched = fullList.find(v => v.toLowerCase() === inputText);
          if (matched) {
            select.value = matched;
            select.dispatchEvent(new Event("change"));
            e.preventDefault();
          }
        }
      });
    }
  }

  const triggeredFields = new Set();

  function positionTooltip(domElement, point) {
    const mapSize = map.getSize();
    let left = point.x + 15;
    let top = point.y + 15;
  
    if (left + domElement.offsetWidth > mapSize.x) {
      left = point.x - domElement.offsetWidth - 15;
    }
    if (top + domElement.offsetHeight > mapSize.y) {
      top = point.y - domElement.offsetHeight - 15;
    }
    if (left < 0) left = 10;
    if (top < 0) top = 10;
  
    domElement.style.left = `${left}px`;
    domElement.style.top = `${top}px`;
    domElement.style.position = "absolute";
  }

  function openLockTooltip(layer, htmlContent) {
  const tooltip = document.createElement("div");
  tooltip.className = "floatingTooltip";
  tooltip.setAttribute("data-layer-id", L.stamp(layer));
  tooltip.innerHTML = `
    <div class="tooltip-container">
      <a href="#" class="tooltip-close">✖</a>
      <div class="tooltip-content">${htmlContent}</div>
    </div>`;
  document.getElementById("map").appendChild(tooltip);

  lockedLayers.push(layer);
  tooltipElements.push(tooltip);
  manualMoved.push(false);

  const center = map.latLngToContainerPoint(
    layer.getLatLng ? layer.getLatLng() : layer.getBounds().getCenter()
  );
  positionTooltip(tooltip, center);

  makeTooltipDraggable(tooltip);

  const closeBtn = tooltip.querySelector(".tooltip-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", (event) => {
      event.preventDefault();
      closeLockTooltip(layer);
    });
  }   
}

  function closeLockTooltip(layer) {
    const layerId = L.stamp(layer);
    const idx = lockedLayers.findIndex((l) => L.stamp(l) === layerId);
  
    if (idx !== -1) {
      layer.setStyle?.({
        color: '#3388ff',
        weight: 2,
        fillColor: '#3388ff',
        fillOpacity: 0.3
      });
  
      lockedLayers.splice(idx, 1);
      tooltipElements[idx].remove();
      tooltipElements.splice(idx, 1);
      manualMoved.splice(idx, 1);
    }
  }

  function updateLinkedDropdowns(changedField, selectedValue, rawData, fieldMap) {
    const getEl = id => document.getElementById("filter" + id);
    const allFields = ["Family", "Genus", "Species", "CommonEng", "CommonChi"];
    const speciesFields = ["Species", "CommonEng", "CommonChi"];

    if (triggeredFields.has(changedField)) return;
    triggeredFields.add(changedField);

    function setOptions(selectEl, values) {
      const currentText = selectEl.value.toLowerCase();
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
      selectEl.value = "";
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

  let batLayer = L.layerGroup(batMarkers);
  layersControl.addOverlay(batLayer, 'All Bat Data');

  document.getElementById("batFilterSearch").addEventListener("click", () => {
    const mode = document.getElementById("displayMode").value;
  
    // 先清除圖層（不能用 map.eachLayer，那是讀取不是清除）
    if (batLayer && map.hasLayer(batLayer)) {
      map.removeLayer(batLayer);
    }
    if (gridLayer && map.hasLayer(gridLayer)) {
      map.removeLayer(gridLayer);
    }
  
    // 濾資料
    const filters = {};
    for (const key in fieldMap) {
      const select = document.getElementById("filter" + key);
      filters[key] = select?.value || "";
    }
    const dateStart = document.getElementById("dateStart").value;
    const dateEnd = document.getElementById("dateEnd").value;
  
    const filteredData = rawData.filter(row =>
      Object.entries(filters).every(([k, val]) => {
        if (k === "Habitat" && val) {
          return row[fieldMap[k]].split(',').map(v => v.trim()).includes(val);
        }
        return !val || row[fieldMap[k]] === val;
      }) &&
      (!dateStart || new Date(row.Date) >= new Date(dateStart)) &&
      (!dateEnd || new Date(row.Date) <= new Date(dateEnd))
    );
  
    if (mode === "point") {
      seen = new Set();
      const pointMarkers = filteredData
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
      batLayer = L.layerGroup(pointMarkers).addTo(map);
    pointMarkers.forEach(marker => {
      const lat = marker.getLatLng().lat.toFixed(5);
      const lng = marker.getLatLng().lng.toFixed(5);
      
      const matchedData = filteredData.filter(d =>
        parseFloat(d.Latitude).toFixed(5) === lat &&
        parseFloat(d.Longitude).toFixed(5) === lng
      );
  
      const speciesSet = new Set(matchedData.map(d => d["Species"]).filter(Boolean));
      const locationName = matchedData[0]?.["Location"] || "未知地點";
  
      const tooltipContent = `
        <strong>地點:</strong> ${locationName}<br>
        <strong>物種數量:</strong> ${speciesSet.size} 種<br>
        <strong>清單:</strong><br>
        ${[...speciesSet].sort().map((s, i) => `${i + 1}. <i>${s}</i>`).join("<br>")}
      `;
  
      marker.options.tooltipContent = tooltipContent;
  
      if (!("ontouchstart" in window)) {
        marker.on("mouseover", e => {
          if (!lockedLayers.includes(marker)) {
            hoverTooltip.innerHTML = tooltipContent;
            hoverTooltip.style.display = "block";
          }
        });
  
        marker.on("mousemove", e => {
          if (!lockedLayers.includes(marker)) {
            const point = map.latLngToContainerPoint(e.latlng);
            positionTooltip(hoverTooltip, point);
          }
        });
  
        marker.on("mouseout", () => {
          hoverTooltip.style.display = "none";
        });
      }
  
      marker.on("click", () => {
        if (lockedLayers.includes(marker)) {
          const idx = lockedLayers.indexOf(marker);
          lockedLayers.splice(idx, 1);
          tooltipElements[idx].remove();
          tooltipElements.splice(idx, 1);
          manualMoved.splice(idx, 1);
        } else {
          if (lockedLayers.length >= 3) {
            alert("最多只能顯示 3 個標記的資料");
            return;
          }
          openLockTooltip(marker, tooltipContent);
        }
      });
    });
    } else if (mode === "grid") {
      const matchedGridNos = new Set(filteredData.map(d => d.Grid));
      gridLayer = L.geoJSON(gridGeoJson, {
        filter: feature => matchedGridNos.has(String(feature.properties.Grid_No)),
        style: {
          color: '#3388ff',
          weight: 2,
          fillColor: '#3388ff',
          fillOpacity: 0.3
        },
        onEachFeature: (feature, layer) => {
          const gridNo = String(feature.properties.Grid_No);
          const matchedData = filteredData.filter(d => d["Grid"] === gridNo);
          const speciesSet = new Set(matchedData.map(d => d["Species"]).filter(Boolean));
      
          const tooltipContent = `
            <strong>網格:</strong> ${gridNo}<br>
            <strong>物種數量:</strong> ${speciesSet.size} 種<br>
            <strong>清單:</strong><br>
            ${[...speciesSet].sort().map((s, i) => `${i + 1}. <i>${s}</i>`).join("<br>")}
          `;
      
          layer.options.tooltipContent = tooltipContent;
      
          if (!("ontouchstart" in window)) {
            layer.on("mouseover", () => {
              if (!lockedLayers.includes(layer)) {
                hoverTooltip.innerHTML = tooltipContent;
                hoverTooltip.style.display = "block";
              }
            });
      
            layer.on("mousemove", (e) => {
              if (!lockedLayers.includes(layer)) {
                const point = map.latLngToContainerPoint(e.latlng);
                positionTooltip(hoverTooltip, point);
              }
            });
      
            layer.on("mouseout", () => {
              hoverTooltip.style.display = "none";
            });
          }
      
          layer.on("click", () => {
            if (lockedLayers.includes(layer)) {
              const idx = lockedLayers.indexOf(layer);
              lockedLayers.splice(idx, 1);
              tooltipElements[idx].remove();
              tooltipElements.splice(idx, 1);
              manualMoved.splice(idx, 1);
              
              layer.setStyle({
                color: '#3388ff',
                weight: 2,
                fillColor: '#3388ff',
                fillOpacity: 0.3
              });              
            } else {
              if (lockedLayers.length >= 3) {
                alert("最多只能顯示 3 個格網的資料");
                return;
              }
              layer.setStyle({
                color: '#333',
                weight: 2,
                fillColor: '#ffcc00',
                fillOpacity: 0.7
              });
              openLockTooltip(layer, tooltipContent);
            }
          });
        }
      }).addTo(map);
    }
  });

  document.getElementById("batFilterReset").addEventListener("click", () => {
    for (const key in fieldMap) {
      const select = document.getElementById("filter" + key);
      if (select) {
        select.innerHTML = "";
        const optAll = document.createElement("option");
        optAll.value = "";
        optAll.textContent = "All";
        select.appendChild(optAll);

        (initialDropdownValues[key] || []).forEach(val => {
          const opt = document.createElement("option");
          opt.value = val;
          opt.textContent = val;
          select.appendChild(opt);
        });

        select.value = "";
      }
    }

    document.getElementById("dateStart").value = "";
    document.getElementById("dateEnd").value = "";

    ["Family", "Genus", "Species", "CommonEng", "CommonChi"].forEach(field => {
      const select = document.getElementById("filter" + field);
      if (select) select.dispatchEvent(new Event("change"));
    });

    if (batLayer && map.hasLayer(batLayer)) {
      map.removeLayer(batLayer);
    }
    if (gridLayer && map.hasLayer(gridLayer)) {
      map.removeLayer(gridLayer);
    }
  });

  const panel = document.getElementById("bat-filter-panel");
  const toggleBar = document.getElementById("filter-toggle-bar");
  const arrowIcon = document.getElementById("filterToggleArrow");
  
  toggleBar.addEventListener("click", () => {
    const isCollapsed = panel.classList.toggle("collapsing");
    arrowIcon.textContent = isCollapsed ? '▶' : '◀';
  
    setTimeout(() => {
      map.invalidateSize();  // 讓地圖重算尺寸
    }, 310);  // 等動畫完成再重算
  });

  flatpickr("#dateStart", { dateFormat: "Y-m-d", maxDate: "today" });
  flatpickr("#dateEnd", { dateFormat: "Y-m-d", maxDate: "today" });
}
