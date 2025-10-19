/**
 * Audio Separation Service
 *
 * Real-time voice/music separation using spectral processing
 * Features:
 * - Spectral subtraction for voice isolation
 * - High-pass filtering for vocal range
 * - Amplitude-based gating
 * - Reference track subtraction
 * - Low latency processing (< 50ms)
 */

import { Socket } from 'socket.io';

export interface SeparationOptions {
  method: 'spectral' | 'gate' | 'highpass' | 'hybrid';
  threshold: number; // Gate threshold (0-1)
  highpassCutoff: number; // Hz (for vocal isolation)
  lowpassCutoff: number; // Hz (remove high noise)
  noiseReduction: number; // 0-1 (spectral subtraction strength)
}

export class AudioSeparationService {
  private sampleRate: number = 44100;
  private fftSize: number = 2048;
  private hopSize: number = 512; // 75% overlap for smooth reconstruction

  // Noise profile for spectral subtraction
  private noiseProfile: Float32Array | null = null;
  private readonly NOISE_PROFILE_DURATION = 1.0; // seconds

  /**
   * Separate vocals from backing track using spectral subtraction
   */
  public async separateVocals(
    mixedAudio: Float32Array,
    backingTrack: Float32Array | null,
    options: Partial<SeparationOptions> = {}
  ): Promise<Float32Array> {
    const opts: SeparationOptions = {
      method: 'hybrid',
      threshold: 0.1,
      highpassCutoff: 80, // Male vocals start ~80Hz
      lowpassCutoff: 15000, // Remove ultra-high noise
      noiseReduction: 0.5,
      ...options,
    };

    let result = new Float32Array(mixedAudio.length);
    mixedAudio.forEach((val, i) => (result[i] = val));

    // Apply processing chain based on method
    if (opts.method === 'highpass' || opts.method === 'hybrid') {
      result = this.applyHighPassFilter(result, opts.highpassCutoff);
      result = this.applyLowPassFilter(result, opts.lowpassCutoff);
    }

    if (opts.method === 'gate' || opts.method === 'hybrid') {
      result = this.applyNoiseGate(result, opts.threshold);
    }

    if (opts.method === 'spectral' || opts.method === 'hybrid') {
      if (backingTrack && backingTrack.length === mixedAudio.length) {
        result = await this.applySpectralSubtraction(result, backingTrack, opts.noiseReduction);
      } else if (this.noiseProfile) {
        result = await this.applySpectralDenoising(result, opts.noiseReduction);
      }
    }

    return result;
  }

  /**
   * Build noise profile from silence or backing track
   */
  public buildNoiseProfile(audioSample: Float32Array) {
    const numFrames = Math.floor((audioSample.length - this.fftSize) / this.hopSize);
    const magnitudeSum = new Float32Array(this.fftSize / 2 + 1);

    // Average magnitude spectrum across frames
    for (let frame = 0; frame < numFrames; frame++) {
      const offset = frame * this.hopSize;
      const frameData = audioSample.slice(offset, offset + this.fftSize);
      const spectrum = this.computeFFT(frameData);

      for (let i = 0; i < magnitudeSum.length; i++) {
        magnitudeSum[i] += spectrum[i];
      }
    }

    // Average
    for (let i = 0; i < magnitudeSum.length; i++) {
      magnitudeSum[i] /= numFrames;
    }

    this.noiseProfile = magnitudeSum;
    console.log('[AudioSeparation] Noise profile built from', numFrames, 'frames');
  }

