var FAKE_KEYS = { "oW5AK5BW43HzbTSKpiu3SQ": "AAAAAAAAAAAAAAAAAAAAAA" };

function addLog(msg, cls) {
  var log = document.getElementById('log');
  var p = document.createElement('p');
  p.className = cls || 'log-info';
  p.innerText = '[' + new Date().toLocaleTimeString() + '] ' + msg;
  log.appendChild(p);
}

function requestLicense() {
  var user = document.getElementById('user').value;
  var pass = document.getElementById('pass').value;
  var status = document.getElementById('status');
  status.className = '';
  status.innerText = 'Requesting license...';
  addLog('User "' + user + '" requesting license from server...', 'log-info');
  fetch('http://127.0.0.1:8001/get-license', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: user, password: pass })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.status === 'ok') {
      status.className = 'ok';
      status.innerText = 'License granted! Playing video...';
      addLog('License GRANTED for user "' + user + '"', 'log-ok');
      var keys = data.clearkeys;
      for (var kid in keys) {
        addLog('KID: ' + kid, 'log-key');
        addLog('KEY: ' + keys[kid], 'log-key');
      }
      playVideo(keys);
    } else {
      status.className = 'error';
      status.innerText = 'Access denied - playing corrupted video';
      addLog('License DENIED for user "' + user + '"', 'log-err');
      addLog('No valid key received - using fake key', 'log-err');
      addLog('KID: oW5AK5BW43HzbTSKpiu3SQ', 'log-key');
      addLog('KEY: AAAAAAAAAAAAAAAAAAAAAA (FAKE)', 'log-err');
      addLog('Video will be corrupted/unreadable', 'log-err');
      playVideo(FAKE_KEYS);
    }
  })
  .catch(function(e) {
    status.className = 'error';
    status.innerText = 'Error: ' + e;
    addLog('ERROR connecting to license server: ' + e, 'log-err');
  });
}

function playVideo(clearkeys) {
  document.getElementById('player').style.display = 'block';
  var video = document.querySelector('video');
  var protData = { "org.w3.clearkey": { "clearkeys": clearkeys } };
  var player = dashjs.MediaPlayer().create();
  player.initialize(video, './output_drm/stream.mpd', true);
  player.setProtectionData(protData);
  addLog('Player initialized with DRM protection', 'log-info');
  setInterval(function () {
    try {
      var streamInfo = player.getActiveStream().getStreamInfo();
      var dashMetrics = player.getDashMetrics();
      var dashAdapter = player.getDashAdapter();
      if (dashMetrics && streamInfo) {
        var repSwitch = dashMetrics.getCurrentRepresentationSwitch('video', true);
        var bufferLevel = dashMetrics.getCurrentBufferLevel('video', true);
        var bitrate = repSwitch ? Math.round(dashAdapter.getBandwidthForRepresentation(repSwitch.to, streamInfo.index) / 1000) : 0;
        document.getElementById('buffer').innerText = bufferLevel;
        document.getElementById('bitrate').innerText = bitrate;
        document.getElementById('representation').innerText = repSwitch ? repSwitch.to : '-';
      }
    } catch(e) {}
  }, 500);
}
