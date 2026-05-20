document.addEventListener("DOMContentLoaded", function () {
  initPlayer();
});

function initPlayer() {
  const video = document.getElementById("videoPlayer");

  // Sustituye esta URL por el MPD remoto protegido que quieras probar
  const manifestUrl = "https://media.axprod.net/TestVectors/Cmaf/protected_1080p_h264_cbcs/manifest.mpd";

  // Sustituye este valor por el token real X-AxDRM-Message
  const axinomToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJ2ZXJzaW9uIjogMSwKICAiY29tX2tlV9pZCI6ICI2OWU1NDA4OC1lOWUwLTQ1MzAtOGMxYS0xZWI2ZGNkMGQxNGUiLAogICJtZXNzYWdlIjogewogICAgInR5cGUiOiAiZW50aXRsZW1lbnRfbWVzc2FnZSIsCiAgICAidmVyc2lvbiI6IDIsCiAgICAibGljZW5zZSI6IHsKICAgICAgImFsbG93X3BlcnNpc3RlbmNlIjogdHJ1ZQogICAgfSwKICAgICJjb250ZW50X2tlWXNfc291cmNlIjogewogICAgICAiaW5saW5lIjogWwogICAgICAgIHsKICAgICAgICAgICJpZCI6ICIzMDJmODBkZC00MTFlLTQ4ODYtYmNhNS1iYjFmODAxOGEwMjQiLAogICAgICAgICAgImVuY3J5cHRlZF9rZXkiOiAicm9LQWcwdDdKaTFpNDNmd3YremZ0UT09IiwKICAgICAgICAgICJ1c2FnZV9wb2xpY3kiOiAiUG9saWN5IEEiCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgImNvbnRlbnRfa2V5X3VzYWdlX3BvbGljaWVzIjogWwogICAgICB7CiAgICAgICAgIm5hbWUiOiAiUG9saWN5IEEiLAogICAgIC AgICJwbGF5cmVhZHkiOiB7CiAgICAgICAgICAibWluX2RldmljZV9zZWN1cml0eV9sZXZlbCI6IDE1MCwKICAgICAgICAgICJwbGF5X2VuYWJsZXJzIjogWwogIC AgIC AgIC AgICAiNzg2NjI3RDgtQzJBNi00NEJFLThGODgtMDhBRTI1NUIwMUE3IgogIC AgIC AgIC AgXQogIC AgIC AgIH0KIC AgIC AgfQog IC AgXQogIH0KfQ._NfhLVY7S6k8TJDWPeMPhUawhympnrk6WAZHOVjER6M";
  // const axinomToken = "hola" // for testing DRM error

  // URLs de licencia de TU tenant Axinom
  const widevineLicenseUrl =
    "https://9bb5eecb.drm-widevine-licensing.axprod.net/AcquireLicense";

  const playreadyLicenseUrl =
    "https://9bb5eecb.drm-playready-licensing.axprod.net/AcquireLicense";

  document.getElementById("manifestInfo").innerText = manifestUrl;
  document.getElementById("statusInfo").innerText = "Initializing player...";

  const player = dashjs.MediaPlayer().create();

  const protectionData = {
    "com.widevine.alpha": {
      serverURL: widevineLicenseUrl,
      httpRequestHeaders: {
        "X-AxDRM-Message": axinomToken
      },
      withCredentials: false,
      priority: 1
    },
    "com.microsoft.playready": {
      serverURL: playreadyLicenseUrl,
      httpRequestHeaders: {
        "X-AxDRM-Message": axinomToken
      },
      withCredentials: false,
      priority: 2
    }
  };

  player.updateSettings({
    debug: {
      logLevel: dashjs.Debug.LOG_LEVEL_DEBUG
    }
  });

  player.setProtectionData(protectionData);
  player.initialize(video, manifestUrl, true);

  // Logs for the different status of the DRM process
  player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, function () {
    console.log("STREAM_INITIALIZED");
    document.getElementById("statusInfo").innerText =
      "Stream initialized. Waiting for DRM license...";
  });

  player.on(dashjs.MediaPlayer.events.PLAYBACK_STARTED, function () {
    console.log("PLAYBACK_STARTED");
    document.getElementById("statusInfo").innerText =
      "Playback started successfully.";
  });

  player.on(dashjs.MediaPlayer.events.ERROR, function (e) {
    console.error("dash.js ERROR:", e);
    document.getElementById("statusInfo").innerText =
      "Playback/DRM error. Check browser console.";
  });

  player.on(dashjs.MediaPlayer.events.KEY_ERROR, function (e) {
    console.error("KEY_ERROR:", e);
    document.getElementById("statusInfo").innerText =
      "DRM key error. Check token, license URL, and browser support.";
  });

  player.on(dashjs.MediaPlayer.events.KEY_SESSION_CREATED, function (e) {
    console.log("KEY_SESSION_CREATED:", e);
    document.getElementById("statusInfo").innerText =
      "DRM session created.";
  });

  player.on(dashjs.MediaPlayer.events.LICENSE_REQUEST_SENDING, function (e) {
    console.log("LICENSE_REQUEST_SENDING:", e);
    document.getElementById("statusInfo").innerText =
      "Sending license request...";
  });

  player.on(dashjs.MediaPlayer.events.LICENSE_REQUEST_COMPLETE, function (e) {
    console.log("LICENSE_REQUEST_COMPLETE:", e);
    document.getElementById("statusInfo").innerText =
      "License request completed.";
  });

  player.on(dashjs.MediaPlayer.events.KEY_STATUSES_CHANGED, function (e) {
    console.log("KEY_STATUSES_CHANGED:", e);
  });
}
