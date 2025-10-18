<script lang="ts">
/**
 * Root Page - Redirect to DAW
 * Immediately redirects all users to the DAW interface
 */

import { onMount } from 'svelte';
import { goto } from '$app/navigation';

onMount(() => {
	// Redirect to DAW interface immediately
	goto('/daw', { replaceState: true });
});
</script>

<svelte:head>
	<title>DAWG AI - Loading...</title>
</svelte:head>

<!-- Loading state while redirecting -->
<div class="min-h-screen flex items-center justify-center">
	<div class="text-center">
		<div class="text-6xl font-bold mb-4 bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent animate-pulse">
			DAWG AI
		</div>
		<p class="text-white/60">Loading...</p>
	</div>
</div>
