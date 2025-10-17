/**
 * Dynamics Processing Service (Auto-Comping)
 * Applies compression, normalization, EQ, and other dynamics processing
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export interface DynamicsOptions {
  /** Apply compression */
  compression?: boolean;
  /** Compression ratio (e.g., 4:1 = 4) */
  compressionRatio?: number;
  /** Compression threshold in dB */
  compressionThreshold?: number;
  /** Apply normalization to target loudness */
  normalize?: boolean;
  /** Target loudness in LUFS (-14 for streaming, -16 for Spotify) */
  targetLoudness?: number;
  /** Apply EQ boost/cut */
  eq?: {
    bass?: number; // dB boost/cut
    mids?: number;
    highs?: number;
  };
  /** Apply de-esser (reduce sibilance) */
  deEss?: boolean;
  /** Apply noise gate (remove background noise) */
  noiseGate?: boolean;
  /** Noise gate threshold in dB */
  noiseGateThreshold?: number;
}

export interface DynamicsResult {
  success: boolean;
  outputPath?: string;
  metrics?: {
    peakLevel: number; // dBFS
    rmsLevel: number; // dBFS
    loudness: number; // LUFS
    dynamicRange: number; // dB
  };
  error?: string;
}

export class DynamicsProcessingService {
  /**
   * Apply dynamics processing (auto-comp)
   */
  async process(audioPath: string, options: DynamicsOptions = {}): Promise<DynamicsResult> {
    try {
      console.log(`🎚️  Applying dynamics processing: ${path.basename(audioPath)}`);

      // Default options for country/pop vocals
      const opts = {
        compression: options.compression ?? true,
        compressionRatio: options.compressionRatio ?? 4, // 4:1 ratio
        compressionThreshold: options.compressionThreshold ?? -20, // -20dB threshold
        normalize: options.normalize ?? true,
        targetLoudness: options.targetLoudness ?? -14, // Spotify streaming standard
        eq: options.eq ?? { bass: 0, mids: 2, highs: 3 }, // Slight high-end boost for vocals
        deEss: options.deEss ?? true,
        noiseGate: options.noiseGate ?? true,
        noiseGateThreshold: options.noiseGateThreshold ?? -40,
      };

      // Create output path
      const ext = path.extname(audioPath);
      const baseName = path.basename(audioPath, ext);
      const outputPath = path.join(path.dirname(audioPath), `${baseName}_PROCESSED${ext}`);

      // Build ffmpeg filter chain
      const filters = [];

      // 1. Noise Gate (remove background noise first)
      if (opts.noiseGate) {
        filters.push(`agate=threshold=${opts.noiseGateThreshold}dB:ratio=10:attack=5:release=50`);
      }

      // 2. De-esser (reduce sibilance 6-10kHz)
      if (opts.deEss) {
        filters.push(`deesser=f=8000:intensity=0.5`);
      }

      // 3. EQ (3-band parametric)
      if (opts.eq) {
        const eqFilters = [];
        if (opts.eq.bass !== 0) {
          eqFilters.push(`bass=g=${opts.eq.bass}`); // Low shelf at 200Hz
        }
        if (opts.eq.mids !== 0) {
          eqFilters.push(`equalizer=f=1000:width_type=o:width=2:g=${opts.eq.mids}`); // Mid peak at 1kHz
        }
        if (opts.eq.highs !== 0) {
          eqFilters.push(`treble=g=${opts.eq.highs}`); // High shelf at 5kHz
        }
        filters.push(...eqFilters);
      }

      // 4. Compression (dynamic range control)
      if (opts.compression) {
        filters.push(
          `acompressor=threshold=${opts.compressionThreshold}dB:ratio=${opts.compressionRatio}:attack=5:release=50:makeup=2`
        );
      }

      // 5. Normalization (loudness matching)
      if (opts.normalize) {
        filters.push(`loudnorm=I=${opts.targetLoudness}:TP=-1.5:LRA=11`);
      }

      const filterChain = filters.join(',');

      console.log(`🎛️  Filter chain: ${filterChain}`);

      // Apply processing
      await execAsync(
        `ffmpeg -i "${audioPath}" -af "${filterChain}" -c:a libfdk_aac -b:a 192k "${outputPath}" -y`,
        { timeout: 120000 }
      );

      // Measure output metrics
      const metrics = await this.measureAudio(outputPath);

      console.log(`✅ Dynamics processed: ${path.basename(outputPath)}`);
      console.log(`   Peak: ${metrics.peakLevel.toFixed(1)} dBFS`);
      console.log(`   RMS: ${metrics.rmsLevel.toFixed(1)} dBFS`);
      console.log(`   Loudness: ${metrics.loudness.toFixed(1)} LUFS`);

      return {
        success: true,
        outputPath,
        metrics,
      };
    } catch (error) {
      console.error('Dynamics processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Measure audio levels
   */
  private async measureAudio(audioPath: string): Promise<{
    peakLevel: number;
    rmsLevel: number;
    loudness: number;
    dynamicRange: number;
  }> {
    try {
      // Get loudness stats from ffmpeg
      const { stderr } = await execAsync(
        `ffmpeg -i "${audioPath}" -af "loudnorm=I=-16:dual_mono=true:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1`
      );

      // Parse JSON output
      const jsonMatch = stderr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const stats = JSON.parse(jsonMatch[0]);
        return {
          peakLevel: parseFloat(stats.input_tp) || 0,
          rmsLevel: parseFloat(stats.input_i) || 0,
          loudness: parseFloat(stats.input_i) || -14,
          dynamicRange: parseFloat(stats.input_lra) || 10,
        };
      }

      // Fallback: use astats filter
      const { stderr: astatsOutput } = await execAsync(
        `ffmpeg -i "${audioPath}" -af "astats=metadata=1:reset=1" -f null - 2>&1`
      );

      const peakMatch = astatsOutput.match(/Peak level dB:\s*([-\d.]+)/);
      const rmsMatch = astatsOutput.match(/RMS level dB:\s*([-\d.]+)/);

      return {
        peakLevel: peakMatch ? parseFloat(peakMatch[1]) : -6,
        rmsLevel: rmsMatch ? parseFloat(rmsMatch[1]) : -14,
        loudness: -14,
        dynamicRange: 10,
      };
    } catch (error) {
      console.warn('⚠️  Audio measurement failed, using defaults');
      return {
        peakLevel: -6,
        rmsLevel: -14,
        loudness: -14,
        dynamicRange: 10,
      };
    }
  }

  /**
   * Quick vocal preset (optimized for country/pop vocals)
   */
  async processVocals(audioPath: string): Promise<DynamicsResult> {
    return this.process(audioPath, {
      compression: true,
      compressionRatio: 4,
      compressionThreshold: -18,
      normalize: true,
      targetLoudness: -14,
      eq: {
        bass: -2, // Cut low rumble
        mids: 2, // Boost vocal presence
        highs: 4, // Boost clarity and air
      },
      deEss: true,
      noiseGate: true,
      noiseGateThreshold: -45,
    });
  }

  /**
   * Mix preset (balanced for final mix)
   */
  async processMix(audioPath: string): Promise<DynamicsResult> {
    return this.process(audioPath, {
      compression: true,
      compressionRatio: 2.5, // Gentle compression
      compressionThreshold: -12,
      normalize: true,
      targetLoudness: -14,
      eq: {
        bass: 0,
        mids: 0,
        highs: 1, // Slight high-end shine
      },
      deEss: false, // Already handled in vocal processing
      noiseGate: false,
    });
  }
}

export const dynamicsProcessingService = new DynamicsProcessingService();
