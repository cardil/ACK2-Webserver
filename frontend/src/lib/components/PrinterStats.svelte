<script lang="ts">
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
</script>

<div class="card printer-stats-container">
  <h2>Printer Stats</h2>
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
      <span>{uptime}</span>
    </div>
  </div>
</div>

<style>
  .card {
    background-color: var(--card-background-color);
    border: 1px solid var(--card-border-color);
    border-radius: 8px;
    padding: 1rem;
    transition: background-color 0.2s, border-color 0.2s;
  }
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
