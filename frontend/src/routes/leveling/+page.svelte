<script lang="ts">
  import Card from '$lib/components/Card.svelte';
  import BedMeshVisualizer from '$lib/components/BedMeshVisualizer.svelte';
  import BedMeshDataTable from '$lib/components/BedMeshDataTable.svelte';
  import SaveMeshModal from '$lib/components/SaveMeshModal.svelte';

  // --- Mock Data & State ---

  // Helper to generate random mesh data for prototyping
  function generateRandomMesh(size: number): number[][] {
    return Array.from({ length: size }, () =>
      Array.from({ length: size }, () => parseFloat((Math.random() * 0.4 - 0.2).toFixed(4)))
    );
  }

  // Settings
  let precision = 0.01;
  let gridSize = 5;
  let bedTemp = 60;

  // Mesh Data
  let savedSlots = [
    { id: 1, date: '2023-10-27 10:00', data: generateRandomMesh(5) },
    { id: 2, date: '2023-10-27 11:30', data: generateRandomMesh(5) },
    { id: 5, date: '2023-10-28 09:00', data: generateRandomMesh(5) }
  ];
  let activeMesh = { id: 'active', data: generateRandomMesh(5) };
  let activeSlotId: number | string | null = null;
  let isSaveModalOpen = false;

  // Reactive State
  let visualizedMeshData = activeMesh.data;
  let visualizedSlotId: number | string | null = 'active';
  $: averageMesh = (() => {
    if (savedSlots.length === 0) {
      // If there are no saved slots, return a flat mesh of the current grid size
      const zeroMesh = Array.from({ length: gridSize }, () => Array(gridSize).fill(0.0));
      return { id: 'average', data: zeroMesh };
    }
    const size = savedSlots[0].data.length;
    const avgData = Array.from({ length: size }, () => Array(size).fill(0));
    for (const slot of savedSlots) {
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          avgData[i][j] += slot.data[i][j];
        }
      }
    }
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        avgData[i][j] = parseFloat((avgData[i][j] / savedSlots.length).toFixed(4));
      }
    }
    return { id: 'average', data: avgData };
  })();

  // --- UI Functions ---

  function visualizeSlot(id: number | string) {
    visualizedSlotId = id;
    if (id === 'active') {
      visualizedMeshData = activeMesh.data;
    } else if (id === 'average') {
      visualizedMeshData = averageMesh.data;
    } else {
      const slot = savedSlots.find(s => s.id === id);
      if (slot) {
        visualizedMeshData = slot.data;
      }
    }
  }

  // Keep the visualized data in sync if the average is showing and the slots change
  $: if (visualizedSlotId === 'average') {
    visualizedMeshData = averageMesh.data;
  }

  function activateSlot(slotToActivate: {id: number | string, data: number[][]}) {
      // In a real scenario, this would send a command to the printer
      console.log(`Activating mesh from slot ${slotToActivate.id}`);
      activeMesh.data = JSON.parse(JSON.stringify(slotToActivate.data)); // Deep copy
      activeSlotId = slotToActivate.id;
      visualizeSlot('active');
  }

  function handleSaveMesh(event: CustomEvent<{ slot: number }>) {
    const slotNumber = event.detail.slot;
    const existingSlotIndex = savedSlots.findIndex(s => s.id === slotNumber);

    const newSave = {
      id: slotNumber,
      date: new Date().toISOString(), // Use a real timestamp
      data: JSON.parse(JSON.stringify(activeMesh.data)) // Deep copy
    };

    const newSlots = [...savedSlots];
    if (existingSlotIndex !== -1) {
      // Overwrite existing slot
      newSlots[existingSlotIndex] = newSave;
    } else {
      // Add as a new slot
      newSlots.push(newSave);
    }

    // Sort slots by ID for consistent order and assign to trigger reactivity
    savedSlots = newSlots.sort((a, b) => a.id - b.id);
    activeSlotId = slotNumber;

    isSaveModalOpen = false;
  }

  function deleteSlot(slotId: number) {
    if (confirm(`Are you sure you want to delete slot ${slotId}?`)) {
      // Re-assign to a new filtered array to trigger reactivity
      savedSlots = savedSlots.filter(s => s.id !== slotId);
      if (activeSlotId === slotId) {
        activeSlotId = null; // The active slot no longer exists
      }
      if (visualizedSlotId === slotId) {
        visualizeSlot('active'); // Revert visualization to active mesh
      }
    }
  }

  function deleteAllSlots() {
    if (confirm('Are you sure you want to delete ALL saved mesh profiles? This cannot be undone.')) {
      savedSlots = []; // This assignment is reactive
      activeSlotId = null;
      visualizeSlot('active');
    }
  }
