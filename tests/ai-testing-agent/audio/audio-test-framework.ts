/**
 * Audio Test Framework
 *
 * Comprehensive audio testing framework for DAW and AI music features.
 * Supports loading, validating, and analyzing audio files using Web Audio API.
 *
 * Features:
 * - Load and parse MP3, WAV, OGG files
 * - Verify audio file integrity
 * - Test playback functionality
 * - Measure loading time
 * - Integration with Playwright for browser audio testing
 */

import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export interface AudioFileInfo {
  path: string;
  name: string;
  format: 'mp3' | 'wav' | 'ogg' | 'unknown';
  size: number;
  exists: boolean;
  buffer?: Buffer;
}

export interface AudioLoadResult {
  success: boolean;
  duration: number; // milliseconds
  sampleRate?: number;
  numberOfChannels?: number;
  length?: number; // number of samples
  error?: string;
  loadTime?: number; // milliseconds
}

export interface AudioPlaybackTest {
  canPlay: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  error?: string;
}

export interface AudioIntegrityCheck {
  valid: boolean;
  hasData: boolean;
  formatSupported: boolean;
  sizeReasonable: boolean;
  errors: string[];
}

/**
 * Main Audio Test Framework Class
 */
export class AudioTestFramework {
  private page: Page;
  private testAudioDir: string;
  private audioContext: any = null;

  constructor(page: Page, testAudioDir?: string) {
    this.page = page;
    this.testAudioDir = testAudioDir || path.join(__dirname, 'test-audio-files');
  }

