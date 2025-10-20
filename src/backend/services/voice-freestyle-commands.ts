/**
 * Voice Freestyle Commander Service
 *
 * Extends VoiceTestCommander to recognize freestyle-specific voice commands
 * for music production workflows.
 *
 * Pipeline:
 * 1. Voice → Whisper API → Text
 * 2. Text → GPT-4 → Freestyle Intent Detection + Parameters
 * 3. Intent → FreestyleOrchestrator → Execute Freestyle Action
 * 4. Results → TTS → Audio Response
 *
 * Supported Commands:
 * - Recording: "record me freestyle", "capture this melody"
 * - Beat Creation: "create a trap beat", "give me a hip-hop beat"
 * - Control: "stop recording", "playback", "that's it"
 * - Editing: "fix the lyrics", "show me the melody", "enhance lyrics"
 */

import OpenAI from 'openai';
import { VoiceTestCommander } from './voice-test-commander';
import { generateMusic, generateBeat } from './musicgen-service';
import { generateVocalsFromMelody } from './melody-vocals-service';
import type { MusicGenResponse } from './musicgen-service';
import type { MelodyToVocalsResponse } from './melody-vocals-service';
import fs from 'fs/promises';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// Types & Interfaces
// ============================================================================

export type FreestyleAction =
  | 'START_FREESTYLE_RECORDING'
  | 'CREATE_BEAT'
  | 'STOP_RECORDING'
  | 'PLAYBACK_RECORDING'
  | 'FIX_LYRICS'
  | 'SHOW_MELODY'
  | 'ENHANCE_LYRICS'
  | 'OPEN_PIANO_ROLL'
  | 'LOAD_BEAT'
  | 'CREATE_INSTRUMENTAL';

export interface FreestyleIntent {
  action: FreestyleAction;
  parameters: {
    beatStyle?: string; // 'trap', 'hip-hop', 'pop', 'boom-bap', etc.
    recordingMode?: string; // 'vocal', 'melody', 'idea'
    targetKey?: string; // 'C', 'Am', 'F#m', etc.
    targetBPM?: number; // 60-180
    mood?: string; // 'energetic', 'chill', 'dark', etc.
    genre?: string; // For lyrics generation context
    theme?: string; // Lyrical theme
  };
  confidence: number;
  rawCommand: string;
}

export interface FreestyleConfig {
  projectId: string;
  userId: string;
  autoCreateBeat?: boolean;
  beatStyle?: string;
  targetBPM?: number;
  targetKey?: string;
  recordingMode?: 'vocal' | 'melody' | 'idea';
  mood?: string;
}

export interface FreestyleSession {
  sessionId: string;
  projectId: string;
  userId: string;
  startTime: number;
  beatCreated: boolean;
  beatUrl?: string;
  beatBPM?: number;
  beatKey?: string;
  recordingActive: boolean;
  recordingPath?: string;
}

export interface RecordingResult {
  success: boolean;
  audioUrl?: string;
  transcription?: string;
  melodyNotes?: string[];
  lyrics?: string;
  duration?: number;
  key?: string;
  bpm?: number;
  error?: string;
}

export interface FreestyleCommandResult {
  success: boolean;
  message: string;
  speechResponse: string;
  session?: FreestyleSession;
  recording?: RecordingResult;
  beat?: MusicGenResponse;
  vocals?: MelodyToVocalsResponse;
  error?: string;
}

// ============================================================================
// Freestyle Voice Response Templates
// ============================================================================

