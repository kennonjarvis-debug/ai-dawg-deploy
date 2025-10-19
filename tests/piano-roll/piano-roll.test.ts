/**
 * Piano Roll Editor Tests
 */

import { describe, it, expect } from 'vitest';
import {
  MIDINote,
  MIDITrack,
  MIDIProject,
  quantizeTime,
  applySwing,
  humanizeNote,
  getMIDINoteName,
  isBlackKey,
  getVelocityColor,
} from '../../src/types/midi';
import { MIDIParser } from '../../src/backend/services/midi-parser';

describe('MIDI Types', () => {
  describe('getMIDINoteName', () => {
    it('should return correct note names', () => {
      expect(getMIDINoteName(60)).toBe('C4');
      expect(getMIDINoteName(61)).toBe('C#4');
      expect(getMIDINoteName(62)).toBe('D4');
      expect(getMIDINoteName(69)).toBe('A4');
      expect(getMIDINoteName(72)).toBe('C5');
    });
  });

  describe('isBlackKey', () => {
    it('should identify black keys', () => {
      expect(isBlackKey(61)).toBe(true); // C#
      expect(isBlackKey(63)).toBe(true); // D#
      expect(isBlackKey(66)).toBe(true); // F#
      expect(isBlackKey(68)).toBe(true); // G#
      expect(isBlackKey(70)).toBe(true); // A#
    });

    it('should identify white keys', () => {
      expect(isBlackKey(60)).toBe(false); // C
      expect(isBlackKey(62)).toBe(false); // D
      expect(isBlackKey(64)).toBe(false); // E
      expect(isBlackKey(65)).toBe(false); // F
      expect(isBlackKey(67)).toBe(false); // G
    });
  });

  describe('getVelocityColor', () => {
    it('should return correct colors for velocity ranges', () => {
      expect(getVelocityColor(20)).toBe('#4a5568'); // very low
      expect(getVelocityColor(50)).toBe('#718096'); // low
      expect(getVelocityColor(80)).toBe('#38b2ac'); // medium
      expect(getVelocityColor(100)).toBe('#4299e1'); // high
      expect(getVelocityColor(120)).toBe('#9f7aea'); // very high
    });
  });
});

describe('Quantization', () => {
  describe('quantizeTime', () => {
    it('should quantize to 16th notes', () => {
      expect(quantizeTime(0.32, 16, 1.0)).toBeCloseTo(0.25, 2);
      expect(quantizeTime(0.63, 16, 1.0)).toBeCloseTo(0.625, 2);
      expect(quantizeTime(1.12, 16, 1.0)).toBeCloseTo(1.125, 2);
    });

    it('should apply strength parameter', () => {
      const time = 0.32;
      const quantized = quantizeTime(time, 16, 1.0);
      const halfQuantized = quantizeTime(time, 16, 0.5);

      expect(halfQuantized).toBeGreaterThan(time);
      expect(halfQuantized).toBeLessThan(quantized);
    });

    it('should quantize to different divisions', () => {
      const time = 0.6;
      expect(quantizeTime(time, 4, 1.0)).toBeCloseTo(0.5, 1); // quarter notes
      expect(quantizeTime(time, 8, 1.0)).toBeCloseTo(0.625, 2); // 8th notes
      expect(quantizeTime(time, 16, 1.0)).toBeCloseTo(0.625, 2); // 16th notes
    });
  });

  describe('applySwing', () => {
    it('should apply swing to off-beats', () => {
      const swing = 0.5;
      const evenBeat = applySwing(0.5, 16, swing);
      const oddBeat = applySwing(0.625, 16, swing);

      expect(evenBeat).toBe(0.5); // No swing on even beats
      expect(oddBeat).toBeGreaterThan(0.625); // Swing on odd beats
    });
  });
});

