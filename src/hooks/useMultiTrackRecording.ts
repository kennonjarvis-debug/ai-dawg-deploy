import { useEffect, useRef, useCallback } from 'react';
import { useTransportStore } from '../stores/transportStore';
import { useTimelineStore } from '../stores/timelineStore';
import { getAudioEngine } from '../audio/AudioEngine';
import { getRoutingEngine } from '../audio/routing';
import { toast } from 'sonner';

/**
 * Multi-track recording hook with Pro Tools-style functionality
 *
 * Features:
 * - Record on armed tracks only
 * - Playback non-armed tracks during recording
 * - Live waveform visualization per track
 * - Automatic clip creation on recording stop
 * - Multi-channel support (mono/stereo)
 */
export const useMultiTrackRecording = () => {
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

  /**
   * Start recording on all armed tracks
   */
  const startRecording = useCallback(async () => {
    try {
      console.log('[MultiTrackRecording] Starting recording...');

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

      console.log(`[MultiTrackRecording] Recording ${armedTracks.length} armed track(s)`);

      // Request microphone access ONCE for all tracks (avoid browser permission conflicts)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 2, // Always request stereo, we can downmix if needed
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,
        },
      });

      // Start recording on each armed track
      for (const track of armedTracks) {
        try {
          // Share the same stream across all tracks
          mediaStreamsRef.current.set(track.id, stream);

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

          mediaRecorder.start(100); // Collect data every 100ms
          mediaRecordersRef.current.set(track.id, mediaRecorder);

          // Set up monitoring with plugin routing
          const source = audioContext.createMediaStreamSource(stream);

          // Create gain node for input control
          const gainNode = audioContext.createGain();
          gainNode.gain.value = 1.0;
          source.connect(gainNode);
          monitoringGainNodesRef.current.set(track.id, gainNode);

          // Set up analyser for live waveform visualization
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 2048;
          analyser.smoothingTimeConstant = 0.8;
          gainNode.connect(analyser);
          analyserNodesRef.current.set(track.id, analyser);

          // Route through plugins for monitoring
          const routingEngine = getRoutingEngine();
          if (routingEngine) {
            try {
              routingEngine.connectInputMonitoring(
                gainNode,
                track.id,
                audioContext.destination
              );
              console.log(`[MultiTrackRecording] Routing input through plugins for track: ${track.name}`);
            } catch (error) {
              console.warn(`[MultiTrackRecording] Failed to route through plugins, using direct monitoring:`, error);
              // Fallback: direct connection for monitoring
              gainNode.connect(audioContext.destination);
            }
          } else {
            // No routing engine: direct connection for monitoring
            gainNode.connect(audioContext.destination);
            console.log(`[MultiTrackRecording] Direct monitoring (no routing engine) for track: ${track.name}`);
          }

          // Update track to show it's recording
          updateTrack(track.id, {
            isRecording: true,
            liveRecordingStartTime: currentTime,
            liveRecordingDuration: 0,
            liveWaveformData: new Float32Array(analyser.frequencyBinCount),
          });

          // Start waveform animation for this track
          updateLiveWaveform(track.id, analyser);

          console.log(`[MultiTrackRecording] Started recording on track: ${track.name}`);
        } catch (error) {
          console.error(`[MultiTrackRecording] Failed to start recording on track ${track.name}:`, error);
          toast.error(`Failed to record on track "${track.name}"`);
        }
      }

      // Start playback on non-armed tracks if playing
      if (isPlaying) {
        startPlaybackOnNonArmedTracks();
      }

      toast.success(`Recording ${armedTracks.length} track${armedTracks.length > 1 ? 's' : ''}!`);
    } catch (error) {
      console.error('[MultiTrackRecording] Failed to start recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  }, [tracks, currentTime, isPlaying, updateTrack]);

  /**
   * Stop recording and create clips
   */
  const stopRecording = useCallback(async () => {
    try {
      console.log('[MultiTrackRecording] Stopping recording...');

      const recordingDuration = currentTime - recordingStartTimeRef.current;

      // Stop all media recorders
      for (const [trackId, mediaRecorder] of mediaRecordersRef.current.entries()) {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();

          // Wait for final data
          await new Promise<void>(resolve => {
            mediaRecorder.onstop = async () => {
              try {
                const chunks = audioChunksRef.current.get(trackId) || [];
                if (chunks.length === 0) {
                  console.warn(`[MultiTrackRecording] No audio data for track ${trackId}`);
                  resolve();
                  return;
                }

                const audioBlob = new Blob(chunks, { type: 'audio/webm' });

                // Convert WebM to AudioBuffer
                const audioEngine = getAudioEngine();
                const audioContext = await audioEngine.getOrCreateAudioContext();
                const arrayBuffer = await audioBlob.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                // Generate waveform
                const waveformData = audioEngine.getWaveformData(audioBuffer, 1000);

                // Export as WAV for better compatibility
                const wavBlob = audioEngine.exportAsWAV(audioBuffer);
                const audioUrl = URL.createObjectURL(wavBlob);

                // Find track
                const track = tracks.find(t => t.id === trackId);
                if (!track) {
                  resolve();
                  return;
                }

                // Create clip from recording
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

                console.log(`[MultiTrackRecording] Created clip for track: ${track.name}`);
                toast.success(`Recorded: ${clipName}`);
              } catch (error) {
                console.error(`[MultiTrackRecording] Failed to process recording for track ${trackId}:`, error);
                toast.error('Failed to process recording');
              }
              resolve();
            };
          });
        }
      }

      // Clean up
      cleanup();

      // Update all previously recording tracks
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
      console.error('[MultiTrackRecording] Failed to stop recording:', error);
      toast.error('Failed to stop recording');
    }
  }, [tracks, currentTime, updateTrack, addClip]);

  /**
   * Update live waveform visualization for a track
   */
  const updateLiveWaveform = useCallback((trackId: string, analyser: AnalyserNode) => {
    const update = () => {
      const dataArray = new Float32Array(analyser.frequencyBinCount);
      analyser.getFloatTimeDomainData(dataArray);

      // Downsample to 1000 points for performance
      const downsampled = new Float32Array(1000);
      const step = dataArray.length / 1000;
      for (let i = 0; i < 1000; i++) {
        const index = Math.floor(i * step);
        downsampled[i] = Math.abs(dataArray[index]);
      }

      const track = tracks.find(t => t.id === trackId);
      if (track && track.isRecording) {
        const duration = currentTime - (track.liveRecordingStartTime || currentTime);
        updateTrack(trackId, {
          liveWaveformData: downsampled,
          liveRecordingDuration: duration,
        });
      }

      // Continue animation if still recording
      if (mediaRecordersRef.current.has(trackId)) {
        const frameId = requestAnimationFrame(() => updateLiveWaveform(trackId, analyser));
        animationFramesRef.current.set(trackId, frameId);
      }
    };

    update();
  }, [tracks, currentTime, updateTrack]);

  /**
   * Start playback on non-armed tracks during recording
   */
  const startPlaybackOnNonArmedTracks = useCallback(() => {
    if (!audioContextRef.current) return;

    const nonArmedTracks = tracks.filter(track => !track.isArmed && track.clips.length > 0);

    // Check if any tracks are soloed
    const soloedTracks = tracks.filter(t => t.isSolo);
    const hasSoloedTracks = soloedTracks.length > 0;

    for (const track of nonArmedTracks) {
      // Determine if this track should play based on solo/mute state
      const shouldPlay = hasSoloedTracks
        ? track.isSolo  // Solo mode: only play soloed tracks
        : !track.isMuted;  // Normal mode: respect mute state

      const nodes: AudioBufferSourceNode[] = [];

      for (const clip of track.clips) {
        if (!clip.audioBuffer) continue;

        // Check if clip should be playing at current time
        const clipEnd = clip.startTime + clip.duration;
        if (currentTime >= clip.startTime && currentTime < clipEnd) {
          try {
            const source = audioContextRef.current.createBufferSource();
            source.buffer = clip.audioBuffer;

            // Apply track volume and pan, respecting solo/mute state
            const gainNode = audioContextRef.current.createGain();
            gainNode.gain.value = shouldPlay ? track.volume : 0;

            const panNode = audioContextRef.current.createStereoPanner?.();
            if (panNode) {
              panNode.pan.value = track.pan;
              source.connect(gainNode).connect(panNode).connect(audioContextRef.current.destination);
            } else {
              source.connect(gainNode).connect(audioContextRef.current.destination);
            }

            // Start playback from current position within clip
            const offset = currentTime - clip.startTime;
            source.start(0, offset);

            nodes.push(source);
          } catch (error) {
            console.error(`[MultiTrackRecording] Failed to start playback for clip:`, error);
          }
        }
      }

      if (nodes.length > 0) {
        playbackNodesRef.current.set(track.id, nodes);
      }
    }
  }, [tracks, currentTime]);

  /**
   * Clean up all recording resources
   */
  const cleanup = useCallback(() => {
    // Stop and clear animation frames
    for (const [trackId, frameId] of animationFramesRef.current.entries()) {
      cancelAnimationFrame(frameId);
    }
    animationFramesRef.current.clear();

    // Stop and clear media streams
    for (const stream of mediaStreamsRef.current.values()) {
      stream.getTracks().forEach(track => track.stop());
    }
    mediaStreamsRef.current.clear();

    // Clear media recorders
    mediaRecordersRef.current.clear();

    // Clear audio chunks
    audioChunksRef.current.clear();

    // Clear analysers
    for (const analyser of analyserNodesRef.current.values()) {
      analyser.disconnect();
    }
    analyserNodesRef.current.clear();

    // Stop playback nodes
    for (const nodes of playbackNodesRef.current.values()) {
      nodes.forEach(node => {
        try {
          node.stop();
          node.disconnect();
        } catch (error) {
          // Node may already be stopped
        }
      });
    }
    playbackNodesRef.current.clear();

    console.log('[MultiTrackRecording] Cleaned up resources');
  }, []);

  /**
   * React to recording state changes
   */
  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else {
      // Only stop if we were actually recording
      if (mediaRecordersRef.current.size > 0) {
        stopRecording();
      }
    }

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [isRecording]);

  /**
   * Update playhead during playback/recording
   */
  useEffect(() => {
    if (!isRecording && !isPlaying) return;

    const intervalId = setInterval(() => {
      setCurrentTime(currentTime + 0.1);
    }, 100);

    return () => clearInterval(intervalId);
  }, [isRecording, isPlaying, currentTime, setCurrentTime]);

  return {
    isRecordingActive: mediaRecordersRef.current.size > 0,
    recordingTrackCount: mediaRecordersRef.current.size,
  };
};
