/**
 * Test script for Adaptive EQ with ML-style analysis
 *
 * Run with: npx ts-node test-adaptive-eq.ts
 */

import { AdaptiveEQ } from './src/audio/ai/AdaptiveEQ.js';

// Helper function to create a test audio buffer
function createTestAudioBuffer(sampleRate: number, duration: number): AudioBuffer {
  const length = sampleRate * duration;
  const buffer = {
    sampleRate,
    length,
    duration,
    numberOfChannels: 1,
    getChannelData: (_channel: number) => {
      const data = new Float32Array(length);

      // Create test audio with various frequency components
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;

        // Fundamental @ 200Hz (simulating bass/low-mids)
        data[i] = 0.3 * Math.sin(2 * Math.PI * 200 * t);

        // Mud @ 350Hz
        data[i] += 0.5 * Math.sin(2 * Math.PI * 350 * t);

        // Resonance @ 800Hz
        data[i] += 0.4 * Math.sin(2 * Math.PI * 800 * t);

        // Presence @ 3000Hz
        data[i] += 0.2 * Math.sin(2 * Math.PI * 3000 * t);

        // Harshness @ 4500Hz
        data[i] += 0.35 * Math.sin(2 * Math.PI * 4500 * t);

        // High frequencies @ 10000Hz (air)
        data[i] += 0.1 * Math.sin(2 * Math.PI * 10000 * t);

        // Add some noise
        data[i] += (Math.random() - 0.5) * 0.05;

        // Normalize
        data[i] *= 0.5;
      }

      return data;
    },
    copyFromChannel: () => {},
    copyToChannel: () => {},
  } as AudioBuffer;

  return buffer;
}

// Helper function to create a reference audio buffer (brighter, cleaner)
function createReferenceAudioBuffer(sampleRate: number, duration: number): AudioBuffer {
  const length = sampleRate * duration;
  const buffer = {
    sampleRate,
    length,
    duration,
    numberOfChannels: 1,
    getChannelData: (_channel: number) => {
      const data = new Float32Array(length);

      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;

        // Fundamental @ 200Hz (balanced)
        data[i] = 0.3 * Math.sin(2 * Math.PI * 200 * t);

        // Less mud @ 350Hz
        data[i] += 0.2 * Math.sin(2 * Math.PI * 350 * t);

        // Controlled @ 800Hz
        data[i] += 0.2 * Math.sin(2 * Math.PI * 800 * t);

        // Good presence @ 3000Hz
        data[i] += 0.3 * Math.sin(2 * Math.PI * 3000 * t);

        // Controlled highs @ 4500Hz
        data[i] += 0.15 * Math.sin(2 * Math.PI * 4500 * t);

        // More air @ 10000Hz
        data[i] += 0.25 * Math.sin(2 * Math.PI * 10000 * t);

        // Less noise
        data[i] += (Math.random() - 0.5) * 0.02;

        // Normalize
        data[i] *= 0.5;
      }

      return data;
    },
    copyFromChannel: () => {},
    copyToChannel: () => {},
  } as AudioBuffer;

  return buffer;
}

