import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMultiTrackRecording } from '@/hooks/useMultiTrackRecording';
import { useTransportStore } from '@/stores/transportStore';
import { useTimelineStore } from '@/stores/timelineStore';

/**
 * Integration Tests for Multi-Track Recording Hook
 *
 * Tests the integration between:
 * - useMultiTrackRecording hook
 * - Transport store
 * - Timeline store
 * - Web Audio API
 * - MediaRecorder API
 */

// Mock Web Audio API
class MockAudioContext {
  state = 'running';
  destination = {};
  sampleRate = 44100;

  createGain() {
    return {
      gain: { value: 1 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createAnalyser() {
    return {
      fftSize: 2048,
      frequencyBinCount: 1024,
      getByteTimeDomainData: vi.fn(),
      getFloatTimeDomainData: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createMediaStreamSource(stream: any) {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
}

// Mock MediaRecorder
class MockMediaRecorder {
  ondataavailable: ((event: any) => void) | null = null;
  onstop: (() => void) | null = null;
  state = 'inactive';

  constructor(stream: any, options: any) {}

  start(timeslice?: number) {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    if (this.onstop) this.onstop();
  }

  pause() {
    this.state = 'paused';
  }

  resume() {
    this.state = 'recording';
  }
}

// Mock MediaDevices
const mockGetUserMedia = vi.fn().mockResolvedValue({
  getTracks: () => [{ stop: vi.fn() }],
  getAudioTracks: () => [{ stop: vi.fn() }],
});

describe('Multi-Track Recording Hook Integration', () => {
  beforeEach(() => {
    // Mock Web Audio API
    global.AudioContext = MockAudioContext as any;
    (global as any).webkitAudioContext = MockAudioContext;

    // Mock MediaRecorder
    global.MediaRecorder = MockMediaRecorder as any;
    (global.MediaRecorder as any).isTypeSupported = () => true;

    // Mock getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: mockGetUserMedia,
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
    });

    // Reset stores
    useTransportStore.getState().reset();
    useTimelineStore.getState().reset?.();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should initialize without errors', () => {
      const { result } = renderHook(() => useMultiTrackRecording());

      expect(result.current).toBeDefined();
    });

    it('should have startRecording and stopRecording functions', () => {
      const { result } = renderHook(() => useMultiTrackRecording());

      expect(typeof result.current.startRecording).toBe('function');
      expect(typeof result.current.stopRecording).toBe('function');
    });
  });

  describe('Recording State Management', () => {
    it('should update transport store when recording starts', async () => {
      const { result } = renderHook(() => useMultiTrackRecording());

      // Add an armed track
      act(() => {
        useTimelineStore.getState().addTrack?.({
          id: 'track-1',
          name: 'Track 1',
          color: '#ff0000',
          height: 100,
          volume: 1,
          pan: 0,
          isMuted: false,
          isSolo: false,
          isArmed: true,
          inputMonitoring: 'auto',
          inputSource: 'mic',
          inputLevel: 0,
          clips: [],
          playlists: [],
          activePlaylistId: '',
          trackType: 'audio',
          channels: 'mono',
        });
      });

      await act(async () => {
        await result.current.startRecording?.();
      });

      await waitFor(() => {
        const transportState = useTransportStore.getState();
        expect(transportState.isRecording).toBe(true);
      });
    });

    it('should request microphone access for armed tracks', async () => {
      const { result } = renderHook(() => useMultiTrackRecording());

      // Add an armed track
      act(() => {
        useTimelineStore.getState().addTrack?.({
          id: 'track-1',
          name: 'Track 1',
          color: '#ff0000',
          height: 100,
          volume: 1,
          pan: 0,
          isMuted: false,
          isSolo: false,
          isArmed: true,
          inputMonitoring: 'auto',
          inputSource: 'mic',
          inputLevel: 0,
          clips: [],
          playlists: [],
          activePlaylistId: '',
          trackType: 'audio',
          channels: 'mono',
        });
      });

      await act(async () => {
        await result.current.startRecording?.();
      });

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith(
          expect.objectContaining({
            audio: expect.objectContaining({
              channelCount: 1,
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            }),
          })
        );
      });
    });

    it('should request stereo input for stereo tracks', async () => {
      const { result } = renderHook(() => useMultiTrackRecording());

      // Add an armed stereo track
      act(() => {
        useTimelineStore.getState().addTrack?.({
          id: 'track-1',
          name: 'Stereo Track',
          color: '#00ff00',
          height: 100,
          volume: 1,
          pan: 0,
          isMuted: false,
          isSolo: false,
          isArmed: true,
          inputMonitoring: 'auto',
          inputSource: 'mic',
          inputLevel: 0,
          clips: [],
          playlists: [],
          activePlaylistId: '',
          trackType: 'audio',
          channels: 'stereo',
        });
      });

      await act(async () => {
        await result.current.startRecording?.();
      });

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith(
          expect.objectContaining({
            audio: expect.objectContaining({
              channelCount: 2,
            }),
          })
        );
      });
    });

    it('should show warning when no tracks are armed', async () => {
      const { result } = renderHook(() => useMultiTrackRecording());
      const consoleSpy = vi.spyOn(console, 'log');

      await act(async () => {
        await result.current.startRecording?.();
      });

      // Should log a message about no armed tracks
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Recording 0 armed track')
        );
      });
    });
  });

  describe('Multi-Track Recording', () => {
    it('should record multiple armed tracks simultaneously', async () => {
      const { result } = renderHook(() => useMultiTrackRecording());

      // Add multiple armed tracks
      act(() => {
        useTimelineStore.getState().addTrack?.({
          id: 'track-1',
          name: 'Track 1',
          color: '#ff0000',
          height: 100,
          volume: 1,
          pan: 0,
          isMuted: false,
          isSolo: false,
          isArmed: true,
          inputMonitoring: 'auto',
          inputSource: 'mic',
          inputLevel: 0,
          clips: [],
          playlists: [],
          activePlaylistId: '',
          trackType: 'audio',
          channels: 'mono',
        });

        useTimelineStore.getState().addTrack?.({
          id: 'track-2',
          name: 'Track 2',
          color: '#00ff00',
          height: 100,
          volume: 1,
          pan: 0,
          isMuted: false,
          isSolo: false,
          isArmed: true,
          inputMonitoring: 'auto',
          inputSource: 'mic',
          inputLevel: 0,
          clips: [],
          playlists: [],
          activePlaylistId: '',
          trackType: 'audio',
          channels: 'mono',
        });
      });

      await act(async () => {
        await result.current.startRecording?.();
      });

      await waitFor(() => {
        // Should request microphone access for each track
        expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
      });
    });

    it('should not record on unarmed tracks', async () => {
      const { result } = renderHook(() => useMultiTrackRecording());

      // Add one armed and one unarmed track
      act(() => {
        useTimelineStore.getState().addTrack?.({
          id: 'track-1',
          name: 'Armed Track',
          color: '#ff0000',
          height: 100,
          volume: 1,
          pan: 0,
          isMuted: false,
          isSolo: false,
          isArmed: true,
          inputMonitoring: 'auto',
          inputSource: 'mic',
          inputLevel: 0,
          clips: [],
          playlists: [],
          activePlaylistId: '',
          trackType: 'audio',
          channels: 'mono',
        });

        useTimelineStore.getState().addTrack?.({
          id: 'track-2',
          name: 'Unarmed Track',
          color: '#00ff00',
          height: 100,
          volume: 1,
          pan: 0,
          isMuted: false,
          isSolo: false,
          isArmed: false,
          inputMonitoring: 'auto',
          inputSource: 'mic',
          inputLevel: 0,
          clips: [],
          playlists: [],
          activePlaylistId: '',
          trackType: 'audio',
          channels: 'mono',
        });
      });

      await act(async () => {
        await result.current.startRecording?.();
      });

      await waitFor(() => {
        // Should only request microphone once (for armed track)
        expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
      });
    });

    it('should not record on aux tracks', async () => {
      const { result } = renderHook(() => useMultiTrackRecording());

      // Add armed aux track
      act(() => {
        useTimelineStore.getState().addTrack?.({
          id: 'aux-1',
          name: 'Aux Track',
          color: '#0000ff',
          height: 100,
          volume: 1,
          pan: 0,
          isMuted: false,
          isSolo: false,
          isArmed: true,
          inputMonitoring: 'auto',
          inputSource: 'none',
          inputLevel: 0,
          clips: [],
          playlists: [],
          activePlaylistId: '',
          trackType: 'aux',
          channels: 'stereo',
        });
      });

      const consoleSpy = vi.spyOn(console, 'log');

      await act(async () => {
        await result.current.startRecording?.();
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Recording 0 armed track')
        );
      });
    });
  });

  describe('Recording Lifecycle', () => {
    it('should clean up resources when stopping recording', async () => {
      const { result } = renderHook(() => useMultiTrackRecording());

      // Add armed track
      act(() => {
        useTimelineStore.getState().addTrack?.({
          id: 'track-1',
          name: 'Track 1',
          color: '#ff0000',
          height: 100,
          volume: 1,
          pan: 0,
          isMuted: false,
          isSolo: false,
          isArmed: true,
          inputMonitoring: 'auto',
          inputSource: 'mic',
          inputLevel: 0,
          clips: [],
          playlists: [],
          activePlaylistId: '',
          trackType: 'audio',
          channels: 'mono',
        });
      });

      await act(async () => {
        await result.current.startRecording?.();
      });

      await act(async () => {
        await result.current.stopRecording?.();
      });

      await waitFor(() => {
        const transportState = useTransportStore.getState();
        expect(transportState.isRecording).toBe(false);
      });
    });

    it('should handle recording errors gracefully', async () => {
      const { result } = renderHook(() => useMultiTrackRecording());

      // Mock getUserMedia to reject
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'));

      // Add armed track
      act(() => {
        useTimelineStore.getState().addTrack?.({
          id: 'track-1',
          name: 'Track 1',
          color: '#ff0000',
          height: 100,
          volume: 1,
          pan: 0,
          isMuted: false,
          isSolo: false,
          isArmed: true,
          inputMonitoring: 'auto',
          inputSource: 'mic',
          inputLevel: 0,
          clips: [],
          playlists: [],
          activePlaylistId: '',
          trackType: 'audio',
          channels: 'mono',
        });
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await act(async () => {
        await result.current.startRecording?.();
      });

      // Should handle error without crashing
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Transport Store Integration', () => {
    it('should sync with transport store recording state', async () => {
      const { result } = renderHook(() => useMultiTrackRecording());

      // Add armed track
      act(() => {
        useTimelineStore.getState().addTrack?.({
          id: 'track-1',
          name: 'Track 1',
          color: '#ff0000',
          height: 100,
          volume: 1,
          pan: 0,
          isMuted: false,
          isSolo: false,
          isArmed: true,
          inputMonitoring: 'auto',
          inputSource: 'mic',
          inputLevel: 0,
          clips: [],
          playlists: [],
          activePlaylistId: '',
          trackType: 'audio',
          channels: 'mono',
        });
      });

      // Toggle recording via transport store
      await act(async () => {
        useTransportStore.getState().toggleRecord();
      });

      // Give hook time to respond to state change
      await waitFor(() => {
        const state = useTransportStore.getState();
        expect(state.isRecording).toBe(true);
      });
    });

    it('should respect current time from transport store', async () => {
      const { result } = renderHook(() => useMultiTrackRecording());

      // Set current time
      act(() => {
        useTransportStore.getState().setCurrentTime(10);
      });

      // Add armed track
      act(() => {
        useTimelineStore.getState().addTrack?.({
          id: 'track-1',
          name: 'Track 1',
          color: '#ff0000',
          height: 100,
          volume: 1,
          pan: 0,
          isMuted: false,
          isSolo: false,
          isArmed: true,
          inputMonitoring: 'auto',
          inputSource: 'mic',
          inputLevel: 0,
          clips: [],
          playlists: [],
          activePlaylistId: '',
          trackType: 'audio',
          channels: 'mono',
        });
      });

      await act(async () => {
        await result.current.startRecording?.();
      });

      // Recording should start at current time position
      const currentTime = useTransportStore.getState().currentTime;
      expect(currentTime).toBe(10);
    });
  });

  describe('Audio Context Management', () => {
    it('should create AudioContext on first recording', async () => {
      const { result } = renderHook(() => useMultiTrackRecording());

      // Add armed track
      act(() => {
        useTimelineStore.getState().addTrack?.({
          id: 'track-1',
          name: 'Track 1',
          color: '#ff0000',
          height: 100,
          volume: 1,
          pan: 0,
          isMuted: false,
          isSolo: false,
          isArmed: true,
          inputMonitoring: 'auto',
          inputSource: 'mic',
          inputLevel: 0,
          clips: [],
          playlists: [],
          activePlaylistId: '',
          trackType: 'audio',
          channels: 'mono',
        });
      });

      await act(async () => {
        await result.current.startRecording?.();
      });

      // AudioContext should be created
      expect(global.AudioContext).toHaveBeenCalled();
    });

    it('should reuse existing AudioContext', async () => {
      const { result } = renderHook(() => useMultiTrackRecording());

      // Add armed track
      act(() => {
        useTimelineStore.getState().addTrack?.({
          id: 'track-1',
          name: 'Track 1',
          color: '#ff0000',
          height: 100,
          volume: 1,
          pan: 0,
          isMuted: false,
          isSolo: false,
          isArmed: true,
          inputMonitoring: 'auto',
          inputSource: 'mic',
          inputLevel: 0,
          clips: [],
          playlists: [],
          activePlaylistId: '',
          trackType: 'audio',
          channels: 'mono',
        });
      });

      // Record twice
      await act(async () => {
        await result.current.startRecording?.();
      });

      await act(async () => {
        await result.current.stopRecording?.();
      });

      const firstCallCount = (global.AudioContext as any).mock.calls.length;

      await act(async () => {
        await result.current.startRecording?.();
      });

      // Should not create a new AudioContext
      expect((global.AudioContext as any).mock.calls.length).toBe(firstCallCount);
    });
  });
});
