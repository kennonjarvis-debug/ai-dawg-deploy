// API Types based on Prisma Schema
// TypeScript type definitions for API requests and responses

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

export enum TrackType {
  AUDIO = 'AUDIO',
  MIDI = 'MIDI',
  INSTRUMENT = 'INSTRUMENT',
  AUX = 'AUX',
  MASTER = 'MASTER',
}

export enum CollabRole {
  OWNER = 'OWNER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export enum JobType {
  RENDER = 'RENDER',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  AI_PROCESSING = 'AI_PROCESSING',
  WAVEFORM_GENERATION = 'WAVEFORM_GENERATION',
}

export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  bpm: number;
  sampleRate: number;
  timeSignature: string;
  key?: string;
  userId: string;
  isPublic: boolean;
  thumbnailUrl?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  tracks?: Track[];
  audioFiles?: AudioFile[];
  collaborators?: Collaborator[];
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  bpm?: number;
  sampleRate?: number;
  timeSignature?: string;
  key?: string;
  isPublic?: boolean;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  bpm?: number;
  timeSignature?: string;
  key?: string;
  isPublic?: boolean;
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
}

// Track Metadata Types
export interface TimbreProfile {
  brightness: number;      // 0-1
  warmth: number;          // 0-1
  roughness: number;       // 0-1
  spectralCentroid: number; // Hz
  spectralRolloff: number;  // Hz
  harmonicRichness: number; // 0-1
}

export interface VocalCharacteristics {
  timbre: TimbreProfile;
  dynamicRange: number;           // dB
  peakLevel: number;              // 0-1
  spectralBalance: 'dark' | 'balanced' | 'bright';
  hasClipping: boolean;
  noiseFloor: number;             // dB
  hasSibilance: boolean;
  hasRoomTone: boolean;
  breathNoise: 'low' | 'moderate' | 'high';
}

export interface RhythmCharacteristics {
  bpm: number;
  confidence: number;             // 0-1
  timeSignature: {
    numerator: number;
    denominator: number;
  };
  key: string;                    // e.g., "C", "Am"
  scale: string;                  // "major", "minor", etc.
  tempoStability: number;         // 0-1
  swingAmount?: number;           // 0-1
}

export interface StyleMetadata {
  genre: 'country' | 'pop' | 'rock' | 'rnb' | 'hip-hop' | 'indie' | 'folk' | 'jazz' | 'other';
  subgenre?: string;              // e.g., "morgan-wallen", "country-pop"
  mood: string;                   // "happy", "sad", "energetic", etc.
  energy: number;                 // 0-1
  danceability?: number;          // 0-1
  valence?: number;               // 0-1 (musical positivity)
}

export interface TrackMetadata {
  vocalCharacteristics?: VocalCharacteristics;
  rhythmCharacteristics?: RhythmCharacteristics;
  style?: StyleMetadata;
  analyzedAt?: string;            // ISO timestamp
}

// Track Types
export interface Track {
  id: string;
  projectId: string;
  name: string;
  trackType: TrackType;
  color: string;
  volume: number;
  pan: number;
  isMuted: boolean;
  isSolo: boolean;
  isArmed: boolean;
  order: number;
  metadata?: TrackMetadata;       // AI-extracted metadata
  createdAt: string;
  updatedAt: string;
  clips?: Clip[];
}

export interface CreateTrackRequest {
  projectId: string;
  name: string;
  trackType: TrackType;
  color?: string;
  order: number;
}

export interface UpdateTrackRequest {
  name?: string;
  color?: string;
  volume?: number;
  pan?: number;
  isMuted?: boolean;
  isSolo?: boolean;
  isArmed?: boolean;
}

export interface ReorderTracksRequest {
  trackOrders: Array<{
    id: string;
    order: number;
  }>;
}

export interface BulkUpdateTracksRequest {
  trackIds: string[];
  updates: {
    volume?: number;
    pan?: number;
    isMuted?: boolean;
    isSolo?: boolean;
    isArmed?: boolean;
  };
}

