# Melody Extractor - Dependencies & Packages

## Current Status: Zero Dependencies Required

The melody extractor is built using **native Web Audio API** and custom-implemented algorithms, requiring **no additional npm packages** for basic functionality.

## Already Available (In package.json)

Great news! These packages are already installed and can be used for enhanced features:

### 1. `pitchfinder` (v2.3.2) ✅
Already installed - can be used as an alternative pitch detection library.

**Usage:**
```typescript
import PitchFinder from 'pitchfinder';

// YIN algorithm (matches our implementation)
const detectPitch = PitchFinder.YIN({ sampleRate: 44100 });
const frequency = detectPitch(audioBuffer);
```

**Algorithms available:**
- YIN
- AMDF (Average Magnitude Difference Function)
- Dynamic Wavelet
- Autocorrelation

### 2. `tone` (v15.1.22) ✅
Already installed - advanced Web Audio framework.

**Usage:**
```typescript
import * as Tone from 'tone';

// Can use for audio playback, synthesis, effects
const synth = new Tone.Synth().toDestination();
notes.forEach(note => {
  synth.triggerAttackRelease(
    Tone.Frequency(note.pitch, 'midi'),
    note.duration,
    note.start
  );
});
```

## Optional Enhancement Packages

These packages are NOT required but can add features:

### For MIDI File Export

```bash
npm install midi-writer-js
```

**Usage:**
```typescript
import MidiWriter from 'midi-writer-js';

const track = new MidiWriter.Track();
notes.forEach(note => {
  track.addEvent(new MidiWriter.NoteEvent({
    pitch: [note.pitch],
    duration: note.duration,
    velocity: note.velocity,
  }));
});

const write = new MidiWriter.Writer(track);
fs.writeFileSync('melody.mid', write.buildFile());
```

### For Audio File Loading (Node.js)

```bash
npm install node-wav
npm install audio-decode
```

**Usage:**
```typescript
import wav from 'node-wav';
import fs from 'fs';

// Decode WAV file
const buffer = fs.readFileSync('audio.wav');
const result = wav.decode(buffer);
const audioBuffer = createAudioBuffer(
  result.channelData[0],
  result.sampleRate
);
```

### For Advanced DSP

```bash
npm install dsp.js
npm install fili  # Digital filter design
```

**Usage:**
```typescript
import Fili from 'fili';

// Create bandpass filter for vocal range
const iirCalculator = new Fili.CalcCascades();
const filterCoeffs = iirCalculator.bandpass({
  order: 4,
  characteristic: 'butterworth',
  Fs: 44100,
  Fc: 300,  // Center frequency
  BW: 500,  // Bandwidth
});
```

### For Machine Learning Enhancement

```bash
npm install @tensorflow/tfjs-node
npm install crepe  # Neural pitch detection
```

**Usage:**
```typescript
import * as crepe from 'crepe';

// More accurate pitch detection using neural network
const { frequency, confidence } = await crepe.predict(audioBuffer);
```

## Web Audio API (Built-in)

No installation needed - available in all modern browsers and Node.js with `web-audio-api` polyfill.

**Key APIs used:**
- `AudioContext` - Audio processing graph
- `AudioBuffer` - Audio data container
- `AnalyserNode` - FFT analysis (not used in current implementation)
- `Float32Array` - Sample data

## TypeScript Types

Already included in your `tsconfig.json`:
```json
{
  "compilerOptions": {
    "lib": ["ES2020", "DOM"]
  }
}
```

Provides types for:
- Web Audio API
- Float32Array / TypedArrays
- Performance API
- Standard library

## Recommended Setup (Minimal)

For basic usage, **NO additional packages needed**:

```bash
# Already have everything needed!
npm test  # Run tests
tsx melody-extractor.example.ts  # Run examples
```

## Recommended Setup (Enhanced)

For production with all features:

