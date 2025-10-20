/**
 * Practical Usage Examples for Melody Extractor
 *
 * Shows real-world integration scenarios for the AI Dawg app
 */

import {
  MelodyExtractor,
  createAudioBuffer,
  midiToNoteName,
  type MelodyExtractionResult,
  type MIDINote,
} from './melody-extractor';

// ==================== EXAMPLE 1: Basic Extraction ====================

/**
 * Extract melody from recorded vocal audio
 */
export async function basicMelodyExtraction() {
  console.log('=== Basic Melody Extraction ===\n');

  // Initialize extractor
  const extractor = new MelodyExtractor({
    bpm: 120,
    key: 'C',
    grid: '1/16',
    minNoteDuration: 0.1,
    minConfidence: 0.6,
  });

  // Generate test audio: C major scale
  const sampleRate = 44100;
  const noteDuration = 0.4;
  const frequencies = [
    261.63, // C4
    293.66, // D4
    329.63, // E4
    349.23, // F4
    392.0, // G4
    440.0, // A4
    493.88, // B4
    523.25, // C5
  ];

  // Create audio buffer
  const totalSamples = frequencies.length * noteDuration * sampleRate;
  const samples = new Float32Array(totalSamples);

  let offset = 0;
  for (const freq of frequencies) {
    const noteSamples = Math.floor(noteDuration * sampleRate);
    for (let i = 0; i < noteSamples; i++) {
      const t = i / sampleRate;
      samples[offset + i] = 0.5 * Math.sin(2 * Math.PI * freq * t);
    }
    offset += noteSamples;
  }

  const audioBuffer = createAudioBuffer(samples, sampleRate);

  // Extract melody
  const result = await extractor.extractMelody(audioBuffer);

  // Display results
  console.log(`Extracted ${result.notes.length} notes`);
  console.log(
    `Average confidence: ${(result.metadata.avgConfidence * 100).toFixed(1)}%`
  );
  console.log(
    `Pitch range: ${result.metadata.pitchRange.min.toFixed(1)} - ${result.metadata.pitchRange.max.toFixed(1)} Hz`
  );
  console.log(`Processing time: ${result.metadata.processingTime.toFixed(0)}ms\n`);

  console.log('Notes:');
  result.notes.forEach((note, i) => {
    console.log(
      `  ${i + 1}. ${midiToNoteName(note.pitch).padEnd(4)} | ` +
        `Beat ${note.start.toFixed(2)} | ` +
        `Duration ${note.duration.toFixed(2)}b | ` +
        `Velocity ${note.velocity} | ` +
        `Confidence ${(note.confidence * 100).toFixed(0)}%`
    );
  });

  return result;
}

// ==================== EXAMPLE 2: Real-time Freestyle Recording ====================

/**
 * Simulate extracting melody from a freestyle vocal recording
 */
export async function freestyleMelodyExtraction() {
  console.log('\n=== Freestyle Recording Melody Extraction ===\n');

  const extractor = new MelodyExtractor({
    bpm: 140, // Typical rap/freestyle BPM
    key: 'Am', // A minor
    grid: '1/16',
    minNoteDuration: 0.08, // Allow shorter notes for rap
    minConfidence: 0.5,
    smoothingWindow: 5, // Heavy smoothing for raw vocals
  });

  // Simulate a hummed melody with some variation
  const sampleRate = 44100;
  const samples = new Float32Array(sampleRate * 4); // 4 seconds

  // Create a melodic phrase
  const phrase = [
    { freq: 220, duration: 0.3 }, // A3
    { freq: 246.94, duration: 0.2 }, // B3
    { freq: 261.63, duration: 0.4 }, // C4
    { freq: 246.94, duration: 0.2 }, // B3
    { freq: 220, duration: 0.3 }, // A3
    { freq: 196, duration: 0.5 }, // G3
    { freq: 220, duration: 0.4 }, // A3
    { freq: 261.63, duration: 0.6 }, // C4
  ];

  let offset = 0;
  for (const note of phrase) {
    const noteSamples = Math.floor(note.duration * sampleRate);
    for (let i = 0; i < noteSamples; i++) {
      const t = i / sampleRate;
      // Add slight vibrato for realism
      const vibrato = 3 * Math.sin(2 * Math.PI * 5 * t);
      const freq = note.freq + vibrato;
      // Add some noise
      const noise = (Math.random() - 0.5) * 0.05;
      samples[offset + i] = 0.4 * Math.sin(2 * Math.PI * freq * t) + noise;
    }
    offset += noteSamples;
  }

  const audioBuffer = createAudioBuffer(samples, sampleRate);

  // Extract melody
  const result = await extractor.extractMelody(audioBuffer, {
    key: 'Am',
    bpm: 140,
  });

  console.log(`Detected ${result.notes.length} melodic notes`);
  console.log(`Key: A minor`);
  console.log(`BPM: 140\n`);

  console.log('Melody:');
  result.notes.forEach((note, i) => {
    const noteName = midiToNoteName(note.pitch);
    const confidence = note.confidence;
    const flag = confidence < 0.7 ? ' [UNCERTAIN]' : '';
    console.log(
      `  ${noteName.padEnd(4)} @ ${note.start.toFixed(2)}b (${note.duration.toFixed(2)}b) - ${(confidence * 100).toFixed(0)}%${flag}`
    );
  });

  return result;
}

// ==================== EXAMPLE 3: Integration with Piano Roll ====================

/**
 * Format extracted melody for Piano Roll display
 */
