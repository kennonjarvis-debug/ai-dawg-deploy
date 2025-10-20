/**
 * Song Completion Service
 * Uses Claude to complete incomplete songs and manage note versions
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';
import type { Note } from '../../types/notes.js';
import { logger } from '../../../../src/lib/utils/logger.js';

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

let anthropicClient: Anthropic | null = null;
const prisma = new PrismaClient();

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

export class CompletionService {
  /**
   * Complete an incomplete song
   */
  async completeSong(noteId: string, userPreferences?: any): Promise<{ note: Note; version: number }> {
    try {
      logger.info('Completing song for note ${noteId}');

      // Get the current note
      const dbNote = await prisma.note.findUnique({
        where: { id: noteId },
        include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
      });

      if (!dbNote) {
        throw new Error(`Note ${noteId} not found`);
      }

      // Get current version number
      const currentVersion = dbNote.versions.length > 0 ? dbNote.versions[0].version : 0;
      const nextVersion = currentVersion + 1;

      // Archive the original version if this is the first edit
      if (currentVersion === 0) {
        await prisma.noteVersion.create({
          data: {
            noteId,
            version: 1,
            title: dbNote.title,
            content: dbNote.content,
            editReason: 'Original version (auto-archived before completion)',
            createdBy: 'system',
          },
        });
      }

      // Build completion prompt
      const systemPrompt = this.buildCompletionPrompt(userPreferences);
      const userPrompt = `Complete this song:

Title: ${dbNote.title}
Current Content:
${dbNote.content}

Please provide:
1. The completed song with all missing sections filled in
2. Maintain the original style and voice
3. Ensure proper song structure (verse/chorus/bridge)
4. Keep what's already written and add what's missing

Return the completed song as plain text (no JSON, just the song lyrics).`;

      const anthropic = getAnthropicClient();
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const completedContent = response.content[0].type === 'text' ? response.content[0].text : '';

      // Update the note with completed content
      const updatedNote = await prisma.note.update({
        where: { id: noteId },
        data: {
          content: completedContent,
          wordCount: completedContent.split(/\s+/).length,
        },
      });

      // Create a new version for the completed song
      await prisma.noteVersion.create({
        data: {
          noteId,
          version: nextVersion + 1,
          title: updatedNote.title,
          content: completedContent,
          editReason: 'AI song completion',
          createdBy: 'ai',
        },
      });

      logger.info('Song completed: ${updatedNote.title} (version ${nextVersion + 1})');

      return {
        note: {
          id: updatedNote.id,
          title: updatedNote.title,
          content: updatedNote.content,
          sourceType: updatedNote.sourceType as any,
          originalFilePath: updatedNote.originalFilePath || undefined,
          createdAt: updatedNote.createdAt,
          updatedAt: updatedNote.updatedAt,
          metadata: {
            wordCount: updatedNote.wordCount || undefined,
            duration: updatedNote.duration || undefined,
          },
        },
        version: nextVersion + 1,
      };
    } catch (error) {
      logger.error('Song completion error', { error: error.message || String(error) });
      throw new Error(`Failed to complete song: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a note manually (user edit)
   */
  async updateNote(
    noteId: string,
    updates: { title?: string; content?: string },
    editReason?: string
  ): Promise<{ note: Note; version: number }> {
    try {
      const dbNote = await prisma.note.findUnique({
        where: { id: noteId },
        include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
      });

      if (!dbNote) {
        throw new Error(`Note ${noteId} not found`);
      }

      const currentVersion = dbNote.versions.length > 0 ? dbNote.versions[0].version : 0;
      const nextVersion = currentVersion + 1;

      // Archive current version if this is the first edit
      if (currentVersion === 0) {
        await prisma.noteVersion.create({
          data: {
            noteId,
            version: 1,
            title: dbNote.title,
            content: dbNote.content,
            editReason: 'Original version (auto-archived before edit)',
            createdBy: 'system',
          },
        });
      }

      // Update the note
      const newContent = updates.content || dbNote.content;
      const newTitle = updates.title || dbNote.title;

      const updatedNote = await prisma.note.update({
        where: { id: noteId },
        data: {
          title: newTitle,
          content: newContent,
          wordCount: newContent.split(/\s+/).length,
        },
      });

      // Create a new version
      await prisma.noteVersion.create({
        data: {
          noteId,
          version: nextVersion + 1,
          title: newTitle,
          content: newContent,
          editReason: editReason || 'Manual edit',
          createdBy: 'user',
        },
      });

      return {
        note: {
          id: updatedNote.id,
          title: updatedNote.title,
          content: updatedNote.content,
          sourceType: updatedNote.sourceType as any,
          originalFilePath: updatedNote.originalFilePath || undefined,
          createdAt: updatedNote.createdAt,
          updatedAt: updatedNote.updatedAt,
          metadata: {
            wordCount: updatedNote.wordCount || undefined,
            duration: updatedNote.duration || undefined,
          },
        },
        version: nextVersion + 1,
      };
    } catch (error) {
      logger.error('Update note error', { error: error.message || String(error) });
      throw new Error(`Failed to update note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get version history for a note
   */
  async getVersionHistory(noteId: string): Promise<any[]> {
    const versions = await prisma.noteVersion.findMany({
      where: { noteId },
      orderBy: { version: 'desc' },
    });

    return versions;
  }

  /**
   * Restore a specific version
   */
  async restoreVersion(noteId: string, version: number): Promise<{ note: Note; version: number }> {
    const versionToRestore = await prisma.noteVersion.findUnique({
      where: {
        noteId_version: {
          noteId,
          version,
        },
      },
    });

    if (!versionToRestore) {
      throw new Error(`Version ${version} not found for note ${noteId}`);
    }

    return this.updateNote(
      noteId,
      {
        title: versionToRestore.title,
        content: versionToRestore.content,
      },
      `Restored from version ${version}`
    );
  }

  /**
   * Build system prompt for song completion
   */
  private buildCompletionPrompt(userPreferences?: any): string {
    return `You are an expert country-pop songwriter specializing in Morgan Wallen, Jason Aldean, and Randy Houser style songs.

Your task is to complete incomplete songs by:
1. Analyzing the existing content to understand the theme, emotion, and style
2. Maintaining the same voice, tone, and lyrical patterns
3. Adding missing sections (verses, chorus, bridge) as needed
4. Ensuring proper song structure and flow
5. Matching the rhyme scheme and syllable count of existing sections

${userPreferences?.musicGenre ? `User's preferred genre: ${userPreferences.musicGenre}` : ''}
${userPreferences?.writingStyle ? `User's writing style: ${userPreferences.writingStyle}` : ''}

Guidelines:
- Keep the original content intact - only add what's missing
- Match the energy and emotion of the existing lyrics
- Use authentic country storytelling and imagery
- Ensure all sections flow naturally together
- Add proper song structure labels if missing (Verse 1, Chorus, etc.)`;
  }
}

export const completionService = new CompletionService();
