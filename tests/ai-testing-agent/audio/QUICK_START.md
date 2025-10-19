# Audio Testing Framework - Quick Start Guide

Get started with audio testing in 5 minutes!

## Prerequisites

```bash
# Ensure dependencies are installed
npm install

# Install Playwright browsers (if not already installed)
npx playwright install
```

## 1. Run Your First Audio Test

### Option A: Run All Audio Tests
```bash
npm run test:audio
```

### Option B: Run Specific Test Suite
```bash
# DAW audio system tests
npm run test:audio:daw

# AI music generation tests
npm run test:audio:ai-music

# Comprehensive example test
npm run test:audio:example
```

### Option C: Run with Visual Browser (Debug Mode)
```bash
npm run test:audio:headed
```

## 2. View Test Results

### Console Output
Tests print detailed output to console:
```
=== Testing Audio Quality Analysis ===

Audio Quality Metrics: {
  sampleRate: 44100,
  numberOfChannels: 2,
  duration: 30.0,
  integratedLUFS: -12.45,
  truePeakDBFS: -2.31,
  hasClipping: false,
  overallQuality: 'excellent',
  qualityScore: 95
}

✓ All quality checks passed
```

### JSON Reports
Find detailed reports in:
```
tests/test-results/daw-audio/daw-audio-test-report.json
tests/test-results/ai-music-generation/ai-music-test-report.json
tests/test-results/audio-comprehensive/comprehensive-test-report.json
```

### Screenshots
Visual captures at each test stage:
```
tests/test-results/[test-suite]/01-engine-initialized.png
tests/test-results/[test-suite]/02-track-created.png
tests/test-results/[test-suite]/03-quality-analysis.png
...
```

### HTML Report
Generate interactive HTML report:
```bash
npm run test:audio:report
npx playwright show-report
```

## 3. Write Your First Test

Create a new test file: `tests/ai-testing-agent/audio/my-test.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { AudioTestFramework } from './audio-test-framework';
import { AudioAnalyzer } from './audio-analyzer';

test('My first audio test', async ({ page }) => {
  // Initialize framework
  const framework = new AudioTestFramework(page);
  const analyzer = new AudioAnalyzer(page);

  await framework.initialize();

  // Create test audio (1 second, 440 Hz)
  const audio = await framework.createTestAudioFile('my-test.wav', 1, 440);

  // Verify it's valid
  const integrity = await framework.verifyAudioIntegrity(audio);
  expect(integrity.valid).toBe(true);

  // Test loading
  const loadResult = await framework.testAudioLoading(audio);
  expect(loadResult.success).toBe(true);

  // Analyze quality
  if (audio.buffer) {
    const metrics = await analyzer.analyzeAudio(audio.buffer);
    console.log('LUFS:', metrics.lufs.integratedLUFS);
    console.log('Quality:', metrics.overallQuality);

    expect(metrics.clipping.hasClipping).toBe(false);
  }

  await framework.cleanup();
});
```

Run your test:
```bash
npx playwright test tests/ai-testing-agent/audio/my-test.spec.ts
```

## 4. Common Use Cases

### Test Audio File Loading
```typescript
test('Load and verify audio', async ({ page }) => {
  const framework = new AudioTestFramework(page);
  await framework.initialize();

  // Load from file
  const audio = await framework.loadAudioFile('path/to/audio.wav');

  // Verify integrity
  const integrity = await framework.verifyAudioIntegrity(audio);
  console.log('Valid:', integrity.valid);

  // Test loading performance
  const loadResult = await framework.testAudioLoading(audio);
  console.log('Load time:', loadResult.loadTime, 'ms');

  await framework.cleanup();
});
```

### Analyze Audio Quality
```typescript
test('Check audio quality', async ({ page }) => {
  const framework = new AudioTestFramework(page);
  const analyzer = new AudioAnalyzer(page);

  await framework.initialize();

  const audio = await framework.loadAudioFile('music.mp3');

  if (audio.buffer) {
    const metrics = await analyzer.analyzeAudio(audio.buffer);

    // Check LUFS
    console.log('LUFS:', metrics.lufs.integratedLUFS);
    expect(metrics.lufs.integratedLUFS).toBeGreaterThan(-20);
    expect(metrics.lufs.integratedLUFS).toBeLessThan(-6);

    // Check clipping
    expect(metrics.clipping.hasClipping).toBe(false);

    // Check true peak
    expect(metrics.lufs.truePeakDBFS).toBeLessThan(-1);

    // Check overall quality
    expect(metrics.qualityScore).toBeGreaterThan(60);
  }

  await framework.cleanup();
});
```

### Test DAW Features
```typescript
test('Test mixer volume control', async ({ page }) => {
  const result = await page.evaluate(() => {
    const ctx = new AudioContext();
    const gain = ctx.createGain();

    // Set volume to 50%
    gain.gain.value = 0.5;

    return {
      volume: gain.gain.value,
      success: true
    };
  });

  expect(result.success).toBe(true);
  expect(result.volume).toBe(0.5);
});
```

### Test Audio Playback
```typescript
test('Test audio playback', async ({ page }) => {
  const framework = new AudioTestFramework(page);
  await framework.initialize();

  const audio = await framework.createTestAudioFile('test.wav', 2, 440);

  // Test playback for 500ms
  const playback = await framework.testAudioPlayback(audio, 500);

  expect(playback.canPlay).toBe(true);
  expect(playback.isPlaying).toBe(true);
  expect(playback.currentTime).toBeGreaterThan(0);

  await framework.cleanup();
});
```

