/**
 * Genre-Specific Plugin Chain Presets
 *
 * Professional mixing/mastering chains for different genres using available plugins
 */

import { GenrePresetChain } from '../core/types';

/**
 * Morgan Wallen Style - Pop Country Vocal Chain
 *
 * Characteristics:
 * - Warm, intimate vocal tone
 * - Present but not harsh high-end
 * - Controlled dynamics with natural feel
 * - Subtle tape saturation
 * - Medium reverb (Nashville-style)
 * - De-essing for smoothness
 */
export const MORGAN_WALLEN_VOCAL: GenrePresetChain = {
  id: 'morgan-wallen-vocal',
  name: 'Morgan Wallen Style - Pop Country Vocal',
  genre: 'Pop Country',
  description: 'Warm, intimate vocal chain with Nashville-style polish. Uses Auto-Tune, Nectar 4, FabFilter, and Slate Digital plugins.',
  chain: [
    {
      pluginId: 'vst3-rx-11-de-click',
      pluginName: 'RX 11 De-click',
      slot: 0,
      parameters: {
        sensitivity: 0.3,
        threshold: 0.5
      }
    },
    {
      pluginId: 'vst3-rx-11-mouth-de-click',
      pluginName: 'RX 11 Mouth De-click',
      slot: 1,
      parameters: {
        sensitivity: 0.4,
        frequency: 0.6
      }
    },
    {
      pluginId: 'vst3-auto-tune-pro',
      pluginName: 'Auto-Tune Pro',
      slot: 2,
      parameters: {
        retune_speed: 0.25, // Natural, not robotic (25ms)
        humanize: 0.7,
        flex_tune: 0.6,
        throat_length: 0.52, // Slight warmth
        vibrato: 0.0 // No added vibrato
      }
    },
    {
      pluginId: 'au-uad-neve-1073',
      pluginName: 'UAD Neve 1073',
      slot: 3,
      parameters: {
        input_gain: 0.65, // Moderate gain
        low_freq: 0.2, // 110 Hz
        low_gain: 0.55, // +2 dB warmth
        mid_freq: 0.45, // 3.5 kHz presence
        mid_gain: 0.6, // +3 dB
        high_freq: 0.75, // 12 kHz air
        high_gain: 0.58, // +2.5 dB
        output_gain: 0.7
      }
    },
    {
      pluginId: 'vst3-fabfilter-pro-q-4',
      pluginName: 'FabFilter Pro-Q 4',
      slot: 4,
      parameters: {
        // Low cut
        'band_1_freq': 0.15, // 80 Hz
        'band_1_gain': 0.0,
        'band_1_q': 0.5,
        'band_1_type': 0.3, // High-pass
        // De-mud
        'band_2_freq': 0.28, // 250 Hz
        'band_2_gain': 0.35, // -3 dB
        'band_2_q': 0.6,
        // Presence boost
        'band_3_freq': 0.55, // 4 kHz
        'band_3_gain': 0.62, // +2.5 dB
        'band_3_q': 0.45,
        // Air
        'band_4_freq': 0.82, // 10 kHz
        'band_4_gain': 0.6, // +2 dB
        'band_4_q': 0.4
      }
    },
    {
      pluginId: 'vst3-fabfilter-pro-c-2',
      pluginName: 'FabFilter Pro-C 2',
      slot: 5,
      parameters: {
        threshold: 0.42, // -12 dB
        ratio: 0.35, // 3:1
        attack: 0.25, // 10 ms
        release: 0.45, // 80 ms (auto)
        knee: 0.5, // Soft knee
        makeup_gain: 0.55,
        style: 0.2 // Vocal preset
      }
    },
    {
      pluginId: 'vst3-nectar-4-gate',
      pluginName: 'Nectar 4 Gate',
      slot: 6,
      parameters: {
        threshold: 0.35,
        ratio: 0.6,
        attack: 0.1,
        release: 0.3,
        hold: 0.15
      }
    },
    {
      pluginId: 'vst3-vocal-de-esser',
      pluginName: 'Vocal De-Esser',
      slot: 7,
      parameters: {
        frequency: 0.7, // 6-8 kHz
        threshold: 0.45,
        range: 0.4, // -6 dB max reduction
        listen: 0.0
      }
    },
    {
      pluginId: 'vst3-slate-digital-virtual-tape-machines',
      pluginName: 'Slate Digital Virtual Tape Machines',
      slot: 8,
      parameters: {
        tape_type: 0.33, // FG-456 (warm)
        input: 0.5,
        output: 0.5,
        ips: 0.5, // 15 IPS
        emphasis: 0.3 // Subtle
      }
    },
    {
      pluginId: 'vst3-nectar-4-reverb',
      pluginName: 'Nectar 4 Reverb',
      slot: 9,
      parameters: {
        type: 0.4, // Plate
        decay: 0.42, // 1.8s
        pre_delay: 0.2, // 30ms
        mix: 0.18, // 18% wet
        tone: 0.55,
        width: 0.7
      }
    },
    {
      pluginId: 'vst3-slate-digital-fresh-air',
      pluginName: 'Slate Digital Fresh Air',
      slot: 10,
      parameters: {
        amount: 0.5, // Moderate brightness
        freq: 0.6, // 10 kHz
        drive: 0.2
      }
    }
  ],
  aiSettings: {
    automationEnabled: true,
    dynamicAdjustment: true,
    targetCharacteristics: [
      'warm',
      'intimate',
      'present',
      'polished',
      'natural-dynamics',
      'controlled-sibilance'
    ]
  }
};

