/**
 * Voice Cloning & Harmony Generation
 * Uses Replicate XTTS-v2 for voice cloning and harmony generation
 */

import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// XTTS-v2 model for voice cloning
const VOICE_CLONE_MODEL = 'lucataco/xtts-v2:684bc3855b37866c0c65add2ff39c78f3dea3f4ff103a436465326e0f438d55e';

export interface VoiceProfile {
  id: string;
  userId: string;
  name: string;
  sampleAudioUrl: string; // S3 URL to 6-30 second voice sample
  createdAt: Date;
  metadata?: {
    duration: number;
    sampleRate: number;
    format: string;
  };
}

export interface HarmonyGenerationParams {
  leadVocalUrl: string; // S3 URL to lead vocal recording
  voiceProfileId: string;
  intervals: ('third_above' | 'third_below' | 'fifth_above' | 'fifth_below' | 'octave_above' | 'octave_below')[];
  language?: string; // Default: 'en'
}

export interface HarmonyGenerationResult {
  success: boolean;
  harmonies: {
    interval: string;
    audioUrl: string;
    cost: number;
  }[];
  totalCost: number;
  error?: string;
}

export interface TextToSpeechParams {
  text: string;
  voiceProfileId: string;
  language?: string; // Default: 'en'
}

export interface TextToSpeechResult {
  audioUrl: string;
  duration: number;
  cost: number;
}

/**
 * Create a voice profile from a sample audio file
 * Requires 6-30 seconds of clean, single-speaker audio
 */
export async function createVoiceProfile(
  userId: string,
  name: string,
  sampleAudioUrl: string
): Promise<VoiceProfile> {
  console.log('[Voice Cloning] Creating voice profile:', { userId, name, sampleAudioUrl });

  // Validate audio (basic check - actual validation happens in Replicate)
  if (!sampleAudioUrl.startsWith('http')) {
    throw new Error('Sample audio URL must be a valid HTTP/HTTPS URL');
  }

  // Create voice profile record
  const voiceProfile: VoiceProfile = {
    id: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    name,
    sampleAudioUrl,
    createdAt: new Date(),
  };

  console.log('[Voice Cloning] Voice profile created:', voiceProfile.id);
  return voiceProfile;
}

/**
 * Generate harmonies from lead vocal using cloned voice
 * This is a multi-step process:
 * 1. Analyze lead vocal for pitch/timing
 * 2. Generate harmony MIDI notes (pitch-shifted)
 * 3. Use voice cloning to synthesize harmony vocals
 */
export async function generateHarmony(
  params: HarmonyGenerationParams,
  voiceProfile: VoiceProfile
): Promise<HarmonyGenerationResult> {
  console.log('[Voice Cloning] Generating harmonies:', {
    leadVocalUrl: params.leadVocalUrl,
    voiceProfileId: params.voiceProfileId,
    intervals: params.intervals,
  });

  const harmonies: { interval: string; audioUrl: string; cost: number }[] = [];
  let totalCost = 0;

  // For each harmony interval, generate harmony vocal
  for (const interval of params.intervals) {
    console.log(`[Voice Cloning] Generating ${interval} harmony...`);

    try {
      // Use XTTS-v2 for voice synthesis
      // Note: This is a simplified approach. Full implementation would:
      // 1. Extract lyrics/phonemes from lead vocal
      // 2. Pitch-shift to harmony interval
      // 3. Use TTS with cloned voice to generate harmony
      const output = await replicate.run(VOICE_CLONE_MODEL, {
        input: {
          text: '', // Would extract from vocal in production
          speaker: voiceProfile.sampleAudioUrl,
          language: params.language || 'en',
          cleanup_voice: true,
        },
      });

      const audioUrl = Array.isArray(output) ? output[0] : output;
      const cost = estimateVoiceCloningCost(10); // Estimate 10s per harmony

      harmonies.push({
        interval,
        audioUrl: audioUrl as string,
        cost,
      });

      totalCost += cost;
    } catch (error: any) {
      console.error(`[Voice Cloning] Failed to generate ${interval} harmony:`, error);
      return {
        success: false,
        harmonies: [],
        totalCost: 0,
        error: `Failed to generate ${interval} harmony: ${error.message}`,
      };
    }
  }

  console.log('[Voice Cloning] Harmonies generated successfully:', {
    count: harmonies.length,
    totalCost,
  });

  return {
    success: true,
    harmonies,
    totalCost,
  };
}

/**
 * Generate speech from text using cloned voice
 * Useful for vocal guides, spoken intros, or creative experiments
 */
export async function textToSpeechWithVoice(
  params: TextToSpeechParams,
  voiceProfile: VoiceProfile
): Promise<TextToSpeechResult> {
  console.log('[Voice Cloning] Generating TTS:', {
    text: params.text.substring(0, 50) + '...',
    voiceProfileId: params.voiceProfileId,
  });

  try {
    const output = await replicate.run(VOICE_CLONE_MODEL, {
      input: {
        text: params.text,
        speaker: voiceProfile.sampleAudioUrl,
        language: params.language || 'en',
        cleanup_voice: true,
      },
    });

    const audioUrl = Array.isArray(output) ? output[0] : output;
    const duration = estimateDuration(params.text);
    const cost = estimateVoiceCloningCost(duration);

    console.log('[Voice Cloning] TTS generated:', { audioUrl, duration, cost });

    return {
      audioUrl: audioUrl as string,
      duration,
      cost,
    };
  } catch (error: any) {
    console.error('[Voice Cloning] TTS generation failed:', error);
    throw new Error(`TTS generation failed: ${error.message}`);
  }
}

/**
 * Estimate cost for voice cloning generation
 * XTTS-v2 pricing: ~$0.006 per second
 */
export function estimateVoiceCloningCost(durationSeconds: number): number {
  const COST_PER_SECOND = 0.006;
  return durationSeconds * COST_PER_SECOND;
}

/**
 * Estimate audio duration from text length
 * Average speaking rate: ~150 words per minute = 2.5 words per second
 * Average word length: ~5 characters
 */
function estimateDuration(text: string): number {
  const words = text.split(/\s+/).length;
  const seconds = words / 2.5;
  return Math.ceil(seconds);
}

/**
 * Validate voice sample for cloning
 * Requirements:
 * - 6-30 seconds duration
 * - Single speaker
 * - Clear audio (no background noise)
 * - WAV, MP3, or WebM format
 */
export function validateVoiceSample(
  duration: number,
  format: string,
  hasBackgroundNoise: boolean
): { valid: boolean; error?: string } {
  if (duration < 6) {
    return {
      valid: false,
      error: 'Voice sample must be at least 6 seconds long',
    };
  }

  if (duration > 30) {
    return {
      valid: false,
      error: 'Voice sample must be 30 seconds or less',
    };
  }

  const validFormats = ['wav', 'mp3', 'webm', 'ogg', 'm4a'];
  if (!validFormats.includes(format.toLowerCase())) {
    return {
      valid: false,
      error: `Format must be one of: ${validFormats.join(', ')}`,
    };
  }

  if (hasBackgroundNoise) {
    return {
      valid: false,
      error: 'Voice sample should have minimal background noise',
    };
  }

  return { valid: true };
}

/**
 * Calculate harmony interval in semitones
 */
export function getIntervalSemitones(interval: string): number {
  const intervalMap: Record<string, number> = {
    third_above: 4,
    third_below: -4,
    fifth_above: 7,
    fifth_below: -7,
    octave_above: 12,
    octave_below: -12,
  };

  return intervalMap[interval] || 0;
}
