<script lang="ts">
  import { onDestroy } from 'svelte';
  import CameraOffIcon from '$lib/components/icons/CameraOffIcon.svelte';

  let webcamActive = false;
  let webcamSrc = ''; // Default to empty, will be set by the logic
  let webcamInterval: ReturnType<typeof setInterval> | undefined = undefined;

  function toggleWebcam() {
    webcamActive = !webcamActive;
    if (webcamActive) {
      webcamInterval = setInterval(() => {
        webcamSrc = `/webcam/cam.jpg?_=${new Date().getTime()}`;
      }, 125);
    } else {
      if (webcamInterval) {
        clearInterval(webcamInterval);
      }
      webcamSrc = ''; // Go back to showing the icon
    }
  }

  onDestroy(() => {
    if (webcamInterval) {
      clearInterval(webcamInterval);
    }
  });
</script>

<div class="card webcam-container" class:letterbox={webcamActive}>
  {#if webcamActive}
    <img src={webcamSrc} alt="Webcam" />
  {:else}
    <div class="icon-container">
      <CameraOffIcon />
    </div>
  {/if}
  <button class="icon-button" on:click={toggleWebcam}>
    {#if webcamActive}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="6" y="6" width="12" height="12"></rect>
      </svg>
    {:else}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    {/if}
  </button>
</div>

<style>
  .card {
    background-color: var(--card-background-color);
    border-radius: 8px;
    padding: 1rem;
    transition: background-color 0.2s, border-color 0.2s;
  }

  .webcam-container {
    position: relative;
    padding: 0; /* Remove padding for the image to fill the card */
    overflow: hidden; /* Hide anything that spills out */
    flex-grow: 1; /* Add this to make the container grow */
    display: flex; /* Helps the image inside behave predictably */
    min-height: 0; /* Allow the container to shrink */
  }

  .letterbox {
    background-color: var(--letterbox-color);
  }

  .webcam-container img {
    width: 100%;
    height: 100%;
    object-fit: contain; /* Contain the image, creating letterboxes */
    display: block;
  }

  .icon-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: rgba(0, 0, 0, 0.5);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .icon-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
  }
</style>
