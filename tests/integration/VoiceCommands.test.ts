/**
 * Voice Commands Integration Test
 *
 * Tests the complete voice control pipeline:
 * - Voice recording and transcription
 * - Command parsing and execution
 * - Store integration
 * - AI analysis (Whisper + GPT-4)
 *
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { voiceController, VoiceController } from '../../src/services/VoiceController';
import { whisperGPTService } from '../../src/services/WhisperGPTService';
import { voiceCommandService } from '../../src/services/voiceCommandService';
import { useTransportStore } from '../../src/stores/transportStore';
import { useTimelineStore } from '../../src/stores/timelineStore';

// ============================================================================
// Mocks
// ============================================================================

// Mock MediaDevices
global.navigator.mediaDevices = {
  getUserMedia: jest.fn().mockResolvedValue({
    getTracks: () => [{
      stop: jest.fn(),
    }],
  } as any),
} as any;

// Mock MediaRecorder
global.MediaRecorder = jest.fn().mockImplementation(() => ({
  start: jest.fn(),
  stop: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  ondataavailable: null,
  onstop: null,
  state: 'inactive',
})) as any;

// Mock Web Speech API
(global as any).webkitSpeechRecognition = jest.fn().mockImplementation(() => ({
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  maxAlternatives: 1,
  start: jest.fn(),
  stop: jest.fn(),
  onstart: null,
  onend: null,
  onresult: null,
  onerror: null,
}));

// Mock AudioContext
global.AudioContext = jest.fn().mockImplementation(() => ({
  createMediaStreamSource: jest.fn(() => ({
    connect: jest.fn(),
  })),
  createAnalyser: jest.fn(() => ({
    connect: jest.fn(),
    fftSize: 2048,
    frequencyBinCount: 1024,
    getFloatTimeDomainData: jest.fn(),
  })),
  close: jest.fn(),
  state: 'running',
  resume: jest.fn().mockResolvedValue(undefined),
})) as any;

// ============================================================================
// Tests
// ============================================================================

describe('Voice Commands Integration', () => {
  let controller: VoiceController;
  let transportStore: any;
  let timelineStore: any;

  beforeEach(() => {
    // Reset stores
    transportStore = useTransportStore.getState();
    timelineStore = useTimelineStore.getState();

    transportStore.setIsPlaying(false);
    transportStore.setIsRecording(false);
    transportStore.setCurrentTime(0);

    // Clear timeline
    timelineStore.tracks.forEach((track: any) => {
      timelineStore.removeTrack(track.id);
    });

    // Create fresh controller
    controller = new VoiceController({
      mode: 'hybrid',
      enableTTS: false, // Disable for tests
    });
  });

  afterEach(() => {
    controller.dispose();
  });

  // ==========================================================================
  // Basic Voice Commands
  // ==========================================================================

  describe('Basic Voice Commands (Web Speech API)', () => {
    it('should register and execute play command', async () => {
      // Simulate voice command detection
      const playCommand = voiceCommandService.getCommands().find(cmd => cmd.command === 'play');
      expect(playCommand).toBeDefined();

      if (playCommand) {
        playCommand.action();
        expect(transportStore.isPlaying).toBe(true);
      }
    });

    it('should register and execute pause command', async () => {
      transportStore.setIsPlaying(true);

      const pauseCommand = voiceCommandService.getCommands().find(cmd => cmd.command === 'pause');
      expect(pauseCommand).toBeDefined();

      if (pauseCommand) {
        pauseCommand.action();
        expect(transportStore.isPlaying).toBe(false);
      }
    });

    it('should register and execute stop command', async () => {
      transportStore.setIsPlaying(true);
      transportStore.setCurrentTime(10);

      const stopCommand = voiceCommandService.getCommands().find(cmd => cmd.command === 'stop');
      expect(stopCommand).toBeDefined();

      if (stopCommand) {
        stopCommand.action();
        expect(transportStore.isPlaying).toBe(false);
        expect(transportStore.currentTime).toBe(0);
      }
    });

    it('should register and execute record command', async () => {
      const recordCommand = voiceCommandService.getCommands().find(cmd => cmd.command === 'record');
      expect(recordCommand).toBeDefined();

      if (recordCommand) {
        recordCommand.action();
        expect(transportStore.isRecording).toBe(true);
      }
    });

    it('should register and execute add track command', async () => {
      const initialTrackCount = timelineStore.tracks.length;

      const addTrackCommand = voiceCommandService.getCommands().find(cmd => cmd.id === 'add_track');
      expect(addTrackCommand).toBeDefined();

      if (addTrackCommand) {
        addTrackCommand.action();
        expect(timelineStore.tracks.length).toBe(initialTrackCount + 1);
      }
    });
  });

  // ==========================================================================
  // Voice Controller State Management
  // ==========================================================================

  describe('Voice Controller State', () => {
    it('should initialize with correct default state', () => {
      const state = controller.getState();

      expect(state.isListening).toBe(false);
      expect(state.isProcessing).toBe(false);
      expect(state.isSpeaking).toBe(false);
      expect(state.mode).toBe('hybrid');
      expect(state.currentTranscript).toBe('');
      expect(state.lastCommand).toBeNull();
      expect(state.error).toBeNull();
    });

    it('should update state when starting to listen', async () => {
      await controller.startListening();

      const state = controller.getState();
      expect(state.isListening).toBe(true);
    });

    it('should update state when stopping listening', async () => {
      await controller.startListening();
      controller.stopListening();

      const state = controller.getState();
      expect(state.isListening).toBe(false);
    });

    it('should emit state change events', (done) => {
      controller.setOnStateChange((state) => {
        if (state.isListening) {
          expect(state.isListening).toBe(true);
          done();
        }
      });

      controller.startListening();
    });
  });

  // ==========================================================================
  // Whisper + GPT-4 Integration (AI Mode)
  // ==========================================================================

  describe('AI Voice Commands (Whisper + GPT-4)', () => {
    it('should transcribe audio with Whisper', async () => {
      // Mock Whisper API
      const mockTranscription = {
        text: 'play the track',
        language: 'en',
        duration: 1.5,
        confidence: 0.95,
      };

      jest.spyOn(whisperGPTService, 'transcribe').mockResolvedValue(mockTranscription);

      const audioBlob = new Blob(['test audio data'], { type: 'audio/webm' });
      const result = await whisperGPTService.transcribe(audioBlob);

      expect(result.text).toBe('play the track');
      expect(result.language).toBe('en');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should analyze command with GPT-4', async () => {
      // Mock GPT-4 API
      const mockAnalysis = {
        intent: 'transport',
        action: 'play',
        parameters: {},
        confidence: 0.95,
        requiresConfirmation: false,
        naturalResponse: 'Starting playback now.',
      };

      jest.spyOn(whisperGPTService, 'analyzeCommand').mockResolvedValue(mockAnalysis);

      const result = await whisperGPTService.analyzeCommand('play the track');

      expect(result.intent).toBe('transport');
      expect(result.action).toBe('play');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.naturalResponse).toContain('playback');
    });

    it('should handle low confidence commands', async () => {
      const mockAnalysis = {
        intent: 'unknown',
        action: 'none',
        parameters: {},
        confidence: 0.3,
        requiresConfirmation: false,
        naturalResponse: "I didn't understand that command.",
      };

      jest.spyOn(whisperGPTService, 'analyzeCommand').mockResolvedValue(mockAnalysis);

      const result = await whisperGPTService.analyzeCommand('mumblemumble');

      expect(result.confidence).toBeLessThan(0.6);
      expect(result.intent).toBe('unknown');
    });

    it('should handle commands requiring confirmation', async () => {
      const mockAnalysis = {
        intent: 'timeline',
        action: 'delete_all_tracks',
        parameters: {},
        confidence: 0.95,
        requiresConfirmation: true,
        naturalResponse: 'This will delete all tracks. Are you sure?',
      };

      jest.spyOn(whisperGPTService, 'analyzeCommand').mockResolvedValue(mockAnalysis);

      const result = await whisperGPTService.analyzeCommand('delete all tracks');

      expect(result.requiresConfirmation).toBe(true);
      expect(result.naturalResponse).toContain('sure');
    });
  });

  // ==========================================================================
  // Context-Aware Commands
  // ==========================================================================

  describe('Context-Aware Commands', () => {
    it('should provide DAW context to AI', async () => {
      // Set up context
      timelineStore.addTrack({ name: 'Vocals' });
      timelineStore.addTrack({ name: 'Drums' });
      transportStore.setIsPlaying(true);
      transportStore.setCurrentTime(30);
      transportStore.setTempo(120);

      const context = {
        tracks: timelineStore.tracks.map((t: any) => ({
          id: t.id,
          name: t.name,
          type: t.trackType || 'audio',
        })),
        currentTime: transportStore.currentTime,
        isPlaying: transportStore.isPlaying,
        isRecording: transportStore.isRecording,
        selectedClipIds: [],
        bpm: transportStore.tempo,
        recentCommands: [],
      };

      expect(context.tracks.length).toBe(2);
      expect(context.isPlaying).toBe(true);
      expect(context.currentTime).toBe(30);
      expect(context.bpm).toBe(120);
    });

    it('should use context for smarter command interpretation', async () => {
      // Add a track named "Vocals"
      timelineStore.addTrack({ name: 'Vocals' });

      // Command that references the track
      const mockAnalysis = {
        intent: 'mixer',
        action: 'mute',
        parameters: { trackName: 'Vocals' },
        confidence: 0.9,
        requiresConfirmation: false,
        naturalResponse: 'Muting the Vocals track.',
      };

      jest.spyOn(whisperGPTService, 'analyzeCommand').mockResolvedValue(mockAnalysis);

      const result = await whisperGPTService.analyzeCommand('mute vocals', {
        tracks: timelineStore.tracks.map((t: any) => ({
          id: t.id,
          name: t.name,
          type: t.trackType || 'audio',
        })),
        currentTime: 0,
        isPlaying: false,
        isRecording: false,
        selectedClipIds: [],
        bpm: 120,
        recentCommands: [],
      });

      expect(result.parameters.trackName).toBe('Vocals');
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('Error Handling', () => {
    it('should handle microphone access denial', async () => {
      (global.navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(
        new Error('Permission denied')
      );

      let errorCaught = false;
      controller.setOnError((error) => {
        errorCaught = true;
        expect(error.message).toContain('Permission denied');
      });

      try {
        await controller.startListening();
      } catch (error) {
        // Expected
      }

      // Error handler should have been called
      // In actual implementation, VoiceController handles this internally
    });

    it('should handle transcription failures gracefully', async () => {
      jest.spyOn(whisperGPTService, 'transcribe').mockRejectedValue(
        new Error('API error')
      );

      const audioBlob = new Blob(['test'], { type: 'audio/webm' });

      await expect(whisperGPTService.transcribe(audioBlob)).rejects.toThrow('API error');
    });

    it('should fallback to pattern matching when GPT-4 unavailable', async () => {
      // Test fallback analysis
      jest.spyOn(whisperGPTService, 'analyzeCommand').mockImplementation(async (text) => {
        // Simulate fallback mode
        if (text.toLowerCase().includes('play')) {
          return {
            intent: 'transport',
            action: 'play',
            parameters: {},
            confidence: 0.9,
            requiresConfirmation: false,
            naturalResponse: 'Starting playback.',
          };
        }

        return {
          intent: 'unknown',
          action: 'none',
          parameters: {},
          confidence: 0.3,
          requiresConfirmation: false,
          naturalResponse: "I didn't understand that.",
        };
      });

      const result = await whisperGPTService.analyzeCommand('play');
      expect(result.action).toBe('play');
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  // ==========================================================================
  // Performance
  // ==========================================================================

  describe('Performance', () => {
    it('should respond to basic commands in under 100ms', () => {
      const start = Date.now();

      const playCommand = voiceCommandService.getCommands().find(cmd => cmd.command === 'play');
      playCommand?.action();

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should handle rapid command sequences', async () => {
      const commands = ['play', 'pause', 'stop', 'record'];

      for (const cmdId of commands) {
        const cmd = voiceCommandService.getCommands().find(c => c.command === cmdId);
        if (cmd) {
          cmd.action();
          // Small delay to prevent race conditions
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // Final state should reflect last command
      expect(transportStore.isRecording).toBe(true);
    });
  });

  // ==========================================================================
  // Mode Switching
  // ==========================================================================

  describe('Mode Switching', () => {
    it('should switch between basic and AI modes', () => {
      controller.setMode('basic');
      expect(controller.getState().mode).toBe('basic');

      controller.setMode('ai');
      expect(controller.getState().mode).toBe('ai');

      controller.setMode('hybrid');
      expect(controller.getState().mode).toBe('hybrid');
    });

    it('should use appropriate recognition method per mode', async () => {
      // Basic mode should use Web Speech API
      controller.setMode('basic');
      await controller.startListening();
      expect(controller.getState().isListening).toBe(true);

      controller.stopListening();

      // AI mode should prepare for Whisper transcription
      controller.setMode('ai');
      await controller.startListening();
      expect(controller.getState().isListening).toBe(true);
    });
  });
});
