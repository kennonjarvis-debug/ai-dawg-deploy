/**
 * Beat Generation Service for JARVIS
 * Generates backing tracks for voice memos using Replicate API (MusicGen)
 * Integrates with audio analysis to create contextually appropriate beats
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { InstrumentalAnalysis } from './audio-analysis.service.js';

// Import music generation from DAWG AI lib
// Note: We're using direct imports instead of HTTP calls since we're in the same codebase
import Replicate from 'replicate';

const execAsync = promisify(exec);

const BEATS_OUTPUT_PATH = '/Users/benkennon/Library/Group Containers/group.com.apple.VoiceMemos.shared/Recordings/Jarvis/Beats';

export interface BeatGenerationOptions {
  /**
   * Reference instrumental analysis for style matching
   */
  instrumentalAnalysis?: InstrumentalAnalysis;

  /**
   * Manual override for genre
   */
  genre?: string;

  /**
   * Manual override for mood
   */
  mood?: string;

  /**
   * Manual override for instruments
   */
  instruments?: string[];

  /**
   * Duration in seconds (1-120)
   */
  duration?: number;

  /**
   * Match pitch/key to original (e.g., "G Major")
   */
  matchKey?: string;

  /**
   * Match tempo to original (BPM)
   */
  matchTempo?: number;

  /**
   * Model quality
   * - small: 300M params, mono, fast (30-60s)
   * - medium: 1.5B params, mono, balanced (60-90s)
   * - large: 3.3B params, mono, high quality (90-120s)
   * - stereo-melody: 1.5B params, stereo, melody-conditioned
   * - stereo-large: 3.3B params, stereo, Suno-level quality (120-180s) ⭐ RECOMMENDED
   */
  model?: 'small' | 'medium' | 'large' | 'stereo-melody' | 'stereo-large';

  /**
   * Vocals audio file path (for melody conditioning)
   */
  vocalsPath?: string;
}

export interface BeatGenerationResult {
  success: boolean;
  beatPath?: string;
  duration?: number;
  prompt?: string;
  error?: string;
}

export class BeatGenerationService {
  private replicateApiToken: string;
  private replicate: Replicate | null = null;

  constructor() {
    this.replicateApiToken = process.env.REPLICATE_API_TOKEN || '';
    if (this.replicateApiToken) {
      this.replicate = new Replicate({
        auth: this.replicateApiToken,
      });
    }
  }

