// modules/fullscreen-control.js
export function initFullscreen(map) {
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  let isFullscreen = false;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  fullscreenBtn.addEventListener("click", () => {
    if (!isFullscreen) {
      openFullscreen();
    } else {
      closeFullscreen();
    }
  });

  function openFullscreen() {
    const elem = document.getElementById("map");

    if (isIOS) {
      elem.classList.add("fake-fullscreen");
      handleFullscreenChange();
    } else {
      if (elem.requestFullscreen) elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
      else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
    }
  }

  function closeFullscreen() {
    const elem = document.getElementById("map");

    if (isIOS) {
      elem.classList.remove("fake-fullscreen");
      handleFullscreenChange();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    }
  }

  function handleFullscreenChange() {
    isFullscreen =
      !!document.fullscreenElement ||
      !!document.webkitFullscreenElement ||
      !!document.msFullscreenElement ||
      document.getElementById("map").classList.contains("fake-fullscreen");

    fullscreenBtn.innerHTML = isFullscreen
      ? '<i data-lucide="minimize" style="width: 14px; height: 14px; color: black;"></i>'
      : '<i data-lucide="maximize" style="width: 14px; height: 14px; color: black;"></i>';

    lucide.createIcons();
  }

  // 監聽原生全螢幕變化事件
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
  document.addEventListener("msfullscreenchange", handleFullscreenChange);
}
