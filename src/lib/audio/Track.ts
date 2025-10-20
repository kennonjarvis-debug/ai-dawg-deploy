/**
 * Track - DAWG AI Audio Engine
 * Represents an audio/MIDI track with recording, playback, and effects
 * @module audio/Track
 */

import * as Tone from 'tone';
import type { UUID, Decibels, Color } from '../types/core';
import { Clip } from './Clip';
import { MIDIClip } from './midi/MIDIClip';
import { getMIDIManager } from './midi/MIDIManager';
import type { MIDIInstrumentConfig } from './midi/types';
import { EffectsRack } from './effects/EffectsRack';
import { TrackError, RecordingError, ErrorCode } from './errors';

import { logger } from '$lib/utils/logger';
/**
 * Track configuration
 */
export interface TrackConfig {
	id?: UUID;
	name: string;
	type: 'audio' | 'midi' | 'aux';
	color?: Color;
}

/**
 * Track class - Multi-track audio with recording and effects
 */
export class Track {
	// Properties
	public readonly id: UUID;
	public name: string;
	public readonly type: 'audio' | 'midi' | 'aux';
	public color: Color;

	// Audio nodes
	public readonly input: Tone.Gain;
	public readonly output: Tone.Gain;
	public readonly channel: Tone.Channel;

	// Effects
	private effectsRack: EffectsRack;

	// Players and clips
	private clips: Clip[] = [];
	private midiClips: MIDIClip[] = [];
	private players: Map<string, Tone.Player> = new Map();

	// Recording
	private recorder: Tone.Recorder | null = null;
	private recordingInput: Tone.UserMedia | null = null;
	private isRecording: boolean = false;

	// MIDI
	private instrument: any = null; // Tone.js instrument for MIDI playback

	// Sends (for aux/bus routing)
	private sends: Map<UUID, Tone.Send> = new Map();

	// Meter
	private meter: Tone.Meter;

	constructor(config: TrackConfig) {
		this.id = config.id || this.generateId();
		this.name = config.name;
		this.type = config.type;
		this.color = config.color || this.generateRandomColor();

		// Create audio nodes
		this.input = new Tone.Gain(1);
		this.channel = new Tone.Channel({
			volume: 0,
			pan: 0,
			mute: false,
			solo: false
		});
		this.output = new Tone.Gain(1);

		// Create effects rack
		this.effectsRack = new EffectsRack();

		// Create meter
		this.meter = new Tone.Meter({ channels: 2, smoothing: 0.8 });

		// Connect signal chain: input -> effects -> channel -> meter -> output
		this.input.connect(this.effectsRack.getInput());
		this.effectsRack.connect(this.channel);
		this.channel.connect(this.meter);
		this.meter.connect(this.output);
	}

	// ===== Audio Management =====

	/**
	 * Load audio from URL
	 * @param url - Audio file URL
	 */
	async loadAudio(url: string): Promise<void> {
		try {
			const player = new Tone.Player(url);
			await player.load(url);

			// Store player
			this.players.set(url, player);

			// Connect to input
			player.connect(this.input);

			logger.info(`Track ${this.name}: Loaded audio from ${url}`);
		} catch (error) {
			throw new TrackError(
				`Failed to load audio: ${error}`,
				ErrorCode.FILE_LOAD_ERROR,
				this.id
			);
		}
	}

	/**
	 * Add a clip to the track
	 * @param clip - Clip to add
	 */
	addClip(clip: Clip): void {
		// Validate clip belongs to this track
		if (clip.trackId !== this.id) {
			clip.trackId = this.id;
		}

		this.clips.push(clip);

		// Schedule clip for playback
		this.scheduleClip(clip);
	}

	/**
	 * Remove a clip from the track
	 * @param clipId - Clip ID to remove
	 */
	removeClip(clipId: UUID): void {
		const index = this.clips.findIndex((c) => c.id === clipId);
		if (index !== -1) {
			const clip = this.clips[index];
			this.unscheduleClip(clip);
			this.clips.splice(index, 1);
		}
	}

	/**
	 * Get all clips
	 */
	getClips(): Clip[] {
		return [...this.clips];
	}

