/**
 * Vocal Processing Recommendation Engine
 *
 * Analyzes vocal recordings and recommends appropriate effects and processing
 * Based on vocal characteristics, genre, and detected issues
 */

import type { TimbreProfile } from './VocalAnalyzer';

// ============================================================================
// TYPES
// ============================================================================

export interface VocalAnalysis {
  timbre: TimbreProfile;
  dynamicRange: number;           // dB
  peakLevel: number;              // 0-1
  hasClipping: boolean;
  noiseFloor: number;             // dB
  spectralBalance: 'dark' | 'balanced' | 'bright';
  hasSibilance: boolean;
  hasRoomTone: boolean;
  breathNoise: 'low' | 'moderate' | 'high';
}

export interface EffectRecommendation {
  type: string;
  name: string;
  reason: string;
  parameters: Record<string, number | string>;
  priority: 'essential' | 'recommended' | 'optional';
}

export interface EffectChain {
  preEffects: EffectRecommendation[];      // Before pitch correction
  tuning?: EffectRecommendation;           // Pitch correction
  dynamics: EffectRecommendation[];        // Compression, de-essing
  tonal: EffectRecommendation[];           // EQ, saturation
  spatial: EffectRecommendation[];         // Reverb, delay
  postEffects: EffectRecommendation[];     // Final polish
}

export type Genre =
  | 'country'
  | 'pop'
  | 'rock'
  | 'rnb'
  | 'hip-hop'
  | 'indie'
  | 'folk'
  | 'jazz';

// ============================================================================
// VOCAL PROCESSOR CLASS
// ============================================================================

export class VocalProcessor {
  /**
   * Analyze vocal audio and extract characteristics
   */
  analyzeVocal(audioBuffer: AudioBuffer): VocalAnalysis {
    const channelData = audioBuffer.getChannelData(0);

    // Calculate peak level
    const peakLevel = this.calculatePeak(channelData);

    // Detect clipping
    const hasClipping = this.detectClipping(channelData);

    // Calculate dynamic range
    const dynamicRange = this.calculateDynamicRange(channelData);

    // Estimate noise floor
    const noiseFloor = this.estimateNoiseFloor(channelData);

    // Spectral analysis
    const spectralBalance = this.analyzeSpectralBalance(channelData);

    // Detect sibilance (harsh "s" sounds)
    const hasSibilance = this.detectSibilance(channelData, audioBuffer.sampleRate);

    // Detect room tone/reverb
    const hasRoomTone = this.detectRoomTone(channelData);

    // Detect breath noise
    const breathNoise = this.detectBreathNoise(channelData);

    // Placeholder timbre (would use VocalAnalyzer in real implementation)
    const timbre: TimbreProfile = {
      brightness: 0.5,
      warmth: 0.5,
      roughness: 0.3,
      spectralCentroid: 1000,
      spectralRolloff: 3000,
      harmonicRichness: 0.6,
    };

    return {
      timbre,
      dynamicRange,
      peakLevel,
      hasClipping,
      noiseFloor,
      spectralBalance,
      hasSibilance,
      hasRoomTone,
      breathNoise,
    };
  }

