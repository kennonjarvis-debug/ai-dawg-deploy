<script lang="ts">
	import '../app.css';
	import { ThemeProvider, theme } from '$lib/design-system';
	import { authStore } from '$lib/stores/authStore';
	import { onMount } from 'svelte';
	import { getAudioEngine } from '$lib/audio';
	import { page, navigating } from '$app/stores';
	import { goto } from '$app/navigation';
	import SkeletonLoader from '../components/SkeletonLoader.svelte';

	let isTestMode = false;

	onMount(async () => {
		// Import test bridge in browser (for E2E testing in dev mode)
		if (import.meta.env?.DEV || import.meta.env?.MODE === 'test') {
			await import('$lib/testing/bridge');
			isTestMode = true;
		}

		theme.initialize();
		authStore.initialize();
	});

	function handleTestQuantize() {
		console.log('Test quantize button clicked');

		try {
			const engine = getAudioEngine();
			const tracks = engine.getTracks();

			let quantizedCount = 0;

			// Apply quantization to all MIDI tracks
			tracks.forEach((track) => {
				if (track.type === 'midi') {
					const midiClips = track.getMIDIClips();
					midiClips.forEach((clip) => {
						clip.quantize(
							{
								grid: '1/16',
								strength: 1.0,
								swing: 0,
								quantizeNoteStarts: true,
								quantizeNoteEnds: false
							},
							120
						);
						quantizedCount++;
					});
				}
			});

			console.log(`Test quantize: processed ${quantizedCount} clip(s)`);
			alert(`Quantize applied to ${quantizedCount} clip(s)!`);
		} catch (err) {
			console.error('Test quantize error:', err);
			alert('Quantize test - no audio engine initialized yet');
		}
	}

	// Navigation items
	const navItems = [
		{ label: 'Home', path: '/' },
		{ label: 'DAW', path: '/daw' },
		{ label: 'Pricing', path: '/pricing' }
	];

	$: currentPath = $page.url.pathname;
</script>

<ThemeProvider>
	<!-- Navigation Bar -->
	<nav class="fixed top-0 left-0 right-0 z-40 glass-strong border-b border-white/10">
		<div class="max-w-7xl mx-auto px-8 py-4">
			<div class="flex items-center justify-between">
				<!-- Logo -->
				<button
					onclick={() => goto('/')}
					class="text-2xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent hover:opacity-80 transition-opacity"
				>
					DAWG AI
				</button>

				<!-- Nav Links -->
				<div class="flex items-center gap-6">
					{#each navItems as item}
						<button
							onclick={() => goto(item.path)}
							class="text-white/80 hover:text-white transition-colors {currentPath === item.path ? 'text-accent-primary font-semibold' : ''}"
						>
							{item.label}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</nav>

	<!-- Loading indicator during navigation -->
	{#if $navigating}
		<div class="fixed top-0 left-0 right-0 h-1 z-50">
			<div class="h-full bg-accent-primary animate-pulse"></div>
		</div>
	{/if}

	<!-- Main Content (with top padding for fixed nav) -->
	<div class="pt-20">
		{#if $navigating}
			<!-- Show skeleton during route transitions for better perceived performance -->
			<SkeletonLoader variant={$navigating.to?.route.id?.includes('daw') ? 'daw' : 'page'} />
		{:else}
			<slot />
		{/if}
	</div>

	<!-- Test mode: floating quantize button for E2E tests -->
	{#if isTestMode}
		<button
			data-testid="quantize-button"
			onclick={handleTestQuantize}
			class="fixed bottom-4 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm"
		>
			Quantize (Test)
		</button>
	{/if}
</ThemeProvider>
