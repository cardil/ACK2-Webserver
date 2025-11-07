<script lang="ts">
  import { onMount } from 'svelte';

  let printerModel = '';
  let fwVersion = '';
  let unleashedLink = '#';
  let totalMemory = 0;
  let freeMemory = 0;
  let freeMemoryPercentage = 0;
  let cpuTotalUsage = 0;
  let cpuUserUsage = 0;
  let cpuSystemUsage = 0;
  let cpuIdle = 0;
  let sshStatus = '';
  let uptime = '';
  let webcamActive = false;
  let webcamSrc = '/webcam/default.jpg';

  function toggleWebcam() {
    webcamActive = !webcamActive;
    if (webcamActive) {
      webcamSrc = '/webcam';
    } else {
      webcamSrc = '/webcam/default.jpg';
    }
  }

  onMount(() => {
    fetch('/api/webserver.json')
      .then((response) => response.json())
      .then((data) => {
        printerModel = data.printer_model;
        fwVersion = data.update_version;
        unleashedLink = data.mqtt_webui_url;
      })
      .catch((error) => console.error('Error fetching webserver data:', error));

    function fetchData() {
      fetch('/api/info.json')
        .then((response) => response.json())
        .then((data) => {
          totalMemory = Math.round(data.total_mem / 1024 / 1024);
          freeMemory = Math.round(data.free_mem / 1024 / 1024);
          freeMemoryPercentage = data.free_mem_per;
          cpuTotalUsage = data.cpu_use;
          cpuUserUsage = data.cpu_usr_use;
          cpuSystemUsage = data.cpu_sys_use;
          cpuIdle = data.cpu_idle;
          sshStatus =
            data.ssh_status == 2
              ? 'Started'
              : data.ssh_status == 1
              ? 'Stopped'
              : 'N/A';
          uptime = data.uptime;
        })
        .catch((error) => console.error('Error fetching info data:', error));
    }

    fetchData();
    const interval = setInterval(fetchData, 1000);

    return () => {
      clearInterval(interval);
    };
  });
</script>

<div class="container">
  <div class="main-content">
    <div class="webcam-container">
      <img src={webcamSrc} alt="Webcam" />
      <button class="toggle-button" on:click={toggleWebcam}
        >Toggle Webcam</button
      >
    </div>
    <div class="printer-stats-container">
      <h2>Printer Stats</h2>
      <table>
        <tbody>
          <tr>
            <td><strong>Total Memory:</strong></td>
            <td>{totalMemory}MB</td>
          </tr>
          <tr>
            <td><strong>Free Memory:</strong></td>
            <td>{freeMemory}MB</td>
          </tr>
          <tr>
            <td><strong>Free Memory:</strong></td>
            <td>{freeMemoryPercentage}%</td>
          </tr>
          <tr>
            <td><strong>CPU Total Usage:</strong></td>
            <td>{cpuTotalUsage}%</td>
          </tr>
          <tr>
            <td><strong>CPU User Usage:</strong></td>
            <td>{cpuUserUsage}%</td>
          </tr>
          <tr>
            <td><strong>CPU System Usage:</strong></td>
            <td>{cpuSystemUsage}%</td>
          </tr>
          <tr>
            <td><strong>CPU Idle:</strong></td>
            <td>{cpuIdle}%</td>
          </tr>
          <tr>
            <td><strong>Model:</strong></td>
            <td>{printerModel}</td>
          </tr>
          <tr>
            <td><strong>Firmware version:</strong></td>
            <td>{fwVersion}</td>
          </tr>
          <tr>
            <td><strong>SSH Status:</strong></td>
            <td>{sshStatus}</td>
          </tr>
          <tr>
            <td><strong>Sytem Uptime:</strong></td>
            <td>{uptime}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="sidebar">
    <div class="printer-controls-container">
      <h2>Printer Controls</h2>
      <!-- Printer controls will be displayed here -->
    </div>
    <div class="print-status-container">
      <h2><a href={unleashedLink}>Kobra Unleashed</a></h2>
      <!-- Print status will be displayed here -->
    </div>
    <div class="print-history-container">
      <h2>Print History</h2>
      <!-- Print history will be displayed here -->
    </div>
  </div>
</div>

<style>
  .container {
    display: flex;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  .main-content {
    flex: 3;
    margin-right: 20px;
  }
  .sidebar {
    flex: 1;
  }
  .webcam-container {
    margin-bottom: 20px;
  }
  .webcam-container img {
    width: 100%;
    height: auto;
  }
</style>

