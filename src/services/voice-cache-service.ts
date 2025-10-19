/**
 * Voice Command Cache Service
 * Caches common voice command patterns to reduce OpenAI Whisper API costs
 * Uses pattern matching for similar commands (e.g., "play" vs "start playing")
 */

import { logger } from '../backend/utils/logger';
import { aiCache } from './ai-cache-service';

/**
 * Common voice command patterns mapped to actions
 * These bypass OpenAI completely for instant response
 */
export const COMMON_VOICE_PATTERNS: Record<string, string> = {
  // Playback controls
  'play': 'playback:start',
  'start': 'playback:start',
  'start playing': 'playback:start',
  'begin playback': 'playback:start',
  'resume': 'playback:resume',

  'pause': 'playback:pause',
  'stop': 'playback:stop',
  'halt': 'playback:stop',

  // Volume controls
  'louder': 'volume:increase',
  'increase volume': 'volume:increase',
  'turn it up': 'volume:increase',
  'volume up': 'volume:increase',

  'quieter': 'volume:decrease',
  'decrease volume': 'volume:decrease',
  'turn it down': 'volume:decrease',
  'volume down': 'volume:decrease',

  'mute': 'volume:mute',
  'unmute': 'volume:unmute',

  // Recording
  'record': 'recording:start',
  'start recording': 'recording:start',
  'begin recording': 'recording:start',

  'stop recording': 'recording:stop',
  'end recording': 'recording:stop',

  // Navigation
  'go back': 'navigation:back',
  'previous': 'navigation:previous',
  'next': 'navigation:next',
  'skip': 'navigation:skip',

  // Common questions (cached responses)
  'what can you do': 'help:capabilities',
  'help': 'help:general',
  'how do i': 'help:howto',

  // Generation
  'generate beat': 'generate:beat',
  'create beat': 'generate:beat',
  'make a beat': 'generate:beat',

  'generate music': 'generate:music',
  'create music': 'generate:music',
  'make music': 'generate:music',
};

/**
 * Common help responses (cached to avoid API calls)
 */
export const CACHED_RESPONSES: Record<string, string> = {
  'help:capabilities': "I can help you with music production! I can generate beats, mix tracks, control playback, record audio, and answer questions about music production.",
  'help:general': "Try commands like: 'generate a trap beat', 'play', 'record', 'increase volume', or 'create a lo-fi beat at 85 BPM'.",
  'help:howto': "Ask me to do something! For example: 'generate a hip hop beat' or 'mix this track'.",
};

export interface VoiceCommandResult {
  action: string;
  confidence: number;
  cached: boolean;
  parameters?: Record<string, any>;
}

/**
 * Voice Cache Service Class
 */
export class VoiceCacheService {
  private static instance: VoiceCacheService;

  private constructor() {
    logger.info('Voice Cache Service initialized');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): VoiceCacheService {
    if (!VoiceCacheService.instance) {
      VoiceCacheService.instance = new VoiceCacheService();
    }
    return VoiceCacheService.instance;
  }

  /**
   * Match voice command to cached pattern
   * Returns action if found, null if needs AI processing
   */
  matchPattern(text: string): VoiceCommandResult | null {
    const normalized = text.toLowerCase().trim();

    // Exact match
    if (COMMON_VOICE_PATTERNS[normalized]) {
      logger.info('Voice command matched (exact)', { text, action: COMMON_VOICE_PATTERNS[normalized] });

      return {
        action: COMMON_VOICE_PATTERNS[normalized],
        confidence: 1.0,
        cached: true,
      };
    }

    // Partial match - check if command contains any pattern
    for (const [pattern, action] of Object.entries(COMMON_VOICE_PATTERNS)) {
      if (normalized.includes(pattern)) {
        const confidence = pattern.length / normalized.length; // Longer match = higher confidence

        if (confidence > 0.5) {
          logger.info('Voice command matched (partial)', {
            text,
            pattern,
            action,
            confidence: confidence.toFixed(2),
          });

          return {
            action,
            confidence,
            cached: true,
            parameters: this.extractParameters(normalized, pattern),
          };
        }
      }
    }

    // Word-based fuzzy match
    const words = normalized.split(' ');
    for (const [pattern, action] of Object.entries(COMMON_VOICE_PATTERNS)) {
      const patternWords = pattern.split(' ');
      const matchCount = words.filter(w => patternWords.includes(w)).length;
      const confidence = matchCount / patternWords.length;

      if (confidence >= 0.7) {
        logger.info('Voice command matched (fuzzy)', {
          text,
          pattern,
          action,
          confidence: confidence.toFixed(2),
        });

        return {
          action,
          confidence,
          cached: true,
          parameters: this.extractParameters(normalized, pattern),
        };
      }
    }

    return null; // No match, needs AI processing
  }

