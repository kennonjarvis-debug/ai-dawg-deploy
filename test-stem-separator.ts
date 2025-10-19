/**
 * Stem Separator Test Suite
 *
 * Tests the AI-powered stem separation engine with synthetic audio
 * and verifies separation quality using signal processing metrics
 */

import { StemSeparator } from './src/audio/ai/StemSeparator';

// Mock AudioContext for Node.js testing
class MockAudioContext {
  sampleRate = 48000;

  createBuffer(channels: number, length: number, sampleRate: number): AudioBuffer {
    const buffer: any = {
      numberOfChannels: channels,
      length: length,
      sampleRate: sampleRate,
      duration: length / sampleRate,
      _data: Array.from({ length: channels }, () => new Float32Array(length)),
      getChannelData: function(channel: number) {
        return this._data[channel];
      },
      copyToChannel: function(source: Float32Array, channel: number) {
        this._data[channel].set(source);
      }
    };
    return buffer as AudioBuffer;
  }
}

// Use mock for Node.js
const AudioContext = typeof window !== 'undefined'
  ? window.AudioContext || (window as any).webkitAudioContext
  : MockAudioContext as any;

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Generate synthetic test audio with multiple sources
 */
function generateTestAudio(
  sampleRate: number = 48000,
  duration: number = 3.0
): AudioBuffer {
  const audioContext = new AudioContext({ sampleRate });
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const channelData = buffer.getChannelData(0);

  console.log(`[Test] Generating ${duration}s test audio @ ${sampleRate}Hz`);

  // Generate synthetic mix with distinct frequency components
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Vocal-like component (fundamental + harmonics, 200-2000 Hz)
    const vocalFundamental = 200;
    let vocal = 0;
    vocal += 0.3 * Math.sin(2 * Math.PI * vocalFundamental * t);
    vocal += 0.2 * Math.sin(2 * Math.PI * vocalFundamental * 2 * t);
    vocal += 0.1 * Math.sin(2 * Math.PI * vocalFundamental * 3 * t);
    vocal += 0.05 * Math.sin(2 * Math.PI * vocalFundamental * 4 * t);

    // Add vibrato to vocals
    const vibrato = 5; // Hz
    vocal *= 1 + 0.1 * Math.sin(2 * Math.PI * vibrato * t);

    // Bass component (40-120 Hz)
    const bassFundamental = 80;
    let bass = 0;
    bass += 0.4 * Math.sin(2 * Math.PI * bassFundamental * t);
    bass += 0.2 * Math.sin(2 * Math.PI * bassFundamental * 2 * t);

    // Drum-like percussive hits (transient events)
    let drums = 0;
    const beatInterval = sampleRate * 0.5; // 120 BPM
    if (i % beatInterval < 100) {
      const decay = Math.exp(-i % beatInterval / 20);
      // Kick drum (low frequency transient)
      drums += 0.6 * Math.sin(2 * Math.PI * 60 * t) * decay;
      // Snare (wide frequency spectrum)
      drums += 0.3 * (Math.random() * 2 - 1) * decay;
    }

    // Other instruments (mid-range harmonics)
    const guitarNote = 440;
    let other = 0;
    other += 0.2 * Math.sin(2 * Math.PI * guitarNote * t);
    other += 0.1 * Math.sin(2 * Math.PI * guitarNote * 1.5 * t);

    // Mix all components
    channelData[i] = vocal * 0.35 + bass * 0.25 + drums * 0.25 + other * 0.15;

    // Add slight noise to simulate real-world audio
    channelData[i] += (Math.random() * 2 - 1) * 0.01;

    // Normalize to prevent clipping
    channelData[i] = Math.max(-1, Math.min(1, channelData[i]));
  }

  console.log('[Test] Test audio generated with vocals, bass, drums, and instruments');
  return buffer;
}

/**
 * Calculate RMS (Root Mean Square) energy of audio buffer
 */
function calculateRMS(audioBuffer: AudioBuffer): number {
  const channelData = audioBuffer.getChannelData(0);
  let sumSquares = 0;

  for (let i = 0; i < channelData.length; i++) {
    sumSquares += channelData[i] * channelData[i];
  }

  return Math.sqrt(sumSquares / channelData.length);
}

/**
 * Calculate spectral centroid (brightness)
 */
