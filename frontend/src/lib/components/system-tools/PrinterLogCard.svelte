<script lang="ts">
  import Card from '$lib/components/Card.svelte';
  import { logStore } from '$lib/stores/log';
  import {
    faFileLines,
    faSync,
    faTimes,
  } from '@fortawesome/free-solid-svg-icons';
  import Fa from 'svelte-fa';
  import { onMount } from 'svelte';
  import './system-tools.css';

  export let onShowConfirmationModal: (action: 'clearLog') => void;

  onMount(() => {
    logStore.fetchLog();
  });
</script>

<Card>
  <svelte:fragment slot="title">
    <h3 class="card-title"><Fa icon={faFileLines} /> Printer Log</h3>
  </svelte:fragment>
  <div class="tool-section log-container">
    <div class="log-content">
      {#each $logStore as entry}
        <div class="log-line" class:error={entry.line.toLowerCase().includes('error')}>{entry.line}{#if entry.count > 1}<span class="log-count">x{entry.count}</span>{/if}</div>
      {/each}
    </div>
    <div class="fab-container">
      <button class="fab" on:click={logStore.fetchLog}><Fa icon={faSync} /></button>
      <button class="fab danger" on:click={() => onShowConfirmationModal('clearLog')}><Fa icon={faTimes} /></button>
    </div>
  </div>
</Card>
<style>
  /* Styles imported from system-tools.css */

  .log-container {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0;
    min-width: 0;
    min-height: 0;
  }

  .log-content {
    flex-grow: 1;
    overflow: auto;
    overflow-x: auto;
    overflow-y: auto;
    background-color: var(--input-bg-color);
    padding: 0;
    margin: 0;
    border-radius: 5px;
    font-family: monospace;
    font-size: 0.9em;
    min-width: 0;
    min-height: 0;
  }

  .log-line {
    white-space: pre;
    word-break: normal;
    overflow-wrap: normal;
    padding: 0.25rem 0.5rem;
  }

  .log-line:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  .log-line.error {
    background-color: rgba(220, 53, 69, 0.1);
    color: #dc3545;
    font-weight: bold;
  }

  .log-line.error:hover {
    background-color: rgba(220, 53, 69, 0.25);
  }

  .log-count {
    display: inline;
    color: #007bff;
    font-size: 0.85em;
    margin-left: 0.5rem;
  }

  /* Dark mode styles */
  :global(body[data-theme="dark"]) .log-line:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  :global(body[data-theme="dark"]) .log-line.error:hover {
    background-color: rgba(220, 53, 69, 0.3);
  }

  :global(body[data-theme="dark"]) .log-count {
    color: #ffc107;
  }

  .fab-container {
    position: absolute;
    bottom: 1.5rem;
    right: 1.5rem;
    display: flex;
    gap: 0.5rem;
  }

  .fab {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    padding: 0;
    border-radius: 50%;
    border: none;
    background-color: var(--accent-color);
    color: white;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    cursor: pointer;
  }

  .fab.danger {
    background-color: #dc3545;
  }
</style>

