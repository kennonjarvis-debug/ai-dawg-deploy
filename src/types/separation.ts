/**
 * Stem Separation Types
 *
 * Type definitions for AI-powered stem separation using Demucs
 */

// Stem types
export type StemType = 'vocals' | 'drums' | 'bass' | 'other';

// Quality settings
export type SeparationQuality = 'fast' | 'balanced' | 'high-quality';

// Model options
export type DemucsModel = 'htdemucs' | 'htdemucs_ft' | 'htdemucs_6s';

// Job status
export type SeparationJobStatus =
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'downloading'
  | 'validating'
  | 'completed'
  | 'failed';

// Separation request
export interface SeparationRequest {
  userId: string;
  projectId?: string;
  audioFileId?: string;
  audioUrl?: string;
  audioFile?: Buffer | File;
  quality?: SeparationQuality;
  model?: DemucsModel;
  stems?: StemType[]; // Specific stems to extract (empty = all)
  outputFormat?: 'wav' | 'mp3' | 'flac';
}

// Separation job data
export interface SeparationJobData {
  id: string;
  userId: string;
  projectId?: string;
  audioUrl: string;
  quality: SeparationQuality;
  model: DemucsModel;
  stems: StemType[];
  outputFormat: 'wav' | 'mp3' | 'flac';
  createdAt: Date;
}

// Separation progress
export interface SeparationProgress {
  jobId: string;
  status: SeparationJobStatus;
  progress: number; // 0-100
  stage: string;
  estimatedTimeRemaining?: number; // seconds
  timestamp: Date;
}

// Stem result
export interface StemResult {
  type: StemType;
  url: string;
  duration: number;
  format: string;
  size: number; // bytes
  quality: StemQualityMetrics;
}

// Stem quality metrics
export interface StemQualityMetrics {
  sdr?: number; // Signal-to-Distortion Ratio (dB)
  sir?: number; // Signal-to-Interference Ratio (dB)
  sar?: number; // Signal-to-Artifacts Ratio (dB)
  rmsEnergy: number;
  spectralCentroid: number;
  isSilent: boolean;
  lufs: number; // Loudness Units Full Scale
  peakLevel: number; // dBFS
}

// Separation result
export interface SeparationResult {
  jobId: string;
  userId: string;
  projectId?: string;
  stems: StemResult[];
  metadata: SeparationMetadata;
  createdAt: Date;
  completedAt: Date;
}

// Separation metadata
export interface SeparationMetadata {
  model: DemucsModel;
  quality: SeparationQuality;
  duration: number; // Audio duration in seconds
  processingTime: number; // Processing time in seconds
  originalFileSize: number;
  totalStemsSize: number;
  sampleRate: number;
  channels: number;
  format: string;
  cost?: number; // Cost in USD (if using paid API)
}

// Batch separation request
export interface BatchSeparationRequest {
  userId: string;
  projectId?: string;
  files: Array<{
    fileId: string;
    url?: string;
    name: string;
  }>;
  quality?: SeparationQuality;
  model?: DemucsModel;
}

// Batch separation result
export interface BatchSeparationResult {
  batchId: string;
  userId: string;
  jobs: Array<{
    fileId: string;
    jobId: string;
    status: SeparationJobStatus;
  }>;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
}

// Pricing tier configuration
export interface PricingTier {
  tier: 'free' | 'premium' | 'enterprise';
  monthlySeparations: number;
  remainingSeparations: number;
  quality: SeparationQuality[];
  batchProcessing: boolean;
  priorityProcessing: boolean;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metrics: {
    energyConservation: number; // Percentage
    spectralConsistency: number; // 0-1
    phaseAlignment: number; // 0-1
  };
}

// WebSocket events
export interface SeparationEvents {
  'separation:started': {
    jobId: string;
    timestamp: Date;
  };
  'separation:progress': SeparationProgress;
  'separation:completed': SeparationResult;
  'separation:failed': {
    jobId: string;
    error: string;
    timestamp: Date;
  };
}

// API response types
export interface SeparationResponse {
  success: boolean;
  jobId?: string;
  error?: string;
  estimatedTime?: number; // seconds
}

export interface SeparationStatusResponse {
  jobId: string;
  status: SeparationJobStatus;
  progress: number;
  result?: SeparationResult;
  error?: string;
}

export interface SeparationHistoryResponse {
  jobs: Array<{
    jobId: string;
    createdAt: Date;
    status: SeparationJobStatus;
    metadata?: SeparationMetadata;
  }>;
  total: number;
  page: number;
  limit: number;
}