describe('Humanization', () => {
  it('should add random variations to notes', () => {
    const note: MIDINote = {
      id: 'test',
      pitch: 60,
      velocity: 100,
      startTime: 1.0,
      duration: 0.5,
      channel: 0,
    };

    const humanized = humanizeNote(note, 0.2);

    // Should be different but close
    expect(humanized.startTime).not.toBe(note.startTime);
    expect(humanized.velocity).not.toBe(note.velocity);
    expect(Math.abs(humanized.startTime - note.startTime)).toBeLessThan(0.05);
    expect(Math.abs(humanized.velocity - note.velocity)).toBeLessThan(10);

    // Should not change other properties
    expect(humanized.pitch).toBe(note.pitch);
    expect(humanized.duration).toBe(note.duration);
    expect(humanized.channel).toBe(note.channel);
  });

  it('should not create invalid velocities', () => {
    const note: MIDINote = {
      id: 'test',
      pitch: 60,
      velocity: 5,
      startTime: 1.0,
      duration: 0.5,
      channel: 0,
    };

    const humanized = humanizeNote(note, 1.0);

    expect(humanized.velocity).toBeGreaterThanOrEqual(1);
    expect(humanized.velocity).toBeLessThanOrEqual(127);
  });

  it('should not create negative start times', () => {
    const note: MIDINote = {
      id: 'test',
      pitch: 60,
      velocity: 100,
      startTime: 0.01,
      duration: 0.5,
      channel: 0,
    };

    const humanized = humanizeNote(note, 1.0);

    expect(humanized.startTime).toBeGreaterThanOrEqual(0);
  });
});

describe('MIDIParser', () => {
  describe('createDemoProject', () => {
    it('should create a valid demo project', () => {
      const project = MIDIParser.createDemoProject();

      expect(project.id).toBe('demo');
      expect(project.name).toBe('Demo MIDI Project');
      expect(project.tempo).toBe(120);
      expect(project.timeSignature.numerator).toBe(4);
      expect(project.timeSignature.denominator).toBe(4);
      expect(project.tracks).toHaveLength(2);
    });

    it('should create tracks with notes', () => {
      const project = MIDIParser.createDemoProject();

      expect(project.tracks[0].notes.length).toBeGreaterThan(0);
      expect(project.tracks[1].notes.length).toBeGreaterThan(0);
    });

    it('should create valid notes', () => {
      const project = MIDIParser.createDemoProject();
      const notes = project.tracks[0].notes;

      notes.forEach((note) => {
        expect(note.id).toBeDefined();
        expect(note.pitch).toBeGreaterThanOrEqual(0);
        expect(note.pitch).toBeLessThanOrEqual(127);
        expect(note.velocity).toBeGreaterThanOrEqual(0);
        expect(note.velocity).toBeLessThanOrEqual(127);
        expect(note.startTime).toBeGreaterThanOrEqual(0);
        expect(note.duration).toBeGreaterThan(0);
      });
    });
  });
});

describe('MIDI Project', () => {
  let project: MIDIProject;

  beforeEach(() => {
    project = {
      id: 'test',
      name: 'Test Project',
      tempo: 120,
      timeSignature: { numerator: 4, denominator: 4 },
      tracks: [
        {
          id: 'track-1',
          name: 'Piano',
          notes: [
            {
              id: 'note-1',
              pitch: 60,
              velocity: 100,
              startTime: 0,
              duration: 1,
              channel: 0,
            },
            {
              id: 'note-2',
              pitch: 64,
              velocity: 100,
              startTime: 1,
              duration: 1,
              channel: 0,
            },
          ],
          channel: 0,
          instrument: 'piano',
          volume: 0.8,
          pan: 0,
          mute: false,
          solo: false,
          color: '#3b82f6',
        },
      ],
      duration: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  it('should have valid structure', () => {
    expect(project.id).toBeDefined();
    expect(project.name).toBeDefined();
    expect(project.tempo).toBeGreaterThan(0);
    expect(project.tracks).toBeInstanceOf(Array);
    expect(project.duration).toBeGreaterThan(0);
  });

  it('should support adding notes', () => {
    const track = project.tracks[0];
    const initialCount = track.notes.length;

    const newNote: MIDINote = {
      id: 'note-3',
      pitch: 67,
      velocity: 100,
      startTime: 2,
      duration: 1,
      channel: 0,
    };

    track.notes.push(newNote);

    expect(track.notes.length).toBe(initialCount + 1);
    expect(track.notes[track.notes.length - 1]).toBe(newNote);
  });

  it('should support removing notes', () => {
    const track = project.tracks[0];
    const initialCount = track.notes.length;

    track.notes = track.notes.filter((note) => note.id !== 'note-1');

    expect(track.notes.length).toBe(initialCount - 1);
    expect(track.notes.find((n) => n.id === 'note-1')).toBeUndefined();
  });

  it('should support multiple tracks', () => {
    const newTrack: MIDITrack = {
      id: 'track-2',
      name: 'Bass',
      notes: [],
      channel: 1,
      instrument: 'bass',
      volume: 0.7,
      pan: 0,
      mute: false,
      solo: false,
      color: '#10b981',
    };

    project.tracks.push(newTrack);

    expect(project.tracks.length).toBe(2);
    expect(project.tracks[1]).toBe(newTrack);
  });
});
