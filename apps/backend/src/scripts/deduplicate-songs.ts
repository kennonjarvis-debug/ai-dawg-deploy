#!/usr/bin/env tsx
/**
 * Deduplicate Songs in Apple Notes
 * Finds and removes duplicate songs based on title similarity
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../../../src/lib/utils/logger.js';

const execAsync = promisify(exec);

interface Note {
  id: string;
  title: string;
}

/**
 * Get all notes from JARVIS - Complete folder
 */
async function getAllNotes(): Promise<Note[]> {
  try {
    const appleScript = `
      tell application "Notes"
        set noteList to {}
        try
          repeat with eachNote in notes of folder "JARVIS - Complete"
            set noteTitle to name of eachNote
            set noteId to id of eachNote
            set end of noteList to noteTitle & "|" & noteId
          end repeat
        end try
        return noteList
      end tell
    `;

    const { stdout } = await execAsync(`osascript -e '${appleScript}'`);

    if (!stdout.trim()) {
      return [];
    }

    return stdout.trim().split(', ').map(line => {
      const [title, id] = line.split('|');
      return { id, title };
    });
  } catch (error) {
    logger.error('Failed to get notes', { error: error.message || String(error) });
    return [];
  }
}

/**
 * Calculate similarity between two strings (0-1)
 */
function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) {
    return 1.0;
  }

  const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - editDistance) / longer.length;
}

/**
 * Levenshtein distance for string similarity
 */
function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }
  return costs[s2.length];
}

/**
 * Delete a note by ID
 */
async function deleteNote(noteId: string, title: string): Promise<boolean> {
  try {
    const appleScript = `
      tell application "Notes"
        delete note id "${noteId}"
      end tell
    `;

    await execAsync(`osascript -e '${appleScript}'`);
    logger.info('  🗑️  Deleted: "title"', { title });
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to delete: "${title}"`, error);
    return false;
  }
}

/**
 * Find and remove duplicate songs
 */
async function deduplicateSongs() {
  logger.info('🔍 Searching for duplicate songs in Apple Notes...\n');

  const notes = await getAllNotes();

  if (notes.length === 0) {
    console.log('No notes found in "JARVIS - Complete" folder.');
    return;
  }

  logger.info('📊 Found ${notes.length} total songs\n');

  const duplicateGroups: Map<string, Note[]> = new Map();
  const seen: Set<string> = new Set();

  // Find duplicates
  for (let i = 0; i < notes.length; i++) {
    if (seen.has(notes[i].id)) continue;

    const group: Note[] = [notes[i]];

    for (let j = i + 1; j < notes.length; j++) {
      if (seen.has(notes[j].id)) continue;

      const sim = similarity(notes[i].title, notes[j].title);

      // Consider duplicates if similarity > 80%
      if (sim > 0.8) {
        group.push(notes[j]);
        seen.add(notes[j].id);
      }
    }

    if (group.length > 1) {
      duplicateGroups.set(notes[i].title, group);
      seen.add(notes[i].id);
    }
  }

  if (duplicateGroups.size === 0) {
    logger.info('✅ No duplicates found!');
    return;
  }

  logger.info('🔴 Found ${duplicateGroups.size} duplicate groups:\n');

  let deletedCount = 0;

  for (const [originalTitle, group] of duplicateGroups.entries()) {
    logger.info('📝 "originalTitle" (${group.length} copies)', { originalTitle });

    // Keep the first one, delete the rest
    for (let i = 1; i < group.length; i++) {
      const deleted = await deleteNote(group[i].id, group[i].title);
      if (deleted) deletedCount++;
    }
    console.log('');
  }

  logger.info('\n✅ Deduplication complete!');
  logger.info('📊 Kept: ${notes.length - deletedCount} unique songs');
  logger.info('🗑️  Deleted: ${deletedCount} duplicates');
}

deduplicateSongs().catch(console.error);