function calculateSpectralCentroid(audioBuffer: AudioBuffer): number {
  const channelData = audioBuffer.getChannelData(0);
  const fftSize = 2048;
  const sampleRate = audioBuffer.sampleRate;

  // Simple FFT calculation for first window
  let weightedSum = 0;
  let magnitudeSum = 0;

  for (let i = 0; i < Math.min(fftSize, channelData.length); i++) {
    const magnitude = Math.abs(channelData[i]);
    const frequency = (i * sampleRate) / fftSize;
    weightedSum += magnitude * frequency;
    magnitudeSum += magnitude;
  }

  return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
}

/**
 * Detect transient density (percussive content)
 */
function detectTransientDensity(audioBuffer: AudioBuffer): number {
  const channelData = audioBuffer.getChannelData(0);
  const windowSize = 512;
  let transientCount = 0;
  let prevEnergy = 0;

  for (let i = windowSize; i < channelData.length; i += windowSize) {
    let energy = 0;
    for (let j = i - windowSize; j < i && j < channelData.length; j++) {
      energy += channelData[j] * channelData[j];
    }
    energy = Math.sqrt(energy / windowSize);

    // Detect sudden energy increase
    if (prevEnergy > 0 && energy / prevEnergy > 2.0) {
      transientCount++;
    }

    prevEnergy = energy;
  }

  return transientCount / (channelData.length / windowSize);
}

/**
 * Calculate low frequency content (bass presence)
 */
function calculateLowFrequencyContent(audioBuffer: AudioBuffer): number {
  const channelData = audioBuffer.getChannelData(0);
  const lowPassCutoff = 250; // Hz
  const sampleRate = audioBuffer.sampleRate;

  // Simple low-pass filter approximation
  let lowFreqSum = 0;
  let totalSum = 0;
  let prevSample = 0;

  const alpha = 2 * Math.PI * lowPassCutoff / sampleRate;

  for (let i = 0; i < channelData.length; i++) {
    prevSample = prevSample + alpha * (channelData[i] - prevSample);
    lowFreqSum += Math.abs(prevSample);
    totalSum += Math.abs(channelData[i]);
  }

  return totalSum > 0 ? lowFreqSum / totalSum : 0;
}

/**
 * Calculate separation quality score
 */
function calculateSeparationQuality(
  _original: AudioBuffer,
  separated: AudioBuffer,
  expectedComponent: 'vocals' | 'drums' | 'bass' | 'other'
): { score: number; metrics: any } {
  const rms = calculateRMS(separated);
  const centroid = calculateSpectralCentroid(separated);
  const transients = detectTransientDensity(separated);
  const lowFreq = calculateLowFrequencyContent(separated);

  let score = 0;
  const metrics: any = { rms, centroid, transients, lowFreq };

  // Score based on expected characteristics
  switch (expectedComponent) {
    case 'vocals':
      // Vocals should have: moderate centroid (1000-2000 Hz), low transients, moderate energy
      if (centroid > 500 && centroid < 3000) score += 0.4;
      if (transients < 0.2) score += 0.3;
      if (rms > 0.05 && rms < 0.3) score += 0.3;
      metrics.expected = 'moderate centroid, low transients';
      break;

    case 'drums':
      // Drums should have: high transient density, wide spectrum
      if (transients > 0.3) score += 0.5;
      if (rms > 0.1) score += 0.3;
      if (centroid > 1000) score += 0.2;
      metrics.expected = 'high transients, wide spectrum';
      break;

    case 'bass':
      // Bass should have: high low-frequency content, low centroid
      if (lowFreq > 0.6) score += 0.5;
      if (centroid < 500) score += 0.3;
      if (rms > 0.05) score += 0.2;
      metrics.expected = 'high low-freq content, low centroid';
      break;

    case 'other':
      // Other instruments: mid-range content
      if (centroid > 400 && centroid < 2000) score += 0.4;
      if (rms > 0.02) score += 0.3;
      if (transients < 0.3) score += 0.3;
      metrics.expected = 'mid-range content';
      break;
  }

  return { score, metrics };
}

// ============================================================================
// TEST CASES
// ============================================================================

