# Test Audio Files

This directory contains sample audio files for testing the DAWG AI audio system.

## File Categories

### Synthetic Test Tones
These files are generated programmatically for precise testing:

- **test-440hz.wav**: 1-second sine wave at 440 Hz (A4 note)
  - Use for: Basic playback testing, frequency analysis
  - Sample Rate: 44100 Hz
  - Bit Depth: 16-bit
  - Channels: Stereo

- **test-1khz.wav**: 1-second sine wave at 1000 Hz
  - Use for: Frequency response testing
  - Sample Rate: 44100 Hz
  - Bit Depth: 16-bit
  - Channels: Stereo

- **test-stereo.wav**: 2-second stereo test (440 Hz left, 880 Hz right)
  - Use for: Stereo separation testing
  - Sample Rate: 44100 Hz
  - Bit Depth: 16-bit
  - Channels: Stereo

### Quality Testing Files

- **test-quiet.wav**: Low volume audio (-30 LUFS)
  - Use for: LUFS measurement validation
  - Duration: 5 seconds
  - Expected LUFS: -30 to -25

- **test-loud.wav**: High volume audio (-6 LUFS)
  - Use for: Peak limiting and clipping detection
  - Duration: 5 seconds
  - Expected LUFS: -8 to -6

- **test-dc-offset.wav**: Audio with intentional DC offset
  - Use for: DC offset detection validation
  - DC Offset: ~5% on left channel

### Format Compatibility Files

- **sample-music.mp3**: 30-second music sample
  - Format: MP3 @ 320kbps
  - Use for: MP3 decoding and playback
  - Sample Rate: 44100 Hz

- **sample-beat.wav**: 8-bar drum beat
  - Format: WAV (uncompressed)
  - Use for: DAW track loading
  - Duration: ~15 seconds
  - BPM: 120

- **sample-vocals.ogg**: Vocal sample
  - Format: OGG Vorbis
  - Use for: Vocal processing tests
  - Duration: 10 seconds

## Generating Test Files

Test files can be generated using the AudioTestFramework:

```typescript
import { AudioTestFramework } from '../audio-test-framework';

// In a Playwright test
const audioFramework = new AudioTestFramework(page);
await audioFramework.initialize();

// Generate 440 Hz test tone
await audioFramework.createTestAudioFile(
  'test-440hz.wav',
  1,    // duration in seconds
  440,  // frequency in Hz
  44100 // sample rate
);
```

## File Specifications

All test files adhere to these specifications:

- **Sample Rates**: 44100 Hz or 48000 Hz
- **Bit Depths**: 16-bit or 24-bit
- **Formats**: WAV (PCM), MP3, OGG Vorbis
- **Channels**: Mono or Stereo
- **No Clipping**: All peaks below -1 dBFS
- **No DC Offset**: Average offset < 0.01

## Using Test Files in Tests

```typescript
// Load a test file
const audioFile = await audioFramework.loadAudioFile('test-440hz.wav');

// Verify integrity
const integrity = await audioFramework.verifyAudioIntegrity(audioFile);
expect(integrity.valid).toBe(true);

// Test loading
const loadResult = await audioFramework.testAudioLoading(audioFile);
expect(loadResult.success).toBe(true);

// Test playback
const playbackTest = await audioFramework.testAudioPlayback(audioFile);
expect(playbackTest.canPlay).toBe(true);
```

## Expected Test Results

### test-440hz.wav
- Duration: 1.0s ± 0.01s
- Frequency: 440 Hz ± 1 Hz
- LUFS: -10 to -15
- No clipping detected
- Stereo correlation: ~1.0 (mono signal)

### test-stereo.wav
- Duration: 2.0s ± 0.01s
- Left frequency: 440 Hz
- Right frequency: 880 Hz
- Stereo correlation: < 0.5 (wide stereo)
- No clipping detected

### sample-beat.wav
- Duration: ~15s
- BPM: 120
- Format: WAV PCM
- No clipping detected
- Spectral balance: Bass-heavy

## Adding New Test Files

When adding new test files:

1. Follow naming convention: `test-[description].wav`
2. Document in this README
3. Include metadata (duration, sample rate, etc.)
4. Ensure file passes integrity checks
5. Add corresponding test cases

## File Size Guidelines

- Synthetic tones: < 1 MB
- Short samples: < 5 MB
- Full-length tests: < 50 MB

Keep files as small as practical to maintain fast test execution.

## License

Test audio files are either:
- Synthetically generated (no copyright)
- Public domain samples
- Licensed for testing purposes

Do not use copyrighted material without permission.
