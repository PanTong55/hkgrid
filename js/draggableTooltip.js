export function makeTooltipDraggable(tooltip, onDragEnd = null) {
  let isDragging = false;
  let offsetX, offsetY;

  function startDrag(e) {
    if (e.target.closest('.tooltip-close')) {
      return;
    }

    isDragging = true;
    if (e.type.startsWith('touch')) {
      const touch = e.touches[0];
      offsetX = touch.clientX - tooltip.offsetLeft;
      offsetY = touch.clientY - tooltip.offsetTop;
    } else {
      offsetX = e.clientX - tooltip.offsetLeft;
      offsetY = e.clientY - tooltip.offsetTop;
    }
    tooltip.style.cursor = 'move';
    tooltip.style.opacity = '0.7';
    e.preventDefault();
    e.stopPropagation();
  }

  function duringDrag(e) {
    if (!isDragging) return;
    let clientX, clientY;
    if (e.type.startsWith('touch')) {
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    tooltip.style.left = `${clientX - offsetX}px`;
    tooltip.style.top = `${clientY - offsetY}px`;
  }

  function endDrag() {
    if (isDragging) {
      isDragging = false;
      tooltip.style.cursor = 'default';
      tooltip.style.transition = 'opacity 0.2s ease';
      tooltip.style.opacity = '1';
      if (typeof onDragEnd === 'function') onDragEnd();
      setTimeout(() => { tooltip.style.transition = ''; }, 200);
    }
  }

  // Desktop 事件
  tooltip.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', duringDrag);
  document.addEventListener('mouseup', endDrag);

  // Mobile 事件
  tooltip.addEventListener('touchstart', startDrag, { passive: false });
  document.addEventListener('touchmove', duringDrag, { passive: false });
  document.addEventListener('touchend', endDrag);
}
