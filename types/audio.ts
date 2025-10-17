export interface Recording {
  id: string;
  blob: Blob;
  duration: number;
  createdAt: Date;
  waveformData?: number[];
}

export interface Track {
  id: string;
  name: string;
  type: 'vocal' | 'instrumental' | 'ai-generated';
  recordings: Recording[];
  activeRecordingId: string | null;
  volume: number; // 0-1
  pan: number; // -1 to 1 (left to right)
  muted: boolean;
  solo: boolean;
  effects: Effect[];
}

export interface Effect {
  id: string;
  type: 'eq' | 'compressor' | 'reverb' | 'delay';
  enabled: boolean;
  parameters: Record<string, number>;
}

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
}
