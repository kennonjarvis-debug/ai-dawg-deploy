/**
 * Unified Voice Controller
 *
 * Orchestrates all voice control systems for DAWG AI:
 * - Web Speech API for basic commands (fast, offline)
 * - Whisper + GPT-4 for advanced AI understanding
 * - Command routing and execution
 * - Voice feedback (TTS)
 * - Context management
 *
 * @module VoiceController
 */

import { voiceCommandService, type VoiceCommand, type VoiceCommandMatch } from './voiceCommandService';
import { whisperGPTService, type WhisperTranscriptionResult, type GPT4CommandAnalysis, type VoiceContext } from './WhisperGPTService';
import { useTransportStore } from '../stores/transportStore';
import { useTimelineStore } from '../stores/timelineStore';
import { getAudioEngine } from '../audio/AudioEngine';
import { logger } from '../backend/utils/logger';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export type VoiceMode = 'basic' | 'ai' | 'hybrid';

export interface VoiceControllerConfig {
  mode?: VoiceMode;
  enableTTS?: boolean;
  enableContinuous?: boolean;
  whisperAPIKey?: string;
  language?: string;
  confidenceThreshold?: number;
}

export interface VoiceCommandResult {
  success: boolean;
  action: string;
  message: string;
  parameters?: Record<string, any>;
  audioFeedback?: ArrayBuffer;
}

export interface VoiceControllerState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  mode: VoiceMode;
  currentTranscript: string;
  lastCommand: string | null;
  error: Error | null;
}

// ============================================================================
// Unified Voice Controller
// ============================================================================

export class VoiceController {
  private config: Required<VoiceControllerConfig>;
  private state: VoiceControllerState;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;

  // Event callbacks
  private onStateChange?: (state: VoiceControllerState) => void;
  private onCommandExecuted?: (result: VoiceCommandResult) => void;
  private onError?: (error: Error) => void;

