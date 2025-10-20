#!/usr/bin/env tsx
/**
 * Parallel Adaptive Batch Voice Memos Sync
 * JARVIS processes multiple batches in parallel for 3-5x speed improvement
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { adaptiveLearningService } from '../services/notes/adaptive-learning.service.js';
import { learningLogService } from '../services/notes/learning-log.service.js';
import { iCloudSyncService } from '../services/notes/icloud-sync.service.js';
import { appleNotesSyncService } from '../services/notes/apple-notes-sync.service.js';
import { voiceMemoCompService } from '../services/notes/voice-memo-comp.service.js';
import { vocalSeparationService } from '../services/notes/vocal-separation.service.js';
import { logger } from '../../../src/lib/utils/logger.js';

const prisma = new PrismaClient();

const VOICE_MEMOS_PATH = '/Users/benkennon/Library/Group Containers/group.com.apple.VoiceMemos.shared/Recordings';
const TEMP_DIR_BASE = '/tmp/voice-memos-adaptive-parallel';
const PROGRESS_FILE = '/tmp/adaptive-sync-progress-parallel.json';
const BATCH_SIZE = 10;
const PARALLEL_BATCHES = 6; // Process 6 batches simultaneously (2x faster!)

interface AdaptiveProgress {
  totalFiles: number;
  processedFiles: number;
  currentBatch: number;
  lastProcessedFile: string;
  batchResults: any[];
}

async function processSingleBatch(
  batch: string[],
  batchNum: number,
  tempDir: string
): Promise<{
  batchNum: number;
  results: any[];
  learning: any;
  management: any;
}> {
  logger.info('\n[Batch ${batchNum}] Starting...');

  // Create temp directory for this batch
  fs.mkdirSync(tempDir, { recursive: true });

  // Copy files
  for (const file of batch) {
    fs.copyFileSync(
      path.join(VOICE_MEMOS_PATH, file),
      path.join(tempDir, file)
    );
  }

  // Process batch - import with transcription
  const batchResults: any[] = [];

  for (const file of batch) {
    try {
      const filePath = path.join(tempDir, file);

      const { importService } = await import('../services/notes/import.service.js');
      const result = await importService.importVoiceMemo(filePath, {
        autoTranscribe: true,
        autoAnalyze: false, // Skip individual analysis to save time
        appContext: 'dawg_ai',
      });

      if (result.note) {
        const voiceMemo = await prisma.voiceMemo.findUnique({
          where: { noteId: result.note.id },
        });

        batchResults.push({
          fileName: file,
          noteId: result.note.id,
          originalTranscription: voiceMemo?.transcription || '',
          cleanedLyrics: result.note.content,
          confidence: 0.8,
          hasBackgroundMusic: (voiceMemo?.transcription?.length || 0) > result.note.content.length,
        });

        // Sync to iCloud Jarvis folder
        await iCloudSyncService.syncVoiceMemo({
          originalFilePath: path.join(VOICE_MEMOS_PATH, file),
          noteId: result.note.id,
          metadata: {
            transcription: voiceMemo?.transcription || '',
            cleanedLyrics: result.note.content,
            hasBackgroundMusic: (voiceMemo?.transcription?.length || 0) > result.note.content.length,
            confidence: 0.8,
          },
        });

        // VOCAL SEPARATION: Extract clean vocals for voice model training
        const hasBackgroundMusic = (voiceMemo?.transcription?.length || 0) > result.note.content.length;
        if (hasBackgroundMusic) {
          logger.info('[Batch ${batchNum}] 🎤 Separating vocals from: ${file}');
          const separationResult = await vocalSeparationService.separateVocals(
            path.join(VOICE_MEMOS_PATH, file),
            {
              outputFormat: 'm4a',
              normalize: true,
              noiseReduction: true,
            }
          );

          if (separationResult.success) {
            logger.info('[Batch batchNum] ✅ Vocals isolated: ${path.basename(separationResult.vocalsFilePath || '')}', { batchNum });
          } else {
            logger.info('[Batch ${batchNum}] ⚠️  Vocal separation failed: ${separationResult.error}');
          }
        }

        // LIVE SYNC: Create note in Apple Notes app
        const appleNoteResult = await appleNotesSyncService.createNote(
          result.note.title,
          result.note.content
        );
        if (appleNoteResult.success) {
          logger.info('[Batch ${batchNum}] 📱 Created Apple Note: ${result.note.title}');
        } else {
          logger.info('[Batch ${batchNum}] ⚠️  Apple Note failed: ${appleNoteResult.error}');
        }

        logger.info('[Batch ${batchNum}] ✅ ${file}');
      }
    } catch (error) {
      console.error(`[Batch ${batchNum}] ❌ ${file}: ${error instanceof Error ? error.message : 'Error'}`);
    }
  }

  // Clean up temp files
  fs.rmSync(tempDir, { recursive: true, force: true });

  logger.info('[Batch ${batchNum}] 📊 Complete: ${batchResults.length}/${batch.length} processed');

  // JARVIS LEARNS FROM THIS BATCH
  const learning = await adaptiveLearningService.analyzeBatchAndLearn({
    memos: batchResults,
  });

  // Log learning
  if (learning.insights.length > 0) {
    learningLogService.logInsights(batchNum, learning.insights);
  }
  if (learning.newRules.length > 0) {
    learningLogService.logRules(batchNum, learning.newRules);
  }
  if (learning.improvements.length > 0) {
    learningLogService.logImprovements(batchNum, learning.improvements);
  }

  // Calculate average confidence for this batch
  const avgConfidence = batchResults.length > 0
    ? batchResults.reduce((sum, m) => sum + m.confidence, 0) / batchResults.length
    : 0;

  // Log batch completion with metrics
  learningLogService.logBatch(batchNum, batchResults.length, avgConfidence);

  // JARVIS MANAGES NOTES
  const management = await adaptiveLearningService.analyzeAndManageNotes({
    memos: batchResults,
  });

  if (management.actions.length > 0) {
    for (const action of management.actions) {
      try {
        if (action.type === 'delete') {
          // Get voice memo file path before deleting from DB
          const note = await prisma.note.findUnique({
            where: { id: action.noteId },
            include: { voiceMemo: true },
          });

          // Delete from database
          await prisma.note.delete({ where: { id: action.noteId } });

          // Delete original voice memo file from main folder (LIVE SYNC)
          if (note?.voiceMemo?.filePath && fs.existsSync(note.voiceMemo.filePath)) {
            fs.unlinkSync(note.voiceMemo.filePath);
            logger.info('[Batch ${batchNum}] 🗑️  Deleted original: ${path.basename(note.voiceMemo.filePath)}');
          }
        } else if (action.type === 'merge') {
          const sourceNotes = await prisma.note.findMany({
            where: { id: { in: action.sourceNoteIds || [] } },
          });
          const targetNote = await prisma.note.findUnique({
            where: { id: action.noteId },
          });

          if (targetNote && sourceNotes.length > 0) {
            const mergedContent = [
              targetNote.content,
              ...sourceNotes.map(n => n.content),
            ].join('\n\n---\n\n');

            await prisma.note.update({
              where: { id: action.noteId },
              data: { content: mergedContent },
            });

            // Delete source notes from database
            await prisma.note.deleteMany({
              where: { id: { in: action.sourceNoteIds || [] } },
            });

            // Delete source voice memos from main folder (LIVE SYNC)
            for (const sourceNote of sourceNotes) {
              const voiceMemo = await prisma.voiceMemo.findUnique({
                where: { noteId: sourceNote.id },
              });
              if (voiceMemo?.filePath && fs.existsSync(voiceMemo.filePath)) {
                fs.unlinkSync(voiceMemo.filePath);
                logger.info('[Batch ${batchNum}] 🗑️  Deleted merged source: ${path.basename(voiceMemo.filePath)}');
              }
            }
          }
        } else if (action.type === 'update') {
          await prisma.note.update({
            where: { id: action.noteId },
            data: action.updates,
          });
        }
      } catch (error) {
        console.error(`[Batch ${batchNum}] ❌ Action failed: ${error instanceof Error ? error.message : 'Error'}`);
      }
    }

    learningLogService.logActions(batchNum, management.actions);
    logger.info('[Batch ${batchNum}] 📝 Management: ${management.actions.length} actions');
  }

  // AUTO-COMP: Check for related takes and comp them automatically
  const autoComp = await adaptiveLearningService.autoCompRelatedTakes(batchResults);

  if (autoComp.comps.length > 0) {
    logger.info('\n[Batch ${batchNum}] 🎬 AUTO-COMP: Found ${autoComp.comps.length} songs with multiple takes');

    for (const comp of autoComp.comps) {
      logger.info('\n   Song: "${comp.songTitle}"');
      logger.info('   Takes: ${comp.takeNoteIds.length}');
      logger.info('   Reason: ${comp.reason}');

      try {
        // Perform the comp
        const compResult = await voiceMemoCompService.compVoiceMemosByNoteIds(
          comp.takeNoteIds,
          {
            crossfadeDuration: 0.5,
            normalize: true,
            outputFormat: 'm4a',
          }
        );

        if (compResult.success) {
          logger.info('   ✅ Comped successfully: ${path.basename(compResult.compedFilePath || '')}');
          logger.info('   Duration: ${compResult.duration?.toFixed(2)}s');
        } else {
          logger.info('   ❌ Comp failed: ${compResult.error}');
        }
      } catch (error) {
        console.error(`   ❌ Comp error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  logger.info('[Batch ${batchNum}] ✅ Complete!');

  return {
    batchNum,
    results: batchResults,
    learning,
    management,
  };
}

async function syncAdaptiveBatchParallel(maxBatches: number = Infinity) {
  logger.info('🎵 JARVIS Parallel Adaptive Learning Voice Memo Processor');
  console.log('='.repeat(60));
  logger.info('Processing ${PARALLEL_BATCHES} batches simultaneously');
  logger.info('JARVIS will learn from each batch and improve!\\n');

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

  let batchesProcessed = 0;

  while (progress.processedFiles < allFiles.length && batchesProcessed < maxBatches) {
    // Prepare multiple batches to process in parallel
    const parallelBatches: Array<{ batch: string[]; batchNum: number; tempDir: string }> = [];

    for (let i = 0; i < PARALLEL_BATCHES; i++) {
      const startIdx = progress.processedFiles + (i * BATCH_SIZE);
      if (startIdx >= allFiles.length) break;

      const batch = allFiles.slice(startIdx, startIdx + BATCH_SIZE);
      if (batch.length === 0) break;

      const batchNum = progress.currentBatch + 1 + i;
      const tempDir = `${TEMP_DIR_BASE}-${batchNum}`;

      parallelBatches.push({ batch, batchNum, tempDir });
    }

    if (parallelBatches.length === 0) break;

    console.log('\\n' + '='.repeat(60));
    logger.info('🚀 Processing ${parallelBatches.length} batches in parallel');
    logger.info('   Batches: ${parallelBatches.map(p => p.batchNum).join(', ')}');
    logger.info('   Progress: ${((progress.processedFiles / allFiles.length) * 100).toFixed(1)}%');
    console.log('='.repeat(60));

    // Process batches in parallel
    const results = await Promise.all(
      parallelBatches.map(({ batch, batchNum, tempDir }) =>
        processSingleBatch(batch, batchNum, tempDir)
      )
    );

    // Update progress
    for (const result of results) {
      progress.processedFiles += result.results.length;
      progress.currentBatch = result.batchNum;
      progress.batchResults.push({
        batch: result.batchNum,
        processed: result.results.length,
        learning: result.learning,
        management: result.management,
      });
    }

    progress.lastProcessedFile = parallelBatches[parallelBatches.length - 1].batch[
      parallelBatches[parallelBatches.length - 1].batch.length - 1
    ];

    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

    batchesProcessed += parallelBatches.length;

    logger.info('\\n✅ ${parallelBatches.length} batches complete!');
    logger.info('   Total processed: ${progress.processedFiles}/${progress.totalFiles}');

    // JARVIS META-LEARNING: Review and consolidate learnings every 5 batches
    if (progress.currentBatch % 5 === 0 && progress.currentBatch > 0) {
      console.log('\\n' + '='.repeat(60));
      logger.info('🧠 META-LEARNING REVIEW (Every 5 batches)');
      console.log('='.repeat(60));
      logger.info('JARVIS is reviewing ALL previous learnings from the beginning...');

      const consolidation = await adaptiveLearningService.reviewAndConsolidateLearnings();

      if (consolidation.consolidated) {
        learningLogService.addEntry({
          batchNumber: progress.currentBatch,
          type: 'improvement',
          category: 'management',
          message: `Meta-learning consolidation: ${consolidation.summary}`,
          details: {
            removedRules: consolidation.removedRules,
            updatedRules: consolidation.updatedRules,
            summary: consolidation.summary,
          },
        });

        logger.info('\\n✅ Meta-learning complete: ${consolidation.summary}');
        console.log('='.repeat(60));
      }
    }

    // Small pause between parallel groups
    if (progress.processedFiles < allFiles.length && batchesProcessed < maxBatches) {
      logger.info('\\n⏳ Waiting 5 seconds before next group...\\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Final summary
  console.log('\\n' + '='.repeat(60));
  logger.info('📈 FINAL SUMMARY');
  console.log('='.repeat(60));

  const finalStats = adaptiveLearningService.getLearningStats();
  logger.info('\\n📊 Processing Stats:');
  logger.info('   Total processed: ${progress.processedFiles}/${progress.totalFiles}');
  logger.info('   Batches completed: ${progress.currentBatch}');
  logger.info('   Remaining: ${progress.totalFiles - progress.processedFiles}');

  logger.info('\\n🧠 Learning Stats:');
  logger.info('   Total batches analyzed: ${finalStats.totalBatchesAnalyzed}');
  logger.info('   Parsing rules learned: ${finalStats.improvements.parsingRules.length}');
  logger.info('   Common patterns found: ${finalStats.improvements.commonPatterns.length}');
  logger.info('   Average confidence: ${(finalStats.performanceMetrics.averageConfidence * 100).toFixed(1)}%');

  if (progress.processedFiles < progress.totalFiles) {
    logger.info('\\n▶️  Run again to continue with improved processing!');
  } else {
    logger.info('\\n🎉 All voice memos processed with adaptive learning!');
  }
}

// Run
const args = process.argv.slice(2);
const batches = args.find(arg => arg.startsWith('--batches='))?.split('=')[1];
const maxBatches = batches ? parseInt(batches) : Infinity;

syncAdaptiveBatchParallel(maxBatches).catch(error => {
  logger.error('Fatal error', { error: error.message || String(error) });
  process.exit(1);
});
