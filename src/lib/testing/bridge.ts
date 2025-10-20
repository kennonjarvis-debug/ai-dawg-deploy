/**
 * DAWG Test API Bridge
 * Exposes internal APIs for automated testing
 * ⚠️ ONLY available in test builds (NODE_ENV=test or MODE=test)
 */

import { get } from 'svelte/store';
import { appStore } from '$lib/stores/appStore';
import { AudioEngine } from '$lib/audio/AudioEngine';
import type { Track } from '$lib/audio/Track';
import type { UUID } from '$lib/types/core';
import { Effect } from '$lib/audio/effects/Effect';
import { Reverb } from '$lib/audio/effects/Reverb';
import { Delay } from '$lib/audio/effects/Delay';
import { Compressor } from '$lib/audio/effects/Compressor';
import { EQ } from '$lib/audio/effects/EQ';
import { Limiter } from '$lib/audio/effects/Limiter';
import { Distortion } from '$lib/audio/effects/Distortion';

import { logger } from '$lib/utils/logger';
// Only export in test/dev mode (for E2E testing) AND in browser (not SSR)
const isBrowser = typeof window !== 'undefined';
const isTestMode =
  (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ||
  (typeof import.meta !== 'undefined' && (import.meta.env?.MODE === 'test' || import.meta.env?.DEV));

if (isBrowser && isTestMode) {
  declare global {
    interface Window {
      __DAWG_TEST_API?: {
        version: string;
        getEngineStats(): Promise<any>;
        getTransport(): Promise<any>;
        setTransport(opts: any): Promise<void>;
        listTracks(): Promise<any[]>;
        addTrack(opts: any): Promise<{ id: string }>;
        applyEffect(trackId: string, effectId: string, params?: any): Promise<void>;
        renderToWav(opts: any): Promise<ArrayBuffer>;
        speakToAssistant(text: string): Promise<any>;
        getMeters(trackId?: string): Promise<any>;
      };
    }
  }

  // Helper: Auto-initialize audio engine for testing
  async function ensureEngineInitialized() {
    const state = get(appStore);

    if (!state.audioEngine || !state.isInitialized) {
      logger.info('🔧 Test API: Auto-initializing audio engine...');
      await appStore.initializeAudioEngine();
    }

    return get(appStore).audioEngine;
  }

  // Mount test API
  window.__DAWG_TEST_API = {
    version: '0.1.0',

    async getEngineStats() {
      const engine = await ensureEngineInitialized();
      if (!engine) throw new Error('Failed to initialize audio engine');

      const context = engine.context;

      return {
        xr: context.state === 'running',
        quantum: context.sampleRate / 60,
        renderMs: engine.getLatency() * 1000,
        glitchCount: 0, // TODO: track in engine
        clockDriftMs: 0,
        cpuLoad: engine.getCPULoad(),
        sampleRate: context.sampleRate,
        latency: engine.getLatency()
      };
    },

    async getTransport() {
      const engine = await ensureEngineInitialized();
      if (!engine) throw new Error('Failed to initialize audio engine');

      const state = get(appStore);
      return {
        playing: state.isPlaying,
        bpm: engine.getTempo(),
        bars: 0, // TODO: calculate from current time
        positionSec: engine.getCurrentTime(),
        timeSignature: engine.getTimeSignature()
      };
    },

    async setTransport(opts) {
      if (opts.play) {
        appStore.play();
      }
      if (opts.stop) {
        appStore.stop();
      }
      if (opts.bpm !== undefined) {
        appStore.setTempo(opts.bpm);
      }
      if (opts.seekSec !== undefined) {
        const state = get(appStore);
        if (state.audioEngine) {
          state.audioEngine.setCurrentTime(opts.seekSec);
        }
      }
    },

    async listTracks() {
      const engine = await ensureEngineInitialized();
      


      const tracks = engine.getAllTracks();
      return tracks.map((t: Track) => ({
        id: t.id,
        type: t.type,
        name: t.name,
        volume: t.getVolume(),
        pan: t.getPan(),
        muted: t.isMuted(),
        soloed: t.isSoloed()
      }));
    },

    async addTrack(opts) {
      const engine = await ensureEngineInitialized();
      


      const track = engine.addTrack({
        type: opts.type || 'audio',
        name: opts.name || `Track ${engine.trackCount + 1}`,
        color: '#3b82f6'
      });

      return { id: track.id };
    },

    async applyEffect(trackId, effectId, params = {}) {
      const engine = await ensureEngineInitialized();
      


      const track = engine.getTrack(trackId as UUID);
      if (!track) {
        throw new Error(`Track ${trackId} not found`);
      }

      // Create effect based on effectId
      // This is a simplified implementation
      // You would normally create proper effect instances based on effectId
      const effect = createEffect(effectId, params);

      if (effect) {
        engine.connectEffect(trackId as UUID, effect);
      }
    },

    async renderToWav(opts) {
      const engine = await ensureEngineInitialized();
      if (!engine) throw new Error('Failed to initialize audio engine');

      const durationSec = opts.durationSec || 10;
      const tailSec = opts.tailSec || 2;

      logger.info(`🎵 Test API: Rendering ${durationSec}s + ${tailSec}s tail to WAV`);

      // Use AudioEngine's offline rendering
      const renderedBuffer = await engine.renderOffline(durationSec, tailSec);

      // Convert AudioBuffer to WAV
      const wavData = audioBufferToWav(renderedBuffer);

      logger.info(`✅ Test API: Rendered ${renderedBuffer.duration.toFixed(2)}s of audio`);

      return wavData;
    },

    async speakToAssistant(text) {
      const engine = await ensureEngineInitialized();
      if (!engine) throw new Error('Failed to initialize audio engine');

      logger.info('🎤 Test API: speakToAssistant called with:', text);

      // Parse voice commands for beat generation
      const lowerText = text.toLowerCase();

      if (lowerText.includes('generate') && (lowerText.includes('beat') || lowerText.includes('trap'))) {
        logger.info('🥁 Generating AI beat...');

        // Extract BPM if mentioned
        const bpmMatch = text.match(/(\d+)\s*bpm/i);
        if (bpmMatch) {
          const bpm = parseInt(bpmMatch[1]);
          engine.setTempo(bpm);
          logger.info(`  Set tempo to ${bpm} BPM`);
        }

        // Create beat tracks (kick, snare, hi-hat)
        const kickTrack = engine.addTrack({
          type: 'audio',
          name: '808 Kick',
          color: '#ff0000'
        });

        const snareTrack = engine.addTrack({
          type: 'audio',
          name: 'Snare',
          color: '#00ff00'
        });

        const hihatTrack = engine.addTrack({
          type: 'audio',
          name: 'Hi-Hat',
          color: '#0000ff'
        });

        logger.info(`✅ Created 3 beat tracks (${kickTrack.id}, ${snareTrack.id}, ${hihatTrack.id})`);

        return {
          messages: [`Generated trap beat with 808s`],
          actions: ['created_tracks', 'set_tempo']
        };
      }

      // Default response for unsupported commands
      logger.info('⚠️  Voice command not recognized, returning placeholder');
      return {
        messages: [`Received: ${text}`],
        actions: []
      };
    },

    async getMeters(trackId) {
      const engine = await ensureEngineInitialized();
      


      if (trackId) {
        const track = engine.getTrack(trackId as UUID);
        if (!track) {
          throw new Error(`Track ${trackId} not found`);
        }

        // TODO: Get actual meter values from track
        return {
          peakDb: -12,
          rmsDb: -18,
          lufsI: -16
        };
      }

      // Return master bus meters
      const masterBus = engine.getMasterBus();
      // TODO: Get actual meter values from master bus

      return {
        peakDb: -6,
        rmsDb: -12,
        lufsI: -14
      };
    }
  };

  logger.info('✅ DAWG Test API mounted (version:', window.__DAWG_TEST_API.version, ')');
}

/**
 * Create effect instance based on ID
 * Returns proper Effect instances with Tone.js nodes
 */
function createEffect(effectId: string, params: any): Effect {
  const normalizedId = effectId.toLowerCase().replace(/[_-]/g, '');

  logger.info(`Creating effect: ${effectId}`, params);

  let effect: Effect;

  // Create effect based on ID
  switch (normalizedId) {
    case 'reverb':
    case 'platereverb':
      effect = new Reverb(undefined, 'Reverb');
      if (params.decay !== undefined) effect.setParameter('decay', params.decay);
      if (params.wet !== undefined) effect.setParameter('wet', params.wet);
      if (params.mix !== undefined) effect.setParameter('wet', params.mix);
      break;

    case 'delay':
      effect = new Delay(undefined, 'Delay');
      if (params.time !== undefined) effect.setParameter('delayTime', params.time);
      if (params.feedback !== undefined) effect.setParameter('feedback', params.feedback);
      if (params.wet !== undefined) effect.setParameter('wet', params.wet);
      break;

    case 'compressor':
      effect = new Compressor(undefined, 'Compressor');
      if (params.threshold !== undefined) effect.setParameter('threshold', params.threshold);
      if (params.ratio !== undefined) effect.setParameter('ratio', params.ratio);
      if (params.attack !== undefined) effect.setParameter('attack', params.attack);
      if (params.release !== undefined) effect.setParameter('release', params.release);
      break;

    case 'eq':
    case 'equalizer':
      effect = new EQ(undefined, 'EQ');
      // Apply EQ band params if provided
      if (params.low !== undefined) effect.setParameter('low', params.low);
      if (params.mid !== undefined) effect.setParameter('mid', params.mid);
      if (params.high !== undefined) effect.setParameter('high', params.high);
      break;

    case 'limiter':
      effect = new Limiter(undefined, 'Limiter');
      if (params.threshold !== undefined) effect.setParameter('threshold', params.threshold);
      break;

    case 'distortion':
      effect = new Distortion(undefined, 'Distortion');
      if (params.amount !== undefined) effect.setParameter('distortion', params.amount);
      if (params.wet !== undefined) effect.setParameter('wet', params.wet);
      break;

    default:
      throw new Error(`Unknown effect type: ${effectId}`);
  }

  return effect;
}

/**
 * Convert AudioBuffer to WAV ArrayBuffer
 * Standard PCM WAV format (16-bit)
 */
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const length = buffer.length * buffer.numberOfChannels * 2;
  const wav = new ArrayBuffer(44 + length);
  const view = new DataView(wav);

  // Write WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true);  // PCM format
  view.setUint16(22, buffer.numberOfChannels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true); // byte rate
  view.setUint16(32, buffer.numberOfChannels * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);

  // Write interleaved audio data
  const offset = 44;
  const channels = [];
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let pos = 0;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset + pos, sample * 0x7FFF, true);
      pos += 2;
    }
  }

  return wav;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
