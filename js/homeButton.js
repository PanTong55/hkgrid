export function initHomeButton(map, buttonId, bounds) {
  const homeBtn = document.getElementById(buttonId);
  if (!homeBtn) {
    console.warn(`Home button #${buttonId} not found.`);
    return;
  }

  homeBtn.addEventListener("click", () => {
    map.fitBounds(bounds);
  });
}
