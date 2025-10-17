/**
 * Transport Controls Type Definitions
 */

export type TransportState = 'stopped' | 'playing' | 'paused' | 'recording';

export interface TransportControlsConfig {
  showRecordButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
  enableKeyboardShortcuts?: boolean;
}

export interface TransportEvent {
  type: 'play' | 'pause' | 'stop' | 'record';
  timestamp: number;
}

export interface KeyboardShortcut {
  key: string;
  action: () => void;
  description: string;
}
