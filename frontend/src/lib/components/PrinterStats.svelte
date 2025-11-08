<script lang="ts">
  import Card from '$lib/components/Card.svelte';
  import { formatDuration } from '$lib/utils/time';

  export let totalMemory: number;
  export let freeMemory: number;
  export let freeMemoryPercentage: number;
  export let cpuTotalUsage: number;
  export let cpuUserUsage: number;
  export let cpuSystemUsage: number;
  export let cpuIdle: number;
  export let printerModel: string;
  export let fwVersion: string;
  export let sshStatus: string;
  export let uptime: string;

  function parseUptime(uptimeString: string): number {
    if (!uptimeString) return 0;
    const parts = uptimeString.split(':').map(Number);
    if (parts.length === 3) {
      const [hours, minutes, seconds] = parts;
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  }
</script>

<Card>
  <div class="stats-grid">
    <div class="stat-item">
      <strong>Total Memory:</strong>
      <span>{totalMemory}MB</span>
    </div>
    <div class="stat-item">
      <strong>Free Memory:</strong>
      <span>{freeMemory}MB</span>
    </div>
    <div class="stat-item">
      <strong>Free Memory:</strong>
      <span>{freeMemoryPercentage}%</span>
    </div>
    <div class="stat-item">
      <strong>CPU Total Usage:</strong>
      <span>{cpuTotalUsage}%</span>
    </div>
    <div class="stat-item">
      <strong>CPU User Usage:</strong>
      <span>{cpuUserUsage}%</span>
    </div>
    <div class="stat-item">
      <strong>CPU System Usage:</strong>
      <span>{cpuSystemUsage}%</span>
    </div>
    <div class="stat-item">
      <strong>CPU Idle:</strong>
      <span>{cpuIdle}%</span>
    </div>
    <div class="stat-item">
      <strong>Model & Firmware:</strong>
      <span>{printerModel} <span class="divider">/</span> {fwVersion}</span>
    </div>
    <div class="stat-item">
      <strong>SSH Status:</strong>
      <span>{sshStatus}</span>
    </div>
    <div class="stat-item">
      <strong>Sytem Uptime:</strong>
      <span>{formatDuration(parseUptime(uptime))}</span>
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
  .divider {
    color: var(--accent-color);
    margin: 0 0.25rem;
  }
</style>
