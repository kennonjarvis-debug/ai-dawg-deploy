/**
 * Comp Engine - DAWG AI Audio Engine
 * Intelligent auto-comp with segment scoring and crossfades
 * @module audio/comp/CompEngine
 */

import { v4 as uuid } from 'uuid';
import type { UUID } from '../../types/core';
import type { Take } from '../recording/types';
import type {
	CompOptions,
	CompResult,
	CompSegment,
	Crossfade,
	SegmentScore,
	ManualSegment,
	CompEngineConfig,
} from './types';
import { DEFAULT_COMP_CONFIG } from './types';
import { AudioEngineError } from '../errors';

import { logger } from '$lib/utils/logger';
/**
 * Comp Engine - Creates professional vocal comps from multiple takes
 *
 * Features:
 * - Automatic segment scoring based on timing, quality, and clipping
 * - Equal-power crossfades between segments
 * - Manual segment overrides
 * - Comprehensive scoring explanations
 */
export class CompEngine {
	private config: CompEngineConfig;
	private sampleRate: number;

	constructor(sampleRate: number = 48000, config?: Partial<CompEngineConfig>) {
		this.sampleRate = sampleRate;
		this.config = { ...DEFAULT_COMP_CONFIG, ...config };

		// Validate weights sum to 1.0
		const weightSum =
			this.config.timingWeight + this.config.qualityWeight + this.config.clippingWeight;
		if (Math.abs(weightSum - 1.0) > 0.001) {
			throw new AudioEngineError(
				`Scoring weights must sum to 1.0 (got ${weightSum})`,
				'INVALID_COMP_CONFIG'
			);
		}
	}

	/**
	 * Create automatic comp from multiple takes
	 *
	 * Algorithm:
	 * 1. Divide region into segments (bar or phrase level)
	 * 2. Score each take for each segment
	 * 3. Select best segment from each take
	 * 4. Create crossfades at boundaries (10-30ms equal-power)
	 * 5. Render to new track
	 *
	 * @param takes - Array of takes to comp
	 * @param opts - Comp options
	 * @returns Comp result with segments and crossfades
	 */
	async createAutoComp(takes: Take[], opts: CompOptions): Promise<CompResult> {
		if (takes.length === 0) {
			throw new AudioEngineError('No takes provided for comping', 'NO_TAKES');
		}

		if (takes.length === 1) {
			// Only one take, just return it as the comp
			return {
				compTrackId: uuid() as UUID,
				segments: [
					{
						takeId: takes[0].id,
						startBar: opts.region.startBar,
						endBar: opts.region.endBar,
						score: 1.0,
						reason: 'Only take available',
					},
				],
				crossfades: [],
				totalSegments: 1,
				averageScore: 1.0,
			};
		}

		// 1. Divide region into segments
		const segments = this.divideIntoSegments(opts.region.startBar, opts.region.endBar);

		// 2. Score each take for each segment
		const scores: Map<string, Map<string, SegmentScore>> = new Map();

		for (const segment of segments) {
			const segmentScores = new Map<string, SegmentScore>();

			for (const take of takes) {
				const score = this.scoreTakeForSegment(take, segment);
				segmentScores.set(take.id, score);
			}

			const segmentKey = `${segment.startBar}-${segment.endBar}`;
			scores.set(segmentKey, segmentScores);
		}

		// 3. Select best segment from each take
		const selectedSegments: CompSegment[] = [];

		for (const segment of segments) {
			const segmentKey = `${segment.startBar}-${segment.endBar}`;
			const segmentScores = scores.get(segmentKey)!;

			// Find take with highest score for this segment
			let bestScore: SegmentScore | null = null;
			for (const score of segmentScores.values()) {
				if (!bestScore || score.totalScore > bestScore.totalScore) {
					bestScore = score;
				}
			}

			if (bestScore) {
				selectedSegments.push({
					takeId: bestScore.takeId,
					startBar: segment.startBar,
					endBar: segment.endBar,
					score: bestScore.totalScore,
					reason: bestScore.reason,
				});
			}
		}

		// 4. Create crossfades at segment boundaries
		const crossfades: Crossfade[] = [];

		for (let i = 1; i < selectedSegments.length; i++) {
			const prevSegment = selectedSegments[i - 1];
			const currentSegment = selectedSegments[i];

			// Only create crossfade if switching between takes
			if (prevSegment.takeId !== currentSegment.takeId) {
				crossfades.push({
					bar: currentSegment.startBar,
					durationMs: this.config.crossfadeDurationMs,
					type: 'equal-power',
				});
			}
		}

		// 5. Calculate statistics
		const totalScore = selectedSegments.reduce((sum, s) => sum + s.score, 0);
		const averageScore = totalScore / selectedSegments.length;

		return {
			compTrackId: uuid() as UUID,
			segments: selectedSegments,
			crossfades,
			totalSegments: selectedSegments.length,
			averageScore,
		};
	}

