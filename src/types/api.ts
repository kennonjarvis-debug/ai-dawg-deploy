/**
 * API request/response TypeScript type definitions
 * Provides strong typing for API client, WebSocket events, and HTTP interactions
 */

// ============================================================================
// Generic API Types
// ============================================================================

export interface APIResponse<T = unknown> {
  data: T;
  message?: string;
  status?: number;
}

export interface APIError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================================================
// WebSocket Event Types
// ============================================================================

export interface WebSocketMessage<T = unknown> {
  event: string;
  data: T;
  timestamp?: Date;
}

export interface WebSocketEventData {
  userId?: string;
  username?: string;
  projectId?: string;
  trackId?: string;
  clipId?: string;
  timestamp?: Date;
  [key: string]: unknown;
}

export interface ProjectUpdateData extends WebSocketEventData {
  update: Record<string, unknown>;
}

export interface TrackEventData extends WebSocketEventData {
  track?: Record<string, unknown>;
  changes?: Record<string, unknown>;
  trackOrders?: Array<{ id: string; order: number }>;
}

export interface ClipEventData extends WebSocketEventData {
  clip?: Record<string, unknown>;
  changes?: Record<string, unknown>;
}

export interface PlaybackSyncData extends WebSocketEventData {
  state: {
    isPlaying: boolean;
    position: number;
    tempo?: number;
  };
}

export interface CursorMoveData extends WebSocketEventData {
  position: {
    time: number;
    track?: string;
  };
}

export interface AIEventData extends WebSocketEventData {
  taskId: string;
  taskType?: string;
  progress?: number;
  message?: string;
  result?: unknown;
  error?: string;
}

export interface RecordingEventData extends WebSocketEventData {
  trackId: string;
  clipId?: string;
}

export interface SelectionEventData extends WebSocketEventData {
  selectedClips?: string[];
  selectedTracks?: string[];
}

export interface LyricsEventData extends WebSocketEventData {
  trackId: string;
  lyrics?: string;
  genre?: string;
  analysis?: Record<string, unknown>;
  sectionLabels?: Array<{ time: number; label: string }>;
  recommendations?: string[];
}

export interface ClipsAnalysisData extends WebSocketEventData {
  clipIds?: string[];
  analysis?: Record<string, unknown>;
}

// ============================================================================
// HTTP Request/Response Types
// ============================================================================

export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean>;
  timeout?: number;
}

export interface FetchOptions extends RequestInit {
  params?: URLSearchParams | Record<string, string>;
  timeout?: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface XMLHttpRequestConfig {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: Document | XMLHttpRequestBodyInit;
  onProgress?: (event: ProgressEvent) => void;
  onLoad?: (event: ProgressEvent) => void;
  onError?: (event: ProgressEvent) => void;
  onAbort?: (event: ProgressEvent) => void;
}

// ============================================================================
// Job/Task Types
// ============================================================================

export interface Job {
  id: string;
  type: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  result?: unknown;
  error?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GenerationJob extends Job {
  type: 'beat' | 'lyrics' | 'melody' | 'stems' | 'mix' | 'master';
  params?: Record<string, unknown>;
}

export interface GenerationStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  stage?: string;
  result?: GenerationResult;
  error?: string;
}

export interface GenerationResult {
  audioUrl?: string;
  lyrics?: string;
  notes?: unknown[];
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Chat/Conversation Types
// ============================================================================

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

export interface SendMessageRequest {
  conversationId: string;
  message: string;
}

export interface SendMessageResponse {
  messageId: string;
  conversationId: string;
  content?: string;
}

// ============================================================================
// Entity Types (from existing API types)
// ============================================================================

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: string;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  bpm: number;
  sampleRate: number;
  timeSignature: string;
  key?: string;
  isPublic: boolean;
  userId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Track {
  id: string;
  projectId: string;
  name: string;
  trackType: 'AUDIO' | 'MIDI' | 'INSTRUMENT' | 'AUX' | 'MASTER';
  color?: string;
  volume: number;
  pan: number;
  isMuted: boolean;
  isSolo: boolean;
  isArmed: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

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
  midiData?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

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
  storageKey: string;
  createdAt: string;
}

export interface Collaborator {
  id: string;
  projectId: string;
  userId?: string;
  email: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  inviteStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
}

// ============================================================================
// Request/Response Body Types
// ============================================================================

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
  token: string;
  refreshToken: string;
  user: User;
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
  sampleRate?: number;
  timeSignature?: string;
  key?: string;
  isPublic?: boolean;
}

export interface ProjectListResponse {
  projects: Project[];
  pagination?: PaginationMeta;
}

export interface CreateTrackRequest {
  projectId: string;
  name: string;
  trackType: 'AUDIO' | 'MIDI' | 'INSTRUMENT' | 'AUX' | 'MASTER';
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
  trackOrders: Array<{ id: string; order: number }>;
}

export interface BulkUpdateTracksRequest {
  trackIds: string[];
  updates: Partial<UpdateTrackRequest>;
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
  midiData?: Record<string, unknown>;
}

export interface UpdateClipRequest {
  name?: string;
  startTime?: number;
  duration?: number;
  offset?: number;
  fadeIn?: number;
  fadeOut?: number;
  gain?: number;
  midiData?: Record<string, unknown>;
}

export interface UploadAudioResponse {
  audioFile: AudioFile;
  message?: string;
}

export interface AddCollaboratorRequest {
  email: string;
  role: 'EDITOR' | 'VIEWER';
}

export interface StartRenderRequest {
  projectId: string;
  format?: string;
  quality?: string;
}

export interface AnalyzeVocalsRequest {
  audioFileId: string;
  analysisType?: 'pitch' | 'performance' | 'health' | 'comprehensive';
}

export interface MasterTrackRequest {
  audioFileId: string;
  targetLoudness?: number;
  preset?: string;
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

// ============================================================================
// Entitlements & Billing Types
// ============================================================================

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

export interface CheckoutRequest {
  plan?: 'PRO' | 'STUDIO';
  priceId?: string;
}

export interface CheckoutResponse {
  url: string;
}

export interface PortalResponse {
  url: string;
}
