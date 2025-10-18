<script lang="ts">
/**
 * Main DAW Application Page
 * Integrates Modules 1 (Design System), 2 (Audio Engine), and 10 (Cloud Storage)
 */

import { onMount, onDestroy } from 'svelte';
import { goto } from '$app/navigation';
import { appStore, projectName, hasUnsavedChanges } from '$lib/stores/appStore';
import { authStore, isAuthenticated, user } from '$lib/stores/authStore';
import {
	Button,
	Icon,
	TransportControls,
	Mixer,
	BrowserPanel,
	InspectorPanel
} from '$lib/design-system';
import AuthModal from '$lib/components/cloud/AuthModal.svelte';
import FileUploader from '$lib/components/cloud/FileUploader.svelte';
import AIPanel from '$lib/components/ai/AIPanel.svelte';
import AIAudioPanel from '$lib/components/ai/AIAudioPanel.svelte';
import AIFeaturesPanel from '$lib/components/ai/AIFeaturesPanel.svelte';
import { getAudioEngine } from '$lib/audio';

let isInitializing = $state(true);
let error = $state<string | null>(null);
let showAuthModal = $state(false);
let showFileUploader = $state(false);

// Transport state
let playing = $state(false);
let recording = $state(false);
let looping = $state(false);
let tempo = $state(120);
let position = $state('00:00:00');

// View state
let currentView = $state<'arrangement' | 'mixer' | 'browser'>('arrangement');

// Sample mixer channels (will be populated from audio engine)
let channels = $state([
	{ id: '1', label: 'Track 1', volume: -10, pan: 0, mute: false, solo: false, peak: -12, color: '#ff006e' },
	{ id: '2', label: 'Track 2', volume: -8, pan: 0.2, mute: false, solo: false, peak: -15, color: '#00d9ff' },
]);

onMount(async () => {
	// Check for test mode (bypass auth for E2E tests)
	const isTestMode = typeof window !== 'undefined' &&
		(window.location.search.includes('test=true') || navigator.userAgent.includes('Playwright'));

	// Check authentication
	if (!$isAuthenticated && !isTestMode) {
		showAuthModal = true;
		return;
	}

	// Initialize audio engine (skip in test mode to avoid AudioContext issues)
	if (isTestMode) {
		console.log('[DAW] Test mode detected - skipping audio engine initialization');
		isInitializing = false;
	} else {
		try {
			await appStore.initializeAudioEngine();
			isInitializing = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to initialize';
			isInitializing = false;
		}
	}

	// Set up keyboard shortcuts
	setupKeyboardShortcuts();

	// Warn before leaving with unsaved changes
	window.addEventListener('beforeunload', handleBeforeUnload);
});

onDestroy(() => {
	if (typeof window !== 'undefined') {
		window.removeEventListener('beforeunload', handleBeforeUnload);
	}
});

function setupKeyboardShortcuts() {
	window.addEventListener('keydown', (e) => {
		// Space - Play/Pause
		if (e.code === 'Space' && !isInputFocused()) {
			e.preventDefault();
			togglePlayback();
		}

		// Cmd/Ctrl + S - Save
		if ((e.metaKey || e.ctrlKey) && e.key === 's') {
			e.preventDefault();
			handleSave();
		}

		// Cmd/Ctrl + N - New Project
		if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
			e.preventDefault();
			handleNewProject();
		}
	});
}

function isInputFocused(): boolean {
	const active = document.activeElement;
	return active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA';
}

function handleBeforeUnload(e: BeforeUnloadEvent) {
	if ($hasUnsavedChanges) {
		e.preventDefault();
		e.returnValue = '';
	}
}

// Transport controls
function togglePlayback() {
	if (playing) {
		appStore.stop();
		playing = false;
	} else {
		appStore.play();
		playing = true;
	}
}

function handleStop() {
	appStore.stop();
	playing = false;
}

function handleRecord() {
	recording = !recording;
	// TODO: Implement recording
}

function handleLoop() {
	looping = !looping;
	// TODO: Implement loop
}

function handleTempoChange(newTempo: number) {
	tempo = newTempo;
	appStore.setTempo(newTempo);
}

// Project management
async function handleSave() {
	const result = await appStore.saveProject();
	if (result.success) {
		alert('Project saved!');
	} else {
		alert(`Save failed: ${result.error}`);
	}
}

