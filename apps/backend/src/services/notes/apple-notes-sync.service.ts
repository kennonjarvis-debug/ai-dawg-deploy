/**
 * Apple Notes Live Sync Service
 * Creates, updates, and deletes notes in the actual Apple Notes app
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { logger } from '../../../../src/lib/utils/logger.js';

const execAsync = promisify(exec);

const JARVIS_FOLDER_NAME = 'JARVIS';

export type JarvisFolderType = 'JARVIS' | 'JARVIS - Complete' | 'JARVIS - In Progress' | 'JARVIS - Ideas' | 'JARVIS - Archive';

export class AppleNotesSyncService {
  /**
   * Create a note in Apple Notes app with optional file attachment
   */
  async createNote(
    title: string,
    content: string,
    folderName: JarvisFolderType = 'JARVIS',
    attachmentPath?: string
  ): Promise<{
    success: boolean;
    noteId?: string;
    error?: string;
  }> {
    try {
      // Escape backslashes and double quotes for AppleScript
      const escapedTitle = title.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const escapedContent = content.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

      // Build attachment block if path provided
      let attachmentBlock = '';
      if (attachmentPath) {
        attachmentBlock = `
  tell newNote
    make new attachment with data (POSIX file "${attachmentPath}")

    -- WORKAROUND: macOS 15.x bug creates duplicate attachments
    -- Delete the duplicate if it exists
    delay 0.5
    if (count of attachments) > 1 then
      delete attachment 2
    end if
  end tell`;
      }

      const appleScript = `tell application "Notes"
  set folderExists to false
  repeat with eachFolder in folders
    if name of eachFolder is "${folderName}" then
      set folderExists to true
      set targetFolder to eachFolder
      exit repeat
    end if
  end repeat

  if not folderExists then
    set targetFolder to make new folder with properties {name:"${folderName}"}
  end if

  set newNote to make new note at targetFolder with properties {name:"${escapedTitle}", body:"${escapedContent}"}${attachmentBlock}
  return id of newNote
end tell`;

      // Write script to temp file to completely avoid shell escaping issues
      const tempFile = path.join(os.tmpdir(), `apple-notes-${Date.now()}.scpt`);
      await fs.writeFile(tempFile, appleScript, 'utf-8');

      try {
        const {stdout} = await execAsync(`osascript "${tempFile}"`);
        const noteId = stdout.trim();
        await fs.unlink(tempFile); // Clean up temp file

        logger.info('📝 Created Apple Note: "title"', { title });

        return {
          success: true,
          noteId,
        };
      } catch (error) {
        await fs.unlink(tempFile).catch(() => {}); // Clean up even on error
        throw error;
      }
    } catch (error) {
      logger.error('Apple Notes create error', { error: error.message || String(error) });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update a note in Apple Notes app
   */
  async updateNote(noteId: string, title?: string, content?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      let updates = '';
      if (title) {
        const escapedTitle = title.replace(/"/g, '\\"');
        updates += `set name of targetNote to "${escapedTitle}"\n`;
      }
      if (content) {
        const escapedContent = content.replace(/"/g, '\\"');
        updates += `set body of targetNote to "${escapedContent}"\n`;
      }

      const appleScript = `
        tell application "Notes"
          set targetNote to note id "${noteId}"
          ${updates}
        end tell
      `;

      await execAsync(`osascript -e '${appleScript}'`);

      logger.info('✏️  Updated Apple Note: ${noteId}');

      return {
        success: true,
      };
    } catch (error) {
      logger.error('Apple Notes update error', { error: error.message || String(error) });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete a note from Apple Notes app
   */
  async deleteNote(noteId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const appleScript = `
        tell application "Notes"
          delete note id "${noteId}"
        end tell
      `;

      await execAsync(`osascript -e '${appleScript}'`);

      logger.info('🗑️  Deleted Apple Note: ${noteId}');

      return {
        success: true,
      };
    } catch (error) {
      logger.error('Apple Notes delete error', { error: error.message || String(error) });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Find note by title in Jarvis folder
   */
  async findNoteByTitle(title: string): Promise<{
    success: boolean;
    noteId?: string;
    error?: string;
  }> {
    try {
      const escapedTitle = title.replace(/"/g, '\\"');

      const appleScript = `
        tell application "Notes"
          repeat with eachFolder in folders
            if name of eachFolder is "${JARVIS_FOLDER_NAME}" then
              repeat with eachNote in notes of eachFolder
                if name of eachNote is "${escapedTitle}" then
                  return id of eachNote
                end if
              end repeat
            end if
          end repeat
          return ""
        end tell
      `;

      const { stdout } = await execAsync(`osascript -e '${appleScript}'`);
      const noteId = stdout.trim();

      if (noteId) {
        return {
          success: true,
          noteId,
        };
      }

      return {
        success: false,
        error: 'Note not found',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get Jarvis folder name
   */
  getJarvisFolderName(): string {
    return JARVIS_FOLDER_NAME;
  }
}

export const appleNotesSyncService = new AppleNotesSyncService();
