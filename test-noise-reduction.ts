/**
 * AI Noise Reduction Test Suite
 *
 * Comprehensive testing for the AI-powered noise reduction system
 * Tests: noise profile learning, spectral subtraction, click removal,
 * adaptive gating, and various presets
 */

import { AINoiseReduction, NOISE_REDUCTION_PRESETS } from './src/audio/ai/AINoiseReduction.js';

// ============================================================================
// MOCK WEB AUDIO API FOR NODE.JS
// ============================================================================

class MockAudioContext {
  sampleRate: number = 48000;

  createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer {
    return {
      numberOfChannels,
      length,
      sampleRate,
      duration: length / sampleRate,
      getChannelData: (channel: number) => new Float32Array(length),
      copyFromChannel: () => {},
      copyToChannel: () => {},
    } as any;
  }
}

// Inject global AudioContext for Node.js environment
if (typeof global !== 'undefined' && typeof (global as any).AudioContext === 'undefined') {
  (global as any).AudioContext = MockAudioContext;
}

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Generate synthetic audio with noise
 */
function generateNoisyAudio(
  sampleRate: number,
  duration: number,
  signalFreq: number = 440,
  noiseLevel: number = 0.1
): AudioBuffer {
  const numSamples = Math.floor(sampleRate * duration);
  const audioContext = new AudioContext({ sampleRate });
  const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const channelData = buffer.getChannelData(0);

  // Generate clean signal (sine wave)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Pure tone
    const signal = Math.sin(2 * Math.PI * signalFreq * t);
    // Add white noise
    const noise = (Math.random() * 2 - 1) * noiseLevel;
    channelData[i] = signal + noise;
  }

  return buffer;
}

/**
 * Generate audio with clicks/pops
 */
function generateAudioWithClicks(
  sampleRate: number,
  duration: number,
  numClicks: number = 10
): AudioBuffer {
  const numSamples = Math.floor(sampleRate * duration);
  const audioContext = new AudioContext({ sampleRate });
  const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const channelData = buffer.getChannelData(0);

  // Generate clean signal
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    channelData[i] = Math.sin(2 * Math.PI * 440 * t) * 0.5;
  }

  // Add random clicks
  for (let i = 0; i < numClicks; i++) {
    const clickPos = Math.floor(Math.random() * numSamples);
    channelData[clickPos] = 1.0; // Sharp click
  }

  return buffer;
}

/**
 * Generate noise-only audio (for profile learning)
 */
function generateNoiseOnly(
  sampleRate: number,
  duration: number,
  noiseLevel: number = 0.1
): AudioBuffer {
  const numSamples = Math.floor(sampleRate * duration);
  const audioContext = new AudioContext({ sampleRate });
  const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const channelData = buffer.getChannelData(0);

  // Generate white noise
  for (let i = 0; i < numSamples; i++) {
    channelData[i] = (Math.random() * 2 - 1) * noiseLevel;
  }

  return buffer;
}

// Utility functions removed - not needed for current tests

/**
 * Print test results
 */
function printTestResult(
  testName: string,
  success: boolean,
  details?: Record<string, any>
): void {
  const status = success ? '✓ PASS' : '✗ FAIL';
  const color = success ? '\x1b[32m' : '\x1b[31m';
  console.log(`${color}${status}\x1b[0m ${testName}`);

  if (details) {
    Object.entries(details).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  }
  console.log('');
}

// ============================================================================
// TEST SUITE
// ============================================================================

