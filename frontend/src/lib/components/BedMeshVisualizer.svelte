<script lang="ts">
  // @ts-nocheck
  import { onMount, onDestroy } from 'svelte';

  export let meshData: number[][] = [];
  let plotContainer: HTMLDivElement;
  let themeObserver: MutationObserver;
  let resizeObserver: ResizeObserver;
  let Plotly: any;

  function getThemeColors() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return {
        backgroundColor: 'rgba(30, 30, 30, 1)',
        textColor: '#ffffff',
        gridColor: 'rgba(70, 70, 70, 1)'
      };
    }
    return {
      backgroundColor: 'rgba(255, 255, 255, 1)',
      textColor: '#000000',
      gridColor: 'rgba(220, 220, 220, 1)'
    };
  }

  function drawPlot() {
    if (!plotContainer || !meshData || !Array.isArray(meshData) || meshData.length === 0 || !Array.isArray(meshData[0]) || meshData[0].length === 0) {
      return;
    }

    const theme = getThemeColors();

    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    const data: Plotly.Data[] = [{
      z: [...meshData].reverse(),
      type: 'surface',
      colorscale: isDarkMode ? 'Viridis' : 'RdBu',
      contours: {
        z: {
          show: true,
          usecolormap: true,
          highlightcolor: "#42f462",
          project: { z: true }
        }
      }
    }];

    const layout: Partial<Plotly.Layout> = {
      autosize: true,
      paper_bgcolor: theme.backgroundColor,
      font: {
        color: theme.textColor
      },
      margin: { l: 0, r: 0, b: 0, t: 0 },
      scene: {
        camera: {
          eye: { x: 0, y: -1.5, z: 1.5 }
        },
        aspectmode: 'cube',
        xaxis: {
          gridcolor: theme.gridColor,
          zerolinecolor: theme.gridColor,
          showbackground: false
        },
        yaxis: {
          gridcolor: theme.gridColor,
          zerolinecolor: theme.gridColor,
          showbackground: false
        },
        zaxis: {
          gridcolor: theme.gridColor,
          zerolinecolor: theme.gridColor,
          showbackground: false
        }
      }
    };

    Plotly.react(plotContainer, data, layout, { responsive: true });
  }

  onMount(async () => {
    // Dynamically import Plotly only on the client-side
    const PlotlyModule = await import('plotly.js-dist-min');
    Plotly = PlotlyModule.default;

    drawPlot();

    // Observe theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const themeChangeHandler = () => drawPlot();
    mediaQuery.addEventListener('change', themeChangeHandler);

    // Also handle direct style changes on the body if any
    themeObserver = new MutationObserver(themeChangeHandler);
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });

    // Watch for container resize events
    resizeObserver = new ResizeObserver(() => {
      Plotly.Plots.resize(plotContainer);
    });
    resizeObserver.observe(plotContainer);

    // Cleanup on component destroy
    onDestroy(() => {
      mediaQuery.removeEventListener('change', themeChangeHandler);
      themeObserver.disconnect();
      resizeObserver.disconnect();
    });
  });

  $: if (meshData && Plotly) {
    drawPlot();
  }
</script>

<div bind:this={plotContainer} class="plot-container"></div>

<style>
  .plot-container {
    width: 100%;
    height: 100%;
    min-height: 400px; /* Ensure it has a decent size */
  }
</style>
