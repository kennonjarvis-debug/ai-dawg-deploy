/**
 * AutoRoutingEngine - Intelligent Audio Routing & Signal Chain Creation
 *
 * Automatically creates professional vocal processing chains:
 * - Detects vocal tracks from project
 * - Sets up bus routing (vocals → vocal bus → master)
 * - Creates send/return chains (reverb, delay, parallel compression)
 * - Adds processing inserts (EQ, compression, de-essing)
 * - Optimizes gain staging for clean signal flow
 */

import { RoutingEngine } from './RoutingEngine';
import type {
  RoutingChain,
  AudioBus,
  AudioSend,
  AudioInsert,
  TrackDetectionResult,
  VocalChainConfig,
  VocalProcessingPreset,
  GainStagingConfig,
  MixBusConfig,
  RoutingOperation,
  AutoRoutingResult,
} from '../../types/routing';
import type { TrackChannelStrip } from './types';

// ============================================================================
// VOCAL PROCESSING PRESETS
// ============================================================================

const VOCAL_PRESETS: Record<string, VocalProcessingPreset> = {
  pop: {
    name: 'Modern Pop',
    eq: {
      highpass: { frequency: 80, q: 0.7 },
      cuts: [
        { frequency: 250, gain: -2, q: 1.5 }, // Mud reduction
        { frequency: 500, gain: -1, q: 1.0 }, // Box resonance
      ],
      boosts: [
        { frequency: 3000, gain: 2, q: 1.2 }, // Clarity
        { frequency: 5000, gain: 1.5, q: 0.8 }, // Presence
      ],
      presence: { frequency: 4000, gain: 2.5, q: 1.0 },
      air: { frequency: 12000, gain: 2, q: 0.7 },
    },
    compression: {
      threshold: -18,
      ratio: 4,
      attack: 5,
      release: 100,
      knee: 6,
      makeupGain: 3,
    },
    deEsser: {
      frequency: 7000,
      threshold: -20,
      ratio: 3,
    },
    reverbSend: 0.25,
    delaySend: 0.15,
    parallelCompressionMix: 0.3,
  },

  'hip-hop': {
    name: 'Hip-Hop/Rap',
    eq: {
      highpass: { frequency: 100, q: 0.7 },
      cuts: [
        { frequency: 200, gain: -3, q: 1.5 }, // Low-mid cleanup
      ],
      boosts: [
        { frequency: 2000, gain: 1, q: 1.0 }, // Articulation
        { frequency: 5000, gain: 3, q: 1.2 }, // Bite
      ],
      presence: { frequency: 3500, gain: 3, q: 1.0 },
      air: { frequency: 10000, gain: 1.5, q: 0.8 },
    },
    compression: {
      threshold: -15,
      ratio: 6,
      attack: 3,
      release: 80,
      knee: 4,
      makeupGain: 4,
    },
    deEsser: {
      frequency: 6500,
      threshold: -18,
      ratio: 4,
    },
    reverbSend: 0.1,
    delaySend: 0.2,
    parallelCompressionMix: 0.4,
  },

  rnb: {
    name: 'R&B/Soul',
    eq: {
      highpass: { frequency: 70, q: 0.7 },
      cuts: [
        { frequency: 300, gain: -1.5, q: 1.2 },
      ],
      boosts: [
        { frequency: 2500, gain: 1.5, q: 1.0 },
        { frequency: 8000, gain: 2, q: 0.7 },
      ],
      presence: { frequency: 3000, gain: 2, q: 0.8 },
      air: { frequency: 15000, gain: 2.5, q: 0.6 },
    },
    compression: {
      threshold: -20,
      ratio: 3,
      attack: 8,
      release: 120,
      knee: 8,
      makeupGain: 2,
    },
    deEsser: {
      frequency: 7500,
      threshold: -22,
      ratio: 2.5,
    },
    reverbSend: 0.35,
    delaySend: 0.1,
    parallelCompressionMix: 0.25,
  },

  rock: {
    name: 'Rock',
    eq: {
      highpass: { frequency: 90, q: 0.7 },
      cuts: [
        { frequency: 350, gain: -2, q: 1.5 },
      ],
      boosts: [
        { frequency: 2000, gain: 2, q: 1.2 },
        { frequency: 4000, gain: 3, q: 1.0 },
      ],
      presence: { frequency: 5000, gain: 3.5, q: 1.2 },
      air: { frequency: 10000, gain: 1.5, q: 0.8 },
    },
    compression: {
      threshold: -16,
      ratio: 5,
      attack: 4,
      release: 90,
      knee: 5,
      makeupGain: 3.5,
    },
    deEsser: {
      frequency: 6000,
      threshold: -19,
      ratio: 3.5,
    },
    reverbSend: 0.2,
    delaySend: 0.15,
    parallelCompressionMix: 0.35,
  },
};

