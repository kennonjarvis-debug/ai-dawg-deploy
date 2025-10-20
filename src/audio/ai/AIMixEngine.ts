/**
 * AIMixEngine - AI-Powered Intelligent Mixing
 *
 * Combines auto-routing with intelligent mixing decisions:
 * - Creates routing chains automatically
 * - Analyzes vocal tracks for optimal processing
 * - Applies genre-specific mixing templates
 * - Balances levels and applies processing
 * - Provides real-time mixing feedback
 */

import { AutoRoutingEngine } from '../routing/AutoRoutingEngine';
import { RoutingEngine } from '../routing/RoutingEngine';
import type {
  VocalChainConfig,
  AutoRoutingResult,
} from '../../types/routing';

// ============================================================================
// TYPES
// ============================================================================

export interface AIMixConfig {
  /** Project ID */
  projectId: string;

  /** Genre for mixing style */
  genre?: 'pop' | 'rock' | 'hip-hop' | 'rnb' | 'electronic' | 'country' | 'jazz';

  /** Mixing style */
  style?: 'natural' | 'polished' | 'aggressive' | 'intimate' | 'broadcast';

  /** Target loudness (LUFS) */
  targetLoudness?: number;

  /** Auto-detect vocal tracks */
  autoDetectVocals?: boolean;

  /** Specific track IDs to mix (if not auto-detecting) */
  trackIds?: string[];

  /** Enable parallel compression */
  useParallelCompression?: boolean;

  /** Enable reverb send */
  useReverbSend?: boolean;

  /** Enable delay send */
  useDelaySend?: boolean;

  /** Enable de-esser */
  useDeEsser?: boolean;
}

export interface AIMixResult {
  /** Success status */
  success: boolean;

  /** Auto-routing result */
  routing: AutoRoutingResult;

  /** Processing summary */
  summary: string;

  /** Detailed mix report */
  report: {
    vocalTracksProcessed: number;
    effectsApplied: string[];
    busesCreated: string[];
    totalProcessingTime: number;
    recommendations?: string[];
  };

  /** Warnings or issues */
  warnings?: string[];

  /** Error if failed */
  error?: string;
}

export interface MixingProgress {
  /** Current step */
  step: string;

  /** Progress percentage (0-100) */
  progress: number;

  /** Step details */
  details: string;
}

// ============================================================================
// AI MIX ENGINE
// ============================================================================

export class AIMixEngine {
  private routingEngine: RoutingEngine;
  private autoRoutingEngine: AutoRoutingEngine;
  private progressCallback?: (progress: MixingProgress) => void;

  constructor(routingEngine: RoutingEngine) {
    this.routingEngine = routingEngine;
    this.autoRoutingEngine = new AutoRoutingEngine(routingEngine);
  }

