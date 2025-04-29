// fullscreen.js (ES6 Module)
export let isFullscreen = false;

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

export function openFullscreen(elem) {
  if (isIOS) {
    elem.classList.add("fake-fullscreen");
    handleFullscreenChange();
  } else {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  }
}

export function closeFullscreen(elem) {
  if (isIOS) {
    elem.classList.remove("fake-fullscreen");
    handleFullscreenChange();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
}

export function handleFullscreenChange(updateBtn) {
  const elem = document.getElementById("map");
  isFullscreen = !!document.fullscreenElement ||
                 !!document.webkitFullscreenElement ||
                 !!document.msFullscreenElement ||
                 elem.classList.contains("fake-fullscreen");

  if (typeof updateBtn === 'function') updateBtn(isFullscreen);
}

export function setupFullscreenEvents(updateBtn) {
  document.addEventListener("fullscreenchange", () => handleFullscreenChange(updateBtn));
  document.addEventListener("webkitfullscreenchange", () => handleFullscreenChange(updateBtn));
  document.addEventListener("msfullscreenchange", () => handleFullscreenChange(updateBtn));
}