  /**
   * Recommend effects chain based on analysis and genre
   */
  recommendEffects(
    analysis: VocalAnalysis,
    genre: Genre,
    userPreferences: { naturalSound?: boolean; heavyProduction?: boolean } = {}
  ): EffectChain {
    const chain: EffectChain = {
      preEffects: [],
      dynamics: [],
      tonal: [],
      spatial: [],
      postEffects: [],
    };

    // ========================================================================
    // PRE-EFFECTS (Cleanup)
    // ========================================================================

    // Noise gate (if high noise floor)
    if (analysis.noiseFloor > -60) {
      chain.preEffects.push({
        type: 'gate',
        name: 'Noise Gate',
        reason: 'Remove background noise between phrases',
        parameters: {
          threshold: analysis.noiseFloor + 6,
          attack: 5,
          release: 100,
        },
        priority: 'recommended',
      });
    }

    // High-pass filter (always recommended)
    chain.preEffects.push({
      type: 'eq',
      name: 'High-Pass Filter',
      reason: 'Remove rumble and low-frequency noise',
      parameters: {
        type: 'highpass',
        frequency: 80,
        slope: 12,
      },
      priority: 'essential',
    });

    // De-reverb (if room tone detected)
    if (analysis.hasRoomTone) {
      chain.preEffects.push({
        type: 'dereverb',
        name: 'Room Tone Reduction',
        reason: 'Clean up excessive room ambience',
        parameters: {
          amount: 30,
        },
        priority: 'recommended',
      });
    }

    // ========================================================================
    // PITCH CORRECTION (Optional)
    // ========================================================================

    if (!userPreferences.naturalSound) {
      chain.tuning = {
        type: 'autotune',
        name: 'Pitch Correction',
        reason: 'Subtle pitch correction for more polished sound',
        parameters: {
          strength: genre === 'pop' || genre === 'hip-hop' ? 70 : 30,
          speed: genre === 'hip-hop' ? 0 : 50, // Fast for T-Pain effect, slower for natural
        },
        priority: 'optional',
      };
    }

    // ========================================================================
    // DYNAMICS PROCESSING
    // ========================================================================

    // Compression (essential for vocals)
    const compressorSettings = this.getCompressorSettings(genre, analysis);
    chain.dynamics.push({
      type: 'compressor',
      name: 'Vocal Compressor',
      reason: 'Even out dynamics and add presence',
      parameters: compressorSettings,
      priority: 'essential',
    });

    // De-esser (if sibilance detected)
    if (analysis.hasSibilance) {
      chain.dynamics.push({
        type: 'deesser',
        name: 'De-Esser',
        reason: 'Tame harsh "s" sounds',
        parameters: {
          frequency: 7000,
          threshold: -20,
          range: 6,
        },
        priority: 'essential',
      });
    }

    // ========================================================================
    // TONAL PROCESSING (EQ, Saturation)
    // ========================================================================

    // EQ based on spectral balance
    const eqRecommendations = this.getEQRecommendations(analysis, genre);
    chain.tonal.push(...eqRecommendations);

    // Saturation (warmth/presence)
    if (genre === 'rock' || genre === 'country' || analysis.timbre.warmth < 0.4) {
      chain.tonal.push({
        type: 'saturation',
        name: 'Analog Saturation',
        reason: 'Add warmth and harmonic richness',
        parameters: {
          drive: genre === 'rock' ? 40 : 20,
          mix: 50,
        },
        priority: 'recommended',
      });
    }

    // ========================================================================
    // SPATIAL EFFECTS (Reverb, Delay)
    // ========================================================================

    const spatialEffects = this.getSpatialEffects(genre, userPreferences);
    chain.spatial.push(...spatialEffects);

    // ========================================================================
    // POST-EFFECTS (Final Polish)
    // ========================================================================

    // Limiter (safety)
    chain.postEffects.push({
      type: 'limiter',
      name: 'Output Limiter',
      reason: 'Prevent clipping and maximize loudness',
      parameters: {
        threshold: -1,
        release: 100,
      },
      priority: 'essential',
    });

    return chain;
  }

  /**
   * Apply recommended effects to audio buffer (simplified)
   * In production, this would use Tone.js effects
   */
  applyEffects(audioBuffer: AudioBuffer, effectChain: EffectChain): AudioBuffer {
    // Placeholder: In real implementation, would apply Tone.js effects
    // For now, return original buffer
    console.log('Applying effect chain:', effectChain);
    return audioBuffer;
  }

  // ==========================================================================
  // GENRE-SPECIFIC SETTINGS
  // ==========================================================================

