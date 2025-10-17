/**
 * Notes and Voice Memos Import Service
 * Handles importing from iOS Notes and Voice Memos
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import type { Note as PrismaNote } from '@prisma/client';
import type { Note, VoiceMemo, SyncStatus } from '../../types/notes.js';
import { transcriptionService } from './transcription.service.js';
import { analysisService } from './analysis.service.js';
import { lyricParserService } from './lyric-parser.service.js';
import { songAnalysisService } from './song-analysis.service.js';
import { appleNotesSyncService } from './apple-notes-sync.service.js';

const prisma = new PrismaClient();

/**
 * Generate song title from lyrics (1-4 words, hook-based)
 * Like Morgan Wallen, Jason Aldean, Drake style titles
 */
function generateIntelligentTitle(content: string): string {
  if (!content || content.trim().length === 0) {
    return 'Untitled';
  }

  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Find the hook (most repeated phrase)
  const phraseCounts: { [key: string]: number } = {};
  for (const line of lines) {
    const normalized = line.toLowerCase().replace(/[,\.!?\-]/g, '').trim();
    if (normalized.length > 5) {
      phraseCounts[normalized] = (phraseCounts[normalized] || 0) + 1;
    }
  }

  // Get most repeated line (likely the hook)
  const sortedPhrases = Object.entries(phraseCounts)
    .sort((a, b) => b[1] - a[1])
    .filter(([phrase, count]) => count >= 2); // Repeated at least twice

  if (sortedPhrases.length > 0) {
    const hookLine = sortedPhrases[0][0];
    const title = extractSongTitle(hookLine);
    if (title) return title;
  }

  // No hook found - extract from first meaningful lines
  for (const line of lines) {
    // Skip junk
    if (/^[♪♫\s]+$/.test(line)) continue;
    const words = line.split(/\s+/);
    const uniqueWords = new Set(words);
    if (words.length >= 4 && uniqueWords.size <= 2) continue;
    if (line.toLowerCase().includes('thank you for watching')) continue;
    const alphaCount = (line.match(/[a-zA-Z]/g) || []).length;
    if (alphaCount < line.length * 0.5) continue;

    const title = extractSongTitle(line);
    if (title) return title;
  }

  return 'Untitled';
}

/**
 * Extract 1-4 word song title from a lyric line
 * Uses common patterns: "Last Night", "Whiskey Glasses", "God's Country"
 */
