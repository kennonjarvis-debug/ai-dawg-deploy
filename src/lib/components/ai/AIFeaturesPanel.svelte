<script lang="ts">
/**
 * DAWG AI Auto Features Panel
 * Shows all AI-powered features including voice memo processing
 */

import { Button, Icon } from '$lib/design-system';
import VoiceMemoUpload from './VoiceMemoUpload.svelte';
import { EventBus } from '$lib/events/eventBus';

// State
let selectedFeature = $state<string | null>('voice-memo');
let showFeatureDetail = $state(false);

const eventBus = EventBus.getInstance();

// AI Features configuration
const features = [
	{
		id: 'full-auto',
		icon: '🎸',
		name: 'Dawg AI (Full Auto)',
		description: 'Complete AI production from idea to final mix',
		action: 'Select clips',
		disabled: false,
	},
	{
		id: 'voice-memo',
		icon: '🎤',
		name: 'AI Voice Memo',
		description: '10-stage pipeline: transcribe, complete, separate, mix, master',
		action: null,
		disabled: false,
	},
	{
		id: 'comp',
		icon: '🎚️',
		name: 'AI Comp',
		description: 'Intelligent vocal comping from multiple takes',
		action: 'Select 2+ clips',
		disabled: false,
	},
	{
		id: 'tune',
		icon: '🎵',
		name: 'AI Tune',
		description: 'Auto-tune and pitch correction',
		action: 'Select clips',
		disabled: false,
	},
	{
		id: 'pitch',
		icon: '🎹',
		name: 'AI Pitch',
		description: 'Pitch shifting and formant correction',
		action: 'Select clips',
		disabled: false,
	},
	{
		id: 'mix',
		icon: '🎛️',
		name: 'AI Mix',
		description: 'Professional mixing with AI suggestions',
		action: 'Select clips',
		disabled: false,
	},
	{
		id: 'master',
		icon: '⭐',
		name: 'AI Master',
		description: 'Radio-ready mastering (-14 LUFS)',
		action: 'Select clips',
		disabled: false,
	},
	{
		id: 'settings',
		icon: '⚙️',
		name: 'Settings',
		description: 'Configure AI features and preferences',
		action: null,
		disabled: false,
	},
	{
		id: 'billing',
		icon: '💳',
		name: 'Billing',
		description: 'Manage subscription and usage',
		action: null,
		disabled: false,
	},
];

function selectFeature(featureId: string) {
	selectedFeature = selectedFeature === featureId ? null : featureId;
	showFeatureDetail = selectedFeature === featureId;

	// Emit event to prompt AI chat for voice memo and music gen features
	if (featureId === 'voice-memo' && showFeatureDetail) {
		eventBus.emit('ai:prompt-user', {
			feature: 'voice-memo',
			message: 'Upload a voice memo using the "+" button or tell me what kind of beat you want me to create!',
			action: 'upload-or-prompt'
		});
	} else if (featureId === 'full-auto' && showFeatureDetail) {
		eventBus.emit('ai:prompt-user', {
			feature: 'music-gen',
			message: 'Tell me what kind of music you want to create, or select some clips!',
			action: 'prompt-ai'
		});
	}
}

function handleUploadComplete(result: any) {
	console.log('Voice memo uploaded:', result);
	// You can show a notification or update UI here
}
</script>

