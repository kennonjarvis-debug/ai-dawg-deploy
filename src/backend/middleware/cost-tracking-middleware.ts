/**
 * Cost Tracking Middleware
 * Intercepts OpenAI API calls and automatically logs usage/costs
 */

import { OpenAI } from 'openai';
import { logger } from '../utils/logger';
import {
  logApiUsage,
  canMakeApiCall,
  ServiceType,
  OperationType,
  UsageMetrics,
} from '../services/cost-monitoring-service';

/**
 * Wrapped OpenAI client with automatic cost tracking
 */
export class CostTrackedOpenAI {
  private client: OpenAI;
  private userId: string;

  constructor(apiKey: string, userId: string) {
    this.client = new OpenAI({ apiKey });
    this.userId = userId;
  }

  /**
   * Whisper transcription with cost tracking
   */
  async transcribeAudio(audioFile: File | Blob, options?: OpenAI.Audio.TranscriptionCreateParams): Promise<any> {
    // Check budget before making call
    const canCall = await canMakeApiCall(this.userId);
    if (!canCall) {
      throw new Error('Budget limit exceeded. Please increase your budget or wait until the next period.');
    }

    const startTime = Date.now();

    try {
      // Make the API call
      const result = await this.client.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        ...options,
      });

      // Calculate audio duration (if available in metadata)
      // Note: You may need to calculate this from the audio file
      const audioDurationSeconds = await this.getAudioDuration(audioFile);
      const audioMinutes = audioDurationSeconds / 60;

      // Log usage and cost
      await logApiUsage(
        this.userId,
        'whisper',
        'transcription',
        { audioMinutes },
        {
          requestId: `whisper-${Date.now()}`,
          model: 'whisper-1',
          duration: Date.now() - startTime,
        }
      );

