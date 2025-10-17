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
  console.log('🎵 DAWG AI / JARVIS - iOS Notes Sync');
  console.log('=====================================');
  console.log(`App Context: ${appContext.toUpperCase()}`);
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
      console.log(`⏩ Skipping ${syncPath} (not found)`);
      continue;
    }

    console.log(`\n📂 Scanning: ${syncPath}`);

    try {
      const status = await importService.importFromDirectory(syncPath, {
        autoTranscribe: true,
        autoAnalyze: true,
        appContext,
      });

      totalNotesProcessed += status.notesProcessed;
      totalMemosProcessed += status.memosProcessed;
      allErrors.push(...status.errors);

      console.log(`  ✅ Imported ${status.notesProcessed} notes`);
      console.log(`  ✅ Imported ${status.memosProcessed} voice memos`);

      if (status.errors.length > 0) {
        console.log(`  ⚠️  ${status.errors.length} errors occurred`);
      }
    } catch (error) {
      const errorMsg = `Failed to sync ${syncPath}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`  ❌ ${errorMsg}`);
      allErrors.push(errorMsg);
    }
  }

  console.log('\n=====================================');
  console.log('📊 Sync Summary:');
  console.log(`  Notes processed: ${totalNotesProcessed}`);
  console.log(`  Voice memos processed: ${totalMemosProcessed}`);
  console.log(`  Errors: ${allErrors.length}`);

  if (allErrors.length > 0) {
    console.log('\n⚠️  Errors:');
    allErrors.forEach(err => console.log(`  - ${err}`));
  }

  // Now analyze and execute actions
  console.log('\n🤖 Analyzing content and executing actions...');

  const allNotes = await importService.getAllNotes();
  const recentNotes = allNotes.slice(-10); // Analyze last 10 notes

  for (const note of recentNotes) {
    try {
      console.log(`\n📝 Analyzing: "${note.title}"`);

      const analysis = await analysisService.analyzeNote(note, appContext);
      console.log(`  Type: ${analysis.contentType} (confidence: ${(analysis.confidence * 100).toFixed(0)}%)`);
      console.log(`  Summary: ${analysis.summary.substring(0, 100)}...`);

      if (analysis.suggestedActions.length > 0) {
        console.log(`  Suggested actions: ${analysis.suggestedActions.length}`);

        const results = await actionRouterService.executeActions(analysis, note);

        for (const result of results) {
          if (result.executed) {
            console.log(`    ✅ ${result.action.type}: ${result.action.description}`);
          } else {
            console.log(`    ❌ ${result.action.type}: ${result.error}`);
          }
        }
      } else {
        console.log(`  No actions suggested`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to analyze: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log('\n✅ Sync complete!');
  console.log('');
}

// Run the sync
syncNotes().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
