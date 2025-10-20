# Melody Extractor Service

Professional pitch tracking and melody extraction service for converting vocal audio (hums, mumbles, singing) into quantized MIDI notes for piano roll visualization.

## Features

- **YIN Algorithm**: Industry-standard pitch detection with sub-sample accuracy
- **Scale Quantization**: Snap notes to musical keys (major, minor, etc.)
- **Rhythm Quantization**: Align note timings to musical grid (1/16, 1/8, 1/4 notes)
- **Confidence Scoring**: Mark uncertain notes for user review
- **Vibrato Smoothing**: Median filtering to handle pitch wobbles
- **Noise Filtering**: Voiced/unvoiced detection to filter breath sounds
- **Octave Error Correction**: Validates pitch detections for vocal range

## Installation

No external dependencies required! Uses native Web Audio API.

Optional libraries for enhanced functionality:
```bash
# Optional: For file I/O in Node.js
npm install fs

# Optional: For MIDI file export
npm install midi-writer-js
```

## Quick Start

```typescript
import { MelodyExtractor, createAudioBuffer } from './melody-extractor';

// Initialize extractor
const extractor = new MelodyExtractor({
  bpm: 120,
  key: 'C',
  grid: '1/16',
  minNoteDuration: 0.1,
  minConfidence: 0.6,
});

// Extract melody from audio buffer
const result = await extractor.extractMelody(audioBuffer);

console.log(`Extracted ${result.notes.length} notes`);
console.log(`Average confidence: ${result.metadata.avgConfidence}`);

// Use notes in piano roll
result.notes.forEach(note => {
  console.log(`${midiToNoteName(note.pitch)} @ ${note.start}b`);
});
```

## API Reference

### MelodyExtractor Class

#### Constructor Options

```typescript
interface ExtractionOptions {
  key?: string;              // Musical key (e.g., "C", "Dm", "G#")
  bpm: number;               // BPM for rhythm quantization
  grid?: string;             // Quantization grid ("1/16", "1/8", "1/4")
  minNoteDuration?: number;  // Min duration in seconds (default: 0.1)
  minConfidence?: number;    // Min confidence threshold (default: 0.5)
  pitchRange?: [number, number]; // Expected Hz range (default: [80, 800])
  smoothingWindow?: number;  // Vibrato smoothing window (default: 3)
}
```

#### Methods

##### `extractMelody(audio: AudioBuffer, options?: ExtractionOptions): Promise<MelodyExtractionResult>`

Main entry point - extracts complete melody from audio.

**Returns:**
```typescript
{
  notes: MIDINote[];
  metadata: {
    pitchRange: { min: number; max: number };
    avgConfidence: number;
    totalNotes: number;
    voicedPercentage: number;
    processingTime: number;
    algorithm: string;
  };
}
```

##### `trackPitch(audio: AudioBuffer, options?: PitchTrackingOptions): Promise<PitchContour>`

Low-level pitch tracking over time.

**Returns:**
```typescript
{
  frames: PitchFrame[];
  avgFrequency: number;
  pitchRange: { min: number; max: number };
  voicedPercentage: number;
}
```

##### `quantizeToMIDI(pitchContour: PitchContour, key: string): Promise<MIDINote[]>`

Convert pitch contour to MIDI notes with scale quantization.

##### `quantizeRhythm(notes: MIDINote[], bpm: number, grid: string): Promise<MIDINote[]>`

Apply rhythm quantization to snap notes to musical grid.

##### `calculateNoteConfidence(pitchData: PitchFrame[]): number`

Calculate confidence score for a note (0-1).

## Data Structures

### PitchFrame
```typescript
interface PitchFrame {
  time: number;         // Seconds
  frequency: number;    // Hz
  confidence: number;   // 0-1
  voiced: boolean;      // Is pitched sound?
  amplitude: number;    // For velocity calculation
}
```

### MIDINote
```typescript
interface MIDINote {
  pitch: number;        // MIDI note number (60 = C4)
  start: number;        // Beats
  duration: number;     // Beats
  velocity: number;     // 0-127
  confidence: number;   // 0-1
}
```

## Algorithm Details

### YIN Pitch Detection

The YIN algorithm (2002) provides robust monophonic pitch detection:

1. **Difference Function**: Calculate autocorrelation-like function
2. **Cumulative Mean Normalization**: Normalize to reduce octave errors
3. **Absolute Threshold**: Find first local minimum below threshold
4. **Parabolic Interpolation**: Sub-sample accuracy refinement

**Advantages:**
- More accurate than autocorrelation
- Better octave error handling
- Robust to noise
- Fast computation (O(n²) with optimizations)

### Scale Quantization

Notes are snapped to the nearest pitch in the specified key:

```typescript
// Example: Quantize to C major
const cmajor = [C, D, E, F, G, A, B]; // Semitone offsets: [0, 2, 4, 5, 7, 9, 11]

// Input: 61 (C#4) -> Output: 60 (C4) or 62 (D4) - whichever is closer
```

Supported scales:
- Major: `[0, 2, 4, 5, 7, 9, 11]`
- Minor: `[0, 2, 3, 5, 7, 8, 10]`
- Harmonic Minor: `[0, 2, 3, 5, 7, 8, 11]`
- Melodic Minor: `[0, 2, 3, 5, 7, 9, 11]`
- Chromatic: `[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]`

### Vibrato Smoothing

Uses median filtering to smooth pitch wobbles:

```typescript
// Window of 3-5 frames
smoothedFreq = median([frame[i-1], frame[i], frame[i+1]]);
```