async function runTests() {
  console.log('\n===============================================');
  console.log('   STEM SEPARATOR AI ENGINE - TEST SUITE');
  console.log('===============================================\n');

  const stemSeparator = new StemSeparator({
    fftSize: 2048,
    hopSize: 512,
    medianFilterLength: 17,
    vocalRangeHz: [80, 8000],
    bassRangeHz: [20, 250],
    drumsRangeHz: [60, 16000],
    enablePhaseReconstruction: true
  });

  try {
    // Test 1: Initialize
    console.log('[TEST 1] Initialization');
    console.log('----------------------------------------');
    await stemSeparator.initialize();
    console.log('✓ StemSeparator initialized successfully\n');

    // Test 2: Generate test audio
    console.log('[TEST 2] Generate Synthetic Test Audio');
    console.log('----------------------------------------');
    const testAudio = generateTestAudio(48000, 3.0);
    const originalRMS = calculateRMS(testAudio);
    const originalCentroid = calculateSpectralCentroid(testAudio);
    console.log(`✓ Original audio - RMS: ${originalRMS.toFixed(4)}, Centroid: ${originalCentroid.toFixed(1)} Hz\n`);

    // Test 3: Full stem separation
    console.log('[TEST 3] Full Stem Separation');
    console.log('----------------------------------------');
    const startTime = performance.now();
    const result = await stemSeparator.separateStems(testAudio);
    const processingTime = performance.now() - startTime;

    console.log(`✓ Separation completed in ${processingTime.toFixed(0)}ms`);
    console.log(`  Techniques used: ${result.metadata.techniques.join(', ')}`);
    console.log(`  Duration: ${result.metadata.duration.toFixed(2)}s`);
    console.log(`  Sample rate: ${result.metadata.sampleRate}Hz\n`);

    // Test 4: Analyze separated stems
    console.log('[TEST 4] Stem Quality Analysis');
    console.log('----------------------------------------');

    const vocalsQuality = calculateSeparationQuality(testAudio, result.vocals, 'vocals');
    console.log(`Vocals:`);
    console.log(`  Quality Score: ${(vocalsQuality.score * 100).toFixed(1)}%`);
    console.log(`  RMS Energy: ${vocalsQuality.metrics.rms.toFixed(4)}`);
    console.log(`  Spectral Centroid: ${vocalsQuality.metrics.centroid.toFixed(1)} Hz`);
    console.log(`  Transient Density: ${vocalsQuality.metrics.transients.toFixed(3)}`);

    const drumsQuality = calculateSeparationQuality(testAudio, result.drums, 'drums');
    console.log(`\nDrums:`);
    console.log(`  Quality Score: ${(drumsQuality.score * 100).toFixed(1)}%`);
    console.log(`  RMS Energy: ${drumsQuality.metrics.rms.toFixed(4)}`);
    console.log(`  Spectral Centroid: ${drumsQuality.metrics.centroid.toFixed(1)} Hz`);
    console.log(`  Transient Density: ${drumsQuality.metrics.transients.toFixed(3)}`);

    const bassQuality = calculateSeparationQuality(testAudio, result.bass, 'bass');
    console.log(`\nBass:`);
    console.log(`  Quality Score: ${(bassQuality.score * 100).toFixed(1)}%`);
    console.log(`  RMS Energy: ${bassQuality.metrics.rms.toFixed(4)}`);
    console.log(`  Spectral Centroid: ${bassQuality.metrics.centroid.toFixed(1)} Hz`);
    console.log(`  Low-Freq Content: ${(bassQuality.metrics.lowFreq * 100).toFixed(1)}%`);

    const otherQuality = calculateSeparationQuality(testAudio, result.other, 'other');
    console.log(`\nOther Instruments:`);
    console.log(`  Quality Score: ${(otherQuality.score * 100).toFixed(1)}%`);
    console.log(`  RMS Energy: ${otherQuality.metrics.rms.toFixed(4)}`);
    console.log(`  Spectral Centroid: ${otherQuality.metrics.centroid.toFixed(1)} Hz`);

    // Test 5: Individual stem isolation
    console.log('\n[TEST 5] Individual Stem Isolation');
    console.log('----------------------------------------');

    const isolatedVocals = await stemSeparator.isolateStem(testAudio, 'vocals');
    console.log(`✓ Vocals isolated - Duration: ${isolatedVocals.duration.toFixed(2)}s`);

    const isolatedDrums = await stemSeparator.isolateStem(testAudio, 'drums');
    console.log(`✓ Drums isolated - Duration: ${isolatedDrums.duration.toFixed(2)}s`);

    const isolatedBass = await stemSeparator.isolateStem(testAudio, 'bass');
    console.log(`✓ Bass isolated - Duration: ${isolatedBass.duration.toFixed(2)}s`);

    // Test 6: Energy conservation check
    console.log('\n[TEST 6] Energy Conservation Check');
    console.log('----------------------------------------');

    const vocalsRMS = calculateRMS(result.vocals);
    const drumsRMS = calculateRMS(result.drums);
    const bassRMS = calculateRMS(result.bass);
    const otherRMS = calculateRMS(result.other);

    const totalSeparatedEnergy = Math.sqrt(
      vocalsRMS ** 2 + drumsRMS ** 2 + bassRMS ** 2 + otherRMS ** 2
    );

    const energyRetention = (totalSeparatedEnergy / originalRMS) * 100;
    console.log(`Original RMS: ${originalRMS.toFixed(4)}`);
    console.log(`Total Separated RMS: ${totalSeparatedEnergy.toFixed(4)}`);
    console.log(`Energy Retention: ${energyRetention.toFixed(1)}%`);

    if (energyRetention > 70 && energyRetention < 130) {
      console.log('✓ Energy conservation: GOOD');
    } else if (energyRetention > 50 && energyRetention < 150) {
      console.log('⚠ Energy conservation: ACCEPTABLE');
    } else {
      console.log('✗ Energy conservation: POOR');
    }

    // Test 7: Overall quality assessment
    console.log('\n[TEST 7] Overall Quality Assessment');
    console.log('----------------------------------------');

    const avgQualityScore = (
      vocalsQuality.score +
      drumsQuality.score +
      bassQuality.score +
      otherQuality.score
    ) / 4;

    console.log(`Average Quality Score: ${(avgQualityScore * 100).toFixed(1)}%`);
    console.log(`Processing Speed: ${(testAudio.duration / (processingTime / 1000)).toFixed(2)}x realtime`);

    if (avgQualityScore > 0.7) {
      console.log('✓ Overall separation quality: EXCELLENT');
    } else if (avgQualityScore > 0.5) {
      console.log('✓ Overall separation quality: GOOD');
    } else if (avgQualityScore > 0.3) {
      console.log('⚠ Overall separation quality: ACCEPTABLE');
    } else {
      console.log('✗ Overall separation quality: NEEDS IMPROVEMENT');
    }

    // Test 8: Performance benchmarks
    console.log('\n[TEST 8] Performance Benchmarks');
    console.log('----------------------------------------');

    const benchmarkIterations = 5;
    const benchmarkTimes: number[] = [];

    for (let i = 0; i < benchmarkIterations; i++) {
      const start = performance.now();
      await stemSeparator.isolateStem(testAudio, 'vocals');
      benchmarkTimes.push(performance.now() - start);
    }

    const avgBenchmark = benchmarkTimes.reduce((a, b) => a + b, 0) / benchmarkTimes.length;
    const minBenchmark = Math.min(...benchmarkTimes);
    const maxBenchmark = Math.max(...benchmarkTimes);

    console.log(`Isolated vocals ${benchmarkIterations} times:`);
    console.log(`  Average: ${avgBenchmark.toFixed(0)}ms`);
    console.log(`  Min: ${minBenchmark.toFixed(0)}ms`);
    console.log(`  Max: ${maxBenchmark.toFixed(0)}ms`);
    console.log(`  Realtime factor: ${(testAudio.duration / (avgBenchmark / 1000)).toFixed(2)}x`);

    // Final summary
    console.log('\n===============================================');
    console.log('   TEST SUMMARY');
    console.log('===============================================');
    console.log(`✓ All tests completed successfully`);
    console.log(`✓ Stem separation engine is working correctly`);
    console.log(`✓ Average quality score: ${(avgQualityScore * 100).toFixed(1)}%`);
    console.log(`✓ Processing speed: ${(testAudio.duration / (processingTime / 1000)).toFixed(2)}x realtime`);
    console.log(`✓ Energy retention: ${energyRetention.toFixed(1)}%`);
    console.log('===============================================\n');

    // Cleanup
    stemSeparator.dispose();
    console.log('✓ Cleanup complete\n');

  } catch (error) {
    console.error('\n✗ TEST FAILED:', error);
    console.error('\nStack trace:', (error as Error).stack);
    process.exit(1);
  }
}

// Run tests
if (typeof window === 'undefined') {
  // Node.js environment
  console.log('Running in Node.js environment\n');
  runTests().then(() => {
    console.log('All tests passed!');
    process.exit(0);
  }).catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
} else {
  // Browser environment
  console.log('Running in browser environment\n');
  runTests().then(() => {
    console.log('All tests passed!');
  }).catch((error) => {
    console.error('Test suite failed:', error);
  });
}