  /**
   * Get cached response for common questions
   */
  getCachedResponse(action: string): string | null {
    return CACHED_RESPONSES[action] || null;
  }

  /**
   * Extract parameters from voice command
   * (e.g., BPM, genre, tempo from "generate a trap beat at 140 BPM")
   */
  private extractParameters(text: string, pattern: string): Record<string, any> {
    const params: Record<string, any> = {};

    // Extract BPM
    const bpmMatch = text.match(/(\d+)\s*(bpm|beats per minute)/i);
    if (bpmMatch) {
      params.bpm = parseInt(bpmMatch[1]);
    }

    // Extract genre (common genres)
    const genres = ['trap', 'hip hop', 'lo-fi', 'house', 'techno', 'drill', 'boom bap', 'edm', 'dubstep'];
    for (const genre of genres) {
      if (text.includes(genre)) {
        params.genre = genre;
        break;
      }
    }

    // Extract key
    const keyMatch = text.match(/in ([A-G][#b]?(m|maj|min|major|minor)?)/i);
    if (keyMatch) {
      params.key = keyMatch[1];
    }

    // Extract mood
    const moods = ['dark', 'happy', 'sad', 'energetic', 'chill', 'aggressive'];
    for (const mood of moods) {
      if (text.includes(mood)) {
        params.mood = mood;
        break;
      }
    }

    return params;
  }

  /**
   * Cache voice transcription result from OpenAI
   * This caches the AI transcription for identical audio
   */
  async cacheTranscription(audioHash: string, transcription: string): Promise<void> {
    try {
      await aiCache.set(
        audioHash,
        { transcription },
        {
          provider: 'openai',
          model: 'whisper-1',
          ttl: 86400, // 24 hours
        }
      );
    } catch (error: any) {
      logger.error('Failed to cache transcription', { error: error.message });
    }
  }

  /**
   * Get cached transcription for audio
   */
  async getCachedTranscription(audioHash: string): Promise<string | null> {
    try {
      const cached = await aiCache.get<{ transcription: string }>(
        audioHash,
        {
          provider: 'openai',
          model: 'whisper-1',
        }
      );

      return cached?.transcription || null;
    } catch (error: any) {
      logger.error('Failed to get cached transcription', { error: error.message });
      return null;
    }
  }

  /**
   * Add custom voice pattern at runtime
   */
  addPattern(pattern: string, action: string): void {
    COMMON_VOICE_PATTERNS[pattern.toLowerCase()] = action;
    logger.info('Added custom voice pattern', { pattern, action });
  }

  /**
   * Get all patterns
   */
  getPatterns(): Record<string, string> {
    return { ...COMMON_VOICE_PATTERNS };
  }

  /**
   * Get pattern match statistics
   */
  async getStats(): Promise<{
    totalPatterns: number;
    cachedResponses: number;
  }> {
    return {
      totalPatterns: Object.keys(COMMON_VOICE_PATTERNS).length,
      cachedResponses: Object.keys(CACHED_RESPONSES).length,
    };
  }
}

// Export singleton instance
export const voiceCache = VoiceCacheService.getInstance();
