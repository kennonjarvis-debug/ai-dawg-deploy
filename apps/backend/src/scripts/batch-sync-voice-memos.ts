#!/usr/bin/env tsx
/**
 * Batch Voice Memos Sync Script
 * Processes all voice memos in batches of 10, newest to oldest
 * Tracks progress and can resume from where it left off
 */

import fs from 'fs';
import path from 'path';
import { importService } from '../services/notes/import.service.js';

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
      console.log('📂 Loading previous progress...');
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
    console.log('📂 Scanning voice memos directory...');

    const files = fs.readdirSync(VOICE_MEMOS_PATH)
      .filter(file => file.endsWith('.m4a'))
      .map(file => ({
        name: file,
        path: path.join(VOICE_MEMOS_PATH, file),
        mtime: fs.statSync(path.join(VOICE_MEMOS_PATH, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime) // Newest first
      .map(file => file.name);

    console.log(`✅ Found ${files.length} voice memo files`);
    return files;
  }

  /**
   * Get next batch of files to process
   */
  private getNextBatch(allFiles: string[]): string[] {
    const startIndex = this.progress.processedFiles;
    const batch = allFiles.slice(startIndex, startIndex + BATCH_SIZE);

    console.log(`\n📦 Batch ${this.progress.currentBatch + 1}`);
    console.log(`   Files ${startIndex + 1}-${startIndex + batch.length} of ${allFiles.length}`);
    console.log(`   Progress: ${((startIndex / allFiles.length) * 100).toFixed(1)}%`);

    return batch;
  }

  /**
   * Process a batch of voice memos
   */
  async processBatch(files: string[]): Promise<void> {
    // Create temp directory for this batch
    fs.mkdirSync(TEMP_DIR, { recursive: true });

    // Copy files to temp directory
    console.log('\n📋 Copying files to temp directory...');
    for (const file of files) {
      const sourcePath = path.join(VOICE_MEMOS_PATH, file);
      const destPath = path.join(TEMP_DIR, file);
      fs.copyFileSync(sourcePath, destPath);
    }

    console.log(`✅ Copied ${files.length} files`);
    console.log('\n🎤 Starting transcription and analysis...\n');

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
        console.log(`\n⚠️  ${status.errors.length} errors in this batch`);
        this.progress.errors.push(...status.errors.slice(0, 5)); // Keep first 5 errors
      }

      // Update progress
      this.progress.processedFiles += files.length;
      this.progress.currentBatch += 1;
      this.progress.lastProcessedFile = files[files.length - 1];

      console.log('\n📊 Batch Stats:');
      console.log(`   Memos processed: ${status.memosProcessed}`);
      console.log(`   Errors: ${status.errors.length}`);

    } catch (error) {
      console.error('❌ Batch processing error:', error);
      this.progress.errors.push(`Batch ${this.progress.currentBatch}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Clean up temp directory
    console.log('\n🧹 Cleaning up temp files...');
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });

    // Save progress
    this.saveProgress();
  }

  /**
   * Run the batch processor
   */
  async run(maxBatches?: number): Promise<void> {
    console.log('🎵 JARVIS Voice Memos Batch Processor');
    console.log('====================================');
    console.log(`App Context: ${APP_CONTEXT.toUpperCase()}`);
    console.log(`Batch Size: ${BATCH_SIZE} files per batch`);
    console.log('');

    const allFiles = this.getAllVoiceMemos();
    this.progress.totalFiles = allFiles.length;

    // Check if already completed
    if (this.progress.processedFiles >= allFiles.length) {
      console.log('✅ All voice memos have been processed!');
      this.printSummary();
      return;
    }

    // Resume from where we left off
    if (this.progress.processedFiles > 0) {
      console.log(`\n▶️  Resuming from batch ${this.progress.currentBatch + 1}`);
      console.log(`   Already processed: ${this.progress.processedFiles} files`);
      console.log(`   Remaining: ${allFiles.length - this.progress.processedFiles} files`);
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
        console.log(`\n⏸️  Reached max batches limit (${maxBatches})`);
        console.log('   Run again to continue processing');
        break;
      }

      // Add a small delay between batches to avoid rate limits
      if (this.progress.processedFiles < allFiles.length) {
        console.log('\n⏳ Waiting 2 seconds before next batch...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Print final summary
    console.log('\n====================================');
    this.printSummary();
  }

  /**
   * Print progress summary
   */
  private printSummary(): void {
    const percentComplete = ((this.progress.processedFiles / this.progress.totalFiles) * 100).toFixed(1);

    console.log('\n📊 Overall Progress:');
    console.log(`   Total files: ${this.progress.totalFiles}`);
    console.log(`   Processed: ${this.progress.processedFiles} (${percentComplete}%)`);
    console.log(`   Remaining: ${this.progress.totalFiles - this.progress.processedFiles}`);
    console.log(`   Batches completed: ${this.progress.currentBatch}`);
    console.log('');
    console.log('📈 Stats:');
    console.log(`   Total memos imported: ${this.progress.stats.totalMemos}`);
    console.log(`   Total notes created: ${this.progress.stats.totalNotes}`);
    console.log(`   Total errors: ${this.progress.stats.totalErrors}`);

    if (this.progress.errors.length > 0) {
      console.log('');
      console.log('⚠️  Recent Errors:');
      this.progress.errors.slice(-5).forEach(err => console.log(`   - ${err}`));
    }

    console.log('');
    console.log(`Started: ${this.progress.startedAt}`);
    console.log(`Last updated: ${this.progress.lastUpdatedAt}`);

    if (this.progress.processedFiles >= this.progress.totalFiles) {
      console.log('');
      console.log('✅ All voice memos processed!');
    } else {
      console.log('');
      console.log('▶️  Run this script again to continue processing');
    }
  }

  /**
   * Reset progress (start over)
   */
  static reset(): void {
    if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE);
      console.log('✅ Progress reset. Starting fresh...');
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
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
})();
