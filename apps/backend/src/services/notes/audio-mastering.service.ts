/**
 * Audio Mastering Service for JARVIS
 * Post-processes generated beats and vocals to radio-ready quality
 * Iterative refinement until professional standards are met
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { logger } from '../../../../src/lib/utils/logger.js';

const execAsync = promisify(exec);

export interface MasteringOptions {
  /**
   * Target loudness in LUFS (EBU R128 standard)
   * -14 LUFS: Streaming platforms (Spotify, Apple Music)
   * -10 LUFS: Club/radio
   * -9 LUFS: Aggressive loudness
   */
  targetLoudness?: number;

  /**
   * Genre-specific mastering preset
   */
  genre?: 'country' | 'pop' | 'rock' | 'r&b' | 'indie' | 'electronic';

  /**
   * Mastering style
   */
  style?: 'gentle' | 'moderate' | 'aggressive' | 'streaming' | 'vinyl' | 'cd';

  /**
   * Enable stereo enhancement
   */
  stereoEnhancement?: boolean;

  /**
   * Preserve dynamics (true = less compression)
   */
  preserveDynamics?: boolean;

  /**
   * Maximum number of refinement iterations
   */
  maxIterations?: number;

  /**
   * Target quality threshold (0-1)
   */
  targetQuality?: number;
}

export interface AudioMetrics {
  /**
   * Integrated loudness (LUFS)
   */
  loudness: number;

  /**
   * Loudness range (LU)
   */
  loudnessRange: number;

  /**
   * True peak (dBTP)
   */
  truePeak: number;

  /**
   * Dynamic range (dB)
   */
  dynamicRange: number;

  /**
   * Stereo width (0-1)
   */
  stereoWidth?: number;

  /**
   * Overall quality score (0-1)
   */
  qualityScore?: number;
}

export interface MasteringResult {
  success: boolean;
  masteredPath?: string;
  metrics?: AudioMetrics;
  iterations?: number;
  improvements?: string[];
  error?: string;
}

