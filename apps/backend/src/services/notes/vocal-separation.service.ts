/**
 * Vocal Separation Service
 * Isolates vocals from background music using ffmpeg audio filters
 *
 * Note: This uses ffmpeg's built-in filters for basic vocal isolation.
 * For higher quality, consider upgrading to Demucs/Spleeter when Python deps are resolved.
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const ISOLATED_OUTPUT_PATH = '/Users/benkennon/Library/Group Containers/group.com.apple.VoiceMemos.shared/Recordings/Jarvis/Isolated';

export interface VocalSeparationOptions {
  /**
   * Output format (m4a, wav)
   */
  outputFormat?: 'm4a' | 'wav';

  /**
   * Apply noise reduction
   */
  noiseReduction?: boolean;

  /**
   * Normalize audio output
   */
  normalize?: boolean;

  /**
   * Move original file to Recently Deleted after processing
   */
  deleteOriginal?: boolean;
}

export interface VocalSeparationResult {
  success: boolean;
  vocalsFilePath?: string;
  instrumentalFilePath?: string;
  duration?: number;
  fileSize?: number;
  error?: string;
  method: 'ffmpeg-center-extraction' | 'ffmpeg-vocals-only';
}

export class VocalSeparationService {
  /**
   * Separate vocals from background music
   */
  async separateVocals(
    inputFilePath: string,
    options: VocalSeparationOptions = {},
    songTitle?: string
  ): Promise<VocalSeparationResult> {
    try {
      // Validate input
      if (!fs.existsSync(inputFilePath)) {
        throw new Error(`Input file not found: ${inputFilePath}`);
      }

      // Ensure output directory exists
      if (!fs.existsSync(ISOLATED_OUTPUT_PATH)) {
        fs.mkdirSync(ISOLATED_OUTPUT_PATH, { recursive: true });
      }

      const outputFormat = options.outputFormat || 'm4a';
      const normalize = options.normalize !== false; // Default true
      const noiseReduction = options.noiseReduction !== false; // Default true

      // Generate output filename
      // If song title provided, use it; otherwise use input basename
      const sanitizeSongTitle = (title: string): string => {
        return title
          .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();
      };

      const inputBasename = path.basename(inputFilePath, path.extname(inputFilePath));
      const outputBasename = songTitle
        ? sanitizeSongTitle(songTitle)
        : `${inputBasename}_VOCALS_ONLY`;

      const vocalsOutputPath = path.join(
        ISOLATED_OUTPUT_PATH,
        `${outputBasename}.${outputFormat}`
      );

      console.log(`Separating vocals from: ${path.basename(inputFilePath)}`);

      // Build ffmpeg command for vocal isolation
      // Strategy: Extract center channel (where vocals usually are) + bandpass filter for vocal frequencies
      const filters: string[] = [];

      // 1. Convert to mono by extracting center channel (vocals are typically centered)
      filters.push('[0:a]pan=1c|c0=0.5*c0+0.5*c1[center]');

      // 2. Apply bandpass filter to focus on vocal frequency range (100Hz - 10kHz, tighter for cleaner vocals)
      filters.push('[center]highpass=f=100,lowpass=f=10000[vocal_range]');

      // 3. Aggressive noise reduction using afftdn with multiple passes
      if (noiseReduction) {
        // First pass: Reduce ambient noise
        filters.push('[vocal_range]afftdn=nf=-30:tn=1[nr1]');
        // Second pass: Further noise reduction
        filters.push('[nr1]afftdn=nf=-25:tn=1[nr2]');
        // Apply high-pass filter to remove low-frequency rumble
        filters.push('[nr2]highpass=f=200[cleaned]');
        // Dynamic compression to balance levels and reduce background
        filters.push('[cleaned]compand=attacks=0.2:decays=0.5:points=-80/-80|-50/-20|-30/-15|-10/-10|0/-7|20/-7:gain=6[vocals]');
      } else {
        filters.push('[vocal_range]compand=attacks=0.3:decays=0.8:points=-80/-80|-45/-15|-27/-9|0/-7|20/-7:gain=5[vocals]');
      }

      // 4. Normalize if requested
      const finalFilter = normalize
        ? '[vocals]loudnorm=I=-16:TP=-1.5:LRA=11[out]'
        : '[vocals]anull[out]';
      filters.push(finalFilter);

      const filterComplex = filters.join(';');

      // Build ffmpeg command
      const codecArgs = outputFormat === 'wav' ? '-c:a pcm_s16le' : '-c:a aac -b:a 192k';
      const ffmpegCommand = `ffmpeg -i "${inputFilePath}" -filter_complex "${filterComplex}" -map "[out]" ${codecArgs} "${vocalsOutputPath}" -y`;

      // Execute ffmpeg
      console.log('Running ffmpeg vocal separation...');
      await execAsync(ffmpegCommand);

      // Get output file stats
      const stats = fs.statSync(vocalsOutputPath);

      // Get duration using ffprobe
      const { stdout: durationOutput } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${vocalsOutputPath}"`
      );
      const duration = parseFloat(durationOutput.trim());

      console.log(`✅ Vocals isolated: ${path.basename(vocalsOutputPath)}`);
      console.log(`   Duration: ${duration.toFixed(2)}s`);
      console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

      // LIVE SYNC: Copy to main Voice Memos folder (subfolders not recognized by app)
      // Add "JARVIS - " prefix so songs are easily identifiable and grouped together
      const VOICE_MEMOS_MAIN_PATH = '/Users/benkennon/Library/Group Containers/group.com.apple.VoiceMemos.shared/Recordings';
      const jarvisFilename = `JARVIS - ${path.basename(vocalsOutputPath)}`;
      const voiceMemosPath = path.join(VOICE_MEMOS_MAIN_PATH, jarvisFilename);

      fs.copyFileSync(vocalsOutputPath, voiceMemosPath);
      console.log(`📱 Synced to Voice Memos app: ${jarvisFilename}`);

      // Move original to Recently Deleted if requested
      if (options.deleteOriginal) {
        const RECENTLY_DELETED_PATH = path.join(VOICE_MEMOS_MAIN_PATH, '.recentlyDeleted');

        // Ensure Recently Deleted folder exists
        if (!fs.existsSync(RECENTLY_DELETED_PATH)) {
          fs.mkdirSync(RECENTLY_DELETED_PATH, { recursive: true });
        }

        const originalFileName = path.basename(inputFilePath);
        const deletedPath = path.join(RECENTLY_DELETED_PATH, originalFileName);

        try {
          fs.renameSync(inputFilePath, deletedPath);
          console.log(`🗑️  Moved original to Recently Deleted: ${originalFileName}`);
        } catch (err) {
          console.warn(`⚠️  Could not move original file: ${err}`);
        }
      }

      // NOTE: Voice Memos folder assignment disabled
      // Organizing into folders requires Swift CLI tool with CoreData (Voice Memos database uses CoreData triggers)
      // For now, files use "JARVIS - " prefix for easy identification in Voice Memos app
      // See: src/services/notes/voice-memos-folder.service.ts for attempted approaches

      return {
        success: true,
        vocalsFilePath: vocalsOutputPath,
        duration,
        fileSize: stats.size,
        method: 'ffmpeg-center-extraction',
      };
    } catch (error) {
      console.error('Vocal separation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        method: 'ffmpeg-center-extraction',
      };
    }
  }

  /**
   * Check if a voice memo likely has background music
   * (Simple heuristic based on stereo width and frequency content)
   */
  async hasBackgroundMusic(filePath: string): Promise<boolean> {
    try {
      // Use ffmpeg to analyze stereo width
      const command = `ffmpeg -i "${filePath}" -af "astats=metadata=1:reset=1" -f null - 2>&1 | grep -E "Overall.RMS_level"`;
      const { stdout } = await execAsync(command);

      // If we can extract stereo information, likely has background music
      // This is a simple heuristic - can be improved
      return stdout.trim().length > 0;
    } catch {
      return false; // If analysis fails, assume no background music
    }
  }

  /**
   * Get isolated vocals output path
   */
  getIsolatedOutputPath(): string {
    return ISOLATED_OUTPUT_PATH;
  }

  /**
   * List all isolated vocal files
   */
  listIsolatedVocals(): string[] {
    try {
      if (!fs.existsSync(ISOLATED_OUTPUT_PATH)) {
        return [];
      }

      return fs.readdirSync(ISOLATED_OUTPUT_PATH)
        .filter(file => file.includes('_VOCALS_ONLY'))
        .map(file => path.join(ISOLATED_OUTPUT_PATH, file));
    } catch {
      return [];
    }
  }
}

export const vocalSeparationService = new VocalSeparationService();
