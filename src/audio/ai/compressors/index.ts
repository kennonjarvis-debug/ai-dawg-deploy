/**
 * AI Compressor Plugins - DAWG AI
 *
 * Comprehensive suite of AI-powered compression plugins for the DAWG DAWG AI
 *
 * Plugins:
 * - AI Vintage Compressor: Classic analog-style compression with AI tube saturation
 * - AI Modern Compressor: Transparent digital compression with intelligent attack/release
 * - AI Multiband Compressor: Multi-band compression with AI-powered band splitting
 * - AI Vocal Compressor: Specialized vocal compression with AI presence enhancement
 */

// Export all compressor classes
export { AIVintageCompressor } from './AIVintageCompressor';
export type { VintageCompressorParameters } from './AIVintageCompressor';

export { AIModernCompressor } from './AIModernCompressor';
export type { ModernCompressorParameters } from './AIModernCompressor';

export { AIMultibandCompressor } from './AIMultibandCompressor';
export type { MultibandCompressorParameters, BandCompressorState } from './AIMultibandCompressor';

export { AIVocalCompressor } from './AIVocalCompressor';
export type { VocalCompressorParameters } from './AIVocalCompressor';

// Export shared types
export type {
  CompressorParameter,
  CompressorMetadata,
  CompressorState,
  CompressorAnalysis,
  AICompressorFeatures,
  AICompressorSettings,
  CompressorPreset,
  CompressorType,
} from './types';

export { COMMON_COMPRESSOR_PRESETS } from './types';

// Export utilities
export * from './utils';

/**
 * Factory function to create compressor instances
 */
export function createCompressor(
  type: 'vintage' | 'modern' | 'multiband' | 'vocal',
  sampleRate: number = 48000
) {
  switch (type) {
    case 'vintage':
      return new AIVintageCompressor(sampleRate);
    case 'modern':
      return new AIModernCompressor(sampleRate);
    case 'multiband':
      return new AIMultibandCompressor(sampleRate);
    case 'vocal':
      return new AIVocalCompressor(sampleRate);
    default:
      throw new Error(`Unknown compressor type: ${type}`);
  }
}

/**
 * Get all available compressor types
 */
export function getAvailableCompressors() {
  return [
    {
      id: 'dawg-ai-vintage-compressor',
      name: 'AI Vintage Compressor',
      type: 'vintage' as const,
      manufacturer: 'DAWG AI',
      category: 'AI Compressor',
      description: 'Classic analog-style compression with AI tube saturation',
      features: [
        'Analog-modeled compression',
        'AI tube saturation',
        'Vintage color controls',
        'Adaptive attack/release',
        'Auto makeup gain',
      ],
    },
    {
      id: 'dawg-ai-modern-compressor',
      name: 'AI Modern Compressor',
      type: 'modern' as const,
      manufacturer: 'DAWG AI',
      category: 'AI Compressor',
      description: 'Transparent digital compression with intelligent attack/release',
      features: [
        'Ultra-transparent compression',
        'AI adaptive timings',
        'Transient preservation',
        'Lookahead processing',
        'Spectral analysis',
      ],
    },
    {
      id: 'dawg-ai-multiband-compressor',
      name: 'AI Multiband Compressor',
      type: 'multiband' as const,
      manufacturer: 'DAWG AI',
      category: 'AI Compressor',
      description: 'Multi-band compression with AI-powered band splitting',
      features: [
        '4-band frequency splitting',
        'Independent band compression',
        'AI crossover optimization',
        'Smart band balancing',
        'Solo/mute per band',
      ],
    },
    {
      id: 'dawg-ai-vocal-compressor',
      name: 'AI Vocal Compressor',
      type: 'vocal' as const,
      manufacturer: 'DAWG AI',
      category: 'AI Compressor',
      description: 'Specialized vocal compression with AI presence enhancement',
      features: [
        'Vocal-optimized compression',
        'AI presence enhancement',
        'Automatic de-essing',
        'Breath control',
        'Auto vocal type detection',
      ],
    },
  ];
}

/**
 * Get compressor by ID
 */
export function getCompressorById(id: string) {
  const compressors = getAvailableCompressors();
  return compressors.find(c => c.id === id);
}

/**
 * Get all presets for a compressor type
 */
export function getPresetsForType(type: 'vintage' | 'modern' | 'multiband' | 'vocal', sampleRate: number = 48000) {
  const compressor = createCompressor(type, sampleRate);
  return compressor.getPresets();
}

// Re-export classes for convenience
import { AIVintageCompressor } from './AIVintageCompressor';
import { AIModernCompressor } from './AIModernCompressor';
import { AIMultibandCompressor } from './AIMultibandCompressor';
import { AIVocalCompressor } from './AIVocalCompressor';

/**
 * Default export: all compressor classes
 */
export default {
  AIVintageCompressor,
  AIModernCompressor,
  AIMultibandCompressor,
  AIVocalCompressor,
  createCompressor,
  getAvailableCompressors,
  getCompressorById,
  getPresetsForType,
};
