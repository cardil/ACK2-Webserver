<script lang="ts">
  import Card from '$lib/components/Card.svelte';
  import BedMeshVisualizer from '$lib/components/BedMeshVisualizer.svelte';
  import BedMeshDataTable from '$lib/components/BedMeshDataTable.svelte';
  import SaveMeshModal from '$lib/components/SaveMeshModal.svelte';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import {
    faCogs,
    faTh,
    faSave,
    faEye,
    faCheckCircle,
    faTrash,
    faFileMedical,
    faHdd
  } from '@fortawesome/free-solid-svg-icons';
  import { levelingStore } from '$lib/stores/leveling';
  import type { MeshProfile } from '$lib/stores/leveling';

  // --- Component State ---
  let visualizedMeshData: number[][] = [];
  let visualizedSlotId: number | string | null = null;
  let activeSlotId: number | string | null = null; // This will track which saved slot is currently active on the printer
  let isSaveModalOpen = false;
  let localSettings = {
    gridSize: 5,
    bedTemp: 60,
    precision: 0.01
  };

  // --- Store Subscription ---
  levelingStore.subscribe((store) => {
    if (store.settings) {
      localSettings = { ...store.settings };
    }
    // Initialize visualized data with the active mesh from the store
    if (store.activeMesh && visualizedSlotId === null) {
      visualizedMeshData = store.activeMesh.data;
      visualizedSlotId = 'active';
    }
  });

  // Reactive block to handle cases where the visualized mesh is deleted from the store
  $: if (
    $levelingStore.activeMesh &&
    visualizedSlotId &&
    visualizedSlotId !== 'active' &&
    visualizedSlotId !== 'average' &&
    !$levelingStore.savedMeshes.find((s) => s.id === visualizedSlotId)
  ) {
    visualizeSlot($levelingStore.activeMesh);
  }


  // --- UI Functions ---

  function visualizeSlot(slot: MeshProfile) {
    if (slot) {
      visualizedMeshData = slot.data;
      visualizedSlotId = slot.id;
    }
  }

  function activateSlot(slotToActivate: MeshProfile) {
    if (typeof slotToActivate.id === 'number') {
      levelingStore.activateSlot(slotToActivate.id);
    } else if (slotToActivate.id === 'average') {
      levelingStore.activateAverageMesh();
    }
  }

  function handleSaveMesh(event: CustomEvent<{ slot: number }>) {
    levelingStore.saveActiveMesh(event.detail.slot);
    isSaveModalOpen = false;
  }

  function deleteSlot(slotId: number) {
    if (confirm(`Are you sure you want to delete slot ${slotId}?`)) {
      levelingStore.deleteSlot(slotId);
    }
  }

  function deleteAllSlots() {
    if (confirm('Are you sure you want to delete ALL saved mesh profiles? This cannot be undone.')) {
      levelingStore.deleteAllSlots();
    }
  }
</script>

