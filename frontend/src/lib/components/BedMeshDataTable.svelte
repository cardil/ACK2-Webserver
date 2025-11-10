<script lang="ts">
  export let meshData: number[][] = [];

  // Find min and max values for color scaling
  $: min = Math.min(...meshData.flat());
  $: max = Math.max(...meshData.flat());

  function getColorForValue(value: number): string {
    if (min === max) return 'transparent'; // Avoid division by zero

    const range = max - min;
    // Normalize the value to a 0-1 range
    const normalized = (value - min) / range;

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

    const i = Math.floor(normalized * (viridis.length - 1));
    const j = Math.ceil(normalized * (viridis.length - 1));
    const ratio = (normalized * (viridis.length - 1)) - i;

    const r = Math.round(viridis[i][0] * (1 - ratio) + viridis[j][0] * ratio);
    const g = Math.round(viridis[i][1] * (1 - ratio) + viridis[j][1] * ratio);
    const b = Math.round(viridis[i][2] * (1 - ratio) + viridis[j][2] * ratio);

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