</script>

<div class="page-container">
  <div class="column">
    <!-- Leveling Settings Card -->
    <Card>
      <div class="tool-section">
        <h3 class="card-title">Leveling Settings</h3>
        <div class="settings-form">
          <div class="form-group">
            <label for="grid">Grid Size</label>
            <input type="number" id="grid" bind:value={gridSize} min="2" max="10" />
          </div>
          <div class="form-group">
            <label for="bed_temp">Bed Temp (°C)</label>
            <input type="number" id="bed_temp" bind:value={bedTemp} min="0" max="90" />
          </div>
          <div class="form-group">
            <label for="precision">Probe Precision</label>
            <input type="number" id="precision" bind:value={precision} step="0.001" />
          </div>
          <div class="form-group button-group">
            <button class="primary">Save</button>
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
        <h3 class="card-title">Bed Mesh</h3>
        <div class="mesh-list">
          <!-- Active Mesh Special Slot -->
          <div class="mesh-item" class:active={visualizedSlotId === 'active'}>
            <span>Active</span>
            <div class="button-group">
              <button class="small primary" on:click={() => isSaveModalOpen = true}>Save</button>
              <button class="small" on:click={() => visualizeSlot('active')} disabled={visualizedSlotId === 'active'}>
                Visualize
              </button>
            </div>
          </div>
          <!-- Average Mesh Special Slot -->
          <div class="mesh-item" class:active={visualizedSlotId === 'average'}>
            <span class="slot-name">
              Average
              {#if activeSlotId === 'average'}
                <span class="active-label">active</span>
              {/if}
            </span>
            <div class="button-group">
              <button class="small" on:click={() => activateSlot(averageMesh)} disabled={activeSlotId === 'average'}>Activate</button>
              <button class="small" on:click={() => visualizeSlot('average')} disabled={visualizedSlotId === 'average'}>
                Visualize
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <!-- Saved Bed Meshes Card -->
    <Card>
      <div class="tool-section">
        <h3 class="card-title">Saved Bed Meshes</h3>
        <div class="mesh-list">
          {#each savedSlots as slot}
            <div class="mesh-item" class:active={slot.id === visualizedSlotId}>
              <span class="slot-name">
                Slot {slot.id}
                {#if slot.id === activeSlotId}
                  <span class="active-label">active</span>
                {/if}
              </span>
              <div class="button-group">
                <button class="small" on:click={() => activateSlot(slot)} disabled={slot.id === activeSlotId}>Activate</button>
                <button
                  class="small"
                  on:click={() => visualizeSlot(slot.id)}
                  disabled={slot.id === visualizedSlotId}
                >
                  Visualize
                </button>
                <button class="small danger" on:click={() => deleteSlot(slot.id)}>Delete</button>
              </div>
            </div>
          {/each}
        </div>
        <div class="button-group spaced">
          <button class="danger" on:click={deleteAllSlots}>Delete all</button>
        </div>
      </div>
  </Card>
  </div>

  <div class="column">
    <!-- Bed Mesh Visualizer Card -->
    <Card style="height: 100%;">
      <div class="tool-section">
        <h3 class="card-title">Bed Mesh Visualizer</h3>
        <BedMeshVisualizer meshData={visualizedMeshData} />
        <BedMeshDataTable meshData={visualizedMeshData} />
      </div>
    </Card>
  </div>

  <SaveMeshModal
    isOpen={isSaveModalOpen}
    on:close={() => isSaveModalOpen = false}
    on:save={handleSaveMesh}
  />
</div>

<style>
  .page-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    padding: 1rem;
    align-items: start;
  }

  .column {
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