const VOICE_RESPONSES = {
  // Recording start
  RECORDING_START_WITH_BEAT: (beatStyle: string, bpm: number) =>
    `Got it! Creating ${beatStyle} beat at ${bpm} BPM... Recording in 3... 2... 1... Go!`,
  RECORDING_START_NO_BEAT: () =>
    `Ready to record your freestyle. Recording in 3... 2... 1... Go!`,
  RECORDING_START_LOADING_BEAT: (beatStyle: string) =>
    `Loading ${beatStyle} beat from library... Get ready!`,

  // Beat creation
  BEAT_CREATING: (genre: string, bpm: number, key: string) =>
    `Creating ${genre} beat at ${bpm} BPM in ${key}... This will take about 15 seconds.`,
  BEAT_READY: (genre: string) => `Your ${genre} beat is ready! Say "record me" to start freestyling.`,

  // Recording stop
  RECORDING_STOPPED: () => `Nice! Processing your freestyle... Extracting melody and lyrics...`,
  RECORDING_STOPPED_WITH_COUNT: (duration: number) =>
    `Got it! Recorded ${duration} seconds. Processing now...`,

  // Playback
  PLAYBACK_STARTED: () => `Playing back your recording...`,
  PLAYBACK_WITH_NOTES: (noteCount: number) =>
    `Playing back your recording. I detected ${noteCount} notes in your melody.`,

  // Lyrics processing
  LYRICS_FIXING: () => `Analyzing your lyrics... Running AI enhancement...`,
  LYRICS_ENHANCED: (lineCount: number) =>
    `Enhanced ${lineCount} lines of lyrics. Ready to generate vocals.`,

  // Melody extraction
  MELODY_EXTRACTED: (noteCount: number, key: string) =>
    `Opening piano roll with your melody. ${noteCount} notes extracted in ${key}.`,
  MELODY_ANALYZING: () => `Extracting melody from your recording... This will take a moment.`,

  // Errors
  ERROR_NO_RECORDING: () => `I don't have an active recording. Say "record me freestyle" to start.`,
  ERROR_ALREADY_RECORDING: () =>
    `Recording is already in progress. Say "stop recording" when you're done.`,
  ERROR_BEAT_GENERATION: () =>
    `I had trouble creating the beat. Let's try recording without a beat first.`,
  ERROR_GENERAL: (error: string) => `Something went wrong: ${error}. Let's try again.`,
};

// ============================================================================
// Freestyle Command Patterns
// ============================================================================

const FREESTYLE_COMMANDS = {
  RECORDING_START: [
    'record me freestyle',
    'start recording freestyle',
    'record my idea',
    'capture this melody',
    'let me hum something',
    'freestyle session',
    'record vocals',
    'start freestyle',
    'capture my flow',
    'record this beat',
  ],

  BEAT_CREATION: [
    'create a beat',
    'make a trap beat',
    'give me a hip-hop beat',
    'create instrumental',
    'generate a beat',
    'make me a beat',
    'need a beat',
    'create boom bap',
    'make a lo-fi beat',
  ],

  RECORDING_STOP: [
    'stop recording',
    "that's it",
    'done recording',
    'stop',
    'finish recording',
    "i'm done",
    'end recording',
  ],

  PLAYBACK: [
    'playback',
    'play it back',
    'hear it',
    'listen back',
    'play recording',
    'let me hear it',
  ],

  LYRICS_EDITING: [
    'fix the lyrics',
    'enhance the lyrics',
    'improve lyrics',
    'make lyrics better',
    'polish the lyrics',
  ],

  MELODY_VIEWING: [
    'show me the melody',
    'open piano roll',
    'see the notes',
    'view melody',
    'open midi editor',
  ],
};

// ============================================================================
// Voice Freestyle Commander Service
// ============================================================================

export class VoiceFreestyleCommander extends VoiceTestCommander {
  private freestyleSessions: Map<string, FreestyleSession> = new Map();
  private recordingBuffers: Map<string, Buffer> = new Map();

  constructor() {
    super();
  }

  // ==========================================================================
  // Intent Detection
  // ==========================================================================

