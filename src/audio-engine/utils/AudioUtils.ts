/**
 * Audio Utilities - Time-stretching, pitch-shifting, quantization
 */

export class AudioUtils {
  /**
   * Quantize MIDI notes to grid
   * @param position - Current position in samples
   * @param gridSize - Grid size in samples (e.g., 16th note)
   * @param strength - Quantization strength 0.0 to 1.0
   */
  static quantizeToGrid(position: number, gridSize: number, strength: number = 1.0): number {
    const nearestGrid = Math.round(position / gridSize) * gridSize;
    return position + (nearestGrid - position) * strength;
  }

  /**
   * Simple pitch shift using resampling
   * @param buffer - Input audio buffer
   * @param semitones - Pitch shift in semitones (-12 to +12)
   */
  static pitchShift(buffer: Float32Array[], semitones: number): Float32Array[] {
    const ratio = Math.pow(2, semitones / 12);
    const outputLength = Math.floor(buffer[0].length / ratio);
    const output: Float32Array[] = [];

    for (let ch = 0; ch < buffer.length; ch++) {
      const channelOutput = new Float32Array(outputLength);

      for (let i = 0; i < outputLength; i++) {
        const srcIndex = i * ratio;
        const srcIndexInt = Math.floor(srcIndex);
        const fraction = srcIndex - srcIndexInt;

        if (srcIndexInt + 1 < buffer[ch].length) {
          // Linear interpolation
          channelOutput[i] =
            buffer[ch][srcIndexInt] * (1 - fraction) +
            buffer[ch][srcIndexInt + 1] * fraction;
        } else {
          channelOutput[i] = buffer[ch][srcIndexInt];
        }
      }

      output.push(channelOutput);
    }

    return output;
  }

  /**
   * Time stretch using simple overlap-add method
   * @param buffer - Input audio buffer
   * @param stretchFactor - Time stretch factor (0.5 = half speed, 2.0 = double speed)
   */
  static timeStretch(buffer: Float32Array[], stretchFactor: number): Float32Array[] {
    const windowSize = 2048;
    const hopSize = Math.floor(windowSize / 4);
    const outputLength = Math.floor(buffer[0].length * stretchFactor);
    const output: Float32Array[] = [];

    for (let ch = 0; ch < buffer.length; ch++) {
      const channelOutput = new Float32Array(outputLength);
      const inputBuffer = buffer[ch];

      let writePos = 0;

      for (let readPos = 0; readPos < inputBuffer.length - windowSize; readPos += hopSize) {
        const outputHop = Math.floor(hopSize * stretchFactor);

        // Apply Hann window and overlap-add
        for (let i = 0; i < windowSize && writePos + i < outputLength; i++) {
          const hannWindow = 0.5 * (1 - Math.cos((2 * Math.PI * i) / windowSize));
          const sample = inputBuffer[readPos + i] * hannWindow;

          if (writePos + i < outputLength) {
            channelOutput[writePos + i] += sample;
          }
        }

        writePos += outputHop;
      }

      // Normalize
      const maxVal = Math.max(...channelOutput.map(Math.abs));
      if (maxVal > 0) {
        for (let i = 0; i < channelOutput.length; i++) {
          channelOutput[i] /= maxVal;
        }
      }

      output.push(channelOutput);
    }

    return output;
  }

  /**
   * Normalize audio buffer to peak level
   * @param buffer - Input audio buffer
   * @param targetPeak - Target peak level (0.0 to 1.0)
   */
  static normalize(buffer: Float32Array[], targetPeak: number = 1.0): Float32Array[] {
    let maxPeak = 0;

    // Find max peak across all channels
    for (const channel of buffer) {
      for (const sample of channel) {
        maxPeak = Math.max(maxPeak, Math.abs(sample));
      }
    }

    if (maxPeak === 0) return buffer;

    const gain = targetPeak / maxPeak;
    const output: Float32Array[] = [];

    // Apply gain to all channels
    for (const channel of buffer) {
      const normalized = new Float32Array(channel.length);
      for (let i = 0; i < channel.length; i++) {
        normalized[i] = channel[i] * gain;
      }
      output.push(normalized);
    }

    return output;
  }

