/**
 * Pro Tools-Style Track Architecture
 * Complete type definitions for 9 track types with automation, inserts, and sends
 */

// ===== TRACK TYPES =====

export type TrackType =
  | 'audio'       // Records waveforms
  | 'midi'        // MIDI data only
  | 'instrument'  // MIDI + audio (virtual instrument)
  | 'aux'         // Mixer channel (no recording)
  | 'master'      // Master fader
  | 'vca'         // Remote fader control (no audio)
  | 'folder';     // Organizational + aux capabilities

// ===== AUTOMATION =====

export type AutomationMode =
  | 'off'          // Retains but doesn't play automation
  | 'read'         // Plays existing automation
  | 'write'        // Overwrites ALL automation (destructive!)
  | 'touch'        // Writes while touching, reverts on release
  | 'latch'        // Continues writing at last value
  | 'touch-latch'  // Volume=touch, others=latch
  | 'trim';        // Modifies existing relatively

export interface AutomationBreakpoint {
  time: number;    // Seconds
  value: number;   // Parameter-dependent range
}

export interface AutomationCurve {
  enabled: boolean;
  breakpoints: AutomationBreakpoint[];
}

export interface AutomationData {
  volume: AutomationCurve;
  pan: AutomationCurve;
  mute: AutomationCurve;
  sends: Map<string, AutomationCurve>;
  plugins: Map<string, Map<string, AutomationCurve>>;  // pluginId -> paramId -> curve
}

// ===== PLUGIN SYSTEM =====

export interface AudioPlugin {
  id: string;
  name: string;
  type: 'eq' | 'dynamics' | 'reverb' | 'delay' | 'instrument' | 'other';
  node: AudioNode | null;
  parameters: Map<string, AudioParam | number>;  // Support both Web Audio and custom params
}

export interface PluginSlot {
  id: string;
  plugin: AudioPlugin | null;
  bypassed: boolean;
  preFader: boolean;  // Inserts are pre-fader except on Master
}

// ===== SEND SYSTEM =====

export interface SendSlot {
  id: string;
  destination: string;  // Bus or track ID
  level: number;        // 0-1
  preFader: boolean;    // Pre/post fader routing
  muted: boolean;
  pan: number;          // -1 to 1
}

// ===== TRACK CONFIGURATION =====

export interface TrackConfig {
  id: string;
  type: TrackType;
  name: string;

  // Channel format (set at creation, can't change)
  channelFormat: 'mono' | 'stereo' | 'multichannel';
  channelCount: number;

  // Header controls
  recordEnabled: boolean;      // Record arm
  solo: boolean;
  mute: boolean;
  inputMonitoring: boolean;    // Hear input during recording

  // Routing
  inputDevice: string | null;   // Audio input device ID
  outputDevice: string | null;  // Audio output device ID

  // Processing
  insertSlots: PluginSlot[];   // Max 10, serial processing
  sendSlots: SendSlot[];        // Max 10, parallel routing

  // Automation
  automationMode: AutomationMode;
  automationData: AutomationData;

  // Volume/Pan (separate from automation playback values)
  volume: number;     // 0-1
  pan: number;        // -1 to 1

  // VCA assignments (can belong to multiple VCAs)
  vcaGroups: string[];

  // Color coding (visual organization)
  color: string;

  // Track order (for UI display)
  order?: number;
}

// ===== TRACK EVENTS =====

export type TrackEvent =
  | { type: 'record-armed'; trackId: string; }
  | { type: 'record-disarmed'; trackId: string; }
  | { type: 'solo-changed'; trackId: string; solo: boolean; }
  | { type: 'mute-changed'; trackId: string; mute: boolean; }
  | { type: 'input-monitoring-changed'; trackId: string; enabled: boolean; }
  | { type: 'automation-mode-changed'; trackId: string; mode: AutomationMode; }
  | { type: 'automation-write-warning'; trackId: string; message: string; }
  | { type: 'insert-added'; trackId: string; slot: number; plugin: AudioPlugin; }
  | { type: 'insert-removed'; trackId: string; slot: number; }
  | { type: 'insert-bypassed'; trackId: string; slot: number; bypassed: boolean; }
  | { type: 'send-added'; trackId: string; destination: string; preFader: boolean; }
  | { type: 'send-removed'; trackId: string; slot: number; }
  | { type: 'send-level-changed'; trackId: string; slot: number; level: number; }
  | { type: 'input-device-changed'; trackId: string; deviceId: string; }
  | { type: 'output-device-changed'; trackId: string; deviceId: string; };

// ===== FACTORY FUNCTIONS =====

/**
 * Create empty automation data structure
 */
export function createEmptyAutomationData(): AutomationData {
  return {
    volume: { enabled: false, breakpoints: [] },
    pan: { enabled: false, breakpoints: [] },
    mute: { enabled: false, breakpoints: [] },
    sends: new Map(),
    plugins: new Map(),
  };
}

/**
 * Create empty plugin slots (10 slots)
 */
export function createEmptyPluginSlots(trackType: TrackType): PluginSlot[] {
  const preFader = trackType !== 'master'; // Master inserts are post-fader

  return Array(10).fill(null).map((_, i) => ({
    id: `insert-${i}`,
    plugin: null,
    bypassed: false,
    preFader,
  }));
}

/**
 * Create default track config
 */
export function createDefaultTrackConfig(
  type: TrackType,
  name: string,
  id?: string
): TrackConfig {
  return {
    id: id || `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    name,
    channelFormat: 'stereo',
    channelCount: 2,
    recordEnabled: false,
    solo: false,
    mute: false,
    inputMonitoring: false,
    inputDevice: null,
    outputDevice: null,
    insertSlots: createEmptyPluginSlots(type),
    sendSlots: [],
    automationMode: 'read',
    automationData: createEmptyAutomationData(),
    volume: 0.8,
    pan: 0,
    vcaGroups: [],
    color: generateTrackColor(type),
  };
}

/**
 * Generate color based on track type
 */
function generateTrackColor(type: TrackType): string {
  const colorMap: Record<TrackType, string> = {
    audio: '#3b82f6',      // Blue
    midi: '#8b5cf6',       // Purple
    instrument: '#ec4899', // Pink
    aux: '#22c55e',        // Green
    master: '#ef4444',     // Red
    vca: '#f59e0b',        // Orange
    folder: '#6b7280',     // Gray
  };

  return colorMap[type] || '#3b82f6';
}

// ===== VALIDATION =====

/**
 * Check if track type supports recording
 */
export function canRecordTrackType(type: TrackType): boolean {
  return type === 'audio' || type === 'instrument';
}

/**
 * Check if track type supports MIDI
 */
export function supportsMIDI(type: TrackType): boolean {
  return type === 'midi' || type === 'instrument';
}

/**
 * Check if track type has audio routing
 */
export function hasAudioRouting(type: TrackType): boolean {
  return type !== 'vca' && type !== 'folder';
}

/**
 * Check if insert slot number is valid
 */
export function isValidInsertSlot(slot: number): boolean {
  return slot >= 0 && slot < 10;
}

/**
 * Check if send count is within limit
 */
export function canAddSend(track: TrackConfig): boolean {
  return track.sendSlots.length < 10;
}
