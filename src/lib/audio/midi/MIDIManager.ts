/**
 * MIDIManager - DAWG AI
 * Manages MIDI recording, playback, and WebMIDI input
 * @module audio/midi/MIDIManager
 */

import * as Tone from 'tone';
import type { UUID, TimeInSeconds } from '../../types/core';
import type {
	MIDINote,
	MIDIControlChange,
	MIDIPitchBend,
	MIDIRecordingState,
	MIDIInputConfig,
	MIDIInstrumentConfig,
	MIDIInstrumentType
} from './types';
import { MIDIClip } from './MIDIClip';
import { AudioEngineError, ErrorCode } from '../errors';

import { logger } from '$lib/utils/logger';
/**
 * MIDI Manager - Handles recording and playback
 */
export class MIDIManager {
	private midiAccess: MIDIAccess | null = null;
	private activeInput: MIDIInput | null = null;
	private recordingState: MIDIRecordingState | null = null;

	// MIDI instruments
	private instruments: Map<UUID, any> = new Map(); // trackId -> Tone instrument
	private defaultInstrument: Tone.PolySynth | null = null;

	// Scheduled notes for playback
	private scheduledEvents: Map<UUID, Tone.ToneEvent[]> = new Map(); // clipId -> events

	constructor() {
		this.initializeDefaultInstrument();
	}

	// ===== WebMIDI Initialization =====

	/**
	 * Request MIDI access
	 */
	async initialize(): Promise<boolean> {
		if (!navigator.requestMIDIAccess) {
			logger.error('WebMIDI not supported in this browser');
			return false;
		}

		try {
			this.midiAccess = await navigator.requestMIDIAccess();
			logger.info('MIDI access granted');
			return true;
		} catch (error) {
			logger.error('MIDI access denied:', error);
			return false;
		}
	}

	/**
	 * Get available MIDI inputs
	 */
	getInputs(): MIDIInput[] {
		if (!this.midiAccess) return [];
		return Array.from(this.midiAccess.inputs.values());
	}

	/**
	 * Select MIDI input device
	 */
	selectInput(deviceId?: string): boolean {
		if (!this.midiAccess) return false;

		// Disconnect current input
		if (this.activeInput) {
			this.activeInput.onmidimessage = null;
		}

		// Find and connect new input
		if (deviceId) {
			const input = this.midiAccess.inputs.get(deviceId);
			if (input) {
				this.activeInput = input;
				return true;
			}
		} else {
			// Use first available input
			const inputs = this.getInputs();
			if (inputs.length > 0) {
				this.activeInput = inputs[0];
				return true;
			}
		}

		return false;
	}

	// ===== MIDI Recording =====

	/**
	 * Start recording MIDI
	 */
	startRecording(trackId: UUID): void {
		if (!this.activeInput) {
			throw new AudioEngineError('No MIDI input selected', ErrorCode.INVALID_PARAMETER);
		}

		if (this.recordingState?.isRecording) {
			throw new AudioEngineError('Already recording', ErrorCode.RECORDING_ALREADY_STARTED);
		}

		// Initialize recording state
		this.recordingState = {
			isRecording: true,
			startTime: Tone.now(),
			events: [],
			activeNotes: new Map()
		};

		// Set up MIDI message handler
		this.activeInput.onmidimessage = (event) => {
			this.handleMIDIMessage(event);
		};

		logger.info('MIDI recording started');
	}

	/**
	 * Stop recording and create clip
	 */
	stopRecording(trackId: UUID): MIDIClip | null {
		if (!this.recordingState?.isRecording) {
			throw new AudioEngineError('Not recording', ErrorCode.RECORDING_NOT_STARTED);
		}

		// Stop recording
		this.recordingState.isRecording = false;

		if (this.activeInput) {
			this.activeInput.onmidimessage = null;
		}

		// Process recorded events into notes
		const notes = this.processRecordedEvents();

		if (notes.length === 0) {
			logger.warn('No notes recorded');
			this.recordingState = null;
			return null;
		}

		// Create clip
		const clip = new MIDIClip({
			trackId,
			name: `MIDI Recording ${new Date().toLocaleTimeString()}`,
			startTime: 0,
			notes
		});

		this.recordingState = null;
		logger.info(`MIDI recording stopped: ${notes.length} notes`);

		return clip;
	}

	/**
	 * Handle incoming MIDI message
	 */
	private handleMIDIMessage(event: MIDIMessageEvent): void {
		if (!this.recordingState?.isRecording) return;

		const [status, data1, data2] = event.data;
		const command = status & 0xf0;
		const channel = status & 0x0f;
		const timestamp = event.timeStamp / 1000; // Convert to seconds
		const relativeTime = timestamp - this.recordingState.startTime;

		switch (command) {
			case 0x90: // Note On
				if (data2 > 0) {
					// Velocity > 0 = note on
					this.recordingState.activeNotes.set(data1, {
						startTime: relativeTime,
						velocity: data2
					});
				} else {
					// Velocity = 0 = note off
					this.handleNoteOff(data1, relativeTime);
				}
				break;

			case 0x80: // Note Off
				this.handleNoteOff(data1, relativeTime);
				break;

			case 0xb0: // Control Change
				this.recordingState.events.push({
					type: 'cc',
					data: {
						id: this.generateId(),
						controller: data1,
						value: data2,
						time: relativeTime,
						channel
					}
				});
				break;

			case 0xe0: // Pitch Bend
				const pitchBendValue = ((data2 << 7) | data1) - 8192;
				this.recordingState.events.push({
					type: 'pitchBend',
					data: {
						id: this.generateId(),
						value: pitchBendValue,
						time: relativeTime,
						channel
					}
				});
				break;
		}
	}

