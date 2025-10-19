// API Client for DAWG AI Backend
// Provides type-safe HTTP methods for all API endpoints

import type {
  User,
  Project,
  Track,
  Clip,
  AudioFile,
  Job,
  Collaborator,
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  RefreshTokenRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectListResponse,
  CreateTrackRequest,
  UpdateTrackRequest,
  ReorderTracksRequest,
  BulkUpdateTracksRequest,
  CreateClipRequest,
  UpdateClipRequest,
  UploadAudioResponse,
  AddCollaboratorRequest,
  StartRenderRequest,
  AnalyzeVocalsRequest,
  MasterTrackRequest,
  GenerateContentRequest,
  PaginationParams,
  APIError,
} from './types';

export class APIClient {
  private baseURL: string;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private csrfToken: string | null = null;

  constructor(baseURL?: string) {
    // Force relative path for ngrok compatibility (bypasses CORS)
    this.baseURL = baseURL || '/api/v1';
    this.loadTokens();
  }

  // Token Management
  private loadTokens() {
    if (typeof window !== 'undefined') {
      // Try localStorage first (remember me), then sessionStorage
      this.token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      this.refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
    }
  }

  private saveTokens(token: string, refreshToken: string, rememberMe: boolean = true) {
    this.token = token;
    this.refreshToken = refreshToken;
    if (typeof window !== 'undefined') {
      if (rememberMe) {
        // Save to localStorage for persistent login
        localStorage.setItem('auth_token', token);
        localStorage.setItem('refresh_token', refreshToken);
        // Clear sessionStorage if exists
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('refresh_token');
      } else {
        // Save to sessionStorage for session-only login
        sessionStorage.setItem('auth_token', token);
        sessionStorage.setItem('refresh_token', refreshToken);
        // Clear localStorage if exists
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
      }
    }
  }

  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('refresh_token');
    }
  }

  // CSRF Token Management
  private async getCSRFToken(): Promise<string> {
    // Demo mode: Skip CSRF token fetching
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      return 'demo-csrf-token';
    }

    if (this.csrfToken) return this.csrfToken;

    try {
      const response = await fetch(`${this.baseURL}/csrf-token`, {
        credentials: 'include', // Important: include cookies for csrf-csrf library
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }

      const data = await response.json();
      this.csrfToken = data.csrfToken;
      return this.csrfToken;
    } catch (error) {
      console.warn('Backend not available, skipping CSRF token:', error);
      return ''; // Return empty string to allow requests to proceed (will be caught by backend)
    }
  }

  // HTTP Methods
  private async request<T>(
    method: string,
    path: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Add user ID header for WebSocket room matching
    // Backend uses this to emit events to the correct WebSocket room
    headers['x-user-id'] = 'user-123';

    // Add CSRF token for state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
      const csrfToken = await this.getCSRFToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: 'include', // Include cookies for CSRF
        ...options,
      });

      // Handle 401 - Try to refresh token
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${this.token}`;
          const retryResponse = await fetch(url, {
            method,
            headers,
            body: data ? JSON.stringify(data) : undefined,
            credentials: 'include',
            ...options,
          });
          return this.handleResponse<T>(retryResponse);
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: APIError = {
        message: response.statusText,
        status: response.status,
      };

      try {
        const errorData = await response.json();
        error.message = errorData.message || error.message;
        error.code = errorData.code;
        error.details = errorData.details;
        // 402 Upsell handling
        if (response.status === 402 && typeof window !== 'undefined') {
          const evt = new CustomEvent('ai-upsell', { detail: errorData });
          window.dispatchEvent(evt);
        }
      } catch {
        // Response body is not JSON
      }

      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private handleError(error: any): APIError {
    if (error.message && error.status) {
      return error as APIError;
    }

    return {
      message: error.message || 'Network error occurred',
      code: 'NETWORK_ERROR',
    };
  }

  private async tryRefreshToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const data: AuthResponse = await response.json();
      this.saveTokens(data.token, data.refreshToken);
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  // Auth API
  async register(data: RegisterRequest, rememberMe: boolean = true): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('POST', '/auth/register', data);
    this.saveTokens(response.token, response.refreshToken, rememberMe);
    return response;
  }

  async login(data: LoginRequest, rememberMe: boolean = true): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('POST', '/auth/login', data);
    this.saveTokens(response.token, response.refreshToken, rememberMe);
    return response;
  }

  async logout(): Promise<void> {
    await this.request('POST', '/auth/logout');
    this.clearTokens();
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<{ user: User }>('GET', '/auth/me');
    return response.user;
  }

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await this.request<{ user: User }>('PUT', '/auth/me', data);
    return response.user;
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    return this.request('PUT', '/auth/me/password', data);
  }

  async forgotPassword(email: string): Promise<void> {
    return this.request('POST', '/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    return this.request('POST', '/auth/reset-password', { token, password });
  }

  // Project API
  async listProjects(params?: PaginationParams): Promise<ProjectListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

    const path = `/projects${query.toString() ? `?${query}` : ''}`;
    return this.request<ProjectListResponse>('GET', path);
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>('GET', `/projects/${id}`);
  }

  async createProject(data: CreateProjectRequest): Promise<Project> {
    return this.request<Project>('POST', '/projects', data);
  }

  async updateProject(id: string, data: UpdateProjectRequest): Promise<Project> {
    return this.request<Project>('PUT', `/projects/${id}`, data);
  }

  async deleteProject(id: string): Promise<void> {
    return this.request('DELETE', `/projects/${id}`);
  }

  async exportProject(id: string): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/projects/${id}/export`, {
      headers: { Authorization: `Bearer ${this.token}` },
      credentials: 'include',
    });
    return response.blob();
  }

  async importProject(file: File): Promise<Project> {
    const formData = new FormData();
    formData.append('file', file);

    const csrfToken = await this.getCSRFToken();
    const headers: HeadersInit = { Authorization: `Bearer ${this.token}` };
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${this.baseURL}/projects/import`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    return this.handleResponse<Project>(response);
  }

  async listProjectVersions(id: string): Promise<any[]> {
    return this.request('GET', `/projects/${id}/versions`);
  }

  async createProjectVersion(id: string, name?: string, description?: string): Promise<any> {
    return this.request('POST', `/projects/${id}/versions`, { name, description });
  }

  async restoreProjectVersion(id: string, version: number): Promise<Project> {
    return this.request('POST', `/projects/${id}/versions/${version}/restore`);
  }

  // Collaborator API
  async listCollaborators(projectId: string): Promise<Collaborator[]> {
    return this.request('GET', `/projects/${projectId}/collaborators`);
  }

  async addCollaborator(projectId: string, data: AddCollaboratorRequest): Promise<Collaborator> {
    return this.request('POST', `/projects/${projectId}/collaborators`, data);
  }

  async removeCollaborator(projectId: string, collaboratorId: string): Promise<void> {
    return this.request('DELETE', `/projects/${projectId}/collaborators/${collaboratorId}`);
  }

  // Track API
  async listTracks(projectId: string, params?: PaginationParams): Promise<{ tracks: Track[]; pagination?: any }> {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request('GET', `/tracks/project/${projectId}${queryString}`);
  }

  async getTrack(id: string): Promise<Track> {
    return this.request<Track>('GET', `/tracks/${id}`);
  }

  async createTrack(data: CreateTrackRequest): Promise<Track> {
    return this.request<Track>('POST', '/tracks', data);
  }

  async updateTrack(id: string, data: UpdateTrackRequest): Promise<Track> {
    return this.request<Track>('PUT', `/tracks/${id}`, data);
  }

  async deleteTrack(id: string): Promise<void> {
    return this.request('DELETE', `/tracks/${id}`);
  }

  async reorderTracks(projectId: string, data: ReorderTracksRequest): Promise<void> {
    return this.request('POST', `/tracks/project/${projectId}/reorder`, data);
  }

  async bulkUpdateTracks(data: BulkUpdateTracksRequest): Promise<void> {
    return this.request('PATCH', '/tracks/bulk', data);
  }

  // Clip API (assuming routes exist)
  async listClips(trackId: string): Promise<Clip[]> {
    return this.request<Clip[]>('GET', `/clips/track/${trackId}`);
  }

  async getClip(id: string): Promise<Clip> {
    return this.request<Clip>('GET', `/clips/${id}`);
  }

  async createClip(data: CreateClipRequest): Promise<Clip> {
    return this.request<Clip>('POST', '/clips', data);
  }

  async updateClip(id: string, data: UpdateClipRequest): Promise<Clip> {
    return this.request<Clip>('PUT', `/clips/${id}`, data);
  }

  async deleteClip(id: string): Promise<void> {
    return this.request('DELETE', `/clips/${id}`);
  }

  // Audio File API
  async uploadAudio(
    projectId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadAudioResponse> {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('projectId', projectId);

    return new Promise(async (resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });
      }

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Get CSRF token and send request
      const csrfToken = await this.getCSRFToken();
      xhr.open('POST', `${this.baseURL}/audio/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
      if (csrfToken) {
        xhr.setRequestHeader('X-CSRF-Token', csrfToken);
      }
      xhr.withCredentials = true; // Include cookies for CSRF
      xhr.send(formData);
    });
  }

  async getAudioFile(id: string): Promise<AudioFile> {
    return this.request<AudioFile>('GET', `/audio/${id}`);
  }

  async deleteAudioFile(id: string): Promise<void> {
    return this.request('DELETE', `/audio/${id}`);
  }

  async getAudioDownloadUrl(id: string): Promise<{ url: string }> {
    return this.request('GET', `/audio/${id}/download`);
  }

  // Render API
  async startRender(data: StartRenderRequest): Promise<Job> {
    return this.request<Job>('POST', '/render/start', data);
  }

  async getRenderStatus(jobId: string): Promise<Job> {
    return this.request<Job>('GET', `/render/status/${jobId}`);
  }

  async cancelRender(jobId: string): Promise<void> {
    return this.request('POST', `/render/cancel/${jobId}`);
  }

  // AI Service API
  async analyzeVocals(data: AnalyzeVocalsRequest): Promise<any> {
    return this.request('POST', '/ai/vocal-coach/analyze', data);
  }

  async masterTrack(data: MasterTrackRequest): Promise<any> {
    return this.request('POST', '/ai/mastering/process', data);
  }

  async generateContent(data: GenerateContentRequest): Promise<any> {
    return this.request('POST', '/ai/producer/generate', data);
  }

  // DAWG AI Auto Features
  async autoComp(audioFileIds: string[], options?: { segmentDuration?: number; crossfadeDuration?: number }): Promise<any> {
    return this.request('POST', '/ai/autocomp', {
      audioFileIds,
      segmentDuration: options?.segmentDuration || 5.0,
      crossfadeDuration: options?.crossfadeDuration || 0.5,
    });
  }

  async timeAlign(audioFileId: string, options?: { gridDivision?: string; strength?: number; preserveFeel?: boolean; tempo?: number }): Promise<any> {
    return this.request('POST', '/ai/timealign', {
      audioFileId,
      gridDivision: options?.gridDivision || '1/16',
      strength: options?.strength || 0.8,
      preserveFeel: options?.preserveFeel !== false,
      tempo: options?.tempo,
    });
  }

  async pitchCorrect(audioFileId: string, options?: { targetKey?: string; targetScale?: string; strength?: number }): Promise<any> {
    return this.request('POST', '/ai/pitchcorrect', {
      audioFileId,
      targetKey: options?.targetKey || 'C',
      targetScale: options?.targetScale || 'major',
      strength: options?.strength || 0.8,
    });
  }

  async autoMix(trackIds: string[], options?: { genre?: string; targetLoudness?: number }): Promise<any> {
    return this.request('POST', '/ai/mix', {
      trackIds,
      genre: options?.genre || 'pop',
      targetLoudness: options?.targetLoudness || -14.0,
    });
  }

  async aiDawg(audioFileIds: string[], options?: { genre?: string; tempo?: number; key?: string }): Promise<any> {
    return this.request('POST', '/ai/dawg', {
      audioFileIds,
      genre: options?.genre,
      tempo: options?.tempo,
      key: options?.key,
    });
  }

  // Billing API
  private entitlementsCache: { data: { plan: string; features: Record<string, boolean>; limits: any }; ts: number } | null = null;
  async getEntitlements(): Promise<{ plan: string; features: Record<string, boolean>; limits: any }> {
    const now = Date.now();
    if (this.entitlementsCache && now - this.entitlementsCache.ts < 60000) {
      return this.entitlementsCache.data;
    }

    try {
      const res = await this.request('GET', '/billing/entitlements') as { plan: string; features: Record<string, boolean>; limits: any };
      this.entitlementsCache = { data: res, ts: now };
      return res;
    } catch (error: any) {
      // If billing endpoint doesn't exist (404), return demo entitlements
      if (error.status === 404 || import.meta.env.VITE_DEMO_MODE === 'true') {
        console.log('Billing service not available, using demo entitlements');
        const demoEntitlements = {
          plan: 'FREE',
          features: {
            basic_recording: true,
            basic_mixing: true,
            ai_assistance: true,
            cloud_storage: false,
            advanced_effects: false,
            collaboration: false,
            unlimited_projects: false,
          },
          limits: {
            max_projects: 3,
            max_tracks_per_project: 8,
            max_storage_gb: 1,
          }
        };
        this.entitlementsCache = { data: demoEntitlements, ts: now };
        return demoEntitlements;
      }
      throw error;
    }
  }

  async createCheckout(plan?: 'PRO' | 'STUDIO', priceId?: string): Promise<{ url: string }> {
    return this.request('POST', '/billing/checkout', { plan, priceId });
  }

  async createPortal(): Promise<{ url: string }> {
    return this.request('POST', '/billing/portal');
  }

  // === CHAT-TO-CREATE API ENDPOINTS ===

  /**
   * Send a message in a conversation
   * Returns the assistant's response (streaming happens via WebSocket)
   */
  async sendMessage(conversationId: string, message: string): Promise<{
    messageId: string;
    conversationId: string;
    content?: string;
  }> {
    return this.request('POST', '/chat/message', {
      conversationId,
      message,
    });
  }

  /**
   * Get list of conversations for current user
   */
  async getConversations(params?: { limit?: number; offset?: number }): Promise<{
    conversations: Array<{
      id: string;
      title?: string;
      createdAt: string;
      updatedAt: string;
      messageCount: number;
    }>;
    pagination: {
      total: number;
      limit: number;
      offset: number;
    };
  }> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());

    const path = `/chat/conversations${query.toString() ? `?${query}` : ''}`;
    return this.request('GET', path);
  }

  /**
   * Get a specific conversation with its messages
   */
  async getConversation(conversationId: string): Promise<{
    id: string;
    title?: string;
    createdAt: string;
    updatedAt: string;
    messages: Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      createdAt: string;
      intent?: string;
      entities?: Record<string, any>;
    }>;
  }> {
    return this.request('GET', `/chat/conversations/${conversationId}`);
  }

  /**
   * Create a new conversation
   */
  async createConversation(params?: { title?: string; projectId?: string }): Promise<{
    id: string;
    title?: string;
    createdAt: string;
  }> {
    return this.request('POST', '/chat/conversations', params);
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    return this.request('DELETE', `/chat/conversations/${conversationId}`);
  }

  /**
   * Regenerate the last assistant message
   */
  async regenerateMessage(conversationId: string, messageId?: string): Promise<{
    messageId: string;
    conversationId: string;
  }> {
    return this.request('POST', `/chat/conversations/${conversationId}/regenerate`, {
      messageId,
    });
  }

  // === GENERATION API ENDPOINTS ===

  /**
   * Generate a beat
   */
  async generateBeat(params: {
    genre?: string;
    bpm?: number;
    key?: string;
    mood?: string;
    duration?: number;
  }): Promise<{
    jobId: string;
    status: string;
  }> {
    return this.request('POST', '/generate/beat', params);
  }

  /**
   * Generate lyrics
   */
  async generateLyrics(params: {
    genre?: string;
    mood?: string;
    theme?: string;
    style?: string;
    length?: string;
  }): Promise<{
    jobId: string;
    status: string;
  }> {
    return this.request('POST', '/generate/lyrics', params);
  }

  /**
   * Generate melody/topline
   */
  async generateMelody(params: {
    key?: string;
    scale?: string;
    mood?: string;
    lyrics?: string;
  }): Promise<{
    jobId: string;
    status: string;
  }> {
    return this.request('POST', '/generate/melody', params);
  }

  /**
   * Generate stems (drums, bass, etc.)
   */
  async generateStems(params: {
    type: 'drums' | 'bass' | 'melody' | 'vocal';
    genre?: string;
    bpm?: number;
    key?: string;
  }): Promise<{
    jobId: string;
    status: string;
  }> {
    return this.request('POST', '/generate/stems', params);
  }

  /**
   * Mix tracks automatically
   */
  async mixTracks(params: {
    trackIds: string[];
    genre?: string;
    targetLoudness?: number;
  }): Promise<{
    jobId: string;
    status: string;
  }> {
    return this.request('POST', '/generate/mix', params);
  }

  /**
   * Master a track
   */
  async masterTrackGeneration(params: {
    audioFileId: string;
    preset?: string;
    targetLoudness?: number;
  }): Promise<{
    jobId: string;
    status: string;
  }> {
    return this.request('POST', '/generate/master', params);
  }

  /**
   * Get generation job status
   */
  async getGenerationStatus(jobId: string): Promise<{
    jobId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    progress: number;
    stage?: string;
    result?: any;
    error?: string;
  }> {
    return this.request('GET', `/generate/status/${jobId}`);
  }

  /**
   * Get generation result
   */
  async getGenerationResult(jobId: string): Promise<{
    jobId: string;
    type: string;
    result: {
      audioUrl?: string;
      lyrics?: string;
      notes?: any[];
      metadata?: any;
    };
  }> {
    return this.request('GET', `/generate/result/${jobId}`);
  }

  /**
   * Cancel a generation job
   */
  async cancelGeneration(jobId: string): Promise<void> {
    return this.request('POST', `/generate/cancel/${jobId}`);
  }

  // Public HTTP Methods
  async get<T = any>(path: string, options?: RequestInit): Promise<{ data: T }> {
    const result = await this.request<T>('GET', path, undefined, options);
    return { data: result };
  }

  async post<T = any>(path: string, data?: any, options?: RequestInit): Promise<{ data: T }> {
    const result = await this.request<T>('POST', path, data, options);
    return { data: result };
  }

  async put<T = any>(path: string, data?: any, options?: RequestInit): Promise<{ data: T }> {
    const result = await this.request<T>('PUT', path, data, options);
    return { data: result };
  }

  async patch<T = any>(path: string, data?: any, options?: RequestInit): Promise<{ data: T }> {
    const result = await this.request<T>('PATCH', path, data, options);
    return { data: result };
  }

  async delete<T = any>(path: string, options?: RequestInit): Promise<{ data: T }> {
    const result = await this.request<T>('DELETE', path, undefined, options);
    return { data: result };
  }

  // Helper Methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  setBaseURL(url: string) {
    this.baseURL = url;
  }
}

// Singleton instance
export const apiClient = new APIClient();