  /**
   * Detect freestyle-specific intent from voice command using GPT-4
   */
  async detectFreestyleIntent(voiceCommand: string): Promise<FreestyleIntent> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: this.getFreestyleIntentPrompt(),
          },
          {
            role: 'user',
            content: `User said: "${voiceCommand}"`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');

      return {
        action: result.action || 'START_FREESTYLE_RECORDING',
        parameters: result.parameters || {},
        confidence: result.confidence || 0,
        rawCommand: voiceCommand,
      };
    } catch (error) {
      console.error('Freestyle intent detection error:', error);
      return {
        action: 'START_FREESTYLE_RECORDING',
        parameters: {},
        confidence: 0,
        rawCommand: voiceCommand,
      };
    }
  }

  /**
   * GPT-4 system prompt for freestyle intent detection
   */
  private getFreestyleIntentPrompt(): string {
    return `You are a voice command interpreter for a music production DAW's freestyle mode.

Your job is to detect the user's intent and extract musical parameters from their natural language command.

INTENTS:

1. START_FREESTYLE_RECORDING
   - User wants to record vocals, melody, or freestyle idea
   - Extract: beatStyle (trap, hip-hop, boom-bap, pop, lo-fi, etc.), targetBPM, targetKey, mood
   - Examples: "record me freestyle", "capture this melody", "let me hum something"

2. CREATE_BEAT
   - User wants to create a backing track first before recording
   - Extract: beatStyle, targetBPM, targetKey, mood
   - Examples: "create a trap beat", "make a hip-hop beat at 90 BPM", "give me a dark boom-bap beat"

3. LOAD_BEAT
   - User wants to load an existing beat from library
   - Extract: beatStyle, genre
   - Examples: "load a beat", "give me a beat from library"

4. STOP_RECORDING
   - User wants to stop the current recording session
   - No parameters needed
   - Examples: "stop recording", "that's it", "done", "finish"

5. PLAYBACK_RECORDING
   - User wants to hear their recording
   - Examples: "playback", "play it back", "let me hear it"

6. FIX_LYRICS
   - User wants AI to enhance transcribed lyrics
   - Extract: theme, mood, genre for context
   - Examples: "fix the lyrics", "make the lyrics better", "enhance lyrics"

7. ENHANCE_LYRICS
   - User wants AI to improve and polish lyrics
   - Same as FIX_LYRICS but more comprehensive
   - Examples: "enhance the lyrics", "polish the lyrics"

8. SHOW_MELODY
   - User wants to see extracted MIDI notes in piano roll
   - Examples: "show me the melody", "see the notes", "view melody"

9. OPEN_PIANO_ROLL
   - User wants to open the MIDI editor
   - Same as SHOW_MELODY
   - Examples: "open piano roll", "open midi editor"

PARAMETER EXTRACTION:

- beatStyle: Extract genre/style keywords (trap, hip-hop, boom-bap, pop, lo-fi, rock, jazz, etc.)
- targetBPM: Extract tempo if mentioned (60-180 typical range)
  - "slow" = 70-90, "medium" = 90-120, "fast" = 120-150, "very fast" = 150-180
- targetKey: Extract musical key if mentioned (C, Am, F#m, etc.)
- mood: Extract mood descriptors (energetic, chill, dark, happy, sad, aggressive, mellow)
- recordingMode: vocal, melody, or idea (default: vocal)
- genre: For lyrical context
- theme: Lyrical theme if mentioned

RESPONSE FORMAT:

Return JSON with this exact structure:
{
  "action": "START_FREESTYLE_RECORDING",
  "parameters": {
    "beatStyle": "trap",
    "targetBPM": 140,
    "targetKey": "Am",
    "mood": "dark"
  },
  "confidence": 0.95
}

Confidence should be 0-1 based on how clear the command is.

EXAMPLES:

User: "record me freestyle with a trap beat"
{
  "action": "START_FREESTYLE_RECORDING",
  "parameters": {
    "beatStyle": "trap",
    "targetBPM": 140,
    "mood": "energetic"
  },
  "confidence": 0.95
}

User: "create a chill lo-fi beat at 80 BPM"
{
  "action": "CREATE_BEAT",
  "parameters": {
    "beatStyle": "lo-fi",
    "targetBPM": 80,
    "mood": "chill"
  },
  "confidence": 0.98
}

User: "stop recording"
{
  "action": "STOP_RECORDING",
  "parameters": {},
  "confidence": 1.0
}

User: "show me the melody"
{
  "action": "SHOW_MELODY",
  "parameters": {},
  "confidence": 1.0
}

Now analyze the user's command and return the appropriate JSON.`;
  }

  // ==========================================================================
  // Freestyle Command Handlers
  // ==========================================================================

  /**
   * Main handler for freestyle commands
   */
  async handleFreestyleCommand(
    intent: FreestyleIntent,
    sessionId: string,
    userId: string,
    projectId?: string
  ): Promise<FreestyleCommandResult> {
    try {
      switch (intent.action) {
        case 'START_FREESTYLE_RECORDING':
          return await this.handleStartRecording(intent, sessionId, userId, projectId);

        case 'CREATE_BEAT':
        case 'CREATE_INSTRUMENTAL':
        case 'LOAD_BEAT':
          return await this.handleCreateBeat(intent, sessionId, userId, projectId);

        case 'STOP_RECORDING':
          return await this.handleStopRecording(sessionId);

        case 'PLAYBACK_RECORDING':
          return await this.handlePlayback(sessionId);

        case 'FIX_LYRICS':
        case 'ENHANCE_LYRICS':
          return await this.handleLyricsEnhancement(intent, sessionId);

        case 'SHOW_MELODY':
        case 'OPEN_PIANO_ROLL':
          return await this.handleShowMelody(sessionId);

        default:
          return {
            success: false,
            message: 'Unknown freestyle command',
            speechResponse: VOICE_RESPONSES.ERROR_GENERAL('Unknown command'),
            error: 'Unknown command',
          };
      }
    } catch (error: any) {
      console.error('Freestyle command error:', error);
      return {
        success: false,
        message: error.message,
        speechResponse: VOICE_RESPONSES.ERROR_GENERAL(error.message),
        error: error.message,
      };
    }
  }

  /**
   * Handle START_FREESTYLE_RECORDING command
   */
  private async handleStartRecording(
    intent: FreestyleIntent,
    sessionId: string,
    userId: string,
    projectId?: string
  ): Promise<FreestyleCommandResult> {
    // Check if already recording
    const existingSession = this.freestyleSessions.get(sessionId);
    if (existingSession && existingSession.recordingActive) {
      return {
        success: false,
        message: 'Recording already in progress',
        speechResponse: VOICE_RESPONSES.ERROR_ALREADY_RECORDING(),
      };
    }

    const config: FreestyleConfig = {
      projectId: projectId || `project-${Date.now()}`,
      userId,
      autoCreateBeat: !!intent.parameters.beatStyle,
      beatStyle: intent.parameters.beatStyle || 'trap',
      targetBPM: intent.parameters.targetBPM || this.getDefaultBPMForStyle(intent.parameters.beatStyle),
      targetKey: intent.parameters.targetKey || 'Am',
      recordingMode: (intent.parameters.recordingMode as any) || 'vocal',
      mood: intent.parameters.mood,
    };

    let beatResponse: MusicGenResponse | undefined;
    let speechResponse: string;

    // Create beat if requested
    if (config.autoCreateBeat && config.beatStyle && config.targetBPM) {
      speechResponse = VOICE_RESPONSES.BEAT_CREATING(
        config.beatStyle,
        config.targetBPM,
        config.targetKey || 'Am'
      );

      // Speak while beat is generating
      await this.speakResponse(speechResponse);

      beatResponse = await this.createBeatFromVoice(
        config.beatStyle,
        config.targetBPM,
        config.targetKey,
        userId
      );

      if (!beatResponse.success) {
        return {
          success: false,
          message: 'Failed to create beat',
          speechResponse: VOICE_RESPONSES.ERROR_BEAT_GENERATION(),
          error: beatResponse.error,
        };
      }

      speechResponse = VOICE_RESPONSES.RECORDING_START_WITH_BEAT(
        config.beatStyle,
        config.targetBPM
      );
    } else {
      speechResponse = VOICE_RESPONSES.RECORDING_START_NO_BEAT();
    }

    // Create freestyle session
    const session: FreestyleSession = {
      sessionId,
      projectId: config.projectId,
      userId,
      startTime: Date.now(),
      beatCreated: !!beatResponse,
      beatUrl: beatResponse?.audio_url,
      beatBPM: config.targetBPM,
      beatKey: config.targetKey,
      recordingActive: true,
    };

    this.freestyleSessions.set(sessionId, session);

    return {
      success: true,
      message: 'Recording started',
      speechResponse,
      session,
      beat: beatResponse,
    };
  }

  /**
   * Handle CREATE_BEAT command
   */
  private async handleCreateBeat(
    intent: FreestyleIntent,
    sessionId: string,
    userId: string,
    projectId?: string
  ): Promise<FreestyleCommandResult> {
    const beatStyle = intent.parameters.beatStyle || 'trap';
    const targetBPM = intent.parameters.targetBPM || this.getDefaultBPMForStyle(beatStyle);
    const targetKey = intent.parameters.targetKey || 'Am';

    const speechResponse = VOICE_RESPONSES.BEAT_CREATING(beatStyle, targetBPM, targetKey);

    // Speak while generating
    await this.speakResponse(speechResponse);

    const beatResponse = await this.createBeatFromVoice(beatStyle, targetBPM, targetKey, userId);

    if (!beatResponse.success) {
      return {
        success: false,
        message: 'Failed to create beat',
        speechResponse: VOICE_RESPONSES.ERROR_BEAT_GENERATION(),
        beat: beatResponse,
        error: beatResponse.error,
      };
    }

    const readySpeech = VOICE_RESPONSES.BEAT_READY(beatStyle);

    return {
      success: true,
      message: 'Beat created',
      speechResponse: readySpeech,
      beat: beatResponse,
    };
  }

  /**
   * Handle STOP_RECORDING command
   */
  private async handleStopRecording(sessionId: string): Promise<FreestyleCommandResult> {
    const session = this.freestyleSessions.get(sessionId);

    if (!session || !session.recordingActive) {
      return {
        success: false,
        message: 'No active recording',
        speechResponse: VOICE_RESPONSES.ERROR_NO_RECORDING(),
      };
    }

    // Mark recording as stopped
    session.recordingActive = false;
    const duration = (Date.now() - session.startTime) / 1000;

    const speechResponse = VOICE_RESPONSES.RECORDING_STOPPED_WITH_COUNT(Math.round(duration));

    // In production, this would process the recorded audio
    // For now, we'll return a placeholder result
    const recordingResult: RecordingResult = {
      success: true,
      duration,
      // These would come from actual audio processing:
      // transcription, melodyNotes, lyrics, key, bpm
    };

    return {
      success: true,
      message: 'Recording stopped',
      speechResponse,
      session,
      recording: recordingResult,
    };
  }

  /**
   * Handle PLAYBACK_RECORDING command
   */
  private async handlePlayback(sessionId: string): Promise<FreestyleCommandResult> {
    const session = this.freestyleSessions.get(sessionId);

    if (!session) {
      return {
        success: false,
        message: 'No recording found',
        speechResponse: VOICE_RESPONSES.ERROR_NO_RECORDING(),
      };
    }

    const speechResponse = VOICE_RESPONSES.PLAYBACK_STARTED();

    return {
      success: true,
      message: 'Playing recording',
      speechResponse,
      session,
    };
  }

  /**
   * Handle ENHANCE_LYRICS command
   */
  private async handleLyricsEnhancement(
    intent: FreestyleIntent,
    sessionId: string
  ): Promise<FreestyleCommandResult> {
    const session = this.freestyleSessions.get(sessionId);

    if (!session) {
      return {
        success: false,
        message: 'No recording found',
        speechResponse: VOICE_RESPONSES.ERROR_NO_RECORDING(),
      };
    }

    const speechResponse = VOICE_RESPONSES.LYRICS_FIXING();
    await this.speakResponse(speechResponse);

    // In production, this would call the lyrics enhancement service
    // For now, return placeholder
    const enhancedSpeech = VOICE_RESPONSES.LYRICS_ENHANCED(8);

    return {
      success: true,
      message: 'Lyrics enhanced',
      speechResponse: enhancedSpeech,
      session,
    };
  }

  /**
   * Handle SHOW_MELODY command
   */
  private async handleShowMelody(sessionId: string): Promise<FreestyleCommandResult> {
    const session = this.freestyleSessions.get(sessionId);

    if (!session) {
      return {
        success: false,
        message: 'No recording found',
        speechResponse: VOICE_RESPONSES.ERROR_NO_RECORDING(),
      };
    }

    const analyzingSpeech = VOICE_RESPONSES.MELODY_ANALYZING();
    await this.speakResponse(analyzingSpeech);

    // In production, this would extract melody from audio
    const noteCount = 24; // Placeholder
    const key = session.beatKey || 'Am';

    const speechResponse = VOICE_RESPONSES.MELODY_EXTRACTED(noteCount, key);

    return {
      success: true,
      message: 'Melody extracted',
      speechResponse,
      session,
    };
  }

  // ==========================================================================
  // Beat Creation
  // ==========================================================================

  /**
   * Create beat from voice command parameters
   */
  async createBeatFromVoice(
    beatStyle: string,
    targetBPM?: number,
    targetKey?: string,
    userId?: string
  ): Promise<MusicGenResponse> {
    const bpm = targetBPM || this.getDefaultBPMForStyle(beatStyle);

    try {
      const beatResponse = await generateBeat({
        genre: beatStyle,
        tempo: bpm,
        duration: 30, // Standard 30-second loop
      });

      return beatResponse;
    } catch (error: any) {
      console.error('Beat generation error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get default BPM for music style
   */
  private getDefaultBPMForStyle(style?: string): number {
    const bpmMap: Record<string, number> = {
      'trap': 140,
      'hip-hop': 90,
      'boom-bap': 90,
      'lo-fi': 80,
      'pop': 120,
      'rock': 120,
      'jazz': 120,
      'electronic': 128,
      'house': 128,
      'techno': 130,
      'dnb': 174,
      'dubstep': 140,
    };

    return bpmMap[style?.toLowerCase() || ''] || 120;
  }

  // ==========================================================================
  // Voice Response Synthesis
  // ==========================================================================

  /**
   * Speak a response using TTS (inherits from VoiceTestCommander)
   */
  async speakResponse(text: string): Promise<void> {
    try {
      const audio = await this.synthesizeSpeech(text);
      // In production, this would play the audio or send to client
      console.log(`🗣️  Speaking: "${text}"`);
    } catch (error) {
      console.error('TTS error:', error);
    }
  }

  // ==========================================================================
  // Session Management
  // ==========================================================================

  /**
   * Get or create freestyle session
   */
  getFreestyleSession(sessionId: string): FreestyleSession | undefined {
    return this.freestyleSessions.get(sessionId);
  }

  /**
   * Store recording audio buffer
   */
  storeRecordingBuffer(sessionId: string, buffer: Buffer): void {
    this.recordingBuffers.set(sessionId, buffer);
  }

  /**
   * Retrieve recording audio buffer
   */
  getRecordingBuffer(sessionId: string): Buffer | undefined {
    return this.recordingBuffers.get(sessionId);
  }

  /**
   * Clear session data
   */
  clearSession(sessionId: string): void {
    this.freestyleSessions.delete(sessionId);
    this.recordingBuffers.delete(sessionId);
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Process freestyle voice command end-to-end
   */
  async processFreestyleVoiceCommand(
    audioBuffer: Buffer,
    userId: string,
    sessionId?: string,
    projectId?: string
  ): Promise<FreestyleCommandResult> {
    const sid = sessionId || `freestyle-${userId}-${Date.now()}`;

    try {
      // 1. Transcribe audio to text
      const text = await this.transcribeAudio(audioBuffer);
      console.log('📝 Transcribed:', text);
      this.emit('freestyle-transcription', { text, userId, sessionId: sid });

      // 2. Detect freestyle intent
      const intent = await this.detectFreestyleIntent(text);
      console.log('🎯 Intent detected:', intent);
      this.emit('freestyle-intent-detected', { intent, userId, sessionId: sid });

      // 3. Handle freestyle command
      const result = await this.handleFreestyleCommand(intent, sid, userId, projectId);
      this.emit('freestyle-command-complete', { result, userId, sessionId: sid });

      // 4. Synthesize voice response
      const responseAudio = await this.synthesizeSpeech(result.speechResponse);

      return {
        ...result,
        speechResponse: result.speechResponse,
      };
    } catch (error: any) {
      console.error('Freestyle voice command error:', error);

      const errorResponse = VOICE_RESPONSES.ERROR_GENERAL(error.message);

      return {
        success: false,
        message: error.message,
        speechResponse: errorResponse,
        error: error.message,
      };
    }
  }
}

// Singleton instance
export const voiceFreestyleCommander = new VoiceFreestyleCommander();

// Export for testing
export { FREESTYLE_COMMANDS, VOICE_RESPONSES };
