<script lang="ts">
  export let meshData: number[][] = [];

  // Find min and max values for color scaling
  $: min = Math.min(...meshData.flat());
  $: max = Math.max(...meshData.flat());

  function getColorInfo(value: number): { class: string; textColor: string } {
    if (min === max) {
      return { class: 'color-5', textColor: 'black' }; // Neutral color
    }

    const normalized = (value - min) / (max - min);
    const colorIndex = Math.round(normalized * 10);
    const className = `color-${colorIndex}`;

    // Determine text color for contrast
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    let textColor = 'white';
    if (isDarkMode) {
      // Viridis: brightest at the end
      if (colorIndex > 8) {
        textColor = 'black';
      }
    } else {
      // RdBu: brightest in the middle
      if (colorIndex > 3 && colorIndex < 7) {
        textColor = 'black';
      }
    }

    return { class: className, textColor: textColor };
  }
</script>

<div class="table-container">
  <table>
    <tbody>
      {#each meshData as row}
        <tr>
          {#each row as cell}
            {@const { class: className, textColor } = getColorInfo(cell)}
            <td class="{className}" style="color: {textColor};">
              {cell.toFixed(4)}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  /* Define the color scales as CSS variables */
  :root {
    /* RdBu for light mode */
    --color-scale-0: #313695;
    --color-scale-1: #4575b4;
    --color-scale-2: #74add1;
    --color-scale-3: #abd9e9;
    --color-scale-4: #e0f3f8;
    --color-scale-5: #ffffbf;
    --color-scale-6: #fee090;
    --color-scale-7: #fdae61;
    --color-scale-8: #f46d43;
    --color-scale-9: #d73027;
    --color-scale-10: #a50026;
  }

  :global(body[data-theme='dark']) {
    /* Viridis for dark mode */
    --color-scale-0: #440154;
    --color-scale-1: #482878;
    --color-scale-2: #3e4989;
    --color-scale-3: #31688e;
    --color-scale-4: #26828e;
    --color-scale-5: #1f9e89;
    --color-scale-6: #35b779;
    --color-scale-7: #6ece58;
    --color-scale-8: #b5de2b;
    --color-scale-9: #fde725;
    --color-scale-10: #fde725; /* Use last color for interpolation */
  }

  .table-container {
    overflow-x: auto;
    width: 100%;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-family: monospace;
    font-size: 0.9em;
    text-align: center;
  }
  td {
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--card-border-color);
  }

  /* Assign background colors to classes */
  .color-0 { background-color: var(--color-scale-0); }
  .color-1 { background-color: var(--color-scale-1); }
  .color-2 { background-color: var(--color-scale-2); }
  .color-3 { background-color: var(--color-scale-3); }
  .color-4 { background-color: var(--color-scale-4); }
  .color-5 { background-color: var(--color-scale-5); }
  .color-6 { background-color: var(--color-scale-6); }
  .color-7 { background-color: var(--color-scale-7); }
  .color-8 { background-color: var(--color-scale-8); }
  .color-9 { background-color: var(--color-scale-9); }
  .color-10 { background-color: var(--color-scale-10); }
</style>