  private getCompressorSettings(genre: Genre, analysis: VocalAnalysis): Record<string, number> {
    const settings: Record<Genre, Record<string, number>> = {
      country: {
        ratio: 4,
        threshold: -18,
        attack: 10,
        release: 100,
        knee: 3,
      },
      pop: {
        ratio: 6,
        threshold: -15,
        attack: 5,
        release: 80,
        knee: 2,
      },
      rock: {
        ratio: 5,
        threshold: -20,
        attack: 15,
        release: 150,
        knee: 4,
      },
      rnb: {
        ratio: 8,
        threshold: -12,
        attack: 3,
        release: 60,
        knee: 1,
      },
      'hip-hop': {
        ratio: 10,
        threshold: -10,
        attack: 1,
        release: 40,
        knee: 0,
      },
      indie: {
        ratio: 3,
        threshold: -22,
        attack: 20,
        release: 200,
        knee: 5,
      },
      folk: {
        ratio: 3,
        threshold: -24,
        attack: 25,
        release: 250,
        knee: 6,
      },
      jazz: {
        ratio: 2.5,
        threshold: -20,
        attack: 15,
        release: 180,
        knee: 4,
      },
    };

    return settings[genre];
  }

  private getEQRecommendations(analysis: VocalAnalysis, genre: Genre): EffectRecommendation[] {
    const recommendations: EffectRecommendation[] = [];

    // Presence boost (2-5 kHz) - Makes vocals cut through
    recommendations.push({
      type: 'eq',
      name: 'Presence Boost',
      reason: 'Add clarity and intelligibility',
      parameters: {
        type: 'bell',
        frequency: 3000,
        gain: analysis.spectralBalance === 'dark' ? 4 : 2,
        q: 1.5,
      },
      priority: 'essential',
    });

    // Brightness adjustment
    if (analysis.spectralBalance === 'dark') {
      recommendations.push({
        type: 'eq',
        name: 'High Shelf',
        reason: 'Add air and sparkle to dark-sounding vocal',
        parameters: {
          type: 'highshelf',
          frequency: 10000,
          gain: 2,
        },
        priority: 'recommended',
      });
    } else if (analysis.spectralBalance === 'bright') {
      recommendations.push({
        type: 'eq',
        name: 'High Shelf',
        reason: 'Tame excessive brightness',
        parameters: {
          type: 'highshelf',
          frequency: 8000,
          gain: -2,
        },
        priority: 'recommended',
      });
    }

    // Low-mid mud reduction (200-500 Hz)
    if (genre === 'pop' || genre === 'hip-hop') {
      recommendations.push({
        type: 'eq',
        name: 'Mud Reduction',
        reason: 'Clear up low-mid muddiness',
        parameters: {
          type: 'bell',
          frequency: 300,
          gain: -2,
          q: 2,
        },
        priority: 'optional',
      });
    }

    // Warmth (for country/folk)
    if ((genre === 'country' || genre === 'folk') && analysis.timbre.warmth < 0.5) {
      recommendations.push({
        type: 'eq',
        name: 'Warmth Boost',
        reason: 'Add body and warmth',
        parameters: {
          type: 'lowshelf',
          frequency: 200,
          gain: 2,
        },
        priority: 'recommended',
      });
    }

    return recommendations;
  }

  private getSpatialEffects(
    genre: Genre,
    preferences: { naturalSound?: boolean; heavyProduction?: boolean }
  ): EffectRecommendation[] {
    const effects: EffectRecommendation[] = [];

    // Reverb settings by genre
    const reverbSettings: Record<Genre, { type: string; size: number; mix: number }> = {
      country: { type: 'plate', size: 50, mix: 20 },
      pop: { type: 'hall', size: 60, mix: 25 },
      rock: { type: 'room', size: 40, mix: 15 },
      rnb: { type: 'hall', size: 70, mix: 30 },
      'hip-hop': { type: 'plate', size: 30, mix: 10 },
      indie: { type: 'spring', size: 50, mix: 35 },
      folk: { type: 'room', size: 35, mix: 18 },
      jazz: { type: 'hall', size: 55, mix: 22 },
    };

    const reverb = reverbSettings[genre];

    effects.push({
      type: 'reverb',
      name: `${reverb.type.charAt(0).toUpperCase() + reverb.type.slice(1)} Reverb`,
      reason: `Classic ${genre} vocal space`,
      parameters: {
        type: reverb.type,
        size: reverb.size,
        mix: preferences.naturalSound ? reverb.mix * 0.6 : reverb.mix,
        predelay: 20,
      },
      priority: 'recommended',
    });

    // Delay (for some genres)
    if (genre === 'country' || genre === 'indie' || genre === 'pop') {
      effects.push({
        type: 'delay',
        name: 'Slap Delay',
        reason: 'Add depth and dimension',
        parameters: {
          time: genre === 'country' ? 85 : 120, // ms
          feedback: 20,
          mix: 15,
        },
        priority: 'optional',
      });
    }

    return effects;
  }

