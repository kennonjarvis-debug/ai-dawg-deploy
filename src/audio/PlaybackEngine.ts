/**
 * PlaybackEngine - Audio playback system for clips
 * Handles multi-track playback, mixing, and synchronization
 */

import type { Clip, Track } from '../stores/timelineStore';

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  activeClips: Map<string, AudioBufferSourceNode>;
  scheduledClips: Set<string>;
}

export class PlaybackEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private trackGains: Map<string, GainNode> = new Map();
  private trackPanners: Map<string, StereoPannerNode> = new Map();

  private playbackState: PlaybackState = {
    isPlaying: false,
    currentTime: 0,
    activeClips: new Map(),
    scheduledClips: new Set(),
  };

  private playbackStartTime: number = 0;
  private playbackStartOffset: number = 0;
  private animationFrameId: number | null = null;
  private onTimeUpdate?: (time: number) => void;

  constructor(audioContext?: AudioContext) {
    this.audioContext = audioContext || null;
  }

  /**
   * Initialize playback engine with audio context
   */
  initialize(audioContext: AudioContext): void {
    this.audioContext = audioContext;

    // Create master gain node
    this.masterGain = audioContext.createGain();
    this.masterGain.connect(audioContext.destination);

    console.log('[PlaybackEngine] Initialized');
  }

  /**
   * Get or create gain node for track
   */
  private getTrackGain(trackId: string, track: Track): GainNode {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    let gainNode = this.trackGains.get(trackId);
    if (!gainNode) {
      gainNode = this.audioContext.createGain();
      gainNode.gain.value = track.volume;
      gainNode.connect(this.masterGain!);
      this.trackGains.set(trackId, gainNode);
    } else {
      gainNode.gain.value = track.volume;
    }

    return gainNode;
  }

  /**
   * Get or create panner node for track
   */
  private getTrackPanner(trackId: string, track: Track): StereoPannerNode {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    let panNode = this.trackPanners.get(trackId);
    if (!panNode) {
      panNode = this.audioContext.createStereoPanner();
      panNode.pan.value = track.pan;
      this.trackPanners.set(trackId, panNode);
    } else {
      panNode.pan.value = track.pan;
    }

    return panNode;
  }

  /**
   * Start playback from specified time
   */
  start(tracks: Track[], startTime: number = 0, masterVolume: number = 1.0): void {
    if (!this.audioContext || !this.masterGain) {
      throw new Error('Playback engine not initialized');
    }

    console.log('[PlaybackEngine] Starting playback from', startTime.toFixed(2), 's');

    this.playbackState.isPlaying = true;
    this.playbackStartTime = this.audioContext.currentTime;
    this.playbackStartOffset = startTime;
    this.playbackState.currentTime = startTime;

    // Set master volume
    this.masterGain.gain.value = masterVolume;

    // Schedule all clips
    this.scheduleClips(tracks, startTime);

    // Start time update loop
    this.startTimeUpdate();
  }

  /**
   * Schedule clips for playback
   */
  private scheduleClips(tracks: Track[], startTime: number): void {
    if (!this.audioContext) return;

    const audioContext = this.audioContext;
    const currentAudioTime = audioContext.currentTime;

    tracks.forEach(track => {
      // Skip muted or solo'd tracks (if any other track is solo'd)
      const anySolo = tracks.some(t => t.isSolo);
      if (track.isMuted || (anySolo && !track.isSolo)) {
        return;
      }

      // Get track gain and panner
      const gainNode = this.getTrackGain(track.id, track);
      const panNode = this.getTrackPanner(track.id, track);
      panNode.connect(gainNode);

      track.clips.forEach(clip => {
        // Skip clips that have already ended
        const clipEndTime = clip.startTime + clip.duration;
        if (clipEndTime <= startTime) {
          return;
        }

        // Skip clips without audio buffer
        if (!clip.audioBuffer) {
          console.warn('[PlaybackEngine] Clip has no audio buffer:', clip.name);
          return;
        }

        // Calculate when to start the clip
        const clipStartTime = clip.startTime;
        const offset = Math.max(0, startTime - clipStartTime);
        const when = currentAudioTime + Math.max(0, clipStartTime - startTime);

        // Create buffer source
        const source = audioContext.createBufferSource();
        source.buffer = clip.audioBuffer;

        // Apply gain if specified
        if (clip.gain && clip.gain !== 0) {
          const clipGain = audioContext.createGain();
          const gainValue = Math.pow(10, clip.gain / 20); // dB to linear
          clipGain.gain.value = gainValue;
          source.connect(clipGain);
          clipGain.connect(panNode);
        } else {
          source.connect(panNode);
        }

        // Apply fade in/out
        if (clip.fadeIn && clip.fadeIn > 0 && offset < clip.fadeIn) {
          const fadeGain = audioContext.createGain();
          fadeGain.gain.setValueAtTime(0, when);
          fadeGain.gain.linearRampToValueAtTime(1, when + clip.fadeIn - offset);
          source.disconnect();
          source.connect(fadeGain);
          fadeGain.connect(panNode);
        }

        if (clip.fadeOut && clip.fadeOut > 0) {
          const fadeOutStart = clip.duration - clip.fadeOut;
          if (offset < fadeOutStart) {
            const fadeGain = audioContext.createGain();
            fadeGain.gain.setValueAtTime(1, when + fadeOutStart - offset);
            fadeGain.gain.linearRampToValueAtTime(0, when + clip.duration - offset);
            source.disconnect();
            source.connect(fadeGain);
            fadeGain.connect(panNode);
          }
        }

        // Schedule playback
        source.start(when, offset);
        source.stop(when + clip.duration - offset);

        // Track active source
        this.playbackState.activeClips.set(clip.id, source);
        this.playbackState.scheduledClips.add(clip.id);

        // Clean up when finished
        source.onended = () => {
          this.playbackState.activeClips.delete(clip.id);
        };

        console.log('[PlaybackEngine] Scheduled clip:', clip.name, 'at', when.toFixed(2), 's, offset:', offset.toFixed(2), 's');
      });
    });
  }

  /**
   * Stop playback
   */
  stop(): void {
    console.log('[PlaybackEngine] Stopping playback');

    this.playbackState.isPlaying = false;

    // Stop all active clips
    this.playbackState.activeClips.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Already stopped
      }
    });

    this.playbackState.activeClips.clear();
    this.playbackState.scheduledClips.clear();

    // Stop time update
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Pause playback (can be resumed)
   */
  pause(): void {
    this.stop();
  }

  /**
   * Update time callback loop
   */
  private startTimeUpdate(): void {
    const update = () => {
      if (!this.playbackState.isPlaying || !this.audioContext) return;

      // Calculate current playback time
      const elapsed = this.audioContext.currentTime - this.playbackStartTime;
      this.playbackState.currentTime = this.playbackStartOffset + elapsed;

      // Notify listeners
      if (this.onTimeUpdate) {
        this.onTimeUpdate(this.playbackState.currentTime);
      }

      // Continue loop
      this.animationFrameId = requestAnimationFrame(update);
    };

    this.animationFrameId = requestAnimationFrame(update);
  }

  /**
   * Set time update callback
   */
  setTimeUpdateCallback(callback: (time: number) => void): void {
    this.onTimeUpdate = callback;
  }

  /**
   * Update master volume
   */
  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Update track volume
   */
  setTrackVolume(trackId: string, volume: number): void {
    const gainNode = this.trackGains.get(trackId);
    if (gainNode) {
      gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Update track pan
   */
  setTrackPan(trackId: string, pan: number): void {
    const panNode = this.trackPanners.get(trackId);
    if (panNode) {
      panNode.pan.value = Math.max(-1, Math.min(1, pan));
    }
  }

  /**
   * Get current playback state
   */
  getState(): PlaybackState {
    return { ...this.playbackState };
  }

  /**
   * Check if playing
   */
  isPlaying(): boolean {
    return this.playbackState.isPlaying;
  }

  /**
   * Get current playback time
   */
  getCurrentTime(): number {
    return this.playbackState.currentTime;
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stop();

    // Disconnect all nodes
    this.trackGains.forEach(gain => gain.disconnect());
    this.trackPanners.forEach(pan => pan.disconnect());
    this.trackGains.clear();
    this.trackPanners.clear();

    if (this.masterGain) {
      this.masterGain.disconnect();
    }

    console.log('[PlaybackEngine] Disposed');
  }
}

// Singleton instance
let playbackEngineInstance: PlaybackEngine | null = null;

export const getPlaybackEngine = (): PlaybackEngine => {
  if (!playbackEngineInstance) {
    playbackEngineInstance = new PlaybackEngine();
  }
  return playbackEngineInstance;
};
