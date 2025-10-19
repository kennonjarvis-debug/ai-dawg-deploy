/**
 * Metadata Analysis Service
 *
 * Analyzes audio files to extract rich metadata for context-aware AI coaching
 * Uses VocalProcessor and BeatAnalyzer to understand the vibe of tracks
 */

import { VocalProcessor } from '../../audio/VocalProcessor';
import { BeatAnalyzer } from '../../audio/ai/BeatAnalyzer';
import type {
  TrackMetadata,
  VocalCharacteristics,
  RhythmCharacteristics,
  StyleMetadata
} from '../../api/types';

export class MetadataAnalyzer {
  private vocalProcessor: VocalProcessor;
  private beatAnalyzer: BeatAnalyzer;

  constructor() {
    this.vocalProcessor = new VocalProcessor();
    this.beatAnalyzer = new BeatAnalyzer();
  }

  /**
   * Analyze audio buffer and extract all metadata
   */
  async analyzeAudio(
    audioBuffer: AudioBuffer,
    options: {
      trackType?: 'vocal' | 'instrument' | 'unknown';
      suggestedGenre?: string;
      suggestedMood?: string;
    } = {}
  ): Promise<TrackMetadata> {
    console.log('[MetadataAnalyzer] Starting comprehensive analysis...');
    console.log('[MetadataAnalyzer] Track type:', options.trackType || 'auto-detect');

    const metadata: TrackMetadata = {
      analyzedAt: new Date().toISOString(),
    };

    // Always analyze rhythm characteristics (works for vocals and instruments)
    try {
      const beatAnalysis = await this.beatAnalyzer.analyzeBeat(audioBuffer);

      metadata.rhythmCharacteristics = {
        bpm: Math.round(beatAnalysis.bpm),
        confidence: beatAnalysis.confidence,
        timeSignature: {
          numerator: beatAnalysis.timeSignature.numerator,
          denominator: beatAnalysis.timeSignature.denominator,
        },
        key: 'C', // Placeholder - would use key detection
        scale: 'major', // Placeholder
        tempoStability: beatAnalysis.tempoStability,
      };

      console.log('[MetadataAnalyzer] Rhythm analysis complete:', {
        bpm: metadata.rhythmCharacteristics.bpm,
        timeSignature: `${beatAnalysis.timeSignature.numerator}/${beatAnalysis.timeSignature.denominator}`,
      });
    } catch (err) {
      console.error('[MetadataAnalyzer] Rhythm analysis failed:', err);
    }

    // Analyze vocal characteristics if vocal track
    if (options.trackType === 'vocal' || options.trackType === 'unknown') {
      try {
        const vocalAnalysis = this.vocalProcessor.analyzeVocal(audioBuffer);

        metadata.vocalCharacteristics = {
          timbre: vocalAnalysis.timbre,
          dynamicRange: vocalAnalysis.dynamicRange,
          peakLevel: vocalAnalysis.peakLevel,
          spectralBalance: vocalAnalysis.spectralBalance,
          hasClipping: vocalAnalysis.hasClipping,
          noiseFloor: vocalAnalysis.noiseFloor,
          hasSibilance: vocalAnalysis.hasSibilance,
          hasRoomTone: vocalAnalysis.hasRoomTone,
          breathNoise: vocalAnalysis.breathNoise,
        };

        console.log('[MetadataAnalyzer] Vocal analysis complete:', {
          spectralBalance: metadata.vocalCharacteristics.spectralBalance,
          dynamicRange: `${vocalAnalysis.dynamicRange.toFixed(1)} dB`,
        });
      } catch (err) {
        console.error('[MetadataAnalyzer] Vocal analysis failed:', err);
      }
    }

    // Infer style metadata
    metadata.style = this.inferStyleMetadata(
      metadata,
      options.suggestedGenre,
      options.suggestedMood
    );

    console.log('[MetadataAnalyzer] Analysis complete!', {
      genre: metadata.style.genre,
      mood: metadata.style.mood,
      energy: metadata.style.energy.toFixed(2),
    });

    return metadata;
  }