  /**
   * Real-time separation stream
   */
  public startSeparationStream(
    socket: Socket,
    vocalStream: MediaStream,
    backingStream: MediaStream | null,
    options: {
      trackId: string;
      projectId: string;
      separationOptions?: Partial<SeparationOptions>;
    }
  ) {
    const audioContext = new AudioContext({ sampleRate: this.sampleRate });

    // Vocal input
    const vocalSource = audioContext.createMediaStreamSource(vocalStream);
    const vocalAnalyser = audioContext.createAnalyser();
    vocalAnalyser.fftSize = this.fftSize;
    vocalSource.connect(vocalAnalyser);

    // Backing track (if provided)
    let backingAnalyser: AnalyserNode | null = null;
    if (backingStream) {
      const backingSource = audioContext.createMediaStreamSource(backingStream);
      backingAnalyser = audioContext.createAnalyser();
      backingAnalyser.fftSize = this.fftSize;
      backingSource.connect(backingAnalyser);
    }

    const vocalBuffer = new Float32Array(vocalAnalyser.fftSize);
    const backingBuffer = backingAnalyser ? new Float32Array(backingAnalyser.fftSize) : null;

    // Process and send separated audio every 50ms (low latency)
    const interval = setInterval(async () => {
      vocalAnalyser.getFloatTimeDomainData(vocalBuffer);

      if (backingAnalyser && backingBuffer) {
        backingAnalyser.getFloatTimeDomainData(backingBuffer);
      }

      // Separate vocals
      const separatedVocals = await this.separateVocals(
        vocalBuffer,
        backingBuffer,
        options.separationOptions
      );

      // Send separated vocals to AI
      socket.emit('separated-vocals', {
        trackId: options.trackId,
        projectId: options.projectId,
        timestamp: Date.now(),
        audio: this.floatArrayToBase64(separatedVocals),
      });
    }, 50);

    // Cleanup
    socket.on('disconnect', () => {
      clearInterval(interval);
      audioContext.close();
    });

    return () => {
      clearInterval(interval);
      audioContext.close();
    };
  }

  // === FILTER IMPLEMENTATIONS ===

  /**
   * High-pass filter (remove low frequencies)
   */
  private applyHighPassFilter(audio: Float32Array, cutoffFreq: number): Float32Array {
    const rc = 1.0 / (2 * Math.PI * cutoffFreq);
    const dt = 1.0 / this.sampleRate;
    const alpha = rc / (rc + dt);

    const filtered = new Float32Array(audio.length);
    filtered[0] = audio[0];

    for (let i = 1; i < audio.length; i++) {
      filtered[i] = alpha * (filtered[i - 1] + audio[i] - audio[i - 1]);
    }

    return filtered;
  }

  /**
   * Low-pass filter (remove high frequencies)
   */
  private applyLowPassFilter(audio: Float32Array, cutoffFreq: number): Float32Array {
    const rc = 1.0 / (2 * Math.PI * cutoffFreq);
    const dt = 1.0 / this.sampleRate;
    const alpha = dt / (rc + dt);

    const filtered = new Float32Array(audio.length);
    filtered[0] = audio[0];

    for (let i = 1; i < audio.length; i++) {
      filtered[i] = filtered[i - 1] + alpha * (audio[i] - filtered[i - 1]);
    }

    return filtered;
  }

  /**
   * Noise gate (amplitude threshold)
   */
  private applyNoiseGate(audio: Float32Array, threshold: number): Float32Array {
    const gated = new Float32Array(audio.length);
    const windowSize = 256;

    for (let i = 0; i < audio.length; i += windowSize) {
      // Calculate RMS for window
      let sum = 0;
      const windowEnd = Math.min(i + windowSize, audio.length);
      for (let j = i; j < windowEnd; j++) {
        sum += audio[j] * audio[j];
      }
      const rms = Math.sqrt(sum / (windowEnd - i));

      // Apply gate
      const gain = rms > threshold ? 1.0 : 0.0;
      for (let j = i; j < windowEnd; j++) {
        gated[j] = audio[j] * gain;
      }
    }

    return gated;
  }