/**
 * Drake Style - Hip-Hop/R&B Vocal Chain
 *
 * Characteristics:
 * - Dark, moody low-end
 * - Compressed but dynamic
 * - Prominent Auto-Tune (subtle or effect)
 * - Lush reverb and delays
 * - Modern, polished sound
 */
export const DRAKE_VOCAL: GenrePresetChain = {
  id: 'drake-vocal',
  name: 'Drake Style - Hip-Hop/R&B Vocal',
  genre: 'Hip-Hop/R&B',
  description: 'Dark, moody vocal with modern polish. Uses Auto-Tune, Nectar 4, FabFilter, UAD SSL, and lush reverb.',
  chain: [
    {
      pluginId: 'vst3-rx-11-breath-control',
      pluginName: 'RX 11 Breath Control',
      slot: 0,
      parameters: {
        sensitivity: 0.5,
        reduction: 0.6, // -8 dB
        target_threshold: 0.4
      }
    },
    {
      pluginId: 'vst3-auto-tune-pro',
      pluginName: 'Auto-Tune Pro',
      slot: 1,
      parameters: {
        retune_speed: 0.15, // Faster for modern sound (15ms)
        humanize: 0.4, // Less natural
        flex_tune: 0.75,
        throat_length: 0.48, // Slightly thinner
        formant: 0.45, // Lower formant
        vibrato: 0.15 // Slight vibrato
      }
    },
    {
      pluginId: 'au-uad-ssl-e-channel-strip',
      pluginName: 'UAD SSL E Channel Strip',
      slot: 2,
      parameters: {
        input_gain: 0.6,
        // EQ
        lf_freq: 0.3, // 200 Hz
        lf_gain: 0.55, // +2 dB
        lmf_freq: 0.25, // 500 Hz
        lmf_gain: 0.4, // -2 dB (reduce mud)
        hmf_freq: 0.55, // 5 kHz
        hmf_gain: 0.65, // +4 dB (presence)
        hf_gain: 0.45, // -1 dB (darker)
        // Dynamics
        comp_threshold: 0.38,
        comp_ratio: 0.45, // 4:1
        comp_attack: 0.3, // Fast
        comp_release: 0.4,
        gate_threshold: 0.3
      }
    },
    {
      pluginId: 'vst3-fabfilter-pro-q-4',
      pluginName: 'FabFilter Pro-Q 4',
      slot: 3,
      parameters: {
        // Low cut
        'band_1_freq': 0.18, // 100 Hz
        'band_1_type': 0.3, // High-pass
        'band_1_q': 0.6,
        // Low-mid body
        'band_2_freq': 0.22, // 150 Hz
        'band_2_gain': 0.6, // +2 dB
        'band_2_q': 0.5,
        // De-mud
        'band_3_freq': 0.35, // 600 Hz
        'band_3_gain': 0.35, // -3 dB
        'band_3_q': 0.6,
        // Presence
        'band_4_freq': 0.6, // 6 kHz
        'band_4_gain': 0.65, // +3 dB
        'band_4_q': 0.4,
        // De-harsh
        'band_5_freq': 0.72, // 8 kHz
        'band_5_gain': 0.4, // -2 dB
        'band_5_q': 0.5
      }
    },
    {
      pluginId: 'vst3-fabfilter-pro-c-2',
      pluginName: 'FabFilter Pro-C 2',
      slot: 4,
      parameters: {
        threshold: 0.38, // -14 dB
        ratio: 0.5, // 5:1
        attack: 0.15, // 5 ms
        release: 0.35, // 50 ms
        knee: 0.6, // Medium knee
        makeup_gain: 0.6,
        style: 0.15, // Vocal mode
        lookahead: 0.3
      }
    },
    {
      pluginId: 'vst3-nectar-4-de-esser',
      pluginName: 'Nectar 4 De-Esser',
      slot: 5,
      parameters: {
        frequency: 0.68,
        threshold: 0.5,
        range: 0.45,
        mode: 0.5 // Wideband
      }
    },
    {
      pluginId: 'vst3-slate-digital-virtual-tape-machines',
      pluginName: 'Slate Digital Virtual Tape Machines',
      slot: 6,
      parameters: {
        tape_type: 0.66, // NR-72 (darker)
        input: 0.45,
        output: 0.55,
        ips: 0.33, // 7.5 IPS (darker)
        emphasis: 0.4
      }
    },
    {
      pluginId: 'au-valhalla-room',
      pluginName: 'Valhalla Room',
      slot: 7,
      parameters: {
        decay: 0.55, // 2.5s
        pre_delay: 0.25, // 40ms
        size: 0.6,
        diffusion: 0.75,
        mod_rate: 0.3,
        mod_depth: 0.25,
        mix: 0.22, // 22% wet
        low_cut: 0.2, // 200 Hz
        high_cut: 0.7, // 8 kHz
        early_late_mix: 0.4
      }
    },
    {
      pluginId: 'vst3-fabfilter-timeless-3',
      pluginName: 'FabFilter Timeless 3',
      slot: 8,
      parameters: {
        delay_time_l: 0.25, // 1/8 note
        delay_time_r: 0.375, // 3/16 note
        feedback: 0.35,
        mix: 0.12, // 12% wet
        filter_freq: 0.6,
        modulation_rate: 0.2,
        modulation_depth: 0.15
      }
    },
    {
      pluginId: 'vst3-ozone-12-exciter',
      pluginName: 'Ozone 12 Exciter',
      slot: 9,
      parameters: {
        amount: 0.35,
        frequency: 0.55, // 3-5 kHz
        mix: 0.25,
        stereo_width: 0.6
      }
    },
    {
      pluginId: 'vst3-fabfilter-pro-l-2',
      pluginName: 'FabFilter Pro-L 2',
      slot: 10,
      parameters: {
        gain: 0.5, // +2 dB
        threshold: 0.65, // -6 dB
        attack: 0.2,
        release: 0.4,
        style: 0.4, // Modern
        lookahead: 0.5,
        oversampling: 0.75 // 4x
      }
    }
  ],
  aiSettings: {
    automationEnabled: true,
    dynamicAdjustment: true,
    targetCharacteristics: [
      'dark',
      'moody',
      'compressed',
      'modern',
      'lush',
      'polished',
      'spacious'
    ]
  }
};