	/**
	 * Apply manual segment selection
	 *
	 * @param takes - All available takes
	 * @param manualSegments - User-specified segments to keep
	 * @returns Comp result with manual selections
	 */
	async createManualComp(takes: Take[], manualSegments: ManualSegment[]): Promise<CompResult> {
		const segments: CompSegment[] = manualSegments.map((seg) => ({
			takeId: seg.takeId,
			startBar: seg.startBar,
			endBar: seg.endBar,
			score: 1.0,
			reason: 'Manual selection',
		}));

		// Create crossfades at segment boundaries
		const crossfades: Crossfade[] = [];

		for (let i = 1; i < segments.length; i++) {
			const prevSegment = segments[i - 1];
			const currentSegment = segments[i];

			if (prevSegment.takeId !== currentSegment.takeId) {
				crossfades.push({
					bar: currentSegment.startBar,
					durationMs: this.config.crossfadeDurationMs,
					type: 'equal-power',
				});
			}
		}

		return {
			compTrackId: uuid() as UUID,
			segments,
			crossfades,
			totalSegments: segments.length,
			averageScore: 1.0,
		};
	}

	/**
	 * Render comp to audio buffer
	 *
	 * Stitches together selected segments with crossfades
	 *
	 * @param takes - All takes
	 * @param compResult - Comp result from createAutoComp/createManualComp
	 * @param bpm - Tempo for timing calculations
	 * @returns Rendered audio buffer
	 */
	async renderComp(takes: Take[], compResult: CompResult, bpm: number): Promise<AudioBuffer> {
		// Calculate total duration
		const firstSegment = compResult.segments[0];
		const lastSegment = compResult.segments[compResult.segments.length - 1];
		const totalBars = lastSegment.endBar - firstSegment.startBar;
		const secondsPerBar = (60 / bpm) * 4; // Assuming 4/4 time
		const totalSeconds = totalBars * secondsPerBar;
		const totalSamples = Math.floor(totalSeconds * this.sampleRate);

		// Create output buffer
		const outputBuffer = new AudioContext().createBuffer(2, totalSamples, this.sampleRate);
		const leftChannel = outputBuffer.getChannelData(0);
		const rightChannel = outputBuffer.getChannelData(1);

		// Process each segment
		for (let i = 0; i < compResult.segments.length; i++) {
			const segment = compResult.segments[i];
			const take = takes.find((t) => t.id === segment.takeId);

			if (!take) {
				logger.warn(`Take ${segment.takeId} not found, skipping segment`);
				continue;
			}

			// Calculate segment position in samples
			const segmentStartBar = segment.startBar - firstSegment.startBar;
			const segmentStartSec = segmentStartBar * secondsPerBar;
			const segmentStartSample = Math.floor(segmentStartSec * this.sampleRate);

			const segmentDurationBars = segment.endBar - segment.startBar;
			const segmentDurationSec = segmentDurationBars * secondsPerBar;
			const segmentDurationSamples = Math.floor(segmentDurationSec * this.sampleRate);

			// Copy audio data from take to output
			const takeStartSample = Math.floor(
				(segment.startBar - take.startBar) * secondsPerBar * this.sampleRate
			);

			for (let sample = 0; sample < segmentDurationSamples; sample++) {
				const outputIndex = segmentStartSample + sample;
				const takeIndex = takeStartSample + sample;

				if (outputIndex >= totalSamples) break;
				if (takeIndex >= take.clip.length) break;

				// Get sample from take (handle mono/stereo)
				const takeLeftValue =
					take.clip.numberOfChannels >= 1 ? take.clip.getChannelData(0)[takeIndex] : 0;
				const takeRightValue =
					take.clip.numberOfChannels >= 2
						? take.clip.getChannelData(1)[takeIndex]
						: takeLeftValue;

				leftChannel[outputIndex] = takeLeftValue;
				rightChannel[outputIndex] = takeRightValue;
			}

			// Apply crossfade if this is not the last segment
			if (i < compResult.segments.length - 1) {
				const crossfade = compResult.crossfades.find((cf) => cf.bar === segment.endBar);

				if (crossfade) {
					const nextSegment = compResult.segments[i + 1];
					const nextTake = takes.find((t) => t.id === nextSegment.takeId);

					if (nextTake) {
						this.applyCrossfade(
							outputBuffer,
							segment,
							nextSegment,
							take,
							nextTake,
							crossfade,
							bpm
						);
					}
				}
			}
		}

		return outputBuffer;
	}

