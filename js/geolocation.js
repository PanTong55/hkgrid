let locateMarker = null;
let accuracyCircle = null;
let watchId = null;
let autoFollow = true;
let currentRadius = 0;

import { makeTooltipDraggable } from './draggableTooltip.js';

function easeOutCubic(t) {
  return --t * t * t + 1;
}

function animateMarkerTo(marker, newLatLng, duration = 400) {
  const startLatLng = marker.getLatLng();
  const startTime = performance.now();

  function step(timestamp) {
    const elapsed = timestamp - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(t);
    const lat = startLatLng.lat + (newLatLng.lat - startLatLng.lat) * eased;
    const lng = startLatLng.lng + (newLatLng.lng - startLatLng.lng) * eased;

    marker.setLatLng([lat, lng]);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function animateCircleTo(circle, newLatLng, duration = 400) {
  const startLatLng = circle.getLatLng();
  const startTime = performance.now();

  function step(timestamp) {
    const elapsed = timestamp - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(t);

    const lat = startLatLng.lat + (newLatLng.lat - startLatLng.lat) * eased;
    const lng = startLatLng.lng + (newLatLng.lng - startLatLng.lng) * eased;
    circle.setLatLng([lat, lng]);

    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function animateAccuracyCircle(targetRadius) {
  const duration = 400;
  const start = performance.now();
  const initial = currentRadius;

  function step(ts) {
    const progress = Math.min((ts - start) / duration, 1);
    const eased = initial + (targetRadius - initial) * easeOutCubic(progress);
    accuracyCircle.setRadius(eased);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      currentRadius = targetRadius;
    }
  }
  requestAnimationFrame(step);
}

export function rotateMarker(marker, angle) {
  if (!marker) return;
  const el = marker.getElement();
  if (el) {
    const rotateContainer = el.querySelector(".rotate-container");
    if (rotateContainer) {
      rotateContainer.style.transform = `rotate(${angle}deg)`;
      rotateContainer.style.transformOrigin = "center";
    }
  }
}

export function handleHeading(event) {
  window.headingEventTriggered = true;
  let heading = null;

  if (typeof event.webkitCompassHeading !== "undefined") {
    heading = event.webkitCompassHeading;
  } else if (event.alpha != null) {
    heading = 360 - event.alpha;
  }

  window.currentHeading = heading;
  updateAlphaStatus(window.lastGeoPosition);

  if (locateMarker && heading != null) {
    rotateMarker(locateMarker, heading);
  }
}

export function updateAlphaStatus(pos) {
  const statusEl = document.getElementById("alpha-status");
  if (!statusEl || !pos) return;
  if (window.isDraggingAlphaStatus) return;

  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;
  const acc = pos.coords.accuracy ? `${Math.round(pos.coords.accuracy)} m` : "N/A";
  const alt = pos.coords.altitude != null ? `${pos.coords.altitude.toFixed(1)} m` : "N/A";
  const altAcc = pos.coords.altitudeAccuracy ? `${Math.round(pos.coords.altitudeAccuracy)} m` : "N/A";
  const heading = window.currentHeading != null ? `${window.currentHeading.toFixed(2)}°` : "--";

  const crsMode = document.getElementById("crsMode")?.value || "wgs84";
  let coordText = "";

  if (crsMode === "hk1980") {
    const [x, y] = proj4("EPSG:4326", "EPSG:2326", [lng, lat]);
    coordText = `X: ${Math.round(x)}, Y: ${Math.round(y)} (±${acc})`;
  } else {
    coordText = `${lat.toFixed(6)}, ${lng.toFixed(6)} (±${acc})`;
  }

  statusEl.innerHTML = `
    <div><strong>座標：</strong> ${coordText}</div>
    <div><strong>高度：</strong> ${alt} (±${altAcc})</div>
    <div><strong>方向：</strong> ${heading}</div>
  `;
}

export function initOrientationListener() {
  if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
    DeviceOrientationEvent.requestPermission().then((permissionState) => {
      if (permissionState === "granted") {
        window.addEventListener("deviceorientationabsolute", handleHeading, true);
        setTimeout(() => {
          if (!window.headingEventTriggered) {
            window.addEventListener("deviceorientation", handleHeading, true);
          }
        }, 3000);
      }
    }).catch(console.error);
  } else {
    window.addEventListener("deviceorientationabsolute", handleHeading, true);
  }
}

export function initLocateTool(map, buttonId) {
  const locateBtn = document.getElementById(buttonId);
  const statusEl = document.getElementById("alpha-status");
  const crsSelect = document.getElementById("crsMode");
  const refollowBtn = document.getElementById("refollowBtn");

  let refollowTimer = null;
  let isUserMovedMap = false;
  let isManualTrigger = false;
  let lastFollowedCenter = null;

  // 檢測滑鼠或手指開始操作地圖（只限於人為觸發）
  map.getContainer().addEventListener("mousedown", () => isManualTrigger = true);
  map.getContainer().addEventListener("touchstart", () => isManualTrigger = true);

  function startRefollowCountdown() {
    if (watchId === null || autoFollow) return;
    if (refollowTimer) clearTimeout(refollowTimer);
    refollowTimer = setTimeout(() => {
      if (!autoFollow && watchId !== null) {
        refollowBtn.style.display = "block";
      }
    }, 5000);
  }

  function handleMapStart() {
    if (watchId === null) return;

    if (isManualTrigger) {
      isUserMovedMap = true;
    }
  }

  function handleMapEnd() {
    if (watchId === null || !autoFollow || !isUserMovedMap) return;
    autoFollow = false;
    isUserMovedMap = false;
    isManualTrigger = false;
    startRefollowCountdown();
  }

  refollowBtn.addEventListener("click", () => {
    if (watchId === null) return;
    autoFollow = true;
    refollowBtn.style.display = "none";
    if (window.lastGeoPosition) {
      const lat = window.lastGeoPosition.coords.latitude;
      const lng = window.lastGeoPosition.coords.longitude;
      map.setView([lat, lng], 17);
      lastFollowedCenter = L.latLng(lat, lng);
    }
  });

  function enable() {
    if (watchId !== null) return;

    locateBtn.classList.add("active");
    autoFollow = true;
    refollowBtn.style.display = "none";
    statusEl.style.display = "block";
    statusEl.innerHTML = '<div style="text-align: center;">取得座標中...</div>';

    map.on("dragstart", handleMapStart);
    map.on("dragend", handleMapEnd);
    map.on("zoomstart", handleMapStart);
    map.on("zoomend", handleMapEnd);

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        const accuracy = pos.coords.accuracy;
        window.lastGeoPosition = pos;

        updateAlphaStatus(pos);

    if (!locateMarker) {
      let iconHtml;
    
      if (window.currentHeading != null) {
        iconHtml = `
          <div class="rotate-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path d="M12 2l6 20-6-4-6 4 6-20z"
                    fill="#007aff"
                    stroke="white"
                    stroke-width="1.2"
                    stroke-linejoin="round" />
            </svg>
          </div>
        `;
      } else {
        iconHtml = `<div class="pulse-circle"></div>`;
      }
    
      locateMarker = L.marker(latlng, {
        icon: L.divIcon({
          className: "lucide-locate-icon",
          html: iconHtml,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
      }).addTo(map);
    
    } else {
      animateMarkerTo(locateMarker, L.latLng(latlng));
    }

      if (autoFollow) {
        const currentCenter = map.getCenter();
        const newCenter = L.latLng(latlng);
        const currentZoom = map.getZoom();
      
        const centerShift = currentCenter.distanceTo(newCenter);
        const zoomChanged = currentZoom !== 17;

        if (centerShift > 20 || zoomChanged) {
          isManualTrigger = false;
          isUserMovedMap = false;
      
          map.setView(newCenter, 17);
        }
          lastFollowedCenter = L.latLng(latlng);
        }
      },
      (err) => alert("⚠️ 定位失敗：" + err.message),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    window.addEventListener("deviceorientationabsolute", handleHeading, true);
    setTimeout(() => {
      if (!window.headingEventTriggered) {
        window.addEventListener("deviceorientation", handleHeading, true);
      }
    }, 3000);
  }

  function disable() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    if (locateMarker) map.removeLayer(locateMarker);
    if (accuracyCircle) map.removeLayer(accuracyCircle);
    locateMarker = null;
    accuracyCircle = null;
    locateBtn.classList.remove("active");
    statusEl.style.display = "none";
    refollowBtn.style.display = "none";
    autoFollow = false;
    if (refollowTimer) clearTimeout(refollowTimer);

    map.off("dragstart", handleMapStart);
    map.off("dragend", handleMapEnd);
    map.off("zoomstart", handleMapStart);
    map.off("zoomend", handleMapEnd);

    window.removeEventListener("deviceorientationabsolute", handleHeading);
    window.removeEventListener("deviceorientation", handleHeading);
  }

  if (crsSelect) {
    crsSelect.addEventListener("change", () => {
      if (window.lastGeoPosition) {
        updateAlphaStatus(window.lastGeoPosition);
      }
    });
  }

  if (statusEl) {
    makeTooltipDraggable(statusEl);
  }

  return { enable, disable };
}

