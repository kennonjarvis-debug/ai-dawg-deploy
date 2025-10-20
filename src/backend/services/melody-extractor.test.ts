/**
 * Test suite for Melody Extractor
 *
 * Tests pitch detection, MIDI conversion, quantization, and edge cases
 */

import {
  MelodyExtractor,
  createAudioBuffer,
  midiToNoteName,
  type MIDINote,
  type PitchContour,
} from './melody-extractor';

describe('MelodyExtractor', () => {
  let extractor: MelodyExtractor;

  beforeEach(() => {
    extractor = new MelodyExtractor({
      bpm: 120,
      key: 'C',
      grid: '1/16',
      minNoteDuration: 0.1,
      minConfidence: 0.5,
    });
  });

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Generate sine wave at specific frequency
   */
  function generateSineWave(
    frequency: number,
    duration: number,
    sampleRate: number = 44100,
    amplitude: number = 0.5
  ): Float32Array {
    const samples = new Float32Array(Math.floor(sampleRate * duration));
    for (let i = 0; i < samples.length; i++) {
      const t = i / sampleRate;
      samples[i] = amplitude * Math.sin(2 * Math.PI * frequency * t);
    }
    return samples;
  }

  /**
   * Generate frequency sweep (glissando)
   */
  function generateFrequencySweep(
    startFreq: number,
    endFreq: number,
    duration: number,
    sampleRate: number = 44100
  ): Float32Array {
    const samples = new Float32Array(Math.floor(sampleRate * duration));
    for (let i = 0; i < samples.length; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
      const freq = startFreq + (endFreq - startFreq) * progress;
      samples[i] = 0.5 * Math.sin(2 * Math.PI * freq * t);
    }
    return samples;
  }

  /**
   * Generate melody (sequence of notes)
   */
  function generateMelody(
    notes: { freq: number; duration: number }[],
    sampleRate: number = 44100
  ): Float32Array {
    const totalDuration = notes.reduce((sum, n) => sum + n.duration, 0);
    const samples = new Float32Array(Math.floor(sampleRate * totalDuration));

    let offset = 0;
    for (const note of notes) {
      const noteSamples = generateSineWave(
        note.freq,
        note.duration,
        sampleRate
      );
      samples.set(noteSamples, offset);
      offset += noteSamples.length;
    }

    return samples;
  }

  /**
   * Add white noise to signal
   */
  function addNoise(samples: Float32Array, noiseLevel: number): Float32Array {
    const noisy = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      noisy[i] = samples[i] + (Math.random() - 0.5) * noiseLevel;
    }
    return noisy;
  }

  // ==================== PITCH TRACKING TESTS ====================

  describe('trackPitch', () => {
    it('should detect single pitch correctly', async () => {
      // Generate A4 (440 Hz)
      const samples = generateSineWave(440, 1.0);
      const audioBuffer = createAudioBuffer(samples);

      const pitchContour = await extractor.trackPitch(audioBuffer, {
        sampleRate: 44100,
      });

      expect(pitchContour.avgFrequency).toBeCloseTo(440, 1);
      expect(pitchContour.voicedPercentage).toBeGreaterThan(0.8);
      expect(pitchContour.frames.length).toBeGreaterThan(0);
    });

    it('should track frequency changes', async () => {
      // Sweep from C4 (261.63 Hz) to C5 (523.25 Hz)
      const samples = generateFrequencySweep(261.63, 523.25, 2.0);
      const audioBuffer = createAudioBuffer(samples);

      const pitchContour = await extractor.trackPitch(audioBuffer, {
        sampleRate: 44100,
      });

      expect(pitchContour.pitchRange.min).toBeCloseTo(261.63, -1);
      expect(pitchContour.pitchRange.max).toBeCloseTo(523.25, -1);
    });

    it('should handle noisy audio', async () => {
      // Generate A4 with noise
      const clean = generateSineWave(440, 1.0);
      const noisy = addNoise(clean, 0.1);
      const audioBuffer = createAudioBuffer(noisy);

      const pitchContour = await extractor.trackPitch(audioBuffer, {
        sampleRate: 44100,
      });

      // Should still detect around 440 Hz despite noise
      expect(pitchContour.avgFrequency).toBeCloseTo(440, 0);
    });

    it('should detect silence (unvoiced)', async () => {
      const samples = new Float32Array(44100); // 1 second of silence
      const audioBuffer = createAudioBuffer(samples);

      const pitchContour = await extractor.trackPitch(audioBuffer, {
        sampleRate: 44100,
      });

      expect(pitchContour.voicedPercentage).toBeLessThan(0.2);
    });
  });

  // ==================== MIDI CONVERSION TESTS ====================

  describe('quantizeToMIDI', () => {
    it('should convert pitch contour to MIDI notes', async () => {
      // Generate C4-E4-G4 sequence (C major triad)
      const samples = generateMelody([
        { freq: 261.63, duration: 0.5 }, // C4
        { freq: 329.63, duration: 0.5 }, // E4
        { freq: 392.0, duration: 0.5 }, // G4
      ]);
      const audioBuffer = createAudioBuffer(samples);

      const pitchContour = await extractor.trackPitch(audioBuffer, {
        sampleRate: 44100,
      });

      const notes = await extractor.quantizeToMIDI(pitchContour, 'C');

      expect(notes.length).toBeGreaterThanOrEqual(3);
      expect(notes[0].pitch).toBe(60); // C4
      expect(notes[1].pitch).toBe(64); // E4
      expect(notes[2].pitch).toBe(67); // G4
    });

    it('should quantize to scale (C major)', async () => {
      // Generate F# (not in C major, should snap to G)
      const samples = generateSineWave(369.99, 1.0); // F#4
      const audioBuffer = createAudioBuffer(samples);

      const pitchContour = await extractor.trackPitch(audioBuffer, {
        sampleRate: 44100,
      });

      const notes = await extractor.quantizeToMIDI(pitchContour, 'C');

      // Should quantize to nearest scale note (G4 = 67)
      expect(notes[0].pitch).toBe(67);
    });

    it('should respect minor key', async () => {
      // Generate melody in A minor
      const samples = generateMelody([
        { freq: 220.0, duration: 0.5 }, // A3
        { freq: 246.94, duration: 0.5 }, // B3
        { freq: 261.63, duration: 0.5 }, // C4
      ]);
      const audioBuffer = createAudioBuffer(samples);

      const pitchContour = await extractor.trackPitch(audioBuffer, {
        sampleRate: 44100,
      });

      const notes = await extractor.quantizeToMIDI(pitchContour, 'Am');

      expect(notes.length).toBeGreaterThanOrEqual(3);
      expect(notes[0].pitch).toBe(57); // A3
      expect(notes[1].pitch).toBe(59); // B3
      expect(notes[2].pitch).toBe(60); // C4
    });
  });

  // ==================== RHYTHM QUANTIZATION TESTS ====================

  describe('quantizeRhythm', () => {
    it('should quantize to 1/16 note grid', async () => {
      const notes: MIDINote[] = [
        {
          pitch: 60,
          start: 0.123, // ~0.246 beats at 120 BPM
          duration: 0.487, // ~0.974 beats
          velocity: 80,
          confidence: 0.9,
        },
      ];

      const quantized = await extractor.quantizeRhythm(notes, 120, '1/16');

      // 1/16 note = 0.25 beats
      expect(quantized[0].start).toBe(0.25); // Snapped to nearest 1/16
      expect(quantized[0].duration).toBe(1.0); // Snapped to nearest 1/16
    });

    it('should handle different grid sizes', async () => {
      const notes: MIDINote[] = [
        {
          pitch: 60,
          start: 0.3, // ~0.6 beats at 120 BPM
          duration: 0.7, // ~1.4 beats
          velocity: 80,
          confidence: 0.9,
        },
      ];

      // Quantize to 1/8 notes (0.5 beats)
      const quantized = await extractor.quantizeRhythm(notes, 120, '1/8');

      expect(quantized[0].start).toBe(0.5); // Snapped to 1/8 grid
      expect(quantized[0].duration).toBeCloseTo(1.5, 1); // Snapped
    });
  });

  // ==================== FULL EXTRACTION TESTS ====================

  describe('extractMelody', () => {
    it('should extract complete melody', async () => {
      // Generate C-D-E-F-G sequence
      const samples = generateMelody([
        { freq: 261.63, duration: 0.3 }, // C4
        { freq: 293.66, duration: 0.3 }, // D4
        { freq: 329.63, duration: 0.3 }, // E4
        { freq: 349.23, duration: 0.3 }, // F4
        { freq: 392.0, duration: 0.3 }, // G4
      ]);
      const audioBuffer = createAudioBuffer(samples);

      const result = await extractor.extractMelody(audioBuffer, {
        bpm: 120,
        key: 'C',
      });

      expect(result.notes.length).toBeGreaterThanOrEqual(5);
      expect(result.metadata.totalNotes).toBe(result.notes.length);
      expect(result.metadata.avgConfidence).toBeGreaterThan(0.5);
      expect(result.metadata.algorithm).toBe('YIN');
    });

    it('should filter short notes', async () => {
      // Generate very short note (50ms) - should be filtered
      const shortNote = generateSineWave(440, 0.05);
      const longNote = generateSineWave(440, 0.5);

      const samples = new Float32Array(shortNote.length + longNote.length);
      samples.set(shortNote, 0);
      samples.set(longNote, shortNote.length);

      const audioBuffer = createAudioBuffer(samples);

      const result = await extractor.extractMelody(audioBuffer, {
        minNoteDuration: 0.1, // 100ms minimum
      });

      // Only long note should remain
      expect(result.notes.length).toBeLessThanOrEqual(1);
    });

    it('should filter low confidence notes', async () => {
      // Generate noisy audio (low confidence)
      const samples = addNoise(generateSineWave(440, 1.0), 0.5);
      const audioBuffer = createAudioBuffer(samples);

      const result = await extractor.extractMelody(audioBuffer, {
        minConfidence: 0.8, // High threshold
      });

      // Most notes should be filtered out
      expect(result.notes.length).toBeLessThan(10);
    });

    it('should handle vibrato', async () => {
      // Generate note with vibrato (440 Hz +/- 5 Hz at 5 Hz rate)
      const sampleRate = 44100;
      const duration = 1.0;
      const samples = new Float32Array(sampleRate * duration);

      for (let i = 0; i < samples.length; i++) {
        const t = i / sampleRate;
        const vibrato = 5 * Math.sin(2 * Math.PI * 5 * t);
        const freq = 440 + vibrato;
        samples[i] = 0.5 * Math.sin(2 * Math.PI * freq * t);
      }

      const audioBuffer = createAudioBuffer(samples);

      const result = await extractor.extractMelody(audioBuffer, {
        smoothingWindow: 5, // Smooth vibrato
      });

      // Should detect as single stable note
      expect(result.notes.length).toBeLessThanOrEqual(2);
      expect(result.notes[0].pitch).toBe(69); // A4 (MIDI 69)
    });
  });

  // ==================== UTILITY TESTS ====================

  describe('Utility functions', () => {
    it('should format MIDI notes correctly', () => {
      expect(midiToNoteName(60)).toBe('C4');
      expect(midiToNoteName(69)).toBe('A4');
      expect(midiToNoteName(72)).toBe('C5');
      expect(midiToNoteName(61)).toBe('C#4');
    });

    it('should create audio buffer', () => {
      const samples = new Float32Array(1000);
      const buffer = createAudioBuffer(samples, 44100);

      expect(buffer.length).toBe(1000);
      expect(buffer.sampleRate).toBe(44100);
      expect(buffer.numberOfChannels).toBe(1);
    });
  });

  // ==================== EDGE CASES ====================

  describe('Edge cases', () => {
    it('should handle empty audio', async () => {
      const samples = new Float32Array(0);
      const audioBuffer = createAudioBuffer(samples);

      const result = await extractor.extractMelody(audioBuffer);

      expect(result.notes.length).toBe(0);
    });

    it('should handle very high pitch', async () => {
      // E6 (1318.51 Hz) - edge of vocal range
      const samples = generateSineWave(1318.51, 0.5);
      const audioBuffer = createAudioBuffer(samples);

      const result = await extractor.extractMelody(audioBuffer, {
        pitchRange: [80, 2000], // Extended range
      });

      expect(result.notes.length).toBeGreaterThan(0);
    });

    it('should handle very low pitch', async () => {
      // E2 (82.41 Hz) - low vocal range
      const samples = generateSineWave(82.41, 0.5);
      const audioBuffer = createAudioBuffer(samples);

      const result = await extractor.extractMelody(audioBuffer, {
        pitchRange: [50, 1000], // Extended range
      });

      expect(result.notes.length).toBeGreaterThan(0);
    });

    it('should handle rapid note changes', async () => {
      // Very fast melody (50ms per note)
      const samples = generateMelody([
        { freq: 261.63, duration: 0.05 },
        { freq: 293.66, duration: 0.05 },
        { freq: 329.63, duration: 0.05 },
        { freq: 349.23, duration: 0.05 },
      ]);
      const audioBuffer = createAudioBuffer(samples);

      const result = await extractor.extractMelody(audioBuffer, {
        minNoteDuration: 0.03, // Allow very short notes
      });

      expect(result.notes.length).toBeGreaterThanOrEqual(3);
    });
  });
});