export function formatForPianoRoll(result: MelodyExtractionResult) {
  console.log('\n=== Piano Roll Format ===\n');

  // Convert to piano roll format (JSON)
  const pianoRollData = {
    tracks: [
      {
        name: 'Extracted Melody',
        instrument: 'piano',
        notes: result.notes.map((note) => ({
          midi: note.pitch,
          noteName: midiToNoteName(note.pitch),
          time: note.start,
          duration: note.duration,
          velocity: note.velocity / 127, // Normalize to 0-1
          confidence: note.confidence,
          // Flag uncertain notes for visual highlighting
          isUncertain: note.confidence < 0.7,
        })),
      },
    ],
    metadata: {
      totalNotes: result.metadata.totalNotes,
      avgConfidence: result.metadata.avgConfidence,
      processingTime: result.metadata.processingTime,
    },
  };

  console.log(JSON.stringify(pianoRollData, null, 2));

  return pianoRollData;
}

// ==================== EXAMPLE 4: Multi-Key Detection ====================

/**
 * Try extracting melody in different keys to find best fit
 */
export async function autoKeyDetection() {
  console.log('\n=== Auto Key Detection ===\n');

  // Generate melody in G major
  const sampleRate = 44100;
  const melody = [
    { freq: 392.0, duration: 0.3 }, // G4
    { freq: 440.0, duration: 0.3 }, // A4
    { freq: 493.88, duration: 0.3 }, // B4
    { freq: 523.25, duration: 0.3 }, // C5
  ];

  const totalSamples = melody.length * 0.3 * sampleRate;
  const samples = new Float32Array(totalSamples);

  let offset = 0;
  for (const note of melody) {
    const noteSamples = Math.floor(note.duration * sampleRate);
    for (let i = 0; i < noteSamples; i++) {
      const t = i / sampleRate;
      samples[offset + i] = 0.5 * Math.sin(2 * Math.PI * note.freq * t);
    }
    offset += noteSamples;
  }

  const audioBuffer = createAudioBuffer(samples, sampleRate);

  // Try different keys
  const keys = ['C', 'G', 'D', 'Am', 'Em'];
  const results: { key: string; confidence: number }[] = [];

  for (const key of keys) {
    const extractor = new MelodyExtractor({ key, bpm: 120 });
    const result = await extractor.extractMelody(audioBuffer, { key });
    results.push({
      key,
      confidence: result.metadata.avgConfidence,
    });
  }

  // Find best key
  results.sort((a, b) => b.confidence - a.confidence);

  console.log('Key detection results:');
  results.forEach((r, i) => {
    const indicator = i === 0 ? ' <-- BEST FIT' : '';
    console.log(`  ${r.key.padEnd(3)}: ${(r.confidence * 100).toFixed(1)}%${indicator}`);
  });

  return results[0].key;
}

// ==================== EXAMPLE 5: Export to MIDI File ====================

/**
 * Export extracted melody to MIDI file format
 */
export function exportToMIDI(result: MelodyExtractionResult, bpm: number = 120) {
  console.log('\n=== MIDI Export ===\n');

  // Simple MIDI file structure (for demonstration)
  const midiData = {
    header: {
      format: 0, // Single track
      numTracks: 1,
      ticksPerBeat: 480,
    },
    tracks: [
      {
        events: result.notes.flatMap((note) => {
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

  console.log('MIDI File Structure:');
  console.log(`  Format: ${midiData.header.format}`);
  console.log(`  Tracks: ${midiData.header.numTracks}`);
  console.log(`  Ticks per beat: ${midiData.header.ticksPerBeat}`);
  console.log(`  Tempo: ${midiData.tempo} BPM`);
  console.log(`  Total events: ${midiData.tracks[0].events.length}`);

  return midiData;
}

// ==================== EXAMPLE 6: Confidence Heatmap ====================

/**
 * Generate confidence visualization data
 */
export function generateConfidenceHeatmap(result: MelodyExtractionResult) {
  console.log('\n=== Confidence Heatmap ===\n');

  // Group notes by confidence ranges
  const ranges = [
    { min: 0.9, max: 1.0, label: 'Excellent', color: '#22c55e' },
    { min: 0.8, max: 0.9, label: 'Good', color: '#84cc16' },
    { min: 0.7, max: 0.8, label: 'Fair', color: '#eab308' },
    { min: 0.6, max: 0.7, label: 'Poor', color: '#f97316' },
    { min: 0.0, max: 0.6, label: 'Very Poor', color: '#ef4444' },
  ];

  const distribution = ranges.map((range) => ({
    ...range,
    count: result.notes.filter(
      (n) => n.confidence >= range.min && n.confidence < range.max
    ).length,
  }));

  console.log('Confidence Distribution:');
  distribution.forEach((d) => {
    const percentage = (d.count / result.notes.length) * 100;
    const bar = '█'.repeat(Math.round(percentage / 2));
    console.log(`  ${d.label.padEnd(12)} ${bar} ${percentage.toFixed(1)}%`);
  });

  return distribution;
}

// ==================== EXAMPLE 7: Run All Examples ====================

/**
 * Run all examples in sequence
 */
export async function runAllExamples() {
  try {
    await basicMelodyExtraction();

    const freestyleResult = await freestyleMelodyExtraction();
    formatForPianoRoll(freestyleResult);

    await autoKeyDetection();

    // Use freestyle result for export examples
    exportToMIDI(freestyleResult, 140);
    generateConfidenceHeatmap(freestyleResult);

    console.log('\n✓ All examples completed successfully!\n');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Auto-run if executed directly
if (require.main === module) {
  runAllExamples();
}
