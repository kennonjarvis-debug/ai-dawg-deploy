/**
 * MIDI Service - Backend service for MIDI operations
 */

import { MIDIProject, MIDINote, MIDITrack } from '../../types/midi';
import * as Tone from 'tone';

export interface MIDIServiceConfig {
  storageDir?: string;
  maxFileSize?: number;
}

export class MIDIService {
  private config: MIDIServiceConfig;

  constructor(config: MIDIServiceConfig = {}) {
    this.config = {
      storageDir: config.storageDir || './data/midi',
      maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
    };
  }

  /**
   * Parse MIDI file to MIDIProject
   */
  async parseMIDIFile(buffer: Buffer): Promise<MIDIProject> {
    try {
      // Note: This is a simplified parser. In production, use @tonejs/midi
      const project: MIDIProject = {
        id: `midi-${Date.now()}`,
        name: 'Imported MIDI',
        tempo: 120,
        timeSignature: { numerator: 4, denominator: 4 },
        tracks: [],
        duration: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Parse MIDI file format
      // This is a placeholder - implement with @tonejs/midi
      const header = this.parseMIDIHeader(buffer);
      project.tempo = header.tempo || 120;

      // Parse tracks
      for (let i = 0; i < header.numTracks; i++) {
        const track = this.parseMIDITrack(buffer, i);
        if (track) {
          project.tracks.push(track);
        }
      }

      // Calculate total duration
      project.duration = Math.max(
        ...project.tracks.flatMap((track) =>
          track.notes.map((note) => note.startTime + note.duration)
        ),
        16
      );

      return project;
    } catch (error) {
      console.error('Failed to parse MIDI file:', error);
      throw new Error('Invalid MIDI file format');
    }
  }

  /**
   * Export MIDIProject to MIDI file buffer
   */
  async exportMIDIFile(project: MIDIProject): Promise<Buffer> {
    try {
      // Note: This is a simplified exporter. In production, use @tonejs/midi
      const midiData = this.createMIDIData(project);
      return Buffer.from(midiData);
    } catch (error) {
      console.error('Failed to export MIDI file:', error);
      throw new Error('Failed to export MIDI file');
    }
  }

  /**
   * Convert MIDI to audio using Tone.js
   */
  async renderToAudio(
    project: MIDIProject,
    format: 'wav' | 'mp3' = 'wav',
    duration?: number
  ): Promise<Buffer> {
    try {
      // Initialize offline context
      const renderDuration = duration || project.duration;
      const offlineContext = new Tone.OfflineContext(
        2, // stereo
        renderDuration,
        44100 // sample rate
      );

      // Create synthesizer
      const synth = new Tone.PolySynth(Tone.Synth).toDestination();

      // Schedule all notes from all tracks
      project.tracks.forEach((track) => {
        if (track.mute) return;

        track.notes.forEach((note) => {
          const time = (note.startTime * 60) / project.tempo;
          const duration = (note.duration * 60) / project.tempo;
          const frequency = Tone.Frequency(note.pitch, 'midi').toFrequency();
          const velocity = (note.velocity / 127) * track.volume;

          synth.triggerAttackRelease(frequency, duration, time, velocity);
        });
      });

      // Render
      const buffer = await offlineContext.render();

      // Convert to buffer
      const audioBuffer = this.audioBufferToNodeBuffer(buffer);

      return audioBuffer;
    } catch (error) {
      console.error('Failed to render audio:', error);
      throw new Error('Failed to render audio');
    }
  }

  /**
   * Validate MIDI project
   */
  validateProject(project: MIDIProject): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!project.id) errors.push('Missing project ID');
    if (!project.name) errors.push('Missing project name');
    if (project.tempo < 40 || project.tempo > 300) {
      errors.push('Tempo must be between 40 and 300 BPM');
    }
    if (project.tracks.length === 0) {
      errors.push('Project must have at least one track');
    }

