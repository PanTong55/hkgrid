// fullscreen.js
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

let updateFn = null; // 儲存傳入的更新函數（給 iOS 用）

export function isFullscreen() {
  const elem = document.getElementById("map");
  return !!document.fullscreenElement ||
         !!document.webkitFullscreenElement ||
         !!document.msFullscreenElement ||
         elem.classList.contains("fake-fullscreen");
}

export function openFullscreen(elem) {
  if (isIOS) {
    elem.classList.add("fake-fullscreen");
    handleFullscreenChange(updateFn); // ✅ 手動觸發圖示更新
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
    handleFullscreenChange(updateFn); // ✅ 手動觸發圖示更新
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
  const current = isFullscreen();
  if (typeof updateBtn === 'function') {
    updateBtn(current);
  }
}

export function setupFullscreenEvents(updateBtn) {
  updateFn = updateBtn; // ✅ 儲存下來給 iOS 模式使用
  document.addEventListener("fullscreenchange", () => handleFullscreenChange(updateBtn));
  document.addEventListener("webkitfullscreenchange", () => handleFullscreenChange(updateBtn));
  document.addEventListener("msfullscreenchange", () => handleFullscreenChange(updateBtn));
}
