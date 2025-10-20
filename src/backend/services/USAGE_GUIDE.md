# Melody Extractor - Complete Usage Guide

Step-by-step guide for extracting melodies from vocal audio and displaying them in the Piano Roll.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Basic Usage](#basic-usage)
3. [Advanced Features](#advanced-features)
4. [Integration Examples](#integration-examples)
5. [Troubleshooting](#troubleshooting)
6. [Best Practices](#best-practices)

---

## Quick Start

### 1. Import the Service

```typescript
import { MelodyExtractor, createAudioBuffer } from './melody-extractor';
```

### 2. Create an Extractor

```typescript
const extractor = new MelodyExtractor({
  bpm: 120,
  key: 'C',
  grid: '1/16',
  minNoteDuration: 0.1,
  minConfidence: 0.6,
});
```

### 3. Extract Melody

```typescript
const result = await extractor.extractMelody(audioBuffer);

console.log(`Extracted ${result.notes.length} notes`);
console.log(`Average confidence: ${(result.metadata.avgConfidence * 100).toFixed(1)}%`);
```

### 4. Use the Notes

```typescript
result.notes.forEach(note => {
  console.log(`Note: ${midiToNoteName(note.pitch)} @ ${note.start}b`);
});
```

---

## Basic Usage

### Loading Audio

#### From File (Node.js)

```typescript
import fs from 'fs';

async function loadWavFile(filePath: string): Promise<AudioBuffer> {
  // Option 1: Using Web Audio API
  const audioContext = new AudioContext();
  const audioData = fs.readFileSync(filePath);
  return audioContext.decodeAudioData(audioData.buffer);
}
```

#### From Recorded Audio (Browser)

```typescript
// After recording with MediaRecorder
async function extractFromRecording(blob: Blob): Promise<MelodyExtractionResult> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const extractor = new MelodyExtractor({ bpm: 120 });
  return extractor.extractMelody(audioBuffer);
}
```

#### From Microphone Input

```typescript
let mediaRecorder: MediaRecorder;
let audioChunks: Blob[] = [];

// Start recording
async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const result = await extractFromRecording(audioBlob);
    displayInPianoRoll(result.notes);
  };

  mediaRecorder.start();
}

// Stop recording
function stopRecording() {
  mediaRecorder.stop();
}
```

### Configuring Options

```typescript
const extractor = new MelodyExtractor({
  // Musical context
  key: 'Am',              // A minor scale
  bpm: 140,               // Tempo for rhythm quantization

  // Quantization
  grid: '1/16',           // Snap to 16th notes (0.25 beats)

  // Filtering
  minNoteDuration: 0.1,   // Filter notes shorter than 100ms
  minConfidence: 0.6,     // Filter uncertain notes

  // Pitch tracking
  pitchRange: [80, 800],  // Expected vocal range (Hz)
  smoothingWindow: 3,     // Vibrato smoothing (frames)
});
```

### Understanding Results

```typescript
const result = await extractor.extractMelody(audioBuffer);

// Notes array
result.notes.forEach(note => {
  console.log({
    pitch: note.pitch,         // MIDI number (60 = C4)
    noteName: midiToNoteName(note.pitch), // Human-readable
    start: note.start,         // Beat position
    duration: note.duration,   // Beat duration
    velocity: note.velocity,   // Volume (0-127)
    confidence: note.confidence // Quality score (0-1)
  });
});

// Metadata
console.log({
  totalNotes: result.metadata.totalNotes,
  avgConfidence: result.metadata.avgConfidence,
  pitchRange: result.metadata.pitchRange,  // Min/max Hz detected
  voicedPercentage: result.metadata.voicedPercentage, // % of audio with pitch
  processingTime: result.metadata.processingTime, // ms
  algorithm: result.metadata.algorithm,    // 'YIN'
});
```

---

## Advanced Features

### Scale Quantization

Force notes to stay within a specific musical scale:

```typescript
// Major scales
const cMajor = new MelodyExtractor({ key: 'C' });
const gMajor = new MelodyExtractor({ key: 'G' });

// Minor scales
const aMinor = new MelodyExtractor({ key: 'Am' });
const eMinor = new MelodyExtractor({ key: 'Em' });

// Specific variants
const dHarmonicMinor = new MelodyExtractor({ key: 'Dhm' });

// No quantization (chromatic)
const chromatic = new MelodyExtractor({ key: 'chromatic' });
```

### Auto-Key Detection

Find the best-fitting key automatically:

```typescript
async function detectKey(audioBuffer: AudioBuffer): Promise<string> {
  const keys = ['C', 'G', 'D', 'A', 'E', 'F', 'Am', 'Em', 'Dm'];
  const results: { key: string; confidence: number }[] = [];

  for (const key of keys) {
    const extractor = new MelodyExtractor({ key, bpm: 120 });
    const result = await extractor.extractMelody(audioBuffer, { key });
    results.push({ key, confidence: result.metadata.avgConfidence });
  }

  // Return key with highest confidence
  return results.sort((a, b) => b.confidence - a.confidence)[0].key;
}

// Usage
const bestKey = await detectKey(audioBuffer);
const extractor = new MelodyExtractor({ key: bestKey });
```

### Rhythm Quantization Grids

```typescript
// Strict quantization (1/4 notes)
const quarter = new MelodyExtractor({ grid: '1/4' }); // 1 beat

// Normal quantization (1/8 notes)
const eighth = new MelodyExtractor({ grid: '1/8' }); // 0.5 beats

// Fine quantization (1/16 notes)
const sixteenth = new MelodyExtractor({ grid: '1/16' }); // 0.25 beats

// Very fine (1/32 notes)
const thirtySecond = new MelodyExtractor({ grid: '1/32' }); // 0.125 beats
```

### Confidence-Based Filtering

```typescript
// Extract melody
const result = await extractor.extractMelody(audioBuffer);

// Separate notes by confidence
const confident = result.notes.filter(n => n.confidence >= 0.8);
const uncertain = result.notes.filter(n => n.confidence < 0.8 && n.confidence >= 0.6);
const veryUncertain = result.notes.filter(n => n.confidence < 0.6);

console.log(`${confident.length} confident notes`);
console.log(`${uncertain.length} uncertain notes (review these)`);
console.log(`${veryUncertain.length} very uncertain notes (filtered)`);
```

### Custom Pitch Range

```typescript
// Male vocalist (lower range)
const male = new MelodyExtractor({
  pitchRange: [60, 400], // E2 to G4
});

// Female vocalist (higher range)
const female = new MelodyExtractor({
  pitchRange: [160, 1000], // E3 to C6
});

// Instrument (wide range)
const instrument = new MelodyExtractor({
  pitchRange: [40, 2000], // Very wide
});
```

### Vibrato Control

```typescript
// No smoothing (preserve vibrato)
const noSmooth = new MelodyExtractor({ smoothingWindow: 1 });

// Light smoothing
const lightSmooth = new MelodyExtractor({ smoothingWindow: 3 });

// Heavy smoothing (remove vibrato)
const heavySmooth = new MelodyExtractor({ smoothingWindow: 7 });
```

---

## Integration Examples

### Example 1: Freestyle Recording Service

```typescript
// src/backend/services/freestyle-recording.ts

import { MelodyExtractor, type MIDINote } from './melody-extractor';

interface FreestyleSession {
  audioBuffer: AudioBuffer;
  bpm: number;
  key?: string;
}

export class FreestyleRecordingService {
  async processFreestyle(session: FreestyleSession) {
    // 1. Auto-detect key if not provided
    const key = session.key || await this.detectKey(session.audioBuffer);

    // 2. Extract melody
    const extractor = new MelodyExtractor({
      bpm: session.bpm,
      key,
      grid: '1/16',
      minNoteDuration: 0.08, // Allow shorter notes for rap
      minConfidence: 0.5,
      smoothingWindow: 5,
    });

    const result = await extractor.extractMelody(session.audioBuffer);

    // 3. Return formatted data
    return {
      pianoRoll: this.formatForPianoRoll(result.notes),
      metadata: {
        key,
        bpm: session.bpm,
        noteCount: result.notes.length,
        confidence: result.metadata.avgConfidence,
      },
      stats: result.metadata,
    };
  }

  private formatForPianoRoll(notes: MIDINote[]) {
    return notes.map(note => ({
      id: crypto.randomUUID(),
      midi: note.pitch,
      noteName: midiToNoteName(note.pitch),
      time: note.start,
      duration: note.duration,
      velocity: note.velocity / 127, // Normalize to 0-1
      confidence: note.confidence,
      isUncertain: note.confidence < 0.7,
    }));
  }

  private async detectKey(audioBuffer: AudioBuffer): Promise<string> {
    // Implementation from earlier example
    // ...
  }
}
```

### Example 2: Piano Roll Component

```typescript
// src/frontend/components/PianoRoll.tsx

import React, { useEffect, useState } from 'react';

interface PianoRollNote {
  id: string;
  midi: number;
  noteName: string;
  time: number;
  duration: number;
  velocity: number;
  confidence: number;
  isUncertain: boolean;
}

export function PianoRoll({ notes }: { notes: PianoRollNote[] }) {
  return (
    <div className="piano-roll">
      {notes.map(note => (
        <div
          key={note.id}
          className={`note ${note.isUncertain ? 'uncertain' : 'confident'}`}
          style={{
            left: `${note.time * 50}px`,
            width: `${note.duration * 50}px`,
            bottom: `${(note.midi - 48) * 10}px`,
            opacity: note.confidence,
            backgroundColor: note.isUncertain ? '#f59e0b' : '#3b82f6',
          }}
          title={`${note.noteName} - ${(note.confidence * 100).toFixed(0)}%`}
        >
          {note.noteName}
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Real-time Monitoring

```typescript
// Real-time pitch tracking during recording

import { MelodyExtractor } from './melody-extractor';

class RealtimePitchTracker {
  private extractor: MelodyExtractor;
  private audioContext: AudioContext;
  private analyser: AnalyserNode;

  constructor() {
    this.extractor = new MelodyExtractor({ bpm: 120 });
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
  }

  async startTracking(stream: MediaStream) {
    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(this.analyser);

    this.analyser.fftSize = 2048;
    const bufferLength = this.analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);

    // Track pitch every 100ms
    const trackLoop = setInterval(async () => {
      this.analyser.getFloatTimeDomainData(dataArray);

      // Create temporary audio buffer
      const buffer = this.audioContext.createBuffer(
        1,
        bufferLength,
        this.audioContext.sampleRate
      );
      buffer.copyToChannel(dataArray, 0);

      // Track pitch
      const pitchContour = await this.extractor.trackPitch(buffer, {
        sampleRate: this.audioContext.sampleRate,
      });

      // Get current pitch
      const currentFrame = pitchContour.frames[pitchContour.frames.length - 1];
      if (currentFrame?.voiced) {
        this.onPitchDetected(currentFrame.frequency, currentFrame.confidence);
      }
    }, 100);

    return () => clearInterval(trackLoop);
  }

  private onPitchDetected(frequency: number, confidence: number) {
    console.log(`Pitch: ${frequency.toFixed(2)} Hz (${(confidence * 100).toFixed(0)}%)`);

    // Update UI, trigger events, etc.
  }
}
```

### Example 4: MIDI Export

```typescript
// Export extracted melody to MIDI file

import { type MelodyExtractionResult } from './melody-extractor';

function exportToMIDI(result: MelodyExtractionResult, bpm: number = 120) {
  // Simple MIDI format (you can use midi-writer-js for proper export)
  const midiData = {
    header: {
      format: 0,
      numTracks: 1,
      ticksPerBeat: 480,
    },
    tracks: [
      {
        name: 'Extracted Melody',
        instrument: 0, // Acoustic Grand Piano
        events: result.notes.flatMap(note => {
          const startTick = Math.round(note.start * 480);
          const endTick = Math.round((note.start + note.duration) * 480);

          return [
            {
              type: 'noteOn',
              tick: startTick,
              channel: 0,
              note: note.pitch,
              velocity: note.velocity,
            },
            {
              type: 'noteOff',
              tick: endTick,
              channel: 0,
              note: note.pitch,
              velocity: 0,
            },
          ];
        }),
      },
    ],
    tempo: bpm,
  };

  return midiData;
}
```

---

## Troubleshooting

### No Notes Detected

**Problem:** `result.notes.length === 0`

**Solutions:**
```typescript
// 1. Check audio volume
const rms = calculateRMS(audioBuffer.getChannelData(0));
console.log(`Audio RMS: ${rms}`); // Should be > 0.01

// 2. Lower confidence threshold
const extractor = new MelodyExtractor({ minConfidence: 0.3 });

// 3. Widen pitch range
const extractor = new MelodyExtractor({ pitchRange: [40, 2000] });

// 4. Reduce minimum duration
const extractor = new MelodyExtractor({ minNoteDuration: 0.05 });
```

### Too Many Short Notes

**Problem:** Melody is fragmented into many tiny notes

**Solutions:**
```typescript
// 1. Increase minimum duration
const extractor = new MelodyExtractor({ minNoteDuration: 0.15 });

// 2. Increase smoothing
const extractor = new MelodyExtractor({ smoothingWindow: 7 });

// 3. Use coarser grid
const extractor = new MelodyExtractor({ grid: '1/8' });
```

### Wrong Octave

**Problem:** Notes detected one octave too high/low

**Solutions:**
```typescript
// 1. Constrain pitch range
const extractor = new MelodyExtractor({
  pitchRange: [150, 500], // Narrow range forces correct octave
});

// 2. Post-process notes
result.notes.forEach(note => {
  if (note.pitch > 72) note.pitch -= 12; // Shift down one octave
  if (note.pitch < 48) note.pitch += 12; // Shift up one octave
});
```

### Poor Timing

**Problem:** Notes don't align with beats

**Solutions:**
```typescript
// 1. Verify BPM is correct
const correctBPM = 140; // Match your recording

// 2. Use finer grid temporarily
const extractor = new MelodyExtractor({ grid: '1/32' });

// 3. Manual time offset
result.notes.forEach(note => {
  note.start += 0.1; // Shift all notes 0.1 beats forward
});
```

---

## Best Practices

### 1. Audio Quality

```typescript
// Best results with:
// - Sample rate: 44100 Hz or higher
// - Bit depth: 16-bit or higher
// - Format: WAV, FLAC (lossless)
// - Mono audio (or use left channel)
// - No background music
// - Minimal noise
```

### 2. Configuration

```typescript
// For rap/hip-hop:
const rapConfig = {
  bpm: 140,
  key: 'chromatic', // Don't constrain to scale
  grid: '1/16',
  minNoteDuration: 0.08,
  smoothingWindow: 5,
};

// For singing:
const singingConfig = {
  bpm: 120,
  key: 'C', // Constrain to key
  grid: '1/8',
  minNoteDuration: 0.15,
  smoothingWindow: 3,
};

// For humming:
const hummingConfig = {
  bpm: 100,
  key: 'Am',
  grid: '1/16',
  minNoteDuration: 0.2,
  smoothingWindow: 7, // Heavy smoothing
};
```

### 3. Error Handling

```typescript
async function safeExtraction(audioBuffer: AudioBuffer) {
  try {
    const extractor = new MelodyExtractor({ bpm: 120 });
    const result = await extractor.extractMelody(audioBuffer);

    // Validate results
    if (result.notes.length === 0) {
      throw new Error('No notes detected');
    }

    if (result.metadata.avgConfidence < 0.4) {
      console.warn('Low confidence - results may be inaccurate');
    }

    return result;

  } catch (error) {
    console.error('Melody extraction failed:', error);
    return null;
  }
}
```

### 4. Performance

```typescript
// For large files, process in chunks
async function processLargeFile(audioBuffer: AudioBuffer) {
  const chunkSize = 30 * 44100; // 30 seconds
  const allNotes: MIDINote[] = [];

  for (let i = 0; i < audioBuffer.length; i += chunkSize) {
    const chunk = audioBuffer.getChannelData(0).slice(i, i + chunkSize);
    const chunkBuffer = createAudioBuffer(chunk);

    const extractor = new MelodyExtractor({ bpm: 120 });
    const result = await extractor.extractMelody(chunkBuffer);

    // Offset times
    const offset = i / 44100 * 2; // beats
    result.notes.forEach(note => {
      note.start += offset;
      allNotes.push(note);
    });
  }

  return allNotes;
}
```

---

## File Structure

```
src/backend/services/
├── melody-extractor.ts              # Main implementation
├── melody-extractor.test.ts         # Unit tests
├── melody-extractor.example.ts      # Usage examples
├── melody-extractor-pitchfinder.ts  # PitchFinder integration
├── MELODY_EXTRACTOR_README.md       # Technical documentation
├── DEPENDENCIES.md                   # Package requirements
└── USAGE_GUIDE.md                   # This file
```

---

## Next Steps

1. **Run Examples**: `tsx src/backend/services/melody-extractor.example.ts`
2. **Run Tests**: `npm test melody-extractor.test.ts`
3. **Integrate**: Add to your recording service
4. **Customize**: Adjust parameters for your use case
5. **Optimize**: Tune settings based on user feedback

---

## Support

For issues or questions:
- Check [MELODY_EXTRACTOR_README.md](./MELODY_EXTRACTOR_README.md) for technical details
- Review [DEPENDENCIES.md](./DEPENDENCIES.md) for package info
- Run examples to see expected behavior

## License

MIT - Part of AI Dawg platform
