/**
 * Melody-to-Vocals Service
 * TypeScript wrapper for the Expert Music AI melody-to-vocals pipeline
 */

import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';

const EXPERT_MUSIC_AI_URL = process.env.EXPERT_MUSIC_AI_URL || 'http://localhost:8003';

export interface MelodyToVocalsRequest {
  audioFilePath: string;
  prompt: string;
  genre?: string;
  theme?: string;
  mood?: string;
  style?: string;
  aiProvider?: 'anthropic' | 'openai';
  vocalModel?: 'bark' | 'musicgen';
}

export interface MelodyInfo {
  num_notes: number;
  duration: number;
  key: string;
  range: string;
  notes: string[];
}

export interface LyricsInfo {
  num_lines: number;
  syllables: number;
  genre: string;
  theme?: string;
  mood?: string;
}

export interface MelodyToVocalsResponse {
  success: boolean;
  audio_url: string;
  lyrics: string;
  melody_info: MelodyInfo;
  lyrics_info: LyricsInfo;
  processing_steps: string[];
}

/**
 * Convert hummed melody to full vocals with AI-generated lyrics
 *
 * @param request Configuration for melody-to-vocals generation
 * @returns Response with audio URL, lyrics, and metadata
 */
export async function generateVocalsFromMelody(
  request: MelodyToVocalsRequest
): Promise<MelodyToVocalsResponse> {
  const {
    audioFilePath,
    prompt,
    genre = 'pop',
    theme,
    mood,
    style,
    aiProvider = 'anthropic',
    vocalModel = 'bark'
  } = request;

  // Create form data
  const formData = new FormData();

  // Add audio file
  const audioStream = fs.createReadStream(audioFilePath);
  formData.append('audio_file', audioStream, {
    filename: 'melody.wav',
    contentType: 'audio/wav'
  });

  // Add text fields
  formData.append('prompt', prompt);
  formData.append('genre', genre);

  if (theme) formData.append('theme', theme);
  if (mood) formData.append('mood', mood);
  if (style) formData.append('style', style);

  formData.append('ai_provider', aiProvider);
  formData.append('vocal_model', vocalModel);

  try {
    const response = await fetch(`${EXPERT_MUSIC_AI_URL}/melody-to-vocals`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Expert Music AI error: ${response.status} - ${errorText}`);
    }

    const result = await response.json() as MelodyToVocalsResponse;
    return result;

  } catch (error) {
    console.error('Melody-to-vocals error:', error);
    throw error;
  }
}

/**
 * Helper function to check if Expert Music AI service is available
 */
export async function checkExpertMusicAIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${EXPERT_MUSIC_AI_URL}/`);
    if (response.ok) {
      const data = await response.json();
      return data.service === 'Expert Music AI' && data.status === 'running';
    }
    return false;
  } catch (error) {
    console.error('Expert Music AI health check failed:', error);
    return false;
  }
}

/**
 * List available models from Expert Music AI
 */
export async function listExpertMusicModels() {
  try {
    const response = await fetch(`${EXPERT_MUSIC_AI_URL}/models`);
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to list Expert Music AI models:', error);
    throw error;
  }
}

// Example usage
if (require.main === module) {
  (async () => {
    try {
      // Check service health
      const isHealthy = await checkExpertMusicAIHealth();
      console.log('Expert Music AI service healthy:', isHealthy);

      if (!isHealthy) {
        console.error('Service not available. Make sure Expert Music AI is running on port 8003');
        process.exit(1);
      }

      // List models
      const models = await listExpertMusicModels();
      console.log('Available models:', models.length);

      // Example: Generate vocals from melody
      // Uncomment and provide a real audio file to test:
      /*
      const result = await generateVocalsFromMelody({
        audioFilePath: '/path/to/humming.wav',
        prompt: 'A love song about summer nights',
        genre: 'pop',
        mood: 'nostalgic',
        theme: 'romance',
        aiProvider: 'anthropic',
        vocalModel: 'bark'
      });

      console.log('\n=== MELODY TO VOCALS RESULT ===');
      console.log('Success:', result.success);
      console.log('Audio URL:', result.audio_url);
      console.log('\nGenerated Lyrics:');
      console.log(result.lyrics);
      console.log('\nMelody Info:');
      console.log(`- ${result.melody_info.num_notes} notes`);
      console.log(`- Duration: ${result.melody_info.duration}s`);
      console.log(`- Key: ${result.melody_info.key}`);
      console.log(`- Range: ${result.melody_info.range}`);
      console.log('\nProcessing Steps:');
      result.processing_steps.forEach((step, i) => {
        console.log(`${i + 1}. ${step}`);
      });
      */

    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  })();
}

export default {
  generateVocalsFromMelody,
  checkExpertMusicAIHealth,
  listExpertMusicModels
};
