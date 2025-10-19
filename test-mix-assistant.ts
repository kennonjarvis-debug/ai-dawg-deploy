/**
 * Test Script for Smart Mix Assistant
 *
 * Tests multi-track analysis, conflict detection, and recommendations
 */

import { SmartMixAssistant, type TrackAudioData } from './src/audio/ai/SmartMixAssistant';

// ============================================================================
// TEST DATA GENERATION
// ============================================================================

/**
 * Generate synthetic audio buffer for testing
 */
function generateTestAudioBuffer(
  frequency: number,
  duration: number = 2,
  sampleRate: number = 48000,
  amplitude: number = 0.5
): AudioBuffer {
  const numSamples = Math.floor(duration * sampleRate);

  // Create AudioBuffer using Web Audio API compatible structure
  const buffer: any = {
    numberOfChannels: 2,
    length: numSamples,
    sampleRate: sampleRate,
    duration: duration,
    channelData: [new Float32Array(numSamples), new Float32Array(numSamples)],

    getChannelData(channel: number): Float32Array {
      return this.channelData[channel];
    }
  };

  // Generate sine wave
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const value = amplitude * Math.sin(2 * Math.PI * frequency * t);
    buffer.channelData[0][i] = value;
    buffer.channelData[1][i] = value;
  }

  return buffer as AudioBuffer;
}

/**
 * Generate complex multi-frequency audio (simulates real instruments)
 */
function generateComplexAudio(
  fundamentalFreq: number,
  harmonics: number[] = [2, 3, 4, 5],
  duration: number = 2,
  sampleRate: number = 48000,
  amplitude: number = 0.5
): AudioBuffer {
  const numSamples = Math.floor(duration * sampleRate);

  const buffer: any = {
    numberOfChannels: 2,
    length: numSamples,
    sampleRate: sampleRate,
    duration: duration,
    channelData: [new Float32Array(numSamples), new Float32Array(numSamples)],

    getChannelData(channel: number): Float32Array {
      return this.channelData[channel];
    }
  };

  // Generate complex wave with harmonics
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let value = amplitude * Math.sin(2 * Math.PI * fundamentalFreq * t); // Fundamental

    // Add harmonics with decreasing amplitude
    harmonics.forEach((harmonic, index) => {
      const harmonicAmplitude = amplitude / (index + 2);
      value += harmonicAmplitude * Math.sin(2 * Math.PI * fundamentalFreq * harmonic * t);
    });

    // Normalize
    value = value / (harmonics.length + 1);

    buffer.channelData[0][i] = value;
    buffer.channelData[1][i] = value;
  }

  return buffer as AudioBuffer;
}

/**
 * Generate drum-like transient audio
 */
function generateDrumAudio(
  frequency: number = 80,
  duration: number = 2,
  sampleRate: number = 48000
): AudioBuffer {
  const numSamples = Math.floor(duration * sampleRate);

  const buffer: any = {
    numberOfChannels: 2,
    length: numSamples,
    sampleRate: sampleRate,
    duration: duration,
    channelData: [new Float32Array(numSamples), new Float32Array(numSamples)],

    getChannelData(channel: number): Float32Array {
      return this.channelData[channel];
    }
  };

  // Generate kick drum pattern (every 0.5 seconds)
  const kickInterval = Math.floor(0.5 * sampleRate);

  for (let kickStart = 0; kickStart < numSamples; kickStart += kickInterval) {
    const kickLength = Math.floor(0.1 * sampleRate);

    for (let i = 0; i < kickLength && (kickStart + i) < numSamples; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-10 * t); // Fast decay
      const value = envelope * Math.sin(2 * Math.PI * frequency * t);

      buffer.channelData[0][kickStart + i] += value * 0.8;
      buffer.channelData[1][kickStart + i] += value * 0.8;
    }
  }

  return buffer as AudioBuffer;
}

// ============================================================================
// CREATE TEST TRACKS
// ============================================================================

console.log('=== SMART MIX ASSISTANT TEST ===\n');
console.log('Generating test tracks...\n');