    project.tracks.forEach((track, index) => {
      if (!track.id) errors.push(`Track ${index}: Missing track ID`);
      if (!track.name) errors.push(`Track ${index}: Missing track name`);
      if (track.channel < 0 || track.channel > 15) {
        errors.push(`Track ${index}: Channel must be between 0 and 15`);
      }

      track.notes.forEach((note, noteIndex) => {
        if (note.pitch < 0 || note.pitch > 127) {
          errors.push(`Track ${index}, Note ${noteIndex}: Pitch must be between 0 and 127`);
        }
        if (note.velocity < 0 || note.velocity > 127) {
          errors.push(`Track ${index}, Note ${noteIndex}: Velocity must be between 0 and 127`);
        }
        if (note.startTime < 0) {
          errors.push(`Track ${index}, Note ${noteIndex}: Start time cannot be negative`);
        }
        if (note.duration <= 0) {
          errors.push(`Track ${index}, Note ${noteIndex}: Duration must be positive`);
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Merge multiple MIDI projects
   */
  mergeProjects(projects: MIDIProject[]): MIDIProject {
    if (projects.length === 0) {
      throw new Error('No projects to merge');
    }

    const merged: MIDIProject = {
      id: `merged-${Date.now()}`,
      name: 'Merged MIDI Project',
      tempo: projects[0].tempo,
      timeSignature: projects[0].timeSignature,
      tracks: [],
      duration: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Merge all tracks
    projects.forEach((project, projectIndex) => {
      project.tracks.forEach((track, trackIndex) => {
        merged.tracks.push({
          ...track,
          id: `track-${projectIndex}-${trackIndex}`,
          name: `${project.name} - ${track.name}`,
        });
      });
    });

    // Calculate total duration
    merged.duration = Math.max(
      ...merged.tracks.flatMap((track) =>
        track.notes.map((note) => note.startTime + note.duration)
      )
    );

    return merged;
  }

  /**
   * Transpose notes in a track
   */
  transposeTrack(track: MIDITrack, semitones: number): MIDITrack {
    return {
      ...track,
      notes: track.notes.map((note) => ({
        ...note,
        pitch: Math.max(0, Math.min(127, note.pitch + semitones)),
      })),
    };
  }

  /**
   * Change tempo of project
   */
  changeTempo(project: MIDIProject, newTempo: number): MIDIProject {
    const ratio = newTempo / project.tempo;

    return {
      ...project,
      tempo: newTempo,
      duration: project.duration / ratio,
      tracks: project.tracks.map((track) => ({
        ...track,
        notes: track.notes.map((note) => ({
          ...note,
          startTime: note.startTime / ratio,
          duration: note.duration / ratio,
        })),
      })),
    };
  }

  /**
   * Extract melody from a track (highest pitch at each time)
   */
  extractMelody(track: MIDITrack, resolution: number = 0.25): MIDINote[] {
    const melody: MIDINote[] = [];
    const maxTime = Math.max(...track.notes.map((n) => n.startTime + n.duration), 0);

    for (let time = 0; time < maxTime; time += resolution) {
      const activeNotes = track.notes.filter(
        (note) => note.startTime <= time && note.startTime + note.duration > time
      );

      if (activeNotes.length > 0) {
        // Get highest pitch
        const highestNote = activeNotes.reduce((highest, note) =>
          note.pitch > highest.pitch ? note : highest
        );

        // Add to melody if not duplicate
        const lastMelodyNote = melody[melody.length - 1];
        if (!lastMelodyNote || lastMelodyNote.pitch !== highestNote.pitch) {
          melody.push({
            ...highestNote,
            id: `melody-${melody.length}`,
            startTime: time,
            duration: resolution,
          });
        }
      }
    }

    return melody;
  }

  // Private helper methods

  private parseMIDIHeader(buffer: Buffer): {
    format: number;
    numTracks: number;
    ticksPerBeat: number;
    tempo?: number;
  } {
    // Simplified MIDI header parsing
    // In production, use @tonejs/midi library
    return {
      format: 1,
      numTracks: 1,
      ticksPerBeat: 480,
      tempo: 120,
    };
  }

  private parseMIDITrack(buffer: Buffer, trackIndex: number): MIDITrack | null {
    // Simplified MIDI track parsing
    // In production, use @tonejs/midi library
    return {
      id: `track-${trackIndex}`,
      name: `Track ${trackIndex + 1}`,
      notes: [],
      channel: trackIndex,
      instrument: 'piano',
      volume: 0.8,
      pan: 0,
      mute: false,
      solo: false,
      color: '#3b82f6',
    };
  }

  private createMIDIData(project: MIDIProject): Uint8Array {
    // Simplified MIDI file creation
    // In production, use @tonejs/midi library

    // MIDI header
    const header = new Uint8Array([
      0x4d, 0x54, 0x68, 0x64, // "MThd"
      0x00, 0x00, 0x00, 0x06, // Header length
      0x00, 0x01, // Format 1
      (project.tracks.length >> 8) & 0xff,
      project.tracks.length & 0xff, // Number of tracks
      0x01, 0xe0, // Ticks per quarter note (480)
    ]);

    // Create tracks (simplified)
    const tracks = project.tracks.map((track) => this.createMIDITrackData(track, project.tempo));

    // Combine all data
    const totalLength = header.length + tracks.reduce((sum, t) => sum + t.length, 0);
    const data = new Uint8Array(totalLength);

    data.set(header, 0);
    let offset = header.length;
    tracks.forEach((track) => {
      data.set(track, offset);
      offset += track.length;
    });

    return data;
  }

  private createMIDITrackData(track: MIDITrack, tempo: number): Uint8Array {
    // Simplified track data creation
    // In production, use @tonejs/midi library
    const trackData: number[] = [];

    // Track header
    trackData.push(0x4d, 0x54, 0x72, 0x6b); // "MTrk"

    // Sort notes by start time
    const sortedNotes = [...track.notes].sort((a, b) => a.startTime - b.startTime);

    // Add notes
    let lastTime = 0;
    sortedNotes.forEach((note) => {
      const deltaTime = Math.round((note.startTime - lastTime) * 480);
      const duration = Math.round(note.duration * 480);

      // Note On
      this.writeVarLength(trackData, deltaTime);
      trackData.push(0x90 | track.channel, note.pitch, note.velocity);

      // Note Off
      this.writeVarLength(trackData, duration);
      trackData.push(0x80 | track.channel, note.pitch, 0);

      lastTime = note.startTime + note.duration;
    });

    // End of track
    trackData.push(0x00, 0xff, 0x2f, 0x00);

    // Set track length
    const length = trackData.length - 8;
    trackData.splice(4, 0, (length >> 24) & 0xff, (length >> 16) & 0xff, (length >> 8) & 0xff, length & 0xff);

    return new Uint8Array(trackData);
  }

  private writeVarLength(data: number[], value: number): void {
    // MIDI variable-length quantity encoding
    if (value < 128) {
      data.push(value);
    } else {
      const bytes: number[] = [];
      bytes.push(value & 0x7f);
      value >>= 7;
      while (value > 0) {
        bytes.unshift((value & 0x7f) | 0x80);
        value >>= 7;
      }
      data.push(...bytes);
    }
  }

  private audioBufferToNodeBuffer(audioBuffer: Tone.ToneAudioBuffer): Buffer {
    // Convert Web Audio API AudioBuffer to Node.js Buffer
    // This is a simplified implementation
    const length = audioBuffer.length;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;

    // WAV file header
    const header = this.createWAVHeader(length, numberOfChannels, sampleRate);

    // Interleave channels
    const interleavedData = new Float32Array(length * numberOfChannels);
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const channelData = audioBuffer.toArray(channel);
        if (Array.isArray(channelData)) {
          interleavedData[i * numberOfChannels + channel] = channelData[i];
        }
      }
    }

    // Convert to 16-bit PCM
    const pcmData = new Int16Array(interleavedData.length);
    for (let i = 0; i < interleavedData.length; i++) {
      const sample = Math.max(-1, Math.min(1, interleavedData[i]));
      pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }

    // Combine header and data
    const buffer = Buffer.concat([
      Buffer.from(header),
      Buffer.from(pcmData.buffer),
    ]);

    return buffer;
  }

  private createWAVHeader(
    numSamples: number,
    numChannels: number,
    sampleRate: number
  ): Uint8Array {
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;

    const header = new Uint8Array(44);
    const view = new DataView(header.buffer);

    // RIFF header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataSize, true); // File size - 8
    view.setUint32(8, 0x57415645, false); // "WAVE"

    // fmt chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // Chunk size
    view.setUint16(20, 1, true); // Audio format (PCM)
    view.setUint16(22, numChannels, true); // Number of channels
    view.setUint32(24, sampleRate, true); // Sample rate
    view.setUint32(28, byteRate, true); // Byte rate
    view.setUint16(32, blockAlign, true); // Block align
    view.setUint16(34, bytesPerSample * 8, true); // Bits per sample

    // data chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataSize, true); // Data size

    return header;
  }
}

// Export singleton instance
export const midiService = new MIDIService();
