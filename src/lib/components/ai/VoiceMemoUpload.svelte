<script lang="ts">
/**
 * Voice Memo Upload Component
 * Drag & drop interface for uploading voice memos and triggering the AI pipeline
 */

import { Button, Icon } from '$lib/design-system';
import { onMount } from 'svelte';

// Props
interface Props {
	onUploadComplete?: (result: any) => void;
	autoProcess?: boolean;
}

let { onUploadComplete, autoProcess = true }: Props = $props();

// State
let isDragging = $state(false);
let isUploading = $state(false);
let uploadProgress = $state(0);
let uploadResult = $state<any>(null);
let error = $state<string | null>(null);
let pipelineStatus = $state<string>('');

// File input reference
let fileInput: HTMLInputElement;

// Drag and drop handlers
function handleDragEnter(e: DragEvent) {
	e.preventDefault();
	isDragging = true;
}

function handleDragLeave(e: DragEvent) {
	e.preventDefault();
	if (e.currentTarget === e.target) {
		isDragging = false;
	}
}

function handleDragOver(e: DragEvent) {
	e.preventDefault();
}

async function handleDrop(e: DragEvent) {
	e.preventDefault();
	isDragging = false;

	const files = e.dataTransfer?.files;
	if (files && files.length > 0) {
		await uploadFile(files[0]);
	}
}

// File selection handler
function handleFileSelect(e: Event) {
	const target = e.target as HTMLInputElement;
	if (target.files && target.files.length > 0) {
		uploadFile(target.files[0]);
	}
}