	/**
	 * Handle note off event
	 */
	private handleNoteOff(pitch: number, time: TimeInSeconds): void {
		if (!this.recordingState) return;

		const activeNote = this.recordingState.activeNotes.get(pitch);
		if (activeNote) {
			// Create completed note
			const note: MIDINote = {
				id: this.generateId(),
				pitch,
				velocity: activeNote.velocity,
				time: activeNote.startTime,
				duration: time - activeNote.startTime
			};

			this.recordingState.events.push({
				type: 'note',
				data: note
			});

			this.recordingState.activeNotes.delete(pitch);
		}
	}

	/**
	 * Process recorded events into notes array
	 */
	private processRecordedEvents(): MIDINote[] {
		if (!this.recordingState) return [];

		// Extract notes from events
		const notes = this.recordingState.events
			.filter((e) => e.type === 'note')
			.map((e) => e.data as MIDINote);

		// Close any still-active notes
		this.recordingState.activeNotes.forEach((noteInfo, pitch) => {
			const duration = Tone.now() - this.recordingState!.startTime - noteInfo.startTime;
			notes.push({
				id: this.generateId(),
				pitch,
				velocity: noteInfo.velocity,
				time: noteInfo.startTime,
				duration: Math.max(0.1, duration) // Minimum 0.1s duration
			});
		});

		return notes;
	}

	// ===== MIDI Playback =====

	/**
	 * Initialize default instrument
	 */
	private initializeDefaultInstrument(): void {
		this.defaultInstrument = new Tone.PolySynth(Tone.Synth, {
			maxPolyphony: 128,
			volume: -6
		}).toDestination();
	}

	/**
	 * Create instrument for track
	 */
	createInstrument(trackId: UUID, config: MIDIInstrumentConfig): any {
		let instrument: any;

		switch (config.type) {
			case 'synth':
				instrument = new Tone.Synth().toDestination();
				break;

			case 'polySynth':
				instrument = new Tone.PolySynth(Tone.Synth, {
					maxPolyphony: config.polyphony || 32,
					...(config.options || {})
				}).toDestination();
				break;

			case 'membraneSynth':
				instrument = new Tone.MembraneSynth().toDestination();
				break;

			case 'fmSynth':
				instrument = new Tone.FMSynth().toDestination();
				break;

			case 'sampler':
				// Sampler requires sample URLs
				instrument = new Tone.Sampler(config.options || {}).toDestination();
				break;

			default:
				instrument = new Tone.PolySynth().toDestination();
		}

		if (config.volume !== undefined) {
			instrument.volume.value = config.volume;
		}

		this.instruments.set(trackId, instrument);
		return instrument;
	}

	/**
	 * Get instrument for track
	 */
	getInstrument(trackId: UUID): any {
		return this.instruments.get(trackId) || this.defaultInstrument;
	}

	/**
	 * Schedule MIDI clip for playback
	 */
	scheduleClip(clip: MIDIClip, trackId: UUID): void {
		const instrument = this.getInstrument(trackId);
		if (!instrument) return;

		const events: Tone.ToneEvent[] = [];

		// Schedule each note
		clip.getNotes().forEach((note) => {
			const absoluteTime = clip.startTime + note.time;

			// Create Tone event for note
			const event = new Tone.ToneEvent((time) => {
				// Convert MIDI note to frequency
				const freq = Tone.Frequency(note.pitch, 'midi').toFrequency();

				// Convert velocity (0-127) to gain (0-1)
				const velocity = note.velocity / 127;

				// Trigger note
				if (instrument.triggerAttackRelease) {
					instrument.triggerAttackRelease(freq, note.duration, time, velocity);
				} else if (instrument.triggerAttack && instrument.triggerRelease) {
					instrument.triggerAttack(freq, time, velocity);
					instrument.triggerRelease(freq, time + note.duration);
				}
			});

			// Schedule at absolute time
			event.start(absoluteTime);
			events.push(event);
		});

		// Store scheduled events for cleanup
		this.scheduledEvents.set(clip.id, events);
	}

	/**
	 * Stop playback of clip
	 */
	stopClip(clipId: UUID): void {
		const events = this.scheduledEvents.get(clipId);
		if (events) {
			events.forEach((event) => event.dispose());
			this.scheduledEvents.delete(clipId);
		}
	}

	/**
	 * Stop all playback
	 */
	stopAll(): void {
		this.scheduledEvents.forEach((events) => {
			events.forEach((event) => event.dispose());
		});
		this.scheduledEvents.clear();

		// Stop all instruments
		this.instruments.forEach((instrument) => {
			if (instrument.releaseAll) {
				instrument.releaseAll();
			}
		});
	}

	// ===== Cleanup =====

	/**
	 * Dispose resources
	 */
	dispose(): void {
		this.stopAll();

		// Dispose instruments
		this.instruments.forEach((instrument) => {
			if (instrument.dispose) {
				instrument.dispose();
			}
		});
		this.instruments.clear();

		if (this.defaultInstrument) {
			this.defaultInstrument.dispose();
			this.defaultInstrument = null;
		}

		// Disconnect MIDI input
		if (this.activeInput) {
			this.activeInput.onmidimessage = null;
			this.activeInput = null;
		}
	}

	/**
	 * Generate unique ID
	 */
	private generateId(): UUID {
		return `midi-event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}
}

/**
 * Global MIDI manager instance
 */
let globalMIDIManager: MIDIManager | null = null;

/**
 * Get global MIDI manager
 */
export function getMIDIManager(): MIDIManager {
	if (!globalMIDIManager) {
		globalMIDIManager = new MIDIManager();
	}
	return globalMIDIManager;
}
