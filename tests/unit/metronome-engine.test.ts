/**
 * Unit tests for MetronomeEngine
 * Tests deferred AudioContext initialization and metronome functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MetronomeEngine } from '../../src/audio/MetronomeEngine';

// Mock AudioContext
class MockAudioContext {
  state: 'running' | 'suspended' = 'running';
  currentTime = 0;
  destination = {
    connect: vi.fn(),
    disconnect: vi.fn(),
  };

  createOscillator() {
    return {
      frequency: { value: 0 },
      type: 'sine',
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
    };
  }

  createGain() {
    return {
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  resume() {
    this.state = 'running';
    return Promise.resolve();
  }

  close() {
    return Promise.resolve();
  }
}

describe('MetronomeEngine', () => {
  let metronome: MetronomeEngine;
  let mockAudioContext: MockAudioContext;

  beforeEach(() => {
    mockAudioContext = new MockAudioContext();
    metronome = new MetronomeEngine();
  });

  afterEach(() => {
    if (metronome) {
      metronome.dispose();
    }
  });

  describe('Initialization', () => {
    it('should create instance without AudioContext', () => {
      const instance = new MetronomeEngine();
      expect(instance).toBeDefined();
      expect(instance.getIsPlaying()).toBe(false);
    });

    it('should accept optional AudioContext in constructor', () => {
      const instance = new MetronomeEngine(mockAudioContext as any);
      expect(instance).toBeDefined();
    });

    it('should initialize without AudioContext (deferred)', () => {
      metronome.initialize();
      expect(metronome).toBeDefined();
    });

    it('should initialize with AudioContext provided', () => {
      metronome.initialize(mockAudioContext as any);
      expect(metronome).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when playCountIn called without AudioContext', async () => {
      const instance = new MetronomeEngine();
      instance.initialize(); // No AudioContext provided

      await expect(
        instance.playCountIn(1, 120, 4, 0.5)
      ).rejects.toThrow('AudioContext not available');
    });

    it('should throw error when start called without AudioContext', () => {
      const instance = new MetronomeEngine();
      instance.initialize(); // No AudioContext provided

      expect(() => {
        instance.start(120, 4, 0.5);
      }).toThrow('AudioContext not available');
    });

    it('should not throw when stop called without AudioContext', () => {
      const instance = new MetronomeEngine();
      instance.initialize(); // No AudioContext provided

      expect(() => {
        instance.stop();
      }).not.toThrow();
    });
  });

  describe('Count-In Functionality', () => {
    beforeEach(() => {
      metronome.initialize(mockAudioContext as any);
    });

    it('should resolve immediately when bars is 0', async () => {
      const startTime = Date.now();
      await metronome.playCountIn(0, 120, 4, 0.5);
      const endTime = Date.now();

      // Should resolve very quickly (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should schedule clicks for count-in', async () => {
      vi.useFakeTimers();

      const promise = metronome.playCountIn(1, 120, 4, 0.5); // 1 bar = 4 beats at 120 BPM

      // Advance time to complete count-in
      // 1 bar at 120 BPM with 4 beats = 2 seconds
      vi.advanceTimersByTime(2000);

      await promise;

      vi.useRealTimers();
    });

    it('should schedule downbeat and upbeat clicks correctly', async () => {
      vi.useFakeTimers();

      const createOscillatorSpy = vi.spyOn(mockAudioContext, 'createOscillator');

      const promise = metronome.playCountIn(1, 120, 4, 0.5);

      // Should create 4 oscillators (1 bar * 4 beats)
      expect(createOscillatorSpy).toHaveBeenCalledTimes(4);

      vi.advanceTimersByTime(2000);
      await promise;

      vi.useRealTimers();
    });

    it('should handle different time signatures', async () => {
      vi.useFakeTimers();

      const createOscillatorSpy = vi.spyOn(mockAudioContext, 'createOscillator');

      // 3/4 time - 1 bar = 3 beats
      const promise = metronome.playCountIn(1, 120, 3, 0.5);

      expect(createOscillatorSpy).toHaveBeenCalledTimes(3);

      vi.advanceTimersByTime(1500); // 3 beats at 120 BPM
      await promise;

      vi.useRealTimers();
    });
  });

  describe('Metronome Start/Stop', () => {
    beforeEach(() => {
      metronome.initialize(mockAudioContext as any);
    });

    it('should start metronome successfully', () => {
      vi.useFakeTimers();

      metronome.start(120, 4, 0.5);

      expect(metronome.getIsPlaying()).toBe(true);

      vi.useRealTimers();
    });

    it('should stop metronome successfully', () => {
      vi.useFakeTimers();

      metronome.start(120, 4, 0.5);
      expect(metronome.getIsPlaying()).toBe(true);

      metronome.stop();
      expect(metronome.getIsPlaying()).toBe(false);

      vi.useRealTimers();
    });

    it('should stop previous metronome when starting new one', () => {
      vi.useFakeTimers();

      metronome.start(120, 4, 0.5);
      const firstIsPlaying = metronome.getIsPlaying();

      metronome.start(140, 4, 0.5); // Start with different BPM
      const secondIsPlaying = metronome.getIsPlaying();

      expect(firstIsPlaying).toBe(true);
      expect(secondIsPlaying).toBe(true);

      vi.useRealTimers();
    });

    it('should generate clicks at correct intervals', () => {
      vi.useFakeTimers();

      const createOscillatorSpy = vi.spyOn(mockAudioContext, 'createOscillator');

      metronome.start(120, 4, 0.5); // 120 BPM = 0.5 seconds per beat

      // Initial click
      expect(createOscillatorSpy).toHaveBeenCalledTimes(1);

      // Advance by 0.5 seconds (1 beat at 120 BPM)
      vi.advanceTimersByTime(500);
      expect(createOscillatorSpy).toHaveBeenCalledTimes(2);

      // Advance by another 0.5 seconds
      vi.advanceTimersByTime(500);
      expect(createOscillatorSpy).toHaveBeenCalledTimes(3);

      metronome.stop();
      vi.useRealTimers();
    });
  });

  describe('Volume Control', () => {
    beforeEach(() => {
      metronome.initialize(mockAudioContext as any);
    });

    it('should respect volume parameter in playCountIn', async () => {
      vi.useFakeTimers();

      const createGainSpy = vi.spyOn(mockAudioContext, 'createGain');

      const promise = metronome.playCountIn(1, 120, 4, 0.8);

      expect(createGainSpy).toHaveBeenCalled();

      vi.advanceTimersByTime(2000);
      await promise;

      vi.useRealTimers();
    });

    it('should respect volume parameter in start', () => {
      vi.useFakeTimers();

      const createGainSpy = vi.spyOn(mockAudioContext, 'createGain');

      metronome.start(120, 4, 0.3);

      expect(createGainSpy).toHaveBeenCalled();

      metronome.stop();
      vi.useRealTimers();
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      metronome.initialize(mockAudioContext as any);
    });

    it('should dispose cleanly', () => {
      vi.useFakeTimers();

      metronome.start(120, 4, 0.5);
      expect(metronome.getIsPlaying()).toBe(true);

      metronome.dispose();
      expect(metronome.getIsPlaying()).toBe(false);

      vi.useRealTimers();
    });

    it('should clean up click sources on stop', () => {
      vi.useFakeTimers();

      const createOscillatorSpy = vi.spyOn(mockAudioContext, 'createOscillator');

      metronome.start(120, 4, 0.5);

      // Generate some clicks
      vi.advanceTimersByTime(1000);

      const clickCount = createOscillatorSpy.mock.calls.length;
      expect(clickCount).toBeGreaterThan(0);

      metronome.stop();

      // Click sources should be cleaned up
      expect(metronome.getIsPlaying()).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('Integration with useAudioEngine Flow', () => {
    it('should work with deferred AudioContext pattern', async () => {
      // Simulate useAudioEngine initialization flow
      const instance = new MetronomeEngine();

      // Step 1: Initialize without AudioContext
      instance.initialize();

      // Step 2: Try to use before AudioContext is set (should error)
      await expect(
        instance.playCountIn(1, 120, 4, 0.5)
      ).rejects.toThrow('AudioContext not available');

      // Step 3: Initialize with AudioContext (simulating user gesture)
      instance.initialize(mockAudioContext as any);

      // Step 4: Now should work
      vi.useFakeTimers();
      const promise = instance.playCountIn(1, 120, 4, 0.5);
      vi.advanceTimersByTime(2000);
      await promise;
      vi.useRealTimers();
    });

    it('should work when AudioContext is provided later', () => {
      // Simulate the flow where metronome is created first
      const instance = new MetronomeEngine();
      instance.initialize(); // No AudioContext

      // Later, AudioContext is provided
      instance.initialize(mockAudioContext as any);

      // Now start should work
      vi.useFakeTimers();
      instance.start(120, 4, 0.5);
      expect(instance.getIsPlaying()).toBe(true);
      instance.stop();
      vi.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      metronome.initialize(mockAudioContext as any);
    });

    it('should handle very fast BPM', () => {
      vi.useFakeTimers();

      metronome.start(240, 4, 0.5); // Very fast
      expect(metronome.getIsPlaying()).toBe(true);

      metronome.stop();
      vi.useRealTimers();
    });

    it('should handle very slow BPM', () => {
      vi.useFakeTimers();

      metronome.start(40, 4, 0.5); // Very slow
      expect(metronome.getIsPlaying()).toBe(true);

      metronome.stop();
      vi.useRealTimers();
    });

    it('should handle multiple bars in count-in', async () => {
      vi.useFakeTimers();

      const createOscillatorSpy = vi.spyOn(mockAudioContext, 'createOscillator');

      const promise = metronome.playCountIn(2, 120, 4, 0.5); // 2 bars = 8 beats

      expect(createOscillatorSpy).toHaveBeenCalledTimes(8);

      vi.advanceTimersByTime(4000); // 8 beats at 120 BPM
      await promise;

      vi.useRealTimers();
    });

    it('should handle different time signatures correctly', () => {
      vi.useFakeTimers();

      // 6/8 time
      metronome.start(120, 6, 0.5);
      expect(metronome.getIsPlaying()).toBe(true);

      metronome.stop();

      // 5/4 time
      metronome.start(120, 5, 0.5);
      expect(metronome.getIsPlaying()).toBe(true);

      metronome.stop();
      vi.useRealTimers();
    });
  });
});
