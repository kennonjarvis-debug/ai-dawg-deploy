/**
 * Voice Command Service
 *
 * Centralized service for handling voice commands across the application
 * Supports natural language processing and command routing
 */

export interface VoiceCommand {
  id: string;
  command: string;
  aliases: string[];
  description: string;
  action: (...args: any[]) => void | Promise<void>;
  category: 'recording' | 'playback' | 'navigation' | 'ai' | 'general';
  parameters?: string[];
}

export interface VoiceCommandMatch {
  command: VoiceCommand;
  confidence: number;
  parameters: Record<string, any>;
}

export class VoiceCommandService {
  private commands: Map<string, VoiceCommand> = new Map();
  private recognition: any = null;
  private isListening = false;
  private continuous = true;
  private interimResults = true;
  private language = 'en-US';

  // Event callbacks
  private onCommandDetected?: (match: VoiceCommandMatch) => void;
  private onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;
  private onListeningStateChange?: (isListening: boolean) => void;
  private onError?: (error: Error) => void;

  constructor() {
    this.initializeRecognition();
    this.registerDefaultCommands();
  }

  /**
   * Initialize Web Speech API
   */
  private initializeRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('[VoiceCommandService] Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = this.continuous;
    this.recognition.interimResults = this.interimResults;
    this.recognition.lang = this.language;
    this.recognition.maxAlternatives = 3;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onListeningStateChange?.(true);
      console.log('[VoiceCommandService] Listening started');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onListeningStateChange?.(false);
      console.log('[VoiceCommandService] Listening ended');
    };

    this.recognition.onresult = (event: any) => {
      this.handleRecognitionResult(event);
    };

    this.recognition.onerror = (event: any) => {
      console.error('[VoiceCommandService] Recognition error:', event.error);

      if (event.error === 'not-allowed') {
        this.onError?.(new Error('Microphone access denied'));
      } else if (event.error === 'no-speech') {
        // Auto-restart on no-speech
        if (this.continuous && this.isListening) {
          this.start();
        }
      } else {
        this.onError?.(new Error(event.error));
      }
    };
  }

  /**
   * Handle speech recognition results
   */
  private handleRecognitionResult(event: any) {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      const isFinal = event.results[i].isFinal;

      if (isFinal) {
        finalTranscript += transcript;

        // Try to match command
        const match = this.matchCommand(transcript);
        if (match) {
          this.onCommandDetected?.(match);
        }
      } else {
        interimTranscript += transcript;
      }
    }

    // Notify transcript updates
    const transcriptText = finalTranscript || interimTranscript;
    const isFinal = finalTranscript.length > 0;

    if (this.onTranscriptUpdate) {
      this.onTranscriptUpdate(transcriptText, isFinal);
    }
  }

  /**
   * Match transcript to registered commands
   */
  private matchCommand(transcript: string): VoiceCommandMatch | null {
    const normalizedTranscript = transcript.toLowerCase().trim();

    let bestMatch: VoiceCommandMatch | null = null;
    let highestConfidence = 0;

    for (const [id, command] of this.commands.entries()) {
      const allPhrases = [command.command.toLowerCase(), ...command.aliases.map(a => a.toLowerCase())];

      for (const phrase of allPhrases) {
        // Exact match
        if (normalizedTranscript === phrase) {
          return {
            command,
            confidence: 1.0,
            parameters: this.extractParameters(normalizedTranscript, command),
          };
        }

        // Partial match (contains)
        if (normalizedTranscript.includes(phrase)) {
          const confidence = phrase.length / normalizedTranscript.length;

          if (confidence > highestConfidence) {
            highestConfidence = confidence;
            bestMatch = {
              command,
              confidence,
              parameters: this.extractParameters(normalizedTranscript, command),
            };
          }
        }

        // Fuzzy match (word overlap)
        const transcriptWords = normalizedTranscript.split(' ');
        const phraseWords = phrase.split(' ');
        const overlap = transcriptWords.filter(w => phraseWords.includes(w)).length;
        const confidence = overlap / phraseWords.length;

        if (confidence > 0.6 && confidence > highestConfidence) {
          highestConfidence = confidence;
          bestMatch = {
            command,
            confidence,
            parameters: this.extractParameters(normalizedTranscript, command),
          };
        }
      }
    }

    // Return match if confidence is high enough
    return highestConfidence > 0.5 ? bestMatch : null;
  }

  /**
   * Extract parameters from transcript
   */
  private extractParameters(transcript: string, command: VoiceCommand): Record<string, any> {
    const params: Record<string, any> = {};

    if (!command.parameters || command.parameters.length === 0) {
      return params;
    }

    // Simple parameter extraction (can be enhanced with NLP)
    const words = transcript.toLowerCase().split(' ');

    // Extract numbers
    if (command.parameters.includes('bpm')) {
      const bpmMatch = transcript.match(/(\d+)\s*(bpm|beats per minute)?/i);
      if (bpmMatch) {
        params.bpm = parseInt(bpmMatch[1]);
      }
    }

    // Extract genre/style
    if (command.parameters.includes('genre')) {
      const genres = ['pop', 'rock', 'hip hop', 'jazz', 'electronic', 'r&b', 'country'];
      const foundGenre = genres.find(g => transcript.toLowerCase().includes(g));
      if (foundGenre) {
        params.genre = foundGenre;
      }
    }

    return params;
  }

  /**
   * Register a voice command
   */
  registerCommand(command: VoiceCommand): void {
    this.commands.set(command.id, command);
    console.log(`[VoiceCommandService] Registered command: ${command.command}`);
  }

  /**
   * Unregister a voice command
   */
  unregisterCommand(id: string): void {
    this.commands.delete(id);
    console.log(`[VoiceCommandService] Unregistered command: ${id}`);
  }

  /**
   * Register default commands
   */
  private registerDefaultCommands(): void {
    // These are base commands - specific components will add their own

    this.registerCommand({
      id: 'help',
      command: 'help',
      aliases: ['show commands', 'what can i say', 'list commands'],
      description: 'Show available voice commands',
      category: 'general',
      action: () => {
        console.log('Available commands:', Array.from(this.commands.values()));
      },
    });
  }

  /**
   * Start listening for voice commands
   */
  start(): void {
    if (!this.recognition) {
      console.error('[VoiceCommandService] Speech recognition not available');
      return;
    }

    if (this.isListening) {
      console.warn('[VoiceCommandService] Already listening');
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error('[VoiceCommandService] Failed to start recognition:', error);
    }
  }

  /**
   * Stop listening
   */
  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Get all registered commands
   */
  getCommands(): VoiceCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get commands by category
   */
  getCommandsByCategory(category: VoiceCommand['category']): VoiceCommand[] {
    return Array.from(this.commands.values()).filter(cmd => cmd.category === category);
  }

  /**
   * Set event callbacks
   */
  setOnCommandDetected(callback: (match: VoiceCommandMatch) => void): void {
    this.onCommandDetected = callback;
  }

  setOnTranscriptUpdate(callback: (transcript: string, isFinal: boolean) => void): void {
    this.onTranscriptUpdate = callback;
  }

  setOnListeningStateChange(callback: (isListening: boolean) => void): void {
    this.onListeningStateChange = callback;
  }

  setOnError(callback: (error: Error) => void): void {
    this.onError = callback;
  }

  /**
   * Check if speech recognition is supported
   */
  static isSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }
}

// Export singleton instance
export const voiceCommandService = new VoiceCommandService();
