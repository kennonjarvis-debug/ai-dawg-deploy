/**
 * Creative Music Domain Agent
 *
 * Orchestrates the complete music creation workflow:
 * 1. Accept voice memos/notes from iPhone
 * 2. Isolate vocals from beats
 * 3. Transcribe vocals to text
 * 4. Analyze musical intent
 * 5. Compose full song
 * 6. Organize and tag intelligently
 */

import { BaseDomainAgent } from './base-domain.js';
import { logger } from '../../utils/logger.js';
import { vocalIsolationService } from '../../services/vocal-isolation-service.js';
import { transcriptionService } from '../../services/transcription-service.js';
import { contentAnalyzer } from '../../services/content-analyzer.js';
import {
  ClearanceLevel,
} from '../types.js';
import type {
  DomainType,
  AutonomousTask,
  TaskResult,
  DomainCapability,
} from '../types.js';
import type { MusicalIntent } from '../../services/content-analyzer.js';

export interface CreativeUpload {
  id: string;
  userId: string;
  type: 'voice-memo' | 'text-note' | 'image-note';
  filePath: string;
  fileName: string;
  uploadedAt: Date;
  status: 'uploaded' | 'processing' | 'analyzed' | 'composing' | 'completed' | 'failed';

  // Processing results
  vocalIsolation?: {
    vocalsPath: string;
    instrumentalsPath: string;
    hadBackingTrack: boolean;
  };
  transcription?: {
    text: string;
    language: string;
    confidence: number;
  };
  musicalIntent?: MusicalIntent;

  // Composition output
  songId?: string;
  error?: string;
}

export class CreativeMusicDomain extends BaseDomainAgent {
  domain: DomainType = 'creative_music' as DomainType;
  name = 'Creative Music Agent';
  description = 'Autonomous agent for music creation from voice memos and notes';

  private uploads: Map<string, CreativeUpload> = new Map();

  constructor(clearanceLevel?: ClearanceLevel) {
    super('Creative Music Agent', 'creative_music' as DomainType, clearanceLevel);
  }

  capabilities: DomainCapability[] = [
    {
      name: 'voice_memo_processing',
      description: 'Process voice memos: isolate vocals, transcribe, analyze',
      clearanceRequired: ClearanceLevel.EXECUTE,
      riskLevel: 'low',
    },
    {
      name: 'song_composition',
      description: 'Compose complete songs from voice memos and notes',
      clearanceRequired: ClearanceLevel.EXECUTE,
      riskLevel: 'medium',
    },
    {
      name: 'content_analysis',
      description: 'Analyze musical intent and extract composition parameters',
      clearanceRequired: ClearanceLevel.SUGGEST,
      riskLevel: 'low',
    },
    {
      name: 'intelligent_tagging',
      description: 'Auto-tag songs with genre, mood, themes',
      clearanceRequired: ClearanceLevel.EXECUTE,
      riskLevel: 'low',
    },
  ];

