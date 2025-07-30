export let mapInstance = null;
const tooltipLineData = new Map(); // tooltipEl -> { line, targetLatLng }

function getLineColor() {
  const name = (window.currentBasemapName || '').toLowerCase();
  return name.includes('satellite') || name.includes('hybrid') ? '#fff' : '#333';
}

export function initTooltipLine(map) {
  mapInstance = map;
  map.on('move zoom', updateAllTooltipLines);
  map.on('baselayerchange', (e) => {
    window.currentBasemapName = e.name || '';
    updateAllTooltipLines();
  });
  window.currentBasemapName = window.currentBasemapName || 'Street';
}

export function attachTooltipLine(tooltipEl, targetLatLng) {
  if (!mapInstance) return;
  const svg = document.getElementById('tooltip-lines');
  if (!svg) return;
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.classList.add('tooltip-line');
  svg.appendChild(line);
  tooltipLineData.set(tooltipEl, { line, targetLatLng });
  updateTooltipLine(tooltipEl);
}

export function updateTooltipLineTarget(tooltipEl, targetLatLng) {
  const data = tooltipLineData.get(tooltipEl);
  if (data) {
    data.targetLatLng = targetLatLng;
  }
}

export function detachTooltipLine(tooltipEl) {
  const data = tooltipLineData.get(tooltipEl);
  if (data) {
    data.line.remove();
    tooltipLineData.delete(tooltipEl);
  }
}

export function updateTooltipLine(tooltipEl) {
  const data = tooltipLineData.get(tooltipEl);
  if (!data || !mapInstance) return;
  const { line, targetLatLng } = data;
  const p1 = mapInstance.latLngToContainerPoint(targetLatLng);
  const mapRect = document.getElementById('map').getBoundingClientRect();
  const rect = tooltipEl.getBoundingClientRect();
  const x2 = rect.left - mapRect.left + rect.width / 2;
  const y2 = rect.top - mapRect.top + rect.height / 2;
  line.setAttribute('x1', p1.x);
  line.setAttribute('y1', p1.y);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  line.setAttribute('stroke', getLineColor());
  line.setAttribute('stroke-width', '2');
}

export function updateAllTooltipLines() {
  tooltipLineData.forEach((_, tooltipEl) => updateTooltipLine(tooltipEl));
}
