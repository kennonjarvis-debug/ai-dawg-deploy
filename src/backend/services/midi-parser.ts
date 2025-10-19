/**
 * MIDI Parser - Enhanced MIDI file parsing using @tonejs/midi
 */

import { Midi } from '@tonejs/midi';
import { MIDIProject, MIDITrack, MIDINote } from '../../types/midi';

export class MIDIParser {
  /**
   * Parse MIDI file to MIDIProject using @tonejs/midi
   */
  static async parseMIDIFile(buffer: ArrayBuffer): Promise<MIDIProject> {
    try {
      const midi = new Midi(buffer);

      const project: MIDIProject = {
        id: `midi-${Date.now()}`,
        name: midi.name || 'Imported MIDI',
        tempo: midi.header.tempos[0]?.bpm || 120,
        timeSignature: {
          numerator: midi.header.timeSignatures[0]?.timeSignature[0] || 4,
          denominator: midi.header.timeSignatures[0]?.timeSignature[1] || 4,
        },
        tracks: [],
        duration: midi.duration,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Parse tracks
      midi.tracks.forEach((track, index) => {
        const midiTrack: MIDITrack = {
          id: `track-${index}`,
          name: track.name || `Track ${index + 1}`,
          notes: [],
          channel: track.channel || 0,
          instrument: track.instrument?.name || 'piano',
          volume: 0.8,
          pan: 0,
          mute: false,
          solo: false,
          color: this.getTrackColor(index),
        };

        // Parse notes
        track.notes.forEach((note, noteIndex) => {
          const midiNote: MIDINote = {
            id: `note-${index}-${noteIndex}`,
            pitch: note.midi,
            velocity: Math.round(note.velocity * 127),
            startTime: this.timeToBeats(note.time, project.tempo),
            duration: this.timeToBeats(note.duration, project.tempo),
            channel: track.channel || 0,
          };

          midiTrack.notes.push(midiNote);
        });

        if (midiTrack.notes.length > 0) {
          project.tracks.push(midiTrack);
        }
      });

      return project;
    } catch (error) {
      console.error('Failed to parse MIDI file:', error);
      throw new Error('Invalid MIDI file format');
    }
  }

  /**
   * Export MIDIProject to MIDI file using @tonejs/midi
   */
  static exportMIDIFile(project: MIDIProject): ArrayBuffer {
    try {
      const midi = new Midi();

      // Set header
      midi.header.setTempo(project.tempo);
      midi.header.timeSignatures = [
        {
          ticks: 0,
          timeSignature: [project.timeSignature.numerator, project.timeSignature.denominator],
          measures: 0,
        },
      ];

      // Add tracks
      project.tracks.forEach((track) => {
        if (track.mute) return;

        const midiTrack = midi.addTrack();
        midiTrack.name = track.name;
        midiTrack.channel = track.channel;

        // Add notes
        track.notes.forEach((note) => {
          midiTrack.addNote({
            midi: note.pitch,
            time: this.beatsToTime(note.startTime, project.tempo),
            duration: this.beatsToTime(note.duration, project.tempo),
            velocity: note.velocity / 127,
          });
        });
      });

      return midi.toArray();
    } catch (error) {
      console.error('Failed to export MIDI file:', error);
      throw new Error('Failed to export MIDI file');
    }
  }

  /**
   * Create a simple demo MIDI project
   */
  static createDemoProject(): MIDIProject {
    const project: MIDIProject = {
      id: 'demo',
      name: 'Demo MIDI Project',
      tempo: 120,
      timeSignature: { numerator: 4, denominator: 4 },
      tracks: [
        {
          id: 'track-1',
          name: 'Piano',
          notes: [
            // C major scale
            { id: 'n1', pitch: 60, velocity: 100, startTime: 0, duration: 0.5, channel: 0 },
            { id: 'n2', pitch: 62, velocity: 100, startTime: 0.5, duration: 0.5, channel: 0 },
            { id: 'n3', pitch: 64, velocity: 100, startTime: 1, duration: 0.5, channel: 0 },
            { id: 'n4', pitch: 65, velocity: 100, startTime: 1.5, duration: 0.5, channel: 0 },
            { id: 'n5', pitch: 67, velocity: 100, startTime: 2, duration: 0.5, channel: 0 },
            { id: 'n6', pitch: 69, velocity: 100, startTime: 2.5, duration: 0.5, channel: 0 },
            { id: 'n7', pitch: 71, velocity: 100, startTime: 3, duration: 0.5, channel: 0 },
            { id: 'n8', pitch: 72, velocity: 100, startTime: 3.5, duration: 0.5, channel: 0 },
            // C major chord
            { id: 'n9', pitch: 60, velocity: 80, startTime: 4, duration: 2, channel: 0 },
            { id: 'n10', pitch: 64, velocity: 80, startTime: 4, duration: 2, channel: 0 },
            { id: 'n11', pitch: 67, velocity: 80, startTime: 4, duration: 2, channel: 0 },
            // Simple melody
            { id: 'n12', pitch: 72, velocity: 110, startTime: 6, duration: 0.5, channel: 0 },
            { id: 'n13', pitch: 71, velocity: 100, startTime: 6.5, duration: 0.5, channel: 0 },
            { id: 'n14', pitch: 69, velocity: 100, startTime: 7, duration: 0.5, channel: 0 },
            { id: 'n15', pitch: 67, velocity: 100, startTime: 7.5, duration: 0.5, channel: 0 },
            { id: 'n16', pitch: 65, velocity: 90, startTime: 8, duration: 1, channel: 0 },
          ],
          channel: 0,
          instrument: 'piano',
          volume: 0.8,
          pan: 0,
          mute: false,
          solo: false,
          color: '#3b82f6',
        },
        {
          id: 'track-2',
          name: 'Bass',
          notes: [
            { id: 'b1', pitch: 36, velocity: 90, startTime: 0, duration: 1, channel: 1 },
            { id: 'b2', pitch: 36, velocity: 90, startTime: 2, duration: 1, channel: 1 },
            { id: 'b3', pitch: 36, velocity: 90, startTime: 4, duration: 1, channel: 1 },
            { id: 'b4', pitch: 36, velocity: 90, startTime: 6, duration: 1, channel: 1 },
            { id: 'b5', pitch: 36, velocity: 90, startTime: 8, duration: 1, channel: 1 },
          ],
          channel: 1,
          instrument: 'bass',
          volume: 0.7,
          pan: 0,
          mute: false,
          solo: false,
          color: '#10b981',
        },
      ],
      duration: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return project;
  }

  // Helper methods

  private static timeToBeats(seconds: number, tempo: number): number {
    return (seconds * tempo) / 60;
  }

  private static beatsToTime(beats: number, tempo: number): number {
    return (beats * 60) / tempo;
  }

  private static getTrackColor(index: number): string {
    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#f97316', // orange
    ];
    return colors[index % colors.length];
  }
}
