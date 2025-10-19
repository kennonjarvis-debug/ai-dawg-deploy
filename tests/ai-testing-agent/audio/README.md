# Audio Testing Framework for DAWG AI

Comprehensive audio testing capabilities for DAW and AI music features using Web Audio API and Playwright.

## Overview

This framework provides end-to-end audio testing including:
- Audio file loading and validation (MP3, WAV, OGG)
- Audio quality analysis (LUFS, clipping, DC offset)
- DAW audio system testing
- AI music generation validation
- WebSocket audio streaming tests

## Architecture

### Core Components

1. **audio-test-framework.ts**
   - Main audio testing class
   - Load and parse audio files
   - Run integrity checks
   - Integration with Playwright for browser audio testing

2. **audio-analyzer.ts**
   - FFT analysis
   - LUFS measurement (ITU-R BS.1770 standard)
   - Clipping detection
   - True peak level detection
   - DC offset detection
   - Stereo imaging analysis
   - Spectral analysis

3. **daw-audio-tests.spec.ts**
   - Playwright tests for DAW audio system
   - Test audio engine initialization
   - Verify mixer controls (volume, panning)
   - Test effects processing (EQ, compression)
   - Validate multi-track routing
   - Test transport controls

4. **ai-music-generation-tests.spec.ts**
   - Test music generation workflow
   - Verify Suno AI integration
   - Validate audio quality metrics
   - Test audio download and streaming
   - Test lyrics-to-music pipeline

## Features

### Audio File Loading
```typescript
const audioFramework = new AudioTestFramework(page);
await audioFramework.initialize();

// Load audio file
const audioFile = await audioFramework.loadAudioFile('test.wav');

// Verify integrity
const integrity = await audioFramework.verifyAudioIntegrity(audioFile);

// Test loading performance
const loadResult = await audioFramework.testAudioLoading(audioFile);
```

### Audio Quality Analysis
```typescript
const audioAnalyzer = new AudioAnalyzer(page);

// Comprehensive analysis
const metrics = await audioAnalyzer.analyzeAudio(audioBuffer);

// Specific analyses
const lufs = await audioAnalyzer.measureLUFS(audioBuffer);
const clipping = await audioAnalyzer.detectClipping(audioBuffer);
const stereo = await audioAnalyzer.analyzeStereoImaging(audioBuffer);
const fft = await audioAnalyzer.performFFTAnalysis(audioBuffer);
```

### Audio Quality Metrics

#### LUFS (Loudness Units Full Scale)
- **ITU-R BS.1770 Standard**: Industry standard for measuring loudness
- **Integrated LUFS**: Overall loudness of entire audio
- **Short-term LUFS**: Loudness over 3-second window
- **Momentary LUFS**: Loudness over 400ms window
- **Target Range**: -14 LUFS (music streaming standard)

#### True Peak Detection
- Detects inter-sample peaks that could cause clipping
- Target: Below -1 dBFS to prevent clipping on all devices

#### Clipping Analysis
- Detects samples at or near maximum amplitude (>0.99)
- Reports percentage of clipped samples
- Identifies left/right channel clipping separately

#### DC Offset
- Measures average signal offset from zero
- Indicates recording or processing issues
- Should be below 1% for clean audio

#### Stereo Imaging
- **Correlation Coefficient**: -1 (out of phase) to 1 (mono)
- **Stereo Width**: 0 (mono) to 1+ (wide stereo)
- **Phase Coherence**: How well left/right channels align

#### Spectral Analysis
- **Low Frequency Energy**: 0-200 Hz (bass)
- **Mid Frequency Energy**: 200-2000 Hz (vocals, instruments)
- **High Frequency Energy**: 2000-20000 Hz (air, brilliance)
- **Spectral Balance**: bass-heavy | mid-focused | bright | balanced

### DAW Audio Tests

The framework tests all core DAW functionality:

1. **Audio Engine**
   - Initialization and configuration
   - Sample rate and buffer size
   - Latency measurement

2. **Track Management**
   - Create/delete tracks
   - Load audio files
   - Track routing

3. **Mixer Operations**
   - Volume control (gain)
   - Panning (stereo positioning)
   - Mute/solo functionality

4. **Effects Processing**
   - EQ (low-shelf, peaking, high-shelf)
   - Compression (dynamics)
   - Reverb, delay (time-based)

5. **Transport Controls**
   - Play/pause/stop
   - Timeline navigation
   - Loop functionality

### AI Music Generation Tests

Comprehensive testing of AI music features:

1. **Suno AI Integration**
   - Service availability checks
   - API request/response validation
   - Error handling

2. **Music Generation**
   - Prompt-based generation
   - Genre and tempo specification
   - Duration control
   - Instrumental vs vocal tracks

3. **Beat Generation**
   - Genre-specific beats (hip-hop, trap, lo-fi, etc.)
   - Tempo ranges
   - Beat patterns

4. **Lyrics-to-Music**
   - Custom lyrics input
   - Vocal synthesis quality
   - Lyrics timing and synchronization

