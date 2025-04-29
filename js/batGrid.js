import { makeTooltipDraggable } from './draggableTooltip.js';

export function initBatGrid(map, layersControl) {
  const gridLayer = L.geoJSON(null);
  let speciesData = {};
  const maxLockedTooltips = 3;

  const hoverTooltip = document.getElementById("hoverTooltip");
  const lockedLayers = [];
  const tooltipElements = [];
  const manualMoved = [];

  const legend = L.control({ position: "bottomright" });
  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "info legend");
    const grades = [1, 6, 11, 16, 21];
    const colors = ["#fde0dd", "#fbb4b9", "#f768a1", "#c51b8a", "#7a0177"];
    div.innerHTML = "<strong>No. of Species</strong><br>";

    for (let i = 0; i < grades.length; i++) {
      const to = grades[i + 1] - 1;
      const label = to ? `${grades[i]}–${to}` : `> ${grades[i] - 1}`;
      div.innerHTML += `<i style="background:${colors[i]}; width:14px;height:14px;display:inline-block;margin-right:6px;border-radius:2px;"></i> ${label}<br>`;
    }
    return div;
  };

  map.on("overlayadd", (e) => {
    if (e.name === "All Bat Distribution (Grid)") legend.addTo(map);
  });

  map.on("overlayremove", (e) => {
    if (e.name === "All Bat Distribution (Grid)") map.removeControl(legend);
  });

  fetch("https://opensheet.elk.sh/1Al_sWwiIU6DtQv6sMFvXb9wBUbBiE-zcYk8vEwV82x8/sheet1")
    .then((r) => r.json())
    .then((data) => {
      data.forEach((item) => {
        speciesData[item["Grid No."]] = {
          list: item["Species List"],
          count: item["No. of Species"],
        };
      });
      fetch("https://raw.githubusercontent.com/PanTong55/hkgrid/main/hkgrid.geojson")
        .then((r) => r.json())
        .then((gridData) => {
          const styledLayer = L.geoJSON(gridData, {
            style: (feature) => getGridStyle(speciesData[feature.properties.Grid_No]?.count),
            onEachFeature: setupFeature,
          });
          layersControl.addOverlay(styledLayer, "All Bat Distribution (Grid)");
        });
    });

  function getGridStyle(count) {
    let fillColor = "#fff";
    let fillOpacity = 0;
    count = Number(count || 0);
    if (count > 0) {
      fillOpacity = 0.75;
      if (count <= 5) fillColor = "#fde0dd";
      else if (count <= 10) fillColor = "#fbb4b9";
      else if (count <= 15) fillColor = "#f768a1";
      else if (count <= 20) fillColor = "#c51b8a";
      else fillColor = "#7a0177";
    }
    return { color: "#666", weight: 1, fillColor, fillOpacity };
  }

  function setupFeature(feature, layer) {
    const gridNo = feature.properties.Grid_No;
    const info = speciesData[gridNo];
    if (!info) return;

    const tooltipContent = createTooltipContent(gridNo, info);
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
        layer.setStyle(getGridStyle(info.count));
      } else {
        if (lockedLayers.length >= maxLockedTooltips) {
          alert(`最多只能顯示 ${maxLockedTooltips} 個格網的資料`);
          return;
        }
        layer.setStyle({ color: "#333", weight: 2, fillColor: "#ffcc00", fillOpacity: 0.7 });
        openLockTooltip(layer, tooltipContent);
      }
    });
  }

  function createTooltipContent(gridNo, info) {
    if (!info.list || info.list === "N/A") return `<strong>編號:</strong> ${gridNo}<br>暫無物種記錄`;
    const speciesArray = info.list.split(", ").sort();
    const speciesList = speciesArray.map((s, i) => `${i + 1}. <i>${s}</i>`).join("<br>");
    return `<strong>編號:</strong> ${gridNo}<br><strong>數量:</strong> ${info.count} 種<br><strong>清單:</strong><br>${speciesList}`;
  }

  function openLockTooltip(layer, htmlContent) {
    const tooltip = document.createElement("div");
    tooltip.className = "floatingTooltip";
    tooltip.setAttribute("data-layer-id", L.stamp(layer));
    tooltip.innerHTML = `
      <div class="tooltip-container">
        <a href="#" class="tooltip-close" onclick="closeLockTooltip(event, this);">✖</a>
        <div class="tooltip-content">${htmlContent}</div>
      </div>`;
    document.getElementById("map").appendChild(tooltip);

    lockedLayers.push(layer);
    tooltipElements.push(tooltip);
    manualMoved.push(false);

    const center = map.latLngToContainerPoint(layer.getBounds().getCenter());
    positionTooltip(tooltip, center);

    makeTooltipDraggable(tooltip);
  }

  function closeLockTooltip(event, closeButton) {
    event.preventDefault();
    const tooltip = closeButton.closest(".floatingTooltip");
    const layerId = parseInt(tooltip.dataset.layerId);
    const idx = lockedLayers.findIndex((l) => L.stamp(l) === layerId);
  
    if (idx !== -1) {
      const layer = lockedLayers[idx];
      const gridNo = layer.feature.properties.Grid_No;
      const count = speciesData[gridNo] ? speciesData[gridNo].count : 0;
      layer.setStyle(getGridStyle(count));  // ✅ 還原樣式
      lockedLayers.splice(idx, 1);
      tooltipElements[idx].remove();
      tooltipElements.splice(idx, 1);
      manualMoved.splice(idx, 1);
    }
  }  

  function positionTooltip(domElement, point) {
    const mapSize = map.getSize();
    let left = point.x + 15;
    let top = point.y + 15;
    if (left + domElement.offsetWidth > mapSize.x) left = point.x - domElement.offsetWidth - 15;
    if (top + domElement.offsetHeight > mapSize.y) top = point.y - domElement.offsetHeight - 15;
    if (left < 0) left = 10;
    if (top < 0) top = 10;
    domElement.style.left = `${left}px`;
    domElement.style.top = `${top}px`;
    domElement.style.position = "absolute";
  }
  window.closeLockTooltip = closeLockTooltip;
}