  // ==========================================================================
  // ANALYSIS HELPERS
  // ==========================================================================

  private calculatePeak(waveform: Float32Array): number {
    let peak = 0;
    for (let i = 0; i < waveform.length; i++) {
      const abs = Math.abs(waveform[i]);
      if (abs > peak) peak = abs;
    }
    return peak;
  }

  private detectClipping(waveform: Float32Array): boolean {
    const threshold = 0.99;
    for (let i = 0; i < waveform.length; i++) {
      if (Math.abs(waveform[i]) >= threshold) return true;
    }
    return false;
  }

  private calculateDynamicRange(waveform: Float32Array): number {
    const windowSize = 2048;
    const rmsValues: number[] = [];

    for (let i = 0; i < waveform.length - windowSize; i += windowSize) {
      const window = waveform.slice(i, i + windowSize);
      let sum = 0;
      for (let j = 0; j < window.length; j++) {
        sum += window[j] * window[j];
      }
      const rms = Math.sqrt(sum / window.length);
      if (rms > 0.001) rmsValues.push(rms);
    }

    if (rmsValues.length === 0) return 0;

    const max = Math.max(...rmsValues);
    const min = Math.min(...rmsValues);

    return 20 * Math.log10(max / (min || 0.001));
  }

  private estimateNoiseFloor(waveform: Float32Array): number {
    // Find quietest 10% of signal
    const rmsValues: number[] = [];
    const windowSize = 2048;

    for (let i = 0; i < waveform.length - windowSize; i += windowSize) {
      const window = waveform.slice(i, i + windowSize);
      let sum = 0;
      for (let j = 0; j < window.length; j++) {
        sum += window[j] * window[j];
      }
      rmsValues.push(Math.sqrt(sum / window.length));
    }

    const sorted = [...rmsValues].sort((a, b) => a - b);
    const noiseFloorRMS = sorted[Math.floor(sorted.length * 0.1)];

    return 20 * Math.log10(noiseFloorRMS || 0.001);
  }

  private analyzeSpectralBalance(waveform: Float32Array): 'dark' | 'balanced' | 'bright' {
    // Simplified: would use FFT in production
    // Analyze high-frequency content
    let highFreqEnergy = 0;
    let midFreqEnergy = 0;

    // Placeholder analysis
    const ratio = highFreqEnergy / (midFreqEnergy || 1);

    if (ratio < 0.5) return 'dark';
    if (ratio > 2) return 'bright';
    return 'balanced';
  }

  private detectSibilance(waveform: Float32Array, sampleRate: number): boolean {
    // Detect energy in 5-8 kHz range (sibilance frequencies)
    // Simplified implementation
    return false; // Placeholder
  }

  private detectRoomTone(waveform: Float32Array): boolean {
    // Detect reverberant tail in quiet sections
    // Simplified implementation
    return false; // Placeholder
  }

  private detectBreathNoise(waveform: Float32Array): 'low' | 'moderate' | 'high' {
    // Analyze low-frequency transients between phrases
    // Simplified implementation
    return 'low'; // Placeholder
  }
}

// Export singleton
export const vocalProcessor = new VocalProcessor();
