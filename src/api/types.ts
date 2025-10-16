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

// API Error
export interface APIError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}
