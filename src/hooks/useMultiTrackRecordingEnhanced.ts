/**
 * Enhanced Multi-Track Recording Hook with Dual Audio Streaming
 *
 * Features:
 * - Background track playback during recording
 * - Dual audio streaming (vocals + backing)
 * - Real-time vocal analysis integration
 * - Audio separation integration
 * - WebSocket streaming to AI
 * - Cost-optimized processing
 */

import { useEffect, useRef, useCallback } from 'react';
import { useTransportStore } from '../stores/transportStore';
import { useTimelineStore } from '../stores/timelineStore';
import { getAudioEngine } from '../audio/AudioEngine';
import { getRoutingEngine } from '../audio/routing';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';

export interface DualAudioStreamOptions {
  enableVocalAnalysis: boolean;
  enableAudioSeparation: boolean;
  enableAIRecommendations: boolean;
  streamToAI: boolean;
  expectedKey?: string;
  expectedBPM?: number;
  separationMethod?: 'spectral' | 'gate' | 'highpass' | 'hybrid';
}

export const useMultiTrackRecordingEnhanced = (
  options: DualAudioStreamOptions = {
    enableVocalAnalysis: true,
    enableAudioSeparation: true,
    enableAIRecommendations: true,
    streamToAI: true,
    expectedKey: 'C',
    expectedBPM: 120,
    separationMethod: 'hybrid',
  }
) => {
  const { isRecording, isPlaying, currentTime, setCurrentTime } = useTransportStore();
  const { tracks, updateTrack, addClip } = useTimelineStore();

  // Recording state refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const mediaRecordersRef = useRef<Map<string, MediaRecorder>>(new Map());
  const audioChunksRef = useRef<Map<string, Blob[]>>(new Map());
  const analyserNodesRef = useRef<Map<string, AnalyserNode>>(new Map());
  const monitoringGainNodesRef = useRef<Map<string, GainNode>>(new Map());
  const animationFramesRef = useRef<Map<string, number>>(new Map());
  const recordingStartTimeRef = useRef<number>(0);
  const playbackNodesRef = useRef<Map<string, AudioBufferSourceNode[]>>(new Map());

  // Dual audio streaming refs
  const websocketRef = useRef<Socket | null>(null);
  const backingTrackStreamRef = useRef<MediaStream | null>(null);
  const vocalStreamRef = useRef<MediaStream | null>(null);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection for real-time analysis
  useEffect(() => {
    if (!options.streamToAI) return;

    const socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
    });

    websocketRef.current = socket;

    socket.on('connect', () => {
      console.log('[DualAudioStream] WebSocket connected');
    });

    socket.on('vocal-quality-feedback', (data) => {
      console.log('[DualAudioStream] Vocal quality feedback:', data);
      if (data.recommendation) {
        toast.info(`AI: ${data.recommendation}`, { duration: 5000 });
      }
    });

    socket.on('disconnect', () => {
      console.log('[DualAudioStream] WebSocket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [options.streamToAI]);

  /**
   * Create backing track audio stream from non-armed tracks
   */
  const createBackingTrackStream = useCallback(async (): Promise<MediaStream | null> => {
    if (!audioContextRef.current) return null;

    try {
      const audioContext = audioContextRef.current;

      // Create destination for backing track
      const destination = audioContext.createMediaStreamDestination();

      // Get non-armed tracks with clips
      const backingTracks = tracks.filter(track => !track.isArmed && track.clips.length > 0);

      if (backingTracks.length === 0) {
        console.log('[DualAudioStream] No backing tracks found');
        return null;
      }

      // Mix backing tracks
      for (const track of backingTracks) {
        // Check solo/mute state
        const soloedTracks = tracks.filter(t => t.isSolo);
        const hasSoloedTracks = soloedTracks.length > 0;
        const shouldPlay = hasSoloedTracks ? track.isSolo : !track.isMuted;

        if (!shouldPlay) continue;

        for (const clip of track.clips) {
          if (!clip.audioBuffer) continue;

          // Check if clip should be playing at current time
          const clipEnd = clip.startTime + clip.duration;
          if (currentTime >= clip.startTime && currentTime < clipEnd) {
            const source = audioContext.createBufferSource();
            source.buffer = clip.audioBuffer;

            // Apply track volume and pan
            const gainNode = audioContext.createGain();
            gainNode.gain.value = track.volume;

            const panNode = audioContext.createStereoPanner?.();
            if (panNode) {
              panNode.pan.value = track.pan;
              source.connect(gainNode).connect(panNode).connect(destination);
            } else {
              source.connect(gainNode).connect(destination);
            }

            // Start playback from current position
            const offset = currentTime - clip.startTime;
            source.start(0, offset);

            // Store for cleanup
            const nodes = playbackNodesRef.current.get(track.id) || [];
            nodes.push(source);
            playbackNodesRef.current.set(track.id, nodes);
          }
        }
      }

      backingTrackStreamRef.current = destination.stream;
      console.log('[DualAudioStream] Backing track stream created');
      return destination.stream;
    } catch (error) {
      console.error('[DualAudioStream] Failed to create backing track stream:', error);
      return null;
    }
  }, [tracks, currentTime]);

  /**
   * Start dual audio streaming (vocals + backing)
   */
  const startDualAudioStreaming = useCallback(async (vocalStream: MediaStream, backingStream: MediaStream | null) => {
    if (!websocketRef.current || !audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    vocalStreamRef.current = vocalStream;

    // Create analysers for both streams
    const vocalSource = audioContext.createMediaStreamSource(vocalStream);
    const vocalAnalyser = audioContext.createAnalyser();
    vocalAnalyser.fftSize = 2048;
    vocalSource.connect(vocalAnalyser);

    let backingAnalyser: AnalyserNode | null = null;
    if (backingStream) {
      const backingSource = audioContext.createMediaStreamSource(backingStream);
      backingAnalyser = audioContext.createAnalyser();
      backingAnalyser.fftSize = 2048;
      backingSource.connect(backingAnalyser);
    }

    const vocalBuffer = new Float32Array(vocalAnalyser.fftSize);
    const backingBuffer = backingAnalyser ? new Float32Array(backingAnalyser.fftSize) : null;

    // Stream dual audio every 100ms (optimized for cost)
    streamIntervalRef.current = setInterval(() => {
      vocalAnalyser.getFloatTimeDomainData(vocalBuffer);

      if (backingAnalyser && backingBuffer) {
        backingAnalyser.getFloatTimeDomainData(backingBuffer);
      }

      // Send to WebSocket
      websocketRef.current?.emit('dual-audio-stream', {
        vocals: floatArrayToBase64(vocalBuffer),
        backing: backingBuffer ? floatArrayToBase64(backingBuffer) : null,
        timestamp: Date.now(),
        expectedKey: options.expectedKey,
        expectedBPM: options.expectedBPM,
        enableSeparation: options.enableAudioSeparation,
        separationMethod: options.separationMethod,
      });
    }, 100);

    console.log('[DualAudioStream] Dual audio streaming started');
  }, [options]);

  /**
   * Stop dual audio streaming
   */
  const stopDualAudioStreaming = useCallback(() => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }

    if (vocalStreamRef.current) {
      vocalStreamRef.current.getTracks().forEach(track => track.stop());
      vocalStreamRef.current = null;
    }

    if (backingTrackStreamRef.current) {
      backingTrackStreamRef.current.getTracks().forEach(track => track.stop());
      backingTrackStreamRef.current = null;
    }

    console.log('[DualAudioStream] Dual audio streaming stopped');
  }, []);

  /**
   * Start recording on all armed tracks with dual audio streaming
   */
  const startRecording = useCallback(async () => {
    try {
      console.log('[MultiTrackRecordingEnhanced] Starting recording...');

      // Get or create audio context
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const audioContext = audioContextRef.current;
      recordingStartTimeRef.current = currentTime;

      // Get all armed tracks
      const armedTracks = tracks.filter(track => track.isArmed && track.trackType !== 'aux');

      if (armedTracks.length === 0) {
        toast.warning('No tracks armed for recording. Please arm a track first.');
        return;
      }

      console.log(`[MultiTrackRecordingEnhanced] Recording ${armedTracks.length} armed track(s)`);

      // Create backing track stream
      const backingStream = await createBackingTrackStream();

      // Start recording on each armed track
      for (const track of armedTracks) {
        try {
          // Request microphone access
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: track.channels === 'stereo' ? 2 : 1,
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
              sampleRate: 44100,
            },
          });

          mediaStreamsRef.current.set(track.id, stream);

          // Start dual audio streaming (first armed track only to save costs)
          if (options.streamToAI && armedTracks.indexOf(track) === 0) {
            await startDualAudioStreaming(stream, backingStream);
          }

          // Create media recorder for this track
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus',
          });

          audioChunksRef.current.set(track.id, []);

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              const chunks = audioChunksRef.current.get(track.id) || [];
              chunks.push(event.data);
              audioChunksRef.current.set(track.id, chunks);
            }
          };

          mediaRecorder.start(100);
          mediaRecordersRef.current.set(track.id, mediaRecorder);

          // Set up monitoring
          const source = audioContext.createMediaStreamSource(stream);
          const gainNode = audioContext.createGain();
          gainNode.gain.value = 1.0;
          source.connect(gainNode);
          monitoringGainNodesRef.current.set(track.id, gainNode);

          // Set up analyser for live waveform
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 2048;
          analyser.smoothingTimeConstant = 0.8;
          gainNode.connect(analyser);
          analyserNodesRef.current.set(track.id, analyser);

          // Route through plugins for monitoring
          const routingEngine = getRoutingEngine();
          if (routingEngine) {
            try {
              routingEngine.connectInputMonitoring(gainNode, track.id, audioContext.destination);
            } catch (error) {
              console.warn('[MultiTrackRecordingEnhanced] Routing failed, using direct monitoring:', error);
              gainNode.connect(audioContext.destination);
            }
          } else {
            gainNode.connect(audioContext.destination);
          }

          // Update track state
          updateTrack(track.id, {
            isRecording: true,
            liveRecordingStartTime: currentTime,
            liveRecordingDuration: 0,
            liveWaveformData: new Float32Array(analyser.frequencyBinCount),
          });

          console.log(`[MultiTrackRecordingEnhanced] Started recording on track: ${track.name}`);
        } catch (error) {
          console.error(`[MultiTrackRecordingEnhanced] Failed to start recording on track ${track.name}:`, error);
          toast.error(`Failed to record on track "${track.name}"`);
        }
      }

      toast.success(`Recording ${armedTracks.length} track${armedTracks.length > 1 ? 's' : ''} with AI analysis!`);
    } catch (error) {
      console.error('[MultiTrackRecordingEnhanced] Failed to start recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  }, [tracks, currentTime, options, updateTrack, createBackingTrackStream, startDualAudioStreaming]);

  /**
   * Stop recording and create clips
   */
  const stopRecording = useCallback(async () => {
    try {
      console.log('[MultiTrackRecordingEnhanced] Stopping recording...');

      // Stop dual audio streaming
      stopDualAudioStreaming();

      const recordingDuration = currentTime - recordingStartTimeRef.current;

      // Stop all media recorders
      for (const [trackId, mediaRecorder] of mediaRecordersRef.current.entries()) {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();

          await new Promise<void>(resolve => {
            mediaRecorder.onstop = async () => {
              try {
                const chunks = audioChunksRef.current.get(trackId) || [];
                if (chunks.length === 0) {
                  resolve();
                  return;
                }

                const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                const audioEngine = getAudioEngine();
                const audioContext = await audioEngine.getOrCreateAudioContext();
                const arrayBuffer = await audioBlob.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                const waveformData = audioEngine.getWaveformData(audioBuffer, 1000);
                const wavBlob = audioEngine.exportAsWAV(audioBuffer);
                const audioUrl = URL.createObjectURL(wavBlob);

                const track = tracks.find(t => t.id === trackId);
                if (!track) {
                  resolve();
                  return;
                }

                const clipName = `${track.name} - ${new Date().toLocaleTimeString()}`;
                addClip(trackId, {
                  name: clipName,
                  startTime: recordingStartTimeRef.current,
                  duration: recordingDuration,
                  audioBuffer,
                  waveformData,
                  audioUrl,
                  color: track.color,
                });

                console.log(`[MultiTrackRecordingEnhanced] Created clip for track: ${track.name}`);
                toast.success(`Recorded: ${clipName}`);
              } catch (error) {
                console.error(`[MultiTrackRecordingEnhanced] Failed to process recording:`, error);
                toast.error('Failed to process recording');
              }
              resolve();
            };
          });
        }
      }

      // Clean up
      cleanup();

      // Update tracks
      tracks.filter(t => t.isRecording).forEach(track => {
        updateTrack(track.id, {
          isRecording: false,
          liveWaveformData: undefined,
          liveRecordingStartTime: undefined,
          liveRecordingDuration: undefined,
        });
      });

      toast.success('Recording stopped');
    } catch (error) {
      console.error('[MultiTrackRecordingEnhanced] Failed to stop recording:', error);
      toast.error('Failed to stop recording');
    }
  }, [tracks, currentTime, updateTrack, addClip, stopDualAudioStreaming]);

  /**
   * Clean up resources
   */
  const cleanup = useCallback(() => {
    // Stop animations
    for (const frameId of animationFramesRef.current.values()) {
      cancelAnimationFrame(frameId);
    }
    animationFramesRef.current.clear();

    // Stop streams
    for (const stream of mediaStreamsRef.current.values()) {
      stream.getTracks().forEach(track => track.stop());
    }
    mediaStreamsRef.current.clear();

    mediaRecordersRef.current.clear();
    audioChunksRef.current.clear();

    for (const analyser of analyserNodesRef.current.values()) {
      analyser.disconnect();
    }
    analyserNodesRef.current.clear();

    // Stop playback
    for (const nodes of playbackNodesRef.current.values()) {
      nodes.forEach(node => {
        try {
          node.stop();
          node.disconnect();
        } catch (error) {
          // Already stopped
        }
      });
    }
    playbackNodesRef.current.clear();

    console.log('[MultiTrackRecordingEnhanced] Cleaned up resources');
  }, []);

  /**
   * React to recording state changes
   */
  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else {
      if (mediaRecordersRef.current.size > 0) {
        stopRecording();
      }
    }

    return () => {
      cleanup();
    };
  }, [isRecording]);

  return {
    isRecordingActive: mediaRecordersRef.current.size > 0,
    recordingTrackCount: mediaRecordersRef.current.size,
    isDualStreamActive: streamIntervalRef.current !== null,
  };
};

// Helper function
function floatArrayToBase64(array: Float32Array): string {
  const int16 = new Int16Array(array.length);
  for (let i = 0; i < array.length; i++) {
    const s = Math.max(-1, Math.min(1, array[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
