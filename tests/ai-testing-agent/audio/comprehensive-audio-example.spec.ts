/**
 * Comprehensive Audio Testing Example
 *
 * This file demonstrates all capabilities of the audio testing framework.
 * Use this as a reference for writing your own audio tests.
 */

import { test, expect, Page } from '@playwright/test';
import { AudioTestFramework } from './audio-test-framework';
import { AudioAnalyzer } from './audio-analyzer';
import * as path from 'path';
import * as fs from 'fs';

const SCREENSHOT_DIR = path.join(__dirname, '../../test-results/audio-comprehensive');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('Comprehensive Audio Testing Example', () => {
  let page: Page;
  let audioFramework: AudioTestFramework;
  let audioAnalyzer: AudioAnalyzer;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    audioFramework = new AudioTestFramework(page);
    audioAnalyzer = new AudioAnalyzer(page);
    await audioFramework.initialize();
  });

  test.afterEach(async () => {
    await audioFramework.cleanup();
    await page.close();
  });

  test('EXAMPLE: Complete Audio Quality Analysis Workflow', async () => {
    console.log('\n=== COMPREHENSIVE AUDIO TESTING EXAMPLE ===\n');

    // STEP 1: Create Test Audio File
    console.log('STEP 1: Creating test audio file...');
    const testAudio = await audioFramework.createTestAudioFile(
      'comprehensive-test.wav',
      5, // 5 seconds
      440, // A4 note
      44100 // Sample rate
    );
    console.log('✓ Test audio file created');
    console.log(`  - File: ${testAudio.name}`);
    console.log(`  - Size: ${(testAudio.size / 1024).toFixed(2)} KB`);
    console.log(`  - Format: ${testAudio.format}`);

    // STEP 2: Verify File Integrity
    console.log('\nSTEP 2: Verifying file integrity...');
    const integrity = await audioFramework.verifyAudioIntegrity(testAudio);
    console.log('✓ Integrity check complete');
    console.log(`  - Valid: ${integrity.valid}`);
    console.log(`  - Has Data: ${integrity.hasData}`);
    console.log(`  - Format Supported: ${integrity.formatSupported}`);
    console.log(`  - Size Reasonable: ${integrity.sizeReasonable}`);

    if (integrity.errors.length > 0) {
      console.log('  - Errors:', integrity.errors);
    }

    expect(integrity.valid).toBe(true);

    // STEP 3: Test Audio Loading
    console.log('\nSTEP 3: Testing audio loading...');
    const loadResult = await audioFramework.testAudioLoading(testAudio);
    console.log('✓ Audio loading test complete');
    console.log(`  - Success: ${loadResult.success}`);
    console.log(`  - Duration: ${(loadResult.duration / 1000).toFixed(2)}s`);
    console.log(`  - Sample Rate: ${loadResult.sampleRate} Hz`);
    console.log(`  - Channels: ${loadResult.numberOfChannels}`);
    console.log(`  - Load Time: ${loadResult.loadTime}ms`);

    expect(loadResult.success).toBe(true);
    expect(loadResult.sampleRate).toBe(44100);

    // STEP 4: Measure Loading Performance
    console.log('\nSTEP 4: Measuring loading performance (5 iterations)...');
    const perfMetrics = await audioFramework.measureLoadingTime(testAudio, 5);
    console.log('✓ Performance measurement complete');
    console.log(`  - Average Time: ${perfMetrics.averageTime.toFixed(2)}ms`);
    console.log(`  - Min Time: ${perfMetrics.minTime.toFixed(2)}ms`);
    console.log(`  - Max Time: ${perfMetrics.maxTime.toFixed(2)}ms`);
    console.log(`  - Individual Times: ${perfMetrics.times.map(t => t.toFixed(0)).join(', ')}ms`);

    expect(perfMetrics.averageTime).toBeLessThan(1000); // Should load in under 1 second

    // STEP 5: Test Playback
    console.log('\nSTEP 5: Testing audio playback...');
    const playbackTest = await audioFramework.testAudioPlayback(testAudio, 500);
    console.log('✓ Playback test complete');
    console.log(`  - Can Play: ${playbackTest.canPlay}`);
    console.log(`  - Is Playing: ${playbackTest.isPlaying}`);
    console.log(`  - Duration: ${playbackTest.duration.toFixed(2)}s`);
    console.log(`  - Current Time: ${playbackTest.currentTime.toFixed(2)}s`);
    console.log(`  - Volume: ${playbackTest.volume}`);

    expect(playbackTest.canPlay).toBe(true);

    // STEP 6: Comprehensive Audio Analysis
    if (!testAudio.buffer) {
      console.log('\nSTEP 6: Skipped (no audio buffer)');
      return;
    }

    console.log('\nSTEP 6: Performing comprehensive audio analysis...');
    const analysis = await audioAnalyzer.analyzeAudio(testAudio.buffer);

    console.log('✓ Comprehensive analysis complete\n');

    // LUFS Measurement
    console.log('LUFS MEASUREMENT (ITU-R BS.1770):');
    console.log(`  - Integrated LUFS: ${analysis.lufs.integratedLUFS.toFixed(2)} LUFS`);
    console.log(`  - Short-term LUFS: ${analysis.lufs.shortTermLUFS.toFixed(2)} LUFS`);
    console.log(`  - Momentary LUFS: ${analysis.lufs.momentaryLUFS.toFixed(2)} LUFS`);
    console.log(`  - True Peak L: ${(20 * Math.log10(analysis.lufs.truePeakLeft)).toFixed(2)} dBFS`);
    console.log(`  - True Peak R: ${(20 * Math.log10(analysis.lufs.truePeakRight)).toFixed(2)} dBFS`);
    console.log(`  - True Peak Max: ${analysis.lufs.truePeakDBFS.toFixed(2)} dBFS`);
    console.log(`  - Loudness Range: ${analysis.lufs.loudnessRange.toFixed(2)} LU`);

    // Verify LUFS is in reasonable range
    expect(analysis.lufs.integratedLUFS).toBeGreaterThan(-40);
    expect(analysis.lufs.truePeakDBFS).toBeLessThan(0);

    // Clipping Analysis
    console.log('\nCLIPPING ANALYSIS:');
    console.log(`  - Has Clipping: ${analysis.clipping.hasClipping}`);
    console.log(`  - Clipped Samples (L): ${analysis.clipping.clippedSamplesLeft}`);
    console.log(`  - Clipped Samples (R): ${analysis.clipping.clippedSamplesRight}`);
    console.log(`  - Clipping %: ${analysis.clipping.clippingPercentage.toFixed(4)}%`);
    console.log(`  - Max Peak (L): ${analysis.clipping.maxPeakLeft.toFixed(4)}`);
    console.log(`  - Max Peak (R): ${analysis.clipping.maxPeakRight.toFixed(4)}`);

    expect(analysis.clipping.hasClipping).toBe(false);
    expect(analysis.clipping.maxPeakLeft).toBeLessThanOrEqual(1.0);
    expect(analysis.clipping.maxPeakRight).toBeLessThanOrEqual(1.0);

    // DC Offset Analysis
    console.log('\nDC OFFSET ANALYSIS:');
    console.log(`  - Has DC Offset: ${analysis.dcOffset.hasDCOffset}`);
    console.log(`  - DC Offset (L): ${(analysis.dcOffset.dcOffsetLeft * 100).toFixed(4)}%`);
    console.log(`  - DC Offset (R): ${(analysis.dcOffset.dcOffsetRight * 100).toFixed(4)}%`);
    console.log(`  - Offset %: ${analysis.dcOffset.offsetPercentage.toFixed(4)}%`);

    expect(analysis.dcOffset.hasDCOffset).toBe(false);

    // Stereo Imaging
    console.log('\nSTEREO IMAGING:');
    console.log(`  - Correlation: ${analysis.stereoImaging.correlationCoefficient.toFixed(3)}`);
    console.log(`  - Stereo Width: ${analysis.stereoImaging.stereoWidth.toFixed(3)}`);
    console.log(`  - Phase Coherence: ${analysis.stereoImaging.phaseCoherence.toFixed(3)}`);
    console.log(`  - Is Mono: ${analysis.stereoImaging.isMono}`);
    console.log(`  - Is Wide Stereo: ${analysis.stereoImaging.isWideStereо}`);

    expect(analysis.stereoImaging.correlationCoefficient).toBeGreaterThanOrEqual(-1);
    expect(analysis.stereoImaging.correlationCoefficient).toBeLessThanOrEqual(1);

    // Spectral Analysis
    console.log('\nSPECTRAL ANALYSIS:');
    console.log(`  - Low Frequency (0-200 Hz): ${analysis.spectral.lowFrequencyEnergy.toFixed(2)}%`);
    console.log(`  - Mid Frequency (200-2000 Hz): ${analysis.spectral.midFrequencyEnergy.toFixed(2)}%`);
    console.log(`  - High Frequency (2-20 kHz): ${analysis.spectral.highFrequencyEnergy.toFixed(2)}%`);
    console.log(`  - Spectral Balance: ${analysis.spectral.spectralBalance}`);

    // Overall Quality
    console.log('\nOVERALL QUALITY ASSESSMENT:');
    console.log(`  - Quality Rating: ${analysis.overallQuality.toUpperCase()}`);
    console.log(`  - Quality Score: ${analysis.qualityScore}/100`);

    if (analysis.issues.length > 0) {
      console.log('  - Issues Detected:');
      analysis.issues.forEach((issue, i) => {
        console.log(`    ${i + 1}. ${issue}`);
      });
    } else {
      console.log('  - No issues detected ✓');
    }

    expect(analysis.qualityScore).toBeGreaterThan(0);
    expect(analysis.overallQuality).toBeDefined();

    // STEP 7: FFT Analysis
    console.log('\nSTEP 7: Performing FFT analysis...');
    const fftResult = await audioAnalyzer.performFFTAnalysis(testAudio.buffer, 2048);

    console.log('✓ FFT analysis complete');
    console.log(`  - Peak Frequency: ${fftResult.peakFrequency.toFixed(2)} Hz`);
    console.log(`  - Peak Magnitude: ${fftResult.peakMagnitude.toFixed(2)}`);
    console.log(`  - Average Magnitude: ${fftResult.averageMagnitude.toFixed(2)}`);
    console.log(`  - Spectral Centroid: ${fftResult.spectralCentroid.toFixed(2)} Hz`);
    console.log(`  - Spectral Rolloff: ${fftResult.spectralRolloff.toFixed(2)} Hz`);

    // Verify peak frequency is close to 440 Hz (our test tone)
    expect(Math.abs(fftResult.peakFrequency - 440)).toBeLessThan(50); // Within 50 Hz

    // STEP 8: Test Audio Element Integration
    console.log('\nSTEP 8: Testing audio element integration...');
    const elementTest = await audioFramework.testAudioElementIntegration(testAudio);

    console.log('✓ Audio element integration test complete');
    console.log(`  - Success: ${elementTest.success}`);
    console.log(`  - Element Created: ${elementTest.elementCreated}`);
    console.log(`  - Can Play Type: ${elementTest.canPlayType}`);

    expect(elementTest.success).toBe(true);
    expect(elementTest.elementCreated).toBe(true);

    // STEP 9: Generate Test Report
    console.log('\nSTEP 9: Generating comprehensive test report...');

    const report = {
      timestamp: new Date().toISOString(),
      testFile: testAudio.name,
      fileInfo: {
        format: testAudio.format,
        size: testAudio.size,
        sizeKB: (testAudio.size / 1024).toFixed(2),
      },
      integrity: {
        valid: integrity.valid,
        errors: integrity.errors,
      },
      loading: {
        success: loadResult.success,
        durationSeconds: (loadResult.duration / 1000).toFixed(2),
        sampleRate: loadResult.sampleRate,
        channels: loadResult.numberOfChannels,
        loadTimeMs: loadResult.loadTime,
      },
      performance: {
        averageLoadTimeMs: perfMetrics.averageTime.toFixed(2),
        minLoadTimeMs: perfMetrics.minTime.toFixed(2),
        maxLoadTimeMs: perfMetrics.maxTime.toFixed(2),
      },
      playback: {
        canPlay: playbackTest.canPlay,
        durationSeconds: playbackTest.duration.toFixed(2),
      },
      quality: {
        lufs: {
          integrated: analysis.lufs.integratedLUFS.toFixed(2),
          truePeak: analysis.lufs.truePeakDBFS.toFixed(2),
        },
        clipping: {
          hasClipping: analysis.clipping.hasClipping,
          percentage: analysis.clipping.clippingPercentage.toFixed(4),
        },
        dcOffset: {
          hasOffset: analysis.dcOffset.hasDCOffset,
          percentage: analysis.dcOffset.offsetPercentage.toFixed(4),
        },
        stereo: {
          correlation: analysis.stereoImaging.correlationCoefficient.toFixed(3),
          width: analysis.stereoImaging.stereoWidth.toFixed(3),
          isMono: analysis.stereoImaging.isMono,
        },
        spectral: {
          lowEnergy: analysis.spectral.lowFrequencyEnergy.toFixed(2),
          midEnergy: analysis.spectral.midFrequencyEnergy.toFixed(2),
          highEnergy: analysis.spectral.highFrequencyEnergy.toFixed(2),
          balance: analysis.spectral.spectralBalance,
        },
        overall: {
          rating: analysis.overallQuality,
          score: analysis.qualityScore,
          issues: analysis.issues,
        },
      },
      fft: {
        peakFrequency: fftResult.peakFrequency.toFixed(2),
        spectralCentroid: fftResult.spectralCentroid.toFixed(2),
        spectralRolloff: fftResult.spectralRolloff.toFixed(2),
      },
      testsPassed: {
        integrity: integrity.valid,
        loading: loadResult.success,
        playback: playbackTest.canPlay,
        noClipping: !analysis.clipping.hasClipping,
        noDCOffset: !analysis.dcOffset.hasDCOffset,
        goodQuality: analysis.qualityScore >= 60,
        correctFrequency: Math.abs(fftResult.peakFrequency - 440) < 50,
      },
    };

    const reportPath = path.join(SCREENSHOT_DIR, 'comprehensive-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('✓ Report generated and saved');
    console.log(`  - Location: ${reportPath}`);

    // Print summary
    const passedTests = Object.values(report.testsPassed).filter(v => v === true).length;
    const totalTests = Object.keys(report.testsPassed).length;

    console.log('\n=== TEST SUMMARY ===');
    console.log(`Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`Pass Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`Overall Quality: ${analysis.overallQuality.toUpperCase()}`);
    console.log(`Quality Score: ${analysis.qualityScore}/100`);

    if (analysis.issues.length === 0) {
      console.log('Status: ALL CHECKS PASSED ✓\n');
    } else {
      console.log(`Status: ${analysis.issues.length} ISSUES DETECTED\n`);
    }

    // Take final screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'comprehensive-test-complete.png'),
      fullPage: true,
    });

    // Verify overall success
    expect(passedTests).toBe(totalTests);
    expect(analysis.overallQuality).not.toBe('poor');
  });

  test('EXAMPLE: Audio Quality Comparison', async () => {
    console.log('\n=== AUDIO QUALITY COMPARISON EXAMPLE ===\n');

    // Create two different test files
    const quietAudio = await audioFramework.createTestAudioFile('quiet.wav', 2, 440);
    const loudAudio = await audioFramework.createTestAudioFile('loud.wav', 2, 440);

    console.log('Created two test files for comparison');

    if (quietAudio.buffer && loudAudio.buffer) {
      const quietMetrics = await audioAnalyzer.analyzeAudio(quietAudio.buffer);
      const loudMetrics = await audioAnalyzer.analyzeAudio(loudAudio.buffer);

      console.log('\nQUIET AUDIO:');
      console.log(`  - LUFS: ${quietMetrics.lufs.integratedLUFS.toFixed(2)}`);
      console.log(`  - True Peak: ${quietMetrics.lufs.truePeakDBFS.toFixed(2)} dBFS`);
      console.log(`  - Quality: ${quietMetrics.overallQuality} (${quietMetrics.qualityScore}/100)`);

      console.log('\nLOUD AUDIO:');
      console.log(`  - LUFS: ${loudMetrics.lufs.integratedLUFS.toFixed(2)}`);
      console.log(`  - True Peak: ${loudMetrics.lufs.truePeakDBFS.toFixed(2)} dBFS`);
      console.log(`  - Quality: ${loudMetrics.overallQuality} (${loudMetrics.qualityScore}/100)`);

      console.log('\nCOMPARISON:');
      const lufsDiff = Math.abs(quietMetrics.lufs.integratedLUFS - loudMetrics.lufs.integratedLUFS);
      console.log(`  - LUFS Difference: ${lufsDiff.toFixed(2)} LU`);
      console.log(`  - Both files analyzed successfully ✓`);
    }
  });
});
