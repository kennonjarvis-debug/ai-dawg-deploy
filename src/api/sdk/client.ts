/**
 * DAWG AI API Client SDK
 *
 * Client library for consuming the DAWG AI API from other agents/services
 * Usage:
 *
 * import { AIDAWClient } from './api/sdk/client';
 *
 * const client = new AIDAWClient('http://localhost:3000/api/v1');
 * await client.login('user@example.com', 'password');
 * const projects = await client.getProjects();
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: string;
  createdAt: string;
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
  midiData?: any;
  createdAt: string;
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

export interface Job {
  id: string;
  type: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  result?: any;
  error?: string;
  createdAt: string;
}

export class AIDAWClient {
  private client: AxiosInstance;
  private accessToken?: string;
  private refreshToken?: string;

  constructor(baseURL: string = process.env.VITE_API_URL || 'http://localhost:3001/api/v1') {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle token refresh on 401
        if (error.response?.status === 401 && !originalRequest._retry && this.refreshToken) {
          originalRequest._retry = true;
          try {
            await this.refresh();
            return this.client(originalRequest);
          } catch (refreshError) {
            this.accessToken = undefined;
            this.refreshToken = undefined;
            throw refreshError;
          }
        }

        throw error;
      }
    );
  }

  // ==================== Authentication ====================

  async register(email: string, username: string, password: string, firstName?: string, lastName?: string): Promise<{ user: User }> {
    const response = await this.client.post('/auth/register', {
      email,
      username,
      password,
      firstName,
      lastName,
    });
    return response.data;
  }

  async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const response = await this.client.post('/auth/login', { email, password });
    this.accessToken = response.data.accessToken;
    this.refreshToken = response.data.refreshToken;
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
    this.accessToken = undefined;
    this.refreshToken = undefined;
  }

  async refresh(): Promise<{ accessToken: string }> {
    const response = await this.client.post('/auth/refresh', {
      refreshToken: this.refreshToken,
    });
    this.accessToken = response.data.accessToken;
    return response.data;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  async updateProfile(firstName?: string, lastName?: string, avatar?: string): Promise<{ user: User }> {
    const response = await this.client.put('/auth/me', {
      firstName,
      lastName,
      avatar,
    });
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await this.client.put('/auth/me/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  // ==================== Projects ====================

  async getProjects(page: number = 1, limit: number = 20): Promise<{ projects: Project[]; pagination: any }> {
    const response = await this.client.get('/projects', {
      params: { page, limit },
    });
    return response.data;
  }

  async getProject(id: string): Promise<{ project: Project }> {
    const response = await this.client.get(`/projects/${id}`);
    return response.data;
  }

  async createProject(data: {
    name: string;
    description?: string;
    bpm?: number;
    sampleRate?: number;
    timeSignature?: string;
    key?: string;
    isPublic?: boolean;
  }): Promise<{ project: Project }> {
    const response = await this.client.post('/projects', data);
    return response.data;
  }

  async updateProject(id: string, data: Partial<Project>): Promise<{ project: Project }> {
    const response = await this.client.put(`/projects/${id}`, data);
    return response.data;
  }

  async deleteProject(id: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/projects/${id}`);
    return response.data;
  }

  async getProjectVersions(projectId: string): Promise<{ versions: any[] }> {
    const response = await this.client.get(`/projects/${projectId}/versions`);
    return response.data;
  }

  async createProjectVersion(projectId: string, description?: string): Promise<{ version: any }> {
    const response = await this.client.post(`/projects/${projectId}/versions`, { description });
    return response.data;
  }

  async getCollaborators(projectId: string): Promise<{ collaborators: any[] }> {
    const response = await this.client.get(`/projects/${projectId}/collaborators`);
    return response.data;
  }

  async addCollaborator(projectId: string, email: string, role: 'EDITOR' | 'VIEWER'): Promise<{ collaborator: any }> {
    const response = await this.client.post(`/projects/${projectId}/collaborators`, { email, role });
    return response.data;
  }

  // ==================== Tracks ====================

  async getTracksByProject(projectId: string): Promise<{ tracks: Track[] }> {
    const response = await this.client.get(`/tracks/project/${projectId}`);
    return response.data;
  }

  async getTrack(id: string): Promise<{ track: Track }> {
    const response = await this.client.get(`/tracks/${id}`);
    return response.data;
  }

  async createTrack(data: {
    projectId: string;
    name: string;
    trackType: 'AUDIO' | 'MIDI' | 'INSTRUMENT' | 'AUX' | 'MASTER';
    color?: string;
    order: number;
  }): Promise<{ track: Track }> {
    const response = await this.client.post('/tracks', data);
    return response.data;
  }

  async updateTrack(id: string, data: {
    name?: string;
    color?: string;
    volume?: number;
    pan?: number;
    isMuted?: boolean;
    isSolo?: boolean;
    isArmed?: boolean;
  }): Promise<{ track: Track }> {
    const response = await this.client.put(`/tracks/${id}`, data);
    return response.data;
  }

  async deleteTrack(id: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/tracks/${id}`);
    return response.data;
  }

  async reorderTracks(projectId: string, trackOrders: Array<{ id: string; order: number }>): Promise<{ message: string }> {
    const response = await this.client.post(`/tracks/project/${projectId}/reorder`, { trackOrders });
    return response.data;
  }

  async bulkUpdateTracks(trackIds: string[], updates: {
    volume?: number;
    pan?: number;
    isMuted?: boolean;
    isSolo?: boolean;
    isArmed?: boolean;
  }): Promise<{ count: number; message: string }> {
    const response = await this.client.patch('/tracks/bulk', { trackIds, updates });
    return response.data;
  }

  // ==================== Clips ====================

  async getClipsByTrack(trackId: string): Promise<{ clips: Clip[] }> {
    const response = await this.client.get(`/clips/track/${trackId}`);
    return response.data;
  }

  async getClip(id: string): Promise<{ clip: Clip }> {
    const response = await this.client.get(`/clips/${id}`);
    return response.data;
  }

  async createClip(data: {
    trackId: string;
    audioFileId?: string;
    name: string;
    startTime: number;
    duration: number;
    offset?: number;
    fadeIn?: number;
    fadeOut?: number;
    gain?: number;
    midiData?: any;
  }): Promise<{ clip: Clip }> {
    const response = await this.client.post('/clips', data);
    return response.data;
  }

  async updateClip(id: string, data: {
    name?: string;
    startTime?: number;
    duration?: number;
    offset?: number;
    fadeIn?: number;
    fadeOut?: number;
    gain?: number;
    midiData?: any;
  }): Promise<{ clip: Clip }> {
    const response = await this.client.put(`/clips/${id}`, data);
    return response.data;
  }

  async deleteClip(id: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/clips/${id}`);
    return response.data;
  }

  async bulkUpdateClips(clipIds: string[], updates: {
    startTime?: number;
    duration?: number;
    offset?: number;
    fadeIn?: number;
    fadeOut?: number;
    gain?: number;
  }): Promise<{ count: number; message: string }> {
    const response = await this.client.patch('/clips/bulk', { clipIds, updates });
    return response.data;
  }

  // ==================== Audio ====================

  async uploadAudio(projectId: string, file: File | Buffer, filename: string): Promise<{ audioFile: AudioFile }> {
    const formData = new FormData();
    formData.append('audio', file as any, filename);
    formData.append('projectId', projectId);

    const response = await this.client.post('/audio/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getAudioFile(id: string): Promise<{ audioFile: AudioFile }> {
    const response = await this.client.get(`/audio/${id}`);
    return response.data;
  }

  async getAudioDownloadUrl(id: string): Promise<{ downloadUrl: string; expiresIn: number }> {
    const response = await this.client.get(`/audio/${id}/download`);
    return response.data;
  }

  async getAudioWaveform(id: string): Promise<{ waveform: any }> {
    const response = await this.client.get(`/audio/${id}/waveform`);
    return response.data;
  }

  async deleteAudio(id: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/audio/${id}`);
    return response.data;
  }

  // ==================== Render ====================

  async startRender(projectId: string, format?: string, quality?: string): Promise<{ jobId: string; status: string; message: string }> {
    const response = await this.client.post('/render', {
      projectId,
      format,
      quality,
    });
    return response.data;
  }

  async getRenderStatus(jobId: string): Promise<{ job: Job }> {
    const response = await this.client.get(`/render/${jobId}`);
    return response.data;
  }

  async cancelRender(jobId: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/render/${jobId}`);
    return response.data;
  }

  async getRenderJobs(): Promise<{ jobs: Job[] }> {
    const response = await this.client.get('/render/jobs');
    return response.data;
  }

  // ==================== AI Services ====================

  async getAIStatus(): Promise<{ status: string; services: any; timestamp: string }> {
    const response = await this.client.get('/ai/status');
    return response.data;
  }

  // Vocal Coach methods

  async analyzePitch(audioData: string, sampleRate?: number): Promise<{
    success: boolean;
    analysis: {
      detected_pitch: number;
      pitch_confidence: number;
      note_name: string;
      cents_offset: number;
      correction_suggestion: string;
      stability: number;
      vibrato_detected: boolean;
      vibrato_rate: number;
    };
  }> {
    const response = await this.client.post('/ai/vocal-coach/analyze-pitch', {
      audioData,
      sampleRate,
    });
    return response.data;
  }

  async getPerformanceFeedback(audio: string, reference?: string, metadata?: Record<string, any>): Promise<{
    success: boolean;
    feedback: Array<{
      category: string;
      severity: string;
      description: string;
      timestamp: number;
      suggestion: string;
      confidence: number;
    }>;
  }> {
    const response = await this.client.post('/ai/vocal-coach/performance-feedback', {
      audio,
      reference,
      metadata,
    });
    return response.data;
  }

  async generateHarmony(melody: string, style?: string, numVoices?: number): Promise<{
    success: boolean;
    harmonyAudio: string;
    harmonyNotes: string[];
  }> {
    const response = await this.client.post('/ai/vocal-coach/generate-harmony', {
      melody,
      style,
      numVoices,
    });
    return response.data;
  }

  async assessVocalHealth(recording: string): Promise<{
    success: boolean;
    healthReport: {
      overall_health: number;
      health_status: string;
      strain_detected: boolean;
      strain_locations: number[];
      strain_severity: number;
      fatigue_level: number;
      spectral_quality: Record<string, number>;
      breath_support: Record<string, any>;
      tension_indicators: Array<Record<string, any>>;
      recommendations: string[];
    };
  }> {
    const response = await this.client.post('/ai/vocal-coach/assess-health', {
      recording,
    });
    return response.data;
  }

  async generateVocalExercise(
    vocalRange?: [number, number],
    focusAreas?: string[],
    duration?: number,
    skillLevel?: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<{
    success: boolean;
    routine: {
      exercises: Array<any>;
      total_duration: number;
      skill_level: string;
      focus_areas: string[];
    };
  }> {
    const response = await this.client.post('/ai/vocal-coach/generate-exercise', {
      vocalRange,
      focusAreas,
      duration,
      skillLevel,
    });
    return response.data;
  }

  // AI Producer & Mastering methods

  async masterTrack(trackId: string, targetLoudness?: number): Promise<{ success: boolean; data: any }> {
    const response = await this.client.post('/ai/mastering/process', {
      trackId,
      targetLoudness,
    });
    return response.data;
  }

  async generateContent(type: 'melody' | 'harmony' | 'rhythm' | 'bassline', parameters: {
    key?: string;
    scale?: string;
    bpm?: number;
    bars?: number;
  }): Promise<{ success: boolean; data: any }> {
    const response = await this.client.post('/ai/producer/generate', {
      type,
      parameters,
    });
    return response.data;
  }

  // ==================== Utilities ====================

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  setRefreshToken(token: string): void {
    this.refreshToken = token;
  }

  clearTokens(): void {
    this.accessToken = undefined;
    this.refreshToken = undefined;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}

export default AIDAWClient;
