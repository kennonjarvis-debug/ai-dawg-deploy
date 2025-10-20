import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTransportStore } from '@/stores/transportStore';

/**
 * Unit Tests for Transport Store
 *
 * Tests state management logic for:
 * - Transport state transitions
 * - Playback controls
 * - Recording controls
 * - BPM and time signature management
 * - Loop region management
 * - Punch recording
 * - Recording aids (pre-roll, post-roll, count-in)
 * - Metronome controls
 */

describe('Transport Store - State Management', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const { reset } = useTransportStore.getState();
    reset();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useTransportStore.getState();

      expect(state.isPlaying).toBe(false);
      expect(state.isRecording).toBe(false);
      expect(state.isLooping).toBe(false);
      expect(state.currentTime).toBe(0);
      expect(state.bpm).toBe(120);
      expect(state.key).toBe('C');
      expect(state.timeSignature).toEqual({ numerator: 4, denominator: 4 });
      expect(state.masterVolume).toBe(1.0);
    });
  });

  describe('Playback Controls', () => {
    it('should start playing', () => {
      const { play } = useTransportStore.getState();

      play();

      const state = useTransportStore.getState();
      expect(state.isPlaying).toBe(true);
    });

    it('should pause playback', () => {
      const { play, pause } = useTransportStore.getState();

      play();
      pause();

      const state = useTransportStore.getState();
      expect(state.isPlaying).toBe(false);
    });

    it('should stop and reset playhead to beginning', () => {
      const { play, setCurrentTime, stop } = useTransportStore.getState();

      play();
      setCurrentTime(10);
      stop();

      const state = useTransportStore.getState();
      expect(state.isPlaying).toBe(false);
      expect(state.currentTime).toBe(0);
    });

    it('should toggle play/pause', () => {
      const { togglePlay } = useTransportStore.getState();

      togglePlay();
      let state = useTransportStore.getState();
      expect(state.isPlaying).toBe(true);

      togglePlay();
      state = useTransportStore.getState();
      expect(state.isPlaying).toBe(false);
    });
  });

  describe('Recording Controls', () => {
    it('should start recording', () => {
      const { startRecording } = useTransportStore.getState();

      startRecording();

      const state = useTransportStore.getState();
      expect(state.isRecording).toBe(true);
      expect(state.isPlaying).toBe(true); // Recording starts playback too
    });

    it('should stop recording', () => {
      const { startRecording, stopRecording } = useTransportStore.getState();

      startRecording();
      stopRecording();

      const state = useTransportStore.getState();
      expect(state.isRecording).toBe(false);
    });

    it('should toggle recording', () => {
      const { toggleRecord } = useTransportStore.getState();

      toggleRecord();
      let state = useTransportStore.getState();
      expect(state.isRecording).toBe(true);

      toggleRecord();
      state = useTransportStore.getState();
      expect(state.isRecording).toBe(false);
    });

    it('should stop recording when stop is called', () => {
      const { startRecording, stop } = useTransportStore.getState();

      startRecording();
      stop();

      const state = useTransportStore.getState();
      expect(state.isRecording).toBe(false);
      expect(state.isPlaying).toBe(false);
      expect(state.currentTime).toBe(0);
    });
  });

  describe('BPM Management', () => {
    it('should set BPM within valid range', () => {
      const { setBpm } = useTransportStore.getState();

      setBpm(140);

      const state = useTransportStore.getState();
      expect(state.bpm).toBe(140);
    });

    it('should throw error for BPM below 20', () => {
      const { setBpm } = useTransportStore.getState();

      expect(() => setBpm(10)).toThrow('BPM must be between 20 and 300');
    });

    it('should throw error for BPM above 300', () => {
      const { setBpm } = useTransportStore.getState();

      expect(() => setBpm(350)).toThrow('BPM must be between 20 and 300');
    });

    it('should allow edge case BPM values', () => {
      const { setBpm } = useTransportStore.getState();

      setBpm(20);
      expect(useTransportStore.getState().bpm).toBe(20);

      setBpm(300);
      expect(useTransportStore.getState().bpm).toBe(300);
    });
  });

  describe('Time Management', () => {
    it('should set current time', () => {
      const { setCurrentTime } = useTransportStore.getState();

      setCurrentTime(5.5);

      const state = useTransportStore.getState();
      expect(state.currentTime).toBe(5.5);
    });

    it('should not allow negative time', () => {
      const { setCurrentTime } = useTransportStore.getState();

      setCurrentTime(-5);

      const state = useTransportStore.getState();
      expect(state.currentTime).toBe(0);
    });

    it('should seek to specific time', () => {
      const { seek } = useTransportStore.getState();

      seek(10.5);

      const state = useTransportStore.getState();
      expect(state.currentTime).toBe(10.5);
    });
  });

  describe('Loop Controls', () => {
    it('should toggle loop', () => {
      const { toggleLoop } = useTransportStore.getState();

      toggleLoop();
      let state = useTransportStore.getState();
      expect(state.isLooping).toBe(true);

      toggleLoop();
      state = useTransportStore.getState();
      expect(state.isLooping).toBe(false);
    });

    it('should set looping state', () => {
      const { setLooping } = useTransportStore.getState();

      setLooping(true);
      expect(useTransportStore.getState().isLooping).toBe(true);

      setLooping(false);
      expect(useTransportStore.getState().isLooping).toBe(false);
    });

    it('should set loop region', () => {
      const { setLoopRegion } = useTransportStore.getState();

      setLoopRegion(2, 6);

      const state = useTransportStore.getState();
      expect(state.loopStart).toBe(2);
      expect(state.loopEnd).toBe(6);
    });

    it('should throw error if loop end is before start', () => {
      const { setLoopRegion } = useTransportStore.getState();

      expect(() => setLoopRegion(6, 2)).toThrow('Loop end must be after loop start');
    });

    it('should calculate loop duration', () => {
      const { setLoopRegion, getLoopDuration } = useTransportStore.getState();

      setLoopRegion(2, 10);

      expect(getLoopDuration()).toBe(8);
    });

    it('should check if current time is in loop region', () => {
      const { setLoopRegion, setCurrentTime, isInLoopRegion } = useTransportStore.getState();

      setLoopRegion(5, 15);
      setCurrentTime(10);

      expect(isInLoopRegion()).toBe(true);

      setCurrentTime(3);
      expect(isInLoopRegion()).toBe(false);

      setCurrentTime(20);
      expect(isInLoopRegion()).toBe(false);
    });
  });

  describe('Transport Navigation', () => {
    it('should skip backward by one bar', () => {
      const { setCurrentTime, skipBackward } = useTransportStore.getState();

      setCurrentTime(10);
      skipBackward();

      const state = useTransportStore.getState();
      // At 120 BPM, 4/4 time: 1 bar = 2 seconds
      expect(state.currentTime).toBe(8);
    });

    it('should skip forward by one bar', () => {
      const { setCurrentTime, skipForward } = useTransportStore.getState();

      setCurrentTime(10);
      skipForward();

      const state = useTransportStore.getState();
      // At 120 BPM, 4/4 time: 1 bar = 2 seconds
      expect(state.currentTime).toBe(12);
    });

    it('should not skip backward below zero', () => {
      const { setCurrentTime, skipBackward } = useTransportStore.getState();

      setCurrentTime(1);
      skipBackward();

      const state = useTransportStore.getState();
      expect(state.currentTime).toBe(0);
    });

    it('should return to start', () => {
      const { setCurrentTime, returnToStart } = useTransportStore.getState();

      setCurrentTime(50);
      returnToStart();

      const state = useTransportStore.getState();
      expect(state.currentTime).toBe(0);
    });
  });

  describe('Time Signature', () => {
    it('should set time signature', () => {
      const { setTimeSignature } = useTransportStore.getState();

      setTimeSignature(6, 8);

      const state = useTransportStore.getState();
      expect(state.timeSignature).toEqual({ numerator: 6, denominator: 8 });
    });

    it('should handle common time signatures', () => {
      const { setTimeSignature } = useTransportStore.getState();

      setTimeSignature(3, 4);
      expect(useTransportStore.getState().timeSignature).toEqual({ numerator: 3, denominator: 4 });

      setTimeSignature(5, 4);
      expect(useTransportStore.getState().timeSignature).toEqual({ numerator: 5, denominator: 4 });

      setTimeSignature(7, 8);
      expect(useTransportStore.getState().timeSignature).toEqual({ numerator: 7, denominator: 8 });
    });
  });

  describe('Musical Key', () => {
    it('should set musical key', () => {
      const { setKey } = useTransportStore.getState();

      setKey('D#');

      const state = useTransportStore.getState();
      expect(state.key).toBe('D#');
    });
  });

  describe('Master Volume', () => {
    it('should set master volume', () => {
      const { setMasterVolume } = useTransportStore.getState();

      setMasterVolume(0.7);

      const state = useTransportStore.getState();
      expect(state.masterVolume).toBe(0.7);
    });

    it('should clamp volume to 0-1 range', () => {
      const { setMasterVolume } = useTransportStore.getState();

      setMasterVolume(1.5);
      expect(useTransportStore.getState().masterVolume).toBe(1);

      setMasterVolume(-0.5);
      expect(useTransportStore.getState().masterVolume).toBe(0);
    });
  });

  describe('Punch Recording', () => {
    it('should set punch mode', () => {
      const { setPunchMode } = useTransportStore.getState();

      setPunchMode('quick-punch');

      const state = useTransportStore.getState();
      expect(state.punchMode).toBe('quick-punch');
    });

    it('should set punch in time', () => {
      const { setPunchInTime } = useTransportStore.getState();

      setPunchInTime(5);

      const state = useTransportStore.getState();
      expect(state.punchInTime).toBe(5);
    });

    it('should set punch out time', () => {
      const { setPunchOutTime } = useTransportStore.getState();

      setPunchOutTime(10);

      const state = useTransportStore.getState();
      expect(state.punchOutTime).toBe(10);
    });

    it('should throw error if punch in is after punch out', () => {
      const { setPunchOutTime, setPunchInTime } = useTransportStore.getState();

      setPunchOutTime(5);

      expect(() => setPunchInTime(10)).toThrow('Punch in time must be before punch out time');
    });

    it('should set punch range', () => {
      const { setPunchRange } = useTransportStore.getState();

      setPunchRange(3, 8);

      const state = useTransportStore.getState();
      expect(state.punchInTime).toBe(3);
      expect(state.punchOutTime).toBe(8);
    });

    it('should clear punch times', () => {
      const { setPunchRange, clearPunchTimes } = useTransportStore.getState();

      setPunchRange(3, 8);
      clearPunchTimes();

      const state = useTransportStore.getState();
      expect(state.punchInTime).toBeNull();
      expect(state.punchOutTime).toBeNull();
    });
  });

  describe('Recording Aids', () => {
    it('should set pre-roll', () => {
      const { setPreRoll } = useTransportStore.getState();

      setPreRoll(2);

      const state = useTransportStore.getState();
      expect(state.preRoll).toBe(2);
    });

    it('should throw error for pre-roll out of range', () => {
      const { setPreRoll } = useTransportStore.getState();

      expect(() => setPreRoll(-1)).toThrow('Pre-roll must be between 0 and 4 bars');
      expect(() => setPreRoll(5)).toThrow('Pre-roll must be between 0 and 4 bars');
    });

    it('should set post-roll', () => {
      const { setPostRoll } = useTransportStore.getState();

      setPostRoll(1);

      const state = useTransportStore.getState();
      expect(state.postRoll).toBe(1);
    });

    it('should throw error for post-roll out of range', () => {
      const { setPostRoll } = useTransportStore.getState();

      expect(() => setPostRoll(-1)).toThrow('Post-roll must be between 0 and 4 bars');
      expect(() => setPostRoll(5)).toThrow('Post-roll must be between 0 and 4 bars');
    });

    it('should toggle pre-roll', () => {
      const { togglePreRoll } = useTransportStore.getState();

      togglePreRoll();
      expect(useTransportStore.getState().enablePreRoll).toBe(true);

      togglePreRoll();
      expect(useTransportStore.getState().enablePreRoll).toBe(false);
    });

    it('should toggle post-roll', () => {
      const { togglePostRoll } = useTransportStore.getState();

      togglePostRoll();
      expect(useTransportStore.getState().enablePostRoll).toBe(true);

      togglePostRoll();
      expect(useTransportStore.getState().enablePostRoll).toBe(false);
    });

    it('should set count-in', () => {
      const { setCountIn } = useTransportStore.getState();

      setCountIn(2);

      const state = useTransportStore.getState();
      expect(state.countIn).toBe(2);
    });

    it('should throw error for count-in out of range', () => {
      const { setCountIn } = useTransportStore.getState();

      expect(() => setCountIn(-1)).toThrow('Count-in must be between 0 and 4 bars');
      expect(() => setCountIn(5)).toThrow('Count-in must be between 0 and 4 bars');
    });
  });

  describe('Metronome', () => {
    it('should toggle metronome', () => {
      const { toggleMetronome } = useTransportStore.getState();

      toggleMetronome();
      expect(useTransportStore.getState().metronomeEnabled).toBe(true);

      toggleMetronome();
      expect(useTransportStore.getState().metronomeEnabled).toBe(false);
    });

    it('should set metronome volume', () => {
      const { setMetronomeVolume } = useTransportStore.getState();

      setMetronomeVolume(0.7);

      const state = useTransportStore.getState();
      expect(state.metronomeVolume).toBe(0.7);
    });

    it('should throw error for metronome volume out of range', () => {
      const { setMetronomeVolume } = useTransportStore.getState();

      expect(() => setMetronomeVolume(-0.1)).toThrow('Metronome volume must be between 0 and 1');
      expect(() => setMetronomeVolume(1.1)).toThrow('Metronome volume must be between 0 and 1');
    });
  });

  describe('Time Calculations', () => {
    it('should calculate seconds per beat', () => {
      const { getSecondsPerBeat, setBpm } = useTransportStore.getState();

      setBpm(120);
      expect(getSecondsPerBeat()).toBe(0.5); // 60/120 = 0.5

      setBpm(60);
      expect(getSecondsPerBeat()).toBe(1); // 60/60 = 1

      setBpm(180);
      expect(getSecondsPerBeat()).toBeCloseTo(0.333, 2); // 60/180
    });

    it('should calculate seconds per bar', () => {
      const { getSecondsPerBar, setBpm, setTimeSignature } = useTransportStore.getState();

      setBpm(120);
      setTimeSignature(4, 4);
      expect(getSecondsPerBar()).toBe(2); // 4 beats * 0.5 seconds

      setTimeSignature(3, 4);
      expect(getSecondsPerBar()).toBe(1.5); // 3 beats * 0.5 seconds

      setBpm(60);
      setTimeSignature(4, 4);
      expect(getSecondsPerBar()).toBe(4); // 4 beats * 1 second
    });

    it('should convert bars to seconds', () => {
      const { barsToSeconds, setBpm, setTimeSignature } = useTransportStore.getState();

      setBpm(120);
      setTimeSignature(4, 4);

      expect(barsToSeconds(1)).toBe(2);
      expect(barsToSeconds(2)).toBe(4);
      expect(barsToSeconds(4)).toBe(8);
    });

    it('should calculate pre-roll seconds', () => {
      const { getPreRollSeconds, setPreRoll, setBpm } = useTransportStore.getState();

      setBpm(120);
      setPreRoll(2);

      expect(getPreRollSeconds()).toBe(4); // 2 bars * 2 seconds/bar
    });

    it('should calculate post-roll seconds', () => {
      const { getPostRollSeconds, setPostRoll, setBpm } = useTransportStore.getState();

      setBpm(120);
      setPostRoll(1);

      expect(getPostRollSeconds()).toBe(2); // 1 bar * 2 seconds/bar
    });

    it('should calculate count-in seconds', () => {
      const { getCountInSeconds, setCountIn, setBpm } = useTransportStore.getState();

      setBpm(120);
      setCountIn(2);

      expect(getCountInSeconds()).toBe(4); // 2 bars * 2 seconds/bar
    });

    it('should calculate total pre-recording time', () => {
      const { getTotalPreRecordingTime, setCountIn, setPreRoll, setPreRollEnabled, setBpm } = useTransportStore.getState();

      setBpm(120);
      setCountIn(1);
      setPreRoll(1);
      setPreRollEnabled(true);

      expect(getTotalPreRecordingTime()).toBe(4); // (1 + 1) * 2 seconds/bar

      setPreRollEnabled(false);
      expect(getTotalPreRecordingTime()).toBe(2); // Only count-in
    });
  });

  describe('Input Monitoring', () => {
    it('should set global input mode', () => {
      const { setGlobalInputMode } = useTransportStore.getState();

      setGlobalInputMode('input-only');

      const state = useTransportStore.getState();
      expect(state.globalInputMode).toBe('input-only');
    });
  });

  describe('Store Reset', () => {
    it('should reset all state to initial values', () => {
      const {
        play,
        startRecording,
        setBpm,
        setKey,
        setCurrentTime,
        setLooping,
        reset,
      } = useTransportStore.getState();

      // Change multiple values
      play();
      startRecording();
      setBpm(180);
      setKey('F#');
      setCurrentTime(25);
      setLooping(true);

      // Reset
      reset();

      // Verify initial state
      const state = useTransportStore.getState();
      expect(state.isPlaying).toBe(false);
      expect(state.isRecording).toBe(false);
      expect(state.bpm).toBe(120);
      expect(state.key).toBe('C');
      expect(state.currentTime).toBe(0);
      expect(state.isLooping).toBe(false);
    });
  });

  describe('Complex State Transitions', () => {
    it('should handle play → record → stop sequence', () => {
      const { play, startRecording, stop } = useTransportStore.getState();

      play();
      expect(useTransportStore.getState().isPlaying).toBe(true);
      expect(useTransportStore.getState().isRecording).toBe(false);

      startRecording();
      expect(useTransportStore.getState().isPlaying).toBe(true);
      expect(useTransportStore.getState().isRecording).toBe(true);

      stop();
      expect(useTransportStore.getState().isPlaying).toBe(false);
      expect(useTransportStore.getState().isRecording).toBe(false);
      expect(useTransportStore.getState().currentTime).toBe(0);
    });

    it('should maintain state consistency during rapid toggles', () => {
      const { togglePlay, toggleRecord, toggleLoop } = useTransportStore.getState();

      // Rapid toggles
      for (let i = 0; i < 10; i++) {
        togglePlay();
        toggleRecord();
        toggleLoop();
      }

      // Final state should be stable (even number of toggles)
      const state = useTransportStore.getState();
      expect(state.isPlaying).toBe(false);
      expect(state.isRecording).toBe(false);
      expect(state.isLooping).toBe(false);
    });

    it('should handle time changes during different states', () => {
      const { play, startRecording, setCurrentTime } = useTransportStore.getState();

      // Set time while stopped
      setCurrentTime(10);
      expect(useTransportStore.getState().currentTime).toBe(10);

      // Set time while playing
      play();
      setCurrentTime(20);
      expect(useTransportStore.getState().currentTime).toBe(20);

      // Set time while recording
      startRecording();
      setCurrentTime(30);
      expect(useTransportStore.getState().currentTime).toBe(30);
    });
  });
});
