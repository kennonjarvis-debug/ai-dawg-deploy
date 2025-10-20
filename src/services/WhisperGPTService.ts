/**
 * Whisper + GPT-4 Voice Integration Service
 *
 * Provides AI-powered voice control for DAWG AI:
 * - Speech-to-text with OpenAI Whisper
 * - Natural language understanding with GPT-4
 * - Text-to-speech responses
 * - Context-aware command execution
 *
 * @module WhisperGPTService
 */

import OpenAI from 'openai';
import { logger } from '../backend/utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface WhisperTranscriptionResult {
  text: string;
  language: string;
  duration: number;
  confidence?: number;
}

export interface GPT4CommandAnalysis {
  intent: string;
  action: string;
  parameters: Record<string, any>;
  confidence: number;
  requiresConfirmation: boolean;
  naturalResponse: string;
}

export interface VoiceContext {
  tracks: Array<{ id: string; name: string; type: string }>;
  currentTime: number;
  isPlaying: boolean;
  isRecording: boolean;
  selectedClipIds: string[];
  bpm: number;
  recentCommands: string[];
}

export interface TTSResult {
  audioData: ArrayBuffer;
  format: string;
  duration: number;
}

export interface WhisperGPTConfig {
  apiKey?: string;
  whisperModel?: 'whisper-1' | 'whisper-1-turbo'; // Support both standard and turbo models
  gptModel?: 'gpt-4' | 'gpt-4-turbo' | 'gpt-4o';
  ttsModel?: 'tts-1' | 'tts-1-hd';
  ttsVoice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  temperature?: number;
  maxTokens?: number;
  enableFallback?: boolean;
}

// ============================================================================
// Whisper + GPT-4 Service
// ============================================================================

export class WhisperGPTService {
  private client: OpenAI | null = null;
  private config: Required<WhisperGPTConfig>;
  private conversationHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
  private context: VoiceContext | null = null;

