/**
 * UI Preferences Sync System
 * Instance 4 (Data & Storage - Karen)
 *
 * Manages localStorage + cloud sync for UI preferences
 * Privacy-first: Respects sync controls, handles conflicts
 */

'use client';

import {
  UIPreferencesSchema,
  getDefaultUIPreferences,
  type UIPreferences,
  type UIPreferencesUpdate,
  type SyncStatus,
} from '@/lib/types/ui-preferences';

// ============================================================================
// CONSTANTS
// ============================================================================

const LOCAL_STORAGE_KEY = 'dawg-ai:ui-preferences';
const SYNC_STATUS_KEY = 'dawg-ai:sync-status';
const SYNC_INTERVAL_MS = 30000; // 30 seconds
const CONFLICT_RESOLUTION = 'local-wins'; // or 'remote-wins', 'newest-wins'

// ============================================================================
// TYPES
// ============================================================================

interface SyncOptions {
  userId: string;
  autoSync?: boolean;
  syncInterval?: number;
  onConflict?: (local: UIPreferences, remote: UIPreferences) => UIPreferences;
  onSyncSuccess?: (preferences: UIPreferences) => void;
  onSyncError?: (error: Error) => void;
}

// ============================================================================
// SYNC MANAGER CLASS
// ============================================================================

export class UIPreferencesSyncManager {
  private userId: string;
  private autoSync: boolean;
  private syncInterval: number;
  private syncTimer: NodeJS.Timeout | null = null;
  private onConflict?: (local: UIPreferences, remote: UIPreferences) => UIPreferences;
  private onSyncSuccess?: (preferences: UIPreferences) => void;
  private onSyncError?: (error: Error) => void;

  constructor(options: SyncOptions) {
    this.userId = options.userId;
    this.autoSync = options.autoSync ?? true;
    this.syncInterval = options.syncInterval ?? SYNC_INTERVAL_MS;
    this.onConflict = options.onConflict;
    this.onSyncSuccess = options.onSyncSuccess;
    this.onSyncError = options.onSyncError;
  }

  /**
   * Start auto-sync timer
   */
  start(): void {
    if (this.autoSync && !this.syncTimer) {
      this.syncTimer = setInterval(() => {
        this.sync().catch((error) => {
          console.error('[UIPreferencesSync] Auto-sync failed:', error);
          this.onSyncError?.(error);
        });
      }, this.syncInterval);

      // Initial sync
      this.sync().catch((error) => {
        console.error('[UIPreferencesSync] Initial sync failed:', error);
        this.onSyncError?.(error);
      });
    }
  }

