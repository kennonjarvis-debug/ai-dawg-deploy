/**
 * Voice Memos Folder Service
 * Assigns voice memos to specific folders in the Voice Memos app via database
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

const VOICE_MEMOS_DB = '/Users/benkennon/Library/Group Containers/group.com.apple.VoiceMemos.shared/Recordings/CloudRecordings.db';
const JARVIS_FOLDER_PK = 2; // Z_PK of JARVIS folder

export class VoiceMemosFolderService {
  /**
   * Assign recording to JARVIS folder by file path
   */
  async moveToJarvisFolder(
    recordingFilePath: string,
    displayName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const fileName = path.basename(recordingFilePath);

      // Wait for Voice Memos to discover the file
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Use temp file to avoid shell escaping issues
      const fs = await import('fs/promises');
      const os = await import('os');
      const tempFile = path.join(os.tmpdir(), `voice-memos-sql-${Date.now()}.sql`);

      // Escape single quotes for SQL by doubling them
      const escapedLabel = displayName.replace(/'/g, "''");
      const escapedFileName = fileName.replace(/'/g, "''");

      const sqlCommand = `UPDATE ZCLOUDRECORDING SET ZFOLDER = ${JARVIS_FOLDER_PK}, ZCUSTOMLABEL = '${escapedLabel}' WHERE ZPATH LIKE '%${escapedFileName}%';`;

      await fs.writeFile(tempFile, sqlCommand, 'utf-8');

      try {
        await execAsync(`sqlite3 "${VOICE_MEMOS_DB}" < "${tempFile}"`);
        await fs.unlink(tempFile);

        console.log(`✅ Assigned "${displayName}" to JARVIS folder`);
        return { success: true };
      } catch (error) {
        await fs.unlink(tempFile).catch(() => {});
        throw error;
      }
    } catch (error) {
      console.error('Voice Memos folder assignment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify JARVIS folder exists
   */
  async verifyJarvisFolderExists(): Promise<{ success: boolean; error?: string }> {
    try {
      const sqlCommand = `SELECT COUNT(*) FROM ZFOLDER WHERE ZENCRYPTEDNAME = 'JARVIS'`;
      const { stdout } = await execAsync(`sqlite3 "${VOICE_MEMOS_DB}" "${sqlCommand}"`);
      const count = parseInt(stdout.trim(), 10);

      if (count > 0) {
        console.log('✅ JARVIS folder exists in Voice Memos database');
        return { success: true };
      } else {
        console.warn('⚠️  JARVIS folder not found - please create it manually in Voice Memos app');
        return { success: false, error: 'JARVIS folder does not exist' };
      }
    } catch (error) {
      console.error('Voice Memos folder verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const voiceMemosFolderService = new VoiceMemosFolderService();
