// modules/locate-tracking.js
export function initLocateTracking(map) {
  const locateBtn = document.getElementById("locateBtn");
  let locateMarker = null;
  let accuracyCircle = null;
  let currentRadius = 0;
  let watchId = null;
  let autoFollow = true;

  locateBtn.addEventListener("click", () => {
    if (watchId !== null) {
      // 關閉追蹤
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
      if (locateMarker) map.removeLayer(locateMarker);
      if (accuracyCircle) map.removeLayer(accuracyCircle);
      locateMarker = null;
      accuracyCircle = null;
      locateBtn.classList.remove("active");
      window.removeEventListener("deviceorientationabsolute", handleHeading);
      window.removeEventListener("deviceorientation", handleHeading);
      return;
    }

    locateBtn.classList.add("active");
    autoFollow = true;

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        const accuracy = pos.coords.accuracy;

        if (!locateMarker) {
          locateMarker = L.marker(latlng, {
            icon: L.divIcon({
              className: "lucide-locate-icon",
              html: `
                <div class="rotate-container">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#007aff" viewBox="0 0 24 24">
                    <path d="M12 2l6 20-6-4-6 4 6-20z"/>
                  </svg>
                </div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            }),
          }).addTo(map);
          lucide.createIcons();
        } else {
          animateLatLng(locateMarker, L.latLng(latlng));
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
          animateLatLng(accuracyCircle, L.latLng(latlng));
          animateRadius(accuracy);
        }

        if (autoFollow) {
          map.setView(latlng, 17);
        } else {
          const margin = map.getBounds().pad(-0.15);
          if (!margin.contains(latlng)) {
            autoFollow = true;
            map.setView(latlng);
          }
        }
      },
      (err) => {
        alert("定位失敗：" + err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // 開始偵測方向（alpha）
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission()
        .then((permissionState) => {
          if (permissionState === "granted") {
            window.addEventListener("deviceorientationabsolute", handleHeading, true);
            setTimeout(() => {
              if (!window.headingEventTriggered) {
                window.addEventListener("deviceorientation", handleHeading, true);
              }
            }, 3000);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener("deviceorientationabsolute", handleHeading, true);
    }
  });

  function handleHeading(event) {
    window.headingEventTriggered = true;
    let heading = null;

    if (typeof event.webkitCompassHeading !== "undefined") {
      heading = event.webkitCompassHeading;
    } else if (event.alpha != null) {
      heading = 360 - event.alpha;
    }

    if (heading != null) {
      document.getElementById("alpha-status").textContent = `Heading: ${heading.toFixed(2)}°`;
      rotateMarker(locateMarker, heading);
    } else {
      document.getElementById("alpha-status").textContent = `⚠️ 無法取得方向感應數據`;
    }
  }

  function rotateMarker(marker, angle) {
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

  function animateLatLng(target, newLatLng, duration = 400) {
    const startLatLng = target.getLatLng();
    const startTime = performance.now();

    function step(timestamp) {
      const elapsed = timestamp - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(t);
      const lat = startLatLng.lat + (newLatLng.lat - startLatLng.lat) * eased;
      const lng = startLatLng.lng + (newLatLng.lng - startLatLng.lng) * eased;
      target.setLatLng([lat, lng]);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function animateRadius(targetRadius) {
    const duration = 400;
    const start = performance.now();
    const initial = currentRadius;

    function step(ts) {
      const progress = Math.min((ts - start) / duration, 1);
      const eased = initial + (targetRadius - initial) * easeOutCubic(progress);
      accuracyCircle.setRadius(eased);
      if (progress < 1) requestAnimationFrame(step);
      else currentRadius = targetRadius;
    }
    requestAnimationFrame(step);
  }

  function easeOutCubic(t) {
    return --t * t * t + 1;
  }
}
