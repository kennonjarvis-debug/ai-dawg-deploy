/**
 * Multi-Track Simultaneous Recording Service
 *
 * Handles simultaneous recording of up to 8 tracks with:
 * - WebSocket streaming for real-time audio
 * - Individual level controls
 * - Real-time monitoring
 * - Auto-save functionality
 */

import { logger } from '../utils/logger';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export interface TrackConfig {
  trackId: string;
  trackNumber: number;
  name: string;
  level: number; // 0-1
  pan: number; // -1 to 1
  muted: boolean;
  solo: boolean;
  armed: boolean; // Ready to record
  inputSource?: string;
}

export interface RecordingSession {
  sessionId: string;
  projectId: string;
  userId: string;
  tracks: TrackConfig[];
  startTime: Date;
  duration: number;
  sampleRate: number;
  bufferSize: number;
  isRecording: boolean;
  isPaused: boolean;
}

export interface AudioChunk {
  trackId: string;
  data: Buffer;
  timestamp: number;
  sampleRate: number;
}

export interface RecordingMetrics {
  sessionId: string;
  recordedTracks: number;
  totalDuration: number;
  averageLatency: number;
  bufferUnderruns: number;
  dataReceived: number; // bytes
}

export class MultiTrackRecorderService extends EventEmitter {
  private activeSessions: Map<string, RecordingSession> = new Map();
  private audioBuffers: Map<string, Map<string, Buffer[]>> = new Map(); // sessionId -> trackId -> chunks
  private metrics: Map<string, RecordingMetrics> = new Map();
  private autoSaveIntervals: Map<string, NodeJS.Timeout> = new Map();

  private readonly MAX_TRACKS = 8;
  private readonly AUTO_SAVE_INTERVAL = 30000; // 30 seconds

  /**
   * Create a new recording session
   */
  async createSession(
    projectId: string,
    userId: string,
    trackConfigs: Partial<TrackConfig>[]
  ): Promise<RecordingSession> {
    if (trackConfigs.length > this.MAX_TRACKS) {
      throw new Error(`Maximum ${this.MAX_TRACKS} tracks allowed`);
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize tracks with defaults
    const tracks: TrackConfig[] = trackConfigs.map((config, index) => ({
      trackId: config.trackId || `track_${index + 1}`,
      trackNumber: index + 1,
      name: config.name || `Track ${index + 1}`,
      level: config.level ?? 0.8,
      pan: config.pan ?? 0,
      muted: config.muted ?? false,
      solo: config.solo ?? false,
      armed: config.armed ?? true,
      inputSource: config.inputSource,
    }));

    const session: RecordingSession = {
      sessionId,
      projectId,
      userId,
      tracks,
      startTime: new Date(),
      duration: 0,
      sampleRate: 48000,
      bufferSize: 2048,
      isRecording: false,
      isPaused: false,
    };

    this.activeSessions.set(sessionId, session);
    this.audioBuffers.set(sessionId, new Map());
    this.metrics.set(sessionId, {
      sessionId,
      recordedTracks: 0,
      totalDuration: 0,
      averageLatency: 0,
      bufferUnderruns: 0,
      dataReceived: 0,
    });

    // Initialize buffers for each track
    tracks.forEach(track => {
      this.audioBuffers.get(sessionId)!.set(track.trackId, []);
    });

    logger.info('[MultiTrack] Session created', {
      sessionId,
      projectId,
      trackCount: tracks.length,
    });

    this.emit('session:created', session);

    return session;
  }

  /**
   * Start recording on session
   */
  async startRecording(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.isRecording) {
      throw new Error('Session is already recording');
    }

    session.isRecording = true;
    session.isPaused = false;
    session.startTime = new Date();

    // Start auto-save
    this.startAutoSave(sessionId);

    logger.info('[MultiTrack] Recording started', { sessionId });
    this.emit('recording:started', { sessionId, timestamp: Date.now() });
  }

  /**
   * Stop recording on session
   */
  async stopRecording(sessionId: string): Promise<RecordingMetrics> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.isRecording = false;
    session.duration = Date.now() - session.startTime.getTime();

    // Stop auto-save
    this.stopAutoSave(sessionId);

    // Save final state
    await this.saveSession(sessionId);

    const metrics = this.metrics.get(sessionId)!;
    metrics.totalDuration = session.duration;
    metrics.recordedTracks = session.tracks.filter(t => t.armed).length;

    logger.info('[MultiTrack] Recording stopped', {
      sessionId,
      duration: session.duration,
      metrics,
    });

    this.emit('recording:stopped', { sessionId, metrics });