	/**
	 * Score a take for a specific segment
	 *
	 * Scoring criteria:
	 * - Timing accuracy (40%): Lower timing error = higher score
	 * - Signal quality (40%): Higher SNR = higher score
	 * - No clipping (20%): Peak below threshold = higher score
	 *
	 * @param take - Take to score
	 * @param segment - Segment to score
	 * @returns Segment score with breakdown
	 */
	private scoreTakeForSegment(
		take: Take,
		segment: { startBar: number; endBar: number }
	): SegmentScore {
		// 1. Timing score (inverse of timing error, normalized)
		// Assume perfect timing = 0ms error, bad timing = 50ms error
		const maxTimingErrorMs = 50;
		const timingScore = Math.max(
			0,
			1 - Math.min(take.metrics.timingErrorMs, maxTimingErrorMs) / maxTimingErrorMs
		);

		// 2. Quality score (SNR normalized to 0-1)
		// Assume good SNR >= 30dB, poor SNR = 0dB
		const minSnrDb = 0;
		const maxSnrDb = 30;
		const qualityScore = Math.max(
			0,
			Math.min(1, (take.metrics.snr - minSnrDb) / (maxSnrDb - minSnrDb))
		);

		// 3. Clipping score (1 if no clipping, 0 if clipping)
		const clippingScore = take.metrics.peakDb <= this.config.clippingThresholdDb ? 1.0 : 0.0;

		// 4. Weighted total score
		const totalScore =
			timingScore * this.config.timingWeight +
			qualityScore * this.config.qualityWeight +
			clippingScore * this.config.clippingWeight;

		// 5. Generate reason
		const reasons: string[] = [];

		if (timingScore > 0.9) {
			reasons.push('Perfect timing');
		} else if (timingScore > 0.7) {
			reasons.push('Good timing');
		}

		if (qualityScore > 0.8) {
			reasons.push('Clean signal');
		}

		if (clippingScore === 1.0) {
			reasons.push('No clipping');
		} else {
			reasons.push('Clipping detected');
		}

		const reason = reasons.length > 0 ? reasons.join(', ') : 'Acceptable quality';

		return {
			takeId: take.id,
			segment,
			timingScore,
			qualityScore,
			clippingScore,
			totalScore,
			reason,
		};
	}