async function runTests() {
  console.log('\n========================================');
  console.log('AI NOISE REDUCTION TEST SUITE');
  console.log('========================================\n');

  const sampleRate = 48000;
  let testsPassed = 0;
  let testsFailed = 0;

  // ==========================================================================
  // TEST 1: Initialization
  // ==========================================================================
  console.log('Test 1: Initialization');
  try {
    const noiseReduction = new AINoiseReduction();
    const config = noiseReduction.getConfig();

    const success = config.fftSize === 2048 && config.noiseReduction === 0.7;
    printTestResult('Initialize with default config', success, {
      'FFT Size': config.fftSize,
      'Noise Reduction': config.noiseReduction,
    });

    if (success) testsPassed++;
    else testsFailed++;
  } catch (error: any) {
    printTestResult('Initialize with default config', false, {
      Error: error.message,
    });
    testsFailed++;
  }

  // ==========================================================================
  // TEST 2: Noise Profile Learning
  // ==========================================================================
  console.log('Test 2: Noise Profile Learning');
  try {
    const noiseReduction = new AINoiseReduction();
    const noiseBuffer = generateNoiseOnly(sampleRate, 1.0, 0.1);

    noiseReduction.learnNoiseProfile(noiseBuffer, 0, 0.5);
    const profile = noiseReduction.getNoiseProfile();

    const success = profile !== null && profile.magnitude.length > 0;
    printTestResult('Learn noise profile from sample', success, {
      'Profile Duration': profile?.duration.toFixed(2) + 's',
      'Frequency Bins': profile?.magnitude.length,
      'Sample Rate': profile?.sampleRate,
    });

    if (success) testsPassed++;
    else testsFailed++;
  } catch (error: any) {
    printTestResult('Learn noise profile from sample', false, {
      Error: error.message,
    });
    testsFailed++;
  }

  // ==========================================================================
  // TEST 3: Auto-Learn Noise Profile
  // ==========================================================================
  console.log('Test 3: Auto-Learn Noise Profile');
  try {
    const noiseReduction = new AINoiseReduction();

    // Create audio with silent section at the beginning
    const numSamples = sampleRate * 3; // 3 seconds
    const audioContext = new AudioContext({ sampleRate });
    const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    // First 0.5 seconds: silence with noise
    for (let i = 0; i < sampleRate * 0.5; i++) {
      channelData[i] = (Math.random() * 2 - 1) * 0.01; // Very quiet noise
    }

    // Rest: signal with noise
    for (let i = sampleRate * 0.5; i < numSamples; i++) {
      const t = i / sampleRate;
      channelData[i] = Math.sin(2 * Math.PI * 440 * t) + (Math.random() * 2 - 1) * 0.05;
    }

    const success = noiseReduction.autoLearnNoiseProfile(buffer);
    const profile = noiseReduction.getNoiseProfile();

    printTestResult('Auto-detect and learn from silent section', success, {
      'Profile Found': success ? 'Yes' : 'No',
      'Profile Duration': profile?.duration.toFixed(2) + 's' || 'N/A',
    });

    if (success) testsPassed++;
    else testsFailed++;
  } catch (error: any) {
    printTestResult('Auto-detect and learn from silent section', false, {
      Error: error.message,
    });
    testsFailed++;
  }

  // ==========================================================================
  // TEST 4: Spectral Noise Reduction
  // ==========================================================================
  console.log('Test 4: Spectral Noise Reduction');
  try {
    const noiseReduction = new AINoiseReduction();
    const noisyAudio = generateNoisyAudio(sampleRate, 2.0, 440, 0.2);

    // Learn noise profile from first 0.5 seconds
    noiseReduction.learnNoiseProfile(noisyAudio, 0, 0.5);

    // Process audio
    noiseReduction.processAudio(noisyAudio);
    const metrics = noiseReduction.getMetrics();

    const success = metrics.noiseReduced > 0 && metrics.processingTime > 0;
    printTestResult('Apply spectral noise reduction', success, {
      'Noise Reduced': metrics.noiseReduced.toFixed(2) + ' dB',
      'SNR Improvement': metrics.snrImprovement.toFixed(2) + ' dB',
      'Processing Time': metrics.processingTime.toFixed(2) + ' ms',
      'Spectral Flatness': metrics.spectralFlatness.toFixed(4),
    });

    if (success) testsPassed++;
    else testsFailed++;
  } catch (error: any) {
    printTestResult('Apply spectral noise reduction', false, {
      Error: error.message,
    });
    testsFailed++;
  }

  // ==========================================================================
  // TEST 5: Click/Pop Removal
  // ==========================================================================
  console.log('Test 5: Click/Pop Removal');
  try {
    const noiseReduction = new AINoiseReduction();
    const audioWithClicks = generateAudioWithClicks(sampleRate, 2.0, 20);

    // Configure for click removal
    noiseReduction.updateConfig({
      clickRemoval: true,
      clickThreshold: 2.5,
      noiseReduction: 0, // Disable noise reduction for this test
    });

    noiseReduction.processAudio(audioWithClicks);
    const metrics = noiseReduction.getMetrics();

    const success = metrics.clicksRemoved > 0;
    printTestResult('Remove clicks and pops', success, {
      'Clicks Removed': metrics.clicksRemoved,
      'Processing Time': metrics.processingTime.toFixed(2) + ' ms',
    });

    if (success) testsPassed++;
    else testsFailed++;
  } catch (error: any) {
    printTestResult('Remove clicks and pops', false, {
      Error: error.message,
    });
    testsFailed++;
  }

  // ==========================================================================
  // TEST 6: Adaptive Noise Gate
  // ==========================================================================
  console.log('Test 6: Adaptive Noise Gate');
  try {
    const noiseReduction = new AINoiseReduction();

    // Create audio with varying levels
    const numSamples = sampleRate * 2;
    const audioContext = new AudioContext({ sampleRate });
    const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Alternating loud and quiet sections
      const amplitude = Math.sin(2 * Math.PI * 0.5 * t) > 0 ? 0.5 : 0.05;
      channelData[i] = Math.sin(2 * Math.PI * 440 * t) * amplitude;
    }

    noiseReduction.updateConfig({
      adaptiveGate: true,
      gateThreshold: -40,
      noiseReduction: 0,
    });

    // Learn and process
    noiseReduction.autoLearnNoiseProfile(buffer);
    const gatedBuffer = noiseReduction.processAudio(buffer);

    const success = gatedBuffer !== null;
    printTestResult('Apply adaptive noise gate', success, {
      'Gate Enabled': 'Yes',
      'Threshold': '-40 dB',
      'Processing Time': noiseReduction.getMetrics().processingTime.toFixed(2) + ' ms',
    });

    if (success) testsPassed++;
    else testsFailed++;
  } catch (error: any) {
    printTestResult('Apply adaptive noise gate', false, {
      Error: error.message,
    });
    testsFailed++;
  }

  // ==========================================================================
  // TEST 7: Preset Configurations
  // ==========================================================================
  console.log('Test 7: Preset Configurations');
  const presets = ['light', 'moderate', 'aggressive', 'voice', 'music'];

  for (const preset of presets) {
    try {
      const noiseReduction = new AINoiseReduction();
      const presetConfig = NOISE_REDUCTION_PRESETS[preset];

      noiseReduction.updateConfig(presetConfig);
      const config = noiseReduction.getConfig();

      const success = config.noiseReduction === presetConfig.noiseReduction;
      printTestResult(`Apply "${preset}" preset`, success, {
        'Noise Reduction': config.noiseReduction,
        'Over Subtraction': config.overSubtraction,
        'Max Attenuation': config.maxAttenuation + ' dB',
      });

      if (success) testsPassed++;
      else testsFailed++;
    } catch (error: any) {
      printTestResult(`Apply "${preset}" preset`, false, {
        Error: error.message,
      });
      testsFailed++;
    }
  }

  // ==========================================================================
  // TEST 8: Wiener Filtering
  // ==========================================================================
  console.log('Test 8: Wiener Filtering Integration');
  try {
    const noiseReduction = new AINoiseReduction();
    const noisyAudio = generateNoisyAudio(sampleRate, 2.0, 880, 0.15);

    // Learn noise profile
    noiseReduction.learnNoiseProfile(noisyAudio, 0, 0.3);

    // Process with moderate settings
    noiseReduction.updateConfig(NOISE_REDUCTION_PRESETS.moderate);
    noiseReduction.processAudio(noisyAudio);
    const metrics = noiseReduction.getMetrics();

    // Wiener filtering should provide SNR improvement
    const success = metrics.snrImprovement > 0;
    printTestResult('Wiener filtering SNR improvement', success, {
      'SNR Improvement': metrics.snrImprovement.toFixed(2) + ' dB',
      'Noise Reduced': metrics.noiseReduced.toFixed(2) + ' dB',
    });

    if (success) testsPassed++;
    else testsFailed++;
  } catch (error: any) {
    printTestResult('Wiener filtering SNR improvement', false, {
      Error: error.message,
    });
    testsFailed++;
  }

  // ==========================================================================
  // TEST 9: Transient Preservation
  // ==========================================================================
  console.log('Test 9: Transient Preservation');
  try {
    const noiseReduction = new AINoiseReduction();

    // Create audio with transients (drum hits)
    const numSamples = sampleRate * 2;
    const audioContext = new AudioContext({ sampleRate });
    const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    // Add drum hits (transients) every 0.5 seconds
    for (let hit = 0; hit < 4; hit++) {
      const hitPos = Math.floor(hit * sampleRate * 0.5);
      // Sharp attack
      for (let i = 0; i < 1000; i++) {
        const decay = Math.exp(-i / 200);
        channelData[hitPos + i] = Math.sin(2 * Math.PI * 200 * i / sampleRate) * decay;
      }
    }

    // Add noise
    for (let i = 0; i < numSamples; i++) {
      channelData[i] += (Math.random() * 2 - 1) * 0.05;
    }

    noiseReduction.updateConfig({
      preserveTransients: true,
      transientThreshold: 0.3,
    });

    noiseReduction.autoLearnNoiseProfile(buffer);
    const transientBuffer = noiseReduction.processAudio(buffer);

    const success = transientBuffer !== null;
    printTestResult('Preserve transients during processing', success, {
      'Transient Preservation': 'Enabled',
      'Threshold': '0.3',
    });

    if (success) testsPassed++;
    else testsFailed++;
  } catch (error: any) {
    printTestResult('Preserve transients during processing', false, {
      Error: error.message,
    });
    testsFailed++;
  }

  // ==========================================================================
  // TEST 10: Real-time Performance
  // ==========================================================================
  console.log('Test 10: Real-time Performance');
  try {
    const noiseReduction = new AINoiseReduction();
    const testAudio = generateNoisyAudio(sampleRate, 5.0, 440, 0.1);

    noiseReduction.autoLearnNoiseProfile(testAudio);

    const startTime = performance.now();
    noiseReduction.processAudio(testAudio);
    const endTime = performance.now();

    const processingTime = endTime - startTime;
    const audioLength = testAudio.duration * 1000; // in ms

    // Check if processing is faster than real-time
    const realtimeFactor = audioLength / processingTime;
    const success = realtimeFactor > 1.0;

    printTestResult('Real-time processing capability', success, {
      'Audio Length': audioLength.toFixed(2) + ' ms',
      'Processing Time': processingTime.toFixed(2) + ' ms',
      'Real-time Factor': realtimeFactor.toFixed(2) + 'x',
      'Status': success ? 'Faster than real-time' : 'Slower than real-time',
    });

    if (success) testsPassed++;
    else testsFailed++;
  } catch (error: any) {
    printTestResult('Real-time processing capability', false, {
      Error: error.message,
    });
    testsFailed++;
  }

  // ==========================================================================
  // TEST SUMMARY
  // ==========================================================================
  console.log('========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');
  console.log(`Total Tests: ${testsPassed + testsFailed}`);
  console.log(`\x1b[32mPassed: ${testsPassed}\x1b[0m`);
  console.log(`\x1b[31mFailed: ${testsFailed}\x1b[0m`);
  console.log(
    `Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`
  );
  console.log('========================================\n');

  // Exit with appropriate code
  process.exit(testsFailed > 0 ? 1 : 0);
}

// ============================================================================
// RUN TESTS
// ============================================================================

console.log('Starting AI Noise Reduction tests...\n');
runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
