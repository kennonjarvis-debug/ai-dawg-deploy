import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { Readable } from 'stream';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath.path);

export class AudioConverter {
  /**
   * Convert audio buffer (WAV/WebM) to MP3 for OpenAI Whisper API
   * Optimized for speech: mono, 16kHz, 128kbps
   * Uses temp files instead of pipes for reliability
   */
  async convertToMP3(audioBuffer: Buffer, inputFormat: string = 'wav'): Promise<Buffer> {
    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `input-${Date.now()}-${Math.random()}.${inputFormat}`);
    const outputPath = path.join(tempDir, `output-${Date.now()}-${Math.random()}.mp3`);

    try {
      // Write input buffer to temp file
      await fs.writeFile(inputPath, audioBuffer);

      // Convert using temp files
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .audioCodec('libmp3lame')
          .audioBitrate('128k') // Good quality for speech
          .audioFrequency(16000) // Whisper prefers 16kHz
          .audioChannels(1) // Mono audio for speech
          .format('mp3')
          .on('start', (commandLine) => {
            console.log('🔄 FFmpeg converting:', commandLine.substring(0, 100) + '...');
          })
          .on('error', (err) => {
            console.error('❌ FFmpeg conversion error:', err.message);
            reject(new Error(`Audio conversion failed: ${err.message}`));
          })
          .on('end', () => {
            resolve();
          })
          .save(outputPath);
      });

      // Read converted file
      const outputBuffer = await fs.readFile(outputPath);
      console.log(`✅ Converted ${inputFormat}: ${audioBuffer.length} bytes → ${outputBuffer.length} bytes`);

      // Clean up temp files
      await fs.unlink(inputPath).catch(() => {});
      await fs.unlink(outputPath).catch(() => {});

      return outputBuffer;
    } catch (error) {
      // Clean up temp files on error
      await fs.unlink(inputPath).catch(() => {});
      await fs.unlink(outputPath).catch(() => {});
      throw error;
    }
  }

  /**
   * Validate WebM file format by checking magic bytes
   */
  private isValidWebM(buffer: Buffer): boolean {
    // WebM files start with EBML header (0x1A45DFA3)
    if (buffer.length < 4) return false;
    return buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3;
  }

  /**
   * Prepare audio for Whisper API (convert and optimize)
   * ALWAYS converts to MP3 - MediaRecorder chunks aren't standalone WebM files
   */
  async prepareForWhisper(audioBuffer: Buffer, format: string = 'wav'): Promise<{ buffer: Buffer; extension: string; mimeType: string }> {
    try {
      // ALWAYS convert to MP3 for streaming reliability
      // MediaRecorder.start(timeslice) produces fragmented WebM chunks
      // Only the first chunk has proper headers - subsequent chunks fail
      console.log(`🔄 Converting ${format} chunk to MP3 (${audioBuffer.length} bytes)`);

      const mp3Buffer = await this.convertToMP3(audioBuffer, format);

      return {
        buffer: mp3Buffer,
        extension: 'mp3',
        mimeType: 'audio/mpeg'
      };
    } catch (error: any) {
      console.error('❌ MP3 conversion failed:', error.message);
      throw error; // Don't fallback - better to fail than send bad audio
    }
  }
}

// Export singleton
export const audioConverter = new AudioConverter();