  /**
   * Initialize services
   */
  async initialize(): Promise<void> {
    logger.info('[CreativeMusicDomain] Initializing...');

    try {
      await vocalIsolationService.initialize();
      logger.info('[CreativeMusicDomain] Initialized successfully');
    } catch (error: any) {
      logger.error(`[CreativeMusicDomain] Initialization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze for new creative content to process
   */
  async analyze(): Promise<AutonomousTask[]> {
    const tasks: AutonomousTask[] = [];

    try {
      // Check for uploads in 'uploaded' status that need processing
      for (const [id, upload] of this.uploads.entries()) {
        if (upload.status === 'uploaded') {
          tasks.push({
            id: this.generateTaskId(),
            domain: this.domain,
            type: 'process_upload',
            title: `Process ${upload.type}: ${upload.fileName}`,
            description: `Process uploaded ${upload.type} and extract musical intent`,
            priority: 7,
            clearanceRequired: ClearanceLevel.EXECUTE,
            params: { uploadId: id },
            metadata: {},
            createdAt: new Date(),
          });
        }

        // Check for analyzed content ready for composition
        if (upload.status === 'analyzed' && upload.musicalIntent?.readyToCompose) {
          tasks.push({
            id: this.generateTaskId(),
            domain: this.domain,
            type: 'compose_song',
            title: `Compose song from: ${upload.fileName}`,
            description: `Create full song based on analyzed intent`,
            priority: 8,
            clearanceRequired: ClearanceLevel.EXECUTE,
            params: { uploadId: id },
            metadata: {},
            createdAt: new Date(),
          });
        }
      }

      logger.info(`[CreativeMusicDomain] Identified ${tasks.length} opportunities`);
    } catch (error) {
      logger.error('[CreativeMusicDomain] Analysis failed:', error);
    }

    return tasks;
  }

  /**
   * Execute task
   */
  protected async executeTask(task: AutonomousTask): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      let result: any;

      switch (task.type) {
        case 'process_upload':
          result = await this.processUpload(task.params.uploadId);
          break;

        case 'compose_song':
          result = await this.composeSong(task.params.uploadId);
          break;

        case 'analyze_intent':
          result = await this.analyzeIntent(task.params.uploadId);
          break;

        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      const executionTime = Date.now() - startTime;

      return {
        taskId: task.id,
        success: true,
        message: `Task completed successfully`,
        output: result,
        executionTime,
        timestamp: new Date(),
      };
    } catch (error: any) {
      logger.error(`[CreativeMusicDomain] Task execution failed:`, error);

      return {
        taskId: task.id,
        success: false,
        message: `Task failed: ${error.message}`,
        output: null,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Process uploaded voice memo or note
   */
  async processUpload(uploadId: string): Promise<{
    uploadId: string;
    status: string;
    musicalIntent?: MusicalIntent;
    transcription?: string;
  }> {
    const upload = this.uploads.get(uploadId);

    if (!upload) {
      throw new Error(`Upload not found: ${uploadId}`);
    }

    logger.info(`[CreativeMusicDomain] Processing upload: ${upload.fileName}`);

    upload.status = 'processing';

    try {
      // Step 1: Handle different upload types
      let transcriptionText: string;
      let transcriptionResult: any;

      if (upload.type === 'voice-memo') {
        // Step 1a: Isolate vocals from backing track
        logger.info('[CreativeMusicDomain] Step 1: Isolating vocals...');

        const vocalIsolation = await vocalIsolationService.isolateVocals(upload.filePath, {
          model: 'auto',
          enhanceVocals: true,
          keepInstrumentals: true,
        });

        upload.vocalIsolation = {
          vocalsPath: vocalIsolation.vocals.path,
          instrumentalsPath: vocalIsolation.instrumentals.path,
          hadBackingTrack: vocalIsolation.originalHadBackingTrack,
        };

        logger.info(
          `[CreativeMusicDomain] Vocals isolated (confidence: ${vocalIsolation.confidence.toFixed(2)})`
        );

        // Step 1b: Transcribe isolated vocals
        logger.info('[CreativeMusicDomain] Step 2: Transcribing vocals...');

        transcriptionResult = await transcriptionService.transcribe(vocalIsolation.vocals.path, {
          includeTimestamps: true,
          includeWordTimestamps: true,
        });

        transcriptionText = transcriptionResult.text;

        upload.transcription = {
          text: transcriptionText,
          language: transcriptionResult.language,
          confidence: transcriptionResult.confidence,
        };

        logger.info(
          `[CreativeMusicDomain] Transcription complete: ${transcriptionText.substring(0, 100)}...`
        );
      } else if (upload.type === 'text-note') {
        // Read text file directly
        const fs = await import('fs/promises');
        transcriptionText = await fs.readFile(upload.filePath, 'utf-8');

        upload.transcription = {
          text: transcriptionText,
          language: 'en',
          confidence: 1.0,
        };

        transcriptionResult = {
          text: transcriptionText,
          language: 'en',
          duration: 0,
          confidence: 1.0,
        };
      } else {
        throw new Error(`Unsupported upload type: ${upload.type}`);
      }

      // Step 2: Analyze musical intent
      logger.info('[CreativeMusicDomain] Step 3: Analyzing musical intent...');

      const musicalIntent = await contentAnalyzer.analyzeVoiceMemo(transcriptionResult);

      upload.musicalIntent = musicalIntent;
      upload.status = 'analyzed';

      logger.info(
        `[CreativeMusicDomain] Analysis complete - Genre: ${musicalIntent.genre.primary}, Mood: ${musicalIntent.mood.primary}, BPM: ${musicalIntent.tempo.bpm}`
      );

      // Generate composition brief
      const compositionBrief = contentAnalyzer.generateCompositionBrief(musicalIntent);
      logger.info(`[CreativeMusicDomain] Composition Brief:\n${compositionBrief}`);

      return {
        uploadId,
        status: 'analyzed',
        musicalIntent,
        transcription: transcriptionText,
      };
    } catch (error: any) {
      upload.status = 'failed';
      upload.error = error.message;
      logger.error(`[CreativeMusicDomain] Processing failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Compose complete song from analyzed content
   */
  private async composeSong(uploadId: string): Promise<{
    uploadId: string;
    songId: string;
    status: string;
    composition?: {
      lyrics?: string;
      instrumentalPath?: string;
      finalMixPath?: string;
    };
  }> {
    const upload = this.uploads.get(uploadId);

    if (!upload || !upload.musicalIntent) {
      throw new Error(`Upload not ready for composition: ${uploadId}`);
    }

    logger.info(`[CreativeMusicDomain] Composing song from upload: ${upload.fileName}`);

    upload.status = 'composing';

    try {
      // Generate unique song ID
      const songId = `song-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const outputDir = `/tmp/jarvis-compositions/${songId}`;
      await import('fs/promises').then(fs => fs.mkdir(outputDir, { recursive: true }));

      const compositionResult: any = {};

      // Step 1: Generate/refine lyrics if needed
      logger.info(`[CreativeMusicDomain] Step 1/3: Generating lyrics...`);

      const { lyricGenerator } = await import('../../services/lyric-generator.js');

      const generatedLyrics = await lyricGenerator.generateLyrics(upload.musicalIntent, {
        existingLyrics: upload.transcription?.text,
        targetDuration: 180, // 3 minutes
      });

      compositionResult.lyrics = generatedLyrics.fullLyrics;
      logger.info(`[CreativeMusicDomain] ✓ Lyrics generated (${generatedLyrics.metadata.wordCount} words)`);

      // Step 2: Generate instrumental/beat
      logger.info(`[CreativeMusicDomain] Step 2/3: Generating instrumental...`);

      const { musicGenerator } = await import('../../services/music-generator.js');

      const generatedMusic = await musicGenerator.generateMusic({
        musicalIntent: upload.musicalIntent,
        lyrics: generatedLyrics.fullLyrics,
        duration: generatedLyrics.metadata.estimatedDuration,
        includeVocals: false, // Just instrumental for now
      });

      compositionResult.instrumentalPath = generatedMusic.localPath || generatedMusic.audioUrl;
      logger.info(`[CreativeMusicDomain] ✓ Instrumental generated`);

      // Step 3: Mix final track (vocals + instrumental if available)
      logger.info(`[CreativeMusicDomain] Step 3/3: Mixing final track...`);

      const { audioMixer } = await import('../../services/audio-mixer.js');
      await audioMixer.initialize();

      const finalMixPath = `${outputDir}/final-mix.mp3`;

      if (upload.vocalIsolation?.vocalsPath && generatedMusic.localPath) {
        // Mix isolated vocals with generated instrumental
        const mixResult = await audioMixer.mixVocalsWithBeat(
          upload.vocalIsolation.vocalsPath,
          generatedMusic.localPath,
          finalMixPath,
          {
            vocalVolume: 1.0,
            beatVolume: 0.8,
            mastering: true,
          }
        );

        compositionResult.finalMixPath = mixResult.outputPath;
        logger.info(`[CreativeMusicDomain] ✓ Final mix created with vocals`);
      } else if (generatedMusic.localPath) {
        // No vocals, just use the instrumental
        compositionResult.finalMixPath = generatedMusic.localPath;
        logger.info(`[CreativeMusicDomain] ✓ Instrumental-only track ready`);
      }

      // Save lyrics to file
      const lyricsPath = `${outputDir}/lyrics.txt`;
      await import('fs/promises').then(fs =>
        fs.writeFile(lyricsPath, generatedLyrics.fullLyrics)
      );

      upload.songId = songId;
      upload.status = 'completed';

      logger.info(`[CreativeMusicDomain] 🎉 Song composition complete: ${songId}`);
      logger.info(`[CreativeMusicDomain] Output directory: ${outputDir}`);

      // Step 4: Add to music library (Phase 3 integration)
      try {
        const { musicLibrary } = await import('../../services/music-library.js');

        const song = await musicLibrary.addSong({
          userId: upload.userId,
          audioPath: compositionResult.finalMixPath || compositionResult.instrumentalPath || '',
          musicalIntent: upload.musicalIntent,
          lyrics: compositionResult.lyrics,
          lyricsPath,
          title: upload.fileName.replace(/\.(txt|m4a|mp3|wav)$/i, ''),
          sourceType: 'voice-memo',
          sourceUploadId: uploadId,
          audioMetadata: {
            duration: generatedLyrics.metadata.estimatedDuration,
            fileSize: 0, // TODO: Get actual file size
            format: 'mp3',
          },
        });

        logger.info(`[CreativeMusicDomain] ✓ Added to music library with tags and organization`);
        logger.info(`[CreativeMusicDomain] Song organized into ${song.folders.length} folders`);
      } catch (error: any) {
        logger.warn(`[CreativeMusicDomain] Failed to add to library: ${error.message}`);
      }

      return {
        uploadId,
        songId,
        status: 'completed',
        composition: compositionResult,
      };
    } catch (error: any) {
      upload.status = 'failed';
      upload.error = error.message;
      logger.error(`[CreativeMusicDomain] Composition failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze intent only (without composition)
   */
  private async analyzeIntent(uploadId: string): Promise<MusicalIntent> {
    const upload = this.uploads.get(uploadId);

    if (!upload) {
      throw new Error(`Upload not found: ${uploadId}`);
    }

    if (upload.musicalIntent) {
      return upload.musicalIntent;
    }

    // Process if not already done
    const result = await this.processUpload(uploadId);
    return result.musicalIntent!;
  }

  /**
   * Register new upload
   */
  registerUpload(upload: Omit<CreativeUpload, 'status' | 'uploadedAt'>): string {
    const fullUpload: CreativeUpload = {
      ...upload,
      status: 'uploaded',
      uploadedAt: new Date(),
    };

    this.uploads.set(upload.id, fullUpload);

    logger.info(`[CreativeMusicDomain] Registered upload: ${upload.id} - ${upload.fileName}`);

    return upload.id;
  }

  /**
   * Get upload status
   */
  getUploadStatus(uploadId: string): CreativeUpload | undefined {
    return this.uploads.get(uploadId);
  }

  /**
   * Get all uploads for a user
   */
  getUserUploads(userId: string): CreativeUpload[] {
    return Array.from(this.uploads.values()).filter((u) => u.userId === userId);
  }

  /**
   * Generate task ID
   */
  private generateTaskId(): string {
    return `creative-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
