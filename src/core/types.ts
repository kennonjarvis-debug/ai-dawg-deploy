/**
 * Core Types for DAWG AI
 */

export interface Recording {
  id: string;
  duration: number;
  createdAt: Date;
  waveformData?: number[];

  // S3 storage (preferred for saved projects)
  s3Key?: string;
  s3Url?: string;

  // Local blob storage (for unsaved recordings)
  blob?: Blob;
  url?: string;

  // Metadata
  startTime?: number; // Position in project timeline (ms)
  name?: string;
}

export interface Track {
  id: string;
  name: string;
  type: 'audio' | 'midi';
  color: string;
  volume: number; // 0-100
  pan: number; // -50 to +50 (0 is center)
  solo: boolean;
  mute: boolean;
  recordArm: boolean;
  recordings: Recording[];
  activeRecordingId?: string;
  inputDeviceId?: string; // Audio input device ID
  outputDeviceId?: string; // Audio output device ID (for monitoring)
  createdAt: Date;
  order?: number; // Track order in project
}

export interface Project {
  id?: string; // undefined for new projects
  name: string;
  bpm: number;
  timeSignature: string;
  createdAt?: Date;
  updatedAt?: Date;
  userId?: string;
}

export type TrackType = 'audio' | 'midi';

export const TRACK_COLORS = [
  '#ef4444', // red
  '#f59e0b', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
];

export function getRandomTrackColor(): string {
  const color = TRACK_COLORS[Math.floor(Math.random() * TRACK_COLORS.length)];
  return color ?? '#00e5ff';
}
