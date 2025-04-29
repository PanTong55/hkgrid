// modules/tooltip-legend.js
export function initTooltipLegend(map, layersControl) {
  const hoverTooltip = document.getElementById("hoverTooltip");
  const maxLockedTooltips = 3;
  const lockedLayers = [];
  const tooltipElements = [];
  const manualMoved = [];

  let speciesData = {};

  // 載入蝙蝠物種資料
  fetch("https://opensheet.elk.sh/1Al_sWwiIU6DtQv6sMFvXb9wBUbBiE-zcYk8vEwV82x8/sheet1")
    .then(r => r.json())
    .then(data => {
      data.forEach(item => {
        speciesData[item["Grid No."]] = {
          list: item["Species List"],
          count: item["No. of Species"],
        };
      });

      fetch("https://raw.githubusercontent.com/PanTong55/hkgrid/main/hkgrid.geojson")
        .then(r => r.json())
        .then(gridData => {
          const gridLayer = L.geoJSON(gridData, {
            style: feature => {
              const gridNo = feature.properties.Grid_No;
              const info = speciesData[gridNo];
              const count = info ? info.count : 0;
              return getGridStyle(count);
            },
            onEachFeature: setupGridFeature,
          });

          layersControl.addOverlay(gridLayer, "All Bat Distribution (Grid)");

          map.on("move zoom", () => {
            lockedLayers.forEach((layer, i) => {
              if (manualMoved[i]) return;
              const tooltip = tooltipElements[i];
              const point = map.latLngToContainerPoint(layer.getBounds().getCenter());
              positionTooltip(tooltip, point);
            });
          });
        });
    });

  // 加郊野公園邊界
  fetch("https://raw.githubusercontent.com/PanTong55/hkgrid/main/OSM_CP.geojson")
    .then(r => r.json())
    .then(data => {
      const cpLayer = L.geoJSON(data, {
        style: {
          color: "#228B22",
          weight: 2,
          fillColor: "#ADFF2F",
          fillOpacity: 0.1,
        },
      });
      layersControl.addOverlay(cpLayer, "郊野公圖邊界 (OSM)");
    });

  const legend = L.control({ position: "bottomright" });
  legend.onAdd = () => {
    const div = L.DomUtil.create("div", "info legend");
    const grades = [1, 6, 11, 16, 21];
    const colors = ["#fde0dd", "#fbb4b9", "#f768a1", "#c51b8a", "#7a0177"];
    div.innerHTML = "<strong>No. of Species</strong><br>";
    for (let i = 0; i < grades.length; i++) {
      const from = grades[i];
      const to = grades[i + 1] - 1;
      const label = to ? `${from}–${to}` : `> ${from - 1}`;
      div.innerHTML += `<i style="background:${colors[i]}; width: 14px; height: 14px; display: inline-block; margin-right: 6px; border-radius: 2px;"></i>${label}<br>`;
    }
    return div;
  };

  map.on("overlayadd", e => {
    if (e.name === "All Bat Distribution (Grid)") legend.addTo(map);
  });

  map.on("overlayremove", e => {
    if (e.name === "All Bat Distribution (Grid)") map.removeControl(legend);
  });

  function setupGridFeature(feature, layer) {
    const gridNo = feature.properties.Grid_No;
    const info = speciesData[gridNo];
    if (!info) return;

    let content = "";
    if (!info.list || info.list === "N/A") {
      content = `<strong>編號:</strong> ${gridNo}<br>暫無物種記錄`;
    } else {
      const speciesArray = info.list.split(", ").sort();
      const list = speciesArray.map((s, i) => `${i + 1}. <i>${s}</i>`).join("<br>");
      content = `<strong>編號:</strong> ${gridNo}<br><strong>數量:</strong> ${info.count} 種<br><strong>清單:</strong><br>${list}`;
    }

    layer.options.tooltipContent = content;

    layer.on("mouseover", () => {
      if (!lockedLayers.includes(layer)) {
        hoverTooltip.innerHTML = content;
        hoverTooltip.style.display = "block";
      }
    });

    layer.on("mousemove", e => {
      if (!lockedLayers.includes(layer)) {
        const point = map.latLngToContainerPoint(e.latlng);
        positionTooltip(hoverTooltip, point);
      }
    });

    layer.on("mouseout", () => {
      hoverTooltip.style.display = "none";
    });

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
          alert("最多只能顯示 " + maxLockedTooltips + " 個格網的資料");
          return;
        }
        layer.setStyle({ color: "#333", weight: 2, fillColor: "#ffcc00", fillOpacity: 0.7 });
        openLockTooltip(layer);
      }
    });
  }

  function getGridStyle(count) {
    let fillColor = "#fff", fillOpacity = 0;
    if (count) {
      count = Number(count);
      fillOpacity = 0.75;
      if (count <= 5) fillColor = "#fde0dd";
      else if (count <= 10) fillColor = "#fbb4b9";
      else if (count <= 15) fillColor = "#f768a1";
      else if (count <= 20) fillColor = "#c51b8a";
      else fillColor = "#7a0177";
    }
    return { color: "#666", weight: 1, fillColor, fillOpacity };
  }

  function openLockTooltip(layer) {
    const tooltip = document.createElement("div");
    tooltip.className = "floatingTooltip";
    tooltip.setAttribute("data-layer-id", L.stamp(layer));
    tooltip.innerHTML = `
      <div class="tooltip-container">
        <a href="#" class="tooltip-close">✖</a>
        <div class="tooltip-content">${layer.options.tooltipContent}</div>
      </div>`;
    document.getElementById("map").appendChild(tooltip);
    lockedLayers.push(layer);
    tooltipElements.push(tooltip);
    manualMoved.push(false);

    const center = map.latLngToContainerPoint(layer.getBounds().getCenter());
    setTimeout(() => positionTooltip(tooltip, center), 30);
    makeTooltipDraggable(tooltip, lockedLayers.length - 1);
  }

  function positionTooltip(tooltip, point) {
    const mapSize = map.getSize();
    let left = point.x + 15;
    let top = point.y + 15;
    if (left + tooltip.offsetWidth > mapSize.x) left = point.x - tooltip.offsetWidth - 15;
    if (top + tooltip.offsetHeight > mapSize.y) top = point.y - tooltip.offsetHeight - 15;
    if (left < 0) left = 10;
    if (top < 0) top = 10;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function makeTooltipDraggable(tooltip, index) {
    let isDragging = false, offsetX = 0, offsetY = 0;

    tooltip.addEventListener("mousedown", (e) => {
      isDragging = true;
      offsetX = e.clientX - tooltip.offsetLeft;
      offsetY = e.clientY - tooltip.offsetTop;
      tooltip.style.cursor = "move";
      tooltip.style.opacity = "0.7";
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      tooltip.style.left = `${e.clientX - offsetX}px`;
      tooltip.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        tooltip.style.cursor = "default";
        tooltip.style.opacity = "1";
        manualMoved[index] = true;
      }
    });

    tooltip.querySelector(".tooltip-close").addEventListener("click", (e) => {
      e.preventDefault();
      const layerId = parseInt(tooltip.dataset.layerId);
      const idx = lockedLayers.findIndex(l => L.stamp(l) === layerId);
      if (idx !== -1) {
        map.removeLayer(lockedLayers[idx]);
        tooltipElements[idx].remove();
        lockedLayers.splice(idx, 1);
        tooltipElements.splice(idx, 1);
        manualMoved.splice(idx, 1);
      }
    });
  }
}
