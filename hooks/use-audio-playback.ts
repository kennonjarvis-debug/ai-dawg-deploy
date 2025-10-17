'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAudioStore } from '@/lib/store';

export function useAudioPlayback() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const panNodeRef = useRef<StereoPannerNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { playback, tracks, activeTrackId, setPlayback } = useAudioStore();

  // Initialize audio context and nodes
  const initializeAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audioContext = audioContextRef.current;
    const audioElement = audioRef.current;

    if (!sourceNodeRef.current) {
      sourceNodeRef.current = audioContext.createMediaElementSource(audioElement);
    }

    if (!gainNodeRef.current) {
      gainNodeRef.current = audioContext.createGain();
    }

    if (!panNodeRef.current) {
      panNodeRef.current = audioContext.createStereoPanner();
    }

    // Connect nodes: source -> gain -> pan -> destination
    sourceNodeRef.current.connect(gainNodeRef.current);
    gainNodeRef.current.connect(panNodeRef.current);
    panNodeRef.current.connect(audioContext.destination);

    // Event listeners
    audioElement.addEventListener('ended', () => {
      setPlayback({ isPlaying: false, isPaused: false, currentTime: 0 });
    });

    audioElement.addEventListener('loadedmetadata', () => {
      setPlayback({ duration: audioElement.duration });
    });
  }, [setPlayback]);

  // Load audio from active recording
  const loadAudio = useCallback(
    (blob: Blob) => {
      if (!audioRef.current) {
        initializeAudio();
      }

      const url = URL.createObjectURL(blob);
      audioRef.current!.src = url;
      audioRef.current!.load();

      return () => URL.revokeObjectURL(url);
    },
    [initializeAudio]
  );

  // Play audio
  const play = useCallback(async () => {
    if (!audioRef.current) return;

    try {
      await audioRef.current.play();
      setPlayback({ isPlaying: true, isPaused: false });

      // Update current time
      const updateTime = () => {
        if (audioRef.current && audioRef.current.currentTime) {
          setPlayback({ currentTime: audioRef.current.currentTime });
        }
        if (playback.isPlaying) {
          animationFrameRef.current = requestAnimationFrame(updateTime);
        }
      };
      updateTime();
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  }, [playback.isPlaying, setPlayback]);

  // Pause audio
  const pause = useCallback(() => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    setPlayback({ isPlaying: false, isPaused: true });

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [setPlayback]);

  // Stop audio
  const stop = useCallback(() => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setPlayback({ isPlaying: false, isPaused: false, currentTime: 0 });

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [setPlayback]);

  // Seek to time
  const seek = useCallback(
    (time: number) => {
      if (!audioRef.current) return;

      audioRef.current.currentTime = time;
      setPlayback({ currentTime: time });
    },
    [setPlayback]
  );

  // Update volume based on active track
  useEffect(() => {
    if (!gainNodeRef.current || !activeTrackId) return;

    const activeTrack = tracks.find((t) => t.id === activeTrackId);
    if (activeTrack) {
      gainNodeRef.current.gain.value = activeTrack.muted ? 0 : activeTrack.volume;
    }
  }, [tracks, activeTrackId]);

  // Update pan based on active track
  useEffect(() => {
    if (!panNodeRef.current || !activeTrackId) return;

    const activeTrack = tracks.find((t) => t.id === activeTrackId);
    if (activeTrack) {
      panNodeRef.current.pan.value = activeTrack.pan;
    }
  }, [tracks, activeTrackId]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    loadAudio,
    play,
    pause,
    stop,
    seek,
    playback,
  };
}