  /**
   * Initialize Web Audio API in the browser context
   */
  async initialize(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).testAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    });
  }

  /**
   * Load audio file and return file info
   */
  async loadAudioFile(filePath: string): Promise<AudioFileInfo> {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.testAudioDir, filePath);

    const exists = fs.existsSync(fullPath);
    const info: AudioFileInfo = {
      path: fullPath,
      name: path.basename(fullPath),
      format: this.getAudioFormat(fullPath),
      size: 0,
      exists,
    };

    if (exists) {
      const stats = fs.statSync(fullPath);
      info.size = stats.size;
      info.buffer = fs.readFileSync(fullPath);
    }

    return info;
  }

  /**
   * Test audio file loading in browser context
   */
  async testAudioLoading(audioFile: AudioFileInfo): Promise<AudioLoadResult> {
    const startTime = Date.now();

    try {
      if (!audioFile.buffer) {
        return {
          success: false,
          duration: 0,
          error: 'Audio file buffer not available',
        };
      }

      // Convert buffer to base64 for browser transfer
      const base64Audio = audioFile.buffer.toString('base64');
      const dataUrl = `data:audio/${audioFile.format};base64,${base64Audio}`;

      const result = await this.page.evaluate(async (url: string) => {
        try {
          const audioContext = (window as any).testAudioContext;

          // Fetch audio data
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();

          // Decode audio data
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          return {
            success: true,
            duration: audioBuffer.duration * 1000,
            sampleRate: audioBuffer.sampleRate,
            numberOfChannels: audioBuffer.numberOfChannels,
            length: audioBuffer.length,
          };
        } catch (error: any) {
          return {
            success: false,
            duration: 0,
            error: error.message,
          };
        }
      }, dataUrl);

      const loadTime = Date.now() - startTime;
      return { ...result, loadTime };
    } catch (error: any) {
      return {
        success: false,
        duration: 0,
        error: error.message,
        loadTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Test audio playback functionality
   */
  async testAudioPlayback(audioFile: AudioFileInfo, duration: number = 1000): Promise<AudioPlaybackTest> {
    try {
      if (!audioFile.buffer) {
        return {
          canPlay: false,
          isPlaying: false,
          currentTime: 0,
          duration: 0,
          volume: 0,
          muted: false,
          error: 'Audio file buffer not available',
        };
      }

      const base64Audio = audioFile.buffer.toString('base64');
      const dataUrl = `data:audio/${audioFile.format};base64,${base64Audio}`;

      const result = await this.page.evaluate(async ({ url, testDuration }: { url: string; testDuration: number }) => {
        return new Promise<AudioPlaybackTest>((resolve) => {
          const audio = new Audio(url);

          const playbackTest: AudioPlaybackTest = {
            canPlay: false,
            isPlaying: false,
            currentTime: 0,
            duration: 0,
            volume: 1,
            muted: false,
          };

          audio.addEventListener('canplay', () => {
            playbackTest.canPlay = true;
            playbackTest.duration = audio.duration;
          });

          audio.addEventListener('playing', () => {
            playbackTest.isPlaying = true;
            playbackTest.currentTime = audio.currentTime;
            playbackTest.volume = audio.volume;
            playbackTest.muted = audio.muted;
          });

          audio.addEventListener('error', (e) => {
            playbackTest.error = `Audio playback error: ${e.type}`;
            resolve(playbackTest);
          });

          audio.play().then(() => {
            setTimeout(() => {
              playbackTest.currentTime = audio.currentTime;
              audio.pause();
              resolve(playbackTest);
            }, testDuration);
          }).catch((error) => {
            playbackTest.error = error.message;
            resolve(playbackTest);
          });
        });
      }, { url: dataUrl, testDuration: duration });

      return result;
    } catch (error: any) {
      return {
        canPlay: false,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 0,
        muted: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify audio file integrity
   */
  async verifyAudioIntegrity(audioFile: AudioFileInfo): Promise<AudioIntegrityCheck> {
    const check: AudioIntegrityCheck = {
      valid: true,
      hasData: false,
      formatSupported: false,
      sizeReasonable: false,
      errors: [],
    };

    // Check if file exists
    if (!audioFile.exists) {
      check.valid = false;
      check.errors.push('Audio file does not exist');
      return check;
    }

    // Check if file has data
    if (audioFile.size === 0) {
      check.valid = false;
      check.errors.push('Audio file is empty (0 bytes)');
    } else {
      check.hasData = true;
    }

    // Check format
    if (['mp3', 'wav', 'ogg'].includes(audioFile.format)) {
      check.formatSupported = true;
    } else {
      check.valid = false;
      check.errors.push(`Unsupported audio format: ${audioFile.format}`);
    }

    // Check size (reasonable range: 1KB to 100MB)
    if (audioFile.size >= 1024 && audioFile.size <= 100 * 1024 * 1024) {
      check.sizeReasonable = true;
    } else {
      check.errors.push(`Audio file size out of reasonable range: ${audioFile.size} bytes`);
    }

    // Verify magic bytes for format
    if (audioFile.buffer) {
      const validFormat = this.verifyFormatMagicBytes(audioFile.buffer, audioFile.format);
      if (!validFormat) {
        check.valid = false;
        check.errors.push('Audio file format magic bytes do not match extension');
      }
    }

    check.valid = check.valid && check.hasData && check.formatSupported && check.sizeReasonable;
    return check;
  }

  /**
   * Measure loading time for audio file
   */
  async measureLoadingTime(audioFile: AudioFileInfo, iterations: number = 5): Promise<{
    averageTime: number;
    minTime: number;
    maxTime: number;
    times: number[];
  }> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const result = await this.testAudioLoading(audioFile);
      if (result.loadTime) {
        times.push(result.loadTime);
      }
    }

    return {
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      times,
    };
  }

  /**
   * Test audio element creation and DOM integration
   */
  async testAudioElementIntegration(audioFile: AudioFileInfo): Promise<{
    success: boolean;
    elementCreated: boolean;
    canPlayType: string;
    error?: string;
  }> {
    try {
      if (!audioFile.buffer) {
        return {
          success: false,
          elementCreated: false,
          canPlayType: '',
          error: 'Audio file buffer not available',
        };
      }

      const base64Audio = audioFile.buffer.toString('base64');
      const dataUrl = `data:audio/${audioFile.format};base64,${base64Audio}`;

      const result = await this.page.evaluate((url: string) => {
        const audio = document.createElement('audio');
        audio.src = url;

        const canPlayType = audio.canPlayType(`audio/${url.split(';')[0].split(':')[1]}`);

        document.body.appendChild(audio);
        const elementCreated = document.body.contains(audio);

        // Clean up
        document.body.removeChild(audio);

        return {
          success: true,
          elementCreated,
          canPlayType,
        };
      }, dataUrl);

      return result;
    } catch (error: any) {
      return {
        success: false,
        elementCreated: false,
        canPlayType: '',
        error: error.message,
      };
    }
  }

  /**
   * Create a test audio file (sine wave)
   */
  async createTestAudioFile(
    filename: string,
    duration: number = 1,
    frequency: number = 440,
    sampleRate: number = 44100
  ): Promise<AudioFileInfo> {
    const fullPath = path.join(this.testAudioDir, filename);

    // Generate sine wave in browser and download
    const audioData = await this.page.evaluate(
      ({ dur, freq, sr }: { dur: number; freq: number; sr: number }) => {
        const audioContext = (window as any).testAudioContext || new AudioContext();
        const bufferLength = sr * dur;
        const buffer = audioContext.createBuffer(2, bufferLength, sr);

        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          const channelData = buffer.getChannelData(channel);
          for (let i = 0; i < bufferLength; i++) {
            channelData[i] = Math.sin((2 * Math.PI * freq * i) / sr) * 0.5;
          }
        }

        // Convert to WAV format
        const wavData = audioBufferToWav(buffer);
        return Array.from(new Uint8Array(wavData));
      },
      { dur: duration, freq: frequency, sr: sampleRate }
    );

    // Save to file
    const buffer = Buffer.from(audioData);
    fs.writeFileSync(fullPath, buffer);

    return this.loadAudioFile(fullPath);
  }

  /**
   * Clean up test resources
   */
  async cleanup(): Promise<void> {
    await this.page.evaluate(() => {
      const audioContext = (window as any).testAudioContext;
      if (audioContext) {
        audioContext.close();
      }
    });
  }

  /**
   * Get audio format from file extension
   */
  private getAudioFormat(filePath: string): 'mp3' | 'wav' | 'ogg' | 'unknown' {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.mp3':
        return 'mp3';
      case '.wav':
        return 'wav';
      case '.ogg':
        return 'ogg';
      default:
        return 'unknown';
    }
  }

  /**
   * Verify format magic bytes
   */
  private verifyFormatMagicBytes(buffer: Buffer, format: string): boolean {
    const magicBytes = buffer.slice(0, 4);

    switch (format) {
      case 'mp3':
        // MP3: FF FB or ID3
        return (
          (magicBytes[0] === 0xff && (magicBytes[1] & 0xe0) === 0xe0) ||
          (magicBytes[0] === 0x49 && magicBytes[1] === 0x44 && magicBytes[2] === 0x33)
        );
      case 'wav':
        // WAV: RIFF
        return (
          magicBytes[0] === 0x52 &&
          magicBytes[1] === 0x49 &&
          magicBytes[2] === 0x46 &&
          magicBytes[3] === 0x46
        );
      case 'ogg':
        // OGG: OggS
        return (
          magicBytes[0] === 0x4f &&
          magicBytes[1] === 0x67 &&
          magicBytes[2] === 0x67 &&
          magicBytes[3] === 0x53
        );
      default:
        return false;
    }
  }
}

/**
 * Helper function to inject into browser context for WAV conversion
 */
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numOfChannels = buffer.numberOfChannels;
  const length = buffer.length * numOfChannels * 2 + 44;
  const arrayBuffer = new ArrayBuffer(length);
  const view = new DataView(arrayBuffer);
  const channels: Float32Array[] = [];
  let offset = 0;
  let pos = 0;

  // Write WAV header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChannels);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChannels); // avg. bytes/sec
  setUint16(numOfChannels * 2); // block-align
  setUint16(16); // 16-bit

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // Write interleaved data
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChannels; i++) {
      const sample = Math.max(-1, Math.min(1, channels[i][offset]));
      view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      pos += 2;
    }
    offset++;
  }

  return arrayBuffer;

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}