```bash
# MIDI export
npm install midi-writer-js

# Audio file loading
npm install node-wav audio-decode

# Optional: Machine learning pitch detection
npm install @tensorflow/tfjs-node crepe
```

## Browser vs Node.js

### Browser
- ✅ Web Audio API native
- ✅ AudioContext available
- ✅ No polyfills needed
- ✅ Can use `<audio>` element

### Node.js
- ✅ Web Audio API via polyfill (if needed)
- ✅ Our implementation works without polyfill
- ⚠️ Need `node-wav` for file loading
- ⚠️ Need `midi-writer-js` for MIDI export

## Performance Libraries (Optional)

For large-scale processing:

```bash
# Web Workers for parallel processing
npm install workerize-loader

# WASM for native-speed DSP
npm install assemblyscript
```

## Testing Utilities

Already have:
- ✅ `vitest` - Unit testing
- ✅ `jest` - Alternative testing
- ✅ `@testing-library/react` - React testing

## Development Tools

Already have:
- ✅ `typescript` - Type safety
- ✅ `tsx` - TS execution
- ✅ `nodemon` - Auto-reload

## Summary

| Feature | Package | Status | Required? |
|---------|---------|--------|-----------|
| Pitch Detection | Custom YIN | ✅ Built-in | ✅ Yes |
| MIDI Conversion | Custom | ✅ Built-in | ✅ Yes |
| Quantization | Custom | ✅ Built-in | ✅ Yes |
| Alternative Pitch | `pitchfinder` | ✅ Installed | ❌ Optional |
| Audio Framework | `tone` | ✅ Installed | ❌ Optional |
| MIDI Export | `midi-writer-js` | ❌ Not installed | ❌ Optional |
| File Loading | `node-wav` | ❌ Not installed | ❌ Optional |
| ML Pitch | `crepe` | ❌ Not installed | ❌ Optional |

## Quick Start Command

```bash
# No installation needed!
cd /Users/benkennon/Projects_Archive/dawg/ai-dawg-deploy
tsx src/backend/services/melody-extractor.example.ts
```

## Adding MIDI Export (Optional)

If you want MIDI file export:

```bash
npm install midi-writer-js
npm install --save-dev @types/midi-writer-js
```

Then use in code:
```typescript
import MidiWriter from 'midi-writer-js';
// ... (see MIDI export example above)
```

## Platform-Specific Notes

### macOS (Your System)
- ✅ All features work
- ✅ Audio APIs available
- ✅ No special setup needed

### Linux
- ✅ All features work
- ⚠️ May need `libasound2-dev` for some audio libs
- Use: `sudo apt-get install libasound2-dev`

### Windows
- ✅ All features work
- ✅ No special setup needed
- ⚠️ Path separators different (handled by Node)

## Troubleshooting

### "AudioContext is not defined"
**Solution:** Add Web Audio API polyfill:
```bash
npm install web-audio-api
```

```typescript
import { AudioContext } from 'web-audio-api';
globalThis.AudioContext = AudioContext;
```

### "Performance is not defined"
**Solution:** Use Node.js built-in:
```typescript
import { performance } from 'perf_hooks';
globalThis.performance = performance;
```

### Module resolution errors
**Solution:** Check `tsconfig.json`:
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

## Version Compatibility

| Node.js | Support |
|---------|---------|
| 16.x    | ✅ Full |
| 18.x    | ✅ Full |
| 20.x    | ✅ Full |
| 22.x    | ✅ Full |

| Browser | Support |
|---------|---------|
| Chrome 90+ | ✅ Full |
| Firefox 88+ | ✅ Full |
| Safari 14+ | ✅ Full |
| Edge 90+ | ✅ Full |

## License Compatibility

All suggested packages are MIT or compatible licenses:
- `pitchfinder` - MIT
- `tone` - MIT
- `midi-writer-js` - MIT
- `node-wav` - MIT
- `crepe` - MIT

Safe for commercial use in AI Dawg.