// Upload file to API
async function uploadFile(file: File) {
	// Validate file type
	const allowedTypes = ['audio/mp4', 'audio/m4a', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm'];
	const allowedExtensions = /\.(mp3|m4a|wav|mp4|webm)$/i;

	if (!allowedTypes.includes(file.type) && !file.name.match(allowedExtensions)) {
		error = 'Invalid file type. Please upload .mp3, .m4a, .wav, .mp4, or .webm files';
		return;
	}

	// Validate file size (25MB max)
	const maxSize = 25 * 1024 * 1024;
	if (file.size > maxSize) {
		error = 'File too large. Maximum size is 25MB';
		return;
	}

	// Reset state
	error = null;
	uploadResult = null;
	isUploading = true;
	uploadProgress = 0;
	pipelineStatus = 'Uploading...';

	try {
		// Create form data
		const formData = new FormData();
		formData.append('audio', file);
		formData.append('runPipeline', autoProcess ? 'true' : 'false');

		// Upload with progress tracking
		const xhr = new XMLHttpRequest();

		xhr.upload.addEventListener('progress', (e) => {
			if (e.lengthComputable) {
				uploadProgress = Math.round((e.loaded / e.total) * 100);
			}
		});

		xhr.addEventListener('load', () => {
			if (xhr.status === 200) {
				const result = JSON.parse(xhr.responseText);
				uploadResult = result;

				if (result.success) {
					pipelineStatus = autoProcess ? 'Processing through pipeline...' : 'Upload complete!';
					onUploadComplete?.(result);

					// If auto-processing, show stages
					if (autoProcess && result.pipeline?.completed) {
						pipelineStatus = 'Pipeline complete! 🎉';
					} else if (autoProcess) {
						pipelineStatus = 'Processing in background...';
					}
				} else {
					error = result.error || 'Upload failed';
					pipelineStatus = '';
				}
			} else {
				error = `Upload failed: ${xhr.statusText}`;
				pipelineStatus = '';
			}
			isUploading = false;
		});

		xhr.addEventListener('error', () => {
			error = 'Network error during upload';
			pipelineStatus = '';
			isUploading = false;
		});

		xhr.open('POST', '/api/voice-memo/upload');
		xhr.send(formData);

	} catch (err: any) {
		error = err.message || 'Upload failed';
		pipelineStatus = '';
		isUploading = false;
	}
}

function triggerFileInput() {
	fileInput?.click();
}

function reset() {
	uploadResult = null;
	error = null;
	uploadProgress = 0;
	pipelineStatus = '';
}
</script>

<div class="voice-memo-upload">
	<div class="upload-header">
		<h4>🎤 AI Voice Memo</h4>
		<p class="upload-subtitle">Upload a voice memo to process through the 10-stage AI pipeline</p>
	</div>

	{#if !uploadResult}
		<!-- Drop zone -->
		<div
			class="drop-zone"
			class:dragging={isDragging}
			class:disabled={isUploading}
			ondragenter={handleDragEnter}
			ondragleave={handleDragLeave}
			ondragover={handleDragOver}
			ondrop={handleDrop}
			onclick={!isUploading ? triggerFileInput : undefined}
			role="button"
			tabindex={isUploading ? -1 : 0}
			aria-label="Upload voice memo"
		>
			{#if isUploading}
				<div class="upload-progress">
					<Icon name="upload" size="lg" />
					<div class="progress-bar">
						<div class="progress-fill" style="width: {uploadProgress}%"></div>
					</div>
					<p class="progress-text">{uploadProgress}%</p>
					<p class="status-text">{pipelineStatus}</p>
				</div>
			{:else}
				<Icon name="upload" size="xl" />
				<p class="drop-text">
					{#if isDragging}
						Drop your voice memo here
					{:else}
						Drag & drop or click to upload
					{/if}
				</p>
				<p class="drop-hint">Supports: .mp3, .m4a, .wav, .mp4, .webm (max 25MB)</p>
			{/if}
		</div>

		<!-- Hidden file input -->
		<input
			bind:this={fileInput}
			type="file"
			accept=".mp3,.m4a,.wav,.mp4,.webm,audio/*"
			onchange={handleFileSelect}
			style="display: none;"
		/>
	{/if}

	<!-- Error message -->
	{#if error}
		<div class="message error">
			<Icon name="alert" size="sm" />
			{error}
		</div>
	{/if}

	<!-- Success result -->
	{#if uploadResult?.success}
		<div class="upload-result">
			<div class="result-header">
				<Icon name="check" size="sm" />
				<span>Upload Successful!</span>
			</div>

			<div class="result-details">
				<div class="detail-item">
					<span class="detail-label">File:</span>
					<span class="detail-value">{uploadResult.file?.name}</span>
				</div>
				<div class="detail-item">
					<span class="detail-label">Size:</span>
					<span class="detail-value">{(uploadResult.file?.size / 1024 / 1024).toFixed(2)} MB</span>
				</div>
				{#if uploadResult.pipeline}
					<div class="detail-item">
						<span class="detail-label">Pipeline:</span>
						<span class="detail-value pipeline-status">
							{#if uploadResult.pipeline.completed}
								✅ Complete
							{:else}
								⏳ Processing...
							{/if}
						</span>
					</div>
				{/if}
			</div>

			{#if autoProcess}
				<div class="pipeline-info">
					<h5>Pipeline Stages (3-5 min)</h5>
					<ul class="stage-list">
						<li>1. Audio Analysis</li>
						<li>2. Transcription (Whisper)</li>
						<li>3. Lyric Parsing (Claude AI)</li>
						<li>4. Song Completion (Claude AI)</li>
						<li>5. Vocal Separation (Demucs)</li>
						<li>6. Beat Generation (MusicGen)</li>
						<li>7. Mixing (FFmpeg)</li>
						<li>8. Mastering (FFmpeg)</li>
						<li>9. Quality Check</li>
						<li>10. Output to Voice Memos</li>
					</ul>
					<p class="pipeline-note">
						💡 Check your Voice Memos app for the processed result
					</p>
				</div>
			{/if}

			<Button variant="ghost" size="sm" fullWidth onclick={reset}>
				<Icon name="refresh" size="sm" />
				Upload Another
			</Button>
		</div>
	{/if}
</div>

<style>
.voice-memo-upload {
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 16px;
	background: rgba(0, 0, 0, 0.2);
	border-radius: 12px;
	border: 1px solid rgba(255, 255, 255, 0.1);
}

.upload-header h4 {
	margin: 0 0 4px 0;
	font-size: 16px;
	font-weight: 700;
	color: #fff;
}

.upload-subtitle {
	margin: 0;
	font-size: 12px;
	color: rgba(255, 255, 255, 0.6);
	line-height: 1.4;
}

.drop-zone {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 200px;
	padding: 32px;
	border: 2px dashed rgba(255, 255, 255, 0.3);
	border-radius: 12px;
	background: rgba(0, 0, 0, 0.3);
	cursor: pointer;
	transition: all 0.2s;
}

.drop-zone:hover:not(.disabled) {
	border-color: #7c3aed;
	background: rgba(124, 58, 237, 0.1);
}

.drop-zone.dragging {
	border-color: #00ff88;
	background: rgba(0, 255, 136, 0.1);
	transform: scale(1.02);
}

.drop-zone.disabled {
	cursor: not-allowed;
	opacity: 0.7;
}

.drop-text {
	margin: 12px 0 4px 0;
	font-size: 14px;
	font-weight: 600;
	color: #fff;
}

.drop-hint {
	margin: 0;
	font-size: 11px;
	color: rgba(255, 255, 255, 0.5);
}

.upload-progress {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	width: 100%;
}

.progress-bar {
	width: 100%;
	height: 8px;
	background: rgba(0, 0, 0, 0.4);
	border-radius: 4px;
	overflow: hidden;
}

.progress-fill {
	height: 100%;
	background: linear-gradient(90deg, #7c3aed, #00ff88);
	transition: width 0.3s ease;
}

.progress-text {
	margin: 0;
	font-size: 16px;
	font-weight: 700;
	color: #7c3aed;
}

.status-text {
	margin: 0;
	font-size: 12px;
	color: rgba(255, 255, 255, 0.7);
}

.message {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px;
	border-radius: 8px;
	font-size: 13px;
}

.message.error {
	background: rgba(255, 68, 68, 0.2);
	border: 1px solid rgba(255, 68, 68, 0.4);
	color: #ff6b6b;
}

.upload-result {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.result-header {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px;
	background: rgba(0, 255, 136, 0.1);
	border: 1px solid rgba(0, 255, 136, 0.3);
	border-radius: 8px;
	color: #00ff88;
	font-weight: 600;
}

.result-details {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 12px;
	background: rgba(0, 0, 0, 0.3);
	border-radius: 8px;
}

.detail-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 12px;
}

.detail-label {
	color: rgba(255, 255, 255, 0.6);
	font-weight: 500;
}

.detail-value {
	color: #fff;
	font-weight: 600;
}

.pipeline-status {
	color: #00ff88;
}

.pipeline-info {
	padding: 12px;
	background: rgba(124, 58, 237, 0.1);
	border: 1px solid rgba(124, 58, 237, 0.3);
	border-radius: 8px;
}

.pipeline-info h5 {
	margin: 0 0 12px 0;
	font-size: 13px;
	font-weight: 600;
	color: #7c3aed;
}

.stage-list {
	margin: 0 0 12px 0;
	padding-left: 20px;
	font-size: 11px;
	color: rgba(255, 255, 255, 0.8);
	line-height: 1.8;
}

.stage-list li {
	margin-bottom: 2px;
}

.pipeline-note {
	margin: 0;
	padding: 8px;
	background: rgba(0, 0, 0, 0.3);
	border-radius: 6px;
	font-size: 11px;
	color: rgba(255, 255, 255, 0.7);
	text-align: center;
}
</style>