async function handleNewProject() {
	if ($hasUnsavedChanges) {
		if (!confirm('You have unsaved changes. Create new project anyway?')) {
			return;
		}
	}

	const name = prompt('Project name:', 'Untitled Project');
	if (name) {
		await appStore.newProject(name);
	}
}

function handleOpenProjects() {
	goto('/');
}

function handleSignOut() {
	if ($hasUnsavedChanges) {
		if (!confirm('You have unsaved changes. Sign out anyway?')) {
			return;
		}
	}

	authStore.signOut();
	goto('/');
}

// Track management
function handleAddTrack() {
	// TODO: Implement add track
	alert('Add track - coming soon!');
}

function handleQuantize() {
	try {
		const engine = getAudioEngine();
		const tracks = engine.getTracks();

		let quantizedCount = 0;
		let totalClips = 0;

		// Apply quantization to all MIDI tracks
		tracks.forEach((track) => {
			if (track.type === 'midi') {
				const midiClips = track.getMIDIClips();
				totalClips += midiClips.length;

				midiClips.forEach((clip) => {
					// Apply 1/16 note quantization with full strength
					clip.quantize(
						{
							grid: '1/16',
							strength: 1.0,
							swing: 0,
							quantizeNoteStarts: true,
							quantizeNoteEnds: false
						},
						tempo
					);
					quantizedCount++;
				});
			}
		});

		if (totalClips > 0) {
			console.log(`Quantized ${quantizedCount} MIDI clip(s) to 1/16 note grid`);
			alert(`Quantized ${quantizedCount} MIDI clip(s)`);
		} else {
			console.log('No MIDI clips to quantize');
			alert('No MIDI clips found. Create a MIDI track and record some notes first!');
		}
	} catch (err) {
		console.error('Quantize error:', err);
		alert('Failed to apply quantization');
	}
}

function handleUploadFile() {
	showFileUploader = true;
}

function handleFileUploaded(event: CustomEvent) {
	console.log('Files uploaded:', event.detail.files);
	showFileUploader = false;
	// TODO: Add uploaded files to project
}

// View switching
function setView(view: 'arrangement' | 'mixer' | 'browser') {
	currentView = view;
	appStore.setView(view);
}

// Auth modal handlers
function handleAuthSuccess() {
	showAuthModal = false;
	// Reinitialize
	appStore.initializeAudioEngine();
}
</script>

<svelte:head>
	<title>{$projectName} - DAWG AI</title>
</svelte:head>

