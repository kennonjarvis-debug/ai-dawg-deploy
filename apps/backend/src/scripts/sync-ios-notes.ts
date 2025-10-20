#!/usr/bin/env tsx
/**
 * iOS Notes and Voice Memos Sync Script
 * Automatically syncs notes from iOS devices
 *
 * Usage:
 *   tsx src/scripts/sync-ios-notes.ts [--app jarvis|dawg_ai] [--path /path/to/notes]
 */

import { importService } from '../services/notes/import.service.js';
import { analysisService } from '../services/notes/analysis.service.js';
import { actionRouterService } from '../services/notes/action-router.service.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { logger } from '../../../src/lib/utils/logger.js';

// Parse command line arguments
const args = process.argv.slice(2);
const appContext = (args.find(arg => arg.startsWith('--app'))?.split('=')[1] || 'dawg_ai') as 'jarvis' | 'dawg_ai';
const customPath = args.find(arg => arg.startsWith('--path'))?.split('=')[1];

// Default iOS paths (expand ~ to home directory)
const expandPath = (p: string) => p.replace('~', os.homedir());

const DEFAULT_PATHS = {
  // iCloud Drive notes (if synced to Mac)
  notes: expandPath('~/Library/Mobile Documents/com~apple~Notes/Documents'),
  // Voice memos from iPhone (if synced via iCloud)
  voiceMemos: expandPath('~/Library/Application Support/com.apple.VoiceMemos/Recordings'),
  // Alternative: iCloud Drive voice memos
  icloudVoiceMemos: expandPath('~/Library/Mobile Documents/iCloud~com~apple~VoiceMemos/Documents'),
};

async function syncNotes() {
  logger.info('🎵 DAWG AI / JARVIS - iOS Notes Sync');
  logger.info('=====================================');
  logger.info('App Context: ${appContext.toUpperCase()}');
  console.log('');

  // Use custom path or try default paths
  const pathsToTry = customPath
    ? [customPath]
    : [DEFAULT_PATHS.notes, DEFAULT_PATHS.voiceMemos, DEFAULT_PATHS.icloudVoiceMemos];

  let totalNotesProcessed = 0;
  let totalMemosProcessed = 0;
  const allErrors: string[] = [];

  for (const syncPath of pathsToTry) {
    if (!fs.existsSync(syncPath)) {
      logger.info('⏩ Skipping ${syncPath} (not found)');
      continue;
    }

    logger.info('\n📂 Scanning: ${syncPath}');

    try {
      const status = await importService.importFromDirectory(syncPath, {
        autoTranscribe: true,
        autoAnalyze: true,
        appContext,
      });

      totalNotesProcessed += status.notesProcessed;
      totalMemosProcessed += status.memosProcessed;
      allErrors.push(...status.errors);

      logger.info('  ✅ Imported ${status.notesProcessed} notes');
      logger.info('  ✅ Imported ${status.memosProcessed} voice memos');

      if (status.errors.length > 0) {
        logger.info('  ⚠️  ${status.errors.length} errors occurred');
      }
    } catch (error) {
      const errorMsg = `Failed to sync ${syncPath}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error('  ❌ ${errorMsg}');
      allErrors.push(errorMsg);
    }
  }

  logger.info('\n=====================================');
  logger.info('📊 Sync Summary:');
  logger.info('  Notes processed: ${totalNotesProcessed}');
  logger.info('  Voice memos processed: ${totalMemosProcessed}');
  logger.info('  Errors: ${allErrors.length}');

  if (allErrors.length > 0) {
    logger.info('\n⚠️  Errors:');
    allErrors.forEach(err => logger.info('  - ${err}'););
  }

  // Now analyze and execute actions
  logger.info('\n🤖 Analyzing content and executing actions...');

  const allNotes = await importService.getAllNotes();
  const recentNotes = allNotes.slice(-10); // Analyze last 10 notes

  for (const note of recentNotes) {
    try {
      logger.info('\n📝 Analyzing: "${note.title}"');

      const analysis = await analysisService.analyzeNote(note, appContext);
      logger.info('  Type: ${analysis.contentType} (confidence: ${(analysis.confidence * 100).toFixed(0)}%)');
      logger.info('  Summary: ${analysis.summary.substring(0, 100)}...');

      if (analysis.suggestedActions.length > 0) {
        logger.info('  Suggested actions: ${analysis.suggestedActions.length}');

        const results = await actionRouterService.executeActions(analysis, note);

        for (const result of results) {
          if (result.executed) {
            logger.info('    ✅ ${result.action.type}: ${result.action.description}');
          } else {
            logger.info('    ❌ ${result.action.type}: ${result.error}');
          }
        }
      } else {
        logger.info('  No actions suggested');
      }
    } catch (error) {
      console.error(`  ❌ Failed to analyze: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  logger.info('\n✅ Sync complete!');
  console.log('');
}

// Run the sync
syncNotes().catch(error => {
  logger.error('❌ Fatal error', { error: error.message || String(error) });
  process.exit(1);
});