### Measure LUFS
```typescript
test('Measure LUFS levels', async ({ page }) => {
  const framework = new AudioTestFramework(page);
  const analyzer = new AudioAnalyzer(page);

  await framework.initialize();

  const audio = await framework.loadAudioFile('track.wav');

  if (audio.buffer) {
    const lufs = await analyzer.measureLUFS(audio.buffer);

    console.log('Integrated LUFS:', lufs.integratedLUFS);
    console.log('True Peak:', lufs.truePeakDBFS);

    // Verify music streaming standard (-14 LUFS)
    expect(lufs.integratedLUFS).toBeCloseTo(-14, 2);
    expect(lufs.truePeakDBFS).toBeLessThan(-1);
  }

  await framework.cleanup();
});
```

### Detect Clipping
```typescript
test('Detect audio clipping', async ({ page }) => {
  const analyzer = new AudioAnalyzer(page);

  const audio = await framework.loadAudioFile('loud-audio.wav');

  if (audio.buffer) {
    const clipping = await analyzer.detectClipping(audio.buffer);

    console.log('Has clipping:', clipping.hasClipping);
    console.log('Clipped samples:', clipping.clippedSamplesLeft + clipping.clippedSamplesRight);
    console.log('Percentage:', clipping.clippingPercentage);

    // Should have no clipping for quality audio
    expect(clipping.hasClipping).toBe(false);
  }
});
```

### Analyze Stereo Imaging
```typescript
test('Check stereo imaging', async ({ page }) => {
  const analyzer = new AudioAnalyzer(page);

  const audio = await framework.loadAudioFile('stereo-track.wav');

  if (audio.buffer) {
    const stereo = await analyzer.analyzeStereoImaging(audio.buffer);

    console.log('Correlation:', stereo.correlationCoefficient);
    console.log('Stereo width:', stereo.stereoWidth);
    console.log('Is mono:', stereo.isMono);

    // Verify it's actually stereo
    expect(stereo.isMono).toBe(false);
    expect(stereo.stereoWidth).toBeGreaterThan(0.1);
  }
});
```

## 5. Understanding Test Results

### Quality Scores
- **90-100**: Excellent - Production ready
- **75-89**: Good - Minor improvements possible
- **60-74**: Acceptable - Some issues present
- **0-59**: Poor - Significant issues

### LUFS Levels
- **-14 LUFS**: Music streaming standard (Spotify, Apple Music)
- **-16 LUFS**: YouTube standard
- **-23 LUFS**: Broadcast standard (TV, radio)

### True Peak
- **< -1 dBFS**: Safe (no clipping on conversion)
- **-1 to 0 dBFS**: Risk zone (may clip on some systems)
- **> 0 dBFS**: Clipping (will distort)

### Clipping Percentage
- **0%**: Perfect (no clipping)
- **< 0.01%**: Negligible (acceptable)
- **> 0.01%**: Problematic (audible distortion)

## 6. Troubleshooting

### Tests Failing
```bash
# Run in headed mode to see what's happening
npm run test:audio:headed

# Check specific test with debug
npx playwright test tests/ai-testing-agent/audio/my-test.spec.ts --debug
```

### Audio Not Loading
- Verify audio file exists and is readable
- Check file format is supported (MP3, WAV, OGG)
- Ensure file is not corrupted

### Web Audio API Errors
- Check browser compatibility
- Ensure AudioContext is created successfully
- Verify sample rate is supported (44.1kHz or 48kHz)

### Performance Issues
- Reduce FFT size for faster analysis
- Test smaller audio files first
- Close other browser tabs/processes

## 7. Next Steps

### Explore Example Test
```bash
# See comprehensive example with all features
npm run test:audio:example -- --headed
```

### Read Full Documentation
- [README.md](./README.md) - Complete framework documentation
- [AUDIO_TESTING_SUMMARY.md](./AUDIO_TESTING_SUMMARY.md) - Implementation details

### Extend Framework
1. Add custom test files in `tests/ai-testing-agent/audio/`
2. Import `AudioTestFramework` and `AudioAnalyzer`
3. Write test cases using Playwright
4. Run tests with `npx playwright test`

## 8. Getting Help

### Check Logs
Console output shows detailed test execution:
```
✓ Audio loading test complete
  - Success: true
  - Duration: 5.00s
  - Load Time: 234ms
```

### View Screenshots
Visual feedback in `tests/test-results/`:
```
01-engine-initialized.png
02-track-created.png
03-quality-analysis.png
```

### Review Reports
JSON reports with all metrics:
```bash
cat tests/test-results/daw-audio/daw-audio-test-report.json
```

## Quick Reference

### Commands
```bash
npm run test:audio              # All audio tests
npm run test:audio:daw          # DAW tests only
npm run test:audio:ai-music     # AI music tests only
npm run test:audio:example      # Example test
npm run test:audio:headed       # Visual browser mode
npm run test:audio:report       # Generate HTML report
```

### Key Files
```
audio-test-framework.ts         # Main testing class
audio-analyzer.ts               # Quality analysis
daw-audio-tests.spec.ts         # DAW test suite
ai-music-generation-tests.spec.ts  # AI music test suite
comprehensive-audio-example.spec.ts  # Full example
```

### Quality Targets
```
LUFS: -14 ± 1 LUFS
True Peak: < -1 dBFS
Clipping: < 0.01%
DC Offset: < 1%
Sample Rate: 44.1 kHz or 48 kHz
```

## Success!

You're now ready to test audio functionality in DAWG AI!

Start with the example test, explore the documentation, and write your own tests as needed.

Happy testing! 🎵
