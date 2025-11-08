<script lang="ts">
  import { onMount } from 'svelte';
  import Webcam from '$lib/components/Webcam.svelte';
  import PrinterStats from '$lib/components/PrinterStats.svelte';
  import PrinterControls from '$lib/components/PrinterControls.svelte';
  import PrintHistory from '$lib/components/PrintHistory.svelte';

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

<div class="page-container">
  <div class="main-content">
    <Webcam />
    <PrinterStats
      {totalMemory}
      {freeMemory}
      {freeMemoryPercentage}
      {cpuTotalUsage}
      {cpuUserUsage}
      {cpuSystemUsage}
      {cpuIdle}
      {printerModel}
      {fwVersion}
      {sshStatus}
      {uptime}
    />
  </div>
  <div class="sidebar">
    <PrinterControls />

    <PrintHistory />
  </div>
</div>

<style>
  .page-container {
    display: grid;
    grid-template-columns: 3fr 2fr; /* Change to 60% / 40% split */
    grid-template-rows: 1fr; /* Make the rows fill the container height */
    padding: 1rem;
    gap: 1rem;
    height: 100%;
  }

  .main-content {
    display: grid;
    grid-template-rows: 1fr auto; /* Webcam gets remaining space, stats get auto height */
    gap: 1rem;
    overflow: hidden; /* Prevent the container from overflowing its parent */
    min-height: 0; /* CRITICAL: Allows this grid item to shrink */
  }

  .sidebar {
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 1rem;
    min-height: 0;
  }

  @media (max-width: 768px) {
    .page-container {
      grid-template-columns: 1fr; /* Stack into a single column on mobile */
      height: auto; /* Allow content to scroll naturally on mobile */
    }
  }
</style>



