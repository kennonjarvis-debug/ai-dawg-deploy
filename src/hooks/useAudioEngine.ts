/**
 * React hook for audio engine integration
 */

import { useEffect, useRef, useState } from 'react';
import { getAudioEngine, initializeAudioEngine, AudioEngine } from '../audio/AudioEngine';
import { getPlaybackEngine, PlaybackEngine } from '../audio/PlaybackEngine';
import { getMetronomeEngine, MetronomeEngine } from '../audio/MetronomeEngine';
import { initializeRoutingEngine, getRoutingEngine, RoutingEngine } from '../audio/routing';
import { useTransportStore } from '../stores/transportStore';
import { useTimelineStore } from '../stores/timelineStore';
import { toast } from 'sonner';

export const useAudioEngine = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [microphoneActive, setMicrophoneActive] = useState(false);
  const engineRef = useRef<AudioEngine | null>(null);
  const playbackRef = useRef<PlaybackEngine | null>(null);
  const metronomeRef = useRef<MetronomeEngine | null>(null);
  const routingRef = useRef<RoutingEngine | null>(null);
  const recordingTrackRef = useRef<string | null>(null);
  const recordingTracksRef = useRef<string[]>([]);
  const punchCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isRecording,
    isPlaying,
    currentTime,
    bpm,
    timeSignature,
    masterVolume,
    punchMode,
    punchInTime,
    punchOutTime,
    metronomeEnabled,
    metronomeVolume,
    countIn,
    setCurrentTime,
    stop: stopTransport,
  } = useTransportStore();

  const { tracks, addClip, updateTrack } = useTimelineStore();

  // Sync timeline tracks with routing engine tracks
  useEffect(() => {
    if (!routingRef.current || !isInitialized) return;

    const routing = routingRef.current;

    // Create routing engine tracks for any timeline tracks that don't have channel strips yet
    tracks.forEach((track) => {
      // Check if this track already exists in routing engine
      const existingTrack = routing.getTrack(track.id);

      if (!existingTrack) {
        // Create new routing engine track with full channel strip
        const routingTrack = routing.createTrack(track.id, track.name, track.color);

        // Sync channel strip back to timeline store
        updateTrack(track.id, {
          channelStrip: routingTrack.channelStrip,
        });

        console.log(`[useAudioEngine] Created routing track for: ${track.name}`);
      }
    });
  }, [tracks, isInitialized, updateTrack]);

  // Helper to ensure AudioContext is created and engines are initialized
  const ensureAudioContextInitialized = async () => {
    if (!engineRef.current) return false;

    // Ensure AudioContext is created (requires user gesture)
    const audioContext = (engineRef.current as any).audioContext;

    if (!audioContext) {
      // Create AudioContext via ensureAudioContext (this requires a user gesture)
      await (engineRef.current as any).ensureAudioContext();
      const newAudioContext = (engineRef.current as any).audioContext;

      if (!newAudioContext) {
        console.error('[useAudioEngine] Failed to create AudioContext');
        return false;
      }

      // Initialize engines with the new AudioContext
      if (playbackRef.current) {
        playbackRef.current.initialize(newAudioContext);
      }
      if (metronomeRef.current) {
        metronomeRef.current.initialize(newAudioContext);
      }
      if (!routingRef.current) {
        const routing = initializeRoutingEngine(newAudioContext);
        routingRef.current = routing;

        // Wire routing engine to AudioEngine for plugin processing
        if (engineRef.current) {
          engineRef.current.setRoutingEngine(routing);
        }

        console.log('[useAudioEngine] Routing engine initialized and wired to AudioEngine');
      }
    }

    return true;
  };

  // Initialize audio engine (WITHOUT microphone access)
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize audio engine (AudioContext creation is deferred until user gesture)
        const engine = getAudioEngine();
        await engine.initialize();
        engineRef.current = engine;

        // Initialize playback engine without AudioContext (will be created lazily)
        const playback = getPlaybackEngine();
        playback.initialize(); // No audioContext passed - will be created on first use
        playbackRef.current = playback;

        // Initialize metronome without AudioContext (will be created lazily)
        const metronome = getMetronomeEngine();
        metronome.initialize(); // No audioContext passed - will be created on first use
        metronomeRef.current = metronome;

        // Note: Routing engine initialization is deferred until AudioContext is created
        // It will be initialized when microphone access is requested
        routingRef.current = null;

        setIsInitialized(true);

        // Set up recording completion callback
        engine.onComplete((buffer, trackId) => {
          handleRecordingComplete(buffer, trackId);
        });

        // Set up multi-track recording completion callback
        engine.onMultiTrackRecordingComplete((recordings) => {
          handleMultiTrackRecordingComplete(recordings);
        });

        // Set up level metering callback
        engine.onLevel((level) => {
          if (recordingTrackRef.current) {
            updateTrack(recordingTrackRef.current, { inputLevel: level });
          }
          // Update all armed tracks
          recordingTracksRef.current.forEach(trackId => {
            updateTrack(trackId, { inputLevel: level });
          });
        });

        // Set up live waveform callback for Pro Tools-style recording visualization
        engine.onLiveWaveform((trackId, waveformData, duration) => {
          updateTrack(trackId, {
            isRecording: true,
            liveWaveformData: waveformData,
            liveRecordingDuration: duration,
            liveRecordingStartTime: currentTime - duration,
          });
        });

        // Set up playback time update callback
        playback.setTimeUpdateCallback((time) => {
          setCurrentTime(time);
        });

        console.log('[useAudioEngine] Basic engines initialized (AudioContext deferred until user gesture)');
      } catch (error) {
        console.error('[useAudioEngine] Initialization failed:', error);
        toast.error('Failed to initialize audio engine');
        setIsInitialized(false);
      }
    };

    init();

    // Cleanup on unmount
    return () => {
      // Stop microphone if active
      if (microphoneActive && engineRef.current) {
        const mediaStream = (engineRef.current as any).mediaStream;
        if (mediaStream) {
          mediaStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
          console.log('🔇 [useAudioEngine] Microphone stopped on cleanup');
        }
      }

      if (engineRef.current) {
        engineRef.current.dispose();
      }
      if (playbackRef.current) {
        playbackRef.current.dispose();
      }
      if (metronomeRef.current) {
        metronomeRef.current.dispose();
      }
      if (routingRef.current) {
        routingRef.current.dispose();
      }
      if (punchCheckIntervalRef.current) {
        clearInterval(punchCheckIntervalRef.current);
      }
    };
  }, []);

  // Request/release microphone based on armed tracks (like Pro Tools)
  useEffect(() => {
    if (!engineRef.current || !isInitialized) return;

    const armedTracks = tracks.filter(t => t.isArmed);
    const shouldHaveMic = armedTracks.length > 0;

    const manageMicrophone = async () => {
      if (shouldHaveMic && !microphoneActive) {
        // Request microphone access when tracks are armed
        try {
          // This will create AudioContext and request microphone
          await engineRef.current!.requestMicrophoneAccess();

          // Ensure all engines are initialized with the AudioContext
          await ensureAudioContextInitialized();

          setMicrophoneActive(true);
          setHasPermission(true);
          console.log('🎙️ [useAudioEngine] Microphone activated (track armed)');
          toast.success('🎙️ Microphone ready');
        } catch (error) {
          console.error('[useAudioEngine] Microphone access denied:', error);
          toast.error('Microphone access denied');
          setHasPermission(false);
          // Disarm all tracks since we can't record
          armedTracks.forEach(track => {
            updateTrack(track.id, { isArmed: false });
          });
        }
      } else if (!shouldHaveMic && microphoneActive) {
        // Release microphone when no tracks are armed
        const mediaStream = (engineRef.current as any).mediaStream;
        if (mediaStream) {
          mediaStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
          (engineRef.current as any).mediaStream = null;
          (engineRef.current as any).sourceNode = null;
        }
        setMicrophoneActive(false);
        setHasPermission(false);
        console.log('🔇 [useAudioEngine] Microphone released (no armed tracks)');
      }
    };

    manageMicrophone();
  }, [tracks, isInitialized, microphoneActive]);

  // Handle playback state changes
  useEffect(() => {
    if (!playbackRef.current || !isInitialized) return;

    if (isPlaying && !isRecording) {
      startPlayback();
    } else if (!isPlaying) {
      stopPlayback();
    }
  }, [isPlaying, isRecording]);

  // Handle recording state changes
  useEffect(() => {
    if (!engineRef.current || !isInitialized) return;

    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [isRecording]);

  // Handle metronome
  useEffect(() => {
    if (!metronomeRef.current || !isInitialized) return;

    if (metronomeEnabled && (isPlaying || isRecording)) {
      metronomeRef.current.start(bpm, timeSignature.numerator, metronomeVolume);
    } else {
      metronomeRef.current.stop();
    }
  }, [metronomeEnabled, isPlaying, isRecording, bpm, timeSignature, metronomeVolume]);

  // Handle input monitoring mode changes
  useEffect(() => {
    if (!engineRef.current) return;

    // Find armed tracks and set their monitoring
    tracks.forEach(track => {
      if (track.isArmed) {
        engineRef.current!.setInputMonitoring(track.inputMonitoring, isPlaying, track.id);
      }
    });
  }, [tracks, isPlaying]);

  // Punch in/out automation
  useEffect(() => {
    if (!isRecording || !isPlaying || punchMode === 'off') return;

    // Start punch check interval
    punchCheckIntervalRef.current = setInterval(() => {
      const time = currentTime;

      // Check for punch in
      if (punchInTime !== null && time >= punchInTime && time < punchInTime + 0.1) {
        handlePunchIn();
      }

      // Check for punch out
      if (punchOutTime !== null && time >= punchOutTime && time < punchOutTime + 0.1) {
        handlePunchOut();
      }
    }, 100); // Check every 100ms

    return () => {
      if (punchCheckIntervalRef.current) {
        clearInterval(punchCheckIntervalRef.current);
      }
    };
  }, [isRecording, isPlaying, punchMode, punchInTime, punchOutTime, currentTime]);

  const startPlayback = async () => {
    if (!playbackRef.current) return;

    try {
      // Ensure AudioContext is created (requires user gesture)
      await ensureAudioContextInitialized();

      // Play count-in if enabled
      if (countIn > 0 && metronomeRef.current) {
        toast.info(`Count-in: ${countIn} bars...`);
        await metronomeRef.current.playCountIn(countIn, bpm, timeSignature.numerator, metronomeVolume);
      }

      playbackRef.current.start(tracks, currentTime, masterVolume);
      console.log('[useAudioEngine] Playback started from', currentTime.toFixed(2), 's');
    } catch (error) {
      console.error('[useAudioEngine] Failed to start playback:', error);
      toast.error('Failed to start playback');
    }
  };

  const stopPlayback = () => {
    if (!playbackRef.current) return;
    playbackRef.current.stop();
  };

  const startRecording = async () => {
    if (!engineRef.current) return;

    // Find armed tracks
    const armedTracks = tracks.filter(t => t.isArmed);

    if (armedTracks.length === 0) {
      toast.error('No tracks armed for recording!');
      stopTransport();
      return;
    }

    try {
      // Play count-in if enabled
      if (countIn > 0 && metronomeRef.current) {
        toast.info(`Count-in: ${countIn} bars...`);
        await metronomeRef.current.playCountIn(countIn, bpm, timeSignature.numerator, metronomeVolume);
      }

      // Multi-track or single track recording
      if (armedTracks.length === 1) {
        // Single track recording
        const track = armedTracks[0];
        recordingTrackRef.current = track.id;
        engineRef.current.startRecording(track.id);
        console.log('[useAudioEngine] Recording started on track:', track.name);
        toast.info(`🔴 Recording: ${track.name}`);
      } else {
        // Multi-track recording
        const trackIds = armedTracks.map(t => t.id);
        recordingTracksRef.current = trackIds;
        engineRef.current.startMultiTrackRecording(trackIds);
        console.log('[useAudioEngine] Multi-track recording started:', armedTracks.length, 'tracks');
        toast.info(`🔴 Recording ${armedTracks.length} tracks`);
      }
    } catch (error) {
      console.error('[useAudioEngine] Failed to start recording:', error);
      toast.error('Failed to start recording');
      stopTransport();
    }
  };

  const stopRecording = () => {
    if (!engineRef.current) return;

    try {
      if (recordingTracksRef.current.length > 1) {
        // Multi-track stop
        const recordings = engineRef.current.stopMultiTrackRecording();
        if (recordings) {
          console.log('[useAudioEngine] Multi-track recording stopped');
        }
        recordingTracksRef.current = [];
      } else {
        // Single track stop
        const buffer = engineRef.current.stopRecording();
        if (buffer) {
          console.log('[useAudioEngine] Recording stopped');
        }

        // Clear live waveform visualization
        if (recordingTrackRef.current) {
          updateTrack(recordingTrackRef.current, {
            isRecording: false,
            liveWaveformData: undefined,
            liveRecordingDuration: undefined,
            liveRecordingStartTime: undefined,
          });
        }

        recordingTrackRef.current = null;
      }
    } catch (error) {
      console.error('[useAudioEngine] Failed to stop recording:', error);
    }
  };

  const handlePunchIn = () => {
    if (!engineRef.current || !recordingTrackRef.current) return;

    console.log('[useAudioEngine] Punch IN at', currentTime);
    engineRef.current.punchIn(recordingTrackRef.current);
    toast.info('🔴 Punched IN');
  };

  const handlePunchOut = () => {
    if (!engineRef.current) return;

    console.log('[useAudioEngine] Punch OUT at', currentTime);
    engineRef.current.punchOut();
    toast.info('⚫ Punched OUT');
  };

  const handleRecordingComplete = (buffer: AudioBuffer, trackId: string) => {
    console.log('[useAudioEngine] Recording complete:', {
      trackId,
      duration: buffer.duration,
      sampleRate: buffer.sampleRate,
    });

    // Generate waveform data
    const waveformData = engineRef.current!.getWaveformData(buffer, 1000);

    // Export as WAV blob
    const blob = engineRef.current!.exportAsWAV(buffer);
    const audioUrl = URL.createObjectURL(blob);

    // Find the track
    const track = tracks.find(t => t.id === trackId);
    if (!track) {
      console.error('[useAudioEngine] Track not found:', trackId);
      return;
    }

    // Get recording start time from transport
    const startTime = useTransportStore.getState().currentTime - buffer.duration;

    // Create clip on timeline
    addClip(trackId, {
      name: `Recording ${new Date().toLocaleTimeString()}`,
      startTime: Math.max(0, startTime),
      duration: buffer.duration,
      color: track.color,
    });

    // Update the clip with audio data
    // Note: We need to update the clip after it's created
    setTimeout(() => {
      const clips = useTimelineStore.getState().tracks.find(t => t.id === trackId)?.clips || [];
      const newClip = clips[clips.length - 1];
      if (newClip) {
        useTimelineStore.getState().updateClip(newClip.id, {
          audioBuffer: buffer,
          waveformData,
          audioUrl,
        });
      }
    }, 100);

    toast.success('✅ Recording saved!');
    console.log('[useAudioEngine] Clip created on track:', track.name);
  };

  const handleMultiTrackRecordingComplete = (recordings: Map<string, AudioBuffer>) => {
    console.log('[useAudioEngine] Multi-track recording complete:', recordings.size, 'tracks');

    recordings.forEach((buffer, trackId) => {
      // Generate waveform data
      const waveformData = engineRef.current!.getWaveformData(buffer, 1000);

      // Export as WAV blob
      const blob = engineRef.current!.exportAsWAV(buffer);
      const audioUrl = URL.createObjectURL(blob);

      // Find the track
      const track = tracks.find(t => t.id === trackId);
      if (!track) {
        console.error('[useAudioEngine] Track not found:', trackId);
        return;
      }

      // Get recording start time from transport
      const startTime = useTransportStore.getState().currentTime - buffer.duration;

      // Create clip on timeline
      addClip(trackId, {
        name: `Recording ${new Date().toLocaleTimeString()}`,
        startTime: Math.max(0, startTime),
        duration: buffer.duration,
        color: track.color,
      });

      // Update the clip with audio data
      setTimeout(() => {
        const clips = useTimelineStore.getState().tracks.find(t => t.id === trackId)?.clips || [];
        const newClip = clips[clips.length - 1];
        if (newClip) {
          useTimelineStore.getState().updateClip(newClip.id, {
            audioBuffer: buffer,
            waveformData,
            audioUrl,
          });
        }
      }, 100);

      console.log('[useAudioEngine] Clip created on track:', track.name);
    });

    toast.success(`✅ ${recordings.size} recordings saved!`);
  };

  return {
    isInitialized,
    hasPermission,
    microphoneActive,
    engine: engineRef.current,
    playback: playbackRef.current,
    metronome: metronomeRef.current,
    routing: routingRef.current,
  };
};
