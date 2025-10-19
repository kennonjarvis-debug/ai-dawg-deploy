/**
 * DAW Command Service
 *
 * Natural language command processing for DAW control using GPT-4
 * - Intent detection and classification
 * - Command parameter extraction
 * - DAW action execution
 */

import { logger } from '../utils/logger';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DAWCommand {
  intent:
    | 'create_track'
    | 'set_bpm'
    | 'add_effect'
    | 'generate_beat'
    | 'record'
    | 'mix'
    | 'play'
    | 'stop'
    | 'unknown';
  parameters: Record<string, any>;
  confidence: number;
  rawCommand: string;
}

export interface DAWCommandResult {
  success: boolean;
  action: string;
  result?: any;
  message: string;
  error?: string;
}

export interface DAWState {
  tracks: Array<{
    id: string;
    name: string;
    volume: number;
    pan: number;
    effects: string[];
  }>;
  bpm: number;
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number;
}

export class DAWCommandService {
  private conversationHistory: Map<string, ChatCompletionMessageParam[]> = new Map();

  /**
   * Process natural language command
   */
  async processCommand(
    command: string,
    userId: string,
    projectId: string,
    currentState: DAWState
  ): Promise<DAWCommandResult> {
    logger.info('[DAW Command] Processing command', { command, userId, projectId });

    try {
      // Step 1: Detect intent using GPT-4
      const detectedCommand = await this.detectIntent(command, userId, currentState);

      logger.info('[DAW Command] Intent detected', {
        intent: detectedCommand.intent,
        parameters: detectedCommand.parameters,
        confidence: detectedCommand.confidence,
      });

      // Step 2: Execute command
      const result = await this.executeCommand(detectedCommand, projectId, currentState);

      logger.info('[DAW Command] Command executed', { result });

      return result;
    } catch (error) {
      logger.error('[DAW Command] Command failed', { error, command });
      return {
        success: false,
        action: 'error',
        message: `Failed to process command: ${error}`,
        error: String(error),
      };
    }
  }