  /**
   * Set progress callback for real-time updates
   */
  setProgressCallback(callback: (progress: MixingProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Perform complete AI vocal mixing
   */
  async mixVocals(config: AIMixConfig): Promise<AIMixResult> {
    console.log('[AIMixEngine] Starting AI vocal mix...', config);

    const startTime = Date.now();

    try {
      // Step 1: Detect or get vocal tracks
      this.updateProgress('Detecting Vocals', 10, 'Analyzing tracks for vocal content...');

      let vocalTracks: string[] = [];

      if (config.autoDetectVocals !== false) {
        vocalTracks = await this.autoRoutingEngine.detectVocalTracks();
      } else if (config.trackIds) {
        vocalTracks = config.trackIds;
      }

      if (vocalTracks.length === 0) {
        return {
          success: false,
          routing: {
            success: false,
            chains: [],
            buses: [],
            operations: [],
            summary: 'No vocal tracks found',
            details: {
              vocalTracksDetected: 0,
              backingVocalIds: [],
              busesCreated: [],
              sendsCreated: 0,
              insertsCreated: 0,
            },
            error: 'No vocal tracks detected',
          },
          summary: 'No vocal tracks found to mix',
          report: {
            vocalTracksProcessed: 0,
            effectsApplied: [],
            busesCreated: [],
            totalProcessingTime: Date.now() - startTime,
          },
          error: 'No vocal tracks detected in project',
        };
      }

      // Step 2: Identify lead vs backing vocals
      this.updateProgress('Analyzing Vocals', 25, 'Identifying lead and backing vocals...');

      const { leadVocalId, backingVocalIds } = this.identifyVocalRoles(vocalTracks);

      // Step 3: Create vocal chain configuration
      this.updateProgress('Configuring Chain', 40, 'Setting up processing chain...');

      const vocalChainConfig: VocalChainConfig = {
        vocalTracks,
        leadVocalId,
        backingVocalIds,
        genre: config.genre || 'pop',
        style: config.style || 'polished',
        useParallelCompression: config.useParallelCompression !== false,
        useReverbSend: config.useReverbSend !== false,
        useDelaySend: config.useDelaySend !== false,
        useDeEsser: config.useDeEsser !== false,
      };

      // Step 4: Create routing chains
      this.updateProgress('Creating Routing', 60, 'Building signal chains and buses...');

      const routingResult = await this.autoRoutingEngine.autoCreateVocalChain(vocalChainConfig);

      if (!routingResult.success) {
        return {
          success: false,
          routing: routingResult,
          summary: 'Failed to create routing',
          report: {
            vocalTracksProcessed: 0,
            effectsApplied: [],
            busesCreated: [],
            totalProcessingTime: Date.now() - startTime,
          },
          error: routingResult.error,
        };
      }

      // Step 5: Apply processing
      this.updateProgress('Applying Processing', 80, 'Applying EQ, compression, and effects...');

      const effectsApplied = this.getEffectsList(vocalChainConfig);

      // Step 6: Balance levels
      this.updateProgress('Balancing Levels', 90, 'Optimizing gain staging...');

      await this.balanceLevels(vocalTracks, leadVocalId);

      // Step 7: Complete
      this.updateProgress('Complete', 100, 'Mix completed successfully!');

      const processingTime = Date.now() - startTime;

      // Build recommendations
      const recommendations = this.generateRecommendations(vocalTracks, config);

      return {
        success: true,
        routing: routingResult,
        summary: `Successfully mixed ${vocalTracks.length} vocal track(s) with ${effectsApplied.length} effects`,
        report: {
          vocalTracksProcessed: vocalTracks.length,
          effectsApplied,
          busesCreated: routingResult.details.busesCreated,
          totalProcessingTime: processingTime,
          recommendations,
        },
      };

    } catch (error: any) {
      console.error('[AIMixEngine] Error mixing vocals:', error);

      return {
        success: false,
        routing: {
          success: false,
          chains: [],
          buses: [],
          operations: [],
          summary: 'Mix failed',
          details: {
            vocalTracksDetected: 0,
            backingVocalIds: [],
            busesCreated: [],
            sendsCreated: 0,
            insertsCreated: 0,
          },
          error: error.message,
        },
        summary: 'AI mix failed',
        report: {
          vocalTracksProcessed: 0,
          effectsApplied: [],
          busesCreated: [],
          totalProcessingTime: Date.now() - startTime,
        },
        error: error.message,
      };
    }
  }

  /**
   * Identify lead vocal vs backing vocals
   */
  private identifyVocalRoles(vocalTracks: string[]): {
    leadVocalId?: string;
    backingVocalIds: string[];
  } {
    let leadVocalId: string | undefined;
    const backingVocalIds: string[] = [];

    for (const trackId of vocalTracks) {
      const track = this.routingEngine.getTrack(trackId);
      if (!track) continue;

      const name = track.name.toLowerCase();

      // Heuristics for lead vocal detection
      const isLead = name.includes('lead') ||
                     name.includes('main') ||
                     (!name.includes('backing') &&
                      !name.includes('harmony') &&
                      !name.includes('bg') &&
                      !name.includes('double'));

      if (isLead && !leadVocalId) {
        leadVocalId = trackId;
      } else {
        backingVocalIds.push(trackId);
      }
    }

    // If no lead detected, use first track
    if (!leadVocalId && vocalTracks.length > 0) {
      leadVocalId = vocalTracks[0];
    }

    return { leadVocalId, backingVocalIds };
  }

  /**
   * Balance vocal levels (lead louder than backing)
   */
  private async balanceLevels(vocalTracks: string[], leadVocalId?: string): Promise<void> {
    for (const trackId of vocalTracks) {
      const track = this.routingEngine.getTrack(trackId);
      if (!track) continue;

      const isLead = trackId === leadVocalId;

      // Lead vocal: 0 dB (unity)
      // Backing vocals: -3 to -6 dB
      const targetLevel = isLead ? 1.0 : 0.5; // 0.5 = -6 dB

      track.channelStrip.volume = targetLevel;

      console.log(`[AIMixEngine] Set ${track.name} level: ${isLead ? '0 dB (lead)' : '-6 dB (backing)'}`);
    }
  }

  /**
   * Get list of effects applied
   */
  private getEffectsList(config: VocalChainConfig): string[] {
    const effects: string[] = ['EQ', 'Compression'];

    if (config.useDeEsser) {
      effects.push('De-esser');
    }

    if (config.useReverbSend) {
      effects.push('Reverb');
    }

    if (config.useDelaySend) {
      effects.push('Delay');
    }

    if (config.useParallelCompression) {
      effects.push('Parallel Compression');
    }

    return effects;
  }

  /**
   * Generate mixing recommendations
   */
  private generateRecommendations(vocalTracks: string[], config: AIMixConfig): string[] {
    const recommendations: string[] = [];

    // Genre-specific recommendations
    switch (config.genre) {
      case 'hip-hop':
        recommendations.push('Consider adding saturation for warmth and presence');
        recommendations.push('Try automating the vocal level for dynamic delivery');
        break;

      case 'pop':
        recommendations.push('Consider doubling the lead vocal for thickness');
        recommendations.push('Try adding a slap delay (80-120ms) for depth');
        break;

      case 'rock':
        recommendations.push('Consider adding harmonic distortion for edge');
        recommendations.push('Try parallel compression for more punch');
        break;

      case 'rnb':
        recommendations.push('Consider adding chorus on the reverb send');
        recommendations.push('Try automating reverb send for dynamic space');
        break;
    }

    // General recommendations
    if (vocalTracks.length > 1) {
      recommendations.push('Adjust panning on backing vocals for width');
    }

    if (!config.useParallelCompression) {
      recommendations.push('Try enabling parallel compression for more control');
    }

    return recommendations;
  }

  /**
   * Update progress
   */
  private updateProgress(step: string, progress: number, details: string): void {
    console.log(`[AIMixEngine] ${step}: ${progress}% - ${details}`);

    if (this.progressCallback) {
      this.progressCallback({ step, progress, details });
    }
  }

  /**
   * Quick mix preset: Apply quick vocal mix
   */
  async quickMixVocals(projectId: string, genre?: string): Promise<AIMixResult> {
    return this.mixVocals({
      projectId,
      genre: genre as any || 'pop',
      style: 'polished',
      autoDetectVocals: true,
      useParallelCompression: true,
      useReverbSend: true,
      useDelaySend: true,
      useDeEsser: true,
    });
  }

  /**
   * Clean up
   */
  dispose(): void {
    this.autoRoutingEngine.clearOperations();
    this.progressCallback = undefined;
  }
}