// Main test function
async function testAdaptiveEQ() {
  console.log('===============================================');
  console.log('ADAPTIVE EQ - ML-STYLE ANALYSIS TEST');
  console.log('===============================================\n');

  const sampleRate = 48000;
  const duration = 2; // 2 seconds
  const adaptiveEQ = new AdaptiveEQ(sampleRate);

  // Create test audio
  console.log('Creating test audio...');
  const testAudio = createTestAudioBuffer(sampleRate, duration);
  const referenceAudio = createReferenceAudioBuffer(sampleRate, duration);
  console.log(`Sample Rate: ${sampleRate}Hz, Duration: ${duration}s\n`);

  // =========================================================================
  // TEST 1: Analyze Audio
  // =========================================================================
  console.log('TEST 1: AUDIO ANALYSIS');
  console.log('-----------------------------------------------');

  const analysis = adaptiveEQ.analyzeAudio(testAudio);

  console.log('\nSpectral Analysis:');
  console.log(`  Spectral Tilt: ${analysis.spectralAnalysis.spectralTilt.toFixed(2)} dB/octave`);
  console.log(`  Crest Factor: ${analysis.spectralAnalysis.crestFactor.toFixed(2)}`);
  console.log(`  Tone-to-Noise Ratio: ${analysis.spectralAnalysis.toneToNoiseRatio.toFixed(2)} dB`);
  if (analysis.spectralAnalysis.fundamentalFrequency) {
    console.log(`  Fundamental Frequency: ${analysis.spectralAnalysis.fundamentalFrequency.toFixed(0)} Hz`);
  }

  console.log('\nDominant Frequencies:');
  analysis.spectralAnalysis.dominantFrequencies.forEach((freq, i) => {
    console.log(`  ${i + 1}. ${freq.toFixed(0)} Hz`);
  });

  console.log('\nResonances Detected:');
  if (analysis.resonances.length === 0) {
    console.log('  None detected');
  } else {
    analysis.resonances.forEach(res => {
      console.log(`  ${res.frequency.toFixed(0)} Hz - ${res.severity} (${res.magnitude.toFixed(1)} dB) - ${res.description}`);
    });
  }

  console.log('\nMasking Issues:');
  if (analysis.maskingIssues.length === 0) {
    console.log('  None detected');
  } else {
    analysis.maskingIssues.forEach(issue => {
      console.log(`  ${issue.description} (severity: ${(issue.severity * 100).toFixed(0)}%)`);
    });
  }

  console.log('\nProblems Identified:');
  if (analysis.problems.length === 0) {
    console.log('  No problems detected - audio is well balanced!');
  } else {
    analysis.problems.forEach(problem => {
      console.log(`  - ${problem}`);
    });
  }

  console.log('\nOverall Assessment:');
  console.log(`  Muddy: ${analysis.overall.hasMudiness ? 'YES' : 'NO'}`);
  console.log(`  Harsh: ${analysis.overall.hasHarshness ? 'YES' : 'NO'}`);
  console.log(`  Boxy: ${analysis.overall.hasBoxiness ? 'YES' : 'NO'}`);
  console.log(`  Needs Air: ${analysis.overall.needsAir ? 'YES' : 'NO'}`);
  console.log(`  Needs Warmth: ${analysis.overall.needsWarmth ? 'YES' : 'NO'}`);
  console.log(`  Balanced: ${analysis.overall.isBalanced ? 'YES' : 'NO'}`);

  console.log(`\nEQ Recommendations: ${analysis.recommendations.length}`);
  analysis.recommendations.forEach((rec, i) => {
    console.log(`\n${i + 1}. ${rec.name} [${rec.priority}]`);
    console.log(`   ${rec.description}`);
    console.log(`   Reason: ${rec.reason}`);
    console.log(`   Bands:`);
    rec.bands.forEach(band => {
      if (band.gain !== undefined) {
        console.log(`     ${band.type} @ ${band.frequency}Hz: ${band.gain > 0 ? '+' : ''}${band.gain.toFixed(1)} dB (Q: ${band.q?.toFixed(1) || 'N/A'})`);
      } else {
        console.log(`     ${band.type} @ ${band.frequency}Hz`);
      }
    });
  });

  // =========================================================================
  // TEST 2: Auto-EQ for Clarity
  // =========================================================================
  console.log('\n\n');
  console.log('TEST 2: AUTO-EQ FOR CLARITY');
  console.log('-----------------------------------------------');

  const clarityRecs = adaptiveEQ.autoEQForClarity(testAudio);

  console.log(`\nAuto-EQ Recommendations: ${clarityRecs.length}`);
  clarityRecs.forEach((rec, i) => {
    console.log(`\n${i + 1}. ${rec.name} [${rec.category}]`);
    console.log(`   ${rec.description}`);
    rec.bands.forEach(band => {
      if (band.gain !== undefined) {
        console.log(`     ${band.type} @ ${band.frequency}Hz: ${band.gain > 0 ? '+' : ''}${band.gain.toFixed(1)} dB`);
      } else {
        console.log(`     ${band.type} @ ${band.frequency}Hz`);
      }
    });
  });

  // =========================================================================
  // TEST 3: Match Reference Track
  // =========================================================================
  console.log('\n\n');
  console.log('TEST 3: MATCH EQ TO REFERENCE');
  console.log('-----------------------------------------------');

  const match = adaptiveEQ.matchReference(testAudio, referenceAudio);

  console.log(`\nMatch Quality Score: ${match.matchQuality.toFixed(1)}%`);
  console.log(`Spectral Tilt Difference: ${match.tiltDifference > 0 ? '+' : ''}${match.tiltDifference.toFixed(2)} dB/octave`);
  console.log(`\nMatching EQ Recommendations: ${match.recommendations.length}`);

  match.recommendations.slice(0, 5).forEach((rec, i) => {
    console.log(`\n${i + 1}. ${rec.name} [${rec.priority}]`);
    console.log(`   ${rec.reason}`);
    rec.bands.forEach(band => {
      if (band.gain !== undefined) {
        console.log(`     ${band.type} @ ${band.frequency}Hz: ${band.gain > 0 ? '+' : ''}${band.gain.toFixed(1)} dB`);
      }
    });
  });

  // =========================================================================
  // TEST 4: Genre Templates
  // =========================================================================
  console.log('\n\n');
  console.log('TEST 4: GENRE EQ TEMPLATES');
  console.log('-----------------------------------------------');

  const genres: Array<'pop' | 'rock' | 'hiphop' | 'jazz' | 'metal'> = ['pop', 'rock', 'hiphop', 'jazz', 'metal'];

  genres.forEach(genre => {
    const template = adaptiveEQ.getGenreTemplate(genre);
    console.log(`\n${template.name}`);
    console.log(`  ${template.description}`);
    console.log(`  Character: ${template.spectralCharacter}`);
    console.log(`  Bands: ${template.bands.length}`);
  });

  // =========================================================================
  // TEST 5: Dynamic EQ
  // =========================================================================
  console.log('\n\n');
  console.log('TEST 5: DYNAMIC EQ ANALYSIS');
  console.log('-----------------------------------------------');

  const dynamicEQ = adaptiveEQ.getDynamicEQ(testAudio);

  console.log(`\n${dynamicEQ.description}`);
  console.log(`\nLoud Sections EQ: ${dynamicEQ.loudSections.length} recommendations`);
  dynamicEQ.loudSections.forEach(rec => {
    console.log(`  - ${rec.name}: ${rec.description}`);
  });

  console.log(`\nQuiet Sections EQ: ${dynamicEQ.quietSections.length} recommendations`);
  dynamicEQ.quietSections.forEach(rec => {
    console.log(`  - ${rec.name}: ${rec.description}`);
  });

  // =========================================================================
  // Summary
  // =========================================================================
  console.log('\n\n');
  console.log('===============================================');
  console.log('TEST SUMMARY');
  console.log('===============================================');
  console.log(`Total Issues Detected: ${analysis.problems.length}`);
  console.log(`Resonances Found: ${analysis.resonances.length}`);
  console.log(`Masking Issues: ${analysis.maskingIssues.length}`);
  console.log(`EQ Recommendations Generated: ${analysis.recommendations.length}`);
  console.log(`Reference Match Quality: ${match.matchQuality.toFixed(1)}%`);
  console.log(`Auto-EQ Clarity Recommendations: ${clarityRecs.length}`);
  console.log(`Genre Templates Available: ${genres.length}`);
  console.log(`\nAll tests completed successfully!`);
  console.log('===============================================\n');
}

// Run tests
testAdaptiveEQ().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
