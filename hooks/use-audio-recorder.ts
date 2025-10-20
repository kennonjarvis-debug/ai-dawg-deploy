'use client';

import { useState, useRef, useCallback } from 'react';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
}

export function useAudioRecorder() {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioLevel: 0,
  });
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioContextStartTimeRef = useRef<number>(0); // AudioContext time for sample-accurate timing
  const monitoringRef = useRef<boolean>(false);

  // Initialize audio context and get microphone access
  const initialize = useCallback(async (deviceId?: string) => {
    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Request microphone permission with specific device
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create analyser for audio level monitoring
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      return false;
    }
  }, []);

  // Start monitoring audio levels (separate from initialize)
  const startMonitoring = useCallback(() => {
    if (!analyserRef.current || monitoringRef.current) return;

    monitoringRef.current = true;
    monitorAudioLevel();
  }, []);

  // Stop monitoring audio levels
  const stopMonitoring = useCallback(() => {
    monitoringRef.current = false;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setState((prev) => ({ ...prev, audioLevel: 0 }));
  }, []);

  // Monitor audio input level
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current || !monitoringRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      if (!monitoringRef.current) return;

      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalizedLevel = average / 255;

      setState((prev) => ({ ...prev, audioLevel: normalizedLevel }));
      animationRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!streamRef.current) {
      const initialized = await initialize();
      if (!initialized) return;
    }

    if (!streamRef.current) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.start();

    // Use AudioContext.currentTime for sample-accurate recording timing
    if (audioContextRef.current) {
      audioContextStartTimeRef.current = audioContextRef.current.currentTime;
    }
    startTimeRef.current = Date.now(); // Keep for fallback display only

    setState((prev) => ({
      ...prev,
      isRecording: true,
      isPaused: false,
      duration: 0,
    }));

    // Update duration using AudioContext time for accuracy
    const updateDuration = () => {
      if (state.isRecording && !state.isPaused && audioContextRef.current) {
        const audioContextDuration = audioContextRef.current.currentTime - audioContextStartTimeRef.current;
        setState((prev) => ({
          ...prev,
          duration: Math.floor(audioContextDuration),
        }));
        requestAnimationFrame(updateDuration);
      }
    };
    updateDuration();
  }, [initialize, state.isRecording, state.isPaused]);

  // Stop recording
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        resolve(blob);
      };

      mediaRecorderRef.current.stop();

      setState((prev) => ({
        ...prev,
        isRecording: false,
        isPaused: false,
      }));
    });
  }, []);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.pause();
      setState((prev) => ({ ...prev, isPaused: true }));
    }
  }, [state.isRecording]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isPaused) {
      mediaRecorderRef.current.resume();
      setState((prev) => ({ ...prev, isPaused: false }));
    }
  }, [state.isPaused]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  }, []);

  // Change device
  const changeDevice = useCallback(
    async (deviceId: string) => {
      setSelectedDeviceId(deviceId);
      const wasMonitoring = monitoringRef.current;

      if (wasMonitoring) {
        stopMonitoring();
      }

      await initialize(deviceId);

      if (wasMonitoring) {
        startMonitoring();
      }
    },
    [initialize, startMonitoring, stopMonitoring]
  );

  return {
    state,
    selectedDeviceId,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    initialize,
    startMonitoring,
    stopMonitoring,
    changeDevice,
    cleanup,
  };
}