  /**
   * Stop auto-sync timer
   */
  stop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Get preferences from localStorage
   */
  getLocal(): UIPreferences | null {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      const validated = UIPreferencesSchema.parse(parsed);

      return validated;
    } catch (error) {
      console.error('[UIPreferencesSync] Failed to get local preferences:', error);
      return null;
    }
  }

  /**
   * Save preferences to localStorage
   */
  setLocal(preferences: UIPreferences): void {
    try {
      const validated = UIPreferencesSchema.parse(preferences);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(validated));
    } catch (error) {
      console.error('[UIPreferencesSync] Failed to set local preferences:', error);
      throw error;
    }
  }

  /**
   * Get preferences from cloud API
   */
  async getRemote(): Promise<UIPreferences | null> {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - user not logged in');
        }
        throw new Error(`Failed to fetch remote preferences: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error('Invalid response from preferences API');
      }

      return UIPreferencesSchema.parse(result.data);
    } catch (error) {
      console.error('[UIPreferencesSync] Failed to get remote preferences:', error);
      throw error;
    }
  }

  /**
   * Save preferences to cloud API
   */
  async setRemote(preferences: UIPreferencesUpdate): Promise<UIPreferences> {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - user not logged in');
        }
        if (response.status === 400) {
          const error = await response.json();
          throw new Error(`Validation error: ${JSON.stringify(error.details)}`);
        }
        throw new Error(`Failed to save remote preferences: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error('Invalid response from preferences API');
      }

      return UIPreferencesSchema.parse(result.data);
    } catch (error) {
      console.error('[UIPreferencesSync] Failed to set remote preferences:', error);
      throw error;
    }
  }

  /**
   * Sync local and remote preferences
   * Handles conflicts based on privacy settings
   */
  async sync(): Promise<UIPreferences> {
    const syncStatus = this.getSyncStatus();
    syncStatus.lastSyncAttempt = new Date().toISOString();
    syncStatus.syncInProgress = true;
    this.setSyncStatus(syncStatus);

    try {
      const local = this.getLocal() || getDefaultUIPreferences(this.userId);
      const remote = await this.getRemote();

      // If no remote preferences, push local to cloud
      if (!remote) {
        const synced = await this.setRemote(this.extractSyncableData(local));
        this.setLocal(synced);
        syncStatus.lastSuccessfulSync = new Date().toISOString();
        syncStatus.pendingChanges = 0;
        syncStatus.syncInProgress = false;
        this.setSyncStatus(syncStatus);
        this.onSyncSuccess?.(synced);
        return synced;
      }

      // Detect conflicts
      const hasConflicts = this.detectConflicts(local, remote);

      if (hasConflicts) {
        syncStatus.conflicts = this.buildConflictList(local, remote);

        // Resolve conflicts
        const resolved = this.onConflict
          ? this.onConflict(local, remote)
          : this.resolveConflicts(local, remote);

        // Save resolved preferences
        const synced = await this.setRemote(this.extractSyncableData(resolved));
        this.setLocal(synced);

        syncStatus.lastSuccessfulSync = new Date().toISOString();
        syncStatus.pendingChanges = 0;
        syncStatus.conflicts = [];
        syncStatus.syncInProgress = false;
        this.setSyncStatus(syncStatus);
        this.onSyncSuccess?.(synced);
        return synced;
      }

      // No conflicts - use remote as source of truth
      this.setLocal(remote);
      syncStatus.lastSuccessfulSync = new Date().toISOString();
      syncStatus.pendingChanges = 0;
      syncStatus.syncInProgress = false;
      this.setSyncStatus(syncStatus);
      this.onSyncSuccess?.(remote);
      return remote;
    } catch (error) {
      syncStatus.syncInProgress = false;
      syncStatus.error = error instanceof Error ? error.message : 'Unknown sync error';
      this.setSyncStatus(syncStatus);
      this.onSyncError?.(error instanceof Error ? error : new Error('Unknown sync error'));
      throw error;
    }
  }

  /**
   * Update preferences (local + trigger sync)
   */
  async update(updates: UIPreferencesUpdate): Promise<UIPreferences> {
    const local = this.getLocal() || getDefaultUIPreferences(this.userId);

    // Apply updates locally first (optimistic update)
    const updated: UIPreferences = {
      ...local,
      ...updates,
      userId: this.userId,
      lastModified: new Date().toISOString(),
      theme: updates.theme ? { ...local.theme, ...updates.theme } : local.theme,
      layout: updates.layout ? { ...local.layout, ...updates.layout } : local.layout,
      dashboard: updates.dashboard ? { ...local.dashboard, ...updates.dashboard } : local.dashboard,
      audio: updates.audio ? { ...local.audio, ...updates.audio } : local.audio,
      ai: updates.ai ? { ...local.ai, ...updates.ai } : local.ai,
      privacy: updates.privacy ? { ...local.privacy, ...updates.privacy } : local.privacy,
    };

    this.setLocal(updated);

    // Increment pending changes
    const syncStatus = this.getSyncStatus();
    syncStatus.pendingChanges = (syncStatus.pendingChanges || 0) + 1;
    this.setSyncStatus(syncStatus);

    // Trigger sync if auto-sync is enabled
    if (this.autoSync) {
      try {
        return await this.sync();
      } catch (error) {
        console.error('[UIPreferencesSync] Failed to sync after update:', error);
        // Return local version even if sync failed
        return updated;
      }
    }

    return updated;
  }

  /**
   * Extract only syncable data based on privacy controls
   */
  private extractSyncableData(preferences: UIPreferences): UIPreferencesUpdate {
    const { privacy } = preferences;

    return {
      theme: privacy.syncTheme ? preferences.theme : undefined,
      layout: privacy.syncLayout ? preferences.layout : undefined,
      dashboard: privacy.syncDashboardFilters ? preferences.dashboard : undefined,
      audio: privacy.syncAudioSettings ? preferences.audio : undefined,
      ai: privacy.syncAIPreferences ? preferences.ai : undefined,
      privacy: preferences.privacy, // Always sync privacy controls
      lastModified: preferences.lastModified,
      deviceId: preferences.deviceId,
      deviceName: preferences.deviceName,
    };
  }

  /**
   * Detect conflicts between local and remote
   */
  private detectConflicts(local: UIPreferences, remote: UIPreferences): boolean {
    // If lastModified is different and lastSynced exists locally
    return (
      local.lastModified !== remote.lastModified &&
      local.lastSynced !== undefined &&
      local.lastSynced !== remote.lastModified
    );
  }

  /**
   * Build list of conflicting fields
   */
  private buildConflictList(
    local: UIPreferences,
    remote: UIPreferences
  ): SyncStatus['conflicts'] {
    const conflicts: SyncStatus['conflicts'] = [];

    // Compare each category
    if (JSON.stringify(local.theme) !== JSON.stringify(remote.theme)) {
      conflicts.push({
        field: 'theme',
        localValue: local.theme,
        remoteValue: remote.theme,
        timestamp: new Date().toISOString(),
      });
    }

    if (JSON.stringify(local.layout) !== JSON.stringify(remote.layout)) {
      conflicts.push({
        field: 'layout',
        localValue: local.layout,
        remoteValue: remote.layout,
        timestamp: new Date().toISOString(),
      });
    }

    // Add more field comparisons as needed...

    return conflicts;
  }

  /**
   * Resolve conflicts using configured strategy
   */
  private resolveConflicts(local: UIPreferences, remote: UIPreferences): UIPreferences {
    switch (CONFLICT_RESOLUTION) {
      case 'local-wins':
        return local;
      case 'remote-wins':
        return remote;
      case 'newest-wins':
        return new Date(local.lastModified) > new Date(remote.lastModified) ? local : remote;
      default:
        return local;
    }
  }

  /**
   * Get sync status from localStorage
   */
  private getSyncStatus(): SyncStatus {
    try {
      const stored = localStorage.getItem(SYNC_STATUS_KEY);
      if (!stored) {
        return {
          lastSyncAttempt: new Date().toISOString(),
          syncInProgress: false,
          pendingChanges: 0,
          conflicts: [],
        };
      }
      return JSON.parse(stored);
    } catch {
      return {
        lastSyncAttempt: new Date().toISOString(),
        syncInProgress: false,
        pendingChanges: 0,
        conflicts: [],
      };
    }
  }

  /**
   * Save sync status to localStorage
   */
  private setSyncStatus(status: SyncStatus): void {
    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
  }

  /**
   * Get current sync status (public)
   */
  public getStatus(): SyncStatus {
    return this.getSyncStatus();
  }

  /**
   * Force immediate sync
   */
  public async forceSyncNow(): Promise<UIPreferences> {
    return this.sync();
  }

  /**
   * Clear all local data
   */
  public clearLocal(): void {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(SYNC_STATUS_KEY);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let syncManagerInstance: UIPreferencesSyncManager | null = null;

export function getUIPreferencesSyncManager(options: SyncOptions): UIPreferencesSyncManager {
  if (!syncManagerInstance || syncManagerInstance['userId'] !== options.userId) {
    syncManagerInstance = new UIPreferencesSyncManager(options);
  }
  return syncManagerInstance;
}

export function resetUIPreferencesSyncManager(): void {
  if (syncManagerInstance) {
    syncManagerInstance.stop();
    syncManagerInstance = null;
  }
}
