/**
 * Voice Memo Transcription Service
 * Uses OpenAI Whisper API for audio-to-text conversion
 */

import 'dotenv/config';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { logger } from '../../../../src/lib/utils/logger.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TranscriptionResult {
  text: string;
  duration: number;
  language?: string;
  confidence?: number;
}

export class TranscriptionService {
  /**
   * Transcribe an audio file using Whisper API
   */
  async transcribeAudio(filePath: string): Promise<TranscriptionResult> {
    try {
      logger.info('Transcribing audio file: ${filePath}');

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`Audio file not found: ${filePath}`);
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      const fileSizeInMB = stats.size / (1024 * 1024);

      logger.info('File size: ${fileSizeInMB.toFixed(2)} MB');

      // Whisper API supports files up to 25MB
      if (fileSizeInMB > 25) {
        throw new Error('Audio file too large. Maximum size is 25MB');
      }

      // Create a read stream
      const audioStream = fs.createReadStream(filePath);

      // Call Whisper API
      const response = await openai.audio.transcriptions.create({
        file: audioStream,
        model: 'whisper-1',
        language: 'en', // Can be auto-detected by removing this
        response_format: 'verbose_json', // Get detailed info
      });

      logger.info('Transcription completed: ${response.text.substring(0, 100)}...');

      return {
        text: response.text,
        duration: response.duration || 0,
        language: response.language,
      };
    } catch (error) {
      logger.error('Transcription error', { error: error.message || String(error) });
      throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transcribe audio with timestamps for better analysis
   */
  async transcribeWithTimestamps(filePath: string): Promise<{ text: string; segments: any[] }> {
    try {
      const audioStream = fs.createReadStream(filePath);

      const response = await openai.audio.transcriptions.create({
        file: audioStream,
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
      });

      return {
        text: response.text,
        segments: (response as any).segments || [],
      };
    } catch (error) {
      logger.error('Transcription with timestamps error', { error: error.message || String(error) });
      throw error;
    }
  }

  /**
   * Batch transcribe multiple audio files
   */
  async transcribeBatch(filePaths: string[]): Promise<Map<string, TranscriptionResult>> {
    const results = new Map<string, TranscriptionResult>();

    for (const filePath of filePaths) {
      try {
        const result = await this.transcribeAudio(filePath);
        results.set(filePath, result);
      } catch (error) {
        logger.error('Failed to transcribe ${filePath}', { error: error.message || String(error) });
        // Continue with other files
      }
    }

    return results;
  }

  /**
   * Check if audio file format is supported
   */
  isSupportedFormat(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    const supportedFormats = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm'];
    return supportedFormats.includes(ext);
  }
}

export const transcriptionService = new TranscriptionService();
