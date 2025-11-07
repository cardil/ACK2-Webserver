<script lang="ts">
  import { onMount } from 'svelte';
  import Webcam from '$lib/components/Webcam.svelte';
  import PrinterStats from '$lib/components/PrinterStats.svelte';
  import PrinterControls from '$lib/components/PrinterControls.svelte';
  import PrintStatus from '$lib/components/PrintStatus.svelte';
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
    <PrintStatus {unleashedLink} />
    <PrintHistory />
  </div>
</div>

<style>
  .page-container {
    display: flex;
    flex-wrap: wrap;
    padding: 1rem;
    gap: 1rem;
    min-height: 100vh;
  }

  .main-content {
    flex: 3 1 70%; /* Flex-grow, flex-shrink, flex-basis */
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .sidebar {
    flex: 1 1 25%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  @media (max-width: 768px) {
    .main-content,
    .sidebar {
      flex-basis: 100%;
    }
  }
</style>



