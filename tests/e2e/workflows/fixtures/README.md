# Test Fixtures

This directory contains test fixtures for E2E workflow tests.

## Audio Files

For testing purposes, you can use the following approaches:

### 1. Generate Test Audio Files

You can generate simple test audio files using:

```bash
# Generate a 5-second 440Hz tone (WAV)
ffmpeg -f lavfi -i "sine=frequency=440:duration=5" -ar 48000 test-audio.wav

# Generate a more complex test file with multiple frequencies
ffmpeg -f lavfi -i "sine=frequency=440:duration=2, sine=frequency=880:duration=2" test-melody.wav

# Generate silent audio for quick tests
ffmpeg -f lavfi -i anullsrc=r=48000:cl=stereo -t 3 test-silent.wav
```

### 2. Use Sample Audio

Place sample audio files here with these naming conventions:

- `test-audio.wav` - Basic test audio (any simple recording)
- `test-melody.wav` - Melody for melody-to-vocals testing
- `test-full-mix.wav` - Full mix for stem separation testing
- `test-unmastered.wav` - Unmastered track for mastering tests
- `test-vocal-sample.wav` - Vocal sample for live analysis

### 3. Mock Data

For tests that don't require actual audio processing, the tests use in-memory buffers:

```typescript
Buffer.from('mock audio data')
```

## File Format Requirements

- **Format**: WAV, MP3, FLAC, M4A
- **Sample Rate**: 44100 Hz or 48000 Hz recommended
- **Bit Depth**: 16-bit or 24-bit
- **Channels**: Mono or Stereo
- **Max Size**: 100 MB (for practical test execution)

## Generating Fixtures

Run this script to generate all required test fixtures:

```bash
npm run generate-fixtures
```

Or manually:

```bash
cd tests/e2e/workflows/fixtures
./generate-test-audio.sh
```

## Important Notes

- Do not commit large audio files to the repository
- Use `.gitignore` to exclude `*.wav`, `*.mp3` files
- Generate fixtures locally or in CI/CD pipeline
- For CI, use minimal duration files (1-3 seconds) for speed
