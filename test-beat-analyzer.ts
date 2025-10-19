/**
 * Beat Analyzer Test Suite
 *
 * Tests BPM detection, beat tracking, quantization, and MIDI extraction
 * with synthetically generated rhythmic audio
 */

import { BeatAnalyzer } from './src/audio/ai/BeatAnalyzer.js';

// ============================================================================
// TEST AUDIO GENERATION
// ============================================================================

/**
 * Generate a simple kick drum sound
 */
function generateKick(sampleRate: number, duration: number = 0.15): Float32Array {
  const samples = Math.floor(sampleRate * duration);
  const audio = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;

    // Sine sweep from 150Hz to 50Hz (classic 808-style kick)
    const freq = 150 * Math.exp(-t * 15);
    const phase = 2 * Math.PI * freq * t;

    // Exponential envelope
    const envelope = Math.exp(-t * 10);

    audio[i] = Math.sin(phase) * envelope * 0.8;
  }

  return audio;
}

/**
 * Generate a simple snare drum sound
 */
function generateSnare(sampleRate: number, duration: number = 0.1): Float32Array {
  const samples = Math.floor(sampleRate * duration);
  const audio = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;

    // White noise for snare body
    const noise = (Math.random() * 2 - 1);

    // Sine wave for tone (200Hz)
    const tone = Math.sin(2 * Math.PI * 200 * t);

    // Fast decay envelope
    const envelope = Math.exp(-t * 20);

    audio[i] = (noise * 0.7 + tone * 0.3) * envelope * 0.6;
  }

  return audio;
}

/**
 * Generate a hi-hat sound
 */
function generateHiHat(sampleRate: number, duration: number = 0.05): Float32Array {
  const samples = Math.floor(sampleRate * duration);
  const audio = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;

    // High-frequency noise
    const noise = (Math.random() * 2 - 1);

    // Very fast decay
    const envelope = Math.exp(-t * 40);

    audio[i] = noise * envelope * 0.3;
  }

  return audio;
}

/**
 * Generate a simple melody note
 */
function generateNote(frequency: number, sampleRate: number, duration: number = 0.5): Float32Array {
  const samples = Math.floor(sampleRate * duration);
  const audio = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;

    // Sine wave with harmonics
    const fundamental = Math.sin(2 * Math.PI * frequency * t);
    const harmonic2 = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.3;
    const harmonic3 = Math.sin(2 * Math.PI * frequency * 3 * t) * 0.15;

    // ADSR envelope
    let envelope = 1.0;
    const attackTime = 0.01;
    const decayTime = 0.1;
    const sustainLevel = 0.7;
    const releaseTime = 0.2;

    if (t < attackTime) {
      envelope = t / attackTime;
    } else if (t < attackTime + decayTime) {
      const decayProgress = (t - attackTime) / decayTime;
      envelope = 1.0 - (1.0 - sustainLevel) * decayProgress;
    } else if (t < duration - releaseTime) {
      envelope = sustainLevel;
    } else {
      const releaseProgress = (t - (duration - releaseTime)) / releaseTime;
      envelope = sustainLevel * (1.0 - releaseProgress);
    }

    audio[i] = (fundamental + harmonic2 + harmonic3) * envelope * 0.4;
  }

  return audio;
}

/**
 * Generate a drum pattern at a specific BPM
 */
