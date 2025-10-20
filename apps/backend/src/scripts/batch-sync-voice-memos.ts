#!/usr/bin/env tsx
/**
 * Batch Voice Memos Sync Script
 * Processes all voice memos in batches of 10, newest to oldest
 * Tracks progress and can resume from where it left off
 */

import fs from 'fs';
import path from 'path';
import { importService } from '../services/notes/import.service.js';
import { logger } from '../../../src/lib/utils/logger.js';

// Configuration
const VOICE_MEMOS_PATH = '/Users/benkennon/Library/Group Containers/group.com.apple.VoiceMemos.shared/Recordings';
const TEMP_DIR = '/tmp/voice-memos-batch';
const PROGRESS_FILE = '/tmp/voice-memo-sync-progress.json';
const BATCH_SIZE = 10;
const APP_CONTEXT = 'dawg_ai'; // or 'jarvis'

interface SyncProgress {
  totalFiles: number;
  processedFiles: number;
  currentBatch: number;
  lastProcessedFile: string;
  startedAt: string;
  lastUpdatedAt: string;
  errors: string[];
  stats: {
    totalNotes: number;
    totalMemos: number;
    totalErrors: number;
  };
}

class VoiceMemosBatchProcessor {
  private progress: SyncProgress;

  constructor() {
    this.progress = this.loadProgress();
  }

  /**
   * Load progress from file or create new
   */
  private loadProgress(): SyncProgress {
    if (fs.existsSync(PROGRESS_FILE)) {
      logger.info('📂 Loading previous progress...');
      const data = fs.readFileSync(PROGRESS_FILE, 'utf-8');
      return JSON.parse(data);
    }

    return {
      totalFiles: 0,
      processedFiles: 0,
      currentBatch: 0,
      lastProcessedFile: '',
      startedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      errors: [],
      stats: {
        totalNotes: 0,
        totalMemos: 0,
        totalErrors: 0,
      },
    };
  }

