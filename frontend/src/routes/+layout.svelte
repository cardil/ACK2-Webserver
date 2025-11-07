<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main>
	{@render children()}
</main>

<style>
	:root {
		--background-color: #ffffff;
		--text-color: #000000;
		--card-background-color: #f0f0f0;
		--card-border-color: #e0e0e0;
		--accent-color: #007bff;
	}

	@media (prefers-color-scheme: dark) {
		:root {
			--background-color: #121212;
			--text-color: #ffffff;
			--card-background-color: #1e1e1e;
			--card-border-color: #2e2e2e;
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
	}

	main {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
</style>
