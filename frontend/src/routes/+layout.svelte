<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';
  import NavMenu from '$lib/components/NavMenu.svelte';
  import { browser } from '$app/environment';

  if (browser && import.meta.env.DEV) {
    console.log('🧪 Mock controls are available as `mocksCtrl`. Try `mocksCtrl.connected()`, `mocksCtrl.connError()`, `mocksCtrl.unconfigured()`');
    (window as any).mocksCtrl = {
      connected: () => {
        const url = new URL(window.location.href);
        url.searchParams.delete('api_url');
        window.location.href = url.href;
      },
      connError: () => (window as any).socket.disconnect(),
      unconfigured: () => {
        const url = new URL(window.location.href);
        url.searchParams.set('api_url', 'unavailable');
        window.location.href = url.href;
      }
    };
  }

  let { children } = $props();
</script>

<svelte:head>
  <title>AK2 Dashboard</title>
  <link rel="icon" href={favicon} />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=Zen+Dots&display=swap" rel="stylesheet">
</svelte:head>

<div class="app-container">
  <NavMenu />
  <main>
    {@render children()}
  </main>
</div>

<style>
  :root {
    --background-color: #ffffff;
    --text-color: #000000;
    --card-background-color: #f0f0f0;
    --card-border-color: #e0e0e0;
    --accent-color: #007bff;
    --accent-color-dark: #005bdf;
    --letterbox-color: lightgray;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --background-color: #121212;
      --text-color: #ffffff;
      --card-background-color: #1e1e1e;
      --card-border-color: #2e2e2e;
      --letterbox-color: #000;
      color-scheme: dark;
    }
  }

  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: var(--background-color);
    color: var(--text-color);
    transition: background-color 0.2s, color 0.2s;
    font-size: 0.9rem;
  }

  :global(button:disabled) {
    background-color: #6c757d !important;
    cursor: not-allowed !important;
  }

.app-container {
    display: grid;
    grid-template-columns: auto 1fr; /* Nav is auto, content takes the rest */
    height: 100vh;
  }
  main {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
</style>