function generateDrumPattern(
  bpm: number,
  sampleRate: number,
  bars: number = 4,
  timeSignature: { numerator: number; denominator: number } = { numerator: 4, denominator: 4 }
): Float32Array {
  const beatsPerBar = timeSignature.numerator;
  const beatDuration = 60 / bpm;  // seconds per beat
  const barDuration = beatDuration * beatsPerBar;
  const totalDuration = barDuration * bars;
  const totalSamples = Math.floor(totalDuration * sampleRate);

  const audio = new Float32Array(totalSamples);

  // Generate drum sounds
  const kick = generateKick(sampleRate);
  const snare = generateSnare(sampleRate);
  const hihat = generateHiHat(sampleRate);

  // Place drums in pattern
  for (let bar = 0; bar < bars; bar++) {
    for (let beat = 0; beat < beatsPerBar; beat++) {
      const beatTime = bar * barDuration + beat * beatDuration;
      const beatSample = Math.floor(beatTime * sampleRate);

      // Kick on beats 1 and 3 (4/4 time)
      if (beat === 0 || beat === 2) {
        mixInSound(audio, kick, beatSample);
      }

      // Snare on beats 2 and 4
      if (beat === 1 || beat === 3) {
        mixInSound(audio, snare, beatSample);
      }

      // Hi-hats on every eighth note
      for (let i = 0; i < 2; i++) {
        const hihatTime = beatTime + i * (beatDuration / 2);
        const hihatSample = Math.floor(hihatTime * sampleRate);
        if (hihatSample < totalSamples) {
          mixInSound(audio, hihat, hihatSample);
        }
      }
    }
  }

  return audio;
}

/**
 * Generate a simple melody
 */
function generateMelody(
  notes: number[],  // MIDI note numbers
  bpm: number,
  sampleRate: number,
  noteDuration: number = 0.5  // beats
): Float32Array {
  const beatDuration = 60 / bpm;
  const noteSeconds = beatDuration * noteDuration;
  const totalDuration = notes.length * noteSeconds;
  const totalSamples = Math.floor(totalDuration * sampleRate);

  const audio = new Float32Array(totalSamples);

  notes.forEach((midiNote, index) => {
    const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);  // A4 = 440Hz = MIDI 69
    const note = generateNote(frequency, sampleRate, noteSeconds);
    const startSample = Math.floor(index * noteSeconds * sampleRate);

    mixInSound(audio, note, startSample);
  });

  return audio;
}

/**
 * Mix a sound into an audio buffer at a specific position
 */
function mixInSound(destination: Float32Array, source: Float32Array, startSample: number): void {
  for (let i = 0; i < source.length && startSample + i < destination.length; i++) {
    destination[startSample + i] += source[i];
  }
}

/**
 * Create an AudioBuffer from Float32Array
 * Mock implementation for Node.js testing
 */
function createAudioBuffer(audioData: Float32Array, sampleRate: number): AudioBuffer {
  // Mock AudioBuffer for Node.js testing
  const buffer: any = {
    length: audioData.length,
    duration: audioData.length / sampleRate,
    sampleRate: sampleRate,
    numberOfChannels: 1,
    getChannelData: (channel: number) => {
      if (channel === 0) return audioData;
      return new Float32Array(audioData.length);
    },
    copyFromChannel: (destination: Float32Array, channelNumber: number, startInChannel?: number) => {
      const start = startInChannel || 0;
      destination.set(audioData.slice(start, start + destination.length));
    },
    copyToChannel: (source: Float32Array, channelNumber: number, startInChannel?: number) => {
      // Not needed for testing
    }
  };
  return buffer as AudioBuffer;
}

// ============================================================================
// TEST SUITE
// ============================================================================

