export function attachTooltipLine(map, getLatLng, tooltip) {
  const svg = document.getElementById('tooltipLines');
  if (!svg) return null;
  const ns = 'http://www.w3.org/2000/svg';
  const line = document.createElementNS(ns, 'line');
  line.classList.add('tooltip-line');
  svg.appendChild(line);

  function getColor() {
    return map.getBaseLayerCategory && map.getBaseLayerCategory() === 'satellite' ? '#fff' : '#555';
  }

  function update() {
    const latlng = typeof getLatLng === 'function' ? getLatLng() : getLatLng;
    const point = map.latLngToContainerPoint(latlng);
    const svgRect = svg.getBoundingClientRect();
    const ttRect = tooltip.getBoundingClientRect();
    const x1 = point.x;
    const y1 = point.y;
    const x2 = ttRect.left + ttRect.width / 2 - svgRect.left;
    const y2 = ttRect.top + ttRect.height / 2 - svgRect.top;
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', getColor());
    line.setAttribute('stroke-width', 2);
  }

  update();

  return {
    line,
    update,
    remove() { line.remove(); }
  };
}
