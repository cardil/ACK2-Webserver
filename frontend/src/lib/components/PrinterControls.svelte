<script lang="ts">
  import ThermometerIcon from '$lib/components/icons/ThermometerIcon.svelte';
  import NozzleIcon from '$lib/components/icons/NozzleIcon.svelte';
  import StatusIcon from '$lib/components/icons/StatusIcon.svelte';
  import FilamentIcon from '$lib/components/icons/FilamentIcon.svelte';
  import ClockIcon from '$lib/components/icons/ClockIcon.svelte';
  import PauseIcon from '$lib/components/icons/PauseIcon.svelte';
  import StopIcon from '$lib/components/icons/StopIcon.svelte';
  import PlayIcon from '$lib/components/icons/PlayIcon.svelte';
  import Card from '$lib/components/Card.svelte';
  import EtaIcon from '$lib/components/icons/EtaIcon.svelte';
  import { printerStore } from '$lib/stores/printer';
  import { activePrinterIdStore } from '$lib/stores/activePrinterId';
  import PrinterSelector from './PrinterSelector.svelte';

import { webserverStore } from '$lib/stores/webserver';
  import { get } from 'svelte/store';

  let input: HTMLInputElement;

  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('printer_id', activePrinterId);

      const config = get(webserverStore);
      if (config?.mqtt_webui_url) {
        await fetch(`${config.mqtt_webui_url}/api/print`, {
          method: 'POST',
          body: formData,
        });
      }
    }
  }

  // Get the active printer from the store
  $: activePrinterId = $activePrinterIdStore;
  $: printer = $printerStore[activePrinterId ?? ''];

  $: isPrinting = ['printing', 'paused'].includes(printer?.state);
  $: nozzleTemp = printer?.nozzle_temp ?? '---';
  $: nozzleTarget = printer?.target_nozzle_temp ?? '---';
  $: bedTemp = printer?.hotbed_temp ?? '---';
  $: bedTarget = printer?.target_hotbed_temp ?? '---';
  $: status = printer?.state ?? 'offline';
  $: progress = printer?.print_job?.progress ?? 0;
  $: fileName = printer?.print_job?.filename ?? 'No file';
  $: filamentUsed = printer?.print_job?.supplies_usage
    ? `${printer.print_job.supplies_usage}m`
    : 'N/A';
  $: printTime = new Date((printer?.print_job?.print_time ?? 0) * 1000).toISOString().substr(11, 8);
  $: eta = new Date((printer?.print_job?.remaining_time ?? 0) * 1000)
    .toISOString()
    .substr(11, 8);
</script>

<Card>
  <input
    type="file"
    bind:this={input}
    on:change={handleFileSelect}
    style="display: none;"
    accept=".gcode"
  />
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
        <div class="label-container">
          <span class="label">Status</span>
          <PrinterSelector />
        </div>
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
      {#if printer?.state === 'printing'}
        <button on:click={() => printerStore.pausePrint(activePrinterId)}><PauseIcon /> Pause</button>
      {:else if printer?.state === 'paused'}
        <button on:click={() => printerStore.resumePrint(activePrinterId)}>
          <PlayIcon /> Resume</button
        >
      {/if}
      <button on:click={() => printerStore.stopPrint(activePrinterId)} class="danger"
        ><StopIcon /> Stop</button
      >
    </div>
  {:else}
    <div class="button-group idle">
      <button disabled={!activePrinterId} on:click={() => input.click()}>Upload & Print</button>
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

  .label-container {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
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
