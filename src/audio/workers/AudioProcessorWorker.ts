/**
 * Audio Processing Web Worker
 *
 * Offloads CPU-intensive audio analysis from the main thread to prevent UI blocking.
 * Handles pitch detection, spectral analysis, and performance calculations.
 */

import Pitchfinder from 'pitchfinder';

// Worker message types
export type WorkerRequest =
  | { type: 'DETECT_PITCH'; data: { audioData: Float32Array; sampleRate: number } }
  | { type: 'ANALYZE_SPECTRUM'; data: { audioData: Float32Array; sampleRate: number } }
  | { type: 'CALCULATE_PITCH_ACCURACY'; data: { audioData: Float32Array; sampleRate: number; targetFrequencies: number[] } }
  | { type: 'BATCH_PITCH_DETECTION'; data: { chunks: Float32Array[]; sampleRate: number } };

export type WorkerResponse =
  | { type: 'PITCH_DETECTED'; data: { frequency: number | null; confidence: number } }
  | { type: 'SPECTRUM_ANALYZED'; data: { spectrum: number[]; spectralCentroid: number; brightness: number } }
  | { type: 'ACCURACY_CALCULATED'; data: { accuracy: number; centsDeviation: number[] } }
  | { type: 'BATCH_COMPLETE'; data: { pitches: (number | null)[]; confidences: number[] } }
  | { type: 'ERROR'; error: string };

// Initialize pitch detector (YIN algorithm)
const detectPitch = Pitchfinder.YIN({ sampleRate: 44100 });

// FFT implementation (placeholder - will be replaced with real FFT library)
function calculateFFT(audioData: Float32Array): number[] {
  // Simple power spectrum approximation
  const fftSize = Math.min(2048, Math.pow(2, Math.floor(Math.log2(audioData.length))));
  const spectrum = new Array(fftSize / 2).fill(0);

  for (let i = 0; i < fftSize / 2; i++) {
    let real = 0;
    let imag = 0;

    for (let j = 0; j < fftSize; j++) {
      const angle = (2 * Math.PI * i * j) / fftSize;
      real += audioData[j] * Math.cos(angle);
      imag += audioData[j] * Math.sin(angle);
    }

    spectrum[i] = Math.sqrt(real * real + imag * imag) / fftSize;
  }

  return spectrum;
}

function calculateSpectralCentroid(spectrum: number[], sampleRate: number): number {
  let weightedSum = 0;
  let sum = 0;

  for (let i = 0; i < spectrum.length; i++) {
    const frequency = (i * sampleRate) / (spectrum.length * 2);
    weightedSum += frequency * spectrum[i];
    sum += spectrum[i];
  }

  return sum > 0 ? weightedSum / sum : 0;
}

function calculateBrightness(spectrum: number[], sampleRate: number): number {
  const cutoffIndex = Math.floor((2000 * spectrum.length * 2) / sampleRate);
  const highFreqEnergy = spectrum.slice(cutoffIndex).reduce((a, b) => a + b, 0);
  const totalEnergy = spectrum.reduce((a, b) => a + b, 0);

  return totalEnergy > 0 ? highFreqEnergy / totalEnergy : 0;
}

function frequencyToCents(freq1: number, freq2: number): number {
  if (freq1 <= 0 || freq2 <= 0) return 0;
  return 1200 * Math.log2(freq1 / freq2);
}

// Message handler
self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  try {
    switch (request.type) {
      case 'DETECT_PITCH': {
        const { audioData, sampleRate } = request.data;
        const pitchDetector = Pitchfinder.YIN({ sampleRate });
        const frequency = pitchDetector(audioData);

        // Calculate confidence based on signal clarity
        const rms = Math.sqrt(audioData.reduce((sum, val) => sum + val * val, 0) / audioData.length);
        const confidence = Math.min(rms * 10, 1); // Simple confidence metric

        const response: WorkerResponse = {
          type: 'PITCH_DETECTED',
          data: { frequency, confidence }
        };
        self.postMessage(response);
        break;
      }

      case 'ANALYZE_SPECTRUM': {
        const { audioData, sampleRate } = request.data;
        const spectrum = calculateFFT(audioData);
        const spectralCentroid = calculateSpectralCentroid(spectrum, sampleRate);
        const brightness = calculateBrightness(spectrum, sampleRate);

        const response: WorkerResponse = {
          type: 'SPECTRUM_ANALYZED',
          data: { spectrum, spectralCentroid, brightness }
        };
        self.postMessage(response);
        break;
      }

      case 'CALCULATE_PITCH_ACCURACY': {
        const { audioData, sampleRate, targetFrequencies } = request.data;
        const pitchDetector = Pitchfinder.YIN({ sampleRate });

        // Split audio into chunks matching target notes
        const chunkSize = Math.floor(audioData.length / targetFrequencies.length);
        const centsDeviations: number[] = [];
        let accuracySum = 0;

        for (let i = 0; i < targetFrequencies.length; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, audioData.length);
          const chunk = audioData.slice(start, end);

          const detectedFreq = pitchDetector(chunk);
          const targetFreq = targetFrequencies[i];

          if (detectedFreq && targetFreq) {
            const cents = frequencyToCents(detectedFreq, targetFreq);
            centsDeviations.push(cents);

            // Accuracy: 100% at 0 cents, decreases with deviation
            const noteAccuracy = Math.max(0, 100 - Math.abs(cents) / 2);
            accuracySum += noteAccuracy;
          } else {
            centsDeviations.push(0);
          }
        }

        const accuracy = targetFrequencies.length > 0 ? accuracySum / targetFrequencies.length : 0;

        const response: WorkerResponse = {
          type: 'ACCURACY_CALCULATED',
          data: { accuracy, centsDeviation: centsDeviations }
        };
        self.postMessage(response);
        break;
      }

      case 'BATCH_PITCH_DETECTION': {
        const { chunks, sampleRate } = request.data;
        const pitchDetector = Pitchfinder.YIN({ sampleRate });
        const pitches: (number | null)[] = [];
        const confidences: number[] = [];

        for (const chunk of chunks) {
          const frequency = pitchDetector(chunk);
          const rms = Math.sqrt(chunk.reduce((sum, val) => sum + val * val, 0) / chunk.length);

          pitches.push(frequency);
          confidences.push(Math.min(rms * 10, 1));
        }

        const response: WorkerResponse = {
          type: 'BATCH_COMPLETE',
          data: { pitches, confidences }
        };
        self.postMessage(response);
        break;
      }

      default:
        throw new Error(`Unknown request type: ${(request as any).type}`);
    }
  } catch (error) {
    const response: WorkerResponse = {
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    self.postMessage(response);
  }
});

// Signal worker is ready
self.postMessage({ type: 'READY' });
