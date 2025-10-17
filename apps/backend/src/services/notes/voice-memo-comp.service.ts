/**
 * Voice Memo Comping Service
 * Combines multiple voice memo takes into a single stitched audio file
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { taggingService, VoiceMemoTags } from './tagging.service.js';

const execAsync = promisify(exec);

const COMP_OUTPUT_PATH = '/Users/benkennon/Library/Group Containers/group.com.apple.VoiceMemos.shared/Recordings/Jarvis/Comps';
const VOICE_MEMOS_MAIN_PATH = '/Users/benkennon/Library/Group Containers/group.com.apple.VoiceMemos.shared/Recordings';

export interface CompOptions {
  /**
   * Crossfade duration in seconds between takes
   */
  crossfadeDuration?: number;

  /**
   * Normalize audio levels
   */
  normalize?: boolean;

  /**
   * Output format (m4a, wav, mp3)
   */
  outputFormat?: 'm4a' | 'wav' | 'mp3';

  /**
   * Custom output filename
   */
  outputFileName?: string;

  /**
   * Add silence between takes (in seconds)
   */
  silenceBetween?: number;
}

export interface CompResult {
  success: boolean;
  compedFilePath?: string;
  duration?: number;
  fileSize?: number;
  takesCount: number;
  error?: string;
}

export class VoiceMemoCompService {
  /**
   * Comp (stitch together) multiple voice memo takes
   */
  async compVoiceMemos(
    takeFilePaths: string[],
    options: CompOptions = {}
  ): Promise<CompResult> {
    try {
      // Validate inputs
      if (takeFilePaths.length === 0) {
        throw new Error('No voice memo files provided');
      }

      // Ensure all files exist
      for (const filePath of takeFilePaths) {
        if (!fs.existsSync(filePath)) {
          throw new Error(`File not found: ${filePath}`);
        }
      }

      // Ensure output directory exists
      if (!fs.existsSync(COMP_OUTPUT_PATH)) {
        fs.mkdirSync(COMP_OUTPUT_PATH, { recursive: true });
      }

      // Set defaults
      const crossfadeDuration = options.crossfadeDuration || 0.5;
      const normalize = options.normalize !== false; // Default true
      const outputFormat = options.outputFormat || 'm4a';
      const silenceBetween = options.silenceBetween || 0;

      // Generate output filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const outputFileName = options.outputFileName || `JARVIS_COMP_${timestamp}.${outputFormat}`;
      const outputPath = path.join(COMP_OUTPUT_PATH, outputFileName);

      console.log(`Comping ${takeFilePaths.length} voice memos...`);

      // Build ffmpeg command
      let ffmpegCommand: string;

      if (takeFilePaths.length === 1) {
        // Single file - just copy with optional normalization
        if (normalize) {
          ffmpegCommand = `ffmpeg -i "${takeFilePaths[0]}" -af "loudnorm" "${outputPath}"`;
        } else {
          ffmpegCommand = `ffmpeg -i "${takeFilePaths[0]}" -c copy "${outputPath}"`;
        }
      } else if (silenceBetween > 0) {
        // Concatenate with silence between
        const inputArgs = takeFilePaths.map(f => `-i "${f}"`).join(' ');
        const filterComplex = this.buildSilenceFilterComplex(takeFilePaths.length, silenceBetween, normalize);
        ffmpegCommand = `ffmpeg ${inputArgs} -filter_complex "${filterComplex}" "${outputPath}"`;
      } else if (crossfadeDuration > 0) {
        // Crossfade between takes
        const filterComplex = this.buildCrossfadeFilterComplex(takeFilePaths.length, crossfadeDuration, normalize);
        const inputArgs = takeFilePaths.map(f => `-i "${f}"`).join(' ');
        ffmpegCommand = `ffmpeg ${inputArgs} -filter_complex "${filterComplex}" "${outputPath}"`;
      } else {
        // Simple concatenation (no crossfade, no silence)
        const concatFile = path.join(COMP_OUTPUT_PATH, `concat_${timestamp}.txt`);
        const concatContent = takeFilePaths.map(f => `file '${f}'`).join('\n');
        fs.writeFileSync(concatFile, concatContent);

        const normalizeFilter = normalize ? '-af "loudnorm"' : '';
        ffmpegCommand = `ffmpeg -f concat -safe 0 -i "${concatFile}" ${normalizeFilter} -c:a aac "${outputPath}"`;
      }

      // Execute ffmpeg
      console.log('Running ffmpeg...');
      await execAsync(ffmpegCommand);

      // Get output file stats
      const stats = fs.statSync(outputPath);

      // Get duration using ffprobe
      const { stdout: durationOutput } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outputPath}"`
      );
      const duration = parseFloat(durationOutput.trim());

      console.log(`✅ Comped ${takeFilePaths.length} takes into: ${outputFileName}`);
      console.log(`   Duration: ${duration.toFixed(2)}s`);
      console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