/**
 * Master Bus Chain - Universal Mastering
 */
export const MASTER_BUS_CHAIN: GenrePresetChain = {
  id: 'ai-master-bus',
  name: 'AI Master Bus - Professional Mastering',
  genre: 'Universal',
  description: 'AI-controlled mastering chain using Ozone 12, FabFilter, and Slate Digital.',
  chain: [
    {
      pluginId: 'vst3-ozone-12-equalizer',
      pluginName: 'Ozone 12 Equalizer',
      slot: 0,
      parameters: {
        // AI will adjust dynamically
        band_1_freq: 0.15,
        band_1_gain: 0.5,
        band_2_freq: 0.4,
        band_2_gain: 0.5,
        band_3_freq: 0.7,
        band_3_gain: 0.5
      }
    },
    {
      pluginId: 'vst3-ozone-12-dynamic-eq',
      pluginName: 'Ozone 12 Dynamic EQ',
      slot: 1,
      parameters: {
        // Dynamic control
        sensitivity: 0.6,
        attack: 0.3,
        release: 0.5
      }
    },
    {
      pluginId: 'vst3-fabfilter-pro-c-2',
      pluginName: 'FabFilter Pro-C 2',
      slot: 2,
      parameters: {
        threshold: 0.5,
        ratio: 0.25, // 2:1
        attack: 0.4,
        release: 0.5,
        knee: 0.7,
        style: 0.5 // Mastering
      }
    },
    {
      pluginId: 'vst3-ozone-12-exciter',
      pluginName: 'Ozone 12 Exciter',
      slot: 3,
      parameters: {
        amount: 0.3,
        mix: 0.2
      }
    },
    {
      pluginId: 'vst3-slate-digital-virtual-tape-machines',
      pluginName: 'Slate Digital Virtual Tape Machines',
      slot: 4,
      parameters: {
        tape_type: 0.5,
        input: 0.4,
        output: 0.5,
        ips: 0.66 // 30 IPS
      }
    },
    {
      pluginId: 'vst3-ozone-12-vintage-limiter',
      pluginName: 'Ozone 12 Vintage Limiter',
      slot: 5,
      parameters: {
        threshold: 0.7,
        margin: 0.9, // -0.3 dB
        character: 0.5
      }
    },
    {
      pluginId: 'vst3-fabfilter-pro-l-2',
      pluginName: 'FabFilter Pro-L 2',
      slot: 6,
      parameters: {
        gain: 0.6,
        threshold: 0.8,
        attack: 0.3,
        release: 0.5,
        style: 0.6, // Transparent
        lookahead: 0.7,
        oversampling: 1.0, // 8x
        true_peak_limit: 0.95 // -0.1 dB
      }
    }
  ],
  aiSettings: {
    automationEnabled: true,
    dynamicAdjustment: true,
    targetCharacteristics: [
      'balanced',
      'loud',
      'transparent',
      'competitive',
      'streaming-ready'
    ]
  }
};

export const GENRE_PRESETS = {
  'morgan-wallen-vocal': MORGAN_WALLEN_VOCAL,
  'drake-vocal': DRAKE_VOCAL,
  'master-bus': MASTER_BUS_CHAIN
};