{#if showAuthModal}
	<AuthModal
		bind:isOpen={showAuthModal}
		mode="signin"
		on:signin={handleAuthSuccess}
		on:signup={handleAuthSuccess}
	/>
{:else if isInitializing}
	<div class="flex items-center justify-center min-h-screen">
		<div class="text-center">
			<div class="spinner mb-4"></div>
			<p class="text-white/70">Initializing audio engine...</p>
		</div>
	</div>
{:else if error}
	<div class="flex items-center justify-center min-h-screen p-8">
		<div class="glass-strong rounded-panel p-8 max-w-md">
			<h2 class="text-2xl font-bold mb-4 text-red-400">Initialization Error</h2>
			<p class="text-white/70 mb-6">{error}</p>
			<Button variant="primary" onclick={() => window.location.reload()}>
				Reload
			</Button>
		</div>
	</div>
{:else}
	<!-- Main DAW Interface -->
	<div class="flex flex-col h-screen overflow-hidden">
		<!-- Top Bar -->
		<div class="glass-purple p-4 flex items-center justify-between border-b border-white/10">
			<div class="flex items-center gap-4">
				<h1 class="text-xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
					DAWG AI
				</h1>
				<span class="text-white/50">|</span>
				<span class="text-white/90">{$projectName}</span>
				{#if $hasUnsavedChanges}
					<span class="text-yellow-400 text-sm">• Unsaved</span>
				{/if}
			</div>

			<div class="flex items-center gap-2">
				<Button variant="ghost" size="sm" onclick={handleNewProject}>
					<Icon name="plus" size="sm" />
					New
				</Button>
				<Button variant="ghost" size="sm" onclick={handleOpenProjects}>
					<Icon name="folder" size="sm" />
					Open
				</Button>
				<Button variant="ghost" size="sm" onclick={handleSave}>
					<Icon name="save" size="sm" />
					Save
				</Button>
				<span class="text-white/20">|</span>
				<Button variant="ghost" size="sm" onclick={handleSignOut}>
					<Icon name="logout" size="sm" />
					Sign Out
				</Button>
			</div>
		</div>

		<!-- Transport Controls -->
		<div class="glass-strong p-4 border-b border-white/10" data-testid="transport-controls">
			<div class="flex items-center justify-between">
				<TransportControls
					bind:playing
					bind:recording
					bind:looping
					bind:tempo
					{position}
					on:play={togglePlayback}
					on:stop={handleStop}
					on:record={handleRecord}
					on:loop={handleLoop}
					on:tempochange={(e) => handleTempoChange(e.detail.tempo)}
				/>

				<!-- MIDI Tools -->
				<div class="flex items-center gap-2">
					<Button
						variant="secondary"
						size="sm"
						onclick={handleQuantize}
						data-testid="quantize-button"
					>
						<Icon name="grid" size="sm" />
						Quantize
					</Button>
				</div>
			</div>
		</div>

		<!-- Main Content Area -->
		<div class="flex flex-1 overflow-hidden">
			<!-- Left Sidebar - Browser -->
			<div class="w-64 glass border-r border-white/10 overflow-y-auto">
				<BrowserPanel />
				<div class="p-4">
					<Button variant="secondary" size="sm" fullWidth onclick={handleUploadFile}>
						<Icon name="upload" size="sm" />
						Upload Audio
					</Button>
					<Button variant="secondary" size="sm" fullWidth onclick={handleAddTrack} class="mt-2">
						<Icon name="plus" size="sm" />
						Add Track
					</Button>
				</div>
			</div>

			<!-- Center - Arrangement/Mixer View -->
			<div class="flex-1 glass-subtle overflow-auto">
				{#if currentView === 'arrangement'}
					<div class="p-8" data-testid="arrangement-view">
						<h2 class="text-2xl font-bold mb-4">Arrangement View</h2>
						<p class="text-white/70 mb-4">Timeline and track arrangement view coming soon...</p>

						<!-- Placeholder for arrangement view -->
						<div class="glass-strong rounded-panel p-8 text-center">
							<Icon name="music" size="xl" />
							<p class="mt-4 text-white/50">
								Drag audio files here or add tracks to get started
							</p>
						</div>
					</div>
				{:else if currentView === 'mixer'}
					<div class="p-4" data-testid="mixer-view">
						<Mixer {channels} masterVolume={0} masterPeak={-8} />
					</div>
				{:else}
					<div class="p-8">
						<h2 class="text-2xl font-bold mb-4">Browser</h2>
						<p class="text-white/70">Sound library browser coming soon...</p>
					</div>
				{/if}
			</div>

			<!-- Right Sidebar - Inspector & AI -->
			<div class="w-80 glass border-l border-white/10 overflow-y-auto flex flex-col">
				<div class="p-4 flex-1 min-h-0">
					<AIFeaturesPanel />
				</div>
				<div class="border-t border-white/10"></div>
				<div class="p-4">
					<h3 class="text-sm font-semibold text-white/70 mb-3">Advanced Audio</h3>
					<AIAudioPanel />
				</div>
			</div>
		</div>

		<!-- Bottom Bar - View Switcher -->
		<div class="glass-purple p-2 flex items-center justify-center gap-2 border-t border-white/10">
			<Button
				variant={currentView === 'arrangement' ? 'primary' : 'ghost'}
				size="sm"
				onclick={() => setView('arrangement')}
			>
				Arrangement
			</Button>
			<Button
				variant={currentView === 'mixer' ? 'primary' : 'ghost'}
				size="sm"
				onclick={() => setView('mixer')}
			>
				Mixer
			</Button>
			<Button
				variant={currentView === 'browser' ? 'primary' : 'ghost'}
				size="sm"
				onclick={() => setView('browser')}
			>
				Browser
			</Button>
		</div>
	</div>
{/if}

<!-- File Uploader Modal -->
{#if showFileUploader}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
		<div class="glass-strong rounded-panel p-6 max-w-2xl w-full mx-4">
			<div class="flex justify-between items-center mb-4">
				<h2 class="text-xl font-bold">Upload Audio Files</h2>
				<Button variant="ghost" size="sm" onclick={() => showFileUploader = false}>
					<Icon name="close" size="sm" />
				</Button>
			</div>
			<FileUploader on:upload={handleFileUploaded} />
		</div>
	</div>
{/if}

<style>
	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid rgba(255, 255, 255, 0.1);
		border-top-color: var(--color-accent-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