      // LIVE SYNC: Copy comp to main Voice Memos folder so it appears in Voice Memos app
      const mainFolderPath = path.join(VOICE_MEMOS_MAIN_PATH, outputFileName);
      fs.copyFileSync(outputPath, mainFolderPath);
      console.log(`📱 Synced to Voice Memos app: ${outputFileName}`);

      return {
        success: true,
        compedFilePath: outputPath,
        duration,
        fileSize: stats.size,
        takesCount: takeFilePaths.length,
      };
    } catch (error) {
      console.error('Voice memo comping error:', error);
      return {
        success: false,
        takesCount: takeFilePaths.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build ffmpeg filter complex for crossfade
   */
  private buildCrossfadeFilterComplex(fileCount: number, crossfadeDuration: number, normalize: boolean): string {
    if (fileCount === 2) {
      // Simple 2-file crossfade
      const filter = `[0:a][1:a]acrossfade=d=${crossfadeDuration}:c1=tri:c2=tri`;
      return normalize ? `${filter},loudnorm[out]` : `${filter}[out]`;
    }

    // Multi-file crossfade chain
    let filter = '';
    for (let i = 0; i < fileCount - 1; i++) {
      const input1 = i === 0 ? '0:a' : `cf${i - 1}`;
      const input2 = `${i + 1}:a`;
      const output = i === fileCount - 2 ? 'out' : `cf${i}`;
      filter += `[${input1}][${input2}]acrossfade=d=${crossfadeDuration}:c1=tri:c2=tri[${output}];`;
    }

    // Remove trailing semicolon
    filter = filter.slice(0, -1);

    return normalize ? `${filter};[out]loudnorm[final]` : filter;
  }

  /**
   * Build ffmpeg filter complex for silence between takes
   */
  private buildSilenceFilterComplex(fileCount: number, silenceDuration: number, normalize: boolean): string {
    // Generate silence
    const silenceFilter = `aevalsrc=0:d=${silenceDuration}[silence]`;

    // Concatenate with silence between
    let inputs = '';
    for (let i = 0; i < fileCount; i++) {
      inputs += `[${i}:a]`;
      if (i < fileCount - 1) {
        inputs += '[silence]';
      }
    }

    const concatFilter = `${inputs}concat=n=${fileCount * 2 - 1}:v=0:a=1[out]`;

    const fullFilter = `${silenceFilter};${concatFilter}`;

    return normalize ? `${fullFilter};[out]loudnorm[final]` : fullFilter;
  }

  /**
   * Comp voice memos by note IDs with intelligent naming
   */
  async compVoiceMemosByNoteIds(
    noteIds: string[],
    options: CompOptions = {}
  ): Promise<CompResult> {
    try {
      // Import prisma to fetch note file paths
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const notes = await prisma.note.findMany({
        where: { id: { in: noteIds } },
        include: { voiceMemo: true },
      });

      const filePaths = notes
        .filter(note => note.voiceMemo?.filePath)
        .map(note => note.voiceMemo!.filePath);

      if (filePaths.length === 0) {
        throw new Error('No voice memo files found for provided note IDs');
      }

      // Intelligently name the comp based on combined lyrics
      if (!options.outputFileName && notes.length > 0) {
        const combinedLyrics = notes.map(n => n.content).join('\n\n');

        console.log('Generating intelligent tags for comp...');
        const tags = await taggingService.tagVoiceMemo({
          lyrics: combinedLyrics,
          structure: undefined,
          fileName: undefined,
        });

        // Use suggested filename with _COMP suffix
        const outputFormat = options.outputFormat || 'm4a';
        options.outputFileName = `${tags.suggestedFilename}_COMP.${outputFormat}`;

        console.log(`Smart filename: ${options.outputFileName}`);
        console.log(`  Song: ${tags.songTitle || 'Untitled'}`);
        console.log(`  Segment: ${tags.segment}`);
        console.log(`  Keywords: ${tags.keywords.slice(0, 3).join(', ')}`);
      }

      await prisma.$disconnect();

      return await this.compVoiceMemos(filePaths, options);
    } catch (error) {
      console.error('Comp by note IDs error:', error);
      return {
        success: false,
        takesCount: noteIds.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List all comped files
   */
  listCompedFiles(): string[] {
    try {
      if (!fs.existsSync(COMP_OUTPUT_PATH)) {
        return [];
      }

      return fs.readdirSync(COMP_OUTPUT_PATH)
        .filter(file => file.startsWith('JARVIS_COMP_'))
        .map(file => path.join(COMP_OUTPUT_PATH, file));
    } catch {
      return [];
    }
  }

  /**
   * Get comp output path
   */
  getCompOutputPath(): string {
    return COMP_OUTPUT_PATH;
  }
}

export const voiceMemoCompService = new VoiceMemoCompService();