// Create a realistic multi-track mix scenario
const testTracks: TrackAudioData[] = [
  {
    trackId: 'track-1',
    trackName: 'Lead Vocal',
    audioBuffer: generateComplexAudio(220, [2, 3, 4], 2, 48000, 0.6), // A3 (220 Hz)
    category: 'vocal',
    currentLevel: 0,
    currentPan: 0
  },
  {
    trackId: 'track-2',
    trackName: 'Drums',
    audioBuffer: generateDrumAudio(80, 2, 48000),
    category: 'drums',
    currentLevel: -3,
    currentPan: 0
  },
  {
    trackId: 'track-3',
    trackName: 'Bass',
    audioBuffer: generateComplexAudio(110, [2, 3], 2, 48000, 0.7), // A2 (110 Hz)
    category: 'bass',
    currentLevel: -6,
    currentPan: 0
  },
  {
    trackId: 'track-4',
    trackName: 'Guitar 1',
    audioBuffer: generateComplexAudio(330, [2, 3, 4, 5], 2, 48000, 0.5), // E4
    category: 'guitar',
    currentLevel: -9,
    currentPan: -30
  },
  {
    trackId: 'track-5',
    trackName: 'Guitar 2',
    audioBuffer: generateComplexAudio(350, [2, 3, 4, 5], 2, 48000, 0.5), // F4
    category: 'guitar',
    currentLevel: -9,
    currentPan: 30
  },
  {
    trackId: 'track-6',
    trackName: 'Synth Pad',
    audioBuffer: generateComplexAudio(220, [2, 3, 4, 5, 6], 2, 48000, 0.4), // A3 (conflicts with vocal!)
    category: 'synth',
    currentLevel: -12,
    currentPan: 0
  },
  {
    trackId: 'track-7',
    trackName: 'Keys',
    audioBuffer: generateComplexAudio(440, [2, 3], 2, 48000, 0.45), // A4
    category: 'keys',
    currentLevel: -10,
    currentPan: -20
  }
];

console.log(`Generated ${testTracks.length} test tracks:`);
testTracks.forEach(track => {
  console.log(`  - ${track.trackName} (${track.category}) @ ${track.currentLevel}dB, pan: ${track.currentPan}`);
});
console.log('');

// ============================================================================
// RUN ANALYSIS
// ============================================================================

console.log('Initializing Smart Mix Assistant...\n');
const mixAssistant = new SmartMixAssistant();

console.log('Analyzing multi-track mix...\n');
console.log('This may take a moment...\n');