  /**
   * Fade in audio buffer
   * @param buffer - Input audio buffer
   * @param fadeLength - Fade length in samples
   */
  static fadeIn(buffer: Float32Array[], fadeLength: number): Float32Array[] {
    const output: Float32Array[] = [];

    for (const channel of buffer) {
      const fadedChannel = new Float32Array(channel);
      const actualFadeLength = Math.min(fadeLength, channel.length);

      for (let i = 0; i < actualFadeLength; i++) {
        const gain = i / actualFadeLength;
        fadedChannel[i] *= gain;
      }

      output.push(fadedChannel);
    }

    return output;
  }

  /**
   * Fade out audio buffer
   * @param buffer - Input audio buffer
   * @param fadeLength - Fade length in samples
   */
  static fadeOut(buffer: Float32Array[], fadeLength: number): Float32Array[] {
    const output: Float32Array[] = [];

    for (const channel of buffer) {
      const fadedChannel = new Float32Array(channel);
      const actualFadeLength = Math.min(fadeLength, channel.length);
      const startPos = channel.length - actualFadeLength;

      for (let i = 0; i < actualFadeLength; i++) {
        const gain = 1 - i / actualFadeLength;
        fadedChannel[startPos + i] *= gain;
      }

      output.push(fadedChannel);
    }

    return output;
  }

  /**
   * Mix two audio buffers
   * @param buffer1 - First buffer
   * @param buffer2 - Second buffer
   * @param ratio - Mix ratio (0.0 = all buffer1, 1.0 = all buffer2)
   */
  static mix(buffer1: Float32Array[], buffer2: Float32Array[], ratio: number = 0.5): Float32Array[] {
    const channels = Math.max(buffer1.length, buffer2.length);
    const length = Math.max(buffer1[0]?.length || 0, buffer2[0]?.length || 0);
    const output: Float32Array[] = [];

    for (let ch = 0; ch < channels; ch++) {
      const mixed = new Float32Array(length);
      const chan1 = buffer1[ch] || new Float32Array(length);
      const chan2 = buffer2[ch] || new Float32Array(length);

      for (let i = 0; i < length; i++) {
        mixed[i] = chan1[i] * (1 - ratio) + chan2[i] * ratio;
      }

      output.push(mixed);
    }

    return output;
  }

  /**
   * Convert BPM and beat position to sample position
   * @param bpm - Tempo in beats per minute
   * @param beat - Beat position
   * @param sampleRate - Sample rate
   */
  static beatToSamples(bpm: number, beat: number, sampleRate: number): number {
    const secondsPerBeat = 60 / bpm;
    return Math.floor(beat * secondsPerBeat * sampleRate);
  }

  /**
   * Convert sample position to beat position
   * @param samples - Sample position
   * @param bpm - Tempo in beats per minute
   * @param sampleRate - Sample rate
   */
  static samplesToBeat(samples: number, bpm: number, sampleRate: number): number {
    const secondsPerBeat = 60 / bpm;
    const seconds = samples / sampleRate;
    return seconds / secondsPerBeat;
  }

  /**
   * Apply simple compression to audio
   * @param buffer - Input audio buffer
   * @param threshold - Compression threshold (0.0 to 1.0)
   * @param ratio - Compression ratio
   */
  static compress(buffer: Float32Array[], threshold: number, ratio: number): Float32Array[] {
    const output: Float32Array[] = [];

    for (const channel of buffer) {
      const compressed = new Float32Array(channel.length);

      for (let i = 0; i < channel.length; i++) {
        const sample = channel[i];
        const absSample = Math.abs(sample);

        if (absSample > threshold) {
          const excess = absSample - threshold;
          const compressed_excess = excess / ratio;
          const sign = sample >= 0 ? 1 : -1;
          compressed[i] = sign * (threshold + compressed_excess);
        } else {
          compressed[i] = sample;
        }
      }

      output.push(compressed);
    }

    return output;
  }
}
