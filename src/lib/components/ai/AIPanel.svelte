<script lang="ts">
/**
 * AI Panel Component
 * Provides AI-powered features for music generation and mixing
 */

import { api, type MIDIGenerationParams } from '$lib/api';
import { Button, Icon } from '$lib/design-system';
import { onMount, onDestroy } from 'svelte';
import { EventBus } from '$lib/events/eventBus';

// AI status
let isHealthy = $state(false);
let isProcessing = $state(false);
let statusMessage = $state('');
let error = $state<string | null>(null);

// Flash animation state
let shouldFlash = $state(false);
let promptMessage = $state('');

const eventBus = EventBus.getInstance();

// Generation parameters
let selectedStyle: 'drums' | 'melody' | 'bass' = $state('drums');
let tempo = $state(120);
let bars = $state(4);
let key = $state('C');
let scale = $state('major');

// Results
let generatedMIDI = $state<string | null>(null);
let mixingSuggestions = $state<any>(null);

onMount(async () => {
	await checkHealth();

	// Listen for AI prompt events
	const unsubscribe = eventBus.on('ai:prompt-user', (event: any) => {
		console.log('AI prompt event received:', event.payload);
		promptMessage = event.payload.message;
		shouldFlash = true;

		// Stop flashing after 3 seconds
		setTimeout(() => {
			shouldFlash = false;
		}, 3000);

		// Clear message after 10 seconds
		setTimeout(() => {
			promptMessage = '';
		}, 10000);
	});

	return () => {
		unsubscribe();
	};
});

onDestroy(() => {
	// Cleanup is handled by the unsubscribe function
});

async function checkHealth() {
	try {
		const health = await api.ai.health();
		isHealthy = health.status === 'healthy';
		statusMessage = isHealthy ? 'AI Engine Ready' : 'AI Engine Offline';
	} catch (err) {
		isHealthy = false;
		statusMessage = 'AI Engine Offline';
		console.error('AI health check failed:', err);
	}
}

async function generateMIDI() {
	if (!isHealthy) {
		error = 'AI Engine is not available';
		return;
	}

	isProcessing = true;
	error = null;
	statusMessage = `Generating ${selectedStyle}...`;

	try {
		const params: MIDIGenerationParams = {
			style: selectedStyle,
			tempo,
			bars,
		};

		const result = await api.ai.generateMIDI(params);
		generatedMIDI = result.midi_base64;
		statusMessage = `${selectedStyle} generated successfully!`;

		// TODO: Import MIDI into DAW
		console.log('Generated MIDI:', result);
	} catch (err) {
		error = err instanceof Error ? err.message : 'MIDI generation failed';
		statusMessage = 'Generation failed';
	} finally {
		isProcessing = false;
	}
}

async function generateBassline() {
	if (!isHealthy) {
		error = 'AI Engine is not available';
		return;
	}

	isProcessing = true;
	error = null;
	statusMessage = 'Generating bassline...';

	try {
		const result = await api.ai.generateBassline({ key, scale, bars, tempo });
		generatedMIDI = result.midi_base64;
		statusMessage = 'Bassline generated successfully!';

		// TODO: Import MIDI into DAW
		console.log('Generated bassline:', result);
	} catch (err) {
		error = err instanceof Error ? err.message : 'Bassline generation failed';
		statusMessage = 'Generation failed';
	} finally {
		isProcessing = false;
	}
}

async function generateMelody() {
	if (!isHealthy) {
		error = 'AI Engine is not available';
		return;
	}

	isProcessing = true;
	error = null;
	statusMessage = 'Generating melody...';

	try {
		const result = await api.ai.generateMelody({ key, scale, bars, tempo });
		generatedMIDI = result.midi_base64;
		statusMessage = 'Melody generated successfully!';

		// TODO: Import MIDI into DAW
		console.log('Generated melody:', result);
	} catch (err) {
		error = err instanceof Error ? err.message : 'Melody generation failed';
		statusMessage = 'Generation failed';
	} finally {
		isProcessing = false;
	}
}

async function getMixingSuggestions() {
	if (!isHealthy) {
		error = 'AI Engine is not available';
		return;
	}

	isProcessing = true;
	error = null;
	statusMessage = 'Analyzing mix...';

	try {
		const result = await api.ai.getMixingSuggestions();
		mixingSuggestions = result;
		statusMessage = 'Mix analysis complete!';
	} catch (err) {
		error = err instanceof Error ? err.message : 'Mix analysis failed';
		statusMessage = 'Analysis failed';
	} finally {
		isProcessing = false;
	}
}

async function autoLevel() {
	if (!isHealthy) {
		error = 'AI Engine is not available';
		return;
	}

	isProcessing = true;
	error = null;
	statusMessage = 'Auto-leveling tracks...';

	try {
		const result = await api.ai.autoLevel();
		statusMessage = 'Auto-level complete!';

		// TODO: Apply gain adjustments to tracks
		console.log('Gain adjustments:', result);
	} catch (err) {
		error = err instanceof Error ? err.message : 'Auto-level failed';
		statusMessage = 'Auto-level failed';
	} finally {
		isProcessing = false;
	}
}
</script>