// ============================================================================
// AUTO ROUTING ENGINE
// ============================================================================

export class AutoRoutingEngine {
  private routingEngine: RoutingEngine;
  private operations: RoutingOperation[] = [];

  constructor(routingEngine: RoutingEngine) {
    this.routingEngine = routingEngine;
  }

  /**
   * Automatically create a complete vocal processing chain
   */
  async autoCreateVocalChain(config: VocalChainConfig): Promise<AutoRoutingResult> {
    console.log('[AutoRoutingEngine] Creating vocal chain...', config);

    try {
      this.operations = [];
      const chains: RoutingChain[] = [];
      const buses: AudioBus[] = [];

      // 1. Detect vocal tracks if not provided
      const vocalTracks = config.vocalTracks.length > 0
        ? config.vocalTracks
        : await this.detectVocalTracks();

      if (vocalTracks.length === 0) {
        return {
          success: false,
          chains: [],
          buses: [],
          operations: [],
          summary: 'No vocal tracks detected',
          details: {
            vocalTracksDetected: 0,
            backingVocalIds: [],
            busesCreated: [],
            sendsCreated: 0,
            insertsCreated: 0,
          },
          error: 'No vocal tracks found in project',
        };
      }

      // 2. Create Vocal Mix Bus
      const vocalMixBus = this.createMixBus('Vocal Mix Bus', vocalTracks);
      buses.push(vocalMixBus);

      // 3. Create effect buses (reverb, delay, parallel compression)
      if (config.useReverbSend) {
        const reverbBus = this.createEffectBus('Vocal Reverb', 'reverb');
        buses.push(reverbBus);
      }

      if (config.useDelaySend) {
        const delayBus = this.createEffectBus('Vocal Delay', 'delay');
        buses.push(delayBus);
      }

      if (config.useParallelCompression) {
        const parallelCompBus = this.createEffectBus('Vocal Parallel Comp', 'compression');
        buses.push(parallelCompBus);
      }

      // 4. Process each vocal track
      const preset = VOCAL_PRESETS[config.genre || 'pop'];
      let totalSends = 0;
      let totalInserts = 0;

      for (const trackId of vocalTracks) {
        const track = this.routingEngine.getTrack(trackId);
        if (!track) continue;

        const isLead = trackId === config.leadVocalId;

        // Create processing chain for this track
        const chain = await this.createVocalProcessingChain(
          trackId,
          track.name,
          preset,
          isLead,
          config
        );

        chains.push(chain);
        totalSends += chain.sends.length;
        totalInserts += chain.inserts.length;

        // Route track to vocal mix bus
        this.routingEngine.routeTrackToBus(trackId, vocalMixBus.id);
        this.addOperation('route-track', `Route ${track.name} to ${vocalMixBus.name}`, [trackId]);
      }

      // 5. Optimize gain staging across the chain
      await this.optimizeGainStaging(vocalTracks);

      // Build summary
      const summary = this.buildSummary(vocalTracks, buses, config);

      return {
        success: true,
        chains,
        buses,
        operations: this.operations,
        summary,
        details: {
          vocalTracksDetected: vocalTracks.length,
          leadVocalId: config.leadVocalId,
          backingVocalIds: config.backingVocalIds,
          busesCreated: buses.map(b => b.name),
          sendsCreated: totalSends,
          insertsCreated: totalInserts,
        },
      };
    } catch (error: any) {
      console.error('[AutoRoutingEngine] Error creating vocal chain:', error);
      return {
        success: false,
        chains: [],
        buses: [],
        operations: this.operations,
        summary: 'Failed to create vocal chain',
        details: {
          vocalTracksDetected: 0,
          backingVocalIds: [],
          busesCreated: [],
          sendsCreated: 0,
          insertsCreated: 0,
        },
        error: error.message,
      };
    }
  }

