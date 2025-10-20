/**
 * Freestyle Workflow Type Definitions
 *
 * Shared types for the complete voice-to-music freestyle pipeline
 */

// ============================================================================
// Core Freestyle Types
// ============================================================================

export interface FreestyleConfig {
  projectId: string;
  userId: string;
  autoCreateBeat?: boolean;
  beatStyle?: 'hip-hop' | 'pop' | 'trap' | 'rnb' | 'drill' | 'boom-bap';
  targetKey?: string;
  targetBPM?: number;
  countdown?: number; // Seconds before recording starts (default: 3)
  maxDuration?: number; // Max recording duration in seconds (default: 300)
}

export interface SessionSetup {
  hasBackingTrack: boolean;
  backingTrackId?: string;
  backingTrackUrl?: string;
  vocalTrackId: string;
  vocalTrackArmed: boolean;
  monitoringEnabled: boolean;
  detectedKey?: string;
  detectedBPM?: number;
  projectReady: boolean;
  recommendations: string[];
}

export interface RecordingSetup {
  trackId: string;
  trackName: string;
  armed: boolean;
  monitoring: boolean;
  inputLevel: number;
  outputLevel: number;
  effectsChain: string[];
}

// ============================================================================
// MIDI and Melody Types
// ============================================================================

export interface MIDINote {
  pitch: number; // MIDI note number (0-127)
  start: number; // Start time in seconds
  duration: number; // Duration in seconds
  velocity: number; // Velocity (0-127)
  confidence: number; // Detection confidence (0-1)
}

export interface MIDINotes {
  notes: MIDINote[];
  timeSignature: {
    numerator: number;
    denominator: number;
  };
  key: string;
  scale: 'major' | 'minor';
}

// ============================================================================
// Lyrics Types
// ============================================================================

export type LyricSection =
  | 'intro'
  | 'verse'
  | 'pre-chorus'
  | 'chorus'
  | 'bridge'
  | 'outro';

export interface EnhancedLyric {
  text: string;
  timestamp: number;
  start: number;
  end: number;
  section?: LyricSection;
  sectionNumber?: number;
  rhymeScheme?: string;
  syllableCount?: number;
  stressPattern?: string;
  confidence: number;
  suggestions?: string[];
}

export interface LyricSegment {
  text: string;
  timestamp: number;
  start?: number;
  end?: number;
  isEditable?: boolean;
}

export interface SectionLabel {
  lineStart: number;
  lineEnd: number;
  sectionType: LyricSection | 'hook' | 'unknown';
  sectionNumber?: number;
  confidence: number;
  reasoning?: string;
}

// ============================================================================
// Analysis Types
// ============================================================================

export interface AnalysisMetadata {
  key: string;
  bpm: number;
  timeSignature: string;
  duration: number;
  sampleRate: number;
}

export interface AnalysisConfidence {
  melody: number;
  lyrics: number;
  key: number;
  stemSeparation?: number;
}

export interface ProcessingStage {
  name: string;
  duration: number;
  success: boolean;
  error?: string;
}

export interface ProcessingInfo {
  startTime: Date;
  endTime: Date;
  duration: number;
  stages: ProcessingStage[];
}

export interface AnalysisResult {
  metadata: AnalysisMetadata;
  separatedVocals?: AudioBuffer;
  separatedVocalsUrl?: string;
  melody?: MIDINotes;
  enhancedLyrics: EnhancedLyric[];
  confidence: AnalysisConfidence;
  processing: ProcessingInfo;
}

// ============================================================================
// Session Types
// ============================================================================

export type FreestyleSessionStatus =
  | 'preparing'
  | 'ready'
  | 'recording'
  | 'analyzing'
  | 'complete'
  | 'error';

export interface FreestyleResult {
  sessionId: string;
  projectId: string;
  setup: SessionSetup;
  recordingSetup: RecordingSetup;
  analysis?: AnalysisResult;
  audioFileId?: string;
  status: FreestyleSessionStatus;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// ============================================================================
// Callback Types
// ============================================================================

export type ProgressCallback = (
  stage: string,
  progress: number,
  details?: string
) => void;

export type SessionEventCallback = (event: SessionEvent) => void;

export interface SessionEvent {
  sessionId: string;
  type: 'started' | 'prepared' | 'recording' | 'analyzing' | 'complete' | 'error';
  data?: any;
  timestamp: Date;
}

// ============================================================================
// Voice Command Types
// ============================================================================

export interface FreestyleVoiceCommand {
  command: string;
  intent:
    | 'start_freestyle'
    | 'record_me'
    | 'freestyle_over_beat'
    | 'create_beat_first'
    | 'stop_recording'
    | 'analyze_freestyle'
    | 'unknown';
  parameters: {
    beatStyle?: string;
    bpm?: number;
    key?: string;
    autoStart?: boolean;
  };
  confidence: number;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface StartFreestyleRequest {
  projectId: string;
  userId: string;
  config?: Partial<FreestyleConfig>;
}

export interface StartFreestyleResponse {
  success: boolean;
  sessionId: string;
  result: FreestyleResult;
  message: string;
}

export interface AnalyzeRecordingRequest {
  sessionId: string;
  audioBuffer: ArrayBuffer;
  lyrics: LyricSegment[];
  options: {
    projectId: string;
    trackId: string;
    hasBeat: boolean;
  };
}

export interface AnalyzeRecordingResponse {
  success: boolean;
  analysis: AnalysisResult;
  message: string;
}

export interface GetSessionRequest {
  sessionId: string;
}

export interface GetSessionResponse {
  success: boolean;
  session: FreestyleResult;
}

// ============================================================================
// WebSocket Event Types
// ============================================================================

export interface FreestyleWebSocketEvent {
  event:
    | 'freestyle:session-started'
    | 'freestyle:session-prepared'
    | 'freestyle:recording-started'
    | 'freestyle:recording-stopped'
    | 'freestyle:analysis-started'
    | 'freestyle:analysis-progress'
    | 'freestyle:analysis-complete'
    | 'freestyle:piano-roll-updated'
    | 'freestyle:lyrics-updated'
    | 'freestyle:error';
  data: any;
  timestamp: string;
}

export interface FreestyleProgressEvent {
  sessionId: string;
  stage: string;
  progress: number; // 0-1
  details?: string;
  timestamp: Date;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface FreestyleUIState {
  isSessionActive: boolean;
  sessionId?: string;
  status: FreestyleSessionStatus;
  currentStage?: string;
  progress: number; // 0-1
  setup?: SessionSetup;
  recordingSetup?: RecordingSetup;
  analysis?: AnalysisResult;
  error?: string;
}

// ============================================================================
// Beat Generation Types
// ============================================================================

export interface BeatGenerationConfig {
  style: 'hip-hop' | 'pop' | 'trap' | 'rnb' | 'drill' | 'boom-bap';
  bpm: number;
  key: string;
  duration: number; // seconds
  intensity: 'low' | 'medium' | 'high';
  includeHiHats?: boolean;
  include808?: boolean;
}

export interface GeneratedBeat {
  id: string;
  audioUrl: string;
  duration: number;
  bpm: number;
  key: string;
  style: string;
  metadata: {
    generatedBy: 'musicgen' | 'udio' | 'other';
    generatedAt: Date;
    cost: number;
  };
}

// ============================================================================
// Export all types
// ============================================================================

export * from './freestyle';