// Run analysis
mixAssistant.analyzeMix(testTracks).then(analysis => {
  console.log('=== ANALYSIS COMPLETE ===\n');

  // Print summary
  const summary = mixAssistant.generateSummary(analysis);
  console.log(summary);
  console.log('\n');

  // Detailed results
  console.log('=== DETAILED RESULTS ===\n');

  // Mix Health
  console.log('MIX HEALTH BREAKDOWN:');
  console.log(`  Overall Score: ${analysis.mixHealth.score}/100`);
  console.log(`  - Frequency Balance: ${analysis.mixHealth.frequencyBalance}/100`);
  console.log(`  - Stereo Imaging: ${analysis.mixHealth.stereoImaging}/100`);
  console.log(`  - Dynamic Range: ${analysis.mixHealth.dynamicRange}/100`);
  console.log('');

  // Frequency Conflicts
  console.log(`FREQUENCY CONFLICTS: ${analysis.frequencyConflicts.length} detected`);
  analysis.frequencyConflicts.forEach((conflict, index) => {
    console.log(`\n  Conflict ${index + 1}:`);
    console.log(`    Tracks: ${conflict.track1} vs ${conflict.track2}`);
    console.log(`    Band: ${conflict.conflictBand} @ ${conflict.conflictFrequency}Hz`);
    console.log(`    Severity: ${conflict.severity} (masking: ${conflict.maskingAmount.toFixed(1)}dB)`);
    console.log(`    Fix: ${conflict.recommendation}`);
  });
  console.log('');

  // Panning Recommendations
  console.log(`PANNING RECOMMENDATIONS: ${analysis.panningRecommendations.length}`);
  analysis.panningRecommendations.forEach((rec, index) => {
    console.log(`\n  ${index + 1}. ${rec.trackId}:`);
    console.log(`     Current: ${rec.currentPan} → Recommended: ${rec.recommendedPan}`);
    console.log(`     Priority: ${rec.priority}`);
    console.log(`     Reason: ${rec.reason}`);
  });
  console.log('');

  // EQ Recommendations
  const essentialEQ = analysis.eqRecommendations.filter(r => r.priority === 'essential');
  const recommendedEQ = analysis.eqRecommendations.filter(r => r.priority === 'recommended');

  console.log(`EQ RECOMMENDATIONS: ${analysis.eqRecommendations.length} total`);
  console.log(`  Essential: ${essentialEQ.length}`);
  console.log(`  Recommended: ${recommendedEQ.length}`);

  essentialEQ.slice(0, 5).forEach((rec, index) => {
    console.log(`\n  ${index + 1}. ${rec.trackId}:`);
    console.log(`     ${rec.type} @ ${rec.frequency}Hz: ${rec.gain > 0 ? '+' : ''}${rec.gain.toFixed(1)}dB (Q: ${rec.q})`);
    console.log(`     Reason: ${rec.reason}`);
  });
  console.log('');

  // Level Recommendations
  console.log(`LEVEL RECOMMENDATIONS: ${analysis.levelRecommendations.length}`);
  analysis.levelRecommendations.forEach((rec, index) => {
    const change = rec.recommendedLevel - rec.currentLevel;
    console.log(`  ${index + 1}. ${rec.trackId}:`);
    console.log(`     ${rec.currentLevel.toFixed(1)}dB → ${rec.recommendedLevel.toFixed(1)}dB (${change > 0 ? '+' : ''}${change.toFixed(1)}dB)`);
    console.log(`     ${rec.reason}`);
  });
  console.log('');

  // Compression Recommendations
  console.log(`COMPRESSION RECOMMENDATIONS: ${analysis.compressionRecommendations.length}`);
  analysis.compressionRecommendations.slice(0, 3).forEach((rec, index) => {
    console.log(`\n  ${index + 1}. ${rec.trackId}:`);
    console.log(`     Ratio: ${rec.ratio}:1, Threshold: ${rec.threshold}dB`);
    console.log(`     Attack: ${rec.attack}ms, Release: ${rec.release}ms`);
    console.log(`     Knee: ${rec.knee}dB, Makeup: +${rec.makeupGain}dB`);
    console.log(`     Reason: ${rec.reason}`);
  });
  console.log('');

  // Phase Correlation
  const phaseIssues = analysis.phaseCorrelations.filter(p => p.hasPhaseIssues);
  console.log(`PHASE CORRELATION ISSUES: ${phaseIssues.length}`);
  phaseIssues.forEach(issue => {
    console.log(`  - ${issue.trackId}: correlation = ${issue.correlationCoefficient.toFixed(3)}`);
  });
  console.log('');

  // Frequency Map
  console.log('FREQUENCY MAP:');
  const mapData = mixAssistant.exportFrequencyMapData(analysis.frequencyMap);
  console.log(`  Frequency bins: ${mapData.frequencies.length}`);
  console.log(`  Tracks mapped: ${mapData.tracks.length}`);
  console.log(`  Conflict zones: ${mapData.conflicts.length}`);

  mapData.conflicts.forEach((zone, index) => {
    console.log(`\n    Zone ${index + 1}: ${zone.frequency.toFixed(0)}Hz`);
    console.log(`      Tracks: ${zone.tracks.join(', ')}`);
    console.log(`      Severity: ${(zone.severity * 100).toFixed(0)}%`);
  });
  console.log('');

  // Auto-balance test
  console.log('=== AUTO-BALANCE TEST ===\n');
  const balancedLevels = mixAssistant.autoBalanceMix(analysis);
  console.log('Balanced track levels:');
  balancedLevels.forEach((level, trackId) => {
    const track = testTracks.find(t => t.trackId === trackId);
    const originalLevel = track?.currentLevel ?? 0;
    const change = level - originalLevel;
    console.log(`  ${trackId}: ${originalLevel.toFixed(1)}dB → ${level.toFixed(1)}dB (${change > 0 ? '+' : ''}${change.toFixed(1)}dB)`);
  });
  console.log('');

  console.log('=== TEST COMPLETE ===\n');

  // Final verdict
  console.log('FINAL VERDICT:');
  if (analysis.mixHealth.score >= 80) {
    console.log('  ✅ Mix is in good shape! Just minor tweaks needed.');
  } else if (analysis.mixHealth.score >= 60) {
    console.log('  ⚠️  Mix needs some work. Follow the recommendations above.');
  } else {
    console.log('  ❌ Mix has significant issues. Major adjustments required.');
  }
  console.log('');

  // Recommendations summary
  console.log('QUICK ACTIONS:');
  console.log(`  1. Fix ${analysis.frequencyConflicts.filter(c => c.severity === 'high').length} high-severity frequency conflicts`);
  console.log(`  2. Apply ${essentialEQ.length} essential EQ adjustments`);
  console.log(`  3. Adjust ${analysis.levelRecommendations.length} track levels for better balance`);
  console.log(`  4. Consider applying recommended panning for better stereo width`);
  if (phaseIssues.length > 0) {
    console.log(`  5. Fix ${phaseIssues.length} phase correlation issues`);
  }
  console.log('');

}).catch(error => {
  console.error('❌ Analysis failed:', error);
  console.error(error.stack);
});
