/**
 * Room Analyzer - Analyzes room acoustics and microphone characteristics
 * Detects room modes, frequency response issues, and provides intelligent compensation
 */

export interface RoomAnalysis {
  resonances: RoomResonance[];
  frequencyResponse: FrequencyResponse;
  acousticIssues: AcousticIssue[];
  roomMetrics: RoomMetrics;
  timestamp: number;
}

export interface RoomResonance {
  frequency: number;
  magnitude: number;
  q: number;
  severity: number;
}

export interface FrequencyResponse {
  subBass: number;
  bass: number;
  lowMids: number;
  mids: number;
  highMids: number;
  presence: number;
  brilliance: number;
}

export interface AcousticIssue {
  type: 'bass_buildup' | 'harsh_highs' | 'room_modes' | 'comb_filtering';
  severity: number;
  description: string;
  suggestedFix: string;
}

export interface RoomMetrics {
  flatness: number;    // 0-1: How flat/even the frequency response is
  clarity: number;     // -1 to 1: Presence/clarity balance
  warmth: number;      // -1 to 1: Bass/mid balance
  quality: number;     // 0-1: Overall room quality score
}

export class RoomAnalyzer {
  private analyserNode: AnalyserNode;
  private audioContext: AudioContext;
  private analysisInterval: number | null = null;
  private callback?: (analysis: RoomAnalysis) => void;

  constructor(analyserNode: AnalyserNode, audioContext: AudioContext) {
    this.analyserNode = analyserNode;
    this.audioContext = audioContext;
  }

  /**
   * Start continuous room analysis
   */
  start(callback: (analysis: RoomAnalysis) => void): void {
    this.callback = callback;

    // Configure analyser for detailed frequency analysis
    this.analyserNode.fftSize = 8192; // High resolution for room mode detection
    this.analyserNode.smoothingTimeConstant = 0.3;

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    const analyze = () => {
      // Get frequency data
      this.analyserNode.getFloatFrequencyData(dataArray);

      // Analyze audio
      const analysis = this.analyzeRoomCharacteristics(dataArray);

      // Send to callback
      if (this.callback) {
        this.callback(analysis);
      }

      // Schedule next analysis
      this.analysisInterval = requestAnimationFrame(analyze) as any;
    };

    // Start analysis loop
    analyze();
    console.log('[RoomAnalyzer] Analysis started');
  }

  /**
   * Stop room analysis
   */
  stop(): void {
    if (this.analysisInterval) {
      cancelAnimationFrame(this.analysisInterval);
      this.analysisInterval = null;
    }
    this.callback = undefined;
    console.log('[RoomAnalyzer] Analysis stopped');
  }

  /**
   * Analyze room characteristics from FFT data
   */
  private analyzeRoomCharacteristics(fftData: Float32Array): RoomAnalysis {
    const sampleRate = this.audioContext.sampleRate;
    const binCount = fftData.length;
    const binSize = sampleRate / (2 * binCount);

    // Find room resonances (peaks in frequency response)
    const resonances = this.detectRoomModes(fftData, binSize);

    // Analyze frequency response curve
    const frequencyResponse = this.analyzeFrequencyResponse(fftData, binSize);

    // Detect acoustic issues
    const acousticIssues = this.detectAcousticIssues(fftData, binSize, resonances);

    // Calculate overall room quality metrics
    const roomMetrics = this.calculateRoomMetrics(fftData, frequencyResponse);

    return {
      resonances,
      frequencyResponse,
      acousticIssues,
      roomMetrics,
      timestamp: Date.now()
    };
  }

  /**
   * Detect room modes (resonant frequencies)
   */
  private detectRoomModes(fftData: Float32Array, binSize: number): RoomResonance[] {
    const resonances: RoomResonance[] = [];
    const threshold = -30; // dB threshold for significant peaks

    // Look for peaks in the frequency response
    for (let i = 2; i < fftData.length - 2; i++) {
      const current = fftData[i];

      // Check if this is a local peak
      if (
        current > threshold &&
        current > fftData[i - 1] &&
        current > fftData[i - 2] &&
        current > fftData[i + 1] &&
        current > fftData[i + 2]
      ) {
        const frequency = i * binSize;

        // Focus on problematic frequency ranges (below 300 Hz for room modes)
        if (frequency < 300) {
          resonances.push({
            frequency,
            magnitude: current,
            q: this.estimateResonanceQ(fftData, i),
            severity: this.calculateResonanceSeverity(current, frequency)
          });
        }
      }
    }

    // Sort by severity
    return resonances.sort((a, b) => b.severity - a.severity).slice(0, 10);
  }

  /**
   * Estimate Q factor (sharpness) of a resonance
   */
  private estimateResonanceQ(fftData: Float32Array, peakIndex: number): number {
    const peakValue = fftData[peakIndex];
    const halfPower = peakValue - 3; // -3dB point

    // Find bandwidth at -3dB
    let lowerIndex = peakIndex;
    let upperIndex = peakIndex;

    while (lowerIndex > 0 && fftData[lowerIndex] > halfPower) lowerIndex--;
    while (upperIndex < fftData.length && fftData[upperIndex] > halfPower) upperIndex++;

    const bandwidth = upperIndex - lowerIndex;
    return bandwidth > 0 ? peakIndex / bandwidth : 1;
  }

