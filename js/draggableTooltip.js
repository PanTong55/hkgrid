export function makeTooltipDraggable(tooltip, onDragEnd = null) {
  let isDragging = false;
  let offsetX, offsetY;

  function startDrag(e) {
    if (e.target.closest('.tooltip-close')) return;

    isDragging = true;
    window.isDraggingAlphaStatus = true; // ✅ 拖動中：暫停 status 更新

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
      window.isDraggingAlphaStatus = false; // ✅ 拖動結束：允許更新
      tooltip.style.cursor = 'default';
      tooltip.style.transition = 'opacity 0.2s ease';
      tooltip.style.opacity = '1';

      // ✅ 拖動結束後，立即更新一次座標狀態
      if (window.lastGeoPosition) {
        import('./geolocation.js').then(({ updateAlphaStatus }) => {
          updateAlphaStatus(window.lastGeoPosition);
        });
      }

      if (typeof onDragEnd === 'function') onDragEnd();
      setTimeout(() => { tooltip.style.transition = ''; }, 200);
    }
  }

  // Desktop
  tooltip.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', duringDrag);
  document.addEventListener('mouseup', endDrag);

  // Mobile
  tooltip.addEventListener('touchstart', startDrag, { passive: false });
  document.addEventListener('touchmove', duringDrag, { passive: false });
  document.addEventListener('touchend', endDrag);
}
