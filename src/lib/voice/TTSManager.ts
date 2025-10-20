import { logger } from '$lib/utils/logger';

/**
 * TTS Manager - Text-to-Speech with ElevenLabs
 * Handles mood-based voice modulation for Jarvis personality
 * @module voice/TTSManager
 */

export type JarvisMood = 'supportive' | 'excited' | 'challenging' | 'chill';

export interface TTSConfig {
	provider: 'elevenlabs' | 'browser';
	apiKey?: string;
	voiceId?: string;
	model?: string;
}

export interface VoiceSettings {
	stability: number; // 0-1
	similarity_boost: number; // 0-1
	style?: number; // 0-1
	use_speaker_boost?: boolean;
}

/**
 * TTS Manager with mood-based voice modulation
 */
export class TTSManager {
	private provider: 'elevenlabs' | 'browser';
	private apiKey?: string;
	private voiceId: string;
	private model: string;
	private audioQueue: Audio[] = [];
	private isSpeaking: boolean = false;

	constructor(config: TTSConfig) {
		this.provider = config.provider || 'elevenlabs';
		this.apiKey = config.apiKey || import.meta.env.VITE_ELEVENLABS_API_KEY;
		this.voiceId = config.voiceId || '21m00Tcm4TlvDq8ikWAM'; // Default ElevenLabs voice
		this.model = config.model || 'eleven_turbo_v2_5'; // Lowest latency model
	}

	/**
	 * Speak text with mood-based voice modulation
	 */
	async speak(text: string, mood: JarvisMood = 'supportive'): Promise<void> {
		if (this.provider === 'elevenlabs' && this.apiKey) {
			await this.speakWithElevenLabs(text, mood);
		} else {
			await this.speakWithBrowser(text, mood);
		}
	}

	/**
	 * Speak using ElevenLabs TTS with streaming
	 */
	private async speakWithElevenLabs(text: string, mood: JarvisMood): Promise<void> {
		const settings = this.getMoodVoiceSettings(mood);

		try {
			const response = await fetch(
				`https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}/stream`,
				{
					method: 'POST',
					headers: {
						Accept: 'audio/mpeg',
						'Content-Type': 'application/json',
						'xi-api-key': this.apiKey!
					},
					body: JSON.stringify({
						text,
						model_id: this.model,
						voice_settings: settings
					})
				}
			);

			if (!response.ok) {
				throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
			}

			// Stream audio
			const audioBlob = await response.blob();
			await this.playAudio(audioBlob);
		} catch (error) {
			logger.error('ElevenLabs TTS error:', error);
			// Fallback to browser TTS
			await this.speakWithBrowser(text, mood);
		}
	}

	/**
	 * Get voice settings based on Jarvis mood
	 */
	private getMoodVoiceSettings(mood: JarvisMood): VoiceSettings {
		const moodSettings: Record<JarvisMood, VoiceSettings> = {
			supportive: {
				stability: 0.7,
				similarity_boost: 0.8,
				style: 0.3,
				use_speaker_boost: true
			},
			excited: {
				stability: 0.5,
				similarity_boost: 0.9,
				style: 0.7,
				use_speaker_boost: true
			},
			challenging: {
				stability: 0.8,
				similarity_boost: 0.7,
				style: 0.5,
				use_speaker_boost: true
			},
			chill: {
				stability: 0.9,
				similarity_boost: 0.6,
				style: 0.2,
				use_speaker_boost: false
			}
		};

		return moodSettings[mood];
	}

	/**
	 * Play audio blob
	 */
	private async playAudio(audioBlob: Blob): Promise<void> {
		return new Promise((resolve, reject) => {
			const audioUrl = URL.createObjectURL(audioBlob);
			const audio = new Audio(audioUrl);

			this.isSpeaking = true;

			audio.onended = () => {
				URL.revokeObjectURL(audioUrl);
				this.isSpeaking = false;
				this.emitEvent('speaking-done', {});
				resolve();
			};

			audio.onerror = (error) => {
				URL.revokeObjectURL(audioUrl);
				this.isSpeaking = false;
				this.emitEvent('tts-error', { error });
				reject(error);
			};

			this.emitEvent('speaking-started', { text: audioBlob.size });
			audio.play().catch(reject);
		});
	}

	/**
	 * Speak using browser's Web Speech API
	 */
	private async speakWithBrowser(text: string, mood: JarvisMood): Promise<void> {
		if (!('speechSynthesis' in window)) {
			logger.warn('Browser TTS not supported');
			return;
		}

		return new Promise((resolve) => {
			const utterance = new SpeechSynthesisUtterance(text);

			// Adjust voice parameters based on mood
			const moodParams = this.getBrowserMoodParams(mood);
			utterance.rate = moodParams.rate;
			utterance.pitch = moodParams.pitch;
			utterance.volume = 1.0;

			this.isSpeaking = true;

			utterance.onend = () => {
				this.isSpeaking = false;
				this.emitEvent('speaking-done', {});
				resolve();
			};

			utterance.onerror = (error) => {
				this.isSpeaking = false;
				this.emitEvent('tts-error', { error });
				resolve();
			};

			this.emitEvent('speaking-started', { text });
			window.speechSynthesis.speak(utterance);
		});
	}

	/**
	 * Get browser TTS parameters based on mood
	 */
	private getBrowserMoodParams(mood: JarvisMood): { rate: number; pitch: number } {
		const moodParams: Record<JarvisMood, { rate: number; pitch: number }> = {
			supportive: { rate: 1.0, pitch: 1.0 },
			excited: { rate: 1.2, pitch: 1.1 },
			challenging: { rate: 0.95, pitch: 0.95 },
			chill: { rate: 0.9, pitch: 0.9 }
		};

		return moodParams[mood];
	}

	/**
	 * Stop speaking immediately
	 */
	stop(): void {
		if ('speechSynthesis' in window) {
			window.speechSynthesis.cancel();
		}
		this.isSpeaking = false;
		this.emitEvent('speaking-stopped', {});
	}

	/**
	 * Check if currently speaking
	 */
	getIsSpeaking(): boolean {
		return this.isSpeaking;
	}

	/**
	 * Emit custom event
	 */
	private emitEvent(eventName: string, data: any): void {
		const event = new CustomEvent(`tts:${eventName}`, { detail: data });
		window.dispatchEvent(event);
	}

	/**
	 * Cleanup
	 */
	dispose(): void {
		this.stop();
	}
}