  /**
   * Calculate resonance severity
   */
  private calculateResonanceSeverity(magnitude: number, frequency: number): number {
    // Lower frequencies are more problematic
    const frequencyFactor = Math.max(0, 1 - frequency / 300);

    // Higher magnitude is more problematic
    const magnitudeFactor = Math.min(1, (magnitude + 60) / 30);

    return frequencyFactor * magnitudeFactor;
  }

  /**
   * Analyze overall frequency response
   */
  private analyzeFrequencyResponse(fftData: Float32Array, binSize: number): FrequencyResponse {
    const bands = {
      subBass: { start: 20, end: 60 },      // 20-60 Hz
      bass: { start: 60, end: 250 },        // 60-250 Hz
      lowMids: { start: 250, end: 500 },    // 250-500 Hz
      mids: { start: 500, end: 2000 },      // 500-2000 Hz
      highMids: { start: 2000, end: 4000 }, // 2-4 kHz
      presence: { start: 4000, end: 6000 }, // 4-6 kHz
      brilliance: { start: 6000, end: 20000 } // 6-20 kHz
    };

    const response: any = {};

    for (const [name, band] of Object.entries(bands)) {
      const startBin = Math.floor(band.start / binSize);
      const endBin = Math.ceil(band.end / binSize);

      let sum = 0;
      let count = 0;

      for (let i = startBin; i < endBin && i < fftData.length; i++) {
        sum += fftData[i];
        count++;
      }

      response[name] = count > 0 ? sum / count : -Infinity;
    }

    return response as FrequencyResponse;
  }

  /**
   * Detect common acoustic issues
   */
  private detectAcousticIssues(
    fftData: Float32Array,
    binSize: number,
    resonances: RoomResonance[]
  ): AcousticIssue[] {
    const issues: AcousticIssue[] = [];

    // Check for excessive bass buildup
    const bassResponse = this.calculateBandAverage(fftData, 60, 250, binSize);
    if (bassResponse > -10) {
      issues.push({
        type: 'bass_buildup',
        severity: Math.min(1, (bassResponse + 10) / 20),
        description: 'Excessive bass buildup detected - room may be too small or untreated',
        suggestedFix: 'Add bass traps in corners, move away from walls'
      });
    }

    // Check for harsh high frequencies
    const trebleResponse = this.calculateBandAverage(fftData, 6000, 12000, binSize);
    if (trebleResponse > -10) {
      issues.push({
        type: 'harsh_highs',
        severity: Math.min(1, (trebleResponse + 10) / 20),
        description: 'Harsh high frequencies - room may be too reflective',
        suggestedFix: 'Add acoustic panels, curtains, or absorptive materials'
      });
    }

    // Check for problematic room modes
    if (resonances.length > 0 && resonances[0].severity > 0.7) {
      issues.push({
        type: 'room_modes',
        severity: resonances[0].severity,
        description: `Strong room mode at ${Math.round(resonances[0].frequency)}Hz`,
        suggestedFix: 'Reposition mic/speakers, add bass traps, use EQ notch filter'
      });
    }

    return issues;
  }

  /**
   * Calculate average level for a frequency band
   */
  private calculateBandAverage(fftData: Float32Array, startFreq: number, endFreq: number, binSize: number): number {
    const startBin = Math.floor(startFreq / binSize);
    const endBin = Math.ceil(endFreq / binSize);

    let sum = 0;
    let count = 0;

    for (let i = startBin; i < endBin && i < fftData.length; i++) {
      sum += fftData[i];
      count++;
    }

    return count > 0 ? sum / count : -Infinity;
  }

  /**
   * Calculate overall room quality metrics
   */
  private calculateRoomMetrics(fftData: Float32Array, frequencyResponse: FrequencyResponse): RoomMetrics {
    // Calculate flatness (how even the frequency response is)
    const values = Object.values(frequencyResponse).filter(v => v > -Infinity);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const flatness = 1 / (1 + Math.sqrt(variance) / 10); // 0-1 scale

    // Calculate clarity (high-mid energy vs overall energy)
    const clarity = (frequencyResponse.presence - mean) / 20;

    // Calculate warmth (bass/mid ratio)
    const warmth = (frequencyResponse.bass - frequencyResponse.mids) / 20;

    // Overall room quality score
    const quality = (flatness * 0.5) + (Math.max(0, 1 - Math.abs(clarity)) * 0.3) + (Math.max(0, 1 - Math.abs(warmth)) * 0.2);

    return {
      flatness: Math.max(0, Math.min(1, flatness)),
      clarity: Math.max(-1, Math.min(1, clarity)),
      warmth: Math.max(-1, Math.min(1, warmth)),
      quality: Math.max(0, Math.min(1, quality))
    };
  }
}
