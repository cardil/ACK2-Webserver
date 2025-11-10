<script lang="ts">
  // @ts-nocheck
  import { onMount, onDestroy } from 'svelte';

  export let meshData: number[][] = [];
  let plotContainer: HTMLDivElement;
  let observer: MutationObserver;
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
      backgroundColor: 'rgba(240, 240, 240, 1)',
      textColor: '#000000',
      gridColor: 'rgba(200, 200, 200, 1)'
    };
  }

  function drawPlot() {
    if (!plotContainer || !meshData || meshData.length === 0) {
      return;
    }

    const theme = getThemeColors();

    const data: Plotly.Data[] = [{
      z: meshData,
      type: 'surface',
      colorscale: 'Viridis',
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
    observer = new MutationObserver(themeChangeHandler);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });

    // Cleanup on component destroy
    onDestroy(() => {
      mediaQuery.removeEventListener('change', themeChangeHandler);
      observer.disconnect();
    });
  });

  $: if (meshData) {
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
