/**
 * DAW Integration Service
 * Connects generated audio to the DAW timeline and transport controls
 */

import { logger } from '../utils/logger';
import { emitToUser } from '../../api/websocket/server';

export interface GeneratedAudioMetadata {
  audioUrl: string;
  duration: number;
  bpm?: number;
  key?: string;
  genre?: string;
  format: string;
  sampleRate: number;
  channels: number;

  // Enhanced fields for AI training
  userPrompt?: string;              // Original user prompt
  aiEnhancedPrompt?: string;        // AI-enhanced prompt used for generation
  generationParams?: {              // Full generation parameters
    model?: string;
    temperature?: number;
    topP?: number;
    style?: string;
    mood?: string;
    instrumental?: boolean;
    duration?: number;
  };
  userFeedback?: {                  // User feedback for training
    liked?: boolean;
    rating?: number;                // 1-5 star rating
    feedback?: string;              // Text feedback
    used?: boolean;                 // Whether user actually used the audio
    timestamp?: string;
  };
  audioEmbedding?: number[];        // Audio feature embedding for similarity search
  analysisMetadata?: {              // Metadata from MetadataAnalyzer
    vocalCharacteristics?: any;
    rhythmCharacteristics?: any;
    styleMetadata?: any;
    analyzedAt?: string;
  };
  provider?: string;                // Generation provider (suno, musicgen, expert_music_ai)
  modelUsed?: string;               // Specific model version used
  generationTimestamp?: string;     // When generation occurred
  trainingDataId?: string;          // ID for linking to training dataset
}

export interface DAWTrackInfo {
  trackId: string;
  trackName: string;
  startTime: number; // seconds
  clipId: string;
}

export class DAWIntegrationService {
  /**
   * Load generated audio into DAW timeline
   * Creates a new clip on a new track or existing track
   */
  async loadAudioIntoDAW(
    userId: string,
    generationId: string,
    audioMetadata: GeneratedAudioMetadata,
    options: {
      trackId?: string; // Existing track ID, or create new
      trackName?: string; // Name for new track
      startTime?: number; // Position in timeline (seconds)
      autoPlay?: boolean; // Auto-play after loading
    } = {}
  ): Promise<DAWTrackInfo> {
    try {
      const trackId = options.trackId || `track-${Date.now()}`;
      const clipId = `clip-${generationId}`;
      const startTime = options.startTime || 0;
      const trackName = options.trackName || `Generated - ${audioMetadata.genre || 'Audio'}`;

      logger.info('Loading audio into DAW', {
        userId,
        generationId,
        trackId,
        clipId,
        startTime,
        room: `user:${userId}`,
      });

      // Emit event to frontend to add audio to timeline
      console.log(`[DAW Integration] Emitting daw:audio:loaded to user:${userId}`);
      emitToUser(userId, 'daw:audio:loaded', {
        generationId,
        trackId,
        trackName,
        clipId,
        clip: {
          id: clipId,
          name: trackName,
          startTime,
          duration: audioMetadata.duration,
          trackId,
          audioUrl: audioMetadata.audioUrl,
          audioFileId: generationId,
          metadata: {
            bpm: audioMetadata.bpm,
            key: audioMetadata.key,
            genre: audioMetadata.genre,
            format: audioMetadata.format,
            sampleRate: audioMetadata.sampleRate,
            channels: audioMetadata.channels,
          },
        },
        autoPlay: options.autoPlay || false,
        timestamp: new Date(),
      });

      logger.info('Audio loaded into DAW successfully', {
        trackId,
        clipId,
      });

      return {
        trackId,
        trackName,
        startTime,
        clipId,
      };
    } catch (error: any) {
      logger.error('Failed to load audio into DAW', {
        error: error.message,
        generationId,
      });
      throw error;
    }
  }

  /**
   * Sync transport controls with generated audio
   * Sets BPM, time signature, etc. based on generated audio
   */
  async syncTransportControls(
    userId: string,
    audioMetadata: GeneratedAudioMetadata
  ): Promise<void> {
    try {
      if (audioMetadata.bpm) {
        logger.info('Syncing transport BPM', {
          userId,
          bpm: audioMetadata.bpm,
        });

        emitToUser(userId, 'daw:transport:sync', {
          bpm: audioMetadata.bpm,
          timestamp: new Date(),
        });
      }
    } catch (error: any) {
      logger.error('Failed to sync transport controls', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Auto-play generated audio
   */
  async autoPlayAudio(userId: string, clipId: string): Promise<void> {
    try {
      logger.info('Auto-playing generated audio', {
        userId,
        clipId,
      });

      emitToUser(userId, 'daw:transport:play', {
        clipId,
        timestamp: new Date(),
      });
    } catch (error: any) {
      logger.error('Failed to auto-play audio', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Remove generated audio from DAW
   */
  async removeAudioFromDAW(userId: string, clipId: string): Promise<void> {
    try {
      logger.info('Removing audio from DAW', {
        userId,
        clipId,
      });

      emitToUser(userId, 'daw:audio:removed', {
        clipId,
        timestamp: new Date(),
      });
    } catch (error: any) {
      logger.error('Failed to remove audio from DAW', {
        error: error.message,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const dawIntegrationService = new DAWIntegrationService();
