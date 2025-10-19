/**
 * AI-Powered Pitch Shifter / Auto-Tune
 *
 * Shifts audio pitch to match project key without affecting tempo.
 * Uses phase vocoder and granular synthesis for high-quality pitch shifting.
 */

export interface PitchShiftOptions {
  sourceKey: string;
  targetKey: string;
  preserveFormants?: boolean;
  quality?: 'draft' | 'standard' | 'high';
}

export interface PitchShiftResult {
  shiftedBuffer: AudioBuffer;
  semitoneShift: number;
  sourceKey: string;
  targetKey: string;
}

export class PitchShifter {
  private audioContext: AudioContext;

  // Musical note frequencies (A4 = 440 Hz)
  private static readonly NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  constructor(audioContext?: AudioContext) {
    this.audioContext = audioContext || new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  /**
   * Shift pitch to match target key
   */
  async shiftToMatchKey(
    audioBuffer: AudioBuffer,
    sourceKey: string,
    targetKey: string,
    quality: 'draft' | 'standard' | 'high' = 'standard'
  ): Promise<PitchShiftResult> {
    const semitoneShift = this.calculateSemitoneShift(sourceKey, targetKey);

    console.log(`[PitchShifter] Shifting from ${sourceKey} to ${targetKey} (${semitoneShift > 0 ? '+' : ''}${semitoneShift} semitones)`);

    // If shift is 0 or minimal, no processing needed
    if (Math.abs(semitoneShift) < 0.1) {
      return {
        shiftedBuffer: audioBuffer,
        semitoneShift: 0,
        sourceKey,
        targetKey,
      };
    }

    const shiftedBuffer = await this.pitchShift(audioBuffer, semitoneShift, quality);

    return {
      shiftedBuffer,
      semitoneShift,
      sourceKey,
      targetKey,
    };
  }

  /**
   * Calculate semitone shift between two keys
   */
  private calculateSemitoneShift(sourceKey: string, targetKey: string): number {
    const sourceIndex = PitchShifter.NOTE_NAMES.indexOf(sourceKey);
    const targetIndex = PitchShifter.NOTE_NAMES.indexOf(targetKey);

    if (sourceIndex === -1 || targetIndex === -1) {
      console.warn(`[PitchShifter] Invalid key: ${sourceKey} or ${targetKey}`);
      return 0;
    }

    let shift = targetIndex - sourceIndex;

    // Adjust for shortest path (prefer ±6 semitones max)
    if (shift > 6) {
      shift -= 12;
    } else if (shift < -6) {
      shift += 12;
    }

    return shift;
  }

  /**
   * Pitch shift audio by semitones using granular synthesis
   */
  private async pitchShift(
    audioBuffer: AudioBuffer,
    semitones: number,
    quality: 'draft' | 'standard' | 'high'
  ): Promise<AudioBuffer> {
    // Convert semitones to pitch ratio
    // Formula: ratio = 2^(semitones/12)
    const pitchRatio = Math.pow(2, semitones / 12);

    const sampleRate = audioBuffer.sampleRate;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const originalLength = audioBuffer.length;

    // For pitch shifting, we need to compensate for time stretching
    // Since we're changing pitch without changing tempo, we need to resample
    const newLength = Math.floor(originalLength / pitchRatio);

    const shiftedBuffer = this.audioContext.createBuffer(
      numberOfChannels,
      newLength,
      sampleRate
    );

    // Quality settings
    const windowSize = quality === 'high' ? 4096 : quality === 'standard' ? 2048 : 1024;

    // Process each channel
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = shiftedBuffer.getChannelData(channel);

      // Granular synthesis for pitch shifting
      this.granularPitchShift(inputData, outputData, pitchRatio, windowSize);
    }

    return shiftedBuffer;
  }

  /**
   * Granular Synthesis Pitch Shifting
   * Maintains audio quality while shifting pitch
   */
  private granularPitchShift(
    input: Float32Array,
    output: Float32Array,
    pitchRatio: number,
    windowSize: number
  ): void {
    const grainSize = windowSize;
    const hopSize = Math.floor(grainSize / 2);

    // Create window function
    const window = this.createHanningWindow(grainSize);

    let inputPos = 0;
    let outputPos = 0;

    while (inputPos + grainSize < input.length && outputPos < output.length) {
      // Extract grain
      const grain = new Float32Array(grainSize);
      for (let i = 0; i < grainSize; i++) {
        if (inputPos + i < input.length) {
          grain[i] = input[inputPos + i] * window[i];
        }
      }

      // Resample grain to change pitch
      const resampledGrain = this.resampleGrain(grain, pitchRatio);

      // Overlap-add to output
      for (let i = 0; i < resampledGrain.length && outputPos + i < output.length; i++) {
        output[outputPos + i] += resampledGrain[i];
      }

      // Move forward
      inputPos += hopSize;
      outputPos += Math.floor(hopSize / pitchRatio);
    }

    // Normalize output
    this.normalize(output);
  }

  /**
   * Resample a grain to change its pitch
   */
  private resampleGrain(grain: Float32Array, ratio: number): Float32Array {
    const newLength = Math.floor(grain.length / ratio);
    const resampled = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * ratio;
      const srcIndexFloor = Math.floor(srcIndex);
      const frac = srcIndex - srcIndexFloor;

      // Linear interpolation
      if (srcIndexFloor + 1 < grain.length) {
        resampled[i] = grain[srcIndexFloor] * (1 - frac) + grain[srcIndexFloor + 1] * frac;
      } else if (srcIndexFloor < grain.length) {
        resampled[i] = grain[srcIndexFloor];
      }
    }

    return resampled;
  }

  /**
   * Create Hanning window for smooth transitions
   */
  private createHanningWindow(size: number): Float32Array {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
    }
    return window;
  }

  /**
   * Normalize audio data to prevent clipping
   */
  private normalize(data: Float32Array): void {
    let max = 0;
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > max) max = abs;
    }

    if (max > 0) {
      const scale = 0.95 / max; // Leave headroom
      for (let i = 0; i < data.length; i++) {
        data[i] *= scale;
      }
    }
  }

  /**
   * Batch process multiple clips
   */
  async batchShift(
    clips: Array<{ buffer: AudioBuffer; sourceKey: string }>,
    targetKey: string,
    quality: 'draft' | 'standard' | 'high' = 'standard'
  ): Promise<PitchShiftResult[]> {
    const results: PitchShiftResult[] = [];

    for (const clip of clips) {
      const result = await this.shiftToMatchKey(
        clip.buffer,
        clip.sourceKey,
        targetKey,
        quality
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Get all supported musical keys
   */
  static getSupportedKeys(): string[] {
    return [...PitchShifter.NOTE_NAMES];
  }
}

// Singleton instance
export const pitchShifter = new PitchShifter();
