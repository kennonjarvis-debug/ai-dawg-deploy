/**
 * AudioCapture Component
 *
 * Captures microphone audio during recording and streams it to the backend
 * for real-time AI analysis via WebSocket.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '../../utils/logger';

export interface AudioCaptureProps {
  isRecording: boolean;
  onPitchAnalysis?: (analysis: PitchAnalysisResult) => void;
  onError?: (error: Error) => void;
  vocalCoachEnabled?: boolean;
}

export interface PitchAnalysisResult {
  detectedPitch: number;
  pitchConfidence: number;
  noteName: string;
  centsOffset: number;
  correctionSuggestion: string;
  stability: number;
  vibratoDetected: boolean;
  vibratoRate?: number;
}

export const AudioCapture: React.FC<AudioCaptureProps> = ({
  isRecording,
  onPitchAnalysis,
  onError,
  vocalCoachEnabled = true,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string>(`session-${Date.now()}`);

  /**
   * Initialize audio capture and WebSocket connection
   */
  const initializeAudioCapture = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      mediaStreamRef.current = stream;

      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 44100,
      });
      audioContextRef.current = audioContext;

      // Create audio source from microphone
      const source = audioContext.createMediaStreamSource(stream);

      // Create script processor for audio processing
      const bufferSize = 4096;
      const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      processorNodeRef.current = processor;

      // Connect WebSocket for streaming
      if (vocalCoachEnabled) {
        connectWebSocket();
      }

      // Process audio data
      processor.onaudioprocess = (event) => {
        if (!isRecording || !vocalCoachEnabled) return;

        const inputData = event.inputBuffer.getChannelData(0);

        // Stream to backend via WebSocket
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          const buffer = new Float32Array(inputData);
          websocketRef.current.send(buffer.buffer);
        }
      };

      // Connect audio nodes
      source.connect(processor);
      processor.connect(audioContext.destination);

      logger.info('Audio capture initialized', {
        sessionId: sessionIdRef.current,
        sampleRate: audioContext.sampleRate,
      });
    } catch (error) {
      logger.error('Failed to initialize audio capture', { error });
      onError?.(error as Error);
    }
  }, [isRecording, onError, vocalCoachEnabled]);

  /**
   * Connect WebSocket for real-time audio streaming
   */
  const connectWebSocket = useCallback(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/api/v1/audio-stream?sessionId=${sessionIdRef.current}`;

    const ws = new WebSocket(wsUrl);
    websocketRef.current = ws;

    ws.onopen = () => {
      logger.info('WebSocket connected for audio streaming', {
        sessionId: sessionIdRef.current,
      });
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'pitch_analysis' && onPitchAnalysis) {
          onPitchAnalysis(message.data);
        }
      } catch (error) {
        logger.error('Error parsing WebSocket message', { error });
      }
    };

    ws.onerror = (error) => {
      logger.error('WebSocket error', { error });
      onError?.(new Error('WebSocket connection failed'));
    };

    ws.onclose = () => {
      logger.info('WebSocket disconnected');
      setIsConnected(false);
    };
  }, [onPitchAnalysis, onError]);

  /**
   * Stop audio capture and cleanup resources
   */
  const stopAudioCapture = useCallback(() => {
    // Stop processor
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Close WebSocket
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }

    setIsConnected(false);
    logger.info('Audio capture stopped', { sessionId: sessionIdRef.current });
  }, []);

  // Initialize when recording starts
  useEffect(() => {
    if (isRecording && vocalCoachEnabled) {
      initializeAudioCapture();
    } else {
      stopAudioCapture();
    }

    return () => {
      stopAudioCapture();
    };
  }, [isRecording, vocalCoachEnabled, initializeAudioCapture, stopAudioCapture]);

  // This component doesn't render anything visible
  // It's a background service that handles audio capture
  return (
    <div
      style={{ display: 'none' }}
      data-audio-capture-active={isRecording}
      data-websocket-connected={isConnected}
    />
  );
};

export default AudioCapture;
