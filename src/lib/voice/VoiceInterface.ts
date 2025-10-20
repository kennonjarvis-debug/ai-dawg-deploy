/**
 * Voice Interface
 * Module 6: Voice-Controlled DAW Interface
 *
 * Enables hands-free DAW control via natural conversation
 * Integrates: Deepgram STT, Claude LLM, ElevenLabs TTS
 */

import { createClient, type LiveTranscriptionEvents } from '@deepgram/sdk';
import Anthropic from '@anthropic-ai/sdk';
import type { UUID } from '../types/core';

import { logger } from '$lib/utils/logger';
export interface VoiceCommand {
	transcript: string;
	intent: string;
	parameters: Record<string, any>;
	confidence: number;
}

export interface VoiceConfig {
	deepgramApiKey?: string;
	anthropicApiKey?: string;
	elevenLabsApiKey?: string;
	wakeWord?: string;
}

export class VoiceInterface {
	private deepgram: ReturnType<typeof createClient>;
	private anthropic: Anthropic;
	private isListening: boolean = false;
	private conversationHistory: Array<{ role: string; content: string }> = [];
	private audioContext: AudioContext | null = null;
	private mediaStream: MediaStream | null = null;
	private wakeLock: WakeLockSentinel | null = null;
	private deepgramConnection: any = null;
	private mediaRecorder: MediaRecorder | null = null;
	private elevenLabsApiKey: string;
	private wakeWord: string;
	private wakeWordDetected: boolean = false;

	constructor(config?: VoiceConfig) {
		const deepgramKey = config?.deepgramApiKey || import.meta.env.VITE_DEEPGRAM_API_KEY;
		const anthropicKey = config?.anthropicApiKey || import.meta.env.VITE_ANTHROPIC_API_KEY;
		this.elevenLabsApiKey = config?.elevenLabsApiKey || import.meta.env.VITE_ELEVENLABS_API_KEY;
		this.wakeWord = config?.wakeWord || 'hey dawg';

		if (!deepgramKey) {
			throw new Error('Deepgram API key is required. Set VITE_DEEPGRAM_API_KEY environment variable.');
		}

		if (!anthropicKey) {
			throw new Error(
				'Anthropic API key is required. Set VITE_ANTHROPIC_API_KEY environment variable.'
			);
		}

		this.deepgram = createClient(deepgramKey);
		this.anthropic = new Anthropic({
			apiKey: anthropicKey,
			dangerouslyAllowBrowser: true // Required for browser use
		});

		logger.info('VoiceInterface: Initialized');
	}

	/**
	 * Start listening for voice commands
	 */
	async startListening(): Promise<void> {
		if (this.isListening) {
			logger.warn('VoiceInterface: Already listening');
			return;
		}

		try {
			// Request microphone access
			this.mediaStream = await navigator.mediaDevices.getUserMedia({
				audio: {
					channelCount: 1,
					sampleRate: 16000,
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true
				}
			});

			logger.info('VoiceInterface: Microphone access granted');

			// Keep screen awake during voice control
			if ('wakeLock' in navigator) {
				try {
					this.wakeLock = await (navigator as any).wakeLock.request('screen');
					logger.info('VoiceInterface: Screen wake lock acquired');
				} catch (err) {
					logger.warn('VoiceInterface: Could not acquire wake lock:', err);
				}
			}

			// Setup Deepgram live transcription
			this.deepgramConnection = this.deepgram.listen.live({
				model: 'nova-2',
				language: 'en',
				smart_format: true,
				interim_results: true,
				endpointing: 300,
				utterance_end_ms: 1000
			});

			this.deepgramConnection.on('open', () => {
				logger.info('VoiceInterface: Deepgram connection opened');
				this.emitEvent('connection-opened', {});

				// Stream microphone audio to Deepgram
				this.mediaRecorder = new MediaRecorder(this.mediaStream!, {
					mimeType: 'audio/webm'
				});

				this.mediaRecorder.ondataavailable = (event) => {
					if (event.data.size > 0 && this.deepgramConnection) {
						this.deepgramConnection.send(event.data);
					}
				};

				this.mediaRecorder.start(250); // Send chunks every 250ms
			});

			this.deepgramConnection.on('Results', this.handleTranscript.bind(this));

			this.deepgramConnection.on('error', (error: any) => {
				logger.error('VoiceInterface: Deepgram error:', error);
				this.emitEvent('error', { error });
			});

			this.deepgramConnection.on('close', () => {
				logger.info('VoiceInterface: Deepgram connection closed');
				this.emitEvent('connection-closed', {});
			});

			this.isListening = true;
			this.emitEvent('listening-started', {});
		} catch (error) {
			logger.error('VoiceInterface: Failed to start listening:', error);
			this.emitEvent('error', { error });
			throw error;
		}
	}