	/**
	 * Add a MIDI clip to the track
	 * @param clip - MIDI clip to add
	 */
	addMIDIClip(clip: MIDIClip): void {
		// Validate clip belongs to this track
		if (clip.trackId !== this.id) {
			clip.trackId = this.id;
		}

		this.midiClips.push(clip);

		// Schedule MIDI clip for playback
		this.scheduleMIDIClip(clip);
	}

	/**
	 * Remove a MIDI clip from the track
	 * @param clipId - MIDI clip ID to remove
	 */
	removeMIDIClip(clipId: UUID): void {
		const index = this.midiClips.findIndex((c) => c.id === clipId);
		if (index !== -1) {
			const clip = this.midiClips[index];
			this.unscheduleMIDIClip(clip);
			this.midiClips.splice(index, 1);
		}
	}

	/**
	 * Get all MIDI clips
	 */
	getMIDIClips(): MIDIClip[] {
		return [...this.midiClips];
	}

	/**
	 * Get all clips (audio and MIDI)
	 */
	getAllClips(): (Clip | MIDIClip)[] {
		return [...this.clips, ...this.midiClips];
	}

	/**
	 * Schedule a clip for playback
	 * @param clip - Clip to schedule
	 */
	private scheduleClip(clip: Clip): void {
		// Create player for this clip
		const player = new Tone.Player(clip.buffer);
		player.connect(this.input);

		// Schedule playback
		Tone.getTransport().schedule((time) => {
			player.start(time, clip.offset, clip.duration);
		}, clip.startTime);

		// Store player reference
		this.players.set(clip.id, player);
	}

	/**
	 * Unschedule a clip
	 * @param clip - Clip to unschedule
	 */
	private unscheduleClip(clip: Clip): void {
		const player = this.players.get(clip.id);
		if (player) {
			player.stop();
			player.dispose();
			this.players.delete(clip.id);
		}
	}

	/**
	 * Schedule a MIDI clip for playback
	 * @param clip - MIDI clip to schedule
	 */
	private scheduleMIDIClip(clip: MIDIClip): void {
		const midiManager = getMIDIManager();
		midiManager.scheduleClip(clip, this.id);
	}

	/**
	 * Unschedule a MIDI clip
	 * @param clip - MIDI clip to unschedule
	 */
	private unscheduleMIDIClip(clip: MIDIClip): void {
		const midiManager = getMIDIManager();
		midiManager.stopClip(clip.id);
	}

	// ===== Recording =====

	/**
	 * Start recording
	 */
	async startRecording(): Promise<void> {
		if (this.type !== 'audio') {
			throw new RecordingError(
				'Only audio tracks can record',
				ErrorCode.INVALID_TRACK_TYPE
			);
		}

		if (this.isRecording) {
			throw new RecordingError(
				'Track is already recording',
				ErrorCode.RECORDING_ALREADY_STARTED
			);
		}

		try {
			// Create recorder
			this.recorder = new Tone.Recorder();

			// Create microphone input
			this.recordingInput = new Tone.UserMedia();
			await this.recordingInput.open();

			// Connect mic to recorder
			this.recordingInput.connect(this.recorder);

			// Also monitor through track (optional)
			this.recordingInput.connect(this.input);

			// Start recording
			this.recorder.start();
			this.isRecording = true;

			logger.info(`Track ${this.name}: Recording started`);
		} catch (error) {
			throw new RecordingError(
				`Failed to start recording: ${error}`,
				ErrorCode.MICROPHONE_ACCESS_DENIED
			);
		}
	}

	/**
	 * Stop recording and create clip
	 * @returns Recorded audio buffer
	 */
	async stopRecording(): Promise<AudioBuffer> {
		if (!this.isRecording || !this.recorder) {
			throw new RecordingError(
				'Track is not recording',
				ErrorCode.RECORDING_NOT_STARTED
			);
		}

		try {
			// Stop recording
			const blob = await this.recorder.stop();
			this.isRecording = false;

			// Close microphone
			if (this.recordingInput) {
				this.recordingInput.close();
				this.recordingInput.dispose();
				this.recordingInput = null;
			}

			// Convert blob to audio buffer
			const arrayBuffer = await blob.arrayBuffer();
			const audioBuffer = await Tone.getContext().decodeAudioData(arrayBuffer);

			// Create clip from recording
			const startTime = Tone.getTransport().seconds;
			const clip = new Clip({
				trackId: this.id,
				buffer: audioBuffer,
				startTime,
				duration: audioBuffer.duration,
				name: `Recording ${new Date().toISOString()}`
			});

			this.addClip(clip);

			logger.info(`Track ${this.name}: Recording stopped, clip created`);

			return audioBuffer;
		} catch (error) {
			throw new RecordingError(
				`Failed to stop recording: ${error}`,
				ErrorCode.OPERATION_FAILED
			);
		} finally {
			// Cleanup
			if (this.recorder) {
				this.recorder.dispose();
				this.recorder = null;
			}
		}
	}

