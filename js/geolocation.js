// geolocation.js

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

function updateAlphaStatus(pos) {
  const statusEl = document.getElementById("alpha-status");
  if (!statusEl || !pos) return;

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
            console.warn("deviceorientationabsolute 無反應，嘗試 fallback...");
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

  let locateMarker = null;
  let accuracyCircle = null;
  let watchId = null;
  let autoFollow = true;
  let currentRadius = 0;

  function enable() {
    if (watchId !== null) return; // 已啟用就不重複執行

    locateBtn.classList.add("active");
    autoFollow = true;
    statusEl.style.display = "block";
    statusEl.innerHTML = '<div style="text-align: center;">取得座標中...</div>';

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        const accuracy = pos.coords.accuracy;
        window.lastGeoPosition = pos;

        updateAlphaStatus(pos);

        if (!locateMarker) {
          locateMarker = L.marker(latlng, {
            icon: L.divIcon({
              className: "lucide-locate-icon",
              html: `<div class="rotate-container"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#007aff" viewBox="0 0 24 24"><path d="M12 2l6 20-6-4-6 4 6-20z"/></svg></div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })
          }).addTo(map);
          lucide.createIcons();
        } else {
          animateMarkerTo(locateMarker, L.latLng(latlng));
        }

        if (!accuracyCircle) {
          accuracyCircle = L.circle(latlng, {
            radius: accuracy,
            color: "transparent",
            weight: 0,
            fillColor: "#1E90FF",
            fillOpacity: 0.15,
          }).addTo(map);
          currentRadius = accuracy;
        } else {
          animateCircleTo(accuracyCircle, L.latLng(latlng));
          animateAccuracyCircle(accuracy);
        }

        const bounds = map.getBounds();
        if (autoFollow) {
          map.setView(latlng, 17);
        } else if (!bounds.pad(-0.15).contains(latlng)) {
          autoFollow = true;
          map.setView(latlng);
        }
      },
      (err) => alert("定位失敗：" + err.message),
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

  const alphaStatus = document.getElementById("alpha-status");
  if (alphaStatus) {
    makeTooltipDraggable(alphaStatus);
  }

  return { enable, disable };
}
