// geolocation.js

let locateMarker = null;
let accuracyCircle = null;
let watchId = null;
let autoFollow = true;
let currentRadius = 0;

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

  const statusEl = document.getElementById("alpha-status");
  if (heading != null) {
    statusEl.textContent = `Heading: ${heading.toFixed(2)}°`;
    if (locateMarker) {
      rotateMarker(locateMarker, heading);
    }
  } else {
    statusEl.textContent = `⚠️無法取得方向感應數據`;
  }
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

export function initLocateButton(map, buttonId) {
  const locateBtn = document.getElementById(buttonId);
  const statusEl = document.getElementById("alpha-status");

  locateBtn.addEventListener("click", () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
      if (locateMarker) map.removeLayer(locateMarker);
      if (accuracyCircle) map.removeLayer(accuracyCircle);
      locateMarker = null;
      accuracyCircle = null;
      locateBtn.classList.remove("active");
      window.removeEventListener("deviceorientationabsolute", handleHeading);
      window.removeEventListener("deviceorientation", handleHeading);
      statusEl.style.display = "none";
      return;
    }

    locateBtn.classList.add("active");
    autoFollow = true;
    statusEl.style.display = "block";
    statusEl.textContent = "α: --";

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        const accuracy = pos.coords.accuracy;

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
  });
}