      return result;
    } catch (error) {
      logger.error('Whisper transcription failed', { error, userId: this.userId });
      throw error;
    }
  }

  /**
   * GPT-4o chat completion with cost tracking
   */
  async createChatCompletion(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options?: Partial<OpenAI.Chat.ChatCompletionCreateParams>
  ): Promise<OpenAI.Chat.ChatCompletion> {
    // Check budget before making call
    const canCall = await canMakeApiCall(this.userId);
    if (!canCall) {
      throw new Error('Budget limit exceeded. Please increase your budget or wait until the next period.');
    }

    const startTime = Date.now();

    try {
      // Make the API call
      const result = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages,
        ...options,
      });

      // Extract token usage
      const inputTokens = result.usage?.prompt_tokens || 0;
      const outputTokens = result.usage?.completion_tokens || 0;

      // Log usage and cost
      await logApiUsage(
        this.userId,
        'gpt-4o',
        'chat',
        { inputTokens, outputTokens },
        {
          requestId: result.id,
          model: result.model,
          duration: Date.now() - startTime,
          finishReason: result.choices[0]?.finish_reason,
        }
      );

      return result;
    } catch (error) {
      logger.error('GPT-4o chat completion failed', { error, userId: this.userId });
      throw error;
    }
  }

  /**
   * TTS-1-HD synthesis with cost tracking
   */
  async synthesizeSpeech(
    text: string,
    options?: Partial<OpenAI.Audio.SpeechCreateParams>
  ): Promise<Response> {
    // Check budget before making call
    const canCall = await canMakeApiCall(this.userId);
    if (!canCall) {
      throw new Error('Budget limit exceeded. Please increase your budget or wait until the next period.');
    }

    const startTime = Date.now();

    try {
      // Make the API call
      const result = await this.client.audio.speech.create({
        model: 'tts-1-hd',
        voice: 'alloy',
        input: text,
        ...options,
      });

      // Count characters
      const characters = text.length;

      // Log usage and cost
      await logApiUsage(
        this.userId,
        'tts-1-hd',
        'synthesis',
        { characters },
        {
          requestId: `tts-${Date.now()}`,
          model: 'tts-1-hd',
          voice: options?.voice || 'alloy',
          duration: Date.now() - startTime,
        }
      );

      return result;
    } catch (error) {
      logger.error('TTS synthesis failed', { error, userId: this.userId });
      throw error;
    }
  }

  /**
   * Realtime API session tracking
   * This tracks a single realtime session with accumulated metrics
   */
  private realtimeSessionMetrics: Map<
    string,
    {
      inputTokens: number;
      outputTokens: number;
      audioInputMinutes: number;
      audioOutputMinutes: number;
    }
  > = new Map();

  /**
   * Start tracking a realtime session
   */
  startRealtimeSession(sessionId: string): void {
    this.realtimeSessionMetrics.set(sessionId, {
      inputTokens: 0,
      outputTokens: 0,
      audioInputMinutes: 0,
      audioOutputMinutes: 0,
    });
  }

  /**
   * Track realtime token usage
   */
  async trackRealtimeTokens(sessionId: string, inputTokens: number, outputTokens: number): Promise<void> {
    const metrics = this.realtimeSessionMetrics.get(sessionId);
    if (!metrics) {
      logger.warn('Realtime session not found', { sessionId, userId: this.userId });
      return;
    }

    metrics.inputTokens += inputTokens;
    metrics.outputTokens += outputTokens;

    // Log incremental token usage
    await logApiUsage(
      this.userId,
      'realtime-api',
      'realtime-chat',
      { inputTokens, outputTokens },
      {
        sessionId,
        requestId: `realtime-tokens-${Date.now()}`,
      }
    );
  }

  /**
   * Track realtime audio input
   */
  async trackRealtimeAudioInput(sessionId: string, audioMinutes: number): Promise<void> {
    const metrics = this.realtimeSessionMetrics.get(sessionId);
    if (!metrics) {
      logger.warn('Realtime session not found', { sessionId, userId: this.userId });
      return;
    }

    metrics.audioInputMinutes += audioMinutes;

    // Log audio input usage
    await logApiUsage(
      this.userId,
      'realtime-api',
      'realtime-audio-input',
      { audioMinutes },
      {
        sessionId,
        requestId: `realtime-audio-in-${Date.now()}`,
      }
    );
  }

  /**
   * Track realtime audio output
   */
  async trackRealtimeAudioOutput(sessionId: string, audioMinutes: number): Promise<void> {
    const metrics = this.realtimeSessionMetrics.get(sessionId);
    if (!metrics) {
      logger.warn('Realtime session not found', { sessionId, userId: this.userId });
      return;
    }

    metrics.audioOutputMinutes += audioMinutes;

    // Log audio output usage
    await logApiUsage(
      this.userId,
      'realtime-api',
      'realtime-audio-output',
      { audioMinutes },
      {
        sessionId,
        requestId: `realtime-audio-out-${Date.now()}`,
      }
    );
  }

  /**
   * End realtime session and get total metrics
   */
  endRealtimeSession(sessionId: string): {
    inputTokens: number;
    outputTokens: number;
    audioInputMinutes: number;
    audioOutputMinutes: number;
  } | null {
    const metrics = this.realtimeSessionMetrics.get(sessionId);
    if (!metrics) {
      logger.warn('Realtime session not found', { sessionId, userId: this.userId });
      return null;
    }

    this.realtimeSessionMetrics.delete(sessionId);
    return metrics;
  }

  /**
   * Helper: Get audio duration from file
   * This is a placeholder - implement based on your audio processing library
   */
  private async getAudioDuration(audioFile: File | Blob): Promise<number> {
    // TODO: Implement actual audio duration extraction
    // For now, estimate based on file size (rough approximation)
    // 1 minute of audio ≈ 1MB for typical formats
    const fileSizeInMB = audioFile.size / (1024 * 1024);
    return fileSizeInMB * 60; // Rough estimate in seconds

    // In production, use a library like fluent-ffmpeg:
    // const duration = await getAudioDurationInSeconds(audioFile);
    // return duration;
  }

  /**
   * Get the underlying OpenAI client
   * Use this for any API calls not yet wrapped
   */
  getClient(): OpenAI {
    return this.client;
  }
}

/**
 * Create a cost-tracked OpenAI client for a user
 */
export function createCostTrackedClient(userId: string): CostTrackedOpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  return new CostTrackedOpenAI(apiKey, userId);
}

/**
 * Express middleware to attach cost-tracked OpenAI client to request
 */
export function attachCostTrackedClient(req: any, res: any, next: any) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  // Attach cost-tracked client to request
  req.openai = createCostTrackedClient(req.user.id);

  next();
}

/**
 * Utility: Manually log API usage (for cases where client wrapper isn't used)
 */
export async function manuallyLogUsage(
  userId: string,
  service: ServiceType,
  operation: OperationType,
  metrics: UsageMetrics,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await logApiUsage(userId, service, operation, metrics, metadata);
  } catch (error) {
    logger.error('Failed to manually log usage', { error, userId, service });
  }
}

export default {
  CostTrackedOpenAI,
  createCostTrackedClient,
  attachCostTrackedClient,
  manuallyLogUsage,
};