function extractSongTitle(line: string): string | null {
  // Remove punctuation except apostrophes
  const cleaned = line.replace(/[,\.!?\-"]/g, '').trim();
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);

  if (words.length === 0) return null;

  // Skip lines that start with filler words
  const fillerStarts = ['uh', 'um', 'ah', 'oh', 'so', 'yeah', 'and', 'but', 'or'];
  if (fillerStarts.includes(words[0].toLowerCase()) && words.length <= 3) {
    return null;
  }

  // Look for key phrases in order of priority
  const lowerLine = cleaned.toLowerCase();

  // Pattern 1: "I [verb] you" → take middle (e.g., "Love You", "Need You")
  const iYouMatch = lowerLine.match(/\bi\s+(\w+)\s+you\b/);
  if (iYouMatch && words.length <= 6) {
    const verbIndex = words.findIndex(w => w.toLowerCase() === 'i') + 1;
    if (verbIndex > 0 && verbIndex < words.length) {
      const verb = words[verbIndex];
      return `${capitalize(verb)} You`;
    }
  }

  // Pattern 2: "You're/You [adjective/verb] [object]" (e.g., "You're Mine", "You Broke Me")
  if (lowerLine.startsWith('you') && words.length >= 2 && words.length <= 6) {
    // Take 2-3 words, but avoid incomplete phrases
    let titleWords = words.slice(0, Math.min(3, words.length));
    const lastWord = titleWords[titleWords.length - 1].toLowerCase();

    // If ends with article/preposition, try to add next word or shorten
    const incompleteEndings = ['the', 'a', 'an', 'to', 'and', 'or', 'but', 'my', 'your'];
    if (incompleteEndings.includes(lastWord)) {
      if (words.length > titleWords.length) {
        // Add one more word to complete
        titleWords.push(words[titleWords.length]);
      } else {
        // Remove incomplete ending
        titleWords = titleWords.slice(0, -1);
      }
    }

    if (titleWords.length >= 2) {
      return titleWords.map(w => capitalize(w)).join(' ');
    }
  }

  // Pattern 3: Complete phrases (2-4 words, no incomplete endings)
  if (words.length >= 2 && words.length <= 6) {
    let titleWords = words.slice(0, Math.min(4, words.length));
    const lastWord = titleWords[titleWords.length - 1].toLowerCase();

    // Check if ends incomplete
    const incompleteEndings = ['the', 'a', 'an', 'to', 'and', 'or', 'but', 'my', 'your', 'be', 'is', 'was'];
    if (incompleteEndings.includes(lastWord)) {
      if (words.length > titleWords.length) {
        // Try adding next word
        titleWords.push(words[titleWords.length]);
      } else {
        // Remove incomplete word
        titleWords = titleWords.slice(0, -1);
      }
    }

    if (titleWords.length >= 2 && titleWords.length <= 4) {
      return titleWords.map(w => capitalize(w)).join(' ');
    }
  }

  // Pattern 4: Single strong word (e.g., "Tennessee", "Forever")
  if (words.length === 1 && words[0].length >= 4) {
    return capitalize(words[0]);
  }

  return null;
}

/**
 * Capitalize first letter of word
 */
function capitalize(word: string): string {
  if (!word || word.length === 0) return word;

  // Keep all-caps words like "I", "DJ", "USA"
  if (word.length <= 2 && word === word.toUpperCase()) return word;

  // Skip small words that shouldn't be capitalized (unless first word)
  const smallWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'in', 'of'];
  if (smallWords.includes(word.toLowerCase())) {
    return word.toLowerCase();
  }

  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export interface ImportOptions {
  autoTranscribe?: boolean;
  autoAnalyze?: boolean;
  appContext?: 'jarvis' | 'dawg_ai';
}

export class ImportService {
  /**
   * Import a text note
   */
  async importNote(title: string, content: string, sourceType: 'ios_notes' | 'manual' | 'voice_memo' = 'ios_notes', originalFilePath?: string): Promise<Note> {
    const wordCount = content.split(/\s+/).length;

    const dbNote = await prisma.note.create({
      data: {
        title,
        content,
        sourceType,
        originalFilePath,
        wordCount,
      },
    });

    console.log(`Imported note: ${dbNote.title}`);

    // Convert Prisma Note to our Note type
    return this.convertToNote(dbNote);
  }

  /**
   * Import a voice memo
   */
  async importVoiceMemo(
    filePath: string,
    options: ImportOptions = {}
  ): Promise<{ memo: VoiceMemo; note?: Note }> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileName = path.basename(filePath);

      console.log(`Importing voice memo: ${fileName}`);

      // Auto-transcribe if requested
      if (options.autoTranscribe !== false) {
        try {
          const transcription = await transcriptionService.transcribeAudio(filePath);

          // Parse lyrics intelligently to remove background beats/music
          let finalContent = transcription.text;
          let parsedStructure: any = null;

          // Check if this appears to be a music recording with background
          if (lyricParserService.hasBackgroundMusicIndicators(transcription.text) ||
              transcription.text.length > 100) {
            console.log('Detected potential background music - parsing lyrics...');

            const parsed = await lyricParserService.parseVoiceMemoLyrics(
              transcription.text,
              {
                fileName,
                duration: transcription.duration,
              }
            );

            if (parsed.confidence > 0.6) {
              finalContent = parsed.cleanLyrics;
              parsedStructure = parsed.structure;
              console.log(`Lyrics parsed with ${(parsed.confidence * 100).toFixed(0)}% confidence`);

              if (parsed.hasBackgroundMusic) {
                console.log('Background music detected and filtered out');
              }
            }
          } else {
            // Quick cleanup for short recordings
            finalContent = lyricParserService.quickCleanup(transcription.text);
          }

          // SONG ANALYSIS: Analyze structure, theme, completion status
          console.log('🎵 Analyzing song structure and development...');
          const songAnalysis = await songAnalysisService.analyzeSong(finalContent, {
            duration: transcription.duration,
            fileName,
          });

          // Generate intelligent title
          const intelligentTitle = generateIntelligentTitle(finalContent);

          // Add song analysis metadata to content
          const contentWithMetadata = `${finalContent}

---
📊 JARVIS Analysis:
Status: ${songAnalysis.completion.status.replace(/_/g, ' ')} (${songAnalysis.completion.percentage}% complete)
Theme: ${songAnalysis.theme.primary} | ${songAnalysis.theme.mood}
${songAnalysis.completion.missingElements.length > 0 ? `Missing: ${songAnalysis.completion.missingElements.join(', ')}` : ''}

Next Actions:
${songAnalysis.nextActions.map(action => `• ${action}`).join('\n')}`;

          // Create note with song analysis metadata
          const dbNote = await prisma.note.create({
            data: {
              title: intelligentTitle,
              content: contentWithMetadata,
              sourceType: 'voice_memo',
              originalFilePath: filePath,
              wordCount: finalContent.split(/\s+/).length,
              duration: transcription.duration,
              transcriptionStatus: 'completed',
              voiceMemo: {
                create: {
                  fileName,
                  filePath,
                  duration: transcription.duration,
                  transcription: transcription.text, // Store original transcription
                  transcriptionStatus: 'completed',
                  format: path.extname(filePath).slice(1),
                  fileSize: fs.statSync(filePath).size,
                },
              },
            },
            include: {
              voiceMemo: true,
            },
          });

          // APPLE NOTES SYNC: Create note in appropriate folder based on analysis
          console.log(`📁 Creating Apple Note in: ${songAnalysis.appleNotesFolder}`);
          const appleNoteResult = await appleNotesSyncService.createNote(
            intelligentTitle,
            contentWithMetadata,
            songAnalysis.appleNotesFolder
          );

          if (appleNoteResult.success) {
            console.log(`✅ Apple Note created: "${intelligentTitle}" → ${songAnalysis.appleNotesFolder}`);
          } else {
            console.error(`⚠️  Apple Note creation failed: ${appleNoteResult.error}`);
          }

          const note = this.convertToNote(dbNote);
          const memo = this.convertToVoiceMemo(dbNote.voiceMemo!);

          // Auto-analyze if requested
          if (options.autoAnalyze && options.appContext) {
            await analysisService.analyzeNote(note, options.appContext);
          }

          return { memo, note };
        } catch (error) {
          console.error('Transcription failed:', error);

          // Create note without transcription
          const dbNote = await prisma.note.create({
            data: {
              title: `Voice Memo: ${fileName}`, // Keep filename if transcription failed
              content: '',
              sourceType: 'voice_memo',
              originalFilePath: filePath,
              transcriptionStatus: 'failed',
              voiceMemo: {
                create: {
                  fileName,
                  filePath,
                  duration: 0,
                  transcriptionStatus: 'failed',
                  format: path.extname(filePath).slice(1),
                  fileSize: fs.statSync(filePath).size,
                },
              },
            },
            include: {
              voiceMemo: true,
            },
          });

          const memo = this.convertToVoiceMemo(dbNote.voiceMemo!);
          return { memo };
        }
      } else {
        // Create without transcription
        const dbNote = await prisma.note.create({
          data: {
            title: `Voice Memo: ${fileName}`,
            content: '',
            sourceType: 'voice_memo',
            originalFilePath: filePath,
            transcriptionStatus: 'pending',
            voiceMemo: {
              create: {
                fileName,
                filePath,
                duration: 0,
                transcriptionStatus: 'pending',
                format: path.extname(filePath).slice(1),
                fileSize: fs.statSync(filePath).size,
              },
            },
          },
          include: {
            voiceMemo: true,
          },
        });

        const memo = this.convertToVoiceMemo(dbNote.voiceMemo!);
        return { memo };
      }
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  }

  /**
   * Import from iOS Notes export directory
   */
  async importFromDirectory(dirPath: string, options: ImportOptions = {}): Promise<SyncStatus> {
    const status: SyncStatus = {
      lastSyncAt: new Date(),
      notesProcessed: 0,
      memosProcessed: 0,
      errors: [],
    };

    try {
      if (!fs.existsSync(dirPath)) {
        throw new Error(`Directory not found: ${dirPath}`);
      }

      const files = fs.readdirSync(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const ext = path.extname(file).toLowerCase();

        try {
          // Handle text files (notes)
          if (['.txt', '.md', '.html'].includes(ext)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const title = path.basename(file, ext);
            await this.importNote(title, content, 'ios_notes', filePath);
            status.notesProcessed++;
          }
          // Handle audio files (voice memos)
          else if (transcriptionService.isSupportedFormat(filePath)) {
            await this.importVoiceMemo(filePath, options);
            status.memosProcessed++;
          }
        } catch (error) {
          const errorMsg = `Failed to import ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          status.errors.push(errorMsg);
        }
      }

      console.log(`Import complete: ${status.notesProcessed} notes, ${status.memosProcessed} memos`);
      return status;
    } catch (error) {
      status.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return status;
    }
  }

  /**
   * Get all imported notes
   */
  async getAllNotes(): Promise<Note[]> {
    const dbNotes = await prisma.note.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return dbNotes.map(this.convertToNote);
  }

  /**
   * Get all imported voice memos
   */
  async getAllMemos(): Promise<VoiceMemo[]> {
    const dbMemos = await prisma.voiceMemo.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return dbMemos.map(this.convertToVoiceMemo);
  }

  /**
   * Get notes by source type
   */
  async getNotesBySource(sourceType: 'ios_notes' | 'voice_memo' | 'manual'): Promise<Note[]> {
    const dbNotes = await prisma.note.findMany({
      where: { sourceType },
      orderBy: { createdAt: 'desc' },
    });
    return dbNotes.map(this.convertToNote);
  }

  /**
   * Search notes by keyword
   */
  async searchNotes(query: string): Promise<Note[]> {
    const dbNotes = await prisma.note.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    return dbNotes.map(this.convertToNote);
  }

  /**
   * Clear all storage (for testing)
   */
  async clearAll(): Promise<void> {
    await prisma.action.deleteMany();
    await prisma.aIAnalysis.deleteMany();
    await prisma.voiceMemo.deleteMany();
    await prisma.note.deleteMany();
  }

  /**
   * Convert Prisma Note to our Note type
   */
  private convertToNote(dbNote: PrismaNote): Note {
    return {
      id: dbNote.id,
      title: dbNote.title,
      content: dbNote.content,
      sourceType: dbNote.sourceType as 'ios_notes' | 'voice_memo' | 'manual',
      originalFilePath: dbNote.originalFilePath || undefined,
      createdAt: dbNote.createdAt,
      updatedAt: dbNote.updatedAt,
      metadata: {
        wordCount: dbNote.wordCount || undefined,
        duration: dbNote.duration || undefined,
      },
    };
  }

  /**
   * Convert Prisma VoiceMemo to our VoiceMemo type
   */
  private convertToVoiceMemo(dbMemo: any): VoiceMemo {
    return {
      id: dbMemo.id,
      fileName: dbMemo.fileName,
      filePath: dbMemo.filePath,
      duration: dbMemo.duration,
      transcription: dbMemo.transcription || undefined,
      transcriptionStatus: dbMemo.transcriptionStatus as 'pending' | 'processing' | 'completed' | 'failed',
      createdAt: dbMemo.createdAt,
    };
  }
}

export const importService = new ImportService();
