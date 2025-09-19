(function () {
  function onReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  onReady(function () {
    // We only need to set up delegation once; use the first button (if present) as a sentinel.
    var firstBtn = document.querySelector('[data-button-id="maps"]');
    if (!firstBtn) return; // No maps buttons yet

    if (firstBtn.dataset.mapsListenerAdded) return; // Already initialized
    firstBtn.dataset.mapsListenerAdded = "true";

    var modeLetters = { driving: "d", walking: "w", bicycling: "b", transit: "t" };

    function handleMapClick(e, el) {
      e.preventDefault();
      e.stopPropagation();

      // Support both spellings (stationAddress & stationAdress) to be forgiving
      var ds = el.dataset || {};
      var dest = ds.stationAddress || ds.stationAdress || "-";
      var mode = (ds.mode || "walking").toLowerCase();

      openGoogleMaps(dest, mode, ds);
    }

    // Event delegation so dynamically added buttons also work
    document.addEventListener("click", function(e) {
      var mapsButton = e.target.closest('[data-button-id="maps"]');
      if (mapsButton) {
        handleMapClick(e, mapsButton);
      }
    });

    function isAndroid() { return /\bAndroid\b/i.test(navigator.userAgent); }
    function isiOS() { return /\b(iPhone|iPad|iPod)\b/i.test(navigator.userAgent); }
    function isMobileUA() {
      var ua = navigator.userAgent || "";
      var uad = (navigator.userAgentData && typeof navigator.userAgentData.mobile === "boolean") ? navigator.userAgentData.mobile : null;
      return uad === true || /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua);
    }
    function isMobile() { return isAndroid() || isiOS() || isMobileUA(); }

    function getCurrentPosition(options) {
      if (!("geolocation" in navigator)) return Promise.reject(new Error("geolocation-unavailable"));
      var opts = Object.assign({ enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }, options || {});
      return new Promise(function (resolve, reject) {
        navigator.geolocation.getCurrentPosition(
          function (pos) { resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
          function (err) { reject(err); },
          opts
        );
      });
    }

    // Deep-link immediately; if we remain on page after a deadline, call fallbackFactory (which may be async).
    function tryDeepLink(primaryUrl, fallbackFactory) {
      var before = document.visibilityState;
      var BASE_DELAY_MS = 900;      // desktop baseline
      var MOBILE_EXTRA_MS = 5000;   // +5s on mobile (your requirement)
      var delay = BASE_DELAY_MS + (isMobile() ? MOBILE_EXTRA_MS : 0);

      // Launch app right away
      try { window.location.href = primaryUrl; } catch (_) {}

      setTimeout(function () {
        var stillVisible = document.visibilityState === before;
        if (!stillVisible) return; // likely switched to app
        var maybePromise = fallbackFactory();
        if (maybePromise && typeof maybePromise.then === "function") {
          maybePromise.then(function (url) { window.location.href = url; }).catch(function () {});
        } else {
          window.location.href = maybePromise;
        }
      }, delay);
    }

    async function openGoogleMaps(destination, mode, ds) {
      var destEncoded = encodeURIComponent(destination);

      // Build a privacy-first fallback (no geolocation). Google Maps web will ask the user directly if needed.
      function buildWebFallbackNoOrigin() {
        return "https://www.google.com/maps/dir/?api=1&destination="
          + destEncoded + "&travelmode=" + encodeURIComponent(mode) + "&dir_action=navigate";
      }

      // Optional: only if you set data-geo-consent="true", ask user if they want to share location for better fallback.
      function buildWebFallbackWithOptionalConsent() {
        if (ds && ds.geoConsent === "true") {
          var msg = btn.dataset.geoConsentText
            || "Share your location to improve directions in your browser?";
          if (window.confirm(msg)) {
            return getCurrentPosition().then(function (coords) {
              var origin = coords.lat.toFixed(6) + "," + coords.lng.toFixed(6);
              return "https://www.google.com/maps/dir/?api=1&origin="
                + encodeURIComponent(origin)
                + "&destination=" + destEncoded
                + "&travelmode=" + encodeURIComponent(mode)
                + "&dir_action=navigate";
            }).catch(function () {
              return buildWebFallbackNoOrigin();
            });
          }
        }
        return buildWebFallbackNoOrigin();
      }

      if (isAndroid()) {
        var m = modeLetters[mode] || "w"; // walking default
        var primary = "google.navigation:q=" + destEncoded + "&mode=" + m;
        tryDeepLink(primary, buildWebFallbackWithOptionalConsent);
        return;
      }

      if (isiOS()) {
        // No saddr: app will use "Current Location" internally
        var primaryIOS = "comgooglemaps://?daddr=" + destEncoded + "&directionsmode=" + encodeURIComponent(mode);
        tryDeepLink(primaryIOS, buildWebFallbackWithOptionalConsent);
        return;
      }

      // Desktop / unknown -> go to the web fallback immediately (no artificial delay)
      var webNow = buildWebFallbackNoOrigin();
      window.location.href = webNow;
    }
  });
})();