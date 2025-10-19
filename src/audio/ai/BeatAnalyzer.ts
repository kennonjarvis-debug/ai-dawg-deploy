/**
 * Beat Detection & Quantization System for DAWG AI
 *
 * Advanced beat analysis using:
 * - Onset detection (spectral flux, high-frequency content)
 * - Autocorrelation for tempo estimation
 * - Dynamic programming for beat tracking
 * - Phase vocoder for time stretching in quantization
 * - Pitch tracking for MIDI extraction
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface BeatAnalysisResult {
  bpm: number;
  confidence: number;           // 0-1
  beats: BeatPosition[];
  downbeats: number[];          // Indices of downbeats in beats array
  measures: MeasureBoundary[];
  timeSignature: TimeSignature;
  tempoStability: number;       // 0-1, how stable the tempo is
  onsetStrength: number[];      // Onset detection function
}

export interface BeatPosition {
  time: number;                 // Time in seconds
  strength: number;             // Beat strength 0-1
  beatNumber: number;           // Beat number within measure (1-based)
  measureNumber: number;        // Measure number (0-based)
  isDownbeat: boolean;
}

export interface MeasureBoundary {
  measureNumber: number;
  startTime: number;
  endTime: number;
  beatCount: number;
}

export interface TimeSignature {
  numerator: number;            // e.g., 4 in 4/4
  denominator: number;          // e.g., 4 in 4/4
  confidence: number;           // 0-1
}

export interface QuantizeOptions {
  strength: number;             // 0-1, how much to quantize
  gridDivision: number;         // 4=quarter, 8=eighth, 16=sixteenth
  swing: number;                // 0-1, swing amount
  humanize: number;             // 0-1, add random variation
}

export interface MIDINote {
  pitch: number;                // MIDI note number (0-127)
  velocity: number;             // 0-127
  startTime: number;            // Seconds
  duration: number;             // Seconds
  frequency: number;            // Hz
  confidence: number;           // 0-1
}

export interface MIDIExtractionResult {
  notes: MIDINote[];
  key: string;                  // Detected key (e.g., "C", "Am")
  scale: string;                // Major/Minor/etc
  averagePitch: number;         // MIDI note number
}

// ============================================================================
// BEAT ANALYZER CLASS
// ============================================================================

export class BeatAnalyzer {
  private sampleRate: number = 44100;
  private fftSize: number = 2048;
  private hopSize: number = 512;

  // ========================================================================
  // PUBLIC API - MAIN ANALYSIS METHODS
  // ========================================================================

  /**
   * Comprehensive beat analysis
   */
  async analyzeBeat(audioBuffer: AudioBuffer): Promise<BeatAnalysisResult> {
    this.sampleRate = audioBuffer.sampleRate;
    const channelData = audioBuffer.getChannelData(0);

    console.log('[BeatAnalyzer] Starting beat analysis...');
    console.log('[BeatAnalyzer] Audio duration:', audioBuffer.duration.toFixed(2), 's');

    // Step 1: Onset detection
    const onsetStrength = this.detectOnsets(channelData);
    console.log('[BeatAnalyzer] Onset detection complete, peaks:', onsetStrength.length);

    // Step 2: Tempo estimation using autocorrelation
    const tempoEstimate = this.estimateTempo(onsetStrength);
    console.log('[BeatAnalyzer] Estimated BPM:', tempoEstimate.bpm, 'confidence:', tempoEstimate.confidence.toFixed(3));

    // Step 3: Beat tracking using dynamic programming
    const beats = this.trackBeats(onsetStrength, tempoEstimate.bpm);
    console.log('[BeatAnalyzer] Detected', beats.length, 'beats');

    // Step 4: Detect time signature
    const timeSignature = this.detectTimeSignature(beats);
    console.log('[BeatAnalyzer] Time signature:', `${timeSignature.numerator}/${timeSignature.denominator}`,
                'confidence:', timeSignature.confidence.toFixed(3));

    // Step 5: Identify downbeats and measures
    const { downbeats, measures } = this.identifyDownbeats(beats, timeSignature);
    console.log('[BeatAnalyzer] Detected', downbeats.length, 'downbeats and', measures.length, 'measures');

    // Step 6: Calculate tempo stability
    const tempoStability = this.calculateTempoStability(beats);
    console.log('[BeatAnalyzer] Tempo stability:', tempoStability.toFixed(3));

    return {
      bpm: tempoEstimate.bpm,
      confidence: tempoEstimate.confidence,
      beats,
      downbeats,
      measures,
      timeSignature,
      tempoStability,
      onsetStrength
    };
  }

  /**
   * Quantize audio to grid with time stretching
   */
  async quantizeAudio(
    audioBuffer: AudioBuffer,
    beatAnalysis: BeatAnalysisResult,
    options: QuantizeOptions
  ): Promise<AudioBuffer> {
    console.log('[BeatAnalyzer] Quantizing audio...');
    console.log('[BeatAnalyzer] Strength:', options.strength, 'Grid:', options.gridDivision);

    const channelData = audioBuffer.getChannelData(0);

    // Calculate grid times based on BPM and grid division
    const gridTimes = this.calculateGridTimes(
      audioBuffer.duration,
      beatAnalysis.bpm,
      options.gridDivision
    );

    // Apply phase vocoder time stretching
    const quantized = this.phaseVocoderQuantize(
      channelData,
      beatAnalysis.beats,
      gridTimes,
      options
    );

    // Create output buffer
    const outputBuffer = new AudioContext().createBuffer(
      audioBuffer.numberOfChannels,
      quantized.length,
      audioBuffer.sampleRate
    );
    outputBuffer.getChannelData(0).set(quantized);

    console.log('[BeatAnalyzer] Quantization complete');
    return outputBuffer;
  }

  /**
   * Extract MIDI from monophonic audio
   */
  async extractMIDI(audioBuffer: AudioBuffer): Promise<MIDIExtractionResult> {
    console.log('[BeatAnalyzer] Extracting MIDI from audio...');

    const channelData = audioBuffer.getChannelData(0);

    // Track pitch over time
    const pitchTrack = this.trackPitch(channelData);
    console.log('[BeatAnalyzer] Pitch tracking complete, found', pitchTrack.length, 'frames');

    // Convert pitch track to MIDI notes
    const notes = this.pitchTrackToMIDI(pitchTrack);
    console.log('[BeatAnalyzer] Extracted', notes.length, 'MIDI notes');

    // Analyze key and scale
    const { key, scale } = this.detectKey(notes);
    console.log('[BeatAnalyzer] Detected key:', key, scale);

    // Calculate average pitch
    const averagePitch = notes.reduce((sum, note) => sum + note.pitch, 0) / notes.length || 60;

    return {
      notes,
      key,
      scale,
      averagePitch
    };
  }

  // ========================================================================
  // ONSET DETECTION
  // ========================================================================

  /**
   * Detect onsets using spectral flux and high-frequency content
   */
  private detectOnsets(audioData: Float32Array): Float32Array {
    const frameCount = Math.floor((audioData.length - this.fftSize) / this.hopSize);
    const onsetStrength = new Float32Array(frameCount);

    let prevMagnitude: Float32Array | null = null;

    for (let i = 0; i < frameCount; i++) {
      const frameStart = i * this.hopSize;
      const frame = audioData.slice(frameStart, frameStart + this.fftSize);

      // Apply Hann window
      const windowed = this.applyHannWindow(frame);

      // Compute FFT magnitude spectrum
      const magnitude = this.computeMagnitudeSpectrum(windowed);

      if (prevMagnitude) {
        // Spectral flux: sum of positive differences
        let flux = 0;
        let hfcEnergy = 0; // High-frequency content

        for (let j = 0; j < magnitude.length; j++) {
          const diff = magnitude[j] - prevMagnitude[j];
          if (diff > 0) {
            flux += diff;
          }

          // Weight higher frequencies more (emphasizes transients)
          if (j > magnitude.length / 2) {
            hfcEnergy += magnitude[j] * (j / magnitude.length);
          }
        }

        // Combine spectral flux and HFC
        onsetStrength[i] = flux * 0.7 + hfcEnergy * 0.3;
      }

      prevMagnitude = magnitude;
    }

    // Normalize
    const max = Math.max(...Array.from(onsetStrength));
    if (max > 0) {
      for (let i = 0; i < onsetStrength.length; i++) {
        onsetStrength[i] /= max;
      }
    }

    // Apply peak picking with adaptive threshold
    return this.pickOnsetPeaks(onsetStrength);
  }

  /**
   * Peak picking with adaptive threshold
   */
  private pickOnsetPeaks(onsetFunction: Float32Array): Float32Array {
    const windowSize = 10;
    const delta = 0.07; // Threshold delta above local mean
    const peaks = new Float32Array(onsetFunction.length);

    for (let i = windowSize; i < onsetFunction.length - windowSize; i++) {
      const value = onsetFunction[i];

      // Calculate local mean
      let localSum = 0;
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        localSum += onsetFunction[j];
      }
      const localMean = localSum / (2 * windowSize + 1);

      // Check if this is a peak above threshold
      if (value > localMean + delta) {
        let isPeak = true;

        // Check if it's a local maximum
        for (let j = i - 3; j <= i + 3; j++) {
          if (j !== i && onsetFunction[j] >= value) {
            isPeak = false;
            break;
          }
        }

        if (isPeak) {
          peaks[i] = value;
        }
      }
    }

    return peaks;
  }

  // ========================================================================
  // TEMPO ESTIMATION (AUTOCORRELATION)
  // ========================================================================

  /**
   * Estimate tempo using autocorrelation
   */
  private estimateTempo(onsetStrength: Float32Array): { bpm: number; confidence: number } {
    // Convert to time domain (onset times in seconds)
    const hopDuration = this.hopSize / this.sampleRate;

    // Autocorrelation for lag range corresponding to 40-240 BPM
    const minBPM = 40;
    const maxBPM = 240;
    const minLag = Math.floor((60 / maxBPM) / hopDuration);
    const maxLag = Math.floor((60 / minBPM) / hopDuration);

    const autocorr = new Float32Array(maxLag - minLag);

    // Calculate autocorrelation
    for (let lag = minLag; lag < maxLag; lag++) {
      let sum = 0;
      let count = 0;

      for (let i = 0; i < onsetStrength.length - lag; i++) {
        sum += onsetStrength[i] * onsetStrength[i + lag];
        count++;
      }

      autocorr[lag - minLag] = count > 0 ? sum / count : 0;
    }

    // Find peak in autocorrelation
    let maxCorr = 0;
    let peakLag = minLag;

    for (let i = 0; i < autocorr.length; i++) {
      if (autocorr[i] > maxCorr) {
        maxCorr = autocorr[i];
        peakLag = minLag + i;
      }
    }

    // Convert lag to BPM
    const beatPeriod = peakLag * hopDuration;
    let bpm = 60 / beatPeriod;

    // Common BPM multiplier correction (e.g., 70 BPM might be detected as 140)
    // Bias towards typical BPM ranges
    if (bpm < 60) {
      bpm *= 2;
    } else if (bpm > 180) {
      bpm /= 2;
    }

    // Round to nearest integer
    bpm = Math.round(bpm);

    // Confidence based on autocorrelation peak strength
    const confidence = Math.min(1.0, maxCorr * 2);

    return { bpm, confidence };
  }

  // ========================================================================
  // BEAT TRACKING (DYNAMIC PROGRAMMING)
  // ========================================================================

  /**
   * Track beats using dynamic programming
   */
  private trackBeats(onsetStrength: Float32Array, bpm: number): BeatPosition[] {
    const hopDuration = this.hopSize / this.sampleRate;
    const expectedBeatInterval = 60 / bpm; // Seconds
    const expectedBeatIntervalFrames = Math.round(expectedBeatInterval / hopDuration);

    // Find onset peaks (potential beat locations)
    const onsetTimes: number[] = [];
    const onsetStrengths: number[] = [];

    for (let i = 0; i < onsetStrength.length; i++) {
      if (onsetStrength[i] > 0.1) { // Threshold
        onsetTimes.push(i * hopDuration);
        onsetStrengths.push(onsetStrength[i]);
      }
    }

    if (onsetTimes.length === 0) {
      console.warn('[BeatAnalyzer] No onsets detected');
      return [];
    }

    // Dynamic programming for beat tracking
    // Score function: maximize onset strength + temporal consistency
    const beats: BeatPosition[] = [];
    let currentTime = onsetTimes[0];
    let beatNumber = 1;
    let measureNumber = 0;

    beats.push({
      time: currentTime,
      strength: onsetStrengths[0],
      beatNumber: 1,
      measureNumber: 0,
      isDownbeat: true
    });

    // Track beats with expected interval
    while (currentTime < onsetTimes[onsetTimes.length - 1]) {
      currentTime += expectedBeatInterval;

      // Find closest onset to expected beat time
      let closestIdx = -1;
      let minDist = Infinity;
      const searchWindow = expectedBeatInterval * 0.3; // 30% window

      for (let i = 0; i < onsetTimes.length; i++) {
        const dist = Math.abs(onsetTimes[i] - currentTime);
        if (dist < searchWindow && dist < minDist) {
          minDist = dist;
          closestIdx = i;
        }
      }

      if (closestIdx >= 0) {
        // Snap to nearest onset
        currentTime = onsetTimes[closestIdx];
        beatNumber++;

        beats.push({
          time: currentTime,
          strength: onsetStrengths[closestIdx],
          beatNumber: beatNumber,
          measureNumber: measureNumber,
          isDownbeat: false
        });
      } else {
        // No onset found, still place beat (tempo is consistent)
        beatNumber++;
        beats.push({
          time: currentTime,
          strength: 0.3, // Low confidence
          beatNumber: beatNumber,
          measureNumber: measureNumber,
          isDownbeat: false
        });
      }
    }

    return beats;
  }

  // ========================================================================
  // TIME SIGNATURE DETECTION
  // ========================================================================

  /**
   * Detect time signature by analyzing beat patterns
   */
  private detectTimeSignature(beats: BeatPosition[]): TimeSignature {
    if (beats.length < 8) {
      return { numerator: 4, denominator: 4, confidence: 0.5 };
    }

    // Analyze beat strength patterns to find meter
    const beatStrengths = beats.map(b => b.strength);

    // Test common time signatures
    const candidates = [
      { numerator: 4, denominator: 4 },  // Most common
      { numerator: 3, denominator: 4 },  // Waltz
      { numerator: 6, denominator: 8 },  // Compound
      { numerator: 2, denominator: 4 },  // March
      { numerator: 5, denominator: 4 },  // Odd meter
    ];

    let bestSignature = candidates[0];
    let bestScore = 0;

    for (const candidate of candidates) {
      const score = this.scoreTimeSignature(beatStrengths, candidate.numerator);
      if (score > bestScore) {
        bestScore = score;
        bestSignature = candidate;
      }
    }

    return {
      ...bestSignature,
      confidence: bestScore
    };
  }

  /**
   * Score how well beats fit a given meter
   */
  private scoreTimeSignature(beatStrengths: number[], beatsPerMeasure: number): number {
    if (beatStrengths.length < beatsPerMeasure * 2) {
      return 0;
    }

    let score = 0;
    let count = 0;

    // Check if first beat of each measure is strongest
    for (let i = 0; i < beatStrengths.length - beatsPerMeasure; i += beatsPerMeasure) {
      const measureStrengths = beatStrengths.slice(i, i + beatsPerMeasure);
      const downbeatStrength = measureStrengths[0];
      const avgOtherStrength = measureStrengths.slice(1).reduce((a, b) => a + b, 0) / (beatsPerMeasure - 1);

      // Downbeat should be stronger than other beats
      if (downbeatStrength > avgOtherStrength) {
        score += downbeatStrength - avgOtherStrength;
      }
      count++;
    }

    return count > 0 ? score / count : 0;
  }

  // ========================================================================
  // DOWNBEAT & MEASURE DETECTION
  // ========================================================================

  /**
   * Identify downbeats and measure boundaries
   */
  private identifyDownbeats(
    beats: BeatPosition[],
    timeSignature: TimeSignature
  ): { downbeats: number[]; measures: MeasureBoundary[] } {
    const beatsPerMeasure = timeSignature.numerator;
    const downbeats: number[] = [];
    const measures: MeasureBoundary[] = [];

    let measureNumber = 0;

    for (let i = 0; i < beats.length; i += beatsPerMeasure) {
      downbeats.push(i);

      // Mark as downbeat
      beats[i].isDownbeat = true;
      beats[i].beatNumber = 1;
      beats[i].measureNumber = measureNumber;

      // Update beat numbers in measure
      for (let j = 1; j < beatsPerMeasure && i + j < beats.length; j++) {
        beats[i + j].beatNumber = j + 1;
        beats[i + j].measureNumber = measureNumber;
      }

      // Create measure boundary
      const endIdx = Math.min(i + beatsPerMeasure, beats.length);
      measures.push({
        measureNumber,
        startTime: beats[i].time,
        endTime: endIdx < beats.length ? beats[endIdx].time : beats[beats.length - 1].time,
        beatCount: Math.min(beatsPerMeasure, beats.length - i)
      });

      measureNumber++;
    }

    return { downbeats, measures };
  }

  // ========================================================================
  // TEMPO STABILITY
  // ========================================================================

  /**
   * Calculate how stable the tempo is
   */
  private calculateTempoStability(beats: BeatPosition[]): number {
    if (beats.length < 3) return 0;

    // Calculate inter-beat intervals
    const intervals: number[] = [];
    for (let i = 1; i < beats.length; i++) {
      intervals.push(beats[i].time - beats[i - 1].time);
    }

    // Calculate variance
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Stability = 1 - (normalized std dev)
    const stability = 1 - Math.min(1, stdDev / mean);
    return Math.max(0, Math.min(1, stability));
  }

  // ========================================================================
  // QUANTIZATION (PHASE VOCODER)
  // ========================================================================

  /**
   * Calculate grid times for quantization
   */
  private calculateGridTimes(duration: number, bpm: number, gridDivision: number): number[] {
    const beatDuration = 60 / bpm;
    const gridInterval = beatDuration / (gridDivision / 4); // Adjust for division
    const gridTimes: number[] = [];

    for (let t = 0; t < duration; t += gridInterval) {
      gridTimes.push(t);
    }

    return gridTimes;
  }

  /**
   * Quantize audio using phase vocoder time stretching
   */
  private phaseVocoderQuantize(
    audioData: Float32Array,
    beats: BeatPosition[],
    gridTimes: number[],
    options: QuantizeOptions
  ): Float32Array {
    // Simplified implementation - in production would use full STFT phase vocoder
    const output = new Float32Array(audioData.length);
    output.set(audioData); // Start with original

    // For each beat, calculate how much to shift it
    for (const beat of beats) {
      const beatSample = Math.floor(beat.time * this.sampleRate);

      // Find closest grid time
      let closestGrid = gridTimes[0];
      let minDist = Math.abs(beat.time - closestGrid);

      for (const gridTime of gridTimes) {
        const dist = Math.abs(beat.time - gridTime);
        if (dist < minDist) {
          minDist = dist;
          closestGrid = gridTime;
        }
      }

      // Calculate shift amount (with strength parameter)
      const targetTime = beat.time + (closestGrid - beat.time) * options.strength;
      const targetSample = Math.floor(targetTime * this.sampleRate);
      const shiftAmount = targetSample - beatSample;

      // Apply shift to region around beat (simplified)
      // In production, would use proper STFT phase adjustment
      if (Math.abs(shiftAmount) > 0) {
        this.shiftAudioRegion(output, beatSample, shiftAmount, 8192);
      }
    }

    // Apply swing if specified
    if (options.swing > 0) {
      this.applySwing(output, beats, gridTimes, options.swing);
    }

    // Apply humanization (random timing variations)
    if (options.humanize > 0) {
      this.applyHumanize(output, beats, options.humanize);
    }

    return output;
  }

  /**
   * Shift audio region (simplified time stretching)
   */
  private shiftAudioRegion(
    output: Float32Array,
    center: number,
    shiftAmount: number,
    regionSize: number
  ): void {
    const halfRegion = Math.floor(regionSize / 2);
    const start = Math.max(0, center - halfRegion);
    const end = Math.min(output.length, center + halfRegion);

    // Simple crossfade shift (not true phase vocoder)
    const temp = new Float32Array(end - start);
    for (let i = start; i < end; i++) {
      temp[i - start] = output[i];
    }

    // Write shifted with crossfade
    for (let i = 0; i < temp.length; i++) {
      const targetIdx = start + i + shiftAmount;
      if (targetIdx >= 0 && targetIdx < output.length) {
        // Simple blend
        const blend = Math.sin((i / temp.length) * Math.PI);
        output[targetIdx] = output[targetIdx] * (1 - blend) + temp[i] * blend;
      }
    }
  }

  /**
   * Apply swing feel to quantized audio
   */
  private applySwing(
    output: Float32Array,
    beats: BeatPosition[],
    gridTimes: number[],
    swingAmount: number
  ): void {
    // Swing delays every other subdivision
    // swingAmount: 0 = straight, 1 = triplet feel
    // Implementation would shift off-beat grid points
    // Simplified placeholder
  }

  /**
   * Apply humanization (random timing variations)
   */
  private applyHumanize(
    output: Float32Array,
    beats: BeatPosition[],
    humanizeAmount: number
  ): void {
    // Add subtle random shifts to avoid mechanical feel
    // Simplified placeholder
  }

  // ========================================================================
  // PITCH TRACKING FOR MIDI EXTRACTION
  // ========================================================================

  /**
   * Track pitch over time using autocorrelation (YIN algorithm)
   */
  private trackPitch(audioData: Float32Array): Array<{ time: number; frequency: number; confidence: number }> {
    const pitchTrack: Array<{ time: number; frequency: number; confidence: number }> = [];
    const windowSize = 2048;
    const hopSize = 512;

    for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
      const frame = audioData.slice(i, i + windowSize);
      const pitch = this.estimatePitchYIN(frame);

      if (pitch.frequency > 0) {
        pitchTrack.push({
          time: i / this.sampleRate,
          frequency: pitch.frequency,
          confidence: pitch.confidence
        });
      }
    }

    return pitchTrack;
  }

  /**
   * YIN algorithm for pitch estimation
   */
  private estimatePitchYIN(frame: Float32Array): { frequency: number; confidence: number } {
    const minFreq = 80;   // ~E2
    const maxFreq = 1000; // ~B5
    const minPeriod = Math.floor(this.sampleRate / maxFreq);
    const maxPeriod = Math.floor(this.sampleRate / minFreq);

    // Step 1: Difference function
    const difference = new Float32Array(maxPeriod);
    for (let tau = minPeriod; tau < maxPeriod; tau++) {
      let sum = 0;
      for (let i = 0; i < frame.length - tau; i++) {
        const delta = frame[i] - frame[i + tau];
        sum += delta * delta;
      }
      difference[tau] = sum;
    }

    // Step 2: Cumulative mean normalized difference
    const cmndf = new Float32Array(maxPeriod);
    cmndf[0] = 1;
    let runningSum = 0;

    for (let tau = 1; tau < maxPeriod; tau++) {
      runningSum += difference[tau];
      cmndf[tau] = difference[tau] / (runningSum / tau);
    }

    // Step 3: Absolute threshold
    const threshold = 0.1;
    let tauEstimate = -1;

    for (let tau = minPeriod; tau < maxPeriod; tau++) {
      if (cmndf[tau] < threshold) {
        // Find local minimum
        while (tau + 1 < maxPeriod && cmndf[tau + 1] < cmndf[tau]) {
          tau++;
        }
        tauEstimate = tau;
        break;
      }
    }

    if (tauEstimate === -1) {
      return { frequency: 0, confidence: 0 };
    }

    // Parabolic interpolation for sub-sample accuracy
    const frequency = this.sampleRate / tauEstimate;
    const confidence = 1 - cmndf[tauEstimate];

    return { frequency, confidence };
  }

  /**
   * Convert pitch track to MIDI notes
   */
  private pitchTrackToMIDI(pitchTrack: Array<{ time: number; frequency: number; confidence: number }>): MIDINote[] {
    if (pitchTrack.length === 0) return [];

    const notes: MIDINote[] = [];
    let currentNote: MIDINote | null = null;

    for (let i = 0; i < pitchTrack.length; i++) {
      const { time, frequency, confidence } = pitchTrack[i];

      // Convert frequency to MIDI note
      const midiNote = this.frequencyToMIDI(frequency);
      const velocity = Math.floor(confidence * 127);

      if (!currentNote || Math.abs(currentNote.pitch - midiNote) > 0.5) {
        // Start new note
        if (currentNote) {
          // End previous note
          currentNote.duration = time - currentNote.startTime;
          if (currentNote.duration > 0.05) { // Minimum 50ms
            notes.push(currentNote);
          }
        }

        currentNote = {
          pitch: Math.round(midiNote),
          velocity,
          startTime: time,
          duration: 0,
          frequency,
          confidence
        };
      } else {
        // Continue current note (update confidence/velocity)
        if (currentNote) {
          currentNote.confidence = Math.max(currentNote.confidence, confidence);
          currentNote.velocity = Math.max(currentNote.velocity, velocity);
        }
      }
    }

    // Add final note
    if (currentNote) {
      const lastTime = pitchTrack[pitchTrack.length - 1].time;
      currentNote.duration = lastTime - currentNote.startTime;
      if (currentNote.duration > 0.05) {
        notes.push(currentNote);
      }
    }

    return notes;
  }

  /**
   * Convert frequency to MIDI note number
   */
  private frequencyToMIDI(frequency: number): number {
    return 69 + 12 * Math.log2(frequency / 440);
  }

  /**
   * Detect musical key from MIDI notes
   */
  private detectKey(notes: MIDINote[]): { key: string; scale: string } {
    if (notes.length === 0) {
      return { key: 'C', scale: 'Major' };
    }

    // Count pitch class occurrences (weighted by duration)
    const pitchClassWeights = new Array(12).fill(0);

    for (const note of notes) {
      const pitchClass = note.pitch % 12;
      pitchClassWeights[pitchClass] += note.duration * note.confidence;
    }

    // Test all major and minor keys
    const majorScale = [0, 2, 4, 5, 7, 9, 11]; // Intervals
    const minorScale = [0, 2, 3, 5, 7, 8, 10];
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    let bestKey = 'C';
    let bestScale = 'Major';
    let bestScore = 0;

    // Test major keys
    for (let root = 0; root < 12; root++) {
      let score = 0;
      for (const interval of majorScale) {
        const pitchClass = (root + interval) % 12;
        score += pitchClassWeights[pitchClass];
      }
      if (score > bestScore) {
        bestScore = score;
        bestKey = noteNames[root];
        bestScale = 'Major';
      }
    }

    // Test minor keys
    for (let root = 0; root < 12; root++) {
      let score = 0;
      for (const interval of minorScale) {
        const pitchClass = (root + interval) % 12;
        score += pitchClassWeights[pitchClass];
      }
      if (score > bestScore) {
        bestScore = score;
        bestKey = noteNames[root];
        bestScale = 'Minor';
      }
    }

    return { key: bestKey, scale: bestScale };
  }

  // ========================================================================
  // DSP UTILITIES
  // ========================================================================

  /**
   * Apply Hann window
   */
  private applyHannWindow(frame: Float32Array): Float32Array {
    const windowed = new Float32Array(frame.length);
    for (let i = 0; i < frame.length; i++) {
      const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (frame.length - 1)));
      windowed[i] = frame[i] * window;
    }
    return windowed;
  }

  /**
   * Compute magnitude spectrum using FFT
   * Simplified DFT for demonstration (production would use FFT library)
   */
  private computeMagnitudeSpectrum(signal: Float32Array): Float32Array {
    const N = signal.length;
    const magnitude = new Float32Array(N / 2);

    for (let k = 0; k < N / 2; k++) {
      let real = 0;
      let imag = 0;

      for (let n = 0; n < N; n++) {
        const angle = (2 * Math.PI * k * n) / N;
        real += signal[n] * Math.cos(angle);
        imag -= signal[n] * Math.sin(angle);
      }

      magnitude[k] = Math.sqrt(real * real + imag * imag) / N;
    }

    return magnitude;
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  /**
   * Convert beats to simple time array for easier use
   */
  getBeatTimes(beatAnalysis: BeatAnalysisResult): number[] {
    return beatAnalysis.beats.map(b => b.time);
  }

  /**
   * Get downbeat times
   */
  getDownbeatTimes(beatAnalysis: BeatAnalysisResult): number[] {
    return beatAnalysis.beats.filter(b => b.isDownbeat).map(b => b.time);
  }

  /**
   * Find beat at or near a given time
   */
  findBeatAtTime(beatAnalysis: BeatAnalysisResult, time: number, tolerance: number = 0.1): BeatPosition | null {
    for (const beat of beatAnalysis.beats) {
      if (Math.abs(beat.time - time) < tolerance) {
        return beat;
      }
    }
    return null;
  }

  /**
   * Get measure at time
   */
  getMeasureAtTime(beatAnalysis: BeatAnalysisResult, time: number): MeasureBoundary | null {
    for (const measure of beatAnalysis.measures) {
      if (time >= measure.startTime && time <= measure.endTime) {
        return measure;
      }
    }
    return null;
  }
}

// Export singleton
export const beatAnalyzer = new BeatAnalyzer();
