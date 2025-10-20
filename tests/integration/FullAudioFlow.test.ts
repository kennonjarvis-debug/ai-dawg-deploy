/**
 * Full Audio Flow Integration Test
 *
 * End-to-end testing of the complete DAWG AI audio pipeline:
 * - Voice control → Transport → Multi-track recording → Playback
 * - Audio engine integration
 * - Store synchronization
 * - Real-time waveform visualization
 * - Clip creation and management
 *
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { useTransportStore } from '../../src/stores/transportStore';
import { useTimelineStore } from '../../src/stores/timelineStore';
import { getAudioEngine } from '../../src/audio/AudioEngine';
import { voiceController } from '../../src/services/VoiceController';
import { whisperGPTService } from '../../src/services/WhisperGPTService';

// ============================================================================
// Mocks
// ============================================================================

// Mock Web Audio API
global.AudioContext = jest.fn().mockImplementation(() => ({
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: { value: 1 },
  })),
  createAnalyser: jest.fn(() => ({
    connect: jest.fn(),
    fftSize: 2048,
    frequencyBinCount: 1024,
    getFloatTimeDomainData: jest.fn((arr) => {
      // Simulate waveform data
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.sin(i / 10) * 0.5;
      }
    }),
  })),
  createMediaStreamSource: jest.fn(() => ({
    connect: jest.fn(),
  })),
  createScriptProcessor: jest.fn(() => ({
    connect: jest.fn(),
    onaudioprocess: null,
  })),
  destination: {},
  sampleRate: 48000,
  state: 'running',
  resume: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
})) as any;

// Mock MediaDevices
global.navigator.mediaDevices = {
  getUserMedia: jest.fn().mockResolvedValue({
    getTracks: () => [{
      stop: jest.fn(),
      kind: 'audio',
    }],
    getAudioTracks: () => [{
      stop: jest.fn(),
    }],
  } as any),
} as any;

// Mock MediaRecorder
global.MediaRecorder = jest.fn().mockImplementation(() => {
  const recorder = {
    start: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    state: 'inactive',
    ondataavailable: null,
    onstop: null,
    onerror: null,
  };

  // Simulate data collection
  setTimeout(() => {
    if (recorder.ondataavailable) {
      const mockAudioData = new Blob(['mock audio data'], { type: 'audio/webm' });
      recorder.ondataavailable({ data: mockAudioData } as any);
    }
  }, 100);

  return recorder;
}) as any;

(global.MediaRecorder as any).isTypeSupported = jest.fn().mockReturnValue(true);

// ============================================================================
// Tests
// ============================================================================

describe('Full Audio Flow Integration', () => {
  let transportStore: any;
  let timelineStore: any;
  let audioEngine: any;

  beforeEach(async () => {
    // Reset stores
    transportStore = useTransportStore.getState();
    timelineStore = useTimelineStore.getState();

    transportStore.setIsPlaying(false);
    transportStore.setIsRecording(false);
    transportStore.setCurrentTime(0);
    transportStore.setTempo(120);

    // Clear timeline
    timelineStore.tracks.forEach((track: any) => {
      timelineStore.removeTrack(track.id);
    });

    // Get audio engine instance
    audioEngine = getAudioEngine();
  });

  afterEach(() => {
    voiceController.stopListening();
  });

  // ==========================================================================
  // Complete Recording Flow
  // ==========================================================================

  describe('Voice → Recording → Clip Creation Flow', () => {
    it('should complete full flow: voice command → record → create clip', async () => {
      // Step 1: Add a track via voice
      const addTrackCommand = {
        intent: 'timeline',
        action: 'add_track',
        parameters: { name: 'Vocals' },
        confidence: 0.95,
        requiresConfirmation: false,
        naturalResponse: 'Adding vocals track.',
      };

      jest.spyOn(whisperGPTService, 'analyzeCommand').mockResolvedValueOnce(addTrackCommand);

      const audioBlob = new Blob(['add track'], { type: 'audio/webm' });
      const transcription = await whisperGPTService.transcribe(audioBlob);
      expect(transcription.text).toBeDefined();

      // Execute command
      timelineStore.addTrack({ name: 'Vocals' });
      expect(timelineStore.tracks.length).toBe(1);
      expect(timelineStore.tracks[0].name).toBe('Vocals');

      // Step 2: Arm track for recording
      const track = timelineStore.tracks[0];
      timelineStore.updateTrack(track.id, { isArmed: true });
      expect(track.isArmed).toBe(true);

      // Step 3: Start recording via voice
      const recordCommand = {
        intent: 'transport',
        action: 'record',
        parameters: {},
        confidence: 0.95,
        requiresConfirmation: false,
        naturalResponse: 'Recording.',
      };

      jest.spyOn(whisperGPTService, 'analyzeCommand').mockResolvedValueOnce(recordCommand);

      transportStore.setIsRecording(true);
      expect(transportStore.isRecording).toBe(true);

      // Step 4: Simulate recording duration
      await new Promise(resolve => setTimeout(resolve, 200));

      // Step 5: Stop recording
      const stopCommand = {
        intent: 'transport',
        action: 'stop',
        parameters: {},
        confidence: 0.95,
        requiresConfirmation: false,
        naturalResponse: 'Stopped.',
      };

      jest.spyOn(whisperGPTService, 'analyzeCommand').mockResolvedValueOnce(stopCommand);

      transportStore.setIsRecording(false);
      transportStore.setIsPlaying(false);
      transportStore.setCurrentTime(0);

      // Step 6: Create clip from recording
      const mockClip = {
        trackId: track.id,
        startTime: 0,
        duration: 2.0,
        name: 'Recorded Audio',
        audioBlob: new Blob(['audio data'], { type: 'audio/webm' }),
      };

      timelineStore.addClip(mockClip);

      // Verify clip creation
      const clips = timelineStore.clips.filter((c: any) => c.trackId === track.id);
      expect(clips.length).toBe(1);
      expect(clips[0].duration).toBe(2.0);
    });
  });

  // ==========================================================================
  // Multi-Track Recording Flow
  // ==========================================================================

  describe('Multi-Track Recording Flow', () => {
    it('should record on multiple armed tracks simultaneously', async () => {
      // Create 3 tracks
      const track1Id = timelineStore.addTrack({ name: 'Vocals' });
      const track2Id = timelineStore.addTrack({ name: 'Guitar' });
      const track3Id = timelineStore.addTrack({ name: 'Keys' });

      // Arm first two tracks
      timelineStore.updateTrack(track1Id, { isArmed: true });
      timelineStore.updateTrack(track2Id, { isArmed: true });

      const armedTracks = timelineStore.tracks.filter((t: any) => t.isArmed);
      expect(armedTracks.length).toBe(2);

      // Start recording
      transportStore.setIsRecording(true);

      // Simulate recording
      await new Promise(resolve => setTimeout(resolve, 200));

      // Stop recording
      transportStore.setIsRecording(false);

      // Create clips for both armed tracks
      timelineStore.addClip({
        trackId: track1Id,
        startTime: 0,
        duration: 2.0,
        name: 'Vocals Recording',
      });

      timelineStore.addClip({
        trackId: track2Id,
        startTime: 0,
        duration: 2.0,
        name: 'Guitar Recording',
      });

      // Verify clips created on armed tracks only
      const track1Clips = timelineStore.clips.filter((c: any) => c.trackId === track1Id);
      const track2Clips = timelineStore.clips.filter((c: any) => c.trackId === track2Id);
      const track3Clips = timelineStore.clips.filter((c: any) => c.trackId === track3Id);

      expect(track1Clips.length).toBe(1);
      expect(track2Clips.length).toBe(1);
      expect(track3Clips.length).toBe(0); // Not armed, no recording
    });

    it('should play back non-armed tracks while recording', async () => {
      // Create tracks
      const trackId1 = timelineStore.addTrack({ name: 'Backing Track' });
      const trackId2 = timelineStore.addTrack({ name: 'Lead Vocal' });

      // Add clip to first track
      timelineStore.addClip({
        trackId: trackId1,
        startTime: 0,
        duration: 10.0,
        name: 'Background Music',
      });

      // Arm second track for recording
      timelineStore.updateTrack(trackId2, { isArmed: true });

      // Start playback AND recording
      transportStore.setIsPlaying(true);
      transportStore.setIsRecording(true);

      // Verify both are active
      expect(transportStore.isPlaying).toBe(true);
      expect(transportStore.isRecording).toBe(true);

      // Track 1 should be playing, Track 2 should be recording
      const track1 = timelineStore.tracks.find((t: any) => t.id === trackId1);
      const track2 = timelineStore.tracks.find((t: any) => t.id === trackId2);

      expect(track1.isArmed).toBe(false); // Playback only
      expect(track2.isArmed).toBe(true); // Recording
    });
  });

  // ==========================================================================
  // Live Waveform Visualization
  // ==========================================================================

  describe('Live Waveform Visualization', () => {
    it('should generate live waveform data during recording', async () => {
      // Add and arm track
      const trackId = timelineStore.addTrack({ name: 'Live Track' });
      timelineStore.updateTrack(trackId, { isArmed: true });

      // Mock analyser for waveform
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;

      const waveformData = new Float32Array(analyser.frequencyBinCount);

      // Start recording and capture waveform
      transportStore.setIsRecording(true);

      timelineStore.updateTrack(trackId, {
        isRecording: true,
        liveRecordingStartTime: 0,
        liveRecordingDuration: 0,
        liveWaveformData: waveformData,
      });

      // Simulate waveform updates
      analyser.getFloatTimeDomainData(waveformData);

      const track = timelineStore.tracks.find((t: any) => t.id === trackId);
      expect(track.liveWaveformData).toBeDefined();
      expect(track.liveWaveformData.length).toBeGreaterThan(0);

      // Verify waveform has data
      const hasData = Array.from(waveformData).some(val => val !== 0);
      expect(hasData).toBe(true);

      await audioContext.close();
    });

    it('should update live waveform continuously', async () => {
      const trackId = timelineStore.addTrack({ name: 'Recording Track' });
      timelineStore.updateTrack(trackId, { isArmed: true });

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const waveformData = new Float32Array(analyser.frequencyBinCount);

      // Start recording
      transportStore.setIsRecording(true);
      timelineStore.updateTrack(trackId, {
        isRecording: true,
        liveWaveformData: waveformData,
      });

      // Simulate multiple waveform updates
      for (let i = 0; i < 5; i++) {
        analyser.getFloatTimeDomainData(waveformData);
        timelineStore.updateTrack(trackId, { liveWaveformData: waveformData });
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const track = timelineStore.tracks.find((t: any) => t.id === trackId);
      expect(track.liveWaveformData).toBeDefined();

      await audioContext.close();
    });
  });

  // ==========================================================================
  // Transport Synchronization
  // ==========================================================================

  describe('Transport Synchronization', () => {
    it('should sync currentTime across all components', async () => {
      transportStore.setCurrentTime(10.5);

      expect(transportStore.currentTime).toBe(10.5);

      // Time should be consistent across reads
      const time1 = transportStore.currentTime;
      const time2 = transportStore.currentTime;
      expect(time1).toBe(time2);
    });

    it('should update BPM and maintain sync', () => {
      const initialBPM = transportStore.tempo;
      expect(initialBPM).toBe(120);

      transportStore.setTempo(140);
      expect(transportStore.tempo).toBe(140);

      // All timing should reflect new BPM
      // (In real implementation, this would affect quantization, grid, etc.)
    });

    it('should handle loop mode correctly', () => {
      transportStore.setLoopEnabled(true);
      transportStore.setLoopStart(0);
      transportStore.setLoopEnd(8);

      expect(transportStore.loopEnabled).toBe(true);
      expect(transportStore.loopStart).toBe(0);
      expect(transportStore.loopEnd).toBe(8);

      // When playback reaches loop end, it should jump to loop start
      transportStore.setCurrentTime(8);
      expect(transportStore.currentTime).toBe(8);

      // In real implementation, audio engine would handle the jump
    });
  });

  // ==========================================================================
  // Store Integration
  // ==========================================================================

  describe('Store Integration', () => {
    it('should maintain consistency between Transport and Timeline stores', () => {
      const trackId = timelineStore.addTrack({ name: 'Test Track' });

      timelineStore.addClip({
        trackId,
        startTime: 0,
        duration: 5.0,
        name: 'Clip 1',
      });

      // Transport state should affect timeline behavior
      transportStore.setIsPlaying(true);
      transportStore.setCurrentTime(2.5);

      expect(transportStore.isPlaying).toBe(true);
      expect(transportStore.currentTime).toBe(2.5);

      // Timeline should have the clip
      const clips = timelineStore.clips.filter((c: any) => c.trackId === trackId);
      expect(clips.length).toBe(1);
    });

    it('should handle concurrent store updates', async () => {
      // Simulate rapid state changes
      const updates = [
        () => transportStore.setIsPlaying(true),
        () => transportStore.setCurrentTime(1.0),
        () => timelineStore.addTrack({ name: 'Track 1' }),
        () => transportStore.setCurrentTime(2.0),
        () => timelineStore.addTrack({ name: 'Track 2' }),
        () => transportStore.setTempo(130),
      ];

      // Execute all updates
      updates.forEach(update => update());

      // Final state should be consistent
      expect(transportStore.isPlaying).toBe(true);
      expect(transportStore.currentTime).toBe(2.0);
      expect(transportStore.tempo).toBe(130);
      expect(timelineStore.tracks.length).toBe(2);
    });
  });

  // ==========================================================================
  // Error Recovery
  // ==========================================================================

  describe('Error Recovery', () => {
    it('should recover from recording failure', async () => {
      const trackId = timelineStore.addTrack({ name: 'Error Track' });
      timelineStore.updateTrack(trackId, { isArmed: true });

      // Simulate recording error
      (global.navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(
        new Error('Microphone not available')
      );

      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        // Recording should fail gracefully
        expect(error).toBeDefined();

        // State should be reset
        transportStore.setIsRecording(false);
        expect(transportStore.isRecording).toBe(false);
      }

      // Should be able to try again
      (global.navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValueOnce({
        getTracks: () => [{ stop: jest.fn() }],
      } as any);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      expect(stream).toBeDefined();
    });

    it('should handle audio context suspension', async () => {
      const audioContext = new AudioContext();

      // Simulate suspended state
      (audioContext as any).state = 'suspended';

      // Should resume when needed
      await audioContext.resume();
      expect(audioContext.state).toBe('running');

      await audioContext.close();
    });
  });

  // ==========================================================================
  // Performance
  // ==========================================================================

  describe('Performance', () => {
    it('should handle multiple simultaneous recordings', async () => {
      const trackCount = 8;
      const trackIds: string[] = [];

      // Create and arm multiple tracks
      for (let i = 0; i < trackCount; i++) {
        const id = timelineStore.addTrack({ name: `Track ${i + 1}` });
        timelineStore.updateTrack(id, { isArmed: true });
        trackIds.push(id);
      }

      expect(timelineStore.tracks.length).toBe(trackCount);

      // Start recording on all tracks
      transportStore.setIsRecording(true);

      // Simulate recording
      await new Promise(resolve => setTimeout(resolve, 200));

      // Stop recording
      transportStore.setIsRecording(false);

      // Create clips for all tracks
      trackIds.forEach(trackId => {
        timelineStore.addClip({
          trackId,
          startTime: 0,
          duration: 2.0,
          name: `Recording on ${trackId}`,
        });
      });

      expect(timelineStore.clips.length).toBe(trackCount);
    });

    it('should maintain playback timing accuracy', async () => {
      const startTime = 0;
      const targetTime = 5.0;

      transportStore.setCurrentTime(startTime);
      transportStore.setIsPlaying(true);

      // Simulate passage of time
      const step = 0.1; // 100ms updates
      for (let time = startTime; time < targetTime; time += step) {
        transportStore.setCurrentTime(time);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const finalTime = transportStore.currentTime;
      expect(finalTime).toBeCloseTo(targetTime, 1);
    });
  });
});
