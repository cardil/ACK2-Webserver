<div class="card">
  <slot />
</div>

<style>
  .card {
    background-color: var(--card-background-color);
    border-radius: 8px;
    padding: 1rem;
    transition: background-color 0.2s, border-color 0.2s;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 0;
  }
</style>