  constructor(config?: WhisperGPTConfig) {
    this.config = {
      apiKey: config?.apiKey || process.env.VITE_OPENAI_API_KEY || '',
      whisperModel: config?.whisperModel || 'whisper-1-turbo', // Use turbo model for faster transcription
      gptModel: config?.gptModel || 'gpt-4o',
      ttsModel: config?.ttsModel || 'tts-1-hd',
      ttsVoice: config?.ttsVoice || 'nova',
      temperature: config?.temperature ?? 0.7,
      maxTokens: config?.maxTokens || 500,
      enableFallback: config?.enableFallback ?? true,
    };

    if (this.config.apiKey) {
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
        dangerouslyAllowBrowser: true, // For client-side usage
      });
      logger.info('[WhisperGPTService] Initialized with OpenAI API');
    } else {
      logger.warn('[WhisperGPTService] No API key provided - running in fallback mode');
    }

    this.initializeSystemPrompt();
  }

  // ==========================================================================
  // System Prompt & Context
  // ==========================================================================

  private initializeSystemPrompt(): void {
    this.conversationHistory = [
      {
        role: 'system',
        content: `You are JARVIS, the AI assistant for DAWG AI - a professional Digital Audio Workstation.

Your role is to:
1. Interpret voice commands for DAW operations (transport, recording, mixing, editing)
2. Provide helpful, concise responses
3. Execute commands with precision
4. Offer creative suggestions when asked

Available command categories:
- Transport: play, pause, stop, record, loop, jump to time
- Tracks: add track, delete track, rename track, mute, solo, arm for recording
- Mixer: set volume, pan, add effects, adjust EQ
- Clips: duplicate, delete, move, trim, fade, quantize
- AI: generate beat, suggest mix, analyze vocals, master track
- Navigation: zoom in/out, fit to window, go to marker

Always respond in a professional yet friendly tone. Be concise. If a command could be destructive (delete all, clear project), ask for confirmation.

When analyzing commands, return JSON with this structure:
{
  "intent": "command_category",
  "action": "specific_action",
  "parameters": { "key": "value" },
  "confidence": 0.0-1.0,
  "requiresConfirmation": boolean,
  "naturalResponse": "Human-friendly response"
}`,
      },
    ];
  }

  /**
   * Update DAW context for more intelligent command interpretation
   */
  public updateContext(context: Partial<VoiceContext>): void {
    this.context = { ...this.context, ...context } as VoiceContext;
    logger.debug('[WhisperGPTService] Context updated', { context: this.context });
  }

  // ==========================================================================
  // Whisper: Speech-to-Text
  // ==========================================================================

  /**
   * Transcribe audio to text using Whisper API
   */
  public async transcribe(audioBlob: Blob, options?: {
    language?: string;
    prompt?: string;
  }): Promise<WhisperTranscriptionResult> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Please provide API key.');
    }

    try {
      logger.info('[WhisperGPTService] Starting Whisper transcription', {
        size: audioBlob.size,
        type: audioBlob.type
      });

      const startTime = Date.now();

      // Convert Blob to File (Whisper API expects File)
      const file = new File([audioBlob], 'audio.webm', { type: audioBlob.type });

      const transcription = await this.client.audio.transcriptions.create({
        file,
        model: this.config.whisperModel,
        language: options?.language,
        prompt: options?.prompt,
        response_format: 'verbose_json', // Get detailed response with language info
      });

      const duration = (Date.now() - startTime) / 1000;

      logger.info('[WhisperGPTService] Transcription complete', {
        text: transcription.text,
        duration
      });

      // Extract confidence from Whisper API response if available
      // Note: Whisper API doesn't directly provide confidence scores, but we can estimate based on:
      // - Response quality (text length, presence of [INAUDIBLE] markers)
      // - Audio duration vs transcription length ratio
      const hasInaudibleMarkers = transcription.text.includes('[INAUDIBLE]') || transcription.text.includes('[?]');
      const estimatedConfidence = hasInaudibleMarkers ? 0.7 : 0.95;

      return {
        text: transcription.text,
        language: (transcription as any).language || 'en',
        duration,
        confidence: estimatedConfidence, // Fixed: Use estimated confidence instead of hardcoded 1.0
      };
    } catch (error) {
      logger.error('[WhisperGPTService] Transcription failed', { error });

      if (this.config.enableFallback) {
        // Fallback to Web Speech API if available
        return this.fallbackTranscribe(audioBlob);
      }

      throw new Error(`Whisper transcription failed: ${error}`);
    }
  }

  /**
   * Fallback transcription using Web Speech API
   */
  private async fallbackTranscribe(audioBlob: Blob): Promise<WhisperTranscriptionResult> {
    logger.warn('[WhisperGPTService] Using Web Speech API fallback');

    // This would require converting blob to audio playback and using Web Speech Recognition
    // For now, return a placeholder
    return {
      text: '',
      language: 'en',
      duration: 0,
      confidence: 0.5,
    };
  }

  // ==========================================================================
  // GPT-4: Command Analysis & Natural Language Understanding
  // ==========================================================================

  /**
   * Analyze transcribed text to determine intent and extract parameters
   */
  public async analyzeCommand(text: string, context?: Partial<VoiceContext>): Promise<GPT4CommandAnalysis> {
    if (!this.client) {
      // Fallback to simple pattern matching if no API key
      return this.fallbackAnalyzeCommand(text);
    }

    try {
      logger.info('[WhisperGPTService] Analyzing command with GPT-4', { text });

      // Update context if provided
      if (context) {
        this.updateContext(context);
      }

      // Build context-aware prompt
      const contextPrompt = this.buildContextPrompt(text);

      this.conversationHistory.push({
        role: 'user',
        content: contextPrompt,
      });

      const completion = await this.client.chat.completions.create({
        model: this.config.gptModel,
        messages: this.conversationHistory,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from GPT-4');
      }

      const analysis: GPT4CommandAnalysis = JSON.parse(response);

      // Store assistant response for context
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
      });

      // Keep conversation history manageable (last 10 exchanges)
      if (this.conversationHistory.length > 21) {
        this.conversationHistory = [
          this.conversationHistory[0], // Keep system prompt
          ...this.conversationHistory.slice(-20), // Keep last 20 messages
        ];
      }

      logger.info('[WhisperGPTService] Command analysis complete', { analysis });

      return analysis;
    } catch (error) {
      logger.error('[WhisperGPTService] Command analysis failed', { error });
      return this.fallbackAnalyzeCommand(text);
    }
  }

  /**
   * Build context-aware prompt for GPT-4
   */
  private buildContextPrompt(command: string): string {
    if (!this.context) {
      return `Analyze this DAW command: "${command}"`;
    }

    const contextInfo = [
      `Current DAW state:`,
      `- ${this.context.tracks.length} tracks`,
      `- Playback: ${this.context.isPlaying ? 'playing' : 'stopped'}`,
      `- Recording: ${this.context.isRecording ? 'active' : 'inactive'}`,
      `- Current time: ${this.context.currentTime.toFixed(2)}s`,
      `- BPM: ${this.context.bpm}`,
      `- Selected clips: ${this.context.selectedClipIds.length}`,
      '',
      `User command: "${command}"`,
      '',
      `Analyze the command and return JSON with intent, action, parameters, confidence (0-1), requiresConfirmation (bool), and naturalResponse (string).`,
    ].join('\n');

    return contextInfo;
  }

  /**
   * Fallback command analysis using pattern matching
   */
  private fallbackAnalyzeCommand(text: string): GPT4CommandAnalysis {
    const lowerText = text.toLowerCase().trim();

    // Transport commands
    if (/^(play|start|resume)/.test(lowerText)) {
      return {
        intent: 'transport',
        action: 'play',
        parameters: {},
        confidence: 0.9,
        requiresConfirmation: false,
        naturalResponse: 'Starting playback.',
      };
    }

    if (/^(pause|hold)/.test(lowerText)) {
      return {
        intent: 'transport',
        action: 'pause',
        parameters: {},
        confidence: 0.9,
        requiresConfirmation: false,
        naturalResponse: 'Pausing playback.',
      };
    }

    if (/^(stop|halt)/.test(lowerText)) {
      return {
        intent: 'transport',
        action: 'stop',
        parameters: {},
        confidence: 0.9,
        requiresConfirmation: false,
        naturalResponse: 'Stopping playback.',
      };
    }

    if (/^(record|rec)/.test(lowerText)) {
      return {
        intent: 'transport',
        action: 'record',
        parameters: {},
        confidence: 0.9,
        requiresConfirmation: false,
        naturalResponse: 'Starting recording.',
      };
    }

    // Track commands
    if (/add|create|new.*(track|channel)/.test(lowerText)) {
      return {
        intent: 'timeline',
        action: 'add_track',
        parameters: {},
        confidence: 0.8,
        requiresConfirmation: false,
        naturalResponse: 'Adding a new track.',
      };
    }

    // Default: unknown command
    return {
      intent: 'unknown',
      action: 'none',
      parameters: {},
      confidence: 0.3,
      requiresConfirmation: false,
      naturalResponse: "I didn't understand that command. Please try again or say 'help' for available commands.",
    };
  }

  // ==========================================================================
  // Text-to-Speech
  // ==========================================================================

  /**
   * Convert text to speech using OpenAI TTS
   */
  public async speak(text: string, options?: {
    voice?: typeof this.config.ttsVoice;
    speed?: number;
  }): Promise<TTSResult> {
    if (!this.client) {
      logger.warn('[WhisperGPTService] TTS not available without API key');
      throw new Error('TTS requires OpenAI API key');
    }

    try {
      logger.info('[WhisperGPTService] Generating speech', { text });

      const startTime = Date.now();

      const response = await this.client.audio.speech.create({
        model: this.config.ttsModel,
        voice: options?.voice || this.config.ttsVoice,
        input: text,
        speed: options?.speed || 1.0,
      });

      const audioData = await response.arrayBuffer();
      const duration = (Date.now() - startTime) / 1000;

      logger.info('[WhisperGPTService] Speech generation complete', { duration });

      return {
        audioData,
        format: 'mp3',
        duration,
      };
    } catch (error) {
      logger.error('[WhisperGPTService] TTS failed', { error });
      throw new Error(`Text-to-speech failed: ${error}`);
    }
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  /**
   * Clear conversation history (keep system prompt)
   */
  public resetConversation(): void {
    this.initializeSystemPrompt();
    logger.info('[WhisperGPTService] Conversation history reset');
  }

  /**
   * Check if service is initialized with API key
   */
  public isInitialized(): boolean {
    return this.client !== null;
  }

  /**
   * Get current configuration
   */
  public getConfig(): Readonly<Required<WhisperGPTConfig>> {
    return { ...this.config };
  }
}

// Export singleton instance
export const whisperGPTService = new WhisperGPTService();