  /**
   * Detect vocal tracks from the project
   */
  async detectVocalTracks(): Promise<string[]> {
    console.log('[AutoRoutingEngine] Detecting vocal tracks...');

    const vocalTracks: string[] = [];
    const tracks = this.routingEngine.getTracks();

    for (const [trackId, track] of tracks) {
      // Simple detection based on track name
      const name = track.name.toLowerCase();
      const isVocal = name.includes('vocal') ||
                      name.includes('vox') ||
                      name.includes('voice') ||
                      name.includes('lead') ||
                      name.includes('harmony') ||
                      name.includes('backing');

      if (isVocal) {
        vocalTracks.push(trackId);
        console.log(`[AutoRoutingEngine] Detected vocal track: ${track.name}`);
      }
    }

    // In a real implementation, we would analyze audio content using AI
    // to detect vocals based on spectral characteristics

    return vocalTracks;
  }

  /**
   * Create a mix bus for grouping tracks
   */
  createMixBus(name: string, tracks: string[]): AudioBus {
    console.log(`[AutoRoutingEngine] Creating mix bus: ${name}`);

    const bus = this.routingEngine.createBus(name, true);

    this.addOperation('create-bus', `Create mix bus: ${name}`, tracks);

    return {
      id: bus.id,
      name: bus.name,
      type: 'mix',
      routing: tracks,
      volume: 1.0,
      pan: 0,
      muted: false,
      solo: false,
    };
  }

  /**
   * Create an effect bus (reverb, delay, etc.)
   */
  createEffectBus(name: string, effectType: string): AudioBus {
    console.log(`[AutoRoutingEngine] Creating effect bus: ${name}`);

    const bus = this.routingEngine.createBus(name, true);

    this.addOperation('create-bus', `Create ${effectType} bus: ${name}`, []);

    return {
      id: bus.id,
      name: bus.name,
      type: 'send-return',
      routing: [],
      volume: 1.0,
      pan: 0,
      muted: false,
      solo: false,
    };
  }

  /**
   * Create a complete vocal processing chain for a track
   */
  async createVocalProcessingChain(
    trackId: string,
    trackName: string,
    preset: VocalProcessingPreset,
    isLead: boolean,
    config: VocalChainConfig
  ): Promise<RoutingChain> {
    console.log(`[AutoRoutingEngine] Creating processing chain for: ${trackName}`);

    const inserts: AudioInsert[] = [];
    const sends: AudioSend[] = [];

    // Insert 0: High-pass filter (EQ)
    inserts.push({
      id: `${trackId}-hpf`,
      slot: 0,
      type: 'eq',
      parameters: {
        type: 'highpass',
        frequency: preset.eq.highpass.frequency,
        q: preset.eq.highpass.q,
      },
      bypassed: false,
      position: 'pre-eq',
    });

    // Insert 1: Main EQ
    inserts.push({
      id: `${trackId}-eq`,
      slot: 1,
      type: 'eq',
      parameters: {
        bands: [
          ...preset.eq.cuts,
          ...preset.eq.boosts,
          preset.eq.presence,
          preset.eq.air,
        ],
      },
      bypassed: false,
      position: 'eq',
    });

    // Insert 2: De-esser (if enabled)
    if (config.useDeEsser && preset.deEsser) {
      inserts.push({
        id: `${trackId}-deesser`,
        slot: 2,
        type: 'deesser',
        parameters: preset.deEsser,
        bypassed: false,
        position: 'eq',
      });
    }

    // Insert 3: Compressor
    inserts.push({
      id: `${trackId}-comp`,
      slot: 3,
      type: 'compressor',
      parameters: preset.compression,
      bypassed: false,
      position: 'post-eq',
    });

    // Create sends for effects
    const buses = this.routingEngine.getBuses();

    // Reverb send
    if (config.useReverbSend) {
      const reverbBus = Array.from(buses.values()).find(b => b.name.includes('Reverb'));
      if (reverbBus) {
        sends.push({
          id: `${trackId}-reverb-send`,
          source: trackId,
          destination: reverbBus.id,
          level: preset.reverbSend * (isLead ? 1.0 : 0.8),
          preFader: false,
          enabled: true,
          purpose: 'reverb',
        });

        this.routingEngine.createSendToBus(trackId, reverbBus.id, 'post-fader', preset.reverbSend);
      }
    }

    // Delay send
    if (config.useDelaySend) {
      const delayBus = Array.from(buses.values()).find(b => b.name.includes('Delay'));
      if (delayBus) {
        sends.push({
          id: `${trackId}-delay-send`,
          source: trackId,
          destination: delayBus.id,
          level: preset.delaySend * (isLead ? 1.0 : 0.6),
          preFader: false,
          enabled: true,
          purpose: 'delay',
        });

        this.routingEngine.createSendToBus(trackId, delayBus.id, 'post-fader', preset.delaySend);
      }
    }

    // Parallel compression send
    if (config.useParallelCompression && preset.parallelCompressionMix) {
      const parallelCompBus = Array.from(buses.values()).find(b => b.name.includes('Parallel'));
      if (parallelCompBus) {
        sends.push({
          id: `${trackId}-parallel-send`,
          source: trackId,
          destination: parallelCompBus.id,
          level: preset.parallelCompressionMix,
          preFader: true, // Pre-fader for parallel compression
          enabled: true,
          purpose: 'parallel-compression',
        });

        this.routingEngine.createSendToBus(trackId, parallelCompBus.id, 'pre-fader', preset.parallelCompressionMix);
      }
    }

    this.addOperation('add-insert', `Add processing chain to ${trackName}`, [trackId]);

    return {
      trackId,
      trackName,
      busses: [],
      sends,
      inserts,
      output: 'vocal-mix-bus',
      createdAt: new Date(),
    };
  }

