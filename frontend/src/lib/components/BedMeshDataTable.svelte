<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let meshData: number[][] = [];

  let isDarkMode = false;
  let ready = false;
  let mediaQuery: MediaQueryList | undefined;

  const updateTheme = () => {
    if (mediaQuery) {
      isDarkMode = mediaQuery.matches;
    }
  };

  onMount(() => {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);
    updateTheme();
    ready = true;

    onDestroy(() => {
      mediaQuery?.removeEventListener('change', updateTheme);
    });
  });

  // Find min and max values for color scaling
  $: min = Math.min(...meshData.flat());
  $: max = Math.max(...meshData.flat());

  function getColorForValue(value: number): string {
    if (min === max) return 'transparent'; // Avoid division by zero

    const range = max - min;
    // Normalize the value to a -1 to 1 range, then map to 0-1 for color scale
    const normalized = (value - min) / (max - min);

    // Viridis color scale - sampled points from the scale
    const viridis = [
      [68, 1, 84],
      [72, 40, 120],
      [62, 74, 137],
      [49, 104, 142],
      [38, 130, 142],
      [31, 158, 137],
      [53, 183, 121],
      [109, 205, 89],
      [180, 222, 44],
      [253, 231, 37]
    ];

    // RdBu (Red-Blue) diverging color scale for light mode
    const rdBu = [
      [9, 99, 171],   // Blue (Low)
      [104, 158, 203],
      [199, 219, 237],
      [255, 255, 255], // White (Zero)
      [249, 207, 200],
      [227, 134, 122],
      [194, 59, 44]    // Red (High)
    ];

    const colors = isDarkMode ? viridis : rdBu;

    const i = Math.floor(normalized * (colors.length - 1));
    const j = Math.ceil(normalized * (colors.length - 1));
    const ratio = (normalized * (colors.length - 1)) - i;

    const r = Math.round(colors[i][0] * (1 - ratio) + colors[j][0] * ratio);
    const g = Math.round(colors[i][1] * (1 - ratio) + colors[j][1] * ratio);
    const b = Math.round(colors[i][2] * (1 - ratio) + colors[j][2] * ratio);

    return `rgb(${r}, ${g}, ${b})`;
  }

  // Determine if text should be light or dark based on background
  function getTextColor(rgbString: string): string {
    if (!rgbString.startsWith('rgb')) return 'var(--text-color)';
    const [r, g, b] = rgbString.match(/\d+/g)!.map(Number);
    // Standard luminance calculation
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? 'black' : 'white';
  }
</script>

{#if ready}
<div class="table-container">
  <table>
    <tbody>
      {#each meshData as row, i}
        <tr>
          {#each row as cell, j}
            {@const backgroundColor = getColorForValue(cell)}
            {@const color = getTextColor(backgroundColor)}
            <td style="background-color: {backgroundColor}; color: {color}">
              {cell.toFixed(4)}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
{/if}

<style>
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
</style>
