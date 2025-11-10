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

    // Simple blue-white-red scale
    // Closer to min is blue, center is white/transparent, closer to max is red
    const mid = 0.5;
    let r, g, b;

    if (normalized < mid) {
      // Blue to white
      const localNorm = normalized / mid; // Scale to 0-1 in this half
      r = Math.round(255 * localNorm);
      g = Math.round(255 * localNorm);
      b = 255;
    } else {
      // White to red
      const localNorm = (normalized - mid) / mid; // Scale to 0-1 in this half
      r = 255;
      g = Math.round(255 * (1 - localNorm));
      b = Math.round(255 * (1 - localNorm));
    }

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