<div class="ai-panel" class:flash-animation={shouldFlash}>
	<div class="ai-header">
		<h3>AI Assistant</h3>
		<div class="status-indicator" class:healthy={isHealthy} class:offline={!isHealthy}>
			{isHealthy ? '●' : '○'} {isHealthy ? 'Online' : 'Offline'}
		</div>
	</div>

	{#if promptMessage}
		<div class="prompt-message">
			<Icon name="zap" size="sm" />
			<span>{promptMessage}</span>
		</div>
	{/if}

	{#if error}
		<div class="error-message">{error}</div>
	{/if}

	{#if statusMessage}
		<div class="status-message">{statusMessage}</div>
	{/if}

	<div class="ai-section">
		<h4>MIDI Generation</h4>

		<div class="param-group">
			<label>
				Style:
				<select bind:value={selectedStyle} disabled={isProcessing}>
					<option value="drums">Drums</option>
					<option value="melody">Melody</option>
					<option value="bass">Bass</option>
				</select>
			</label>

			<label>
				Tempo:
				<input type="number" bind:value={tempo} min="60" max="200" disabled={isProcessing} />
			</label>

			<label>
				Bars:
				<input type="number" bind:value={bars} min="1" max="16" disabled={isProcessing} />
			</label>

			{#if selectedStyle !== 'drums'}
				<label>
					Key:
					<select bind:value={key} disabled={isProcessing}>
						<option value="C">C</option>
						<option value="D">D</option>
						<option value="E">E</option>
						<option value="F">F</option>
						<option value="G">G</option>
						<option value="A">A</option>
						<option value="B">B</option>
					</select>
				</label>

				<label>
					Scale:
					<select bind:value={scale} disabled={isProcessing}>
						<option value="major">Major</option>
						<option value="minor">Minor</option>
					</select>
				</label>
			{/if}
		</div>

		<div class="button-group">
			<Button onclick={generateMIDI} disabled={isProcessing || !isHealthy}>
				Generate {selectedStyle}
			</Button>

			<Button onclick={generateBassline} disabled={isProcessing || !isHealthy}>
				Generate Bassline
			</Button>

			<Button onclick={generateMelody} disabled={isProcessing || !isHealthy}>
				Generate Melody
			</Button>
		</div>
	</div>

	<div class="ai-section">
		<h4>Mixing Tools</h4>

		<div class="button-group">
			<Button onclick={getMixingSuggestions} disabled={isProcessing || !isHealthy}>
				Get Mix Suggestions
			</Button>

			<Button onclick={autoLevel} disabled={isProcessing || !isHealthy}>
				Auto-Level Tracks
			</Button>
		</div>

		{#if mixingSuggestions}
			<div class="suggestions">
				<strong>Quality Score: {(mixingSuggestions.overall_quality * 100).toFixed(0)}%</strong>
				<ul>
					{#each mixingSuggestions.suggestions as suggestion}
						<li>{suggestion.suggestion} ({(suggestion.confidence * 100).toFixed(0)}% confidence)</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</div>

<style>
.ai-panel {
	background: var(--color-surface-2, #2a2a2a);
	border-radius: 8px;
	padding: 16px;
	min-width: 300px;
}

.ai-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
}

.ai-header h3 {
	margin: 0;
	font-size: 18px;
	font-weight: 600;
}

.status-indicator {
	font-size: 12px;
	padding: 4px 8px;
	border-radius: 4px;
	background: var(--color-surface-3, #3a3a3a);
}

.status-indicator.healthy {
	color: #00ff88;
}

.status-indicator.offline {
	color: #ff4444;
}

.error-message {
	background: rgba(255, 68, 68, 0.2);
	color: #ff4444;
	padding: 8px;
	border-radius: 4px;
	margin-bottom: 12px;
	font-size: 14px;
}

.status-message {
	background: rgba(0, 255, 136, 0.1);
	color: #00ff88;
	padding: 8px;
	border-radius: 4px;
	margin-bottom: 12px;
	font-size: 14px;
}

.ai-section {
	margin-bottom: 24px;
}

.ai-section h4 {
	margin: 0 0 12px 0;
	font-size: 14px;
	font-weight: 600;
	text-transform: uppercase;
	opacity: 0.7;
}

.param-group {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-bottom: 12px;
}

.param-group label {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 14px;
}

.param-group input,
.param-group select {
	flex: 1;
	background: var(--color-surface-3, #3a3a3a);
	border: 1px solid var(--color-border, #555);
	border-radius: 4px;
	padding: 6px 8px;
	color: inherit;
	font-size: 14px;
}

.button-group {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.suggestions {
	background: var(--color-surface-3, #3a3a3a);
	padding: 12px;
	border-radius: 4px;
	margin-top: 12px;
	font-size: 14px;
}

.suggestions strong {
	display: block;
	margin-bottom: 8px;
	color: #00ff88;
}

.suggestions ul {
	margin: 0;
	padding-left: 20px;
}

.suggestions li {
	margin-bottom: 4px;
}

/* Yellow flash animation */
.flash-animation {
	animation: flashYellow 0.5s ease-in-out 6;
	box-shadow: 0 0 20px rgba(255, 235, 59, 0.5);
}

@keyframes flashYellow {
	0%, 100% {
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow: 0 0 5px rgba(255, 235, 59, 0.2);
	}
	50% {
		border-color: #ffeb3b;
		box-shadow: 0 0 30px rgba(255, 235, 59, 0.8),
		            0 0 60px rgba(255, 235, 59, 0.4),
		            inset 0 0 20px rgba(255, 235, 59, 0.2);
	}
}

/* Prompt message */
.prompt-message {
	display: flex;
	align-items: center;
	gap: 8px;
	background: linear-gradient(135deg, rgba(255, 235, 59, 0.2), rgba(255, 193, 7, 0.2));
	border: 2px solid #ffeb3b;
	border-radius: 8px;
	padding: 12px;
	margin-bottom: 12px;
	font-size: 13px;
	color: #ffeb3b;
	font-weight: 600;
	animation: slideIn 0.3s ease-out, pulse 2s ease-in-out infinite;
}

@keyframes slideIn {
	from {
		opacity: 0;
		transform: translateY(-10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes pulse {
	0%, 100% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.02);
	}
}

.prompt-message span {
	flex: 1;
	line-height: 1.4;
}
</style>