  constructor(config?: VoiceControllerConfig) {
    this.config = {
      mode: config?.mode || 'hybrid',
      enableTTS: config?.enableTTS ?? true,
      enableContinuous: config?.enableContinuous ?? false,
      whisperAPIKey: config?.whisperAPIKey || process.env.VITE_OPENAI_API_KEY || '',
      language: config?.language || 'en-US',
      confidenceThreshold: config?.confidenceThreshold ?? 0.6,
    };

    this.state = {
      isListening: false,
      isProcessing: false,
      isSpeaking: false,
      mode: this.config.mode,
      currentTranscript: '',
      lastCommand: null,
      error: null,
    };

    this.initialize();
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  private initialize(): void {
    logger.info('[VoiceController] Initializing', { mode: this.config.mode });

    // Initialize basic voice commands (Web Speech API)
    if (this.config.mode === 'basic' || this.config.mode === 'hybrid') {
      this.setupBasicVoiceCommands();
    }

    // Initialize WhisperGPT service
    if (this.config.mode === 'ai' || this.config.mode === 'hybrid') {
      // WhisperGPTService singleton is already initialized
      logger.info('[VoiceController] AI mode enabled with Whisper + GPT-4');
    }

    logger.info('[VoiceController] Initialization complete');
  }

  private setupBasicVoiceCommands(): void {
    // Register DAW-specific commands
    this.registerBasicCommands();

    // Set up event listeners
    voiceCommandService.setOnCommandDetected(this.handleBasicCommand.bind(this));
    voiceCommandService.setOnTranscriptUpdate(this.handleTranscriptUpdate.bind(this));
    voiceCommandService.setOnListeningStateChange(this.handleListeningStateChange.bind(this));
    voiceCommandService.setOnError(this.handleVoiceError.bind(this));
  }

  private registerBasicCommands(): void {
    const transportStore = useTransportStore.getState();
    const timelineStore = useTimelineStore.getState();

    // Transport commands
    voiceCommandService.registerCommand({
      id: 'play',
      command: 'play',
      aliases: ['start', 'resume', 'playback'],
      description: 'Start playback',
      category: 'playback',
      action: () => {
        transportStore.setIsPlaying(true);
        this.speak('Playing');
      },
    });

    voiceCommandService.registerCommand({
      id: 'pause',
      command: 'pause',
      aliases: ['hold', 'wait'],
      description: 'Pause playback',
      category: 'playback',
      action: () => {
        transportStore.setIsPlaying(false);
        this.speak('Paused');
      },
    });

    voiceCommandService.registerCommand({
      id: 'stop',
      command: 'stop',
      aliases: ['halt', 'end'],
      description: 'Stop playback and return to start',
      category: 'playback',
      action: () => {
        transportStore.setIsPlaying(false);
        transportStore.setCurrentTime(0);
        this.speak('Stopped');
      },
    });

    voiceCommandService.registerCommand({
      id: 'record',
      command: 'record',
      aliases: ['rec', 'start recording', 'begin recording'],
      description: 'Start recording',
      category: 'recording',
      action: () => {
        transportStore.setIsRecording(true);
        this.speak('Recording');
      },
    });

    voiceCommandService.registerCommand({
      id: 'add_track',
      command: 'add track',
      aliases: ['new track', 'create track', 'add channel'],
      description: 'Add a new track',
      category: 'recording',
      action: () => {
        timelineStore.addTrack();
        this.speak('Track added');
      },
    });

    voiceCommandService.registerCommand({
      id: 'mute_all',
      command: 'mute all',
      aliases: ['silence all', 'mute everything'],
      description: 'Mute all tracks',
      category: 'general',
      action: () => {
        const tracks = timelineStore.tracks;
        tracks.forEach(track => {
          timelineStore.updateTrack(track.id, { muted: true });
        });
        this.speak('All tracks muted');
      },
    });

    voiceCommandService.registerCommand({
      id: 'unmute_all',
      command: 'unmute all',
      aliases: ['sound on', 'unmute everything'],
      description: 'Unmute all tracks',
      category: 'general',
      action: () => {
        const tracks = timelineStore.tracks;
        tracks.forEach(track => {
          timelineStore.updateTrack(track.id, { muted: false });
        });
        this.speak('All tracks unmuted');
      },
    });

    logger.info('[VoiceController] Basic commands registered');
  }

  // ==========================================================================
  // Voice Control Modes
  // ==========================================================================

  /**
   * Start listening (mode-dependent)
   */
  public async startListening(): Promise<void> {
    try {
      logger.info('[VoiceController] Starting to listen', { mode: this.config.mode });

      if (this.config.mode === 'basic' || this.config.mode === 'hybrid') {
        // Use Web Speech API for instant recognition
        voiceCommandService.start();
      }

      if (this.config.mode === 'ai') {
        // For AI mode, start recording for Whisper
        await this.startRecordingForAI();
      }

      this.updateState({ isListening: true, error: null });
    } catch (error) {
      logger.error('[VoiceController] Failed to start listening', { error });
      this.handleError(error as Error);
    }
  }

  /**
   * Stop listening
   */
  public stopListening(): void {
    logger.info('[VoiceController] Stopping listening');

    if (this.config.mode === 'basic' || this.config.mode === 'hybrid') {
      voiceCommandService.stop();
    }

    if (this.config.mode === 'ai' && this.mediaRecorder) {
      this.stopRecordingForAI();
    }

    this.updateState({ isListening: false });
  }

  /**
   * Start recording for AI processing
   */
  private async startRecordingForAI(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        await this.processAICommand();
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      logger.info('[VoiceController] Started AI recording');
    } catch (error) {
      logger.error('[VoiceController] Failed to start AI recording', { error });
      throw error;
    }
  }