<div class="ai-features-panel">
	<div class="panel-header">
		<h3>⚡ DAWG AI AUTO FEATURES</h3>
		<p class="panel-subtitle">AI-powered music production tools</p>
	</div>

	<div class="features-list">
		{#each features as feature}
			<button
				class="feature-item"
				class:selected={selectedFeature === feature.id}
				class:disabled={feature.disabled}
				onclick={() => selectFeature(feature.id)}
				disabled={feature.disabled}
			>
				<div class="feature-main">
					<span class="feature-icon">{feature.icon}</span>
					<div class="feature-info">
						<div class="feature-name">{feature.name}</div>
						<div class="feature-description">{feature.description}</div>
					</div>
				</div>
				{#if feature.action}
					<div class="feature-action">{feature.action}</div>
				{/if}
			</button>

			<!-- Expanded feature detail -->
			{#if selectedFeature === feature.id}
				<div class="feature-detail">
					{#if feature.id === 'voice-memo'}
						<VoiceMemoUpload onUploadComplete={handleUploadComplete} autoProcess={true} />
					{:else if feature.id === 'settings'}
						<div class="feature-content">
							<h4>⚙️ Settings</h4>
							<p>AI feature settings coming soon...</p>
							<div class="setting-item">
								<label>
									<input type="checkbox" checked />
									Auto-process voice memos
								</label>
							</div>
							<div class="setting-item">
								<label>
									<input type="checkbox" checked />
									Enable beat generation
								</label>
							</div>
							<div class="setting-item">
								<label>
									<input type="checkbox" />
									Save intermediate files
								</label>
							</div>
						</div>
					{:else if feature.id === 'billing'}
						<div class="feature-content">
							<h4>💳 Billing</h4>
							<div class="billing-info">
								<div class="billing-stat">
									<span class="stat-label">Usage This Month</span>
									<span class="stat-value">$2.40</span>
								</div>
								<div class="billing-stat">
									<span class="stat-label">Songs Processed</span>
									<span class="stat-value">24</span>
								</div>
								<div class="billing-stat">
									<span class="stat-label">Cost per Song</span>
									<span class="stat-value">~$0.10</span>
								</div>
							</div>
							<Button variant="primary" size="sm" fullWidth>
								View Detailed Usage
							</Button>
						</div>
					{:else}
						<div class="feature-content">
							<p>This feature is coming soon! Stay tuned.</p>
						</div>
					{/if}
				</div>
			{/if}
		{/each}
	</div>

	<div class="panel-footer">
		<div class="footer-stat">
			<Icon name="zap" size="sm" />
			<span>3-5 min per song</span>
		</div>
		<div class="footer-stat">
			<Icon name="dollar" size="sm" />
			<span>~$0.10 cost</span>
		</div>
	</div>
</div>

<style>
.ai-features-panel {
	display: flex;
	flex-direction: column;
	height: 100%;
	background: linear-gradient(135deg, rgba(124, 58, 237, 0.05), rgba(59, 130, 246, 0.05));
	border: 1px solid rgba(124, 58, 237, 0.2);
	border-radius: 12px;
	overflow: hidden;
}

.panel-header {
	padding: 16px;
	background: rgba(0, 0, 0, 0.3);
	border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header h3 {
	margin: 0 0 4px 0;
	font-size: 14px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	color: #fff;
	background: linear-gradient(135deg, #7c3aed, #3b82f6);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

.panel-subtitle {
	margin: 0;
	font-size: 11px;
	color: rgba(255, 255, 255, 0.5);
}

.features-list {
	flex: 1;
	overflow-y: auto;
	padding: 8px;
}

.feature-item {
	display: flex;
	flex-direction: column;
	gap: 8px;
	width: 100%;
	padding: 12px;
	margin-bottom: 4px;
	background: rgba(0, 0, 0, 0.2);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.2s;
	text-align: left;
}

.feature-item:hover:not(.disabled) {
	background: rgba(124, 58, 237, 0.1);
	border-color: rgba(124, 58, 237, 0.4);
	transform: translateX(2px);
}

.feature-item.selected {
	background: rgba(124, 58, 237, 0.2);
	border-color: #7c3aed;
}

.feature-item.disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.feature-main {
	display: flex;
	align-items: center;
	gap: 12px;
}

.feature-icon {
	font-size: 20px;
	flex-shrink: 0;
}

.feature-info {
	flex: 1;
	min-width: 0;
}

.feature-name {
	font-size: 13px;
	font-weight: 600;
	color: #fff;
	margin-bottom: 2px;
}

.feature-description {
	font-size: 11px;
	color: rgba(255, 255, 255, 0.6);
	line-height: 1.3;
}

.feature-action {
	font-size: 10px;
	color: rgba(255, 255, 255, 0.4);
	text-align: right;
}

.feature-detail {
	margin: -4px 0 8px 0;
	padding: 0;
	animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
	from {
		opacity: 0;
		transform: translateY(-10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.feature-content {
	padding: 16px;
	background: rgba(0, 0, 0, 0.3);
	border-radius: 8px;
	border: 1px solid rgba(124, 58, 237, 0.2);
}

.feature-content h4 {
	margin: 0 0 12px 0;
	font-size: 14px;
	font-weight: 600;
	color: #fff;
}

.feature-content p {
	margin: 0 0 12px 0;
	font-size: 12px;
	color: rgba(255, 255, 255, 0.7);
}

.setting-item {
	padding: 8px 0;
	border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.setting-item:last-child {
	border-bottom: none;
}

.setting-item label {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 12px;
	color: rgba(255, 255, 255, 0.9);
	cursor: pointer;
}

.setting-item input[type="checkbox"] {
	width: 16px;
	height: 16px;
	cursor: pointer;
}

.billing-info {
	display: flex;
	flex-direction: column;
	gap: 12px;
	margin-bottom: 16px;
	padding: 12px;
	background: rgba(0, 0, 0, 0.3);
	border-radius: 8px;
}

.billing-stat {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.stat-label {
	font-size: 12px;
	color: rgba(255, 255, 255, 0.6);
}

.stat-value {
	font-size: 14px;
	font-weight: 700;
	color: #00ff88;
}

.panel-footer {
	display: flex;
	justify-content: space-around;
	padding: 12px;
	background: rgba(0, 0, 0, 0.3);
	border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-stat {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 11px;
	color: rgba(255, 255, 255, 0.7);
}
</style>