	// ===== MIDI Recording =====

	/**
	 * Start MIDI recording
	 */
	startMIDIRecording(): void {
		if (this.type !== 'midi') {
			throw new RecordingError(
				'Only MIDI tracks can record MIDI',
				ErrorCode.INVALID_TRACK_TYPE
			);
		}

		if (this.isRecording) {
			throw new RecordingError(
				'Track is already recording',
				ErrorCode.RECORDING_ALREADY_STARTED
			);
		}

		try {
			const midiManager = getMIDIManager();
			midiManager.startRecording(this.id);
			this.isRecording = true;

			logger.info(`Track ${this.name}: MIDI recording started`);
		} catch (error) {
			throw new RecordingError(
				`Failed to start MIDI recording: ${error}`,
				ErrorCode.OPERATION_FAILED
			);
		}
	}

	/**
	 * Stop MIDI recording and create MIDI clip
	 * @returns Created MIDI clip or null if no notes recorded
	 */
	stopMIDIRecording(): MIDIClip | null {
		if (!this.isRecording) {
			throw new RecordingError(
				'Track is not recording',
				ErrorCode.RECORDING_NOT_STARTED
			);
		}

		try {
			const midiManager = getMIDIManager();
			const clip = midiManager.stopRecording(this.id);
			this.isRecording = false;

			if (clip) {
				this.addMIDIClip(clip);
				logger.info(`Track ${this.name}: MIDI recording stopped, clip created`);
			} else {
				logger.warn(`Track ${this.name}: MIDI recording stopped, no notes recorded`);
			}

			return clip;
		} catch (error) {
			this.isRecording = false;
			throw new RecordingError(
				`Failed to stop MIDI recording: ${error}`,
				ErrorCode.OPERATION_FAILED
			);
		}
	}

	// ===== MIDI Instrument =====

	/**
	 * Set MIDI instrument for this track
	 * @param config - Instrument configuration
	 */
	setMIDIInstrument(config: MIDIInstrumentConfig): void {
		if (this.type !== 'midi') {
			throw new TrackError(
				'Only MIDI tracks can have instruments',
				ErrorCode.INVALID_TRACK_TYPE,
				this.id
			);
		}

		const midiManager = getMIDIManager();
		this.instrument = midiManager.createInstrument(this.id, config);

		// Connect instrument to track input
		if (this.instrument && this.instrument.connect) {
			this.instrument.connect(this.input);
		}

		logger.info(`Track ${this.name}: MIDI instrument set to ${config.type}`);
	}

	/**
	 * Get MIDI instrument
	 */
	getMIDIInstrument(): any {
		return this.instrument;
	}

	// ===== Effects =====

	/**
	 * Add an effect to the track
	 * @param effect - Effect to add
	 */
	addEffect(effect: any): void {
		this.effectsRack.addEffect(effect);
	}

	/**
	 * Remove an effect
	 * @param effectId - Effect ID to remove
	 */
	removeEffect(effectId: UUID): void {
		this.effectsRack.removeEffect(effectId);
	}

	/**
	 * Get all effects
	 */
	getEffects(): any[] {
		return this.effectsRack.getEffects();
	}

	/**
	 * Get effects rack
	 */
	getEffectsRack(): EffectsRack {
		return this.effectsRack;
	}

	// ===== Sends =====

