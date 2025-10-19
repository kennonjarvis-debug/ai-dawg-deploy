/**
 * Audio File Validator
 * Validates audio files for melody-to-vocals processing
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface AudioValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: {
    format: string;
    duration: number;
    sampleRate: number;
    channels: number;
    bitrate?: number;
    size: number;
  };
}

export interface AudioValidationOptions {
  maxSizeMB?: number;
  maxDurationSeconds?: number;
  minDurationSeconds?: number;
  allowedFormats?: string[];
  requireStereo?: boolean;
  minSampleRate?: number;
}

const DEFAULT_OPTIONS: Required<AudioValidationOptions> = {
  maxSizeMB: 50,
  maxDurationSeconds: 300, // 5 minutes
  minDurationSeconds: 1,
  allowedFormats: ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'],
  requireStereo: false,
  minSampleRate: 16000, // Minimum for decent quality
};

/**
 * Validate an audio file
 */
export async function validateAudioFile(
  filePath: string,
  options: AudioValidationOptions = {}
): Promise<AudioValidationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return {
      valid: false,
      errors: ['File does not exist'],
      warnings: [],
    };
  }

  // Check file size
  const stats = fs.statSync(filePath);
  const sizeMB = stats.size / (1024 * 1024);

  if (sizeMB > opts.maxSizeMB) {
    errors.push(`File size ${sizeMB.toFixed(2)}MB exceeds maximum of ${opts.maxSizeMB}MB`);
  }

  if (sizeMB < 0.001) {
    errors.push('File is too small (less than 1KB)');
  }

  // Check file extension
  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  if (!opts.allowedFormats.includes(ext)) {
    errors.push(
      `File format .${ext} not supported. Allowed formats: ${opts.allowedFormats.join(', ')}`
    );
  }

  // If basic validation fails, return early
  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // Use ffprobe to get detailed audio metadata
  let metadata;
  try {
    metadata = await getAudioMetadata(filePath);
  } catch (error: any) {
    errors.push(`Failed to read audio metadata: ${error.message}`);
    return { valid: false, errors, warnings };
  }

  // Validate duration
  if (metadata.duration < opts.minDurationSeconds) {
    errors.push(
      `Audio duration ${metadata.duration.toFixed(1)}s is too short (minimum: ${opts.minDurationSeconds}s)`
    );
  }

  if (metadata.duration > opts.maxDurationSeconds) {
    errors.push(
      `Audio duration ${metadata.duration.toFixed(1)}s exceeds maximum of ${opts.maxDurationSeconds}s`
    );
  }

  // Validate sample rate
  if (metadata.sampleRate < opts.minSampleRate) {
    errors.push(
      `Sample rate ${metadata.sampleRate}Hz is too low (minimum: ${opts.minSampleRate}Hz)`
    );
  }

  // Validate channels
  if (opts.requireStereo && metadata.channels < 2) {
    errors.push('Stereo audio is required, but file is mono');
  }

  // Warnings for suboptimal but acceptable conditions
  if (metadata.sampleRate < 44100) {
    warnings.push(
      `Sample rate ${metadata.sampleRate}Hz is below recommended 44100Hz. Quality may be reduced.`
    );
  }

  if (metadata.channels === 1 && !opts.requireStereo) {
    warnings.push('Audio is mono. Stereo is recommended for better quality.');
  }

  if (metadata.bitrate && metadata.bitrate < 128000) {
    warnings.push(
      `Bitrate ${Math.round(metadata.bitrate / 1000)}kbps is low. Higher quality audio recommended.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metadata: {
      ...metadata,
      size: stats.size,
    },
  };
}

/**
 * Get audio metadata using ffprobe
 */
async function getAudioMetadata(filePath: string): Promise<{
  format: string;
  duration: number;
  sampleRate: number;
  channels: number;
  bitrate?: number;
}> {
  try {
    // Use ffprobe to get audio information
    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
    );

    const info = JSON.parse(stdout);
    const audioStream = info.streams?.find((s: any) => s.codec_type === 'audio');

    if (!audioStream) {
      throw new Error('No audio stream found in file');
    }

    return {
      format: info.format?.format_name?.split(',')[0] || 'unknown',
      duration: parseFloat(audioStream.duration || info.format?.duration || '0'),
      sampleRate: parseInt(audioStream.sample_rate || '0'),
      channels: parseInt(audioStream.channels || '0'),
      bitrate: parseInt(audioStream.bit_rate || info.format?.bit_rate || '0'),
    };
  } catch (error: any) {
    // Fallback if ffprobe is not available
    if (error.message.includes('ffprobe')) {
      throw new Error(
        'ffprobe not found. Please install ffmpeg to enable audio validation.'
      );
    }
    throw error;
  }
}

/**
 * Validate audio content (not corrupted, not silent)
 */
export async function validateAudioContent(filePath: string): Promise<{
  valid: boolean;
  errors: string[];
  analysis?: {
    isSilent: boolean;
    averageVolume: number;
    peakVolume: number;
    hasClipping: boolean;
  };
}> {
  const errors: string[] = [];

  try {
    // Use ffmpeg to analyze audio levels
    const { stderr } = await execAsync(
      `ffmpeg -i "${filePath}" -af "volumedetect" -f null - 2>&1 || true`
    );

    // Parse volume detection output
    const maxVolumeMatch = stderr.match(/max_volume:\s*([-\d.]+)\s*dB/);
    const meanVolumeMatch = stderr.match(/mean_volume:\s*([-\d.]+)\s*dB/);

    if (!maxVolumeMatch || !meanVolumeMatch) {
      errors.push('Could not analyze audio volume');
      return { valid: false, errors };
    }

    const maxVolume = parseFloat(maxVolumeMatch[1]);
    const meanVolume = parseFloat(meanVolumeMatch[1]);

    // Check for silent audio (mean volume below -60dB)
    const isSilent = meanVolume < -60;
    if (isSilent) {
      errors.push('Audio appears to be silent or too quiet');
    }

    // Check for severe clipping (max volume at 0dB)
    const hasClipping = maxVolume >= -0.1;
    if (hasClipping) {
      errors.push('Audio has severe clipping/distortion');
    }

    return {
      valid: errors.length === 0,
      errors,
      analysis: {
        isSilent,
        averageVolume: meanVolume,
        peakVolume: maxVolume,
        hasClipping,
      },
    };
  } catch (error: any) {
    if (error.message.includes('ffmpeg')) {
      errors.push('ffmpeg not found. Cannot validate audio content.');
    } else {
      errors.push(`Audio content validation failed: ${error.message}`);
    }
    return { valid: false, errors };
  }
}

/**
 * Comprehensive validation combining file and content checks
 */
export async function validateAudioComprehensive(
  filePath: string,
  options: AudioValidationOptions = {}
): Promise<AudioValidationResult> {
  // First validate file properties
  const fileValidation = await validateAudioFile(filePath, options);

  if (!fileValidation.valid) {
    return fileValidation;
  }

  // Then validate audio content
  const contentValidation = await validateAudioContent(filePath);

  return {
    valid: fileValidation.valid && contentValidation.valid,
    errors: [...fileValidation.errors, ...contentValidation.errors],
    warnings: fileValidation.warnings,
    metadata: fileValidation.metadata,
  };
}

/**
 * Quick format check without deep validation
 */
export function quickFormatCheck(filePath: string): {
  valid: boolean;
  format: string;
  error?: string;
} {
  if (!fs.existsSync(filePath)) {
    return { valid: false, format: '', error: 'File does not exist' };
  }

  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  const allowedFormats = DEFAULT_OPTIONS.allowedFormats;

  if (!allowedFormats.includes(ext)) {
    return {
      valid: false,
      format: ext,
      error: `Format .${ext} not supported. Allowed: ${allowedFormats.join(', ')}`,
    };
  }

  return { valid: true, format: ext };
}