	/**
	 * Stop listening for voice commands
	 */
	stopListening(): void {
		if (!this.isListening) return;

		logger.info('VoiceInterface: Stopping listening');

		// Stop media recorder
		if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
			this.mediaRecorder.stop();
			this.mediaRecorder = null;
		}

		// Close Deepgram connection
		if (this.deepgramConnection) {
			this.deepgramConnection.finish();
			this.deepgramConnection = null;
		}

		// Stop media stream
		if (this.mediaStream) {
			this.mediaStream.getTracks().forEach((track) => track.stop());
			this.mediaStream = null;
		}

		// Release wake lock
		if (this.wakeLock) {
			this.wakeLock.release();
			this.wakeLock = null;
		}

		this.isListening = false;
		this.wakeWordDetected = false;
		this.emitEvent('listening-stopped', {});
	}

	/**
	 * Handle incoming transcript from Deepgram
	 */
	private async handleTranscript(data: any): Promise<void> {
		const transcript = data.channel?.alternatives?.[0]?.transcript;

		if (!transcript || transcript.trim() === '') return;

		const isFinal = data.is_final;

		if (isFinal) {
			logger.info('VoiceInterface: Final transcript:', transcript);
			this.emitEvent('transcript', { transcript, isFinal: true });

			// Check for wake word if not yet detected
			if (!this.wakeWordDetected && this.wakeWord) {
				if (transcript.toLowerCase().includes(this.wakeWord.toLowerCase())) {
					this.wakeWordDetected = true;
					this.emitEvent('wake-word-detected', { transcript });
					await this.speak('Yes? How can I help you?');
					return;
				}
			}

			// Process command if wake word detected or no wake word required
			if (this.wakeWordDetected || !this.wakeWord) {
				await this.processCommand(transcript);
			}
		} else {
			// Show interim results
			this.emitEvent('interim-transcript', { transcript, isFinal: false });
		}
	}

	/**
	 * Process voice command with Claude LLM
	 */
	async processCommand(transcript: string): Promise<void> {
		this.emitEvent('processing-command', { transcript });

		try {
			// Parse intent with Claude
			const response = await this.anthropic.messages.create({
				model: 'claude-3-5-sonnet-20241022',
				max_tokens: 1024,
				system: this.getSystemPrompt(),
				messages: [
					...this.conversationHistory,
					{ role: 'user', content: transcript }
				],
				tools: this.getDAWTools()
			});

			// Add to conversation history
			const assistantMessage =
				response.content.find((block) => block.type === 'text')?.text || '';

			this.conversationHistory.push(
				{ role: 'user', content: transcript },
				{ role: 'assistant', content: assistantMessage }
			);

			// Keep conversation history manageable (last 10 exchanges = 20 messages)
			if (this.conversationHistory.length > 20) {
				this.conversationHistory = this.conversationHistory.slice(-20);
			}

			// Execute tool calls
			if (response.stop_reason === 'tool_use') {
				for (const block of response.content) {
					if (block.type === 'tool_use') {
						const result = await this.executeAction(block.name, block.input);
						this.emitEvent('action-executed', {
							action: block.name,
							parameters: block.input,
							result
						});
					}
				}
			}

			// Speak response
			if (assistantMessage) {
				await this.speak(assistantMessage);
			}
		} catch (error) {
			logger.error('VoiceInterface: Error processing command:', error);
			this.emitEvent('error', { error });
			await this.speak("Sorry, I didn't understand that. Could you try again?");
		}
	}

	/**
	 * Get system prompt for Claude
	 */
	private getSystemPrompt(): string {
		// TODO: Get dynamic project context
		const projectContext = {
			tempo: 120,
			key: 'C major',
			trackCount: 0,
			selectedTrack: null
		};

		return `You are DAWG AI, an expert music production assistant integrated into a digital audio workstation.

Your role is to help bedroom producers create music through natural conversation. You can control the DAW, provide creative suggestions, and explain audio concepts.

CAPABILITIES:
- Control playback (play, stop, record, pause)
- Manage tracks (add, delete, solo, mute, rename)
- Adjust parameters (volume, pan, effects)
- Generate musical content (beats, chords, melodies)
- Apply mixing/mastering techniques
- Provide production advice

GUIDELINES:
- Be concise (1-2 sentences maximum)
- Confirm destructive actions before executing
- Use music production terminology appropriately
- Be encouraging and supportive
- Execute simple commands immediately without asking for confirmation
- For ambiguous commands, ask for clarification

CURRENT PROJECT CONTEXT:
- Tempo: ${projectContext.tempo} BPM
- Key: ${projectContext.key}
- Track count: ${projectContext.trackCount}
- Selected track: ${projectContext.selectedTrack || 'None'}

When you need to perform an action, use the available tools. Always provide brief verbal confirmation of actions.`;
	}

	/**
	 * Get DAW tool definitions for Claude
	 */
	private getDAWTools(): any[] {
		return [
			{
				name: 'control_playback',
				description: 'Control DAW playback (play, stop, pause, record)',
				input_schema: {
					type: 'object',
					properties: {
						action: {
							type: 'string',
							enum: ['play', 'stop', 'pause', 'record'],
							description: 'The playback action to perform'
						}
					},
					required: ['action']
				}
			},
			{
				name: 'adjust_track_volume',
				description: 'Adjust the volume of a track',
				input_schema: {
					type: 'object',
					properties: {
						track_id: {
							type: 'string',
							description: 'ID of the track (or "selected" for current track)'
						},
						volume_db: {
							type: 'number',
							description: 'Volume in dB (-60 to +6)'
						},
						relative: {
							type: 'boolean',
							description: 'If true, adjust relative to current volume'
						}
					},
					required: ['track_id', 'volume_db']
				}
			},
			{
				name: 'add_track',
				description: 'Add a new track to the project',
				input_schema: {
					type: 'object',
					properties: {
						type: {
							type: 'string',
							enum: ['audio', 'midi', 'aux'],
							description: 'Type of track to add'
						},
						name: {
							type: 'string',
							description: 'Name for the new track'
						}
					},
					required: ['type']
				}
			},
			{
				name: 'toggle_track_mute',
				description: 'Mute or unmute a track',
				input_schema: {
					type: 'object',
					properties: {
						track_id: {
							type: 'string',
							description: 'ID of the track'
						},
						mute: {
							type: 'boolean',
							description: 'True to mute, false to unmute'
						}
					},
					required: ['track_id', 'mute']
				}
			},
			{
				name: 'toggle_track_solo',
				description: 'Solo or unsolo a track',
				input_schema: {
					type: 'object',
					properties: {
						track_id: {
							type: 'string',
							description: 'ID of the track'
						},
						solo: {
							type: 'boolean',
							description: 'True to solo, false to unsolo'
						}
					},
					required: ['track_id', 'solo']
				}
			},
			{
				name: 'generate_beat',
				description: 'Generate a drum beat/pattern (requires Module 7)',
				input_schema: {
					type: 'object',
					properties: {
						style: {
							type: 'string',
							description: 'Beat style (e.g., "trap", "lo-fi", "house")'
						},
						bpm: {
							type: 'number',
							description: 'Tempo in BPM'
						},
						bars: {
							type: 'number',
							description: 'Number of bars'
						}
					},
					required: ['style']
				}
			},
			{
				name: 'add_effect',
				description: 'Add an effect to a track',
				input_schema: {
					type: 'object',
					properties: {
						track_id: {
							type: 'string',
							description: 'ID of the track'
						},
						effect_type: {
							type: 'string',
							enum: ['eq', 'compressor', 'reverb', 'delay', 'distortion', 'chorus', 'phaser'],
							description: 'Type of effect to add'
						}
					},
					required: ['track_id', 'effect_type']
				}
			},
			{
				name: 'set_tempo',
				description: 'Set the project tempo',
				input_schema: {
					type: 'object',
					properties: {
						bpm: {
							type: 'number',
							description: 'Tempo in beats per minute (30-300)'
						}
					},
					required: ['bpm']
				}
			}
		];
	}

	/**
	 * Execute a DAW action
	 */
	private async executeAction(actionName: string, parameters: any): Promise<any> {
		logger.info(`VoiceInterface: Executing action: ${actionName}`, parameters);

		try {
			switch (actionName) {
				case 'control_playback':
					return await this.handlePlayback(parameters);
				case 'adjust_track_volume':
					return await this.handleVolumeAdjust(parameters);
				case 'add_track':
					return await this.handleAddTrack(parameters);
				case 'toggle_track_mute':
					return await this.handleToggleMute(parameters);
				case 'toggle_track_solo':
					return await this.handleToggleSolo(parameters);
				case 'generate_beat':
					return await this.handleGenerateBeat(parameters);
				case 'add_effect':
					return await this.handleAddEffect(parameters);
				case 'set_tempo':
					return await this.handleSetTempo(parameters);
				default:
					throw new Error(`Unknown action: ${actionName}`);
			}
		} catch (error) {
			logger.error(`VoiceInterface: Error executing action ${actionName}:`, error);
			throw error;
		}
	}

	/**
	 * Handle playback control
	 */
	private async handlePlayback(params: { action: string }): Promise<void> {
		const { AudioEngine } = await import('../audio/AudioEngine');
		const audioEngine = AudioEngine.getInstance();

		switch (params.action) {
			case 'play':
				audioEngine.play();
				break;
			case 'stop':
				audioEngine.stop();
				break;
			case 'pause':
				audioEngine.pause();
				break;
			case 'record':
				// TODO: Implement recording start
				logger.info('Recording not yet implemented');
				break;
		}
	}

	/**
	 * Handle volume adjustment
	 */
	private async handleVolumeAdjust(params: {
		track_id: string;
		volume_db: number;
		relative?: boolean;
	}): Promise<void> {
		const { AudioEngine } = await import('../audio/AudioEngine');
		const audioEngine = AudioEngine.getInstance();

		let trackId = params.track_id;

		// Handle "selected" track
		if (trackId === 'selected') {
			// TODO: Get selected track from track manager
			logger.warn('Selected track not yet implemented');
			return;
		}

		const track = audioEngine.getTrack(trackId);
		if (!track) {
			throw new Error(`Track not found: ${trackId}`);
		}

		if (params.relative) {
			const currentVolume = track.getVolume();
			track.setVolume(currentVolume + params.volume_db);
		} else {
			track.setVolume(params.volume_db);
		}
	}

	/**
	 * Handle add track
	 */
	private async handleAddTrack(params: {
		type: 'audio' | 'midi' | 'aux';
		name?: string;
	}): Promise<void> {
		const { AudioEngine } = await import('../audio/AudioEngine');
		const audioEngine = AudioEngine.getInstance();

		const trackName = params.name || `${params.type.charAt(0).toUpperCase() + params.type.slice(1)} Track`;

		audioEngine.addTrack({
			id: `track-${Date.now()}`,
			name: trackName,
			type: params.type,
			color: '#00d9ff'
		});
	}

	/**
	 * Handle toggle mute
	 */
	private async handleToggleMute(params: { track_id: string; mute: boolean }): Promise<void> {
		const { AudioEngine } = await import('../audio/AudioEngine');
		const audioEngine = AudioEngine.getInstance();

		const track = audioEngine.getTrack(params.track_id);
		if (!track) {
			throw new Error(`Track not found: ${params.track_id}`);
		}

		track.setMute(params.mute);
	}

	/**
	 * Handle toggle solo
	 */
	private async handleToggleSolo(params: { track_id: string; solo: boolean }): Promise<void> {
		const { AudioEngine } = await import('../audio/AudioEngine');
		const audioEngine = AudioEngine.getInstance();

		const track = audioEngine.getTrack(params.track_id);
		if (!track) {
			throw new Error(`Track not found: ${params.track_id}`);
		}

		track.setSolo(params.solo);
	}

	/**
	 * Handle beat generation (requires Module 7)
	 */
	private async handleGenerateBeat(params: {
		style: string;
		bpm?: number;
		bars?: number;
	}): Promise<void> {
		logger.info('Beat generation requested (Module 7 not yet implemented):', params);
		this.emitEvent('generate-beat-requested', params);
		throw new Error('Beat generation not yet implemented. Module 7 required.');
	}

	/**
	 * Handle add effect
	 */
	private async handleAddEffect(params: {
		track_id: string;
		effect_type: string;
	}): Promise<void> {
		logger.info('Add effect requested:', params);
		this.emitEvent('add-effect-requested', params);
		// TODO: Integrate with Module 5 effects
	}

	/**
	 * Handle set tempo
	 */
	private async handleSetTempo(params: { bpm: number }): Promise<void> {
		const { AudioEngine } = await import('../audio/AudioEngine');
		const audioEngine = AudioEngine.getInstance();

		if (params.bpm < 30 || params.bpm > 300) {
			throw new Error('BPM must be between 30 and 300');
		}

		audioEngine.setTempo(params.bpm);
	}

	/**
	 * Speak text using ElevenLabs TTS
	 */
	private async speak(text: string): Promise<void> {
		this.emitEvent('speaking', { text });

		// If no API key, use browser TTS as fallback
		if (!this.elevenLabsApiKey) {
			logger.warn('VoiceInterface: No ElevenLabs API key, using browser TTS');
			this.speakWithBrowserTTS(text);
			return;
		}

		try {
			const response = await fetch(
				'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
				{
					method: 'POST',
					headers: {
						Accept: 'audio/mpeg',
						'Content-Type': 'application/json',
						'xi-api-key': this.elevenLabsApiKey
					},
					body: JSON.stringify({
						text: text,
						model_id: 'eleven_turbo_v2_5',
						voice_settings: {
							stability: 0.5,
							similarity_boost: 0.75,
							style: 0.0,
							use_speaker_boost: true
						}
					})
				}
			);

			if (!response.ok) {
				throw new Error(`ElevenLabs API error: ${response.status}`);
			}

			const audioBlob = await response.blob();
			const audioUrl = URL.createObjectURL(audioBlob);
			const audio = new Audio(audioUrl);

			await audio.play();

			audio.onended = () => {
				URL.revokeObjectURL(audioUrl);
				this.emitEvent('speaking-done', {});
			};
		} catch (error) {
			logger.error('VoiceInterface: TTS error:', error);
			this.emitEvent('tts-error', { error });

			// Fallback to browser TTS
			this.speakWithBrowserTTS(text);
		}
	}

	/**
	 * Fallback: Speak using browser's native TTS
	 */
	private speakWithBrowserTTS(text: string): void {
		if ('speechSynthesis' in window) {
			const utterance = new SpeechSynthesisUtterance(text);
			utterance.rate = 1.0;
			utterance.pitch = 1.0;
			utterance.volume = 1.0;

			utterance.onend = () => {
				this.emitEvent('speaking-done', {});
			};

			window.speechSynthesis.speak(utterance);
		} else {
			logger.warn('VoiceInterface: Browser TTS not supported');
			this.emitEvent('speaking-done', {});
		}
	}

	/**
	 * Emit custom event
	 */
	private emitEvent(eventName: string, data: any): void {
		const event = new CustomEvent(`voice:${eventName}`, { detail: data });
		window.dispatchEvent(event);
	}

	/**
	 * Reset conversation
	 */
	resetConversation(): void {
		this.conversationHistory = [];
		this.wakeWordDetected = false;
		logger.info('VoiceInterface: Conversation reset');
	}

	/**
	 * Get listening state
	 */
	getIsListening(): boolean {
		return this.isListening;
	}

	/**
	 * Cleanup
	 */
	dispose(): void {
		this.stopListening();
		this.conversationHistory = [];
		logger.info('VoiceInterface: Disposed');
	}
}