// Clip Types
export interface Clip {
  id: string;
  trackId: string;
  audioFileId?: string;
  name: string;
  startTime: number;
  duration: number;
  offset: number;
  fadeIn: number;
  fadeOut: number;
  gain: number;
  createdAt: string;
  updatedAt: string;
  audioFile?: AudioFile;
}

export interface CreateClipRequest {
  trackId: string;
  audioFileId?: string;
  name: string;
  startTime: number;
  duration: number;
  offset?: number;
  fadeIn?: number;
  fadeOut?: number;
  gain?: number;
}

export interface UpdateClipRequest {
  name?: string;
  startTime?: number;
  duration?: number;
  offset?: number;
  fadeIn?: number;
  fadeOut?: number;
  gain?: number;
}

// Audio File Types
export interface AudioFile {
  id: string;
  projectId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  duration: number;
  sampleRate: number;
  channels: number;
  bitDepth?: number;
  storageKey: string;
  waveformData?: WaveformData;
  createdAt: string;
  updatedAt: string;
}

export interface WaveformData {
  peaks: number[];
  length: number;
}

export interface UploadAudioResponse {
  audioFile: AudioFile;
  uploadUrl?: string;
}

// Collaborator Types
export interface Collaborator {
  id: string;
  projectId: string;
  email: string;
  role: CollabRole;
  invitedAt: string;
  acceptedAt?: string;
}

export interface AddCollaboratorRequest {
  email: string;
  role: CollabRole;
}

// Job Types
export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: number;
  data: any;
  result?: any;
  error?: string;
  progress: number;
  attempts: number;
  maxRetries: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface StartRenderRequest {
  projectId: string;
  format?: 'wav' | 'mp3' | 'flac' | 'ogg';
  quality?: 'low' | 'medium' | 'high' | 'lossless';
}

// AI Service Types
export interface AnalyzeVocalsRequest {
  audioFileId: string;
}

export interface MasterTrackRequest {
  trackId: string;
  targetLoudness?: number;
}

export interface GenerateContentRequest {
  type: 'melody' | 'harmony' | 'rhythm' | 'bassline';
  parameters: {
    key?: string;
    scale?: string;
    bpm?: number;
    bars?: number;
  };
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API Error
export interface APIError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

// Billing / Entitlements
export interface Entitlements {
  plan: 'FREE' | 'PRO' | 'STUDIO';
  features: Record<string, boolean>;
  limits: {
    max_projects: number;
    max_tracks_per_project: number;
    max_storage_gb: number;
    [key: string]: number;
  };
}

// Chat / Conversations
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  intent?: string;
  entities?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
  messageCount?: number;
}

// Generation
export interface GenerationResult {
  audioUrl?: string;
  lyrics?: string;
  notes?: unknown[];
  metadata?: Record<string, unknown>;
}

// ============================================
// AI TRAINING METADATA
// ============================================

export interface GenerationMetadataForTraining {
  id: string;
  userId: string;
  generationId: string;

  // User input
  userPrompt: string;
  aiEnhancedPrompt?: string;

  // Generation parameters
  generationParams: {
    genre?: string;
    bpm?: number;
    key?: string;
    mood?: string;
    style?: string;
    duration?: number;
    model?: string;
    provider?: string;
    instrumental?: boolean;
    customLyrics?: string;
  };

  // Generated output
  audioUrl: string;
  duration: number;
  format: string;

  // Analysis results
  analysisMetadata?: {
    vocalCharacteristics?: VocalCharacteristics;
    rhythmCharacteristics?: RhythmCharacteristics;
    styleMetadata?: StyleMetadata;
    analyzedAt?: string;
  };

  // Audio features
  audioEmbedding?: number[];        // Feature vector for similarity search
  spectralFeatures?: {
    spectralCentroid: number;
    spectralRolloff: number;
    mfcc: number[];                 // Mel-frequency cepstral coefficients
    chromagram?: number[];          // Pitch class distribution
  };

  // User feedback
  userFeedback?: {
    liked?: boolean;
    rating?: number;                // 1-5 stars
    feedback?: string;
    used?: boolean;                 // Added to project timeline
    feedbackTimestamp?: string;
  };