{#if $levelingStore.isLoading}
  <div class="loading-container">Loading...</div>
{:else if $levelingStore.error}
  <div class="error-container">Error: {$levelingStore.error}</div>
{:else}
<div class="page-container">
  <div class="column">
    <div class="column-group">
      <!-- Leveling Settings Card -->
      <Card>
        <div class="tool-section">
          <h3 class="card-title">
            <FontAwesomeIcon icon={faCogs} /> Leveling Settings
          </h3>
          <div class="settings-form">
            <div class="form-group">
              <label for="grid">Grid Size</label>
              <input type="number" id="grid" bind:value={localSettings.gridSize} min="2" max="10" />
            </div>
            <div class="form-group">
              <label for="bed_temp">Bed Temp (°C)</label>
              <input type="number" id="bed_temp" bind:value={localSettings.bedTemp} min="0" max="90" />
            </div>
            <div class="form-group">
              <label for="precision">Probe Precision</label>
              <input type="number" id="precision" bind:value={localSettings.precision} step="0.001" />
            </div>
            <div class="form-group button-group">
              <button class="primary" on:click={() => levelingStore.saveSettings(localSettings)}><FontAwesomeIcon icon={faSave} /> Save</button>
            </div>
          </div>
          <p class="disclaimer">
            Note: Saving these settings requires a printer reboot to take effect.
          </p>
        </div>
    </Card>

      <!-- Bed Mesh Card -->
      <Card>
        <div class="tool-section">
          <h3 class="card-title"><FontAwesomeIcon icon={faTh} /> Bed Mesh</h3>
          <div class="mesh-list">
            {#if $levelingStore.activeMesh}
              <div class="mesh-item" class:active={visualizedSlotId === 'active'}>
                <span>Active (Z-Offset: {$levelingStore.activeMesh.zOffset})</span>
                <div class="button-group">
                  <button class="small primary" on:click={() => (isSaveModalOpen = true)}>
                    <FontAwesomeIcon icon={faSave} /> Save
                  </button>
                  <button
                    class="small"
                    on:click={() => $levelingStore.activeMesh && visualizeSlot($levelingStore.activeMesh)}
                    disabled={visualizedSlotId === 'active'}
                  >
                    <FontAwesomeIcon icon={faEye} />
                    Visualize
                  </button>
                </div>
              </div>
            {/if}

            <!-- Average Mesh Special Slot -->
            {#if $levelingStore.averageMesh}
              <div class="mesh-item" class:active={visualizedSlotId === 'average'}>
                <span class="slot-name">
                  Average
                  {#if activeSlotId === 'average'}
                    <span class="active-label">active</span>
                  {/if}
                </span>
                <div class="button-group">
                  <button
                    class="small"
                    on:click={() => levelingStore.activateAverageMesh()}
                    disabled={activeSlotId === 'average'}><FontAwesomeIcon icon={faCheckCircle} /> Activate</button
                  >
                  <button
                    class="small"
                    on:click={() => $levelingStore.averageMesh && visualizeSlot($levelingStore.averageMesh)}
                    disabled={visualizedSlotId === 'average'}
                    ><FontAwesomeIcon icon={faEye} />
                    Visualize
                  </button>
                </div>
              </div>
            {/if}
          </div>
        </div>
    </Card>
    </div>

    <!-- Saved Bed Meshes Card -->
    <Card style="flex-grow: 1; min-height: 0;">
      <div class="tool-section">
        <h3 class="card-title"><FontAwesomeIcon icon={faHdd} /> Saved Bed Meshes</h3>
        <div class="mesh-list">
          {#each $levelingStore.savedMeshes as slot (slot.id)}
            <div class="mesh-item" class:active={slot.id === visualizedSlotId}>
              <span class="slot-name">
                {slot.name}
                {#if slot.id === activeSlotId}
                  <span class="active-label">active</span>
                {/if}
              </span>
              <div class="button-group">
                <button
                  class="small"
                  on:click={() => activateSlot(slot)}
                  disabled={slot.id === activeSlotId}><FontAwesomeIcon icon={faCheckCircle} /> Activate</button
                >
                <button
                  class="small"
                  on:click={() => visualizeSlot(slot)}
                  disabled={slot.id === visualizedSlotId}
                >
                  <FontAwesomeIcon icon={faEye} />
                  Visualize
                </button>
                  <button class="small danger" on:click={() => {
                    if (typeof slot.id === 'number') {
                      deleteSlot(slot.id);
                    }
                  }}
                    ><FontAwesomeIcon icon={faTrash} /> Delete</button
                  >
              </div>
            </div>
          {/each}
        </div>
        <div class="button-group spaced">
          <button class="danger" on:click={deleteAllSlots}><FontAwesomeIcon icon={faTrash} /> Delete all</button>
        </div>
      </div>
  </Card>
  </div>

  <div class="column">
    <!-- Bed Mesh Visualizer Card -->
    <Card style="height: 100%;">
      <div class="tool-section">
        <h3 class="card-title"><FontAwesomeIcon icon={faFileMedical} /> Bed Mesh Visualizer</h3>
        <div style="flex-grow: 1; min-height: 0;">
          <BedMeshVisualizer meshData={visualizedMeshData} />
        </div>
        <BedMeshDataTable meshData={visualizedMeshData} />
      </div>
    </Card>
  </div>

  <SaveMeshModal
    isOpen={isSaveModalOpen}
    on:close={() => (isSaveModalOpen = false)}
    on:save={handleSaveMesh}
  />
</div>
{/if}

<style>
  .page-container {
    display: grid;
    grid-template-columns: 35% 1fr;
    gap: 1rem;
    padding: 1rem;
    height: 100%;
    /* align-items: start; */
  }

  .column {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 0;
  }

  .column-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .tool-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
  }
  .card-title {
    margin: 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--card-border-color);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .settings-form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 1rem;
    align-items: flex-end;
  }
  .settings-form .button-group {
    /* This allows the button to align nicely with the inputs */
    padding-bottom: 0;
  }

  .disclaimer {
    font-size: 0.8em;
    opacity: 0.7;
    text-align: center;
    margin-top: 0.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-weight: bold;
    font-size: 0.9em;
  }

  input {
    padding: 0.5rem;
    border: 1px solid var(--card-border-color);
    border-radius: 5px;
    background-color: var(--background-color);
    color: var(--text-color);
    width: 100%;
  }



  .button-group {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .button-group.spaced {
    justify-content: space-between;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 5px;
    background-color: var(--card-border-color);
    color: var(--text-color);
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  button.primary {
    background-color: var(--accent-color);
    color: white;
  }
  button.danger {
    background-color: #dc3545;
    color: white;
  }
  button.small {
    padding: 0.25rem 0.5rem;
    font-size: 0.8em;
  }
  .mesh-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex-grow: 1;
    overflow-y: auto;
  }

  .mesh-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    border-radius: 5px;
    background-color: var(--background-color);
    border: 1px solid transparent;
    transition: all 0.2s;
  }
  .mesh-item.active {
    border-color: var(--accent-color);
    background-color: var(--card-background-color);
  }

  .active-label {
    background-color: #28a745;
    color: white;
    font-size: 0.7em;
    font-weight: bold;
    padding: 0.1rem 0.4rem;
    border-radius: 10px;
    margin-left: 0.5rem;
    text-transform: uppercase;
  }

  .slot-name {
    display: flex;
    align-items: center;
  }

  @media (max-width: 900px) {
    .page-container {
      grid-template-columns: 1fr;
    }
  }
</style>
