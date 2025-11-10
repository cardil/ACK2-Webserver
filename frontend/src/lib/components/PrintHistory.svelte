<script lang="ts">
  import RefreshIcon from '$lib/components/icons/RefreshIcon.svelte';
  import Card from '$lib/components/Card.svelte';
  import { printerStore } from '$lib/stores/printer';
  import { activePrinterIdStore } from '$lib/stores/activePrinterId';
  import FileEntry from './FileEntry.svelte';

  // Get the active printer from the store
  $: activePrinterId = $activePrinterIdStore;
  $: printer = $printerStore[activePrinterId ?? ''];

  $: localFiles = printer?.files ?? [];
</script>

<Card>
  <div class="header">
    <button class="refresh-button" on:click={() => printerStore.refreshFiles(printer.id)} disabled={!activePrinterId}><RefreshIcon /> Refresh</button>
  </div>
  <div class="list-container">
    {#if localFiles.length > 0}
      {#each localFiles as file}
        <FileEntry {file} onReprint={() => printerStore.reprint(printer.id, file.name)} />
      {/each}
    {:else}
      <div class="empty-message">No files found</div>
    {/if}
  </div>
</Card>

<style>
  .list-container {
    overflow-y: auto;
    flex-grow: 1;
  }

  .header {
    display: flex;
    justify-content: flex-end;
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

  .empty-message {
    text-align: center;
    padding: 1rem;
  }
</style>
