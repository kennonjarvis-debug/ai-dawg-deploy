/**
 * Vocoder - DAWG AI Audio Engine
 * Multi-band vocoder with internal carrier oscillator
 * @module audio/effects/Vocoder
 */

import * as Tone from 'tone';
import { Effect } from './Effect';
import type { UUID } from '../../types/core';

/**
 * Vocoder band - contains filter and envelope follower
 */
interface VocoderBand {
	modulatorFilter: Tone.Filter;
	carrierFilter: Tone.Filter;
	envelope: Tone.Envelope;
	gain: Tone.Gain;
}

/**
 * Vocoder Effect - Multi-band spectral modulation
 */
export class Vocoder extends Effect {
	private bands: VocoderBand[] = [];
	private carrier: Tone.Oscillator;
	private numBands: number = 16;
	private output_mix: Tone.Gain;

	constructor(id?: UUID, name: string = 'Vocoder') {
		super(id!, name, 'vocoder' as any);

		// Create carrier oscillator
		this.carrier = new Tone.Oscillator({
			frequency: 220,
			type: 'sawtooth'
		});

		this.output_mix = new Tone.Gain(1);

		// Create vocoder bands
		this.createBands(this.numBands);

		// Connect output
		this.output_mix.connect(this.wet.b);

		// Start carrier
		this.carrier.start();

		// Register parameters
		this.registerParameter({
			name: 'carrierFreq',
			value: 220,
			min: 50,
			max: 1000,
			default: 220,
			unit: 'Hz',
			step: 1
		});

		this.registerParameter({
			name: 'Q',
			value: 10,
			min: 1,
			max: 50,
			default: 10,
			unit: '',
			step: 1
		});

		this.registerParameter({
			name: 'attack',
			value: 0.01,
			min: 0.001,
			max: 0.1,
			default: 0.01,
			unit: 's',
			step: 0.001
		});

		this.registerParameter({
			name: 'release',
			value: 0.05,
			min: 0.01,
			max: 0.5,
			default: 0.05,
			unit: 's',
			step: 0.01
		});

		this.registerParameter({
			name: 'wet',
			value: 0.5,
			min: 0,
			max: 1,
			default: 0.5,
			unit: '',
			step: 0.01
		});
	}

	/**
	 * Create vocoder frequency bands
	 */
	private createBands(numBands: number): void {
		// Clear existing bands
		this.bands.forEach((band) => {
			band.modulatorFilter.dispose();
			band.carrierFilter.dispose();
			band.envelope.dispose();
			band.gain.dispose();
		});
		this.bands = [];

		// Calculate frequency ranges (logarithmic distribution from 100Hz to 8kHz)
		const minFreq = 100;
		const maxFreq = 8000;
		const freqRatio = Math.pow(maxFreq / minFreq, 1 / numBands);

		for (let i = 0; i < numBands; i++) {
			const centerFreq = minFreq * Math.pow(freqRatio, i);

			// Create modulator filter (analyzes input)
			const modulatorFilter = new Tone.Filter({
				frequency: centerFreq,
				type: 'bandpass',
				Q: 10
			});

			// Create carrier filter (filters carrier oscillator)
			const carrierFilter = new Tone.Filter({
				frequency: centerFreq,
				type: 'bandpass',
				Q: 10
			});

			// Create envelope follower
			const envelope = new Tone.Envelope({
				attack: 0.01,
				decay: 0,
				sustain: 1,
				release: 0.05
			});

			// Create gain for amplitude modulation
			const gain = new Tone.Gain(0);

			// Connect modulator path: input -> modulatorFilter -> envelope -> gain.gain
			this.input.connect(modulatorFilter);
			modulatorFilter.connect(envelope);

			// Connect carrier path: carrier -> carrierFilter -> gain -> output
			this.carrier.connect(carrierFilter);
			carrierFilter.connect(gain);
			gain.connect(this.output_mix);

			this.bands.push({
				modulatorFilter,
				carrierFilter,
				envelope,
				gain
			});
		}
	}

