<script lang="ts">
  import ThermometerIcon from '$lib/components/icons/ThermometerIcon.svelte';
  import NozzleIcon from '$lib/components/icons/NozzleIcon.svelte';
  import StatusIcon from '$lib/components/icons/StatusIcon.svelte';
  import FilamentIcon from '$lib/components/icons/FilamentIcon.svelte';
  import ClockIcon from '$lib/components/icons/ClockIcon.svelte';
  import PauseIcon from '$lib/components/icons/PauseIcon.svelte';
  import StopIcon from '$lib/components/icons/StopIcon.svelte';
  import Card from '$lib/components/Card.svelte';
  import EtaIcon from '$lib/components/icons/EtaIcon.svelte';

  // --- Static Placeholder Data ---
  let isPrinting = true; // Set to `false` to see the "idle" state
  let nozzleTemp = 210;
  let nozzleTarget = 210;
  let bedTemp = 60;
  let bedTarget = 60;
  let status = "Printing"; // "Idle", "Preheating", "Offline"
  let progress = 68; // 0-100
  let fileName = "a_very_long_filename_that_should_be_truncated_because_it_is_way_too_long.gcode";
  let filamentUsed = "15.2m";
  let printTime = "01:23:45"; // Elapsed time
  // --- End Placeholder Data ---

  $: eta = (() => {
    if (!isPrinting || progress === 0) return 'N/A';
    
    const timeParts = printTime.split(':').map(Number);
    const elapsedTimeInSeconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
    
    const totalTimeInSeconds = (elapsedTimeInSeconds / progress) * 100;
    const remainingTimeInSeconds = totalTimeInSeconds - elapsedTimeInSeconds;

    if (remainingTimeInSeconds <= 0) return 'Done';
    
    const hours = Math.floor(remainingTimeInSeconds / 3600);
    const minutes = Math.floor((remainingTimeInSeconds % 3600) / 60);
    const seconds = Math.floor(remainingTimeInSeconds % 60);
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  })();

</script>

<Card>
  <div class="status-row">
    <div class="status-item">
      <NozzleIcon />
      <div class="text">
        <span class="label">Nozzle</span>
        <span class="value">{nozzleTemp}° / {nozzleTarget}°</span>
      </div>
    </div>
    <div class="status-item">
      <ThermometerIcon />
      <div class="text">
        <span class="label">Bed</span>
        <span class="value">{bedTemp}° / {bedTarget}°</span>
      </div>
    </div>
    <div class="status-item">
      <StatusIcon />
      <div class="text">
        <span class="label">Status</span>
        <span class="value">{status}</span>
      </div>
    </div>
  </div>

  {#if isPrinting}
    <div class="progress-container">
      <div class="progress-bar-container">
        <div class="progress-bar" style="width: {progress}%"></div>
      </div>
      <span class="progress-percent">{progress}%</span>
    </div>

    <div class="file-name">{fileName}</div>

    <div class="print-info-grid">
      <div class="info-item" title="Filament Used">
        <FilamentIcon />
        <span>{filamentUsed}</span>
      </div>
      <div class="info-item" title="Print Time">
        <ClockIcon />
        <span>{printTime}</span>
      </div>
      <div class="info-item" title="ETA">
        <EtaIcon />
        <span>{eta}</span>
      </div>
    </div>

    <div class="button-group">
      <button><PauseIcon /> Pause</button>
      <button class="danger"><StopIcon /> Stop</button>
    </div>
  {:else}
    <div class="button-group idle">
      <button>Upload & Print</button>
    </div>
  {/if}
</Card>

<style>

  .status-row {
    display: flex;
    justify-content: space-around;
    gap: 1rem;
  }
  .status-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .status-item .text {
    display: flex;
    flex-direction: column;
  }
  .label {
    font-size: 0.8em;
    opacity: 0.8;
  }
  .value {
    font-weight: bold;
  }

  .progress-container {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .progress-bar-container {
    flex-grow: 1;
    height: 10px;
    background-color: var(--card-border-color);
    border-radius: 5px;
    overflow: hidden;
  }
  .progress-bar {
    height: 100%;
    background-color: var(--accent-color);
    border-radius: 5px;
  }

  .progress-percent {
    font-weight: bold;
  }

  .file-name {
    text-align: center;
    font-weight: bold;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0.5rem 0;
    max-width: 100%;
  }

  .print-info-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    align-items: center;
    gap: 1rem;
    font-size: 0.9em;
  }
  .info-item {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .button-group {
    display: flex;
    gap: 1rem;
  }
  .button-group.idle {
    justify-content: center;
  }
  button {
    flex-grow: 1;
    padding: 0.75rem;
    border: none;
    border-radius: 5px;
    background-color: var(--accent-color);
    color: white;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  button.danger {
    background-color: #dc3545;
  }
</style>
