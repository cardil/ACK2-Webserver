<script lang="ts">
  import { fileBrowserStore } from '$lib/stores/fileBrowser';
  import { onMount } from 'svelte';
  import Fa from 'svelte-fa';
  import { faFolder, faFolderOpen, faFile, faEye, faEyeSlash, faArrowUp, faDatabase } from '@fortawesome/free-solid-svg-icons';
  import { faClock } from '@fortawesome/free-regular-svg-icons';
  import InfoModal from './InfoModal.svelte';
  import { formatFileSize } from '$lib/utils/files';
  import { formatTimestamp } from '$lib/utils/time';
  import { time } from '$lib/stores/time';

  let isPreviewOpen = false;
  let previewContent = '';
  let previewTitle = '';

  onMount(() => {
    fileBrowserStore.fetchFiles();
  });

  function handleFileClick(file: { name: string; isDirectory: boolean }) {
    if (file.isDirectory) {
      fileBrowserStore.navigate(file.name);
    } else {
      downloadFile(file.name);
    }
  }

  async function downloadFile(fileName: string) {
    try {
      const currentPath = fileBrowserStore.getCurrentPath();
      const filePath = currentPath === '/'
        ? `/files/${fileName}`
        : `/files${currentPath}${fileName}`;
      const response = await fetch(filePath);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  }

  async function showPreview(fileName: string) {
    try {
      const currentPath = fileBrowserStore.getCurrentPath();
      const filePath = currentPath === '/'
        ? `/files/${fileName}`
        : `/files${currentPath}${fileName}`;
      const response = await fetch(filePath);
      if (response.ok) {
        previewContent = await response.text();
        previewTitle = fileName;
        isPreviewOpen = true;
      }
    } catch (error) {
      console.error('Error fetching file content:', error);
    }
  }

  const currentPathStore = fileBrowserStore.currentPath;
  $: displayPath = ($currentPathStore || '/files/').replace('/files', '') || '/';
  $: canGoUp = ($currentPathStore || '/files/').replace('/files/', '').replace(/^\/+|\/+$/g, '').length > 0;
</script>

<InfoModal
  isOpen={isPreviewOpen}
  title={previewTitle}
  message={previewContent}
  buttons={[{ label: 'Close', event: 'close' }]}
  on:close={() => (isPreviewOpen = false)}
/>

<div class="file-browser">
  <div class="path-bar">
    <span class="path-icon">
      <Fa icon={faFolderOpen} />
    </span>
    {#if displayPath === '/' || displayPath === ''}
      <span class="path-segment path-current">fs:</span>
    {:else}
      {@const pathParts = displayPath.split('/').filter((p: string) => p)}
      <button class="path-segment" on:click={() => fileBrowserStore.navigateToPath(-1)}>fs:</button>
      {#each pathParts as part, i}
        <span class="path-separator">/</span>
        {#if i < pathParts.length - 1}
          <button class="path-segment" on:click={() => fileBrowserStore.navigateToPath(i)}>{part}</button>
        {:else}
          <span class="path-segment path-current">{part}</span>
        {/if}
      {/each}
    {/if}
  </div>
  <ul class="file-list">
    {#if canGoUp}
      <div class="file-item">
        <button class="directory-btn go-up-btn" on:click={() => fileBrowserStore.goUp()}>
          <span class="file-icon">
            <Fa icon={faArrowUp} />
          </span>
          <span class="file-name">..</span>
        </button>
      </div>
    {/if}
    {#each $fileBrowserStore as file}
      <div class="file-item">
        {#if file.isDirectory}
          <button class="directory-btn" on:click={() => handleFileClick(file)}>
            <span class="file-icon">
              <Fa icon={faFolder} />
            </span>
            <div class="file-details">
              <span class="file-name" title={file.name}>{file.name}</span>
              <div class="file-meta"></div>
            </div>
          </button>
        {:else}
          <div
            class="file-entry"
            role="button"
            tabindex="0"
            on:click={() => handleFileClick(file)}
            on:keydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleFileClick(file);
              }
            }}
          >
            <span class="file-icon">
              <Fa icon={faFile} />
            </span>
            <div class="file-details">
              <span class="file-name" title={file.name}>{file.name}</span>
              {#if file.size !== undefined || file.mtime !== undefined}
                <div class="file-meta">
                  {#if file.size !== undefined}
                    <div class="meta-item" title="File size: {formatFileSize(file.size)}">
                      <Fa icon={faDatabase} />
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                  {/if}
                  {#if file.mtime !== undefined}
                    {@const timeAgo = formatTimestamp(file.mtime, $time / 1000)}
                    <div class="meta-item" title="Modified: {timeAgo}">
                      <Fa icon={faClock} />
                      <span>{timeAgo}</span>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
            {#if file.size !== undefined && file.size < 100 * 1024}
              <button class="preview-btn" on:click|stopPropagation={() => showPreview(file.name)} title="Preview file">
                <Fa icon={faEye} />
              </button>
            {:else}
              <button class="preview-btn preview-btn-disabled" disabled title="Too large to show in preview window">
                <Fa icon={faEyeSlash} />
              </button>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </ul>
</div>

<style>
  .file-browser {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }

  .path-bar {
    padding: 0 0.5rem;
    background-color: var(--input-bg-color);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 0.25rem;
    white-space: nowrap;
    overflow-x: auto;
    min-height: calc(0.5rem * 2 + 1em + 0.2rem + 1.2em);
  }

  .path-icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    padding: 0.25rem;
  }

  .file-list {
    list-style: none;
    padding: 0;
    margin: 0;
    flex-grow: 1;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
  }

  .file-item {
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
  }

  .file-item:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  :global(body[data-theme="dark"]) .file-item:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .directory-btn,
  .file-entry {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    width: 100%;
    background: none;
    border: none;
    color: var(--text-color);
    cursor: pointer;
    text-align: left;
    gap: 0.5rem;
    justify-content: flex-start;
  }

  .directory-btn:hover {
    background-color: var(--input-bg-color);
  }

  .go-up-btn {
    font-weight: 600;
  }

  .file-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    font-size: 1.25em;
    flex-shrink: 0;
  }

  .file-details {
    flex-grow: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .file-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: bold;
    flex-grow: 1;
    min-width: 0;
    text-align: left;
  }

  .directory-btn .file-name {
    flex-grow: 1;
    min-width: 0;
    padding-top: calc((0.2rem + 1.2em) / 2);
    padding-bottom: calc((0.2rem + 1.2em) / 2);
  }

  .file-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.8em;
    opacity: 0.8;
    margin-top: 0.2rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .preview-btn {
    background: none;
    border: none;
    color: var(--text-color);
    cursor: pointer;
    flex-shrink: 0;
  }

  .preview-btn-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .path-segment {
    color: var(--accent-color);
    padding: 0.5rem 0.5rem;
    margin: 0 0.125rem;
    font-size: 1em;
    white-space: nowrap;
    border-radius: 6px;
    font-weight: bold;
    transition: background-color 0.2s;
  }

  .path-separator {
    /* use the text-color with 50% opacity */
    color: color-mix(in srgb, var(--text-color) 50%, transparent);
    padding: 0.5rem 0.125rem;
    font-size: 1em;
    white-space: nowrap;
    opacity: 0.6;
  }

  button.path-segment {
    background: none;
    border: none;
    cursor: pointer;
  }

  button.path-segment:hover {
    background-color: rgba(0, 0, 0, 0.1);
    text-decoration: underline;
  }

  :global(body[data-theme="dark"]) button.path-segment:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .path-current {
    color: var(--text-color);
    font-weight: bold;
  }
</style>
