<script lang="ts">
  export let unleashedLink: string;
</script>

<div class="card print-status-container">
  <h2><a href={unleashedLink}>Kobra Unleashed</a></h2>
  <!-- Print status will be displayed here -->
</div>

<style>
  .card {
    background-color: var(--card-background-color);
    border: 1px solid var(--card-border-color);
    border-radius: 8px;
    padding: 1rem;
    transition: background-color 0.2s, border-color 0.2s;
  }
</style>
