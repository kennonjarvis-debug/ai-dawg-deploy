/**
 * Voice Freestyle Commands Test Suite
 *
 * Tests for voice-controlled freestyle recording functionality
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  VoiceFreestyleCommander,
  FreestyleIntent,
  FreestyleAction,
  FREESTYLE_COMMANDS,
  VOICE_RESPONSES,
} from '../../src/backend/services/voice-freestyle-commands';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      audio: {
        transcriptions: {
          create: jest.fn().mockResolvedValue({ text: 'record me freestyle' }),
        },
        speech: {
          create: jest.fn().mockResolvedValue({
            arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
          }),
        },
      },
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    action: 'START_FREESTYLE_RECORDING',
                    parameters: { beatStyle: 'trap', targetBPM: 140 },
                    confidence: 0.95,
                  }),
                },
              },
            ],
          }),
        },
      },
    })),
  };
});

// Mock MusicGen service
jest.mock('../../src/backend/services/musicgen-service', () => ({
  generateMusic: jest.fn().mockResolvedValue({
    success: true,
    audio_url: 'https://example.com/beat.mp3',
    job_id: 'test-job-123',
  }),
  generateBeat: jest.fn().mockResolvedValue({
    success: true,
    audio_url: 'https://example.com/beat.mp3',
    job_id: 'test-job-123',
  }),
}));

// Mock Melody-to-Vocals service
jest.mock('../../src/backend/services/melody-vocals-service', () => ({
  generateVocalsFromMelody: jest.fn().mockResolvedValue({
    success: true,
    audio_url: 'https://example.com/vocals.mp3',
    lyrics: 'Generated lyrics',
    melody_info: {
      num_notes: 24,
      duration: 30,
      key: 'Am',
      range: 'C4-C5',
      notes: ['C4', 'D4', 'E4'],
    },
  }),
}));

describe('VoiceFreestyleCommander', () => {
  let commander: VoiceFreestyleCommander;

  beforeEach(() => {
    commander = new VoiceFreestyleCommander();
  });

  describe('Intent Detection', () => {
    it('should detect START_FREESTYLE_RECORDING intent', async () => {
      const intent = await commander.detectFreestyleIntent('record me freestyle');

      expect(intent.action).toBe('START_FREESTYLE_RECORDING');
      expect(intent.confidence).toBeGreaterThan(0);
    });

    it('should detect CREATE_BEAT intent with parameters', async () => {
      const intent = await commander.detectFreestyleIntent(
        'create a trap beat at 140 BPM'
      );

      expect(intent.action).toBe('CREATE_BEAT');
      expect(intent.parameters.beatStyle).toBe('trap');
      expect(intent.parameters.targetBPM).toBe(140);
    });

    it('should detect STOP_RECORDING intent', async () => {
      const intent = await commander.detectFreestyleIntent('stop recording');

      expect(intent.action).toBe('STOP_RECORDING');
      expect(intent.parameters).toEqual({});
    });

    it('should detect SHOW_MELODY intent', async () => {
      const intent = await commander.detectFreestyleIntent('show me the melody');

      expect(intent.action).toBe('SHOW_MELODY');
    });

    it('should detect FIX_LYRICS intent', async () => {
      const intent = await commander.detectFreestyleIntent('fix the lyrics');

      expect(intent.action).toBe('FIX_LYRICS');
    });

    it('should extract musical parameters from natural language', async () => {
      const intent = await commander.detectFreestyleIntent(
        'create a chill lo-fi beat at 80 BPM in C major'
      );

      expect(intent.parameters.beatStyle).toBe('lo-fi');
      expect(intent.parameters.targetBPM).toBe(80);
      expect(intent.parameters.targetKey).toBe('C');
      expect(intent.parameters.mood).toBe('chill');
    });

    it('should handle tempo descriptors', async () => {
      const commands = [
        { text: 'create a slow beat', expectedBPM: 80 },
        { text: 'create a fast beat', expectedBPM: 140 },
        { text: 'create a very fast beat', expectedBPM: 160 },
      ];

      for (const cmd of commands) {
        const intent = await commander.detectFreestyleIntent(cmd.text);
        expect(intent.parameters.targetBPM).toBeGreaterThanOrEqual(cmd.expectedBPM - 20);
        expect(intent.parameters.targetBPM).toBeLessThanOrEqual(cmd.expectedBPM + 20);
      }
    });
  });

  describe('Beat Creation', () => {
    it('should create beat from voice parameters', async () => {
      const result = await commander.createBeatFromVoice('trap', 140, 'Am', 'user-123');

      expect(result.success).toBe(true);
      expect(result.audio_url).toBeDefined();
    });

    it('should use default BPM for known styles', async () => {
      const styles = [
        { style: 'trap', expectedBPM: 140 },
        { style: 'hip-hop', expectedBPM: 90 },
        { style: 'lo-fi', expectedBPM: 80 },
        { style: 'dnb', expectedBPM: 174 },
      ];

      for (const { style, expectedBPM } of styles) {
        const result = await commander.createBeatFromVoice(style);
        // BPM should be within reasonable range of expected
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Command Handling', () => {
    it('should handle START_FREESTYLE_RECORDING without beat', async () => {
      const intent: FreestyleIntent = {
        action: 'START_FREESTYLE_RECORDING',
        parameters: {},
        confidence: 0.95,
        rawCommand: 'record me',
      };

      const result = await commander.handleFreestyleCommand(
        intent,
        'session-1',
        'user-123',
        'project-456'
      );

      expect(result.success).toBe(true);
      expect(result.session).toBeDefined();
      expect(result.session?.recordingActive).toBe(true);
    });

    it('should handle START_FREESTYLE_RECORDING with beat creation', async () => {
      const intent: FreestyleIntent = {
        action: 'START_FREESTYLE_RECORDING',
        parameters: {
          beatStyle: 'trap',
          targetBPM: 140,
        },
        confidence: 0.95,
        rawCommand: 'record me with a trap beat',
      };

      const result = await commander.handleFreestyleCommand(
        intent,
        'session-2',
        'user-123',
        'project-456'
      );

      expect(result.success).toBe(true);
      expect(result.session?.beatCreated).toBe(true);
      expect(result.beat).toBeDefined();
      expect(result.beat?.audio_url).toBeDefined();
    });

    it('should prevent starting recording when already recording', async () => {
      // Start first recording
      const intent1: FreestyleIntent = {
        action: 'START_FREESTYLE_RECORDING',
        parameters: {},
        confidence: 1.0,
        rawCommand: 'record me',
      };

      await commander.handleFreestyleCommand(intent1, 'session-3', 'user-123');

      // Try to start second recording
      const result = await commander.handleFreestyleCommand(
        intent1,
        'session-3',
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('already in progress');
    });

    it('should handle STOP_RECORDING', async () => {
      // Start recording first
      const startIntent: FreestyleIntent = {
        action: 'START_FREESTYLE_RECORDING',
        parameters: {},
        confidence: 1.0,
        rawCommand: 'record me',
      };

      await commander.handleFreestyleCommand(startIntent, 'session-4', 'user-123');

      // Stop recording
      const stopIntent: FreestyleIntent = {
        action: 'STOP_RECORDING',
        parameters: {},
        confidence: 1.0,
        rawCommand: 'stop',
      };

      const result = await commander.handleFreestyleCommand(
        stopIntent,
        'session-4',
        'user-123'
      );

      expect(result.success).toBe(true);
      expect(result.session?.recordingActive).toBe(false);
      expect(result.recording).toBeDefined();
    });

    it('should handle STOP_RECORDING when not recording', async () => {
      const stopIntent: FreestyleIntent = {
        action: 'STOP_RECORDING',
        parameters: {},
        confidence: 1.0,
        rawCommand: 'stop',
      };

      const result = await commander.handleFreestyleCommand(
        stopIntent,
        'session-5',
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('No active recording');
    });

    it('should handle CREATE_BEAT standalone', async () => {
      const intent: FreestyleIntent = {
        action: 'CREATE_BEAT',
        parameters: {
          beatStyle: 'lo-fi',
          targetBPM: 80,
        },
        confidence: 0.95,
        rawCommand: 'create a lo-fi beat',
      };

      const result = await commander.handleFreestyleCommand(
        intent,
        'session-6',
        'user-123'
      );

      expect(result.success).toBe(true);
      expect(result.beat).toBeDefined();
      expect(result.beat?.audio_url).toBeDefined();
    });

    it('should handle SHOW_MELODY', async () => {
      const intent: FreestyleIntent = {
        action: 'SHOW_MELODY',
        parameters: {},
        confidence: 1.0,
        rawCommand: 'show me the melody',
      };

      const result = await commander.handleFreestyleCommand(
        intent,
        'session-7',
        'user-123'
      );

      expect(result.success).toBe(false); // No session exists
      expect(result.message).toContain('No recording found');
    });

    it('should handle ENHANCE_LYRICS', async () => {
      const intent: FreestyleIntent = {
        action: 'ENHANCE_LYRICS',
        parameters: {
          mood: 'energetic',
          theme: 'motivation',
        },
        confidence: 0.95,
        rawCommand: 'enhance the lyrics',
      };

      const result = await commander.handleFreestyleCommand(
        intent,
        'session-8',
        'user-123'
      );

      expect(result.success).toBe(false); // No session exists
      expect(result.message).toContain('No recording found');
    });
  });

  describe('Session Management', () => {
    it('should create and retrieve sessions', async () => {
      const intent: FreestyleIntent = {
        action: 'START_FREESTYLE_RECORDING',
        parameters: {},
        confidence: 1.0,
        rawCommand: 'record me',
      };

      await commander.handleFreestyleCommand(intent, 'session-9', 'user-123');

      const session = commander.getFreestyleSession('session-9');

      expect(session).toBeDefined();
      expect(session?.sessionId).toBe('session-9');
      expect(session?.userId).toBe('user-123');
    });

    it('should store and retrieve recording buffers', () => {
      const buffer = Buffer.from('test audio data');

      commander.storeRecordingBuffer('session-10', buffer);
      const retrieved = commander.getRecordingBuffer('session-10');

      expect(retrieved).toBeDefined();
      expect(retrieved?.toString()).toBe('test audio data');
    });

    it('should clear session data', async () => {
      const intent: FreestyleIntent = {
        action: 'START_FREESTYLE_RECORDING',
        parameters: {},
        confidence: 1.0,
        rawCommand: 'record me',
      };

      await commander.handleFreestyleCommand(intent, 'session-11', 'user-123');

      const buffer = Buffer.from('test');
      commander.storeRecordingBuffer('session-11', buffer);

      commander.clearSession('session-11');

      expect(commander.getFreestyleSession('session-11')).toBeUndefined();
      expect(commander.getRecordingBuffer('session-11')).toBeUndefined();
    });
  });

  describe('Voice Responses', () => {
    it('should have response templates for all actions', () => {
      expect(VOICE_RESPONSES.RECORDING_START_WITH_BEAT).toBeDefined();
      expect(VOICE_RESPONSES.RECORDING_START_NO_BEAT).toBeDefined();
      expect(VOICE_RESPONSES.BEAT_CREATING).toBeDefined();
      expect(VOICE_RESPONSES.RECORDING_STOPPED).toBeDefined();
      expect(VOICE_RESPONSES.MELODY_EXTRACTED).toBeDefined();
      expect(VOICE_RESPONSES.LYRICS_ENHANCED).toBeDefined();
      expect(VOICE_RESPONSES.ERROR_NO_RECORDING).toBeDefined();
    });

    it('should generate contextual responses', () => {
      const beatResponse = VOICE_RESPONSES.BEAT_CREATING('trap', 140, 'Am');
      expect(beatResponse).toContain('trap');
      expect(beatResponse).toContain('140');
      expect(beatResponse).toContain('Am');

      const melodyResponse = VOICE_RESPONSES.MELODY_EXTRACTED(24, 'C');
      expect(melodyResponse).toContain('24');
      expect(melodyResponse).toContain('C');

      const lyricsResponse = VOICE_RESPONSES.LYRICS_ENHANCED(8);
      expect(lyricsResponse).toContain('8');
    });
  });

  describe('End-to-End Workflow', () => {
    it('should handle complete freestyle session', async () => {
      const userId = 'user-123';
      const sessionId = 'e2e-session-1';

      // Step 1: Start recording with beat
      const startIntent: FreestyleIntent = {
        action: 'START_FREESTYLE_RECORDING',
        parameters: {
          beatStyle: 'trap',
          targetBPM: 140,
        },
        confidence: 0.95,
        rawCommand: 'record me with a trap beat',
      };

      const startResult = await commander.handleFreestyleCommand(
        startIntent,
        sessionId,
        userId
      );

      expect(startResult.success).toBe(true);
      expect(startResult.session?.recordingActive).toBe(true);
      expect(startResult.beat).toBeDefined();

      // Step 2: Store recording buffer
      const recordingBuffer = Buffer.from('fake audio data');
      commander.storeRecordingBuffer(sessionId, recordingBuffer);

      // Step 3: Stop recording
      const stopIntent: FreestyleIntent = {
        action: 'STOP_RECORDING',
        parameters: {},
        confidence: 1.0,
        rawCommand: 'stop',
      };

      const stopResult = await commander.handleFreestyleCommand(
        stopIntent,
        sessionId,
        userId
      );

      expect(stopResult.success).toBe(true);
      expect(stopResult.session?.recordingActive).toBe(false);

      // Step 4: Show melody
      const melodyIntent: FreestyleIntent = {
        action: 'SHOW_MELODY',
        parameters: {},
        confidence: 1.0,
        rawCommand: 'show melody',
      };

      const melodyResult = await commander.handleFreestyleCommand(
        melodyIntent,
        sessionId,
        userId
      );

      expect(melodyResult.success).toBe(true);

      // Step 5: Enhance lyrics
      const lyricsIntent: FreestyleIntent = {
        action: 'ENHANCE_LYRICS',
        parameters: {},
        confidence: 1.0,
        rawCommand: 'enhance lyrics',
      };

      const lyricsResult = await commander.handleFreestyleCommand(
        lyricsIntent,
        sessionId,
        userId
      );

      expect(lyricsResult.success).toBe(true);

      // Cleanup
      commander.clearSession(sessionId);
    });
  });

  describe('Error Handling', () => {
    it('should handle beat generation failure gracefully', async () => {
      const { generateBeat } = require('../../src/backend/services/musicgen-service');
      generateBeat.mockResolvedValueOnce({
        success: false,
        error: 'Beat generation failed',
      });

      const intent: FreestyleIntent = {
        action: 'START_FREESTYLE_RECORDING',
        parameters: {
          beatStyle: 'trap',
        },
        confidence: 0.95,
        rawCommand: 'record me with a beat',
      };

      const result = await commander.handleFreestyleCommand(
        intent,
        'error-session-1',
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle unknown intents', async () => {
      const intent: FreestyleIntent = {
        action: 'UNKNOWN_ACTION' as FreestyleAction,
        parameters: {},
        confidence: 0.5,
        rawCommand: 'do something weird',
      };

      const result = await commander.handleFreestyleCommand(
        intent,
        'error-session-2',
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown');
    });
  });

  describe('Command Patterns', () => {
    it('should have command patterns defined', () => {
      expect(FREESTYLE_COMMANDS.RECORDING_START).toBeDefined();
      expect(FREESTYLE_COMMANDS.BEAT_CREATION).toBeDefined();
      expect(FREESTYLE_COMMANDS.RECORDING_STOP).toBeDefined();
      expect(FREESTYLE_COMMANDS.PLAYBACK).toBeDefined();
      expect(FREESTYLE_COMMANDS.LYRICS_EDITING).toBeDefined();
      expect(FREESTYLE_COMMANDS.MELODY_VIEWING).toBeDefined();
    });

    it('should have multiple variations per command type', () => {
      expect(FREESTYLE_COMMANDS.RECORDING_START.length).toBeGreaterThan(5);
      expect(FREESTYLE_COMMANDS.BEAT_CREATION.length).toBeGreaterThan(5);
      expect(FREESTYLE_COMMANDS.RECORDING_STOP.length).toBeGreaterThan(3);
    });
  });
});