  /**
   * Infer style/genre from analysis results
   */
  private inferStyleMetadata(
    metadata: TrackMetadata,
    suggestedGenre?: string,
    suggestedMood?: string
  ): StyleMetadata {
    const style: StyleMetadata = {
      genre: 'other',
      mood: suggestedMood || 'neutral',
      energy: 0.5,
    };

    // Use suggested genre if provided
    if (suggestedGenre) {
      const validGenres = ['country', 'pop', 'rock', 'rnb', 'hip-hop', 'indie', 'folk', 'jazz'];
      if (validGenres.includes(suggestedGenre.toLowerCase())) {
        style.genre = suggestedGenre.toLowerCase() as any;
      }
    }

    // Infer energy from rhythm characteristics
    if (metadata.rhythmCharacteristics) {
      const bpm = metadata.rhythmCharacteristics.bpm;

      // Energy based on tempo
      if (bpm < 80) style.energy = 0.3;
      else if (bpm < 100) style.energy = 0.5;
      else if (bpm < 130) style.energy = 0.7;
      else style.energy = 0.9;

      // Mood inference from tempo
      if (!suggestedMood) {
        if (bpm < 90) style.mood = 'sad';
        else if (bpm < 110) style.mood = 'calm';
        else if (bpm < 140) style.mood = 'happy';
        else style.mood = 'energetic';
      }
    }

    // Infer genre from vocal characteristics
    if (metadata.vocalCharacteristics && !suggestedGenre) {
      const { spectralBalance, timbre } = metadata.vocalCharacteristics;

      // Country tends to have bright vocals with warmth
      if (spectralBalance === 'bright' && timbre.warmth > 0.6) {
        style.genre = 'country';
        style.subgenre = 'modern-country';
      }
      // R&B tends to have smooth, warm vocals
      else if (timbre.warmth > 0.7 && timbre.brightness < 0.5) {
        style.genre = 'rnb';
      }
      // Rock tends to have rough, bright vocals
      else if (timbre.roughness > 0.5 && spectralBalance === 'bright') {
        style.genre = 'rock';
      }
      // Pop tends to be balanced
      else if (spectralBalance === 'balanced') {
        style.genre = 'pop';
      }
    }

    return style;
  }

  /**
   * Detect if audio is likely a vocal track
   */
  detectIsVocal(audioBuffer: AudioBuffer): boolean {
    // Simple heuristic: check for human voice frequency range and characteristics
    // This is a placeholder - would use more sophisticated detection
    const analysis = this.vocalProcessor.analyzeVocal(audioBuffer);

    // Human voice typically has:
    // - Spectral centroid in 300-3000 Hz range
    // - Moderate dynamic range
    // - Presence of formants
    const hasVocalCharacteristics =
      analysis.timbre.spectralCentroid > 300 &&
      analysis.timbre.spectralCentroid < 3000 &&
      analysis.dynamicRange > 10 &&
      analysis.dynamicRange < 40;

    return hasVocalCharacteristics;
  }

  /**
   * Detect specific artist style (e.g., "morgan-wallen")
   */
  detectArtistStyle(
    metadata: TrackMetadata,
    artistReference?: string
  ): string | undefined {
    if (!metadata.style || !artistReference) return undefined;

    const style = metadata.style;

    // Morgan Wallen style detection
    if (
      artistReference.toLowerCase().includes('morgan') ||
      artistReference.toLowerCase().includes('wallen')
    ) {
      if (
        style.genre === 'country' &&
        metadata.rhythmCharacteristics?.bpm &&
        metadata.rhythmCharacteristics.bpm >= 80 &&
        metadata.rhythmCharacteristics.bpm <= 130 &&
        metadata.vocalCharacteristics?.timbre.warmth &&
        metadata.vocalCharacteristics.timbre.warmth > 0.6
      ) {
        return 'morgan-wallen';
      }
    }

    return undefined;
  }
}

/**
 * Singleton instance
 */
export const metadataAnalyzer = new MetadataAnalyzer();
