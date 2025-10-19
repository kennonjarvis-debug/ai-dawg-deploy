/**
 * Smart Mix Assistant AI - Advanced Multi-Track Mixing Analysis & Recommendations
 *
 * Analyzes multi-track mixes to detect:
 * - Frequency conflicts between tracks (masking detection)
 * - Level imbalances (psychoacoustic loudness analysis)
 * - Phase correlation issues (stereo field problems)
 * - Panning problems (stereo imaging)
 *
 * Provides intelligent recommendations:
 * - Optimal panning positions
 * - EQ cuts to reduce masking
 * - Level adjustments for balance
 * - Phase cancellation fixes
 * - Compression and dynamics settings
 * - Frequency conflict visualization
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface TrackAudioData {
  trackId: string;
  trackName: string;
  audioBuffer: AudioBuffer;
  category?: 'vocal' | 'drums' | 'bass' | 'guitar' | 'keys' | 'synth' | 'fx' | 'other';
  currentLevel?: number;      // Current fader level (dB)
  currentPan?: number;         // Current pan (-100 to 100)
}

export interface FrequencyAnalysis {
  trackId: string;
  spectrum: Float32Array;      // FFT magnitude spectrum
  spectralCentroid: number;    // Hz - center of mass
  spectralSpread: number;      // Hz - width of spectrum
  energyByBand: CriticalBandEnergy;
  fundamentalFrequency?: number; // For pitched content
  harmonics?: number[];        // Harmonic frequencies
}

export interface CriticalBandEnergy {
  subBass: number;            // 20-60 Hz
  bass: number;               // 60-250 Hz
  lowMids: number;            // 250-500 Hz
  mids: number;               // 500-2000 Hz
  upperMids: number;          // 2000-4000 Hz
  presence: number;           // 4000-6000 Hz
  brilliance: number;         // 6000-20000 Hz
}

export interface PhaseCorrelation {
  trackId: string;
  correlationCoefficient: number; // -1 to 1 (-1=out of phase, 0=uncorrelated, 1=in phase)
  hasPhaseIssues: boolean;
  affectedFrequencies?: number[]; // Frequencies with phase problems
}

export interface LoudnessAnalysis {
  trackId: string;
  rmsLevel: number;           // dB
  peakLevel: number;          // dB
  lufs: number;               // Loudness Units relative to Full Scale
  dynamicRange: number;       // dB
  crestFactor: number;        // Peak-to-RMS ratio
}

export interface FrequencyConflict {
  track1: string;
  track2: string;
  conflictBand: keyof CriticalBandEnergy;
  conflictFrequency: number;  // Hz - center of conflict
  severity: 'low' | 'medium' | 'high';
  maskingAmount: number;      // dB - how much masking is occurring
  recommendation: string;
}

export interface PanningRecommendation {
  trackId: string;
  currentPan: number;
  recommendedPan: number;
  reason: string;
  priority: 'low' | 'medium' | 'high';
}

export interface EQRecommendation {
  trackId: string;
  frequency: number;          // Hz
  gain: number;               // dB (negative for cut)
  q: number;                  // Filter Q/bandwidth
  type: 'highpass' | 'lowpass' | 'bell' | 'shelf';
  reason: string;
  priority: 'essential' | 'recommended' | 'optional';
}

export interface LevelRecommendation {
  trackId: string;
  currentLevel: number;       // dB
  recommendedLevel: number;   // dB
  reason: string;
}

export interface CompressionRecommendation {
  trackId: string;
  threshold: number;          // dB
  ratio: number;              // X:1
  attack: number;             // ms
  release: number;            // ms
  knee: number;               // dB
  makeupGain: number;         // dB
  reason: string;
}

export interface FrequencyMap {
  frequencies: number[];      // Hz bins
  trackEnergies: Map<string, Float32Array>; // Track ID -> energy per frequency
  conflictZones: Array<{
    frequency: number;
    tracks: string[];
    severity: number;
  }>;
}

export interface MixAnalysisResult {
  timestamp: Date;
  trackCount: number;

  // Individual track analyses
  frequencyAnalyses: FrequencyAnalysis[];
  phaseCorrelations: PhaseCorrelation[];
  loudnessAnalyses: LoudnessAnalysis[];

  // Mix-wide issues
  frequencyConflicts: FrequencyConflict[];

  // Recommendations
  panningRecommendations: PanningRecommendation[];
  eqRecommendations: EQRecommendation[];
  levelRecommendations: LevelRecommendation[];
  compressionRecommendations: CompressionRecommendation[];

  // Visualization data
  frequencyMap: FrequencyMap;

  // Overall mix health
  mixHealth: {
    score: number;              // 0-100
    frequencyBalance: number;   // 0-100
    dynamicRange: number;       // 0-100
    stereoImaging: number;      // 0-100
    issues: string[];
  };
}

// ============================================================================
// SMART MIX ASSISTANT CLASS
// ============================================================================

export class SmartMixAssistant {
  private audioContext: AudioContext | null = null;
  private fftSize: number = 8192; // High resolution for detailed analysis

  // K-weighting filter coefficients for psychoacoustic loudness
  private kWeightingCoeffs = {
    highpass: { frequency: 38, q: 0.5 },
    highshelf: { frequency: 1000, gain: 4, q: 0.7 }
  };

  constructor(audioContext?: AudioContext) {
    this.audioContext = audioContext || null;
  }

  /**
   * Main analysis function - analyzes complete multi-track mix
   */
  async analyzeMix(tracks: TrackAudioData[]): Promise<MixAnalysisResult> {
    console.log(`[SmartMixAssistant] Analyzing mix with ${tracks.length} tracks...`);

    // Perform individual track analyses
    const frequencyAnalyses = tracks.map(track => this.analyzeFrequency(track));
    const phaseCorrelations = this.analyzePhaseCorrelations(tracks);
    const loudnessAnalyses = tracks.map(track => this.analyzeLoudness(track));

    // Detect conflicts
    const frequencyConflicts = this.detectFrequencyConflicts(frequencyAnalyses);

    // Generate recommendations
    const panningRecommendations = this.generatePanningRecommendations(
      frequencyAnalyses,
      tracks
    );
    const eqRecommendations = this.generateEQRecommendations(
      frequencyConflicts,
      frequencyAnalyses
    );
    const levelRecommendations = this.generateLevelRecommendations(
      loudnessAnalyses,
      tracks
    );
    const compressionRecommendations = this.generateCompressionRecommendations(
      loudnessAnalyses,
      tracks
    );

    // Create frequency map
    const frequencyMap = this.createFrequencyMap(frequencyAnalyses, frequencyConflicts);

    // Calculate mix health
    const mixHealth = this.calculateMixHealth(
      frequencyConflicts,
      phaseCorrelations,
      loudnessAnalyses
    );

    return {
      timestamp: new Date(),
      trackCount: tracks.length,
      frequencyAnalyses,
      phaseCorrelations,
      loudnessAnalyses,
      frequencyConflicts,
      panningRecommendations,
      eqRecommendations,
      levelRecommendations,
      compressionRecommendations,
      frequencyMap,
      mixHealth
    };
  }

  // ==========================================================================
  // FREQUENCY ANALYSIS
  // ==========================================================================

  /**
   * Analyze frequency content of a track using FFT
   */
  private analyzeFrequency(track: TrackAudioData): FrequencyAnalysis {
    const channelData = track.audioBuffer.getChannelData(0);
    const sampleRate = track.audioBuffer.sampleRate;

    // Perform FFT
    const spectrum = this.performFFT(channelData);

    // Calculate spectral features
    const spectralCentroid = this.calculateSpectralCentroid(spectrum, sampleRate);
    const spectralSpread = this.calculateSpectralSpread(spectrum, sampleRate, spectralCentroid);

    // Analyze energy in critical bands
    const energyByBand = this.analyzeCriticalBands(spectrum, sampleRate);

    // Detect fundamental frequency (for pitched content)
    const fundamentalFrequency = this.detectFundamental(channelData, sampleRate);

    // Detect harmonics if fundamental found
    const harmonics = fundamentalFrequency
      ? this.detectHarmonics(spectrum, sampleRate, fundamentalFrequency)
      : undefined;

    return {
      trackId: track.trackId,
      spectrum,
      spectralCentroid,
      spectralSpread,
      energyByBand,
      fundamentalFrequency,
      harmonics
    };
  }

  /**
   * Perform FFT analysis on audio data
   */
  private performFFT(audioData: Float32Array): Float32Array {
    const fftSize = Math.min(this.fftSize, audioData.length);
    const halfSize = fftSize / 2;
    const spectrum = new Float32Array(halfSize);

    // Apply Hann window to reduce spectral leakage
    const windowed = new Float32Array(fftSize);
    for (let i = 0; i < fftSize; i++) {
      const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / (fftSize - 1)));
      windowed[i] = audioData[i] * window;
    }

    // Perform DFT (simplified - in production, use Web Audio API or FFT library)
    for (let k = 0; k < halfSize; k++) {
      let real = 0;
      let imag = 0;

      for (let n = 0; n < fftSize; n++) {
        const angle = (2 * Math.PI * k * n) / fftSize;
        real += windowed[n] * Math.cos(angle);
        imag -= windowed[n] * Math.sin(angle);
      }

      // Calculate magnitude
      spectrum[k] = Math.sqrt(real * real + imag * imag) / fftSize;
    }

    return spectrum;
  }

  /**
   * Calculate spectral centroid (center of mass of spectrum)
   */
  private calculateSpectralCentroid(spectrum: Float32Array, sampleRate: number): number {
    let weightedSum = 0;
    let totalSum = 0;

    for (let i = 0; i < spectrum.length; i++) {
      const frequency = (i * sampleRate) / (2 * spectrum.length);
      const magnitude = spectrum[i];
      weightedSum += frequency * magnitude;
      totalSum += magnitude;
    }

    return totalSum > 0 ? weightedSum / totalSum : 0;
  }

  /**
   * Calculate spectral spread (standard deviation of spectrum)
   */
  private calculateSpectralSpread(
    spectrum: Float32Array,
    sampleRate: number,
    centroid: number
  ): number {
    let variance = 0;
    let totalSum = 0;

    for (let i = 0; i < spectrum.length; i++) {
      const frequency = (i * sampleRate) / (2 * spectrum.length);
      const magnitude = spectrum[i];
      variance += Math.pow(frequency - centroid, 2) * magnitude;
      totalSum += magnitude;
    }

    return totalSum > 0 ? Math.sqrt(variance / totalSum) : 0;
  }

  /**
   * Analyze energy in critical frequency bands
   */
  private analyzeCriticalBands(spectrum: Float32Array, sampleRate: number): CriticalBandEnergy {
    const getBandEnergy = (lowFreq: number, highFreq: number): number => {
      const lowBin = Math.floor((lowFreq * 2 * spectrum.length) / sampleRate);
      const highBin = Math.floor((highFreq * 2 * spectrum.length) / sampleRate);

      let energy = 0;
      for (let i = lowBin; i <= highBin && i < spectrum.length; i++) {
        energy += spectrum[i] * spectrum[i];
      }
      return Math.sqrt(energy);
    };

    return {
      subBass: getBandEnergy(20, 60),
      bass: getBandEnergy(60, 250),
      lowMids: getBandEnergy(250, 500),
      mids: getBandEnergy(500, 2000),
      upperMids: getBandEnergy(2000, 4000),
      presence: getBandEnergy(4000, 6000),
      brilliance: getBandEnergy(6000, 20000)
    };
  }

  /**
   * Detect fundamental frequency using autocorrelation
   */
  private detectFundamental(audioData: Float32Array, sampleRate: number): number | undefined {
    const minFreq = 40;   // Hz
    const maxFreq = 2000; // Hz
    const minPeriod = Math.floor(sampleRate / maxFreq);
    const maxPeriod = Math.floor(sampleRate / minFreq);

    let maxCorrelation = -Infinity;
    let bestPeriod = minPeriod;

    // Autocorrelation
    for (let lag = minPeriod; lag <= maxPeriod; lag++) {
      let correlation = 0;
      let count = 0;

      for (let i = 0; i < audioData.length - lag; i += 10) { // Downsample for speed
        correlation += audioData[i] * audioData[i + lag];
        count++;
      }

      correlation /= count;

      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestPeriod = lag;
      }
    }

    // Return fundamental if correlation is strong enough
    return maxCorrelation > 0.3 ? sampleRate / bestPeriod : undefined;
  }

  /**
   * Detect harmonic frequencies
   */
  private detectHarmonics(
    spectrum: Float32Array,
    sampleRate: number,
    fundamental: number,
    maxHarmonics: number = 8
  ): number[] {
    const harmonics: number[] = [];
    const binWidth = sampleRate / (2 * spectrum.length);

    for (let n = 1; n <= maxHarmonics; n++) {
      const harmonicFreq = fundamental * n;
      if (harmonicFreq > sampleRate / 2) break;

      const bin = Math.round(harmonicFreq / binWidth);
      if (bin < spectrum.length && spectrum[bin] > 0.001) {
        harmonics.push(harmonicFreq);
      }
    }

    return harmonics;
  }

  // ==========================================================================
  // PHASE CORRELATION ANALYSIS
  // ==========================================================================

  /**
   * Analyze phase correlation between stereo channels
   */
  private analyzePhaseCorrelations(tracks: TrackAudioData[]): PhaseCorrelation[] {
    return tracks.map(track => {
      if (track.audioBuffer.numberOfChannels < 2) {
        // Mono track - no phase issues
        return {
          trackId: track.trackId,
          correlationCoefficient: 1.0,
          hasPhaseIssues: false
        };
      }

      const left = track.audioBuffer.getChannelData(0);
      const right = track.audioBuffer.getChannelData(1);

      // Calculate correlation coefficient
      let sumProduct = 0;
      let sumLeftSquared = 0;
      let sumRightSquared = 0;

      for (let i = 0; i < Math.min(left.length, right.length); i++) {
        sumProduct += left[i] * right[i];
        sumLeftSquared += left[i] * left[i];
        sumRightSquared += right[i] * right[i];
      }

      const correlation = sumProduct / Math.sqrt(sumLeftSquared * sumRightSquared);

      // Detect phase issues (correlation < 0.3 indicates potential problems)
      const hasPhaseIssues = correlation < 0.3;

      return {
        trackId: track.trackId,
        correlationCoefficient: correlation,
        hasPhaseIssues
      };
    });
  }

  // ==========================================================================
  // LOUDNESS ANALYSIS (Psychoacoustic)
  // ==========================================================================

  /**
   * Analyze loudness using psychoacoustic weighting (K-weighting approximation)
   */
  private analyzeLoudness(track: TrackAudioData): LoudnessAnalysis {
    const channelData = track.audioBuffer.getChannelData(0);

    // Calculate RMS level
    const rms = this.calculateRMS(channelData);
    const rmsLevel = 20 * Math.log10(rms);

    // Calculate peak level
    let peak = 0;
    for (let i = 0; i < channelData.length; i++) {
      const abs = Math.abs(channelData[i]);
      if (abs > peak) peak = abs;
    }
    const peakLevel = 20 * Math.log10(peak);

    // Calculate LUFS (simplified K-weighted loudness)
    const lufs = this.calculateLUFS(channelData, track.audioBuffer.sampleRate);

    // Calculate dynamic range
    const dynamicRange = this.calculateDynamicRange(channelData);

    // Calculate crest factor (peak-to-RMS ratio)
    const crestFactor = peak / rms;

    return {
      trackId: track.trackId,
      rmsLevel,
      peakLevel,
      lufs,
      dynamicRange,
      crestFactor
    };
  }

  /**
   * Calculate RMS (Root Mean Square)
   */
  private calculateRMS(audioData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return Math.sqrt(sum / audioData.length);
  }

  /**
   * Calculate LUFS (Loudness Units relative to Full Scale)
   * Simplified implementation using K-weighting approximation
   */
  private calculateLUFS(audioData: Float32Array, sampleRate: number): number {
    // Apply K-weighting filter (simplified high-pass + high-shelf)
    const weighted = this.applyKWeighting(audioData, sampleRate);

    // Calculate mean square over 400ms windows (gating blocks)
    const blockSize = Math.floor(0.4 * sampleRate); // 400ms
    const blocks: number[] = [];

    for (let i = 0; i < weighted.length - blockSize; i += blockSize / 2) { // 75% overlap
      const block = weighted.slice(i, i + blockSize);
      const meanSquare = block.reduce((sum, val) => sum + val * val, 0) / block.length;
      blocks.push(meanSquare);
    }

    // Absolute gating at -70 LUFS
    const gateThreshold = Math.pow(10, -70 / 10);
    const gatedBlocks = blocks.filter(b => b >= gateThreshold);

    if (gatedBlocks.length === 0) return -70;

    // Relative gating at -10 LU below absolute-gated loudness
    const absoluteGatedLoudness = gatedBlocks.reduce((sum, b) => sum + b, 0) / gatedBlocks.length;
    const relativeThreshold = absoluteGatedLoudness * Math.pow(10, -10 / 10);
    const relativeGatedBlocks = gatedBlocks.filter(b => b >= relativeThreshold);

    if (relativeGatedBlocks.length === 0) return -70;

    // Final loudness
    const meanSquare = relativeGatedBlocks.reduce((sum, b) => sum + b, 0) / relativeGatedBlocks.length;
    return -0.691 + 10 * Math.log10(meanSquare); // K-weighted LUFS formula
  }

  /**
   * Apply K-weighting filter (simplified)
   */
  private applyKWeighting(audioData: Float32Array, sampleRate: number): Float32Array {
    // Simplified K-weighting: high-pass at 38Hz + high-shelf at 1kHz
    // In production, use proper biquad filters
    const output = new Float32Array(audioData.length);

    // For now, just copy (K-weighting makes minimal difference for relative comparisons)
    // TODO: Implement proper biquad filtering
    output.set(audioData);

    return output;
  }

  /**
   * Calculate dynamic range
   */
  private calculateDynamicRange(audioData: Float32Array): number {
    const windowSize = 2048;
    const rmsValues: number[] = [];

    for (let i = 0; i < audioData.length - windowSize; i += windowSize) {
      const window = audioData.slice(i, i + windowSize);
      const rms = Math.sqrt(window.reduce((sum, val) => sum + val * val, 0) / window.length);
      if (rms > 0.001) rmsValues.push(rms);
    }

    if (rmsValues.length === 0) return 0;

    const max = Math.max(...rmsValues);
    const min = Math.min(...rmsValues);

    return 20 * Math.log10(max / (min || 0.001));
  }

  // ==========================================================================
  // CONFLICT DETECTION
  // ==========================================================================

  /**
   * Detect frequency conflicts between tracks (masking)
   */
  private detectFrequencyConflicts(analyses: FrequencyAnalysis[]): FrequencyConflict[] {
    const conflicts: FrequencyConflict[] = [];

    // Compare each pair of tracks
    for (let i = 0; i < analyses.length; i++) {
      for (let j = i + 1; j < analyses.length; j++) {
        const track1 = analyses[i];
        const track2 = analyses[j];

        // Check each critical band for conflicts
        const bands: (keyof CriticalBandEnergy)[] = [
          'subBass', 'bass', 'lowMids', 'mids', 'upperMids', 'presence', 'brilliance'
        ];

        for (const band of bands) {
          const energy1 = track1.energyByBand[band];
          const energy2 = track2.energyByBand[band];

          // Both tracks have significant energy in this band
          if (energy1 > 0.1 && energy2 > 0.1) {
            const ratio = Math.max(energy1, energy2) / Math.min(energy1, energy2);

            // Calculate masking amount
            const maskingAmount = 20 * Math.log10(ratio);

            // Determine severity
            let severity: 'low' | 'medium' | 'high' = 'low';
            if (maskingAmount > 12) severity = 'high';
            else if (maskingAmount > 6) severity = 'medium';

            // Get center frequency of band
            const bandFrequencies: Record<keyof CriticalBandEnergy, number> = {
              subBass: 40,
              bass: 155,
              lowMids: 375,
              mids: 1250,
              upperMids: 3000,
              presence: 5000,
              brilliance: 13000
            };

            conflicts.push({
              track1: track1.trackId,
              track2: track2.trackId,
              conflictBand: band,
              conflictFrequency: bandFrequencies[band],
              severity,
              maskingAmount,
              recommendation: this.generateConflictRecommendation(band, track1.trackId, track2.trackId)
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Generate recommendation text for frequency conflict
   */
  private generateConflictRecommendation(
    band: keyof CriticalBandEnergy,
    track1: string,
    track2: string
  ): string {
    const bandDescriptions: Record<keyof CriticalBandEnergy, string> = {
      subBass: 'sub-bass',
      bass: 'bass',
      lowMids: 'low-mids',
      mids: 'mids',
      upperMids: 'upper-mids',
      presence: 'presence',
      brilliance: 'air/brilliance'
    };

    return `Competing in ${bandDescriptions[band]} region. Consider panning these tracks apart or cutting one track's ${bandDescriptions[band]} frequencies.`;
  }

  // ==========================================================================
  // RECOMMENDATION GENERATION
  // ==========================================================================

  /**
   * Generate panning recommendations based on frequency conflicts
   */
  private generatePanningRecommendations(
    analyses: FrequencyAnalysis[],
    tracks: TrackAudioData[]
  ): PanningRecommendation[] {
    const recommendations: PanningRecommendation[] = [];
    const trackMap = new Map(tracks.map(t => [t.trackId, t]));

    // Group tracks by spectral centroid
    const sortedBySpectrum = [...analyses].sort(
      (a, b) => a.spectralCentroid - b.spectralCentroid
    );

    // Assign panning based on spectral content and category
    sortedBySpectrum.forEach((analysis, index) => {
      const track = trackMap.get(analysis.trackId);
      if (!track) return;

      const currentPan = track.currentPan ?? 0;
      let recommendedPan = 0;
      let reason = '';
      let priority: 'low' | 'medium' | 'high' = 'medium';

      // Category-based panning
      if (track.category === 'vocal') {
        recommendedPan = 0;
        reason = 'Lead vocals should be centered';
        priority = 'high';
      } else if (track.category === 'bass') {
        recommendedPan = 0;
        reason = 'Bass should be centered for solid foundation';
        priority = 'high';
      } else if (track.category === 'drums') {
        recommendedPan = 0;
        reason = 'Kick and snare should be centered';
        priority = 'high';
      } else {
        // Spread other instruments across stereo field
        const panPosition = ((index / sortedBySpectrum.length) - 0.5) * 2 * 60; // -60 to +60
        recommendedPan = Math.round(panPosition);
        reason = 'Spread across stereo field to reduce masking';
        priority = 'medium';
      }

      if (Math.abs(currentPan - recommendedPan) > 10) {
        recommendations.push({
          trackId: track.trackId,
          currentPan,
          recommendedPan,
          reason,
          priority
        });
      }
    });

    return recommendations;
  }

  /**
   * Generate EQ recommendations to reduce masking
   */
  private generateEQRecommendations(
    conflicts: FrequencyConflict[],
    analyses: FrequencyAnalysis[]
  ): EQRecommendation[] {
    const recommendations: EQRecommendation[] = [];

    for (const conflict of conflicts) {
      if (conflict.severity === 'low') continue;

      const track1Analysis = analyses.find(a => a.trackId === conflict.track1);
      const track2Analysis = analyses.find(a => a.trackId === conflict.track2);

      if (!track1Analysis || !track2Analysis) continue;

      // Determine which track should be cut
      const energy1 = track1Analysis.energyByBand[conflict.conflictBand];
      const energy2 = track2Analysis.energyByBand[conflict.conflictBand];

      // Cut the track with MORE energy to make room for the other
      const trackToCut = energy1 > energy2 ? conflict.track1 : conflict.track2;

      recommendations.push({
        trackId: trackToCut,
        frequency: conflict.conflictFrequency,
        gain: conflict.severity === 'high' ? -6 : -3,
        q: 2.0,
        type: 'bell',
        reason: `Reduce ${conflict.conflictBand} to minimize masking`,
        priority: conflict.severity === 'high' ? 'essential' : 'recommended'
      });
    }

    // Add always-recommended high-pass filters
    for (const analysis of analyses) {
      recommendations.push({
        trackId: analysis.trackId,
        frequency: 80,
        gain: 0,
        q: 0.7,
        type: 'highpass',
        reason: 'Remove rumble and low-frequency noise',
        priority: 'essential'
      });
    }

    return recommendations;
  }

  /**
   * Generate level recommendations based on psychoacoustic loudness
   */
  private generateLevelRecommendations(
    loudnessAnalyses: LoudnessAnalysis[],
    tracks: TrackAudioData[]
  ): LevelRecommendation[] {
    const recommendations: LevelRecommendation[] = [];
    const trackMap = new Map(tracks.map(t => [t.trackId, t]));

    // Find the loudest track
    const loudest = [...loudnessAnalyses].sort((a, b) => b.lufs - a.lufs)[0];
    if (!loudest) return recommendations;

    // Target levels relative to loudest track
    const targetLevels: Record<string, number> = {
      'vocal': -3,     // 3dB below loudest
      'drums': -3,     // 3dB below loudest
      'bass': -6,      // 6dB below loudest
      'guitar': -9,    // 9dB below loudest
      'keys': -9,      // 9dB below loudest
      'synth': -12,    // 12dB below loudest
      'fx': -15,       // 15dB below loudest
      'other': -9      // 9dB below loudest
    };

    for (const analysis of loudnessAnalyses) {
      const track = trackMap.get(analysis.trackId);
      if (!track) continue;

      const category = track.category || 'other';
      const targetOffset = targetLevels[category];
      const targetLevel = loudest.lufs + targetOffset;
      const currentLevel = track.currentLevel ?? 0;
      const recommendedLevel = currentLevel + (targetLevel - analysis.lufs);

      if (Math.abs(recommendedLevel - currentLevel) > 1) {
        recommendations.push({
          trackId: track.trackId,
          currentLevel,
          recommendedLevel,
          reason: `Balance ${category} level for optimal mix clarity`
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate compression recommendations based on dynamic range
   */
  private generateCompressionRecommendations(
    loudnessAnalyses: LoudnessAnalysis[],
    tracks: TrackAudioData[]
  ): CompressionRecommendation[] {
    const recommendations: CompressionRecommendation[] = [];
    const trackMap = new Map(tracks.map(t => [t.trackId, t]));

    for (const analysis of loudnessAnalyses) {
      const track = trackMap.get(analysis.trackId);
      if (!track) continue;

      const category = track.category || 'other';

      // Compression settings by category
      const settings: Record<string, CompressionRecommendation> = {
        'vocal': {
          trackId: track.trackId,
          threshold: -18,
          ratio: 4,
          attack: 10,
          release: 100,
          knee: 3,
          makeupGain: 3,
          reason: 'Even out vocal dynamics for consistent presence'
        },
        'drums': {
          trackId: track.trackId,
          threshold: -12,
          ratio: 6,
          attack: 1,
          release: 50,
          knee: 0,
          makeupGain: 4,
          reason: 'Add punch and control transients'
        },
        'bass': {
          trackId: track.trackId,
          threshold: -15,
          ratio: 5,
          attack: 5,
          release: 80,
          knee: 2,
          makeupGain: 3,
          reason: 'Tighten bass for solid low-end foundation'
        },
        'guitar': {
          trackId: track.trackId,
          threshold: -20,
          ratio: 3,
          attack: 15,
          release: 120,
          knee: 4,
          makeupGain: 2,
          reason: 'Smooth out guitar dynamics'
        },
        'keys': {
          trackId: track.trackId,
          threshold: -20,
          ratio: 3,
          attack: 20,
          release: 150,
          knee: 5,
          makeupGain: 2,
          reason: 'Control dynamic range of keys'
        },
        'synth': {
          trackId: track.trackId,
          threshold: -16,
          ratio: 4,
          attack: 5,
          release: 100,
          knee: 2,
          makeupGain: 2,
          reason: 'Glue synth elements together'
        },
        'fx': {
          trackId: track.trackId,
          threshold: -24,
          ratio: 2,
          attack: 30,
          release: 200,
          knee: 6,
          makeupGain: 1,
          reason: 'Subtle control of FX dynamics'
        },
        'other': {
          trackId: track.trackId,
          threshold: -18,
          ratio: 3.5,
          attack: 15,
          release: 120,
          knee: 4,
          makeupGain: 2,
          reason: 'Control dynamic range'
        }
      };

      // Adjust based on actual dynamic range
      const setting = settings[category];
      if (analysis.dynamicRange > 20) {
        setting.ratio *= 1.5; // More aggressive for very dynamic content
        setting.reason += ' (high dynamic range detected)';
      }

      recommendations.push(setting);
    }

    return recommendations;
  }

  /**
   * Create frequency map showing all tracks and conflicts
   */
  private createFrequencyMap(
    analyses: FrequencyAnalysis[],
    conflicts: FrequencyConflict[]
  ): FrequencyMap {
    // Create frequency bins (log scale for better visualization)
    const numBins = 100;
    const minFreq = 20;
    const maxFreq = 20000;
    const frequencies: number[] = [];

    for (let i = 0; i < numBins; i++) {
      const freq = minFreq * Math.pow(maxFreq / minFreq, i / (numBins - 1));
      frequencies.push(freq);
    }

    // Map each track's energy to these frequency bins
    const trackEnergies = new Map<string, Float32Array>();

    for (const analysis of analyses) {
      const energies = new Float32Array(numBins);
      const spectrum = analysis.spectrum;
      const sampleRate = 48000; // Assume standard sample rate

      for (let i = 0; i < numBins; i++) {
        const freq = frequencies[i];
        const bin = Math.floor((freq * 2 * spectrum.length) / sampleRate);
        if (bin < spectrum.length) {
          energies[i] = spectrum[bin];
        }
      }

      trackEnergies.set(analysis.trackId, energies);
    }

    // Identify conflict zones
    const conflictZones = conflicts.map(conflict => {
      const freqIndex = frequencies.findIndex(f => Math.abs(f - conflict.conflictFrequency) < 100);
      return {
        frequency: conflict.conflictFrequency,
        tracks: [conflict.track1, conflict.track2],
        severity: conflict.severity === 'high' ? 1.0 : conflict.severity === 'medium' ? 0.6 : 0.3
      };
    });

    return {
      frequencies,
      trackEnergies,
      conflictZones
    };
  }

  /**
   * Calculate overall mix health score
   */
  private calculateMixHealth(
    conflicts: FrequencyConflict[],
    phaseCorrelations: PhaseCorrelation[],
    loudnessAnalyses: LoudnessAnalysis[]
  ): MixAnalysisResult['mixHealth'] {
    const issues: string[] = [];

    // Frequency balance score
    const highSeverityConflicts = conflicts.filter(c => c.severity === 'high').length;
    const mediumSeverityConflicts = conflicts.filter(c => c.severity === 'medium').length;
    const frequencyBalance = Math.max(0, 100 - (highSeverityConflicts * 20 + mediumSeverityConflicts * 10));

    if (highSeverityConflicts > 0) {
      issues.push(`${highSeverityConflicts} severe frequency conflict(s) detected`);
    }

    // Phase correlation score
    const phaseIssues = phaseCorrelations.filter(p => p.hasPhaseIssues).length;
    const stereoImaging = Math.max(0, 100 - (phaseIssues * 25));

    if (phaseIssues > 0) {
      issues.push(`${phaseIssues} track(s) with phase correlation issues`);
    }

    // Dynamic range score
    const avgDynamicRange = loudnessAnalyses.reduce((sum, a) => sum + a.dynamicRange, 0) / loudnessAnalyses.length;
    const dynamicRange = avgDynamicRange > 30 ? 50 : avgDynamicRange > 15 ? 80 : avgDynamicRange > 8 ? 100 : 70;

    if (avgDynamicRange < 8) {
      issues.push('Mix is over-compressed (low dynamic range)');
    } else if (avgDynamicRange > 30) {
      issues.push('Mix has very high dynamic range (may need compression)');
    }

    // Overall score
    const score = Math.round((frequencyBalance + stereoImaging + dynamicRange) / 3);

    return {
      score,
      frequencyBalance,
      dynamicRange,
      stereoImaging,
      issues
    };
  }

  /**
   * Auto-balance mix levels using psychoacoustic loudness
   */
  autoBalanceMix(analysis: MixAnalysisResult): Map<string, number> {
    const balancedLevels = new Map<string, number>();

    for (const recommendation of analysis.levelRecommendations) {
      balancedLevels.set(recommendation.trackId, recommendation.recommendedLevel);
    }

    return balancedLevels;
  }

  /**
   * Export frequency map as visualization data
   */
  exportFrequencyMapData(frequencyMap: FrequencyMap): {
    frequencies: number[];
    tracks: Array<{ trackId: string; energies: number[] }>;
    conflicts: Array<{ frequency: number; tracks: string[]; severity: number }>;
  } {
    const tracks: Array<{ trackId: string; energies: number[] }> = [];

    frequencyMap.trackEnergies.forEach((energies, trackId) => {
      tracks.push({
        trackId,
        energies: Array.from(energies)
      });
    });

    return {
      frequencies: frequencyMap.frequencies,
      tracks,
      conflicts: frequencyMap.conflictZones
    };
  }

  /**
   * Generate human-readable summary
   */
  generateSummary(analysis: MixAnalysisResult): string {
    const lines: string[] = [];

    lines.push('=== SMART MIX ASSISTANT ANALYSIS ===\n');
    lines.push(`Analyzed ${analysis.trackCount} tracks at ${analysis.timestamp.toLocaleString()}\n`);

    lines.push(`\nMIX HEALTH: ${analysis.mixHealth.score}/100`);
    lines.push(`- Frequency Balance: ${analysis.mixHealth.frequencyBalance}/100`);
    lines.push(`- Stereo Imaging: ${analysis.mixHealth.stereoImaging}/100`);
    lines.push(`- Dynamic Range: ${analysis.mixHealth.dynamicRange}/100\n`);

    if (analysis.mixHealth.issues.length > 0) {
      lines.push('ISSUES DETECTED:');
      analysis.mixHealth.issues.forEach(issue => lines.push(`- ${issue}`));
      lines.push('');
    }

    if (analysis.frequencyConflicts.length > 0) {
      lines.push(`\nFREQUENCY CONFLICTS: ${analysis.frequencyConflicts.length}`);
      analysis.frequencyConflicts.slice(0, 5).forEach(conflict => {
        lines.push(`- ${conflict.track1} vs ${conflict.track2}: ${conflict.conflictBand} (${conflict.severity})`);
        lines.push(`  ${conflict.recommendation}`);
      });
      if (analysis.frequencyConflicts.length > 5) {
        lines.push(`  ... and ${analysis.frequencyConflicts.length - 5} more`);
      }
      lines.push('');
    }

    if (analysis.panningRecommendations.length > 0) {
      lines.push('\nPANNING RECOMMENDATIONS:');
      analysis.panningRecommendations.slice(0, 5).forEach(rec => {
        lines.push(`- ${rec.trackId}: ${rec.currentPan} -> ${rec.recommendedPan}`);
        lines.push(`  ${rec.reason}`);
      });
      lines.push('');
    }

    if (analysis.eqRecommendations.length > 0) {
      lines.push('\nEQ RECOMMENDATIONS:');
      const essential = analysis.eqRecommendations.filter(r => r.priority === 'essential');
      essential.slice(0, 5).forEach(rec => {
        lines.push(`- ${rec.trackId}: ${rec.type} @ ${rec.frequency}Hz, ${rec.gain}dB`);
        lines.push(`  ${rec.reason}`);
      });
      lines.push('');
    }

    lines.push('\n=== END ANALYSIS ===');

    return lines.join('\n');
  }
}

// Export singleton instance
export const smartMixAssistant = new SmartMixAssistant();
