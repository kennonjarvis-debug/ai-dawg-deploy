/**
 * iCloud Sync Service
 * Syncs processed voice memos to Jarvis folder in iCloud Voice Memos
 */

import fs from 'fs';
import path from 'path';

const VOICE_MEMOS_JARVIS_PATH = '/Users/benkennon/Library/Group Containers/group.com.apple.VoiceMemos.shared/Recordings/Jarvis';

export class ICloudSyncService {
  /**
   * Sync a processed voice memo to Jarvis folder in iCloud
   */
  async syncVoiceMemo(options: {
    originalFilePath: string;
    noteId: string;
    metadata?: {
      transcription?: string;
      cleanedLyrics?: string;
      hasBackgroundMusic?: boolean;
      confidence?: number;
    };
  }): Promise<{
    success: boolean;
    syncedPath?: string;
    error?: string;
  }> {
    try {
      // Ensure Jarvis folder exists
      if (!fs.existsSync(VOICE_MEMOS_JARVIS_PATH)) {
        fs.mkdirSync(VOICE_MEMOS_JARVIS_PATH, { recursive: true });
      }

      // Get original file name
      const fileName = path.basename(options.originalFilePath);
      const fileNameWithoutExt = path.parse(fileName).name;
      const ext = path.parse(fileName).ext;

      // Create new filename with JARVIS prefix
      const newFileName = `JARVIS_${fileNameWithoutExt}${ext}`;
      const targetPath = path.join(VOICE_MEMOS_JARVIS_PATH, newFileName);

      // Copy file to Jarvis folder
      if (fs.existsSync(options.originalFilePath)) {
        fs.copyFileSync(options.originalFilePath, targetPath);
      } else {
        throw new Error(`Original file not found: ${options.originalFilePath}`);
      }

      // Always create metadata file
      const metadataFileName = `JARVIS_${fileNameWithoutExt}_metadata.json`;
      const metadataPath = path.join(VOICE_MEMOS_JARVIS_PATH, metadataFileName);

      const metadataContent = {
        noteId: options.noteId,
        originalFileName: fileName,
        syncedFileName: newFileName,
        processedAt: new Date().toISOString(),
        ...options.metadata,
      };

      fs.writeFileSync(metadataPath, JSON.stringify(metadataContent, null, 2));

      console.log(`✅ Synced to iCloud: ${newFileName}`);

      return {
        success: true,
        syncedPath: targetPath,
      };
    } catch (error) {
      console.error('iCloud sync error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sync multiple voice memos
   */
  async syncMultipleVoiceMemos(memos: Array<{
    originalFilePath: string;
    noteId: string;
    metadata?: {
      transcription?: string;
      cleanedLyrics?: string;
      hasBackgroundMusic?: boolean;
      confidence?: number;
    };
  }>): Promise<{
    totalSynced: number;
    totalFailed: number;
    results: Array<{ success: boolean; path?: string; error?: string }>;
  }> {
    const results = await Promise.all(
      memos.map(memo => this.syncVoiceMemo(memo))
    );

    const totalSynced = results.filter(r => r.success).length;
    const totalFailed = results.filter(r => !r.success).length;

    return {
      totalSynced,
      totalFailed,
      results,
    };
  }

  /**
   * Check if Jarvis folder is accessible
   */
  isJarvisFolderAccessible(): boolean {
    try {
      return fs.existsSync(VOICE_MEMOS_JARVIS_PATH);
    } catch {
      return false;
    }
  }

  /**
   * Get Jarvis folder path
   */
  getJarvisFolderPath(): string {
    return VOICE_MEMOS_JARVIS_PATH;
  }

  /**
   * List all synced voice memos
   */
  listSyncedVoiceMemos(): string[] {
    try {
      if (!fs.existsSync(VOICE_MEMOS_JARVIS_PATH)) {
        return [];
      }

      return fs.readdirSync(VOICE_MEMOS_JARVIS_PATH)
        .filter(file => file.endsWith('.m4a') && file.startsWith('JARVIS_'));
    } catch {
      return [];
    }
  }
}

export const iCloudSyncService = new ICloudSyncService();