	/**
	 * Apply equal-power crossfade between two takes
	 *
	 * Equal-power crossfade formula:
	 * - Fade out: cos(t * π/2)
	 * - Fade in: sin(t * π/2)
	 * where t goes from 0 to 1 over the crossfade duration
	 *
	 * This maintains constant power throughout the crossfade
	 *
	 * @param outputBuffer - Output audio buffer to modify in place
	 * @param segment1 - First segment (fading out)
	 * @param segment2 - Second segment (fading in)
	 * @param take1 - First take
	 * @param take2 - Second take
	 * @param crossfade - Crossfade parameters
	 * @param bpm - Tempo
	 */
	private applyCrossfade(
		outputBuffer: AudioBuffer,
		segment1: CompSegment,
		segment2: CompSegment,
		take1: Take,
		take2: Take,
		crossfade: Crossfade,
		bpm: number
	): void {
		const secondsPerBar = (60 / bpm) * 4; // Assuming 4/4
		const crossfadeDurationSec = crossfade.durationMs / 1000;
		const crossfadeSamples = Math.floor(crossfadeDurationSec * this.sampleRate);

		// Crossfade starts at segment boundary
		const crossfadeStartBar = segment2.startBar;
		const crossfadeStartSec = crossfadeStartBar * secondsPerBar;
		const crossfadeStartSample = Math.floor(crossfadeStartSec * this.sampleRate);

		// Apply crossfade
		for (let i = 0; i < crossfadeSamples; i++) {
			const sampleIndex = crossfadeStartSample + i;

			if (sampleIndex >= outputBuffer.length) break;

			// Crossfade progress (0 to 1)
			const t = i / crossfadeSamples;

			// Equal-power crossfade curves
			const fadeOutGain = Math.cos((t * Math.PI) / 2);
			const fadeInGain = Math.sin((t * Math.PI) / 2);

			// Get current values from output buffer (segment1)
			const leftChannel = outputBuffer.getChannelData(0);
			const rightChannel = outputBuffer.getChannelData(1);

			const currentLeft = leftChannel[sampleIndex];
			const currentRight = rightChannel[sampleIndex];

			// Get values from take2 (segment2)
			const take2StartSample = Math.floor(
				(segment2.startBar - take2.startBar) * secondsPerBar * this.sampleRate
			);
			const take2Index = take2StartSample + i;

			if (take2Index >= take2.clip.length) continue;

			const take2Left =
				take2.clip.numberOfChannels >= 1 ? take2.clip.getChannelData(0)[take2Index] : 0;
			const take2Right =
				take2.clip.numberOfChannels >= 2
					? take2.clip.getChannelData(1)[take2Index]
					: take2Left;

			// Apply crossfade
			leftChannel[sampleIndex] = currentLeft * fadeOutGain + take2Left * fadeInGain;
			rightChannel[sampleIndex] = currentRight * fadeOutGain + take2Right * fadeInGain;
		}
	}

	/**
	 * Divide region into segments
	 *
	 * @param startBar - Start bar of region
	 * @param endBar - End bar of region
	 * @returns Array of segments
	 */
	private divideIntoSegments(
		startBar: number,
		endBar: number
	): Array<{ startBar: number; endBar: number }> {
		const segments: Array<{ startBar: number; endBar: number }> = [];
		const segmentSizeBars = this.config.segmentSizeBeats / 4; // Convert beats to bars (4/4 time)

		for (let bar = startBar; bar < endBar; bar += segmentSizeBars) {
			segments.push({
				startBar: bar,
				endBar: Math.min(bar + segmentSizeBars, endBar),
			});
		}

		return segments;
	}

	/**
	 * Get configuration
	 */
	getConfig(): CompEngineConfig {
		return { ...this.config };
	}

	/**
	 * Update configuration
	 */
	setConfig(config: Partial<CompEngineConfig>): void {
		this.config = { ...this.config, ...config };

		// Validate weights
		const weightSum =
			this.config.timingWeight + this.config.qualityWeight + this.config.clippingWeight;
		if (Math.abs(weightSum - 1.0) > 0.001) {
			throw new AudioEngineError(
				`Scoring weights must sum to 1.0 (got ${weightSum})`,
				'INVALID_COMP_CONFIG'
			);
		}
	}
}
