document.addEventListener("DOMContentLoaded", function () {
  init();
});

function init() {
  const protData = {
    "org.w3.clearkey": {
      "clearkeys": {
        "oW5AK5BW43HzbTSKpiu3SQ": "hyN9IKGfWKdAwFaE5pm0qg"
      }
    }
  };

  const mpd_url = "./output_drm/stream.mpd";
  const video = document.querySelector("video");
  const player = dashjs.MediaPlayer().create(); // Player is initialized using dashjs library

  player.setProtectionData(protData);
  player.initialize(video, mpd_url, true);

  let timeCounter = 0;

  const metricsData = { // Data for Chart.js, bitrate and buffer
    labels: [],
    datasets: [
      {
        label: "Bitrate (kbps)",
        data: [],
        borderColor: "blue",
        backgroundColor: "rgba(0, 0, 255, 0.15)",
        tension: 0.2,
        fill: false,
        yAxisID: "y"
      },
      {
        label: "Buffer (s)",
        data: [],
        borderColor: "green",
        backgroundColor: "rgba(0, 128, 0, 0.15)",
        tension: 0.2,
        fill: false,
        yAxisID: "y1"
      }
    ]
  };

  const metricsChart = new Chart(document.getElementById("metricsChart"), { // Metric chart initialization using metricsData
    type: "line",
    data: metricsData,
    options: {
      responsive: true,
      animation: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      stacked: false,
      scales: { // One shared x-axis for time and two y-axes for bitrate and buffer
        x: {
          title: {
            display: true,
            text: "Time (s)"
          }
        },
        y: {
          type: "linear",
          display: true,
          position: "left",
          beginAtZero: true,
          title: {
            display: true,
            text: "Bitrate (kbps)"
          }
        },
        y1: {
          type: "linear",
          display: true,
          position: "right",
          beginAtZero: true,
          title: {
            display: true,
            text: "Buffer (s)"
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  });

  player.on(dashjs.MediaPlayer.events.PLAYBACK_ENDED, function () {
    clearInterval(eventPoller);
  });

  const eventPoller = setInterval(function () { // Set interval to poll metrics every second and update the chart and display values
    const activeStream = player.getActiveStream();
    if (!activeStream) return;

    const streamInfo = activeStream.getStreamInfo();
    const dashMetrics = player.getDashMetrics();
    const dashAdapter = player.getDashAdapter();

    if (dashMetrics && streamInfo) {
      const periodIdx = streamInfo.index;
      const repSwitch = dashMetrics.getCurrentRepresentationSwitch("video", true);
      const bufferLevel = dashMetrics.getCurrentBufferLevel("video", true);
      const bitrate = repSwitch
        ? Math.round(dashAdapter.getBandwidthForRepresentation(repSwitch.to, periodIdx) / 1000)
        : NaN;

      document.getElementById("buffer").innerText =
        (bufferLevel !== null && !isNaN(bufferLevel)) ? bufferLevel.toFixed(2) : "N/A";

      document.getElementById("bitrate").innerText =
        !isNaN(bitrate) ? bitrate : "N/A";

      document.getElementById("representation").innerText =
        repSwitch ? repSwitch.to : "N/A";

      metricsData.labels.push(timeCounter.toString());
      metricsData.datasets[0].data.push(!isNaN(bitrate) ? bitrate : null);
      metricsData.datasets[1].data.push(
        (bufferLevel !== null && !isNaN(bufferLevel)) ? Number(bufferLevel.toFixed(2)) : null
      );

      metricsChart.update();
      timeCounter++;
    }
  }, 1000); // 1000 ms equals 1 second
}
