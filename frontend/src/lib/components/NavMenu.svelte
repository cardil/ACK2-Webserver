<script lang="ts">
  import HomeIcon from '$lib/components/icons/HomeIcon.svelte';
  import LevelingIcon from '$lib/components/icons/LevelingIcon.svelte';
  import BedMeshIcon from '$lib/components/icons/BedMeshIcon.svelte';
  import FilesIcon from '$lib/components/icons/FilesIcon.svelte';
  import AboutIcon from '$lib/components/icons/AboutIcon.svelte';
  import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
  import Logo from '$lib/components/icons/Logo.svelte';

  let isOpen = false;

  function toggleMenu() {
    isOpen = !isOpen;
  }
</script>

<nav class:open={isOpen}>
  <div class="header">
    <button class="toggle-button" on:click={toggleMenu}>
      <!-- Hamburger icon -->
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
    <div class="logo">
      <Logo />
    </div>
  </div>
  <ul>
    <li><a href="/"><HomeIcon /><span>Home</span></a></li>
    <li><a href="/leveling"><LevelingIcon /><span>Leveling Tools</span></a></li>
    <li><a href="/files"><FilesIcon /><span>Logs & Files</span></a></li>
    <li><a href="/about"><AboutIcon /><span>About</span></a></li>
    <li class="theme-switcher-item">
      <ThemeSwitcher isOpen={isOpen} />
    </li>
  </ul>
</nav>

<style>
  nav {
    background-color: var(--card-background-color);
    width: 60px;
    height: 100%; /* Fill the grid cell height */
    transition: width 0.3s;
    overflow-x: hidden; /* Hide horizontal overflow */
    z-index: 100;
    display: flex;
    flex-direction: column;
  }
  nav.open {
    width: 250px;
  }
  .header {
    display: flex;
    align-items: center;
    padding: 1rem;
    gap: 1rem;
  }
  .toggle-button {
    background: none;
    border: none;
    color: var(--text-color);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .logo {
    opacity: 0;
    transition: opacity 0.2s;
    white-space: nowrap;
    display: flex;
    align-items: center;
  }
  nav.open .logo {
    opacity: 1;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    flex-grow: 1; /* Allow the list to grow and push the last item down */
  }
  li a {
    display: flex;
    align-items: center;
    padding: 1rem;
    color: var(--text-color);
    text-decoration: none;
    white-space: nowrap;
  }
  li a :global(svg) {
    flex-shrink: 0;
    margin-right: 1rem;
  }
  li a span {
    opacity: 0;
    transition: opacity 0.2s;
  }
  nav.open li a span {
    opacity: 1;
  }

  li.theme-switcher-item {
    margin-top: auto; /* Pushes to the bottom */
    padding: 0.5rem 0;
  }
</style>