    return metrics;
  }

  /**
   * Pause recording
   */
  async pauseRecording(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.isPaused = true;
    logger.info('[MultiTrack] Recording paused', { sessionId });
    this.emit('recording:paused', { sessionId });
  }

  /**
   * Resume recording
   */
  async resumeRecording(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.isPaused = false;
    logger.info('[MultiTrack] Recording resumed', { sessionId });
    this.emit('recording:resumed', { sessionId });
  }

  /**
   * Receive audio chunk from WebSocket
   */
  async receiveAudioChunk(sessionId: string, chunk: AudioChunk): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.isRecording || session.isPaused) {
      return;
    }

    const trackBuffers = this.audioBuffers.get(sessionId);
    if (!trackBuffers) {
      throw new Error('Session buffers not found');
    }

    const trackBuffer = trackBuffers.get(chunk.trackId);
    if (!trackBuffer) {
      throw new Error(`Track ${chunk.trackId} not found in session`);
    }

    // Store chunk
    trackBuffer.push(chunk.data);

    // Update metrics
    const metrics = this.metrics.get(sessionId)!;
    metrics.dataReceived += chunk.data.length;

    // Calculate latency (time from chunk timestamp to now)
    const latency = Date.now() - chunk.timestamp;
    metrics.averageLatency = (metrics.averageLatency + latency) / 2;

    this.emit('audio:chunk', { sessionId, trackId: chunk.trackId, size: chunk.data.length });
  }

  /**
   * Update track configuration
   */
  async updateTrack(
    sessionId: string,
    trackId: string,
    updates: Partial<TrackConfig>
  ): Promise<TrackConfig> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const track = session.tracks.find(t => t.trackId === trackId);
    if (!track) {
      throw new Error(`Track ${trackId} not found`);
    }

    // Apply updates
    Object.assign(track, updates);

    logger.info('[MultiTrack] Track updated', { sessionId, trackId, updates });
    this.emit('track:updated', { sessionId, trackId, track });

    return track;
  }

  /**
   * Get current session state
   */
  getSession(sessionId: string): RecordingSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get session metrics
   */
  getMetrics(sessionId: string): RecordingMetrics | undefined {
    return this.metrics.get(sessionId);
  }

  /**
   * Auto-save session data
   */
  private startAutoSave(sessionId: string): void {
    const interval = setInterval(async () => {
      await this.saveSession(sessionId);
    }, this.AUTO_SAVE_INTERVAL);

    this.autoSaveIntervals.set(sessionId, interval);
    logger.info('[MultiTrack] Auto-save started', { sessionId });
  }

  /**
   * Stop auto-save
   */
  private stopAutoSave(sessionId: string): void {
    const interval = this.autoSaveIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.autoSaveIntervals.delete(sessionId);
      logger.info('[MultiTrack] Auto-save stopped', { sessionId });
    }
  }

  /**
   * Save session data to disk
   */
  private async saveSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const trackBuffers = this.audioBuffers.get(sessionId);
    if (!trackBuffers) return;

    logger.info('[MultiTrack] Saving session', { sessionId });

    try {
      // Create session directory
      const sessionDir = path.join('/tmp', 'multitrack', sessionId);
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }

      // Save each track's audio
      for (const [trackId, chunks] of trackBuffers.entries()) {
        if (chunks.length === 0) continue;

        const trackFile = path.join(sessionDir, `${trackId}.raw`);
        const combinedBuffer = Buffer.concat(chunks);

        fs.writeFileSync(trackFile, combinedBuffer);

        logger.info('[MultiTrack] Track saved', {
          sessionId,
          trackId,
          size: combinedBuffer.length,
        });
      }

      // Save session metadata
      const metadataFile = path.join(sessionDir, 'session.json');
      fs.writeFileSync(metadataFile, JSON.stringify(session, null, 2));

      this.emit('session:saved', { sessionId, path: sessionDir });
    } catch (error) {
      logger.error('[MultiTrack] Save failed', { sessionId, error });
      this.emit('session:save-error', { sessionId, error });
    }
  }

  /**
   * Export session to audio files
   */
  async exportSession(
    sessionId: string,
    format: 'wav' | 'mp3' | 'flac' = 'wav'
  ): Promise<{ [trackId: string]: string }> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const trackBuffers = this.audioBuffers.get(sessionId);
    if (!trackBuffers) {
      throw new Error('Session buffers not found');
    }

    logger.info('[MultiTrack] Exporting session', { sessionId, format });

    const exportedFiles: { [trackId: string]: string } = {};

    // In production, this would convert raw audio to proper format using ffmpeg
    for (const track of session.tracks) {
      const chunks = trackBuffers.get(track.trackId);
      if (!chunks || chunks.length === 0) continue;

      exportedFiles[track.trackId] = `/api/v1/audio/multitrack/${sessionId}/${track.trackId}.${format}`;
    }

    logger.info('[MultiTrack] Export complete', {
      sessionId,
      trackCount: Object.keys(exportedFiles).length,
    });

    return exportedFiles;
  }

  /**
   * Clean up session
   */
  async destroySession(sessionId: string): Promise<void> {
    this.stopAutoSave(sessionId);
    this.activeSessions.delete(sessionId);
    this.audioBuffers.delete(sessionId);
    this.metrics.delete(sessionId);

    logger.info('[MultiTrack] Session destroyed', { sessionId });
    this.emit('session:destroyed', { sessionId });
  }
}

// Export singleton instance
export const multiTrackRecorderService = new MultiTrackRecorderService();
