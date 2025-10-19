/**
 * WebSocket Event Handlers for Real-Time Vocal Analysis
 *
 * Handles:
 * - live-pitch-data: Real-time pitch info
 * - live-rhythm-data: Beat sync and timing accuracy
 * - vocal-quality-feedback: AI suggestions during recording
 * - backing-track-sync: Tempo/key sync status
 * - dual-audio-stream: Vocals + backing track streaming
 * - separated-vocals: Separated vocal stream to AI
 */

import { Socket } from 'socket.io';
import { liveVocalAnalysisService } from '../../backend/services/live-vocal-analysis-service';
import { audioSeparationService } from '../../backend/services/audio-separation-service';

interface DualAudioStreamData {
  vocals: string; // base64
  backing: string | null; // base64
  timestamp: number;
  expectedKey?: string;
  expectedBPM?: number;
  enableSeparation: boolean;
  separationMethod?: 'spectral' | 'gate' | 'highpass' | 'hybrid';
}

interface StreamAnalysisOptions {
  trackId: string;
  projectId: string;
  expectedKey?: string;
  expectedBPM?: number;
}

/**
 * Register vocal analysis WebSocket event handlers
 */
export function registerVocalAnalysisHandlers(socket: Socket) {
  console.log('[VocalAnalysisHandlers] Registering handlers for socket:', socket.id);

  /**
   * Start real-time vocal analysis stream
   */
  socket.on('start-vocal-analysis', async (data: StreamAnalysisOptions) => {
    console.log('[VocalAnalysisHandlers] Starting vocal analysis:', data);

    try {
      // Analysis will be driven by dual-audio-stream events
      socket.emit('vocal-analysis-started', {
        trackId: data.trackId,
        projectId: data.projectId,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('[VocalAnalysisHandlers] Failed to start vocal analysis:', error);
      socket.emit('error', {
        message: 'Failed to start vocal analysis',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Stop vocal analysis stream
   */
  socket.on('stop-vocal-analysis', (data: { trackId: string; projectId: string }) => {
    console.log('[VocalAnalysisHandlers] Stopping vocal analysis:', data);

    socket.emit('vocal-analysis-stopped', {
      trackId: data.trackId,
      projectId: data.projectId,
      timestamp: Date.now(),
    });
  });

  /**
   * Handle dual audio stream (vocals + backing)
   */
  socket.on('dual-audio-stream', async (data: DualAudioStreamData) => {
    try {
      // Decode base64 audio
      const vocalsArray = base64ToFloat32Array(data.vocals);
      const backingArray = data.backing ? base64ToFloat32Array(data.backing) : null;

      // Perform pitch detection
      const pitchData = liveVocalAnalysisService.detectPitch(vocalsArray);

      // Perform rhythm detection
      const rhythmData = liveVocalAnalysisService.detectRhythm(
        vocalsArray,
        data.expectedBPM || 120
      );

      // Detect vibrato
      const vibratoData = liveVocalAnalysisService.detectVibrato();

      // Analyze vocal quality
      const qualityData = liveVocalAnalysisService.analyzeVocalQuality(pitchData, rhythmData);

      // Emit live pitch data
      socket.emit('live-pitch-data', {
        timestamp: data.timestamp,
        ...pitchData,
      });

      // Emit rhythm data
      socket.emit('live-rhythm-data', {
        timestamp: data.timestamp,
        ...rhythmData,
      });

      // Emit vocal quality feedback if there's a recommendation
      if (qualityData.recommendation) {
        socket.emit('vocal-quality-feedback', {
          timestamp: data.timestamp,
          ...qualityData,
          vibrato: vibratoData,
        });
      }

      // Audio separation if enabled
      if (data.enableSeparation && backingArray) {
        const separatedVocals = await audioSeparationService.separateVocals(
          vocalsArray,
          backingArray,
          {
            method: data.separationMethod || 'hybrid',
            threshold: 0.1,
            highpassCutoff: 80,
            lowpassCutoff: 15000,
            noiseReduction: 0.5,
          }
        );

        // Emit separated vocals for AI processing
        socket.emit('separated-vocals', {
          timestamp: data.timestamp,
          audio: floatArrayToBase64(separatedVocals),
        });

        // Send to AI brain for recommendations
        await sendToAIBrain(socket, {
          separatedVocals,
          pitchData,
          rhythmData,
          vibratoData,
          qualityData,
          expectedKey: data.expectedKey,
          expectedBPM: data.expectedBPM,
        });
      }

      // Emit backing track sync status
      if (data.backing) {
        socket.emit('backing-track-sync', {
          timestamp: data.timestamp,
          tempo: data.expectedBPM || 120,
          key: data.expectedKey || 'C',
          inSync: rhythmData.timingAccuracy > 0.8,
        });
      }
    } catch (error) {
      console.error('[VocalAnalysisHandlers] Error processing dual audio stream:', error);
      socket.emit('error', {
        message: 'Failed to process audio stream',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Handle separated vocals stream (client-side separation)
   */
  socket.on('separated-vocals', async (data: { audio: string; timestamp: number }) => {
    try {
      const vocalsArray = base64ToFloat32Array(data.audio);

      // Perform analysis on separated vocals
      const pitchData = liveVocalAnalysisService.detectPitch(vocalsArray);
      const rhythmData = liveVocalAnalysisService.detectRhythm(vocalsArray, 120);
      const vibratoData = liveVocalAnalysisService.detectVibrato();
      const qualityData = liveVocalAnalysisService.analyzeVocalQuality(pitchData, rhythmData);

      // Send to AI brain
      await sendToAIBrain(socket, {
        separatedVocals: vocalsArray,
        pitchData,
        rhythmData,
        vibratoData,
        qualityData,
      });
    } catch (error) {
      console.error('[VocalAnalysisHandlers] Error processing separated vocals:', error);
    }
  });

  /**
   * Set reference key for pitch analysis
   */
  socket.on('set-reference-key', (data: { key: string; scale?: 'major' | 'minor' }) => {
    try {
      liveVocalAnalysisService.setReferenceKey(data.key, data.scale || 'major');
      socket.emit('reference-key-updated', {
        key: data.key,
        scale: data.scale || 'major',
      });
    } catch (error) {
      console.error('[VocalAnalysisHandlers] Error setting reference key:', error);
    }
  });

  /**
   * Build noise profile for audio separation
   */
  socket.on('build-noise-profile', (data: { audio: string }) => {
    try {
      const audioArray = base64ToFloat32Array(data.audio);
      audioSeparationService.buildNoiseProfile(audioArray);
      socket.emit('noise-profile-built', { timestamp: Date.now() });
    } catch (error) {
      console.error('[VocalAnalysisHandlers] Error building noise profile:', error);
    }
  });

  console.log('[VocalAnalysisHandlers] All handlers registered');
}

/**
 * Send analysis results to AI brain for intelligent recommendations
 */
async function sendToAIBrain(
  socket: Socket,
  data: {
    separatedVocals: Float32Array;
    pitchData: any;
    rhythmData: any;
    vibratoData: any;
    qualityData: any;
    expectedKey?: string;
    expectedBPM?: number;
  }
) {
  try {
    const AI_BRAIN_URL = process.env.AI_BRAIN_URL || 'http://localhost:8002';

    // Prepare analysis summary
    const analysis = {
      pitch: {
        note: data.pitchData.note,
        octave: data.pitchData.octave,
        cents: data.pitchData.cents,
        isInTune: data.pitchData.isInTune,
        isSharp: data.pitchData.isSharp,
        isFlat: data.pitchData.isFlat,
      },
      rhythm: {
        timingAccuracy: data.rhythmData.timingAccuracy,
        onsetDetected: data.rhythmData.onsetDetected,
        energy: data.rhythmData.energy,
      },
      vibrato: {
        detected: data.vibratoData.detected,
        rate: data.vibratoData.rate,
        depth: data.vibratoData.depth,
      },
      quality: {
        pitchStability: data.qualityData.pitchStability,
        volumeConsistency: data.qualityData.volumeConsistency,
        breathSupport: data.qualityData.breathSupport,
      },
      context: {
        expectedKey: data.expectedKey,
        expectedBPM: data.expectedBPM,
      },
    };

    // Send to AI brain (batch every 5 seconds to save costs)
    const response = await fetch(`${AI_BRAIN_URL}/api/vocal-analysis/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis }),
    });

    if (response.ok) {
      const recommendations = await response.json();

      // Emit AI recommendations to client
      socket.emit('ai-vocal-recommendations', {
        timestamp: Date.now(),
        recommendations: recommendations.suggestions || [],
        confidence: recommendations.confidence || 0,
      });
    }
  } catch (error) {
    console.error('[VocalAnalysisHandlers] Failed to send to AI brain:', error);
    // Continue silently - AI recommendations are optional
  }
}

/**
 * Helper: Convert base64 to Float32Array
 */
function base64ToFloat32Array(base64: string): Float32Array {
  try {
    const binary = Buffer.from(base64, 'base64');
    const int16Array = new Int16Array(binary.buffer, binary.byteOffset, binary.length / 2);

    // Convert Int16 to Float32
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7fff);
    }

    return float32Array;
  } catch (error) {
    console.error('[VocalAnalysisHandlers] Failed to decode base64 audio:', error);
    throw error;
  }
}

/**
 * Helper: Convert Float32Array to base64
 */
function floatArrayToBase64(array: Float32Array): string {
  const int16 = new Int16Array(array.length);
  for (let i = 0; i < array.length; i++) {
    const s = Math.max(-1, Math.min(1, array[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  return Buffer.from(bytes).toString('base64');
}
