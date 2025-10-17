import { useRef, useEffect, useCallback } from 'react';
import { useTrackStore } from './store';
import { useTransport } from './transport';
import { PitchCorrection, VocalDoubler, DeEsser } from '@/src/utils/vocalEffects';

interface VocalEffectsChain {
  pitchCorrection: PitchCorrection;
  doubler: VocalDoubler;
  deEsser: DeEsser;
  input: GainNode;
  output: GainNode;
}

export const usePlayback = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());
  const sourceNodesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());
  const gainNodesRef = useRef<Map<string, GainNode>>(new Map());
  const panNodesRef = useRef<Map<string, StereoPannerNode>>(new Map());
  const vocalEffectsRef = useRef<Map<string, VocalEffectsChain>>(new Map());

  const { tracks } = useTrackStore();
  const { isPlaying } = useTransport();

  // Initialize audio context
  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  // Load audio buffer from blob
  const loadAudioBuffer = useCallback(
    async (recordingId: string, blob: Blob): Promise<AudioBuffer> => {
      const audioContext = initializeAudioContext();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioBuffersRef.current.set(recordingId, audioBuffer);
      return audioBuffer;
    },
    [initializeAudioContext]
  );

  // Create vocal effects chain for a track
  const createVocalEffectsChain = useCallback(
    (trackId: string): VocalEffectsChain => {
      const audioContext = initializeAudioContext();

      // Create effect processors
      const pitchCorrection = new PitchCorrection(audioContext, { enabled: false });
      const doubler = new VocalDoubler(audioContext, { enabled: false });
      const deEsser = new DeEsser(audioContext, {
        enabled: true, // De-esser on by default (subtle)
        frequency: 6000,
        threshold: -30,
        reduction: 6,
      });

      // Create input/output nodes
      const input = audioContext.createGain();
      const output = audioContext.createGain();

      // Connect chain: input -> pitchCorrection -> doubler -> deEsser -> output
      input.connect(pitchCorrection.input);
      pitchCorrection.connect(doubler.input);
      doubler.connect(deEsser.input);
      deEsser.connect(output);

      const chain: VocalEffectsChain = {
        pitchCorrection,
        doubler,
        deEsser,
        input,
        output,
      };

      vocalEffectsRef.current.set(trackId, chain);
      return chain;
    },
    [initializeAudioContext]
  );

  // Create audio nodes for a track
  const createTrackNodes = useCallback(
    (trackId: string) => {
      const audioContext = initializeAudioContext();

      // Create gain node for volume control
      const gainNode = audioContext.createGain();
      gainNodesRef.current.set(trackId, gainNode);

      // Create vocal effects chain
      const vocalEffects = createVocalEffectsChain(trackId);

      // Create pan node for stereo panning
      const panNode = audioContext.createStereoPanner();
      panNodesRef.current.set(trackId, panNode);

      // Connect nodes: source -> gain -> vocalEffects -> pan -> destination
      gainNode.connect(vocalEffects.input);
      vocalEffects.output.connect(panNode);
      panNode.connect(audioContext.destination);

      return { gainNode, panNode, vocalEffects };
    },
    [initializeAudioContext, createVocalEffectsChain]
  );

  // Play a recording
  const playRecording = useCallback(
    async (trackId: string, recordingId: string, blob: Blob, startTime: number = 0) => {
      const audioContext = initializeAudioContext();

      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Stop any existing playback for this track
      const existingSource = sourceNodesRef.current.get(trackId);
      if (existingSource) {
        try {
          existingSource.stop();
        } catch (e) {
          // Ignore if already stopped
        }
      }

      // Load audio buffer if not already loaded
      let audioBuffer = audioBuffersRef.current.get(recordingId);
      if (!audioBuffer) {
        audioBuffer = await loadAudioBuffer(recordingId, blob);
      }

      // Create or get track nodes
      let gainNode = gainNodesRef.current.get(trackId);
      let panNode = panNodesRef.current.get(trackId);
      if (!gainNode || !panNode) {
        const nodes = createTrackNodes(trackId);
        gainNode = nodes.gainNode;
        panNode = nodes.panNode;
      }

      // Create buffer source
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNode);

      // Store source node
      sourceNodesRef.current.set(trackId, source);

      // Start playback
      source.start(0, startTime);

      return source;
    },
    [initializeAudioContext, loadAudioBuffer, createTrackNodes]
  );

  // Stop playback for a track
  const stopPlayback = useCallback((trackId: string) => {
    const source = sourceNodesRef.current.get(trackId);
    if (source) {
      try {
        source.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      sourceNodesRef.current.delete(trackId);
    }
  }, []);

  // Stop all playback
  const stopAllPlayback = useCallback(() => {
    sourceNodesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    });
    sourceNodesRef.current.clear();
  }, []);

  // Update track volume
  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    const gainNode = gainNodesRef.current.get(trackId);
    if (gainNode) {
      // Convert volume (0-100) to gain (0-1)
      gainNode.gain.value = volume / 100;
    }
  }, []);

  // Update track pan
  const setTrackPan = useCallback((trackId: string, pan: number) => {
    const panNode = panNodesRef.current.get(trackId);
    if (panNode) {
      // Pan is already -1 to 1
      panNode.pan.value = pan;
    }
  }, []);

  // Get vocal effects chain for a track
  const getVocalEffects = useCallback((trackId: string): VocalEffectsChain | null => {
    return vocalEffectsRef.current.get(trackId) || null;
  }, []);

  // Sync playback with transport state
  useEffect(() => {
    if (isPlaying) {
      // Play all active recordings
      tracks.forEach((track) => {
        if (!track.mute && track.activeRecordingId) {
          const recording = track.recordings.find((r) => r.id === track.activeRecordingId);
          if (recording && recording.blob) {
            playRecording(track.id, recording.id, recording.blob);
          }
        }
      });
    } else {
      // Stop all playback
      stopAllPlayback();
    }
  }, [isPlaying, tracks, playRecording, stopAllPlayback]);

  // Update track volumes when they change
  useEffect(() => {
    tracks.forEach((track) => {
      setTrackVolume(track.id, track.volume);
      setTrackPan(track.id, track.pan);
    });
  }, [tracks, setTrackVolume, setTrackPan]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllPlayback();

      // Cleanup vocal effects
      vocalEffectsRef.current.forEach((chain) => {
        chain.pitchCorrection.destroy();
        chain.doubler.destroy();
        chain.deEsser.destroy();
        chain.input.disconnect();
        chain.output.disconnect();
      });
      vocalEffectsRef.current.clear();

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopAllPlayback]);

  return {
    playRecording,
    stopPlayback,
    stopAllPlayback,
    setTrackVolume,
    setTrackPan,
    getVocalEffects,
    initializeAudioContext,
    audioContext: audioContextRef.current, // Export audioContext for widgets
  };
};