  /**
   * Generate a beat/backing track for a voice memo
   */
  async generateBeat(options: BeatGenerationOptions = {}): Promise<BeatGenerationResult> {
    try {
      console.log('🎹 Generating beat...');

      // Validate Replicate API token
      if (!this.replicateApiToken) {
        console.warn('⚠️  REPLICATE_API_TOKEN not set. Beat generation disabled.');
        return {
          success: false,
          error: 'Replicate API token not configured',
        };
      }

      // Ensure output directory exists
      if (!fs.existsSync(BEATS_OUTPUT_PATH)) {
        fs.mkdirSync(BEATS_OUTPUT_PATH, { recursive: true });
      }

      // Build prompt from instrumental analysis or manual overrides
      const prompt = this.buildPrompt(options);
      const duration = options.duration || 30;
      const model = options.model || 'stereo-large'; // Default to highest quality

      console.log(`🎵 Generating: "${prompt}"`);
      console.log(`   Duration: ${duration}s`);
      console.log(`   Model: ${model}`);

      // Call Replicate API directly
      if (!this.replicate) {
        throw new Error('Replicate client not initialized');
      }

      const modelVersion = this.getModelVersion(model);

      // Build input parameters
      const input: any = {
        prompt,
        duration,
        temperature: 1,
        top_k: 250,
        top_p: 0,
        normalization_strategy: 'loudness',
      };

      // Add stereo-specific parameters for stereo models
      if (model.includes('stereo')) {
        input.model_version = 'stereo-large'; // Request stereo variant
        input.output_format = 'wav'; // Stereo works best with WAV
      }

      // Add melody conditioning if vocals path provided (stereo-melody only)
      if (model === 'stereo-melody' && options.vocalsPath) {
        input.melody_path = options.vocalsPath;
        input.continuation = false;
      }

      const output = await this.replicate.run(
        modelVersion as any,
        { input }
      ) as any;

      // Replicate returns audio URL
      const audioUrl = Array.isArray(output) ? output[0] : output;

      // Download generated audio
      const beatPath = await this.downloadBeat(audioUrl, prompt);

      console.log(`✅ Beat generated: ${path.basename(beatPath)}`);

      return {
        success: true,
        beatPath,
        duration,
        prompt,
      };
    } catch (error) {
      console.error('Beat generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get model version for Replicate
   * Updated with Stereo models for Suno-level quality
   */
  private getModelVersion(model: string): string {
    const versions = {
      // Mono models (legacy)
      small: 'meta/musicgen:7a76a8258b23fae65c5a22debb8841d1d7e816b75c2f24218cd2bd8573787906',
      medium: 'meta/musicgen:b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38',
      large: 'meta/musicgen:7be0f12c54a8d033a0fbd14418c9af98962da9a86f5ff7811f9b3a0d3b8e45e6',

      // Stereo models (Suno-level quality)
      'stereo-melody': 'meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb',
      'stereo-large': 'meta/musicgen:b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38', // 3.3B params, stereo, 48kHz
    };

    return versions[model as keyof typeof versions] || versions['stereo-large'];
  }

  /**
   * Build music generation prompt from analysis or manual overrides
   */
  private buildPrompt(options: BeatGenerationOptions): string {
    const parts: string[] = [];

    // Use manual overrides first, fallback to instrumental analysis
    const genre = options.genre || options.instrumentalAnalysis?.genre || 'country pop';
    const mood = options.mood || options.instrumentalAnalysis?.mood || 'upbeat';
    const instruments = options.instruments || options.instrumentalAnalysis?.instruments || ['acoustic guitar', 'drums', 'bass'];
    const tempo = options.instrumentalAnalysis?.tempo;
    const bpm = options.instrumentalAnalysis?.bpm;

    // Build prompt
    parts.push(mood);
    parts.push(genre);
    parts.push('instrumental');
    parts.push(`featuring ${instruments.join(', ')}`);

    if (tempo) {
      parts.push(`${tempo} tempo`);
    }

    if (bpm) {
      parts.push(`${bpm} BPM`);
    }

    // Add "no vocals" to ensure instrumental only
    parts.push('no vocals');
    parts.push('backing track');

    return parts.join(', ');
  }

  /**
   * Download generated beat from URL
   */
  private async downloadBeat(audioUrl: string, prompt: string): Promise<string> {
    const https = await import('https');
    const http = await import('http');

    return new Promise((resolve, reject) => {
      const protocol = audioUrl.startsWith('https') ? https : http;

      protocol.get(audioUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download beat: ${response.statusCode}`));
          return;
        }

        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);

          // Generate filename from prompt (sanitized)
          const sanitizedPrompt = prompt
            .replace(/[<>:"/\\|?*]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 50);

          const timestamp = Date.now();
          const filename = `JARVIS_Beat_${sanitizedPrompt}_${timestamp}.wav`;
          const beatPath = path.join(BEATS_OUTPUT_PATH, filename);

          fs.writeFileSync(beatPath, buffer);

          resolve(beatPath);
        });
        response.on('error', reject);
      }).on('error', reject);
    });
  }

  /**
   * Combine vocals and beat into single file
   */
  async combineVocalsAndBeat(
    vocalsPath: string,
    beatPath: string,
    outputName: string
  ): Promise<string> {
    try {
      console.log('🎼 Combining vocals and beat...');

      const VOICE_MEMOS_MAIN_PATH = '/Users/benkennon/Library/Group Containers/group.com.apple.VoiceMemos.shared/Recordings';
      const outputPath = path.join(VOICE_MEMOS_MAIN_PATH, `JARVIS - ${outputName}.m4a`);

      // Use ffmpeg to mix vocals and beat
      // Ensure vocals are louder than beat (-filter_complex for mixing)
      const command = `ffmpeg -i "${vocalsPath}" -i "${beatPath}" -filter_complex "[0:a]volume=1.2[vocals];[1:a]volume=0.6[beat];[vocals][beat]amix=inputs=2:duration=longest:dropout_transition=2[out]" -map "[out]" -c:a aac -b:a 192k "${outputPath}" -y`;

      await execAsync(command);

      console.log(`✅ Combined track created: ${path.basename(outputPath)}`);
      console.log(`📱 Synced to Voice Memos app`);

      return outputPath;
    } catch (error) {
      console.error('Combining error:', error);
      throw error;
    }
  }

  /**
   * Check if beat generation is available
   */
  isAvailable(): boolean {
    return !!this.replicateApiToken;
  }
}

export const beatGenerationService = new BeatGenerationService();
