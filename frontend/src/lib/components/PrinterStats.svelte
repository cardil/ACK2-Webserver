<script lang="ts">
  import Card from '$lib/components/Card.svelte';
  import { formatDuration } from '$lib/utils/time';

  export let totalMemory: number;
  export let freeMemory: number;
  export let freeMemoryPercentage: number;
  export let cpuTotalUsage: number;
  export let cpuUserUsage: number;
  export let cpuSystemUsage: number;
  export let printerModel: string;
  export let fwVersion: string;
  export let sshStatus: string;
  export let uptime: string;

  $: memoryValue = `${100 - freeMemoryPercentage}% of ${totalMemory} MB`;
  $: memoryTitle = `Free memory: ${freeMemoryPercentage}%; ${freeMemory} MB of ${totalMemory} MB`;
  $: cpuValue = `${cpuTotalUsage}%`;
  $: cpuTitle = `Used CPU: ${cpuTotalUsage}%; User: ${cpuUserUsage}%; System: ${cpuSystemUsage}%`;

$: uptimeInSeconds = parseUptime(uptime);

  function parseUptime(uptimeString: string): number {
    if (!uptimeString || typeof uptimeString !== 'string') return 0;
    const parts = uptimeString.split(':').map(Number);
    if (parts.length === 3 && parts.every(p => !isNaN(p))) {
      const [hours, minutes, seconds] = parts;
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  }
</script>

<Card>
  <div class="stats-grid">
    <div class="stat-item">
      <span class="label" title="Used memory">Memory</span>
      <span class="value" title={memoryTitle}>{memoryValue}</span>
    </div>
    <div class="stat-item">
      <span class="label" title="Used CPU">CPU</span>
      <span class="value" title={cpuTitle}>{cpuValue}</span>
    </div>
    <div class="stat-item">
      <span class="label">Model & Firmware</span>
      <span class="value">{printerModel} <span class="divider">/</span> {fwVersion}</span>
    </div>
    <div class="stat-item">
      <span class="label">SSH Status</span>
      <span class="value">{sshStatus}</span>
    </div>
    <div class="stat-item">
      <span class="label">Sytem Uptime</span>
      <span class="value">{formatDuration(uptimeInSeconds)}</span>
    </div>
  </div>
</Card>

<style>
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }
  .stat-item {
    display: flex;
    flex-direction: column;
  }
  .label {
    font-size: 0.8em;
    opacity: 0.8;
  }
  .value {
    font-weight: bold;
    font-variant-numeric: tabular-nums;
  }
  .divider {
    color: var(--accent-color);
    margin: 0 0.25rem;
  }
</style>