	/**
	 * Handle parameter changes
	 */
	protected onParameterChange(name: string, value: number): void {
		switch (name) {
			case 'carrierFreq':
				this.carrier.frequency.value = value;
				break;
			case 'Q':
				this.bands.forEach((band) => {
					band.modulatorFilter.Q.value = value;
					band.carrierFilter.Q.value = value;
				});
				break;
			case 'attack':
				this.bands.forEach((band) => {
					band.envelope.attack = value;
				});
				break;
			case 'release':
				this.bands.forEach((band) => {
					band.envelope.release = value;
				});
				break;
			case 'wet':
				this.setMix(value);
				break;
		}
	}

	/**
	 * Apply vocoder to offline context
	 */
	applyToOfflineContext(
		offlineContext: OfflineAudioContext,
		source: AudioNode,
		destination: AudioNode
	): AudioNode {
		if (!this.enabled) {
			source.connect(destination);
			return source;
		}

		const carrierFreq = this.getParameter('carrierFreq') || 220;
		const Q = this.getParameter('Q') || 10;
		const wetValue = this.getParameter('wet') || 0.5;

		// Create carrier oscillator
		const carrier = offlineContext.createOscillator();
		carrier.type = 'sawtooth';
		carrier.frequency.value = carrierFreq;

		// Create output nodes
		const bandMix = offlineContext.createGain();
		const wetGain = offlineContext.createGain();
		const dryGain = offlineContext.createGain();
		const output = offlineContext.createGain();

		wetGain.gain.value = wetValue;
		dryGain.gain.value = 1 - wetValue;

		// Create vocoder bands
		const numBands = 16;
		const minFreq = 100;
		const maxFreq = 8000;
		const freqRatio = Math.pow(maxFreq / minFreq, 1 / numBands);

		for (let i = 0; i < numBands; i++) {
			const centerFreq = minFreq * Math.pow(freqRatio, i);

			// Create modulator filter (analyzes input)
			const modulatorFilter = offlineContext.createBiquadFilter();
			modulatorFilter.type = 'bandpass';
			modulatorFilter.frequency.value = centerFreq;
			modulatorFilter.Q.value = Q;

			// Create carrier filter (filters carrier)
			const carrierFilter = offlineContext.createBiquadFilter();
			carrierFilter.type = 'bandpass';
			carrierFilter.frequency.value = centerFreq;
			carrierFilter.Q.value = Q;

			// Create gain for this band
			const bandGain = offlineContext.createGain();
			bandGain.gain.value = 1 / numBands; // Normalize by number of bands

			// Connect: source -> modulatorFilter (for analysis)
			//          carrier -> carrierFilter -> bandGain -> bandMix
			source.connect(modulatorFilter);
			carrier.connect(carrierFilter);
			carrierFilter.connect(bandGain);
			bandGain.connect(bandMix);

			// Note: In a full implementation, we would extract the envelope from
			// modulatorFilter and apply it to bandGain. For offline rendering,
			// this would require custom processing or AudioWorklet.
			// This simplified version uses the carrier bands without envelope following.
		}

		// Connect final output
		bandMix.connect(wetGain);
		wetGain.connect(output);

		source.connect(dryGain);
		dryGain.connect(output);

		output.connect(destination);

		// Start carrier
		carrier.start(0);
		carrier.stop(offlineContext.length / offlineContext.sampleRate);

		return output;
	}

	/**
	 * Dispose resources
	 */
	dispose(): void {
		this.carrier.stop();
		this.carrier.dispose();
		this.bands.forEach((band) => {
			band.modulatorFilter.dispose();
			band.carrierFilter.dispose();
			band.envelope.dispose();
			band.gain.dispose();
		});
		this.output_mix.dispose();
		super.dispose();
	}
}
