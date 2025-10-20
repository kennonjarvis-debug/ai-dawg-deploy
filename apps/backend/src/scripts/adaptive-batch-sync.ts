#!/usr/bin/env tsx
/**
 * Adaptive Batch Voice Memos Sync
 * JARVIS learns from each batch and improves processing
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { adaptiveLearningService } from '../services/notes/adaptive-learning.service.js';
import { learningLogService } from '../services/notes/learning-log.service.js';
import { logger } from '../../../src/lib/utils/logger.js';

const prisma = new PrismaClient();

const VOICE_MEMOS_PATH = '/Users/benkennon/Library/Group Containers/group.com.apple.VoiceMemos.shared/Recordings';
const TEMP_DIR = '/tmp/voice-memos-adaptive';
const PROGRESS_FILE = '/tmp/adaptive-sync-progress.json';
const BATCH_SIZE = 10;

interface AdaptiveProgress {
  totalFiles: number;
  processedFiles: number;
  currentBatch: number;
  lastProcessedFile: string;
  batchResults: any[];
}

async function syncAdaptiveBatch(maxBatches: number = 2) {
  logger.info('🎵 JARVIS Adaptive Learning Voice Memo Processor');
  logger.info('================================================');
  logger.info('JARVIS will learn from each batch and improve!\n');

  // Load progress
  let progress: AdaptiveProgress = fs.existsSync(PROGRESS_FILE)
    ? JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'))
    : { totalFiles: 0, processedFiles: 0, currentBatch: 0, lastProcessedFile: '', batchResults: [] };

  // Get all voice memos (sorted newest to oldest)
  const allFiles = fs.readdirSync(VOICE_MEMOS_PATH)
    .filter(file => file.endsWith('.m4a'))
    .map(file => ({
      name: file,
      mtime: fs.statSync(path.join(VOICE_MEMOS_PATH, file)).mtime.getTime(),
    }))
    .sort((a, b) => b.mtime - a.mtime)
    .map(f => f.name);

  progress.totalFiles = allFiles.length;

  // Show learning stats
  const stats = adaptiveLearningService.getLearningStats();
  logger.info('📚 Current Learning State:');
  logger.info('   Batches analyzed: ${stats.totalBatchesAnalyzed}');
  logger.info('   Parsing rules learned: ${stats.improvements.parsingRules.length}');
  logger.info('   Average confidence: ${(stats.performanceMetrics.averageConfidence * 100).toFixed(1)}%');
  console.log('');

  // Process batches
  for (let i = 0; i < maxBatches; i++) {
    if (progress.processedFiles >= allFiles.length) {
      logger.info('✅ All files processed!');
      break;
    }

    const batchNum = progress.currentBatch + 1;
    const startIdx = progress.processedFiles;
    const batch = allFiles.slice(startIdx, startIdx + BATCH_SIZE);

    console.log('\n' + '='.repeat(50));
    logger.info('📦 BATCH ${batchNum} (Files ${startIdx + 1}-${startIdx + batch.length})');
    logger.info('   Progress: ${((startIdx / allFiles.length) * 100).toFixed(1)}%');
    console.log('='.repeat(50) + '\n');

    // Create temp directory
    fs.mkdirSync(TEMP_DIR, { recursive: true });

    // Copy files
    logger.info('📋 Preparing batch files...');
    for (const file of batch) {
      fs.copyFileSync(
        path.join(VOICE_MEMOS_PATH, file),
        path.join(TEMP_DIR, file)
      );
    }

    // Process batch - import with transcription
    logger.info('🎤 Transcribing and parsing...\n');

    const batchResults: any[] = [];

    for (const file of batch) {
      try {
        const filePath = path.join(TEMP_DIR, file);

        // Get file info
        const { importService } = await import('../services/notes/import.service.js');
        const result = await importService.importVoiceMemo(filePath, {
          autoTranscribe: true,
          autoAnalyze: true,
          appContext: 'dawg_ai',
        });

        if (result.note) {
          // Get the voice memo data from database
          const voiceMemo = await prisma.voiceMemo.findUnique({
            where: { noteId: result.note.id },
          });

          batchResults.push({
            fileName: file,
            noteId: result.note.id,
            originalTranscription: voiceMemo?.transcription || '',
            cleanedLyrics: result.note.content,
            confidence: 0.8, // Default
            hasBackgroundMusic: (voiceMemo?.transcription?.length || 0) > result.note.content.length,
          });

          logger.info('✅ ${file}');
          logger.info('   Transcribed: ${result.note.metadata.wordCount} words');
        }
      } catch (error) {
        console.error(`❌ ${file}: ${error instanceof Error ? error.message : 'Error'}`);
      }
    }

    // Clean up temp files
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });

    logger.info('\n📊 Batch Complete: ${batchResults.length}/${batch.length} processed');

    // JARVIS LEARNS FROM THIS BATCH
    console.log('\n' + '='.repeat(50));
    logger.info('🧠 JARVIS LEARNING PHASE');
    console.log('='.repeat(50));

    const learning = await adaptiveLearningService.analyzeBatchAndLearn({
      memos: batchResults,
    });

    // Show what JARVIS learned
    if (learning.insights.length > 0) {
      logger.info('\n💡 Insights Discovered:');
      learning.insights.forEach(insight => logger.info('   • ${insight}'););
      learningLogService.logInsights(batchNum, learning.insights);
    }

    if (learning.newRules.length > 0) {
      logger.info('\n📝 New Rules Added:');
      learning.newRules.forEach(rule => logger.info('   • ${rule}'););
      learningLogService.logRules(batchNum, learning.newRules);
    }

    if (learning.improvements.length > 0) {
      logger.info('\n🔧 Improvements for Next Batch:');
      learning.improvements.forEach(imp => logger.info('   • ${imp}'););
      learningLogService.logImprovements(batchNum, learning.improvements);
    }

    // JARVIS MANAGES NOTES (update, delete, merge)
    console.log('\n' + '='.repeat(50));
    logger.info('📝 JARVIS NOTE MANAGEMENT PHASE');
    console.log('='.repeat(50));

    const management = await adaptiveLearningService.analyzeAndManageNotes({
      memos: batchResults,
    });

    if (management.actions.length > 0) {
      logger.info('\n✨ Executing ${management.actions.length} actions...');

      for (const action of management.actions) {
        try {
          if (action.type === 'delete') {
            await prisma.note.delete({ where: { id: action.noteId } });
            logger.info('   🗑️  Deleted: ${action.reason}');
          } else if (action.type === 'merge') {
            // Merge notes: combine content from source notes into target
            const sourceNotes = await prisma.note.findMany({
              where: { id: { in: action.sourceNoteIds || [] } },
            });
            const targetNote = await prisma.note.findUnique({
              where: { id: action.noteId },
            });

            if (targetNote && sourceNotes.length > 0) {
              // Combine content
              const mergedContent = [
                targetNote.content,
                ...sourceNotes.map(n => n.content),
              ].join('\n\n---\n\n');

              await prisma.note.update({
                where: { id: action.noteId },
                data: { content: mergedContent },
              });

              // Delete source notes
              await prisma.note.deleteMany({
                where: { id: { in: action.sourceNoteIds || [] } },
              });

              logger.info('   🔗 Merged ${sourceNotes.length} notes: ${action.reason}');
            }
          } else if (action.type === 'update') {
            await prisma.note.update({
              where: { id: action.noteId },
              data: action.updates,
            });
            logger.info('   ✏️  Updated: ${action.reason}');
          }
        } catch (error) {
          console.error(`   ❌ Action failed: ${error instanceof Error ? error.message : 'Error'}`);
        }
      }

      logger.info('\n✅ Management actions complete!');
      learningLogService.logActions(batchNum, management.actions);
    } else {
      logger.info('\n✅ No management actions needed - all notes are good!');
    }

    // Update progress
    progress.processedFiles += batch.length;
    progress.currentBatch = batchNum;
    progress.lastProcessedFile = batch[batch.length - 1];
    progress.batchResults.push({
      batch: batchNum,
      processed: batchResults.length,
      learning,
    });

    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

    logger.info('\n✅ Batch ${batchNum} complete and learning saved!');

    // Pause between batches
    if (i < maxBatches - 1 && progress.processedFiles < allFiles.length) {
      logger.info('\n⏳ Waiting 3 seconds before next batch...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(50));
  logger.info('📈 FINAL SUMMARY');
  console.log('='.repeat(50));

  const finalStats = adaptiveLearningService.getLearningStats();
  logger.info('\n📊 Processing Stats:');
  logger.info('   Total processed: ${progress.processedFiles}/${progress.totalFiles}');
  logger.info('   Batches completed: ${progress.currentBatch}');
  logger.info('   Remaining: ${progress.totalFiles - progress.processedFiles}');

  logger.info('\n🧠 Learning Stats:');
  logger.info('   Total batches analyzed: ${finalStats.totalBatchesAnalyzed}');
  logger.info('   Parsing rules learned: ${finalStats.improvements.parsingRules.length}');
  logger.info('   Common patterns found: ${finalStats.improvements.commonPatterns.length}');
  logger.info('   Average confidence: ${(finalStats.performanceMetrics.averageConfidence * 100).toFixed(1)}%');

  if (progress.processedFiles < progress.totalFiles) {
    logger.info('\n▶️  Run again to continue with improved processing!');
  } else {
    logger.info('\n🎉 All voice memos processed with adaptive learning!');
  }
}

// Run
const args = process.argv.slice(2);
const batches = args.find(arg => arg.startsWith('--batches='))?.split('=')[1];
const maxBatches = batches ? parseInt(batches) : 2;

syncAdaptiveBatch(maxBatches).catch(error => {
  logger.error('Fatal error', { error: error.message || String(error) });
  process.exit(1);
});