5. **Quality Validation**
   - Automated quality checks
   - LUFS level validation
   - Clipping detection
   - Format compatibility

## Running Tests

### Run All Audio Tests
```bash
npm run test:audio
```

### Run DAW Audio Tests
```bash
npx playwright test tests/ai-testing-agent/audio/daw-audio-tests.spec.ts
```

### Run AI Music Generation Tests
```bash
npx playwright test tests/ai-testing-agent/audio/ai-music-generation-tests.spec.ts
```

### Run with Headed Browser (Visual)
```bash
npx playwright test tests/ai-testing-agent/audio/daw-audio-tests.spec.ts --headed
```

### Generate Test Reports
```bash
npx playwright test tests/ai-testing-agent/audio --reporter=html
```

## Test Audio Files

The `test-audio-files/` directory contains sample audio files for testing:

### Synthetic Test Files
- **test-440hz.wav**: 1s sine wave at 440 Hz (A4 note)
- **test-1khz.wav**: 1s sine wave at 1000 Hz
- **test-stereo.wav**: 2s stereo test with different L/R frequencies
- **test-quiet.wav**: Low volume audio for LUFS testing
- **test-loud.wav**: High volume audio for clipping detection

### Real Audio Samples
- **sample-music-short.mp3**: 30s music sample
- **sample-beat.wav**: 8-bar drum beat
- **sample-vocals.ogg**: Vocal sample for processing tests

## Quality Standards

The framework validates against these standards:

### Audio Quality Targets
- **LUFS**: -14 LUFS ± 1 (music streaming standard)
- **True Peak**: < -1 dBFS (prevent clipping)
- **Clipping**: < 0.01% of samples
- **DC Offset**: < 1% average offset
- **Sample Rate**: 44.1 kHz or 48 kHz
- **Bit Depth**: 16-bit or 24-bit

### Performance Targets
- **Audio Loading**: < 500ms for 30s file
- **Playback Latency**: < 50ms
- **Generation Time**: < 90s (Suno AI)
- **Analysis Time**: < 2s per file

## Technical Implementation

### Web Audio API
The framework uses the Web Audio API for all audio operations:
- AudioContext for audio processing
- AudioBuffer for audio data
- AnalyserNode for FFT analysis
- BiquadFilterNode for EQ
- DynamicsCompressorNode for compression
- GainNode for volume control
- StereoPannerNode for panning

### No External Dependencies
All audio analysis is implemented using Web Audio API:
- Custom LUFS calculation (ITU-R BS.1770)
- Native FFT analysis via AnalyserNode
- Pure JavaScript signal processing
- Browser-native audio decoding

### Playwright Integration
Tests run in real browser environment:
- Actual Web Audio API behavior
- Real audio rendering
- Browser-specific quirks detected
- Visual feedback via screenshots

## Example Test Output

```
=== Testing Audio Quality Analysis ===

Audio Quality Metrics: {
  sampleRate: 44100,
  numberOfChannels: 2,
  duration: 30.0,
  integratedLUFS: -12.45,
  truePeakDBFS: -2.31,
  hasClipping: false,
  hasDCOffset: false,
  stereoWidth: 0.65,
  spectralBalance: 'balanced',
  overallQuality: 'excellent',
  qualityScore: 95
}

✓ Sample rate matches target (44.1 kHz)
✓ No clipping detected
✓ LUFS within target range (-14 ± 1)
✓ True peak below -1 dBFS
✓ No DC offset detected
✓ Stereo imaging verified
✓ Overall quality: EXCELLENT (95/100)
```

## Continuous Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# .github/workflows/audio-tests.yml
name: Audio Tests

on: [push, pull_request]

jobs:
  audio-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npx playwright test tests/ai-testing-agent/audio
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: audio-test-results
          path: tests/test-results/
```

## Troubleshooting

### Audio Not Playing
- Check browser autoplay policies
- Ensure AudioContext is resumed after user interaction
- Verify audio format compatibility

### LUFS Measurement Inaccurate
- Ensure sufficient audio duration (>30s recommended)
- Verify K-weighting filter is applied correctly
- Check for DC offset in source audio

### Performance Issues
- Reduce FFT size for faster analysis
- Use Web Workers for heavy computations
- Cache decoded audio buffers

## Future Enhancements

- [ ] Real-time audio streaming analysis
- [ ] ML-based quality prediction
- [ ] Automated mixing suggestions
- [ ] Multi-language vocal detection
- [ ] Genre classification
- [ ] Key and chord detection
- [ ] Beat and rhythm analysis
- [ ] Audio fingerprinting
- [ ] A/B quality comparison
- [ ] Batch processing capabilities

## Contributing

To add new audio tests:

1. Create test file in `tests/ai-testing-agent/audio/`
2. Import `AudioTestFramework` and `AudioAnalyzer`
3. Write Playwright test cases
4. Add documentation to this README
5. Submit pull request

## License

MIT License - See LICENSE file for details