  /**
   * Stop recording and process with AI
   */
  private stopRecordingForAI(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  /**
   * Process recorded audio with Whisper + GPT-4
   */
  private async processAICommand(): Promise<void> {
    this.updateState({ isProcessing: true });

    try {
      // Create audio blob
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      logger.info('[VoiceController] Processing audio blob', { size: audioBlob.size });

      // Transcribe with Whisper
      const transcription = await whisperGPTService.transcribe(audioBlob);
      logger.info('[VoiceController] Transcription:', transcription.text);

      this.updateState({ currentTranscript: transcription.text });

      if (!transcription.text.trim()) {
        toast.warning('No speech detected. Please try again.');
        this.updateState({ isProcessing: false });
        return;
      }

      // Analyze with GPT-4
      const context = this.getCurrentDAWContext();
      const analysis = await whisperGPTService.analyzeCommand(transcription.text, context);

      logger.info('[VoiceController] Command analysis:', analysis);

      // Execute the command
      await this.executeAICommand(analysis);

      this.updateState({ isProcessing: false, lastCommand: transcription.text });
    } catch (error) {
      logger.error('[VoiceController] AI command processing failed', { error });
      this.handleError(error as Error);
      this.updateState({ isProcessing: false });
    }
  }

  // ==========================================================================
  // Command Execution
  // ==========================================================================

  /**
   * Handle basic voice command from Web Speech API
   */
  private handleBasicCommand(match: VoiceCommandMatch): void {
    logger.info('[VoiceController] Executing basic command', { command: match.command.command });

    try {
      match.command.action(match.parameters);

      const result: VoiceCommandResult = {
        success: true,
        action: match.command.command,
        message: `Executed: ${match.command.description}`,
        parameters: match.parameters,
      };

      this.onCommandExecuted?.(result);
      toast.success(result.message);
    } catch (error) {
      logger.error('[VoiceController] Basic command execution failed', { error });
      this.handleError(error as Error);
    }
  }

  /**
   * Execute AI-analyzed command
   */
  private async executeAICommand(analysis: GPT4CommandAnalysis): Promise<void> {
    logger.info('[VoiceController] Executing AI command', { analysis });

    // Check confidence threshold
    if (analysis.confidence < this.config.confidenceThreshold) {
      toast.warning(`Low confidence (${Math.round(analysis.confidence * 100)}%). Please repeat the command.`);
      await this.speak(analysis.naturalResponse);
      return;
    }

    // Handle confirmation for destructive operations
    if (analysis.requiresConfirmation) {
      // In a real app, this would show a modal
      const confirmed = window.confirm(`${analysis.naturalResponse}\n\nDo you want to proceed?`);
      if (!confirmed) {
        await this.speak('Operation cancelled');
        return;
      }
    }

    try {
      // Route to appropriate handler
      const result = await this.routeCommand(analysis);

      this.onCommandExecuted?.(result);

      // Speak the response
      await this.speak(analysis.naturalResponse);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      logger.error('[VoiceController] AI command execution failed', { error });
      await this.speak('Sorry, I encountered an error executing that command.');
      this.handleError(error as Error);
    }
  }

  /**
   * Route command to appropriate handler based on intent
   */
  private async routeCommand(analysis: GPT4CommandAnalysis): Promise<VoiceCommandResult> {
    const transportStore = useTransportStore.getState();
    const timelineStore = useTimelineStore.getState();

    switch (analysis.intent) {
      case 'transport':
        return this.handleTransportCommand(analysis, transportStore);

      case 'timeline':
        return this.handleTimelineCommand(analysis, timelineStore);

      case 'mixer':
        return this.handleMixerCommand(analysis, timelineStore);

      case 'ai':
        return this.handleAIFeatureCommand(analysis);

      default:
        return {
          success: false,
          action: analysis.action,
          message: `Unknown command intent: ${analysis.intent}`,
        };
    }
  }

  private handleTransportCommand(analysis: GPT4CommandAnalysis, store: any): VoiceCommandResult {
    const { action, parameters } = analysis;

    switch (action) {
      case 'play':
        store.setIsPlaying(true);
        return { success: true, action, message: 'Playback started' };

      case 'pause':
        store.setIsPlaying(false);
        return { success: true, action, message: 'Playback paused' };

      case 'stop':
        store.setIsPlaying(false);
        store.setCurrentTime(0);
        return { success: true, action, message: 'Playback stopped' };

      case 'record':
        store.setIsRecording(true);
        return { success: true, action, message: 'Recording started' };

      case 'jump_to_time':
        const time = parameters.time || 0;
        store.setCurrentTime(time);
        return { success: true, action, message: `Jumped to ${time}s`, parameters };

      case 'set_bpm':
        const bpm = parameters.bpm;
        store.setTempo(bpm);
        return { success: true, action, message: `BPM set to ${bpm}`, parameters };

      default:
        return { success: false, action, message: `Unknown transport action: ${action}` };
    }
  }

  private handleTimelineCommand(analysis: GPT4CommandAnalysis, store: any): VoiceCommandResult {
    const { action, parameters } = analysis;

    switch (action) {
      case 'add_track':
        const trackName = parameters.name || `Track ${store.tracks.length + 1}`;
        store.addTrack({ name: trackName });
        return { success: true, action, message: `Added track: ${trackName}`, parameters };

      case 'delete_track':
        // Would need track selection logic
        return { success: false, action, message: 'Track deletion requires selection' };

      case 'rename_track':
        // Would need track selection logic
        return { success: false, action, message: 'Track renaming requires selection' };

      default:
        return { success: false, action, message: `Unknown timeline action: ${action}` };
    }
  }

  private handleMixerCommand(analysis: GPT4CommandAnalysis, store: any): VoiceCommandResult {
    const { action, parameters } = analysis;

    switch (action) {
      case 'mute':
      case 'unmute':
      case 'solo':
      case 'set_volume':
      case 'pan':
        // Would need track selection logic
        return { success: false, action, message: 'Mixer commands require track selection' };

      default:
        return { success: false, action, message: `Unknown mixer action: ${action}` };
    }
  }

  private async handleAIFeatureCommand(analysis: GPT4CommandAnalysis): Promise<VoiceCommandResult> {
    const { action } = analysis;

    // These would integrate with AI services
    switch (action) {
      case 'generate_beat':
      case 'suggest_mix':
      case 'analyze_vocals':
      case 'master_track':
        return { success: false, action, message: `AI feature "${action}" is under development` };

      default:
        return { success: false, action, message: `Unknown AI action: ${action}` };
    }
  }

  // ==========================================================================
  // Context Management
  // ==========================================================================

  private getCurrentDAWContext(): VoiceContext {
    const transportStore = useTransportStore.getState();
    const timelineStore = useTimelineStore.getState();

    return {
      tracks: timelineStore.tracks.map(t => ({
        id: t.id,
        name: t.name,
        type: t.trackType || 'audio',
      })),
      currentTime: transportStore.currentTime,
      isPlaying: transportStore.isPlaying,
      isRecording: transportStore.isRecording,
      selectedClipIds: [], // Would come from timeline store
      bpm: transportStore.tempo,
      recentCommands: this.state.lastCommand ? [this.state.lastCommand] : [],
    };
  }

  // ==========================================================================
  // Text-to-Speech Feedback
  // ==========================================================================

  private async speak(text: string): Promise<void> {
    if (!this.config.enableTTS) {
      return;
    }

    try {
      this.updateState({ isSpeaking: true });

      if (this.config.mode === 'ai' && whisperGPTService.isInitialized()) {
        // Use OpenAI TTS
        const ttsResult = await whisperGPTService.speak(text);
        await this.playAudio(ttsResult.audioData);
      } else {
        // Fallback to browser TTS
        this.speakWithBrowserTTS(text);
      }

      this.updateState({ isSpeaking: false });
    } catch (error) {
      logger.error('[VoiceController] TTS failed', { error });
      this.updateState({ isSpeaking: false });
    }
  }

  private async playAudio(audioData: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      this.currentAudio = new Audio(url);
      this.currentAudio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      this.currentAudio.onerror = (error) => {
        URL.revokeObjectURL(url);
        reject(error);
      };

      this.currentAudio.play().catch(reject);
    });
  }

  private speakWithBrowserTTS(text: string): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.config.language;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }

  // ==========================================================================
  // Event Handling
  // ==========================================================================

  private handleTranscriptUpdate(transcript: string, isFinal: boolean): void {
    this.updateState({ currentTranscript: transcript });
  }

  private handleListeningStateChange(isListening: boolean): void {
    this.updateState({ isListening });
  }

  private handleVoiceError(error: Error): void {
    this.handleError(error);
  }

  private handleError(error: Error): void {
    logger.error('[VoiceController] Error:', error);
    this.updateState({ error });
    this.onError?.(error);
    toast.error(error.message);
  }

  // ==========================================================================
  // State Management
  // ==========================================================================

  private updateState(updates: Partial<VoiceControllerState>): void {
    this.state = { ...this.state, ...updates };
    this.onStateChange?.(this.state);
  }

  public getState(): Readonly<VoiceControllerState> {
    return { ...this.state };
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  public setMode(mode: VoiceMode): void {
    logger.info('[VoiceController] Changing mode', { from: this.config.mode, to: mode });
    this.config.mode = mode;
    this.updateState({ mode });
  }

  public setOnStateChange(callback: (state: VoiceControllerState) => void): void {
    this.onStateChange = callback;
  }

  public setOnCommandExecuted(callback: (result: VoiceCommandResult) => void): void {
    this.onCommandExecuted = callback;
  }

  public setOnError(callback: (error: Error) => void): void {
    this.onError = callback;
  }

  public dispose(): void {
    logger.info('[VoiceController] Disposing');

    this.stopListening();

    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Export singleton instance
export const voiceController = new VoiceController();
