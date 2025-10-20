/**
 * Project Serialization Utilities
 * Convert between Zustand store state and API format
 */

import type { Track, Recording, Project } from '$lib/../core/types';

export interface SerializedRecording {
  id: string;
  startTime: number;
  duration: number;
  s3Key?: string;
  name?: string;
}

export interface SerializedTrack {
  id: string;
  name: string;
  type: 'audio' | 'midi';
  color: string;
  volume: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  order: number;
  inputDeviceId?: string;
  outputDeviceId?: string;
  recordings: SerializedRecording[];
}

export interface SerializedProject {
  project: Project;
  tracks: SerializedTrack[];
}

/**
 * Serialize tracks for saving to database
 * Removes Blob data and local-only fields
 */
export function serializeTracks(tracks: Track[]): SerializedTrack[] {
  return tracks.map((track, index) => ({
    id: track.id,
    name: track.name,
    type: track.type,
    color: track.color,
    volume: track.volume,
    pan: track.pan,
    mute: track.mute,
    solo: track.solo,
    order: track.order ?? index,
    inputDeviceId: track.inputDeviceId,
    outputDeviceId: track.outputDeviceId,
    recordings: serializeRecordings(track.recordings),
  }));
}

/**
 * Serialize recordings for saving to database
 * Only includes S3 references, not Blob data
 */
export function serializeRecordings(recordings: Recording[]): SerializedRecording[] {
  return recordings
    .filter((rec) => rec.s3Key) // Only save recordings that are uploaded to S3
    .map((rec) => ({
      id: rec.id,
      startTime: rec.startTime ?? 0,
      duration: rec.duration,
      s3Key: rec.s3Key!,
      name: rec.name,
    }));
}

/**
 * Deserialize tracks from database format
 * Converts to client-side Track format
 */
export function deserializeTracks(serializedTracks: SerializedTrack[]): Track[] {
  return serializedTracks.map((track) => ({
    id: track.id,
    name: track.name,
    type: track.type,
    color: track.color,
    volume: track.volume,
    pan: track.pan,
    mute: track.mute,
    solo: track.solo,
    recordArm: false, // Always start with record arm off
    recordings: deserializeRecordings(track.recordings),
    inputDeviceId: track.inputDeviceId,
    outputDeviceId: track.outputDeviceId,
    createdAt: new Date(),
    order: track.order,
  }));
}

/**
 * Deserialize recordings from database format
 * Converts to client-side Recording format
 */
export function deserializeRecordings(serializedRecs: SerializedRecording[]): Recording[] {
  return serializedRecs.map((rec) => ({
    id: rec.id,
    startTime: rec.startTime,
    duration: rec.duration,
    s3Key: rec.s3Key,
    name: rec.name,
    createdAt: new Date(), // Approximate - real date is in database
    // blob, url, waveformData will be loaded on demand
  }));
}

/**
 * Create API payload for saving a project
 */
export function createSavePayload(
  project: Project,
  tracks: Track[]
): {
  project: Project;
  tracks: SerializedTrack[];
} {
  return {
    project: {
      id: project.id,
      name: project.name,
      bpm: project.bpm,
      timeSignature: project.timeSignature,
    },
    tracks: serializeTracks(tracks),
  };
}

/**
 * Validate that all recordings in tracks are uploaded to S3
 * Returns list of recordings that need uploading
 */
export function getUnsavedRecordings(tracks: Track[]): Array<{
  trackId: string;
  recording: Recording;
}> {
  const unsaved: Array<{ trackId: string; recording: Recording }> = [];

  for (const track of tracks) {
    for (const recording of track.recordings) {
      // Recording has blob but no S3 key = needs upload
      if (recording.blob && !recording.s3Key) {
        unsaved.push({ trackId: track.id, recording });
      }
    }
  }

  return unsaved;
}

/**
 * Check if a project has unsaved recordings
 */
export function hasUnsavedRecordings(tracks: Track[]): boolean {
  return getUnsavedRecordings(tracks).length > 0;
}

/**
 * Get project statistics for display
 */
export function getProjectStats(tracks: Track[]): {
  trackCount: number;
  recordingCount: number;
  totalDuration: number; // seconds
  s3RecordingCount: number;
  localRecordingCount: number;
} {
  let recordingCount = 0;
  let totalDuration = 0;
  let s3RecordingCount = 0;
  let localRecordingCount = 0;

  for (const track of tracks) {
    recordingCount += track.recordings.length;

    for (const rec of track.recordings) {
      totalDuration += rec.duration / 1000; // ms to seconds
      if (rec.s3Key) s3RecordingCount++;
      if (rec.blob) localRecordingCount++;
    }
  }

  return {
    trackCount: tracks.length,
    recordingCount,
    totalDuration,
    s3RecordingCount,
    localRecordingCount,
  };
}