  /**
   * Save progress to file
   */
  private saveProgress(): void {
    this.progress.lastUpdatedAt = new Date().toISOString();
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(this.progress, null, 2));
  }

  /**
   * Get all voice memo files sorted by date (newest first)
   */
  private getAllVoiceMemos(): string[] {
    logger.info('📂 Scanning voice memos directory...');

    const files = fs.readdirSync(VOICE_MEMOS_PATH)
      .filter(file => file.endsWith('.m4a'))
      .map(file => ({
        name: file,
        path: path.join(VOICE_MEMOS_PATH, file),
        mtime: fs.statSync(path.join(VOICE_MEMOS_PATH, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime) // Newest first
      .map(file => file.name);

    logger.info('✅ Found ${files.length} voice memo files');
    return files;
  }

  /**
   * Get next batch of files to process
   */
  private getNextBatch(allFiles: string[]): string[] {
    const startIndex = this.progress.processedFiles;
    const batch = allFiles.slice(startIndex, startIndex + BATCH_SIZE);

    logger.info('\n📦 Batch ${this.progress.currentBatch + 1}');
    logger.info('   Files ${startIndex + 1}-${startIndex + batch.length} of ${allFiles.length}');
    logger.info('   Progress: ${((startIndex / allFiles.length) * 100).toFixed(1)}%');

    return batch;
  }

  /**
   * Process a batch of voice memos
   */
  async processBatch(files: string[]): Promise<void> {
    // Create temp directory for this batch
    fs.mkdirSync(TEMP_DIR, { recursive: true });

    // Copy files to temp directory
    logger.info('\n📋 Copying files to temp directory...');
    for (const file of files) {
      const sourcePath = path.join(VOICE_MEMOS_PATH, file);
      const destPath = path.join(TEMP_DIR, file);
      fs.copyFileSync(sourcePath, destPath);
    }

    logger.info('✅ Copied ${files.length} files');
    logger.info('\n🎤 Starting transcription and analysis...\n');

    // Process with import service
    try {
      const status = await importService.importFromDirectory(TEMP_DIR, {
        autoTranscribe: true,
        autoAnalyze: true,
        appContext: APP_CONTEXT as 'jarvis' | 'dawg_ai',
      });

      // Update stats
      this.progress.stats.totalNotes += status.notesProcessed;
      this.progress.stats.totalMemos += status.memosProcessed;
      this.progress.stats.totalErrors += status.errors.length;

      if (status.errors.length > 0) {
        logger.info('\n⚠️  ${status.errors.length} errors in this batch');
        this.progress.errors.push(...status.errors.slice(0, 5)); // Keep first 5 errors
      }

      // Update progress
      this.progress.processedFiles += files.length;
      this.progress.currentBatch += 1;
      this.progress.lastProcessedFile = files[files.length - 1];

      logger.info('\n📊 Batch Stats:');
      logger.info('   Memos processed: ${status.memosProcessed}');
      logger.info('   Errors: ${status.errors.length}');

    } catch (error) {
      logger.error('❌ Batch processing error', { error: error.message || String(error) });
      this.progress.errors.push(`Batch ${this.progress.currentBatch}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Clean up temp directory
    logger.info('\n🧹 Cleaning up temp files...');
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });

    // Save progress
    this.saveProgress();
  }

  /**
   * Run the batch processor
   */
  async run(maxBatches?: number): Promise<void> {
    logger.info('🎵 JARVIS Voice Memos Batch Processor');
    logger.info('====================================');
    logger.info('App Context: ${APP_CONTEXT.toUpperCase()}');
    logger.info('Batch Size: ${BATCH_SIZE} files per batch');
    console.log('');

    const allFiles = this.getAllVoiceMemos();
    this.progress.totalFiles = allFiles.length;

    // Check if already completed
    if (this.progress.processedFiles >= allFiles.length) {
      logger.info('✅ All voice memos have been processed!');
      this.printSummary();
      return;
    }

    // Resume from where we left off
    if (this.progress.processedFiles > 0) {
      logger.info('\n▶️  Resuming from batch ${this.progress.currentBatch + 1}');
      logger.info('   Already processed: ${this.progress.processedFiles} files');
      logger.info('   Remaining: ${allFiles.length - this.progress.processedFiles} files');
    }

    let batchesProcessed = 0;

    // Process batches
    while (this.progress.processedFiles < allFiles.length) {
      const batch = this.getNextBatch(allFiles);

      if (batch.length === 0) break;

      await this.processBatch(batch);

      batchesProcessed++;

      // Stop if max batches reached
      if (maxBatches && batchesProcessed >= maxBatches) {
        logger.info('\n⏸️  Reached max batches limit (${maxBatches})');
        logger.info('   Run again to continue processing');
        break;
      }

      // Add a small delay between batches to avoid rate limits
      if (this.progress.processedFiles < allFiles.length) {
        logger.info('\n⏳ Waiting 2 seconds before next batch...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Print final summary
    logger.info('\n====================================');
    this.printSummary();
  }

  /**
   * Print progress summary
   */
  private printSummary(): void {
    const percentComplete = ((this.progress.processedFiles / this.progress.totalFiles) * 100).toFixed(1);

    logger.info('\n📊 Overall Progress:');
    logger.info('   Total files: ${this.progress.totalFiles}');
    logger.info('   Processed: ${this.progress.processedFiles} (${percentComplete}%)');
    logger.info('   Remaining: ${this.progress.totalFiles - this.progress.processedFiles}');
    logger.info('   Batches completed: ${this.progress.currentBatch}');
    console.log('');
    logger.info('📈 Stats:');
    logger.info('   Total memos imported: ${this.progress.stats.totalMemos}');
    logger.info('   Total notes created: ${this.progress.stats.totalNotes}');
    logger.info('   Total errors: ${this.progress.stats.totalErrors}');

    if (this.progress.errors.length > 0) {
      console.log('');
      logger.info('⚠️  Recent Errors:');
      this.progress.errors.slice(-5).forEach(err => logger.info('   - ${err}'););
    }

    console.log('');
    logger.info('Started: ${this.progress.startedAt}');
    logger.info('Last updated: ${this.progress.lastUpdatedAt}');

    if (this.progress.processedFiles >= this.progress.totalFiles) {
      console.log('');
      logger.info('✅ All voice memos processed!');
    } else {
      console.log('');
      logger.info('▶️  Run this script again to continue processing');
    }
  }

  /**
   * Reset progress (start over)
   */
  static reset(): void {
    if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE);
      logger.info('✅ Progress reset. Starting fresh...');
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const maxBatches = args.find(arg => arg.startsWith('--batches='))?.split('=')[1];
const reset = args.includes('--reset');
const status = args.includes('--status');

// Main execution
(async () => {
  try {
    if (reset) {
      VoiceMemosBatchProcessor.reset();
      return;
    }

    const processor = new VoiceMemosBatchProcessor();

    if (status) {
      processor['printSummary']();
      return;
    }

    const batchLimit = maxBatches ? parseInt(maxBatches) : undefined;
    await processor.run(batchLimit);

  } catch (error) {
    logger.error('❌ Fatal error', { error: error.message || String(error) });
    process.exit(1);
  }
})();
