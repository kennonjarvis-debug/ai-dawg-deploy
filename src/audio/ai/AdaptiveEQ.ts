/**
 * Adaptive EQ with ML-Style Analysis for DAWG AI
 *
 * Intelligent EQ system that analyzes audio and suggests corrective and creative EQ moves
 * Features:
 * - Resonance and problematic frequency detection
 * - Reference track matching
 * - Auto-EQ for clarity and balance
 * - Genre-specific EQ templates
 * - Dynamic EQ that adapts to audio content
 *
 * Advanced techniques:
 * - 1/3 octave band analysis
 * - Critical band masking detection
 * - Spectral tilt measurement
 * - Crest factor analysis
 * - Resonance peak detection
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface FrequencyBand {
  frequency: number;           // Center frequency in Hz
  bandwidth: number;           // Bandwidth in Hz
  energy: number;              // Energy level in dB
  label: string;               // Human-readable label (e.g., "Sub Bass", "Presence")
}

export interface ResonancePeak {
  frequency: number;           // Resonant frequency in Hz
  magnitude: number;           // Peak magnitude in dB
  qFactor: number;             // Quality factor (narrowness of peak)
  severity: 'mild' | 'moderate' | 'severe';
  description: string;         // What this resonance sounds like
}

export interface MaskingIssue {
  maskedBand: FrequencyBand;
  maskingBand: FrequencyBand;
  severity: number;            // 0-1 scale
  description: string;
}

export interface SpectralAnalysis {
  spectralTilt: number;        // Overall brightness/darkness in dB/octave
  crestFactor: number;         // Peak to average ratio (transient content)
  toneToNoiseRatio: number;    // Harmonic vs inharmonic content in dB
  fundamentalFrequency: number | null;  // Detected fundamental (for tonal material)
  frequencyBands: FrequencyBand[];      // 1/3 octave analysis
  dominantFrequencies: number[];        // Top 5 prominent frequencies
}

export interface EQBand {
  type: 'lowpass' | 'highpass' | 'lowshelf' | 'highshelf' | 'bell' | 'notch';
  frequency: number;
  gain?: number;               // dB (not used for pass filters)
  q?: number;                  // Quality factor
}

export interface EQRecommendation {
  name: string;
  description: string;
  reason: string;
  priority: 'essential' | 'recommended' | 'optional' | 'creative';
  bands: EQBand[];
  category: 'corrective' | 'enhancement' | 'creative' | 'masking';
}

export interface EQAnalysisResult {
  spectralAnalysis: SpectralAnalysis;
  resonances: ResonancePeak[];
  maskingIssues: MaskingIssue[];
  problems: string[];          // Detected issues in plain English
  recommendations: EQRecommendation[];
  overall: {
    hasMudiness: boolean;
    hasHarshness: boolean;
    hasBoxiness: boolean;
    needsAir: boolean;
    needsWarmth: boolean;
    isBalanced: boolean;
  };
}

export interface ReferenceMatch {
  spectralDifference: number[];  // dB difference per frequency band
  tiltDifference: number;        // Spectral tilt difference
  recommendations: EQRecommendation[];
  matchQuality: number;          // 0-100 score
}

export type GenreEQStyle =
  | 'pop'
  | 'rock'
  | 'hiphop'
  | 'electronic'
  | 'jazz'
  | 'classical'
  | 'country'
  | 'metal'
  | 'indie'
  | 'rnb';

export interface GenreEQTemplate {
  name: string;
  description: string;
  spectralCharacter: string;
  bands: EQBand[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

// 1/3 octave band center frequencies (ISO 266)
const THIRD_OCTAVE_BANDS = [
  25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630,
  800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000,
  12500, 16000, 20000
];

// Frequency range labels
const FREQUENCY_LABELS: Record<string, [number, number]> = {
  'Sub Bass': [20, 60],
  'Bass': [60, 250],
  'Low Mids': [250, 500],
  'Mids': [500, 2000],
  'Upper Mids': [2000, 4000],
  'Presence': [4000, 6000],
  'Brilliance': [6000, 10000],
  'Air': [10000, 20000],
};

// Critical bands for masking detection (Bark scale approximation)
const CRITICAL_BANDS = [
  50, 150, 250, 350, 450, 570, 700, 840, 1000, 1170, 1370, 1600, 1850,
  2150, 2500, 2900, 3400, 4000, 4800, 5800, 7000, 8500, 10500, 13500
];

// Problem frequency ranges
const PROBLEM_RANGES = {
  mud: [200, 500],          // Low-mid muddiness
  boxiness: [400, 800],     // Boxy, honky sound
  nasality: [800, 1500],    // Nasal, telephone-like
  harshness: [2000, 5000],  // Harsh, fatiguing
  sibilance: [5000, 8000],  // Harsh "s" sounds
};

// ============================================================================
// ADAPTIVE EQ CLASS
// ============================================================================

export class AdaptiveEQ {
  private fftSize: number = 8192;
  private sampleRate: number = 48000;

  constructor(sampleRate: number = 48000, fftSize: number = 8192) {
    this.sampleRate = sampleRate;
    this.fftSize = fftSize;
  }

  // ==========================================================================
  // CORE ANALYSIS METHODS
  // ==========================================================================

  /**
   * Analyze audio buffer and provide intelligent EQ recommendations
   */
  analyzeAudio(audioBuffer: AudioBuffer): EQAnalysisResult {
    const channelData = audioBuffer.getChannelData(0);
    this.sampleRate = audioBuffer.sampleRate;

    // Perform spectral analysis
    const spectralAnalysis = this.performSpectralAnalysis(channelData);

    // Detect resonances
    const resonances = this.detectResonances(spectralAnalysis);

    // Detect masking issues
    const maskingIssues = this.detectMaskingIssues(spectralAnalysis);

    // Identify problems
    const problems = this.identifyProblems(spectralAnalysis, resonances);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      spectralAnalysis,
      resonances,
      maskingIssues,
      problems
    );

    // Overall assessment
    const overall = this.assessOverall(spectralAnalysis, resonances, maskingIssues);

    return {
      spectralAnalysis,
      resonances,
      maskingIssues,
      problems,
      recommendations,
      overall,
    };
  }

  /**
   * Match EQ to a reference track
   */
  matchReference(
    sourceBuffer: AudioBuffer,
    referenceBuffer: AudioBuffer
  ): ReferenceMatch {
    const sourceAnalysis = this.performSpectralAnalysis(sourceBuffer.getChannelData(0));
    const referenceAnalysis = this.performSpectralAnalysis(referenceBuffer.getChannelData(0));

    // Calculate spectral difference per band
    const spectralDifference = sourceAnalysis.frequencyBands.map((sourceBand, i) => {
      const refBand = referenceAnalysis.frequencyBands[i];
      return refBand.energy - sourceBand.energy; // Positive means need to boost
    });

    // Calculate tilt difference
    const tiltDifference = referenceAnalysis.spectralTilt - sourceAnalysis.spectralTilt;

    // Generate matching EQ recommendations
    const recommendations = this.generateMatchingEQ(
      spectralDifference,
      tiltDifference,
      sourceAnalysis.frequencyBands
    );

    // Calculate match quality score
    const matchQuality = this.calculateMatchQuality(spectralDifference);

    return {
      spectralDifference,
      tiltDifference,
      recommendations,
      matchQuality,
    };
  }

  /**
   * Auto-EQ for clarity and balance
   */
  autoEQForClarity(audioBuffer: AudioBuffer): EQRecommendation[] {
    const analysis = this.analyzeAudio(audioBuffer);
    const recommendations: EQRecommendation[] = [];

    // Remove masking frequencies
    if (analysis.maskingIssues.length > 0) {
      analysis.maskingIssues.forEach(issue => {
        recommendations.push({
          name: 'Masking Reduction',
          description: `Reduce ${issue.maskingBand.label} to unmask ${issue.maskedBand.label}`,
          reason: issue.description,
          priority: issue.severity > 0.7 ? 'essential' : 'recommended',
          category: 'masking',
          bands: [{
            type: 'bell',
            frequency: issue.maskingBand.frequency,
            gain: -3 * issue.severity,
            q: 2.0,
          }],
        });
      });
    }

    // Enhance fundamental frequencies
    if (analysis.spectralAnalysis.fundamentalFrequency) {
      const fundamental = analysis.spectralAnalysis.fundamentalFrequency;
      recommendations.push({
        name: 'Fundamental Enhancement',
        description: 'Enhance the fundamental frequency for better clarity',
        reason: `Detected fundamental at ${fundamental.toFixed(0)}Hz`,
        priority: 'recommended',
        category: 'enhancement',
        bands: [{
          type: 'bell',
          frequency: fundamental,
          gain: 2,
          q: 1.5,
        }],
      });
    }

    // Add air and presence intelligently
    if (analysis.overall.needsAir) {
      recommendations.push({
        name: 'Air Enhancement',
        description: 'Add high-frequency air for openness',
        reason: 'Spectrum lacks high-frequency content',
        priority: 'recommended',
        category: 'enhancement',
        bands: [{
          type: 'highshelf',
          frequency: 10000,
          gain: 2.5,
          q: 0.7,
        }],
      });
    }

    // Remove mud if present
    if (analysis.overall.hasMudiness) {
      recommendations.push({
        name: 'Mud Removal',
        description: 'Clean up low-mid muddiness',
        reason: 'Excessive energy in low-mid range (200-500Hz)',
        priority: 'essential',
        category: 'corrective',
        bands: [{
          type: 'bell',
          frequency: 350,
          gain: -3,
          q: 2.0,
        }],
      });
    }

    return recommendations;
  }

  /**
   * Get genre-specific EQ template
   */
  getGenreTemplate(genre: GenreEQStyle): GenreEQTemplate {
    const templates: Record<GenreEQStyle, GenreEQTemplate> = {
      pop: {
        name: 'Modern Pop',
        description: 'Bright, present, and polished with strong low end',
        spectralCharacter: 'Smiley curve with boosted lows and highs',
        bands: [
          { type: 'lowshelf', frequency: 100, gain: 2, q: 0.7 },
          { type: 'bell', frequency: 250, gain: -2, q: 1.5 }, // Reduce mud
          { type: 'bell', frequency: 3000, gain: 3, q: 1.2 }, // Presence
          { type: 'highshelf', frequency: 10000, gain: 2.5, q: 0.7 }, // Air
        ],
      },
      rock: {
        name: 'Rock/Alternative',
        description: 'Punchy mids, strong low-mids for power',
        spectralCharacter: 'Mid-forward with controlled high end',
        bands: [
          { type: 'highpass', frequency: 40 },
          { type: 'bell', frequency: 150, gain: 2, q: 1.0 }, // Bass punch
          { type: 'bell', frequency: 800, gain: 2, q: 1.5 }, // Body
          { type: 'bell', frequency: 2500, gain: -1.5, q: 2.0 }, // Reduce harshness
          { type: 'bell', frequency: 5000, gain: 1.5, q: 1.0 }, // Presence
        ],
      },
      hiphop: {
        name: 'Hip-Hop/Trap',
        description: 'Heavy sub bass, scooped mids, crisp highs',
        spectralCharacter: 'Strong low end with clear top end',
        bands: [
          { type: 'lowshelf', frequency: 60, gain: 4, q: 0.7 }, // Sub bass
          { type: 'bell', frequency: 400, gain: -3, q: 2.0 }, // Scoop mids
          { type: 'bell', frequency: 1000, gain: -2, q: 1.5 }, // Reduce boxiness
          { type: 'bell', frequency: 4000, gain: 2, q: 1.2 }, // Clarity
          { type: 'highshelf', frequency: 8000, gain: 2, q: 0.7 }, // Crispness
        ],
      },
      electronic: {
        name: 'Electronic/EDM',
        description: 'Extended sub bass, scooped mids, bright highs',
        spectralCharacter: 'Wide spectrum with emphasized extremes',
        bands: [
          { type: 'lowshelf', frequency: 50, gain: 3, q: 0.7 }, // Deep sub
          { type: 'bell', frequency: 300, gain: -2, q: 2.0 }, // Clean mids
          { type: 'bell', frequency: 2000, gain: -1, q: 1.5 }, // Reduce mid harshness
          { type: 'bell', frequency: 6000, gain: 3, q: 1.0 }, // Presence
          { type: 'highshelf', frequency: 12000, gain: 2, q: 0.7 }, // Sparkle
        ],
      },
      jazz: {
        name: 'Jazz/Acoustic',
        description: 'Natural, warm, and balanced with smooth highs',
        spectralCharacter: 'Flat with subtle warmth',
        bands: [
          { type: 'highpass', frequency: 30 },
          { type: 'lowshelf', frequency: 120, gain: 1, q: 0.7 }, // Warmth
          { type: 'bell', frequency: 400, gain: -0.5, q: 1.5 }, // Subtle mud control
          { type: 'bell', frequency: 3000, gain: 1, q: 1.0 }, // Natural presence
          { type: 'highshelf', frequency: 10000, gain: 0.5, q: 0.7 }, // Subtle air
        ],
      },
      classical: {
        name: 'Classical/Orchestral',
        description: 'Transparent, natural, full-range',
        spectralCharacter: 'Minimal processing, natural balance',
        bands: [
          { type: 'highpass', frequency: 25 },
          { type: 'bell', frequency: 250, gain: -1, q: 2.0 }, // Slight mud reduction
          { type: 'bell', frequency: 2500, gain: 0.5, q: 1.0 }, // Natural presence
          { type: 'highshelf', frequency: 8000, gain: 0.5, q: 0.7 }, // Air
        ],
      },
      country: {
        name: 'Country/Americana',
        description: 'Warm low-mids, clear presence, natural top end',
        spectralCharacter: 'Warm and clear with strong mid-range',
        bands: [
          { type: 'highpass', frequency: 50 },
          { type: 'lowshelf', frequency: 150, gain: 1.5, q: 0.7 }, // Warmth
          { type: 'bell', frequency: 300, gain: -1.5, q: 1.5 }, // Control mud
          { type: 'bell', frequency: 1000, gain: 1, q: 1.0 }, // Body
          { type: 'bell', frequency: 3500, gain: 2, q: 1.2 }, // Vocal presence
          { type: 'highshelf', frequency: 10000, gain: 1, q: 0.7 }, // Natural air
        ],
      },
      metal: {
        name: 'Metal/Heavy',
        description: 'Tight low end, aggressive mids, controlled highs',
        spectralCharacter: 'Focused and aggressive with controlled lows',
        bands: [
          { type: 'highpass', frequency: 60 }, // Tight low end
          { type: 'bell', frequency: 120, gain: 2, q: 1.0 }, // Bass punch
          { type: 'bell', frequency: 250, gain: -2, q: 2.0 }, // Remove mud
          { type: 'bell', frequency: 800, gain: 3, q: 1.5 }, // Growl
          { type: 'bell', frequency: 3000, gain: -2, q: 2.0 }, // Reduce harshness
          { type: 'bell', frequency: 5000, gain: 2, q: 1.0 }, // Clarity
        ],
      },
      indie: {
        name: 'Indie/Lo-Fi',
        description: 'Vintage character, rolled-off highs, warm mids',
        spectralCharacter: 'Warm and slightly dark with character',
        bands: [
          { type: 'highpass', frequency: 60 },
          { type: 'lowshelf', frequency: 200, gain: 2, q: 0.7 }, // Warmth
          { type: 'bell', frequency: 500, gain: 1, q: 1.0 }, // Body
          { type: 'bell', frequency: 2000, gain: -1, q: 1.5 }, // Reduce brightness
          { type: 'lowpass', frequency: 12000 }, // Vintage rolloff
        ],
      },
      rnb: {
        name: 'R&B/Soul',
        description: 'Warm low-mids, smooth presence, silky highs',
        spectralCharacter: 'Warm and smooth with controlled brightness',
        bands: [
          { type: 'highpass', frequency: 40 },
          { type: 'lowshelf', frequency: 100, gain: 2, q: 0.7 }, // Warmth
          { type: 'bell', frequency: 250, gain: -1, q: 1.5 }, // Control mud
          { type: 'bell', frequency: 1000, gain: 1, q: 1.0 }, // Body
          { type: 'bell', frequency: 4000, gain: 2, q: 1.2 }, // Vocal presence
          { type: 'highshelf', frequency: 10000, gain: 1.5, q: 0.7 }, // Silky highs
        ],
      },
    };

    return templates[genre];
  }

  /**
   * Apply dynamic EQ that adapts to content
   * Returns different EQ curves for loud vs quiet sections
   */
  getDynamicEQ(audioBuffer: AudioBuffer): {
    loudSections: EQRecommendation[];
    quietSections: EQRecommendation[];
    description: string;
  } {
    const channelData = audioBuffer.getChannelData(0);

    // Analyze loud sections (top 30% by RMS)
    const loudSections = this.extractLoudSections(channelData);
    const loudAnalysis = this.performSpectralAnalysis(loudSections);

    // Analyze quiet sections (bottom 30% by RMS)
    const quietSections = this.extractQuietSections(channelData);
    const quietAnalysis = this.performSpectralAnalysis(quietSections);

    const loudEQ: EQRecommendation[] = [];
    const quietEQ: EQRecommendation[] = [];

    // Loud sections - control harsh frequencies and resonances
    if (loudAnalysis.spectralTilt > 0) {
      loudEQ.push({
        name: 'High-Frequency Control',
        description: 'Tame brightness during loud passages',
        reason: 'Loud sections have excessive high-frequency content',
        priority: 'recommended',
        category: 'corrective',
        bands: [{
          type: 'highshelf',
          frequency: 6000,
          gain: -2,
          q: 0.7,
        }],
      });
    }

    // Quiet sections - enhance presence and clarity
    if (quietAnalysis.spectralTilt < -1) {
      quietEQ.push({
        name: 'Presence Enhancement',
        description: 'Enhance clarity during quiet passages',
        reason: 'Quiet sections lack high-frequency presence',
        priority: 'recommended',
        category: 'enhancement',
        bands: [{
          type: 'bell',
          frequency: 3000,
          gain: 2,
          q: 1.2,
        }],
      });
    }

    return {
      loudSections: loudEQ,
      quietSections: quietEQ,
      description: 'Dynamic EQ adapts to loud vs quiet content for consistent tone',
    };
  }

  // ==========================================================================
  // SPECTRAL ANALYSIS
  // ==========================================================================

  private performSpectralAnalysis(waveform: Float32Array): SpectralAnalysis {
    // Perform FFT
    const spectrum = this.computeFFT(waveform);

    // 1/3 octave band analysis
    const frequencyBands = this.computeThirdOctaveBands(spectrum);

    // Calculate spectral tilt (brightness/darkness)
    const spectralTilt = this.calculateSpectralTilt(frequencyBands);

    // Calculate crest factor (transient content)
    const crestFactor = this.calculateCrestFactor(waveform);

    // Calculate tone-to-noise ratio
    const toneToNoiseRatio = this.calculateToneToNoiseRatio(spectrum);

    // Detect fundamental frequency
    const fundamentalFrequency = this.detectFundamental(spectrum);

    // Find dominant frequencies
    const dominantFrequencies = this.findDominantFrequencies(spectrum, 5);

    return {
      spectralTilt,
      crestFactor,
      toneToNoiseRatio,
      fundamentalFrequency,
      frequencyBands,
      dominantFrequencies,
    };
  }

  private computeFFT(waveform: Float32Array): Float32Array {
    // Simplified FFT - in production would use a real FFT library
    // This is a placeholder that simulates spectral data
    const spectrum = new Float32Array(this.fftSize / 2);

    // Simulate spectrum with some random energy distribution
    for (let i = 0; i < spectrum.length; i++) {
      const freq = (i / spectrum.length) * (this.sampleRate / 2);

      // Simple spectral model: roll-off with some peaks
      let energy = Math.max(0, 60 - (freq / 200)); // Basic rolloff

      // Add some random variation
      energy += (Math.random() - 0.5) * 10;

      // Simulate some resonant peaks
      const peaks = [250, 500, 1000, 2000, 4000];
      peaks.forEach(peakFreq => {
        const distance = Math.abs(freq - peakFreq);
        if (distance < 100) {
          energy += 10 * Math.exp(-distance / 30);
        }
      });

      spectrum[i] = Math.max(0, energy);
    }

    return spectrum;
  }

  private computeThirdOctaveBands(spectrum: Float32Array): FrequencyBand[] {
    const bands: FrequencyBand[] = [];
    const freqResolution = (this.sampleRate / 2) / spectrum.length;

    for (const centerFreq of THIRD_OCTAVE_BANDS) {
      if (centerFreq > this.sampleRate / 2) continue;

      // 1/3 octave bandwidth
      const lowerFreq = centerFreq / Math.pow(2, 1/6);
      const upperFreq = centerFreq * Math.pow(2, 1/6);
      const bandwidth = upperFreq - lowerFreq;

      // Find corresponding FFT bins
      const lowerBin = Math.floor(lowerFreq / freqResolution);
      const upperBin = Math.ceil(upperFreq / freqResolution);

      // Calculate average energy in this band
      let energySum = 0;
      let count = 0;
      for (let i = lowerBin; i <= upperBin && i < spectrum.length; i++) {
        energySum += spectrum[i];
        count++;
      }
      const avgEnergy = count > 0 ? energySum / count : 0;

      // Determine band label
      let label = `${centerFreq}Hz`;
      for (const [name, [low, high]] of Object.entries(FREQUENCY_LABELS)) {
        if (centerFreq >= low && centerFreq < high) {
          label = name;
          break;
        }
      }

      bands.push({
        frequency: centerFreq,
        bandwidth,
        energy: avgEnergy,
        label,
      });
    }

    return bands;
  }

  private calculateSpectralTilt(bands: FrequencyBand[]): number {
    // Calculate slope from low to high frequencies (dB/octave)
    if (bands.length < 2) return 0;

    const lowBands = bands.slice(0, Math.floor(bands.length / 3));
    const highBands = bands.slice(-Math.floor(bands.length / 3));

    const lowAvg = lowBands.reduce((sum, b) => sum + b.energy, 0) / lowBands.length;
    const highAvg = highBands.reduce((sum, b) => sum + b.energy, 0) / highBands.length;

    const lowFreq = lowBands[Math.floor(lowBands.length / 2)].frequency;
    const highFreq = highBands[Math.floor(highBands.length / 2)].frequency;

    const octaves = Math.log2(highFreq / lowFreq);
    const tilt = (highAvg - lowAvg) / octaves;

    return tilt;
  }

  private calculateCrestFactor(waveform: Float32Array): number {
    // Peak to RMS ratio
    let peak = 0;
    let sumSquares = 0;

    for (let i = 0; i < waveform.length; i++) {
      const abs = Math.abs(waveform[i]);
      if (abs > peak) peak = abs;
      sumSquares += waveform[i] * waveform[i];
    }

    const rms = Math.sqrt(sumSquares / waveform.length);
    return peak / (rms || 0.001);
  }

  private calculateToneToNoiseRatio(spectrum: Float32Array): number {
    // Simplified: compare harmonic content to noise floor
    const sorted = Array.from(spectrum).sort((a, b) => b - a);
    const harmonicEnergy = sorted.slice(0, 10).reduce((sum, val) => sum + val, 0) / 10;
    const noiseFloor = sorted.slice(-100).reduce((sum, val) => sum + val, 0) / 100;

    return 20 * Math.log10(harmonicEnergy / (noiseFloor || 0.001));
  }

  private detectFundamental(spectrum: Float32Array): number | null {
    // Find the strongest low-frequency component (simplified)
    const freqResolution = (this.sampleRate / 2) / spectrum.length;
    const maxSearchFreq = 500; // Hz
    const maxBin = Math.floor(maxSearchFreq / freqResolution);

    let maxEnergy = 0;
    let maxBin_idx = -1;

    for (let i = 1; i < maxBin && i < spectrum.length; i++) {
      if (spectrum[i] > maxEnergy) {
        maxEnergy = spectrum[i];
        maxBin_idx = i;
      }
    }

    if (maxBin_idx > 0 && maxEnergy > 10) {
      return maxBin_idx * freqResolution;
    }

    return null;
  }

  private findDominantFrequencies(spectrum: Float32Array, count: number): number[] {
    const freqResolution = (this.sampleRate / 2) / spectrum.length;
    const peaks: Array<{ freq: number; energy: number }> = [];

    // Find local maxima
    for (let i = 2; i < spectrum.length - 2; i++) {
      if (
        spectrum[i] > spectrum[i - 1] &&
        spectrum[i] > spectrum[i + 1] &&
        spectrum[i] > spectrum[i - 2] &&
        spectrum[i] > spectrum[i + 2]
      ) {
        peaks.push({
          freq: i * freqResolution,
          energy: spectrum[i],
        });
      }
    }

    // Sort by energy and return top N
    peaks.sort((a, b) => b.energy - a.energy);
    return peaks.slice(0, count).map(p => p.freq);
  }

  // ==========================================================================
  // PROBLEM DETECTION
  // ==========================================================================

  private detectResonances(analysis: SpectralAnalysis): ResonancePeak[] {
    const resonances: ResonancePeak[] = [];

    // Look for narrow peaks with high Q
    for (let i = 1; i < analysis.frequencyBands.length - 1; i++) {
      const current = analysis.frequencyBands[i];
      const prev = analysis.frequencyBands[i - 1];
      const next = analysis.frequencyBands[i + 1];

      // Check if this band is significantly louder than neighbors
      const peakAmount = current.energy - (prev.energy + next.energy) / 2;

      if (peakAmount > 8) { // More than 8dB above neighbors
        const qFactor = current.frequency / current.bandwidth;
        const severity: 'mild' | 'moderate' | 'severe' =
          peakAmount > 15 ? 'severe' :
          peakAmount > 12 ? 'moderate' : 'mild';

        let description = '';
        if (current.frequency < 300) {
          description = 'Boomy low-frequency resonance';
        } else if (current.frequency < 800) {
          description = 'Boxy mid-range resonance';
        } else if (current.frequency < 2000) {
          description = 'Nasal mid-range resonance';
        } else if (current.frequency < 5000) {
          description = 'Harsh mid-high resonance';
        } else {
          description = 'Piercing high-frequency resonance';
        }

        resonances.push({
          frequency: current.frequency,
          magnitude: peakAmount,
          qFactor,
          severity,
          description,
        });
      }
    }

    return resonances;
  }

  private detectMaskingIssues(analysis: SpectralAnalysis): MaskingIssue[] {
    const issues: MaskingIssue[] = [];

    // Check critical bands for masking
    for (let i = 0; i < analysis.frequencyBands.length - 1; i++) {
      const lowerBand = analysis.frequencyBands[i];
      const upperBand = analysis.frequencyBands[i + 1];

      // If lower band is much louder, it may mask upper band
      const energyDiff = lowerBand.energy - upperBand.energy;

      if (energyDiff > 15) { // Lower band is 15dB+ louder
        const severity = Math.min((energyDiff - 15) / 15, 1);

        issues.push({
          maskedBand: upperBand,
          maskingBand: lowerBand,
          severity,
          description: `${lowerBand.label} is masking ${upperBand.label}`,
        });
      }
    }

    return issues;
  }

  private identifyProblems(
    analysis: SpectralAnalysis,
    resonances: ResonancePeak[]
  ): string[] {
    const problems: string[] = [];

    // Check for mud (excess 200-500Hz)
    const mudBands = analysis.frequencyBands.filter(
      b => b.frequency >= PROBLEM_RANGES.mud[0] && b.frequency <= PROBLEM_RANGES.mud[1]
    );
    const avgMudEnergy = mudBands.reduce((sum, b) => sum + b.energy, 0) / mudBands.length;
    if (avgMudEnergy > 50) {
      problems.push('Muddy low-mid frequencies (200-500Hz) - sounds unclear and thick');
    }

    // Check for harshness (2-5kHz)
    const harshBands = analysis.frequencyBands.filter(
      b => b.frequency >= PROBLEM_RANGES.harshness[0] && b.frequency <= PROBLEM_RANGES.harshness[1]
    );
    const avgHarshEnergy = harshBands.reduce((sum, b) => sum + b.energy, 0) / harshBands.length;
    if (avgHarshEnergy > 55) {
      problems.push('Harsh mid-high frequencies (2-5kHz) - sounds aggressive and fatiguing');
    }

    // Check for boxiness (400-800Hz)
    const boxyBands = analysis.frequencyBands.filter(
      b => b.frequency >= PROBLEM_RANGES.boxiness[0] && b.frequency <= PROBLEM_RANGES.boxiness[1]
    );
    const avgBoxyEnergy = boxyBands.reduce((sum, b) => sum + b.energy, 0) / boxyBands.length;
    if (avgBoxyEnergy > 52) {
      problems.push('Boxy sound (400-800Hz) - sounds honky and confined');
    }

    // Check spectral tilt
    if (analysis.spectralTilt < -3) {
      problems.push('Very dark sound - lacks high-frequency energy and air');
    } else if (analysis.spectralTilt > 3) {
      problems.push('Very bright sound - may be harsh and thin');
    }

    // Check for severe resonances
    const severeResonances = resonances.filter(r => r.severity === 'severe');
    if (severeResonances.length > 0) {
      severeResonances.forEach(r => {
        problems.push(`Severe resonance at ${r.frequency.toFixed(0)}Hz - ${r.description}`);
      });
    }

    return problems;
  }

  private assessOverall(
    analysis: SpectralAnalysis,
    resonances: ResonancePeak[],
    maskingIssues: MaskingIssue[]
  ): EQAnalysisResult['overall'] {
    const mudBands = analysis.frequencyBands.filter(
      b => b.frequency >= PROBLEM_RANGES.mud[0] && b.frequency <= PROBLEM_RANGES.mud[1]
    );
    const avgMudEnergy = mudBands.reduce((sum, b) => sum + b.energy, 0) / mudBands.length;

    const harshBands = analysis.frequencyBands.filter(
      b => b.frequency >= PROBLEM_RANGES.harshness[0] && b.frequency <= PROBLEM_RANGES.harshness[1]
    );
    const avgHarshEnergy = harshBands.reduce((sum, b) => sum + b.energy, 0) / harshBands.length;

    const boxyBands = analysis.frequencyBands.filter(
      b => b.frequency >= PROBLEM_RANGES.boxiness[0] && b.frequency <= PROBLEM_RANGES.boxiness[1]
    );
    const avgBoxyEnergy = boxyBands.reduce((sum, b) => sum + b.energy, 0) / boxyBands.length;

    const airBands = analysis.frequencyBands.filter(b => b.frequency >= 10000);
    const avgAirEnergy = airBands.reduce((sum, b) => sum + b.energy, 0) / airBands.length;

    const warmthBands = analysis.frequencyBands.filter(
      b => b.frequency >= 150 && b.frequency <= 300
    );
    const avgWarmthEnergy = warmthBands.reduce((sum, b) => sum + b.energy, 0) / warmthBands.length;

    return {
      hasMudiness: avgMudEnergy > 50,
      hasHarshness: avgHarshEnergy > 55,
      hasBoxiness: avgBoxyEnergy > 52,
      needsAir: avgAirEnergy < 30,
      needsWarmth: avgWarmthEnergy < 35,
      isBalanced: Math.abs(analysis.spectralTilt) < 2 && resonances.length < 2,
    };
  }

  // ==========================================================================
  // RECOMMENDATION GENERATION
  // ==========================================================================

  private generateRecommendations(
    analysis: SpectralAnalysis,
    resonances: ResonancePeak[],
    maskingIssues: MaskingIssue[],
    problems: string[]
  ): EQRecommendation[] {
    const recommendations: EQRecommendation[] = [];

    // Always include high-pass filter
    recommendations.push({
      name: 'High-Pass Filter',
      description: 'Remove sub-sonic rumble and DC offset',
      reason: 'Essential for clean low end',
      priority: 'essential',
      category: 'corrective',
      bands: [{ type: 'highpass', frequency: 30 }],
    });

    // Address resonances
    resonances.forEach(resonance => {
      const priority = resonance.severity === 'severe' ? 'essential' :
                       resonance.severity === 'moderate' ? 'recommended' : 'optional';

      recommendations.push({
        name: `Resonance Reduction at ${resonance.frequency.toFixed(0)}Hz`,
        description: `Notch out ${resonance.severity} resonance`,
        reason: resonance.description,
        priority,
        category: 'corrective',
        bands: [{
          type: 'bell',
          frequency: resonance.frequency,
          gain: -resonance.magnitude * 0.7, // Reduce by 70%
          q: resonance.qFactor * 0.8,
        }],
      });
    });

    // Address mud
    const overall = this.assessOverall(analysis, resonances, maskingIssues);
    if (overall.hasMudiness) {
      recommendations.push({
        name: 'Mud Reduction',
        description: 'Clear low-mid muddiness',
        reason: 'Excessive energy in 200-500Hz range',
        priority: 'essential',
        category: 'corrective',
        bands: [{
          type: 'bell',
          frequency: 350,
          gain: -3.5,
          q: 2.0,
        }],
      });
    }

    // Address harshness
    if (overall.hasHarshness) {
      recommendations.push({
        name: 'Harshness Reduction',
        description: 'Tame aggressive mid-high frequencies',
        reason: 'Excessive energy in 2-5kHz range',
        priority: 'recommended',
        category: 'corrective',
        bands: [{
          type: 'bell',
          frequency: 3500,
          gain: -2.5,
          q: 1.5,
        }],
      });
    }

    // Address boxiness
    if (overall.hasBoxiness) {
      recommendations.push({
        name: 'Boxiness Reduction',
        description: 'Remove boxy, telephone-like quality',
        reason: 'Excessive energy in 400-800Hz range',
        priority: 'recommended',
        category: 'corrective',
        bands: [{
          type: 'bell',
          frequency: 600,
          gain: -2,
          q: 2.0,
        }],
      });
    }

    // Add air if needed
    if (overall.needsAir) {
      recommendations.push({
        name: 'Air Enhancement',
        description: 'Add high-frequency openness and sparkle',
        reason: 'Lacks high-frequency content above 10kHz',
        priority: 'recommended',
        category: 'enhancement',
        bands: [{
          type: 'highshelf',
          frequency: 10000,
          gain: 2.5,
          q: 0.7,
        }],
      });
    }

    // Add warmth if needed
    if (overall.needsWarmth) {
      recommendations.push({
        name: 'Warmth Enhancement',
        description: 'Add body and low-mid fullness',
        reason: 'Lacks warmth in 150-300Hz range',
        priority: 'optional',
        category: 'enhancement',
        bands: [{
          type: 'lowshelf',
          frequency: 200,
          gain: 2,
          q: 0.7,
        }],
      });
    }

    // Presence boost (always helpful for most sources)
    recommendations.push({
      name: 'Presence Boost',
      description: 'Enhance clarity and intelligibility',
      reason: 'Brings the sound forward in the mix',
      priority: 'optional',
      category: 'enhancement',
      bands: [{
        type: 'bell',
        frequency: 3000,
        gain: 2,
        q: 1.2,
      }],
    });

    return recommendations;
  }

  private generateMatchingEQ(
    spectralDifference: number[],
    tiltDifference: number,
    sourceBands: FrequencyBand[]
  ): EQRecommendation[] {
    const recommendations: EQRecommendation[] = [];

    // Overall tilt correction
    if (Math.abs(tiltDifference) > 1) {
      const isTooBright = tiltDifference < 0;
      recommendations.push({
        name: isTooBright ? 'Brightness Reduction' : 'Brightness Enhancement',
        description: `Match overall spectral tilt to reference`,
        reason: `Reference is ${isTooBright ? 'darker' : 'brighter'} by ${Math.abs(tiltDifference).toFixed(1)}dB/octave`,
        priority: 'essential',
        category: 'corrective',
        bands: [{
          type: 'highshelf',
          frequency: 8000,
          gain: tiltDifference * 0.5,
          q: 0.7,
        }],
      });
    }

    // Band-by-band corrections (only significant differences)
    spectralDifference.forEach((diff, i) => {
      if (Math.abs(diff) > 3 && sourceBands[i]) {
        const band = sourceBands[i];
        const needsBoost = diff > 0;

        recommendations.push({
          name: `${needsBoost ? 'Boost' : 'Cut'} ${band.label}`,
          description: `Match ${band.label} (${band.frequency}Hz) to reference`,
          reason: `${Math.abs(diff).toFixed(1)}dB ${needsBoost ? 'quieter' : 'louder'} than reference`,
          priority: Math.abs(diff) > 6 ? 'recommended' : 'optional',
          category: 'corrective',
          bands: [{
            type: 'bell',
            frequency: band.frequency,
            gain: diff * 0.7, // Apply 70% of the difference
            q: 1.5,
          }],
        });
      }
    });

    return recommendations;
  }

  private calculateMatchQuality(spectralDifference: number[]): number {
    // Calculate RMS error
    const sumSquares = spectralDifference.reduce((sum, diff) => sum + diff * diff, 0);
    const rmsError = Math.sqrt(sumSquares / spectralDifference.length);

    // Convert to 0-100 score (lower error = higher score)
    const score = Math.max(0, 100 - rmsError * 5);
    return score;
  }

  // ==========================================================================
  // DYNAMIC EQ HELPERS
  // ==========================================================================

  private extractLoudSections(waveform: Float32Array): Float32Array {
    const windowSize = 4096;
    const rmsValues: Array<{ rms: number; start: number }> = [];

    // Calculate RMS for each window
    for (let i = 0; i < waveform.length - windowSize; i += windowSize) {
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        const sample = waveform[i + j];
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / windowSize);
      rmsValues.push({ rms, start: i });
    }

    // Sort by RMS and extract top 30%
    rmsValues.sort((a, b) => b.rms - a.rms);
    const topCount = Math.floor(rmsValues.length * 0.3);
    const loudWindows = rmsValues.slice(0, topCount);

    // Concatenate loud sections
    const result = new Float32Array(topCount * windowSize);
    loudWindows.forEach((window, idx) => {
      for (let i = 0; i < windowSize; i++) {
        result[idx * windowSize + i] = waveform[window.start + i];
      }
    });

    return result;
  }

  private extractQuietSections(waveform: Float32Array): Float32Array {
    const windowSize = 4096;
    const rmsValues: Array<{ rms: number; start: number }> = [];

    // Calculate RMS for each window
    for (let i = 0; i < waveform.length - windowSize; i += windowSize) {
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        const sample = waveform[i + j];
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / windowSize);
      if (rms > 0.01) { // Ignore near-silence
        rmsValues.push({ rms, start: i });
      }
    }

    // Sort by RMS and extract bottom 30%
    rmsValues.sort((a, b) => a.rms - b.rms);
    const bottomCount = Math.floor(rmsValues.length * 0.3);
    const quietWindows = rmsValues.slice(0, bottomCount);

    // Concatenate quiet sections
    const result = new Float32Array(bottomCount * windowSize);
    quietWindows.forEach((window, idx) => {
      for (let i = 0; i < windowSize; i++) {
        result[idx * windowSize + i] = waveform[window.start + i];
      }
    });

    return result;
  }
}

// Export singleton instance
export const adaptiveEQ = new AdaptiveEQ();