  /**
   * Detect intent from natural language using GPT-4
   */
  private async detectIntent(
    command: string,
    userId: string,
    currentState: DAWState
  ): Promise<DAWCommand> {
    // Get or create conversation history
    let history = this.conversationHistory.get(userId);
    if (!history) {
      history = [
        {
          role: 'system',
          content: `You are a DAW (Digital Audio Workstation) command interpreter.
Your job is to understand natural language commands and convert them to structured actions.

Current DAW State:
- BPM: ${currentState.bpm}
- Tracks: ${currentState.tracks.length}
- Playing: ${currentState.isPlaying}
- Recording: ${currentState.isRecording}

Available commands:
1. create_track - Create a new track
2. set_bpm - Set the tempo
3. add_effect - Add an effect to a track
4. generate_beat - Generate a beat/music
5. record - Start recording
6. mix - Adjust mix/levels
7. play - Start playback
8. stop - Stop playback

Respond ONLY with a JSON object in this exact format:
{
  "intent": "command_name",
  "parameters": { "key": "value" },
  "confidence": 0.95
}

Examples:
User: "Create a new track called Vocals"
Response: {"intent": "create_track", "parameters": {"name": "Vocals"}, "confidence": 0.95}

User: "Set BPM to 120"
Response: {"intent": "set_bpm", "parameters": {"bpm": 120}, "confidence": 0.98}

User: "Add reverb to track 2"
Response: {"intent": "add_effect", "parameters": {"effect": "reverb", "trackNumber": 2}, "confidence": 0.92}

User: "Generate a hip-hop beat in C minor"
Response: {"intent": "generate_beat", "parameters": {"genre": "hip-hop", "key": "Cm"}, "confidence": 0.90}

User: "Record 4 bars on track 1"
Response: {"intent": "record", "parameters": {"bars": 4, "trackNumber": 1}, "confidence": 0.93}

User: "Mix the vocals louder"
Response: {"intent": "mix", "parameters": {"target": "vocals", "adjustment": "louder"}, "confidence": 0.88}`,
        },
      ];
      this.conversationHistory.set(userId, history);
    }

    // Add user command
    history.push({
      role: 'user',
      content: command,
    });

    // Call GPT-4
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: history,
      temperature: 0.3,
      max_tokens: 200,
    });

    const assistantMessage = response.choices[0].message.content || '{}';

    // Add assistant response to history
    history.push({
      role: 'assistant',
      content: assistantMessage,
    });

    // Keep only last 10 messages
    if (history.length > 11) {
      history = [history[0], ...history.slice(-10)];
      this.conversationHistory.set(userId, history);
    }

    // Parse response
    let parsed: any;
    try {
      // Extract JSON from response
      const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(assistantMessage);
      }
    } catch (parseError) {
      logger.error('[DAW Command] Failed to parse GPT response', {
        response: assistantMessage,
        error: parseError,
      });
      parsed = {
        intent: 'unknown',
        parameters: {},
        confidence: 0.0,
      };
    }

    return {
      intent: parsed.intent || 'unknown',
      parameters: parsed.parameters || {},
      confidence: parsed.confidence || 0.5,
      rawCommand: command,
    };
  }

  /**
   * Execute the detected command
   */
  private async executeCommand(
    command: DAWCommand,
    projectId: string,
    currentState: DAWState
  ): Promise<DAWCommandResult> {
    switch (command.intent) {
      case 'create_track':
        return this.createTrack(command.parameters, projectId);

      case 'set_bpm':
        return this.setBPM(command.parameters, projectId);

      case 'add_effect':
        return this.addEffect(command.parameters, projectId, currentState);

      case 'generate_beat':
        return this.generateBeat(command.parameters, projectId);

      case 'record':
        return this.startRecording(command.parameters, projectId);

      case 'mix':
        return this.adjustMix(command.parameters, projectId, currentState);

      case 'play':
        return this.playback('play', projectId);

      case 'stop':
        return this.playback('stop', projectId);

      default:
        return {
          success: false,
          action: 'unknown',
          message: `I don't understand the command: "${command.rawCommand}". Try commands like "Create a new track" or "Set BPM to 120".`,
        };
    }
  }

  /**
   * Create a new track
   */
  private async createTrack(
    params: Record<string, any>,
    projectId: string
  ): Promise<DAWCommandResult> {
    const trackName = params.name || 'New Track';
    const trackType = params.type || 'audio';

    logger.info('[DAW Command] Creating track', { trackName, trackType, projectId });

    // In production, this would call the actual DAW API
    const trackId = `track_${Date.now()}`;

    return {
      success: true,
      action: 'create_track',
      result: {
        trackId,
        name: trackName,
        type: trackType,
      },
      message: `Created ${trackType} track "${trackName}"`,
    };
  }

  /**
   * Set BPM
   */
  private async setBPM(
    params: Record<string, any>,
    projectId: string
  ): Promise<DAWCommandResult> {
    const bpm = parseInt(params.bpm);

    if (isNaN(bpm) || bpm < 20 || bpm > 300) {
      return {
        success: false,
        action: 'set_bpm',
        message: 'BPM must be between 20 and 300',
      };
    }

    logger.info('[DAW Command] Setting BPM', { bpm, projectId });

    return {
      success: true,
      action: 'set_bpm',
      result: { bpm },
      message: `Set BPM to ${bpm}`,
    };
  }

  /**
   * Add effect to track
   */
  private async addEffect(
    params: Record<string, any>,
    projectId: string,
    currentState: DAWState
  ): Promise<DAWCommandResult> {
    const effect = params.effect || params.name;
    const trackNumber = params.trackNumber || params.track;
    const trackName = params.trackName;

    // Find target track
    let targetTrack = null;
    if (trackNumber) {
      targetTrack = currentState.tracks[trackNumber - 1];
    } else if (trackName) {
      targetTrack = currentState.tracks.find(
        t => t.name.toLowerCase() === trackName.toLowerCase()
      );
    }

    if (!targetTrack) {
      return {
        success: false,
        action: 'add_effect',
        message: `Could not find track ${trackNumber || trackName}`,
      };
    }

    logger.info('[DAW Command] Adding effect', {
      effect,
      trackId: targetTrack.id,
      projectId,
    });

    return {
      success: true,
      action: 'add_effect',
      result: {
        trackId: targetTrack.id,
        effect,
      },
      message: `Added ${effect} to ${targetTrack.name}`,
    };
  }

  /**
   * Generate beat/music
   */
  private async generateBeat(
    params: Record<string, any>,
    projectId: string
  ): Promise<DAWCommandResult> {
    const genre = params.genre || 'trap';
    const key = params.key || 'C';
    const mood = params.mood || 'energetic';
    const duration = params.duration || params.bars ? params.bars * 4 : 8;

    logger.info('[DAW Command] Generating beat', {
      genre,
      key,
      mood,
      duration,
      projectId,
    });

    return {
      success: true,
      action: 'generate_beat',
      result: {
        genre,
        key,
        mood,
        duration,
        jobId: `gen_${Date.now()}`,
      },
      message: `Generating ${genre} beat in ${key}... This may take a moment.`,
    };
  }

  /**
   * Start recording
   */
  private async startRecording(
    params: Record<string, any>,
    projectId: string
  ): Promise<DAWCommandResult> {
    const trackNumber = params.trackNumber || params.track || 1;
    const bars = params.bars || params.duration;

    logger.info('[DAW Command] Starting recording', {
      trackNumber,
      bars,
      projectId,
    });

    return {
      success: true,
      action: 'record',
      result: {
        trackNumber,
        bars,
      },
      message: bars
        ? `Recording ${bars} bars on track ${trackNumber}`
        : `Recording on track ${trackNumber}`,
    };
  }

  /**
   * Adjust mix/levels
   */
  private async adjustMix(
    params: Record<string, any>,
    projectId: string,
    currentState: DAWState
  ): Promise<DAWCommandResult> {
    const target = params.target || params.trackName;
    const adjustment = params.adjustment; // 'louder', 'quieter', 'up', 'down'
    const amount = params.amount || params.db || 3; // Default 3dB change

    // Find target track
    const targetTrack = currentState.tracks.find(
      t => t.name.toLowerCase().includes(target?.toLowerCase() || '')
    );

    if (!targetTrack) {
      return {
        success: false,
        action: 'mix',
        message: `Could not find track matching "${target}"`,
      };
    }

    let volumeChange = 0;
    if (adjustment === 'louder' || adjustment === 'up') {
      volumeChange = amount;
    } else if (adjustment === 'quieter' || adjustment === 'down') {
      volumeChange = -amount;
    }

    logger.info('[DAW Command] Adjusting mix', {
      trackId: targetTrack.id,
      volumeChange,
      projectId,
    });

    return {
      success: true,
      action: 'mix',
      result: {
        trackId: targetTrack.id,
        volumeChange,
      },
      message: `Adjusted ${targetTrack.name} volume ${volumeChange > 0 ? 'up' : 'down'} by ${Math.abs(volumeChange)}dB`,
    };
  }

  /**
   * Control playback
   */
  private async playback(
    action: 'play' | 'stop',
    projectId: string
  ): Promise<DAWCommandResult> {
    logger.info('[DAW Command] Playback control', { action, projectId });

    return {
      success: true,
      action: `playback_${action}`,
      result: { action },
      message: action === 'play' ? 'Starting playback' : 'Stopping playback',
    };
  }

  /**
   * Clear conversation history for user
   */
  clearHistory(userId: string): void {
    this.conversationHistory.delete(userId);
    logger.info('[DAW Command] Cleared conversation history', { userId });
  }

  /**
   * Get conversation history
   */
  getHistory(userId: string): ChatCompletionMessageParam[] {
    return this.conversationHistory.get(userId) || [];
  }
}

// Export singleton instance
export const dawCommandService = new DAWCommandService();
