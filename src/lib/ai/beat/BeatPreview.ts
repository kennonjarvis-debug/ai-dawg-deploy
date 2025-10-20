/**
 * Beat Preview System
 * Pre-loads beat candidates for instant playback (<100ms)
 */

import * as Tone from 'tone';
import type { GeneratedBeat } from './BeatGenerator';

import { logger } from '$lib/utils/logger';
export interface BeatMetadata {
	id: string;
	title: string;
	previewUrl: string;
	tags: {
		style: string;
		mood: string[];
		tempo: number;
	};
}

export class BeatPreview {
	private players: Map<string, Tone.Player> = new Map();
	private currentlyPlaying: string | null = null;
	private isInitialized = false;

	/**
	 * Pre-load all 3 beat candidates into memory
	 * This ensures instant playback when user clicks
	 */
	async loadCandidates(beats: BeatMetadata[]): Promise<void> {
		// Initialize Tone.js if needed
		if (!this.isInitialized) {
			await Tone.start();
			this.isInitialized = true;
		}

		// Pre-load all candidates in parallel
		const loadPromises = beats.map(async (beat) => {
			const player = new Tone.Player({
				url: beat.previewUrl,
				loop: true,
				autostart: false
			}).toDestination();

			// Wait for buffer to load
			await Tone.loaded();

			this.players.set(beat.id, player);
		});

		await Promise.all(loadPromises);
		logger.info(`✅ Pre-loaded ${beats.length} beat candidates`);
	}

	/**
	 * Play a beat candidate instantly
	 * Should take <100ms from click to sound
	 */
	async play(beatId: string): Promise<void> {
		// Stop currently playing beat
		if (this.currentlyPlaying) {
			const currentPlayer = this.players.get(this.currentlyPlaying);
			if (currentPlayer) {
				currentPlayer.stop();
			}
		}

		// Start new beat
		const player = this.players.get(beatId);
		if (!player) {
			throw new Error(`Beat ${beatId} not loaded`);
		}

		// Sync to transport for beat-accurate looping
		Tone.Transport.start();
		player.start();

		this.currentlyPlaying = beatId;
	}

	/**
	 * Stop playback
	 */
	stop(): void {
		if (this.currentlyPlaying) {
			const player = this.players.get(this.currentlyPlaying);
			if (player) {
				player.stop();
			}
			this.currentlyPlaying = null;
		}
	}

	/**
	 * Get currently playing beat ID
	 */
	getCurrentlyPlaying(): string | null {
		return this.currentlyPlaying;
	}

	/**
	 * Clean up all loaded beats
	 */
	dispose(): void {
		this.stop();

		for (const player of this.players.values()) {
			player.dispose();
		}

		this.players.clear();
	}

	/**
	 * Check if a beat is loaded
	 */
	isLoaded(beatId: string): boolean {
		return this.players.has(beatId);
	}
}

/**
 * MIDI-to-Audio renderer for beat preview generation
 * Converts generated MIDI patterns to audio files
 */
export class BeatMIDIRenderer {
	private synths: {
		kick: Tone.MembraneSynth;
		snare: Tone.NoiseSynth;
		hihat: Tone.MetalSynth;
	};

	constructor() {
		// Create synths for drum sounds
		this.synths = {
			kick: new Tone.MembraneSynth({
				pitchDecay: 0.05,
				octaves: 6,
				oscillator: { type: 'sine' },
				envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
			}).toDestination(),

			snare: new Tone.NoiseSynth({
				noise: { type: 'white' },
				envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
			}).toDestination(),

			hihat: new Tone.MetalSynth({
				frequency: 200,
				envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
				harmonicity: 5.1,
				modulationIndex: 32,
				resonance: 4000,
				octaves: 1.5
			}).toDestination()
		};
	}

	/**
	 * Render MIDI beat to audio buffer
	 */
	async renderBeat(beat: GeneratedBeat): Promise<AudioBuffer> {
		const durationBars = Math.max(
			...beat.midi.kick.map((n) => n.time + n.duration),
			...beat.midi.snare.map((n) => n.time + n.duration),
			...beat.midi.hihat.map((n) => n.time + n.duration)
		);

		const durationSec = (durationBars / beat.tags.tempo) * 60 * 4; // bars to seconds

		// Create offline context for rendering
		const offlineContext = new Tone.OfflineContext(2, durationSec, Tone.context.sampleRate);

		// Schedule all notes
		const now = offlineContext.now();

		// Kick notes
		beat.midi.kick.forEach((note) => {
			const time = now + (note.time / beat.tags.tempo) * 60 * 4;
			this.synths.kick.triggerAttackRelease('C1', note.duration, time, note.velocity / 127);
		});

		// Snare notes
		beat.midi.snare.forEach((note) => {
			const time = now + (note.time / beat.tags.tempo) * 60 * 4;
			this.synths.snare.triggerAttackRelease(note.duration, time, note.velocity / 127);
		});

		// Hi-hat notes
		beat.midi.hihat.forEach((note) => {
			const time = now + (note.time / beat.tags.tempo) * 60 * 4;
			this.synths.hihat.triggerAttackRelease(note.duration, time, note.velocity / 127);
		});

		// Render
		const buffer = await offlineContext.render();
		return buffer;
	}

	/**
	 * Convert AudioBuffer to WAV blob for preview
	 */
	audioBufferToWav(buffer: AudioBuffer): Blob {
		const length = buffer.length * buffer.numberOfChannels * 2;
		const wav = new ArrayBuffer(44 + length);
		const view = new DataView(wav);

		// Write WAV header
		const writeString = (offset: number, string: string) => {
			for (let i = 0; i < string.length; i++) {
				view.setUint8(offset + i, string.charCodeAt(i));
			}
		};

		writeString(0, 'RIFF');
		view.setUint32(4, 36 + length, true);
		writeString(8, 'WAVE');
		writeString(12, 'fmt ');
		view.setUint32(16, 16, true);
		view.setUint16(20, 1, true); // PCM
		view.setUint16(22, buffer.numberOfChannels, true);
		view.setUint32(24, buffer.sampleRate, true);
		view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
		view.setUint16(32, buffer.numberOfChannels * 2, true);
		view.setUint16(34, 16, true); // 16-bit
		writeString(36, 'data');
		view.setUint32(40, length, true);

		// Write audio data
		let offset = 44;
		for (let i = 0; i < buffer.length; i++) {
			for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
				const sample = buffer.getChannelData(ch)[i];
				view.setInt16(offset, sample * 0x7fff, true);
				offset += 2;
			}
		}

		return new Blob([wav], { type: 'audio/wav' });
	}

	dispose(): void {
		this.synths.kick.dispose();
		this.synths.snare.dispose();
		this.synths.hihat.dispose();
	}
}
