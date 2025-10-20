/**
 * MasterBus - DAWG AI Audio Engine
 * Master output with metering, limiting, and final processing
 * @module audio/MasterBus
 */

import * as Tone from 'tone';
import type { Decibels } from '../types/core';

import { logger } from '$lib/utils/logger';
/**
 * Master bus configuration
 */
export interface MasterBusConfig {
	volume?: Decibels;
	limiterThreshold?: Decibels;
	meterSmoothingFactor?: number;
}

/**
 * Meter data for visualization
 */
export interface MeterData {
	left: number; // -Infinity to 0 dB
	right: number; // -Infinity to 0 dB
	peak: number; // Peak level
	rms: number; // RMS level
}

/**
 * MasterBus - Final output stage with metering and protection
 */
export class MasterBus {
	private channel: Tone.Channel;
	private limiter: Tone.Limiter;
	private meter: Tone.Meter;
	private analyser: Tone.Analyser;

	// Peak detection
	private peakLeft: number = -Infinity;
	private peakRight: number = -Infinity;
	private peakDecayRate: number = 0.95; // Peak hold decay
	private peakHoldTime: number = 1000; // ms
	private lastPeakTime: number = 0;

	// Clipping detection
	private isClipping: boolean = false;
	private clippingThreshold: number = -0.1; // dB
	private clippingResetTime: number = 100; // ms
	private lastClipTime: number = 0;

	constructor(config: MasterBusConfig = {}) {
		// Create channel (main volume control)
		this.channel = new Tone.Channel({
			volume: config.volume ?? 0,
			pan: 0,
			mute: false,
			solo: false
		});

		// Create limiter (brick wall protection at -0.5 dB)
		this.limiter = new Tone.Limiter(config.limiterThreshold ?? -0.5);

		// Create meter (for level monitoring)
		this.meter = new Tone.Meter({
			channels: 2,
			smoothing: config.meterSmoothingFactor ?? 0.8
		});

		// Create analyser (for frequency analysis)
		this.analyser = new Tone.Analyser({
			type: 'fft',
			size: 1024,
			smoothing: 0.8
		});

		// Connect the chain
		this.channel.chain(this.limiter, this.meter, this.analyser, Tone.getDestination());
	}

	/**
	 * Set master volume
	 * @param db - Volume in decibels
	 */
	setVolume(db: Decibels): void {
		this.channel.volume.rampTo(db, 0.1);
	}

	/**
	 * Get current master volume
	 * @returns Volume in decibels
	 */
	getVolume(): Decibels {
		return this.channel.volume.value;
	}

	/**
	 * Mute/unmute master output
	 * @param mute - True to mute
	 */
	setMute(mute: boolean): void {
		this.channel.mute = mute;
	}

	/**
	 * Check if master is muted
	 */
	isMuted(): boolean {
		return this.channel.mute;
	}

	/**
	 * Get current meter levels
	 * @returns Meter data for left and right channels
	 */
	getLevel(): MeterData {
		const values = this.meter.getValue();
		const now = Date.now();

		let left: number;
		let right: number;

		// Handle mono or stereo
		if (Array.isArray(values)) {
			left = values[0] as number;
			right = values[1] as number;
		} else {
			left = right = values as number;
		}

		// Update peaks with hold
		if (left > this.peakLeft) {
			this.peakLeft = left;
			this.lastPeakTime = now;
		} else if (now - this.lastPeakTime > this.peakHoldTime) {
			this.peakLeft *= this.peakDecayRate;
		}

		if (right > this.peakRight) {
			this.peakRight = right;
			this.lastPeakTime = now;
		} else if (now - this.lastPeakTime > this.peakHoldTime) {
			this.peakRight *= this.peakDecayRate;
		}

		// Detect clipping
		const peak = Math.max(left, right);
		if (peak > this.clippingThreshold) {
			this.isClipping = true;
			this.lastClipTime = now;
		} else if (now - this.lastClipTime > this.clippingResetTime) {
			this.isClipping = false;
		}

		// Calculate RMS (approximate)
		const rms = (Math.abs(left) + Math.abs(right)) / 2;

		return {
			left,
			right,
			peak,
			rms
		};
	}

	/**
	 * Get frequency spectrum data
	 * @returns Float32Array of frequency magnitudes
	 */
	getSpectrum(): Float32Array {
		return this.analyser.getValue() as Float32Array;
	}

	/**
	 * Get waveform data
	 * @returns Float32Array of time-domain samples
	 */
	getWaveform(): Float32Array {
		// Temporarily switch to waveform mode
		const currentType = this.analyser.type;
		this.analyser.type = 'waveform';
		const waveform = this.analyser.getValue() as Float32Array;
		this.analyser.type = currentType;
		return waveform;
	}

	/**
	 * Check if output is clipping
	 */
	isOutputClipping(): boolean {
		return this.isClipping;
	}

	/**
	 * Reset peak meters
	 */
	resetPeaks(): void {
		this.peakLeft = -Infinity;
		this.peakRight = -Infinity;
		this.isClipping = false;
	}

	/**
	 * Set limiter threshold
	 * @param threshold - Threshold in dB (typically -0.5 to -1.0)
	 */
	setLimiterThreshold(threshold: Decibels): void {
		// Limiter threshold is set at construction, recreate if needed
		// For now, log warning that this requires recreation
		logger.warn('Limiter threshold cannot be changed dynamically. Create a new MasterBus instance.');
	}

	/**
	 * Connect an audio source to the master bus
	 * @param source - Audio source to connect
	 */
	connect(source: any): void {
		source.connect(this.channel);
	}

	/**
	 * Get the input node
	 */
	getInput(): Tone.Channel {
		return this.channel;
	}

	/**
	 * Connect master bus to an external destination
	 * @param destination - Destination node
	 */
	connectTo(destination: any): void {
		this.analyser.connect(destination);
	}

	/**
	 * Disconnect from destination
	 */
	disconnect(): void {
		this.analyser.disconnect();
	}

	/**
	 * Get debug information
	 */
	debug(): MasterBusDebugInfo {
		const level = this.getLevel();

		return {
			volume: this.channel.volume.value,
			isMuted: this.channel.mute,
			limiterThreshold: -0.5, // Fixed for now
			meterLevel: level,
			isClipping: this.isClipping,
			peakLeft: this.peakLeft,
			peakRight: this.peakRight
		};
	}

	/**
	 * Dispose of all resources
	 */
	dispose(): void {
		this.channel.dispose();
		this.limiter.dispose();
		this.meter.dispose();
		this.analyser.dispose();
	}
}

/**
 * Debug information interface
 */
export interface MasterBusDebugInfo {
	volume: Decibels;
	isMuted: boolean;
	limiterThreshold: Decibels;
	meterLevel: MeterData;
	isClipping: boolean;
	peakLeft: number;
	peakRight: number;
}