  // Training metadata
  provider: string;                 // suno, musicgen, expert_music_ai
  modelUsed?: string;               // Specific model version
  generationCost?: number;          // API cost in USD
  generationDuration?: number;      // Time to generate in seconds

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface SaveMetadataRequest {
  generationId: string;
  metadata: Partial<GenerationMetadataForTraining>;
}

export interface UpdateFeedbackRequest {
  generationId: string;
  feedback: {
    liked?: boolean;
    rating?: number;
    feedback?: string;
    used?: boolean;
  };
}

// ============================================
// LYRICS ANALYSIS
// ============================================

export type SectionType =
  | 'intro'
  | 'verse'
  | 'pre-chorus'
  | 'chorus'
  | 'bridge'
  | 'outro'
  | 'hook'
  | 'unknown';

export type LyricsGenre =
  | 'pop'
  | 'country'
  | 'hip-hop'
  | 'rock'
  | 'rnb'
  | 'indie'
  | 'folk'
  | 'other';

export interface SectionLabel {
  lineStart: number;
  lineEnd: number;
  sectionType: SectionType;
  sectionNumber?: number;
  confidence: number;
  reasoning?: string;
}

export interface RepeatedSection {
  sectionType: SectionType;
  occurrences: number;
  lineRanges: Array<{ start: number; end: number }>;
}

export interface LyricsStructure {
  sections: SectionLabel[];
  repeatedSections: RepeatedSection[];
  estimatedLength: number;
  structure: string;
}

export interface StructureRecommendation {
  type: 'suggestion' | 'warning' | 'info';
  message: string;
  section?: SectionType;
  reasoning: string;
}

export interface LyricsAnalysisResult {
  structure: LyricsStructure;
  recommendations: StructureRecommendation[];
  genreAdvice?: {
    genre: LyricsGenre;
    suggestions: string[];
  };
  cost: {
    totalCost: number;
    inputTokens: number;
    outputTokens: number;
    breakdown: string;
  };
}

export interface AnalyzeLyricsRequest {
  lyrics: string;
  genre?: LyricsGenre;
  suggestedStructure?: string;
  trackId?: string;
  projectId?: string;
}

export interface LyricsValidation {
  valid: boolean;
  warnings: string[];
  lyricsLength?: number;
  lineCount?: number;
}

// ============================================
// MULTI-CLIP ANALYSIS
// ============================================

export interface ClipMetadata {
  clipId: string;
  clipName: string;
  bpm?: number;
  key?: string;
  scale?: string;
  energy?: number;
  isVocal: boolean;
  duration: number;
  vocalCharacteristics?: VocalCharacteristics;
  rhythmCharacteristics?: RhythmCharacteristics;
  style?: StyleMetadata;
}

export interface ClipRelationship {
  clipId1: string;
  clipId2: string;
  relationshipType: 'complementary' | 'matching' | 'conflicting' | 'neutral';
  score: number;
  reasons: string[];
}

export interface ArrangementSection {
  name: string;
  clipIds: string[];
  startTime?: number;
  duration?: number;
}

export interface ArrangementSuggestion {
  order: string[];
  reasoning: string;
  sections: ArrangementSection[];
}

export interface ClipConflict {
  clipIds: string[];
  conflictType: 'tempo-mismatch' | 'key-clash' | 'energy-mismatch' | 'style-clash';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion?: string;
}

export interface MultiClipAnalysisResult {
  clips: ClipMetadata[];
  relationships: ClipRelationship[];
  arrangementSuggestions: ArrangementSuggestion[];
  conflicts: ClipConflict[];
  aiRecommendations: string[];
  cost: {
    totalCost: number;
    inputTokens: number;
    outputTokens: number;
    breakdown: string;
  };
}

export interface AnalyzeMultipleClipsRequest {
  clipIds: string[];
  suggestArrangement?: boolean;
  detectConflicts?: boolean;
  projectId?: string;
}

export interface CostEstimate {
  estimatedCost: number;
  inputTokens: number;
  outputTokens: number;
  breakdown: string;
}