Median is robust to outliers while preserving pitch changes.

### Confidence Scoring

Confidence is calculated based on:
1. YIN threshold crossing strength
2. Amplitude weighting
3. Pitch stability (lower variance = higher confidence)

```typescript
confidence = yinConfidence * (0.7 + 0.3 * stabilityFactor)
```

## Usage Examples

### Example 1: Basic Extraction

```typescript
const extractor = new MelodyExtractor({ bpm: 120, key: 'C' });
const result = await extractor.extractMelody(audioBuffer);

result.notes.forEach(note => {
  console.log(`${midiToNoteName(note.pitch)} @ ${note.start.toFixed(2)}b`);
});
```

### Example 2: Freestyle Rap

```typescript
const extractor = new MelodyExtractor({
  bpm: 140,
  key: 'Am',
  grid: '1/16',
  minNoteDuration: 0.08, // Allow shorter notes
  smoothingWindow: 5,     // Heavy smoothing
});

const result = await extractor.extractMelody(vocalAudio);
```

### Example 3: Piano Roll Integration

```typescript
const result = await extractor.extractMelody(audioBuffer);

// Format for piano roll display
const pianoRollNotes = result.notes.map(note => ({
  midi: note.pitch,
  noteName: midiToNoteName(note.pitch),
  time: note.start,
  duration: note.duration,
  velocity: note.velocity / 127,
  isUncertain: note.confidence < 0.7, // Highlight uncertain notes
}));
```

### Example 4: Auto Key Detection

```typescript
const keys = ['C', 'G', 'D', 'Am', 'Em'];
const results = [];

for (const key of keys) {
  const extractor = new MelodyExtractor({ key });
  const result = await extractor.extractMelody(audioBuffer, { key });
  results.push({ key, confidence: result.metadata.avgConfidence });
}

// Best key is one with highest average confidence
const bestKey = results.sort((a, b) => b.confidence - a.confidence)[0].key;
```

## Performance

### Benchmarks (44.1kHz audio)

| Audio Duration | Processing Time | Notes Extracted |
|----------------|-----------------|-----------------|
| 1 second       | ~50-100ms       | 5-10           |
| 5 seconds      | ~200-400ms      | 20-50          |
| 30 seconds     | ~1-2 seconds    | 100-300        |

**Optimization Tips:**
- Increase `hopSize` for faster processing (less accuracy)
- Reduce `smoothingWindow` for faster processing
- Filter audio to vocal range (80-800 Hz) before processing

### Memory Usage

- ~2MB per minute of 44.1kHz mono audio
- Pitch frames: ~100 frames/second × 24 bytes/frame = 2.4KB/s

## Edge Cases Handled

### Vibrato
Smoothed using median filtering over 3-5 frame window.

### Breath Sounds
Filtered using voiced/unvoiced detection (confidence threshold).

### Octave Errors
YIN's cumulative mean normalization + post-processing validation.

### Timing Jitter
Rhythm quantization snaps to musical grid.

### Noise
Minimum confidence threshold filters low-quality detections.

### Rapid Pitch Changes
Configurable `minNoteDuration` prevents note fragmentation.

## Testing

Run tests:
```bash
npm test melody-extractor.test.ts
```

Run examples:
```bash
npm run examples
# or
node melody-extractor.example.ts
```

## Common Issues

### Issue: No notes detected
**Solutions:**
- Check audio volume (should have peaks > 0.1)
- Reduce `minConfidence` threshold
- Verify pitch is in expected range (80-800 Hz for vocals)
- Check audio is mono (use channel 0)

### Issue: Too many fragmented notes
**Solutions:**
- Increase `smoothingWindow` (default: 3, try 5-7)
- Increase `minNoteDuration` (default: 0.1s, try 0.15s)
- Use coarser quantization grid (e.g., 1/8 instead of 1/16)

### Issue: Wrong octave detected
**Solutions:**
- Adjust `pitchRange` to expected vocal range
- Check if audio has strong harmonics (use highpass filter)
- Increase `voicedThreshold` to be more selective

### Issue: Notes in wrong key
**Solutions:**
- Verify key specification (e.g., "Am" not "Aminor")
- Try chromatic scale first to see raw notes
- Use auto key detection to find best fit

## Integration with AI Dawg

### Workflow

1. **Record** - Capture vocal audio during freestyle
2. **Extract** - Run melody extractor on vocal track
3. **Review** - Show notes in piano roll with confidence colors
4. **Edit** - Allow user to adjust uncertain notes
5. **Export** - Generate MIDI file for production use

### Example Integration

```typescript
// In your recording service
import { MelodyExtractor } from './melody-extractor';

async function processFreestyleRecording(audioBuffer: AudioBuffer, bpm: number) {
  const extractor = new MelodyExtractor({
    bpm,
    key: 'auto', // Auto-detect key
    grid: '1/16',
    minConfidence: 0.6,
  });

  const result = await extractor.extractMelody(audioBuffer);

  // Store in database
  await saveMelodyToDB({
    userId,
    sessionId,
    notes: result.notes,
    metadata: result.metadata,
  });

  // Send to frontend
  return {
    pianoRoll: formatForPianoRoll(result),
    stats: result.metadata,
  };
}
```

## References

- YIN Algorithm: de Cheveigné, A., & Kawahara, H. (2002). "YIN, a fundamental frequency estimator for speech and music"
- MIDI Specification: https://www.midi.org/specifications
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

## License

MIT - See main project LICENSE file

## Author

Built for AI Dawg - Hip Hop AI Production Platform