async function runTests() {
  console.log('========================================');
  console.log('BEAT ANALYZER TEST SUITE');
  console.log('========================================\n');

  const analyzer = new BeatAnalyzer();
  const sampleRate = 44100;

  // Test 1: BPM Detection - 120 BPM
  console.log('TEST 1: BPM Detection (120 BPM)');
  console.log('----------------------------------------');
  const audio120 = generateDrumPattern(120, sampleRate, 4);
  const buffer120 = createAudioBuffer(audio120, sampleRate);
  const result120 = await analyzer.analyzeBeat(buffer120);

  console.log(`Detected BPM: ${result120.bpm}`);
  console.log(`Expected BPM: 120`);
  console.log(`Confidence: ${(result120.confidence * 100).toFixed(1)}%`);
  console.log(`Accuracy: ${(100 - Math.abs(result120.bpm - 120) / 120 * 100).toFixed(1)}%`);
  console.log(`Time Signature: ${result120.timeSignature.numerator}/${result120.timeSignature.denominator}`);
  console.log(`Beats Detected: ${result120.beats.length}`);
  console.log(`Downbeats: ${result120.downbeats.length}`);
  console.log(`Measures: ${result120.measures.length}`);
  console.log(`Tempo Stability: ${(result120.tempoStability * 100).toFixed(1)}%\n`);

  // Test 2: BPM Detection - 90 BPM
  console.log('TEST 2: BPM Detection (90 BPM)');
  console.log('----------------------------------------');
  const audio90 = generateDrumPattern(90, sampleRate, 4);
  const buffer90 = createAudioBuffer(audio90, sampleRate);
  const result90 = await analyzer.analyzeBeat(buffer90);

  console.log(`Detected BPM: ${result90.bpm}`);
  console.log(`Expected BPM: 90`);
  console.log(`Confidence: ${(result90.confidence * 100).toFixed(1)}%`);
  console.log(`Accuracy: ${(100 - Math.abs(result90.bpm - 90) / 90 * 100).toFixed(1)}%`);
  console.log(`Tempo Stability: ${(result90.tempoStability * 100).toFixed(1)}%\n`);

  // Test 3: BPM Detection - 140 BPM (faster)
  console.log('TEST 3: BPM Detection (140 BPM)');
  console.log('----------------------------------------');
  const audio140 = generateDrumPattern(140, sampleRate, 4);
  const buffer140 = createAudioBuffer(audio140, sampleRate);
  const result140 = await analyzer.analyzeBeat(buffer140);

  console.log(`Detected BPM: ${result140.bpm}`);
  console.log(`Expected BPM: 140`);
  console.log(`Confidence: ${(result140.confidence * 100).toFixed(1)}%`);
  console.log(`Accuracy: ${(100 - Math.abs(result140.bpm - 140) / 140 * 100).toFixed(1)}%`);
  console.log(`Tempo Stability: ${(result140.tempoStability * 100).toFixed(1)}%\n`);

  // Test 4: MIDI Extraction - C Major Scale
  console.log('TEST 4: MIDI Extraction (C Major Scale)');
  console.log('----------------------------------------');
  const cMajorScale = [60, 62, 64, 65, 67, 69, 71, 72];  // C4 to C5
  const melody = generateMelody(cMajorScale, 120, sampleRate, 0.5);
  const melodyBuffer = createAudioBuffer(melody, sampleRate);
  const midiResult = await analyzer.extractMIDI(melodyBuffer);

  console.log(`Notes Extracted: ${midiResult.notes.length}`);
  console.log(`Expected Notes: ${cMajorScale.length}`);
  console.log(`Detected Key: ${midiResult.key} ${midiResult.scale}`);
  console.log(`Expected Key: C Major`);
  console.log(`Average Pitch: MIDI ${midiResult.averagePitch.toFixed(1)}`);
  console.log('\nExtracted Notes:');
  midiResult.notes.forEach((note, i) => {
    const noteName = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][note.pitch % 12];
    const octave = Math.floor(note.pitch / 12) - 1;
    console.log(`  Note ${i + 1}: ${noteName}${octave} (MIDI ${note.pitch}) - ${note.frequency.toFixed(1)}Hz - Conf: ${(note.confidence * 100).toFixed(1)}%`);
  });
  console.log();

  // Test 5: Time Signature Detection - 3/4 (Waltz)
  console.log('TEST 5: Time Signature Detection (3/4 Waltz)');
  console.log('----------------------------------------');
  const waltz = generateDrumPattern(120, sampleRate, 4, { numerator: 3, denominator: 4 });
  const waltzBuffer = createAudioBuffer(waltz, sampleRate);
  const waltzResult = await analyzer.analyzeBeat(waltzBuffer);

  console.log(`Detected Time Signature: ${waltzResult.timeSignature.numerator}/${waltzResult.timeSignature.denominator}`);
  console.log(`Expected: 3/4`);
  console.log(`Confidence: ${(waltzResult.timeSignature.confidence * 100).toFixed(1)}%`);
  console.log(`Beats per Measure: ${waltzResult.measures[0]?.beatCount || 'N/A'}\n`);

  // Test 6: Beat Positions Accuracy
  console.log('TEST 6: Beat Position Accuracy');
  console.log('----------------------------------------');
  const expectedBeatInterval = 60 / 120;  // 0.5 seconds at 120 BPM
  const beatTimes = result120.beats.map(b => b.time);
  const intervals = [];
  for (let i = 1; i < beatTimes.length; i++) {
    intervals.push(beatTimes[i] - beatTimes[i - 1]);
  }
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const intervalError = Math.abs(avgInterval - expectedBeatInterval);

  console.log(`Expected Beat Interval: ${expectedBeatInterval.toFixed(4)}s`);
  console.log(`Average Detected Interval: ${avgInterval.toFixed(4)}s`);
  console.log(`Timing Error: ${(intervalError * 1000).toFixed(2)}ms`);
  console.log(`Timing Accuracy: ${((1 - intervalError / expectedBeatInterval) * 100).toFixed(1)}%\n`);

  // Test 7: Downbeat Detection
  console.log('TEST 7: Downbeat Detection');
  console.log('----------------------------------------');
  const downbeatTimes = result120.downbeats.map(idx => result120.beats[idx].time);
  const expectedMeasureInterval = 60 / 120 * 4;  // 2 seconds for 4 beats at 120 BPM
  const measureIntervals = [];
  for (let i = 1; i < downbeatTimes.length; i++) {
    measureIntervals.push(downbeatTimes[i] - downbeatTimes[i - 1]);
  }
  const avgMeasureInterval = measureIntervals.reduce((a, b) => a + b, 0) / measureIntervals.length;

  console.log(`Downbeats Detected: ${result120.downbeats.length}`);
  console.log(`Expected Downbeats: 4 (one per measure)`);
  console.log(`Average Measure Duration: ${avgMeasureInterval.toFixed(4)}s`);
  console.log(`Expected Measure Duration: ${expectedMeasureInterval.toFixed(4)}s`);
  console.log(`Measure Timing Accuracy: ${((1 - Math.abs(avgMeasureInterval - expectedMeasureInterval) / expectedMeasureInterval) * 100).toFixed(1)}%\n`);

  // Summary
  console.log('========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');
  console.log(`120 BPM Test: ${Math.abs(result120.bpm - 120) < 5 ? 'PASS' : 'FAIL'} (Error: ${Math.abs(result120.bpm - 120).toFixed(1)} BPM)`);
  console.log(`90 BPM Test: ${Math.abs(result90.bpm - 90) < 5 ? 'PASS' : 'FAIL'} (Error: ${Math.abs(result90.bpm - 90).toFixed(1)} BPM)`);
  console.log(`140 BPM Test: ${Math.abs(result140.bpm - 140) < 5 ? 'PASS' : 'FAIL'} (Error: ${Math.abs(result140.bpm - 140).toFixed(1)} BPM)`);
  console.log(`MIDI Extraction: ${midiResult.notes.length >= cMajorScale.length - 1 ? 'PASS' : 'FAIL'} (${midiResult.notes.length}/${cMajorScale.length} notes)`);
  console.log(`Key Detection: ${midiResult.key === 'C' && midiResult.scale === 'Major' ? 'PASS' : 'FAIL'} (${midiResult.key} ${midiResult.scale})`);
  console.log(`Time Signature: ${waltzResult.timeSignature.numerator === 3 ? 'PASS' : 'FAIL'} (${waltzResult.timeSignature.numerator}/4)`);
  console.log(`Beat Timing: ${intervalError < 0.01 ? 'PASS' : 'WARN'} (${(intervalError * 1000).toFixed(2)}ms error)`);
  console.log(`Downbeat Detection: ${result120.downbeats.length === 4 ? 'PASS' : 'FAIL'} (${result120.downbeats.length}/4 downbeats)`);
  console.log();
}

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests };
