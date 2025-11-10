<script lang="ts">
  import ReprintIcon from '$lib/components/icons/ReprintIcon.svelte';
  import ClockIcon from '$lib/components/icons/ClockIcon.svelte';
  import { formatDuration } from '$lib/utils/time';

  export let file: { name: string; timestamp: number };
  export let onReprint: () => void;

  $: duration = formatDuration(file.timestamp);
</script>

<div class="file-entry">
  <button class="icon-button" title="Re-print" on:click={onReprint}>
    <ReprintIcon style="width: 1.5em; height: 1.5em;" />
  </button>
  <div class="file-details">
    <div class="filename" title={file.name}>{file.name}</div>
    <div class="print-time" title="Print time: {duration}">
      <ClockIcon style="width: 0.9em; height: 0.9em;" />
      <span>{duration}</span>
    </div>
  </div>
</div>

<style>
  .file-entry {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
    border-bottom: 1px solid var(--card-border-color);
  }

  .icon-button {
    background: none;
    border: none;
    color: var(--text-color);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 5px;
    flex-shrink: 0;
  }
  .icon-button:hover {
    background-color: var(--card-border-color);
  }

  .file-details {
    flex-grow: 1;
    min-width: 0; /*  Allow shrinking */
  }

  .filename {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: bold;
  }

  .print-time {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.8em;
    opacity: 0.8;
    margin-top: 0.2rem;
  }
</style>
