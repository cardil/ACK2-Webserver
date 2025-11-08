<script lang="ts">
  import RefreshIcon from '$lib/components/icons/RefreshIcon.svelte';
  import ReprintIcon from '$lib/components/icons/ReprintIcon.svelte';
  import Card from '$lib/components/Card.svelte';
  import { printerStore } from '$lib/stores/printer';
  import { activePrinterIdStore } from '$lib/stores/activePrinterId';

  // Get the active printer from the store
  $: activePrinterId = $activePrinterIdStore;
  $: printer = $printerStore[activePrinterId ?? ''];

  $: localFiles = printer?.files ?? [];

  function formatPrintTime(seconds: number): string {
    if (seconds < 0) return 'N/A';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    let timeString = '';
    if (h > 0) timeString += `${h}h `;
    if (m > 0) timeString += `${m}m `;
    if (s > 0 || timeString === '') timeString += `${s}s`;

    return timeString.trim();
  }
</script>

<Card>
  <div class="header">
    <button class="refresh-button" on:click={() => printerStore.refreshFiles(printer.id)} disabled={!activePrinterId}><RefreshIcon /> Refresh</button>
  </div>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>File</th>
          <th>Print Time</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {#if localFiles.length > 0}
          {#each localFiles as file}
            <tr>
              <td>{file.name}</td>
              <td>{formatPrintTime(file.timestamp)}</td>
              <td>
                <button
                  class="icon-button action-button"
                  title="Re-print"
                  on:click={() => printerStore.reprint(printer.id, file.name)}
                >
                  <ReprintIcon style="transform: scale(0.7);" />
                </button>
              </td>
            </tr>
          {/each}
        {:else}
          <tr>
            <td colspan="3" style="text-align: center;">No files found</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
</Card>

<style>

  .table-container {
    overflow-y: auto;
    flex-grow: 1;
  }

  .header {
    display: flex;
    justify-content: flex-end;
  }

  .icon-button {
    background: none;
    border: none;
    color: var(--text-color);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 5px;
  }
  .icon-button:hover {
    background-color: var(--card-border-color);
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 5px;
    background-color: var(--accent-color);
    color: white;
    font-weight: bold;
    cursor: pointer;
  }
  
  .refresh-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9em;
  }

  th, td {
    padding: 0.5rem;
    text-align: left;
    border-bottom: 1px solid var(--card-border-color);
  }

  th {
    opacity: 0.8;
  }

  td .action-button {
    padding: 0.25rem 0.5rem;
    font-size: 0.8em;
  }
</style>