	/**
	 * Send to another track (aux/bus)
	 * @param target - Target track
	 * @param amount - Send amount (0-1)
	 */
	sendTo(target: Track, amount: number): void {
		// Remove existing send if any
		const existingSend = this.sends.get(target.id);
		if (existingSend) {
			existingSend.dispose();
		}

		// Create new send
		const send = new Tone.Send(amount);
		this.channel.connect(send);
		send.connect(target.input);

		this.sends.set(target.id, send);
	}

	/**
	 * Remove send to track
	 * @param targetId - Target track ID
	 */
	removeSend(targetId: UUID): void {
		const send = this.sends.get(targetId);
		if (send) {
			send.dispose();
			this.sends.delete(targetId);
		}
	}

	// ===== Mixer Controls =====

	/**
	 * Set track volume
	 * @param db - Volume in decibels
	 */
	setVolume(db: Decibels): void {
		this.channel.volume.rampTo(db, 0.1);
	}

	/**
	 * Get track volume
	 */
	getVolume(): Decibels {
		return this.channel.volume.value;
	}

	/**
	 * Set pan position
	 * @param value - Pan value (-1 to 1)
	 */
	setPan(value: number): void {
		if (value < -1 || value > 1) {
			throw new TrackError(
				'Pan value must be between -1 and 1',
				ErrorCode.PARAMETER_OUT_OF_RANGE,
				this.id
			);
		}
		this.channel.pan.value = value;
	}

	/**
	 * Get pan position
	 */
	getPan(): number {
		return this.channel.pan.value;
	}

	/**
	 * Set mute state
	 * @param mute - True to mute
	 */
	setMute(mute: boolean): void {
		this.channel.mute = mute;
	}

	/**
	 * Check if muted
	 */
	isMuted(): boolean {
		return this.channel.mute;
	}

	/**
	 * Set solo state
	 * @param solo - True to solo
	 */
	setSolo(solo: boolean): void {
		this.channel.solo = solo;
	}

	/**
	 * Check if soloed
	 */
	isSoloed(): boolean {
		return this.channel.solo;
	}

	/**
	 * Get current meter level
	 */
	getLevel(): number | number[] {
		return this.meter.getValue();
	}

	// ===== Connection =====

	/**
	 * Connect track to destination
	 * @param destination - Audio destination
	 */
	connect(destination: any): void {
		this.output.connect(destination);
	}

	/**
	 * Disconnect track
	 */
	disconnect(): void {
		this.output.disconnect();
	}

	// ===== Serialization =====

	/**
	 * Serialize track to JSON
	 */
	toJSON() {
		return {
			id: this.id,
			name: this.name,
			type: this.type,
			color: this.color,
			volume: this.getVolume(),
			pan: this.getPan(),
			mute: this.isMuted(),
			solo: this.isSoloed(),
			effects: this.effectsRack.toJSON(),
			clips: this.clips.map((clip) => clip.toJSON()),
			midiClips: this.midiClips.map((clip) => clip.toJSON())
		};
	}

	// ===== Cleanup =====

	/**
	 * Dispose all resources
	 */
	dispose(): void {
		// Stop recording if active
		if (this.isRecording) {
			if (this.type === 'audio') {
				this.stopRecording().catch(logger.error);
			} else if (this.type === 'midi') {
				try {
					this.stopMIDIRecording();
				} catch (e) {
					logger.error(e);
				}
			}
		}

		// Dispose players
		this.players.forEach((player) => player.dispose());
		this.players.clear();

		// Dispose MIDI clips
		this.midiClips.forEach((clip) => {
			this.unscheduleMIDIClip(clip);
		});
		this.midiClips = [];

		// Dispose MIDI instrument
		if (this.instrument && this.instrument.dispose) {
			this.instrument.dispose();
			this.instrument = null;
		}

		// Dispose sends
		this.sends.forEach((send) => send.dispose());
		this.sends.clear();

		// Dispose effects
		this.effectsRack.dispose();

		// Dispose audio nodes
		this.input.dispose();
		this.channel.dispose();
		this.meter.dispose();
		this.output.dispose();

		// Clear clips
		this.clips = [];
	}

	// ===== Utilities =====

	/**
	 * Generate unique ID
	 */
	private generateId(): UUID {
		return `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Generate random color
	 */
	private generateRandomColor(): Color {
		const colors = [
			'#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
			'#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
		];
		return colors[Math.floor(Math.random() * colors.length)];
	}
}