export class AudioMasteringService {
  /**
   * Master audio to radio-ready quality
   */
  async master(
    inputPath: string,
    outputName: string,
    options: MasteringOptions = {}
  ): Promise<MasteringResult> {
    try {
      logger.info('🎚️  Mastering audio to radio-ready quality...');

      // Default options
      const targetLoudness = options.targetLoudness || -14; // Streaming standard
      const genre = options.genre || 'country';
      const style = options.style || 'streaming';
      const maxIterations = options.maxIterations || 3;
      const targetQuality = options.targetQuality || 0.85;

      const outputPath = path.join(
        path.dirname(inputPath),
        `${outputName}_MASTERED.m4a`
      );

      // Analyze input
      logger.info('📊 Analyzing input audio...');
      const inputMetrics = await this.analyzeAudio(inputPath);
      logger.info('   Input loudness: ${inputMetrics.loudness.toFixed(2)} LUFS');
      logger.info('   Dynamic range: ${inputMetrics.dynamicRange.toFixed(2)} dB');

      // Iterative refinement loop
      let currentPath = inputPath;
      let iteration = 0;
      const improvements: string[] = [];

      while (iteration < maxIterations) {
        iteration++;
        logger.info('\n🔄 Refinement iteration ${iteration}/${maxIterations}...');

        // Apply mastering processing
        const processedPath = await this.applyMastering(
          currentPath,
          outputPath,
          {
            targetLoudness,
            genre,
            style,
            stereoEnhancement: options.stereoEnhancement,
            preserveDynamics: options.preserveDynamics,
          }
        );

        // Analyze output
        const outputMetrics = await this.analyzeAudio(processedPath);
        logger.info('   Output loudness: ${outputMetrics.loudness.toFixed(2)} LUFS');
        logger.info('   Quality score: ${((outputMetrics.qualityScore || 0) * 100).toFixed(0)}%');

        // Track improvements
        if (Math.abs(outputMetrics.loudness - targetLoudness) < 1.0) {
          improvements.push('Achieved target loudness');
        }
        if (outputMetrics.dynamicRange > 6.0) {
          improvements.push('Preserved healthy dynamic range');
        }
        if (outputMetrics.truePeak < -1.0) {
          improvements.push('True peak optimized for streaming');
        }

        // Check if quality threshold met
        const qualityScore = outputMetrics.qualityScore || 0;
        if (qualityScore >= targetQuality) {
          logger.info('✅ Target quality achieved (${(qualityScore * 100).toFixed(0)}%)');
          break;
        }

        currentPath = processedPath;
      }

      const finalMetrics = await this.analyzeAudio(outputPath);

      logger.info('\n✅ Mastering complete after ${iteration} iteration(s)');
      logger.info('   Final loudness: ${finalMetrics.loudness.toFixed(2)} LUFS');
      logger.info('   Quality score: ${((finalMetrics.qualityScore || 0) * 100).toFixed(0)}%');

      return {
        success: true,
        masteredPath: outputPath,
        metrics: finalMetrics,
        iterations: iteration,
        improvements,
      };
    } catch (error) {
      logger.error('Mastering error', { error: error.message || String(error) });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Apply mastering processing using ffmpeg
   */
  private async applyMastering(
    inputPath: string,
    outputPath: string,
    options: {
      targetLoudness: number;
      genre: string;
      style: string;
      stereoEnhancement?: boolean;
      preserveDynamics?: boolean;
    }
  ): Promise<string> {
    // Build ffmpeg filter chain for mastering
    const filters: string[] = [];

    // 1. EQ based on genre
    const eqPresets: Record<string, string> = {
      country: 'bass=g=2,treble=g=3',
      pop: 'bass=g=3,treble=g=2',
      rock: 'bass=g=4,treble=g=4',
      'r&b': 'bass=g=5,treble=g=2',
      indie: 'bass=g=1,treble=g=1',
      electronic: 'bass=g=6,treble=g=3',
    };
    filters.push(eqPresets[options.genre] || eqPresets.country);

    // 2. Multiband compression (simple version using compand)
    if (!options.preserveDynamics) {
      // Moderate compression for streaming
      filters.push('compand=attacks=0.1:decays=0.3:points=-80/-80|-45/-30|-30/-20|-20/-10|0/-5');
    } else {
      // Light compression to preserve dynamics
      filters.push('compand=attacks=0.1:decays=0.5:points=-80/-80|-45/-35|-30/-25|-20/-15|0/-8');
    }

    // 3. Stereo enhancement
    if (options.stereoEnhancement) {
      filters.push('stereotools=mlev=0.8');
    }

    // 4. Loudness normalization to target LUFS
    filters.push(`loudnorm=I=${options.targetLoudness}:TP=-1.5:LRA=11`);

    // 5. Final limiting to prevent clipping
    filters.push('alimiter=level_in=1:level_out=1:limit=0.95:attack=7:release=100:level=disabled');

    const filterChain = filters.join(',');

    // Execute ffmpeg
    const command = `ffmpeg -i "${inputPath}" -af "${filterChain}" -c:a aac -b:a 320k "${outputPath}" -y`;

    try {
      await execAsync(command);
      return outputPath;
    } catch (error) {
      throw new Error(`FFmpeg mastering failed: ${error}`);
    }
  }

  /**
   * Analyze audio metrics using ffmpeg
   */
  private async analyzeAudio(filePath: string): Promise<AudioMetrics> {
    try {
      // Get loudness stats using ffmpeg's loudnorm filter in dual-pass mode
      const command = `ffmpeg -i "${filePath}" -af "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=summary" -f null - 2>&1`;

      const { stdout, stderr } = await execAsync(command);
      const output = stdout + stderr;

      // Parse ffmpeg loudnorm output
      const inputI = this.extractValue(output, 'Input Integrated:');
      const inputTp = this.extractValue(output, 'Input True Peak:');
      const inputLra = this.extractValue(output, 'Input LRA:');

      // Calculate quality score based on metrics
      const loudnessScore = this.calculateLoudnessScore(inputI, -14);
      const peakScore = this.calculatePeakScore(inputTp, -1.5);
      const rangeScore = this.calculateRangeScore(inputLra, 11);
      const qualityScore = (loudnessScore + peakScore + rangeScore) / 3;

      return {
        loudness: inputI,
        loudnessRange: inputLra,
        truePeak: inputTp,
        dynamicRange: inputLra, // Approximation
        qualityScore,
      };
    } catch (error) {
      logger.error('Audio analysis error', { error: error.message || String(error) });
      // Return default values
      return {
        loudness: -23,
        loudnessRange: 7,
        truePeak: 0,
        dynamicRange: 7,
        qualityScore: 0.5,
      };
    }
  }

  /**
   * Extract numeric value from ffmpeg output
   */
  private extractValue(output: string, label: string): number {
    const regex = new RegExp(`${label}\\s+([-\\d.]+)`, 'i');
    const match = output.match(regex);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Calculate loudness score (0-1)
   */
  private calculateLoudnessScore(actual: number, target: number): number {
    const diff = Math.abs(actual - target);
    if (diff < 1.0) return 1.0;
    if (diff < 2.0) return 0.9;
    if (diff < 3.0) return 0.7;
    if (diff < 5.0) return 0.5;
    return 0.3;
  }

  /**
   * Calculate peak score (0-1)
   */
  private calculatePeakScore(truePeak: number, target: number): number {
    if (truePeak < target) return 1.0; // Perfect
    if (truePeak < target + 0.5) return 0.9;
    if (truePeak < target + 1.0) return 0.7;
    if (truePeak < 0) return 0.5; // Some headroom
    return 0.3; // Clipping risk
  }

  /**
   * Calculate dynamic range score (0-1)
   */
  private calculateRangeScore(lra: number, target: number): number {
    const diff = Math.abs(lra - target);
    if (diff < 2.0) return 1.0;
    if (diff < 4.0) return 0.9;
    if (diff < 6.0) return 0.7;
    if (lra > 4.0) return 0.6; // Some dynamics preserved
    return 0.4; // Over-compressed
  }

  /**
   * Check if mastering capabilities are available
   */
  isAvailable(): boolean {
    // Check if ffmpeg is installed
    try {
      require('child_process').execSync('ffmpeg -version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}

export const audioMasteringService = new AudioMasteringService();
