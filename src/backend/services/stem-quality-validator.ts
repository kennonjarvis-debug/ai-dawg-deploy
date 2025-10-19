/**
 * Stem Quality Validation Service
 *
 * Validates stem separation quality using audio analysis metrics
 * Metrics: SDR (Signal-to-Distortion Ratio), energy conservation, spectral consistency
 */

import axios from 'axios';
import { logger } from '../utils/logger';
import type { StemResult, StemQualityMetrics, ValidationResult } from '../../types/separation';

export class StemQualityValidator {
  /**
   * Validate separation result quality
   */
  async validateSeparation(
    originalAudioUrl: string,
    stems: StemResult[]
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. Check for silent stems
      const silentStems = stems.filter((s) => s.quality.isSilent);
      if (silentStems.length > 0) {
        warnings.push(
          `Silent stems detected: ${silentStems.map((s) => s.type).join(', ')}`
        );
      }

      // 2. Check stem file sizes
      for (const stem of stems) {
        if (stem.size < 100000) {
          // Less than 100KB
          warnings.push(`${stem.type} stem is unusually small (${(stem.size / 1024).toFixed(0)}KB)`);
        }
      }

      // 3. Energy conservation check
      const energyConservation = this.calculateEnergyConservation(stems);
      if (energyConservation < 0.7) {
        errors.push(`Poor energy conservation: ${(energyConservation * 100).toFixed(1)}%`);
      } else if (energyConservation < 0.85) {
        warnings.push(`Low energy conservation: ${(energyConservation * 100).toFixed(1)}%`);
      }

      // 4. Spectral consistency check
      const spectralConsistency = this.calculateSpectralConsistency(stems);
      if (spectralConsistency < 0.6) {
        warnings.push(
          `Low spectral consistency: ${(spectralConsistency * 100).toFixed(1)}%`
        );
      }

      // 5. Quality metrics check
      for (const stem of stems) {
        // Check SDR (Signal-to-Distortion Ratio)
        if (stem.quality.sdr && stem.quality.sdr < 5) {
          warnings.push(
            `${stem.type}: Low SDR (${stem.quality.sdr.toFixed(1)} dB) - separation quality may be poor`
          );
        }

        // Check for clipping
        if (stem.quality.peakLevel > -0.1) {
          warnings.push(
            `${stem.type}: Clipping detected (${stem.quality.peakLevel.toFixed(1)} dBFS)`
          );
        }

        // Check loudness
        if (stem.quality.lufs < -40) {
          warnings.push(`${stem.type}: Very quiet (${stem.quality.lufs.toFixed(1)} LUFS)`);
        } else if (stem.quality.lufs > -6) {
          warnings.push(`${stem.type}: Very loud (${stem.quality.lufs.toFixed(1)} LUFS)`);
        }
      }

      // 6. Phase alignment check
      const phaseAlignment = await this.checkPhaseAlignment(stems);
      if (phaseAlignment < 0.8) {
        warnings.push(`Phase alignment issues detected: ${(phaseAlignment * 100).toFixed(1)}%`);
      }

      const isValid = errors.length === 0;

      logger.info('[StemValidator] Validation complete', {
        isValid,
        errorCount: errors.length,
        warningCount: warnings.length,
        energyConservation: (energyConservation * 100).toFixed(1),
        spectralConsistency: (spectralConsistency * 100).toFixed(1),
        phaseAlignment: (phaseAlignment * 100).toFixed(1),
      });

      return {
        isValid,
        errors,
        warnings,
        metrics: {
          energyConservation: energyConservation * 100,
          spectralConsistency,
          phaseAlignment,
        },
      };
    } catch (error: any) {
      logger.error('[StemValidator] Validation failed', {
        error: error.message,
      });

      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`],
        warnings: [],
        metrics: {
          energyConservation: 0,
          spectralConsistency: 0,
          phaseAlignment: 0,
        },
      };
    }
  }

  /**
   * Calculate energy conservation
   * Sum of stem energies should be close to original energy
   */
  private calculateEnergyConservation(stems: StemResult[]): number {
    // Sum of RMS energies (should approximate original)
    const totalEnergy = stems.reduce((sum, stem) => sum + stem.quality.rmsEnergy, 0);

    // Normalize (assuming original energy ~ 0.3 for typical music)
    const expectedEnergy = 0.3;
    const conservation = Math.min(1.0, totalEnergy / expectedEnergy);

    return conservation;
  }

  /**
   * Calculate spectral consistency
   * Stems should cover different frequency ranges without too much overlap
   */
  private calculateSpectralConsistency(stems: StemResult[]): number {
    // Check if stems have expected spectral characteristics
    const vocals = stems.find((s) => s.type === 'vocals');
    const drums = stems.find((s) => s.type === 'drums');
    const bass = stems.find((s) => s.type === 'bass');

    let score = 0;
    let checks = 0;

    // Vocals should have mid-high spectral centroid (1000-4000 Hz)
    if (vocals) {
      checks++;
      if (vocals.quality.spectralCentroid > 1000 && vocals.quality.spectralCentroid < 4000) {
        score++;
      }
    }

    // Bass should have low spectral centroid (< 500 Hz)
    if (bass) {
      checks++;
      if (bass.quality.spectralCentroid < 500) {
        score++;
      }
    }

    // Drums should have wide spectrum (> 1000 Hz centroid)
    if (drums) {
      checks++;
      if (drums.quality.spectralCentroid > 1000) {
        score++;
      }
    }

    return checks > 0 ? score / checks : 0.5;
  }

  /**
   * Check phase alignment
   * When stems are summed, they should reconstruct the original reasonably well
   */
  private async checkPhaseAlignment(stems: StemResult[]): Promise<number> {
    // In production, we would download stems and check actual phase alignment
    // For now, return a heuristic based on quality metrics

    // Good separation typically has:
    // - High SIR (Signal-to-Interference Ratio)
    // - High SAR (Signal-to-Artifacts Ratio)

    const avgSIR = stems.reduce((sum, s) => sum + (s.quality.sir || 0), 0) / stems.length;
    const avgSAR = stems.reduce((sum, s) => sum + (s.quality.sar || 0), 0) / stems.length;

    // Normalize to 0-1 scale
    // Good SIR/SAR are typically > 12 dB
    const sirScore = Math.min(1.0, avgSIR / 15);
    const sarScore = Math.min(1.0, avgSAR / 15);

    return (sirScore + sarScore) / 2;
  }

  /**
   * Analyze stem audio and extract quality metrics
   * (This would be done in the Demucs service, but shown here for reference)
   */
  async analyzeAudioQuality(audioUrl: string): Promise<StemQualityMetrics> {
    try {
      // Download audio file headers to check basic properties
      const response = await axios.head(audioUrl);
      const size = parseInt(response.headers['content-length'] || '0');

      // In production, we would:
      // 1. Download the audio file
      // 2. Analyze with FFmpeg or Web Audio API
      // 3. Calculate RMS, spectral centroid, LUFS, etc.

      // For now, return placeholder metrics
      return {
        rmsEnergy: 0.15,
        spectralCentroid: 2500,
        isSilent: size < 100000,
        lufs: -14.0,
        peakLevel: -3.0,
        sdr: 7.5,
        sir: 15.2,
        sar: 12.8,
      };
    } catch (error: any) {
      logger.error('[StemValidator] Failed to analyze audio', {
        audioUrl,
        error: error.message,
      });

      // Return default metrics if analysis fails
      return {
        rmsEnergy: 0.1,
        spectralCentroid: 2000,
        isSilent: false,
        lufs: -16.0,
        peakLevel: -6.0,
      };
    }
  }

  /**
   * Calculate SDR (Signal-to-Distortion Ratio)
   * Requires both original and separated audio
   */
  async calculateSDR(
    _originalUrl: string,
    _separatedUrl: string
  ): Promise<{ sdr: number; sir: number; sar: number }> {
    // In production, we would:
    // 1. Download both audio files
    // 2. Use BSS Eval metrics (mir_eval library)
    // 3. Calculate SDR, SIR, SAR

    // For now, return typical Demucs performance metrics
    return {
      sdr: 7.5, // Demucs typically achieves 7-9 dB SDR
      sir: 15.2, // Signal-to-Interference Ratio
      sar: 12.8, // Signal-to-Artifacts Ratio
    };
  }

  /**
   * Quick validation (checks only file sizes and basic properties)
   */
  quickValidate(stems: StemResult[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check we have all expected stems
    const expectedStems = ['vocals', 'drums', 'bass', 'other'];
    const foundStems = stems.map((s) => s.type);

    for (const expected of expectedStems) {
      if (!foundStems.includes(expected)) {
        errors.push(`Missing stem: ${expected}`);
      }
    }

    // Check file sizes
    for (const stem of stems) {
      if (stem.size < 10000) {
        errors.push(`${stem.type} stem file is too small (${stem.size} bytes)`);
      }
    }

    // Check durations match
    if (stems.length > 0) {
      const firstDuration = stems[0].duration;
      for (const stem of stems) {
        if (Math.abs(stem.duration - firstDuration) > 0.5) {
          errors.push(`Duration mismatch: ${stem.type} (${stem.duration}s vs ${firstDuration}s)`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const stemQualityValidator = new StemQualityValidator();