  /**
   * Assign sends to tracks for effects routing
   */
  assignSends(trackId: string, sends: AudioSend[]): void {
    console.log(`[AutoRoutingEngine] Assigning ${sends.length} sends to track ${trackId}`);

    for (const send of sends) {
      this.routingEngine.createSendToBus(
        trackId,
        send.destination,
        send.preFader ? 'pre-fader' : 'post-fader',
        send.level
      );
    }

    this.addOperation('create-send', `Assign sends to track ${trackId}`, [trackId]);
  }

  /**
   * Optimize gain staging across the vocal chain
   */
  async optimizeGainStaging(trackIds: string[]): Promise<void> {
    console.log('[AutoRoutingEngine] Optimizing gain staging...');

    // Target levels (in dB)
    const TARGET_RMS = -18; // RMS level for vocals
    const TARGET_HEADROOM = -6; // Headroom before clipping

    for (const trackId of trackIds) {
      const track = this.routingEngine.getTrack(trackId);
      if (!track) continue;

      // In a real implementation, we would analyze the actual audio
      // and adjust input gain to achieve target levels
      const config: GainStagingConfig = {
        trackId,
        inputGain: 0,
        faderLevel: -3, // Start conservatively
        headroom: TARGET_HEADROOM,
        currentPeak: -12, // Would be measured from audio
        currentRms: -20, // Would be measured from audio
        targetRms: TARGET_RMS,
      };

      // Calculate required gain adjustment
      const gainAdjustment = TARGET_RMS - config.currentRms;
      track.channelStrip.inputGain = gainAdjustment;

      console.log(`[AutoRoutingEngine] Set input gain for ${track.name}: ${gainAdjustment.toFixed(1)} dB`);
    }

    this.addOperation('set-level', 'Optimize gain staging', trackIds);
  }

  /**
   * Add operation to history
   */
  private addOperation(type: string, description: string, targets: string[]): void {
    this.operations.push({
      type: type as any,
      description,
      targets,
      params: {},
      reversible: true,
    });
  }

  /**
   * Build summary message
   */
  private buildSummary(
    vocalTracks: string[],
    buses: AudioBus[],
    config: VocalChainConfig
  ): string {
    const trackNames = vocalTracks
      .map(id => this.routingEngine.getTrack(id)?.name || id)
      .join(', ');

    const busNames = buses.map(b => b.name).join(', ');

    const effects = [];
    if (config.useReverbSend) effects.push('Reverb');
    if (config.useDelaySend) effects.push('Delay');
    if (config.useParallelCompression) effects.push('Parallel Comp');

    return `Created vocal chain: ${trackNames} → EQ → Comp${config.useDeEsser ? ' → De-esser' : ''} → ${busNames} → Master. Effects: ${effects.join(', ')}`;
  }

  /**
   * Get routing operations history
   */
  getOperations(): RoutingOperation[] {
    return this.operations;
  }

  /**
   * Clear operation history
   */
  clearOperations(): void {
    this.operations = [];
  }
}