  /**
   * Spectral subtraction (remove known noise/backing track)
   */
  private async applySpectralSubtraction(
    signal: Float32Array,
    noise: Float32Array,
    strength: number
  ): Promise<Float32Array> {
    const numFrames = Math.floor((signal.length - this.fftSize) / this.hopSize);
    const output = new Float32Array(signal.length);

    for (let frame = 0; frame < numFrames; frame++) {
      const offset = frame * this.hopSize;

      // Get signal and noise frames
      const signalFrame = signal.slice(offset, offset + this.fftSize);
      const noiseFrame = noise.slice(offset, offset + this.fftSize);

      // Compute spectra
      const signalMag = this.computeFFT(signalFrame);
      const noiseMag = this.computeFFT(noiseFrame);

      // Subtract noise spectrum
      const cleanMag = new Float32Array(signalMag.length);
      for (let i = 0; i < signalMag.length; i++) {
        cleanMag[i] = Math.max(0, signalMag[i] - strength * noiseMag[i]);
      }

      // Inverse FFT (simplified - use original phase)
      const cleanFrame = this.inverseFFT(cleanMag, signalFrame);

      // Overlap-add
      for (let i = 0; i < cleanFrame.length && offset + i < output.length; i++) {
        output[offset + i] += cleanFrame[i];
      }
    }

    return output;
  }

  /**
   * Spectral denoising using noise profile
   */
  private async applySpectralDenoising(signal: Float32Array, strength: number): Promise<Float32Array> {
    if (!this.noiseProfile) {
      console.warn('[AudioSeparation] No noise profile - skipping denoising');
      return signal;
    }

    const numFrames = Math.floor((signal.length - this.fftSize) / this.hopSize);
    const output = new Float32Array(signal.length);

    for (let frame = 0; frame < numFrames; frame++) {
      const offset = frame * this.hopSize;
      const signalFrame = signal.slice(offset, offset + this.fftSize);
      const signalMag = this.computeFFT(signalFrame);

      // Subtract noise profile
      const cleanMag = new Float32Array(signalMag.length);
      for (let i = 0; i < signalMag.length; i++) {
        cleanMag[i] = Math.max(0, signalMag[i] - strength * this.noiseProfile[i]);
      }

      // Inverse FFT
      const cleanFrame = this.inverseFFT(cleanMag, signalFrame);

      // Overlap-add
      for (let i = 0; i < cleanFrame.length && offset + i < output.length; i++) {
        output[offset + i] += cleanFrame[i];
      }
    }

    return output;
  }

  // === UTILITY METHODS ===

  /**
   * Compute magnitude spectrum using FFT
   * Simplified for demonstration - in production, use a proper FFT library
   */
  private computeFFT(signal: Float32Array): Float32Array {
    const n = signal.length;
    const magnitude = new Float32Array(n / 2 + 1);

    // Simple DFT (inefficient but works for demonstration)
    for (let k = 0; k < magnitude.length; k++) {
      let real = 0;
      let imag = 0;
      for (let i = 0; i < n; i++) {
        const angle = (2 * Math.PI * k * i) / n;
        real += signal[i] * Math.cos(angle);
        imag -= signal[i] * Math.sin(angle);
      }
      magnitude[k] = Math.sqrt(real * real + imag * imag);
    }

    return magnitude;
  }

  /**
   * Inverse FFT (simplified - preserves original phase)
   */
  private inverseFFT(magnitude: Float32Array, originalSignal: Float32Array): Float32Array {
    // In production, would need proper IFFT with phase preservation
    // For now, scale original signal by magnitude ratio
    const n = originalSignal.length;
    const result = new Float32Array(n);

    const originalMag = this.computeFFT(originalSignal);
    const scale = magnitude.reduce((sum, m, i) => sum + m / (originalMag[i] || 1), 0) / magnitude.length;

    for (let i = 0; i < n; i++) {
      result[i] = originalSignal[i] * scale;
    }

    return result;
  }

  /**
   * Convert Float32Array to base64 for WebSocket transmission
   */
  private floatArrayToBase64(array: Float32Array): string {
    // Convert to Int16 PCM
    const int16 = new Int16Array(array.length);
    for (let i = 0; i < array.length; i++) {
      const s = Math.max(-1, Math.min(1, array[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // Convert to base64
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return Buffer.from(binary, 'binary').toString('base64');
  }
}

export const audioSeparationService = new AudioSeparationService();
