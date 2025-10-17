/**
 * UI Preferences Migration System
 * Instance 4 (Data & Storage - Karen)
 *
 * Handles schema version upgrades and downgrades
 * All migrations are tested and reversible
 */

import {
  UIPreferencesSchema,
  getDefaultUIPreferences,
  type UIPreferences,
  type PreferenceMigration,
} from '@/lib/types/ui-preferences';

// ============================================================================
// CURRENT SCHEMA VERSION
// ============================================================================

export const CURRENT_SCHEMA_VERSION = 1;

// ============================================================================
// MIGRATION DEFINITIONS
// ============================================================================

type MigrationFunction = (data: any) => { data: any; changes: PreferenceMigration['changes'] };

/**
 * Migration from v1 to v2 (example - not yet needed)
 * Example: Add new field 'notifications' to preferences
 */
const migrateV1ToV2: MigrationFunction = (data) => {
  const changes: PreferenceMigration['changes'] = [];

  // Example migration logic
  // if (!data.notifications) {
  //   data.notifications = {
  //     enabled: true,
  //     sound: true,
  //     desktop: true,
  //   };
  //   changes.push({
  //     field: 'notifications',
  //     oldValue: undefined,
  //     newValue: data.notifications,
  //     reason: 'Added notifications preferences in v2',
  //   });
  // }

  return { data, changes };
};

/**
 * Migration from v2 to v1 (downgrade)
 */
const migrateV2ToV1: MigrationFunction = (data) => {
  const changes: PreferenceMigration['changes'] = [];

  // Example downgrade logic
  // if (data.notifications) {
  //   changes.push({
  //     field: 'notifications',
  //     oldValue: data.notifications,
  //     newValue: undefined,
  //     reason: 'Removed notifications preferences for v1 compatibility',
  //   });
  //   delete data.notifications;
  // }

  return { data, changes };
};

// ============================================================================
// MIGRATION REGISTRY
// ============================================================================

interface MigrationStep {
  from: number;
  to: number;
  upgrade: MigrationFunction;
  downgrade: MigrationFunction;
}

const migrations: MigrationStep[] = [
  {
    from: 1,
    to: 2,
    upgrade: migrateV1ToV2,
    downgrade: migrateV2ToV1,
  },
  // Add more migrations here as schema evolves
];

// ============================================================================
// MIGRATION EXECUTOR
// ============================================================================

export class PreferenceMigrator {
  /**
   * Migrate preferences from one version to another
   */
  static async migrate(
    data: any,
    fromVersion: number,
    toVersion: number
  ): Promise<{ data: UIPreferences; migration: PreferenceMigration }> {
    const migration: PreferenceMigration = {
      fromVersion,
      toVersion,
      migratedAt: new Date().toISOString(),
      changes: [],
      success: false,
      errors: [],
    };

    try {
      let currentData = { ...data };
      let currentVersion = fromVersion;

      // Determine migration path
      const isUpgrade = toVersion > fromVersion;
      const steps = this.findMigrationPath(fromVersion, toVersion);

      if (steps.length === 0) {
        throw new Error(`No migration path found from v${fromVersion} to v${toVersion}`);
      }

      // Execute migrations in order
      for (const step of steps) {
        const migrationFn = isUpgrade ? step.upgrade : step.downgrade;
        const result = migrationFn(currentData);

        currentData = result.data;
        migration.changes.push(...result.changes);
        currentVersion = isUpgrade ? step.to : step.from;
      }

      // Update version in data
      currentData.version = toVersion;
      currentData.lastModified = new Date().toISOString();

      // Validate migrated data
      const validated = UIPreferencesSchema.parse(currentData);

      migration.success = true;
      return { data: validated, migration };
    } catch (error) {
      migration.success = false;
      migration.errors.push(error instanceof Error ? error.message : 'Unknown migration error');
      throw error;
    }
  }

  /**
   * Find migration path between versions
   */
  private static findMigrationPath(fromVersion: number, toVersion: number): MigrationStep[] {
    const isUpgrade = toVersion > fromVersion;
    const steps: MigrationStep[] = [];

    if (isUpgrade) {
      // Forward migration
      let currentVersion = fromVersion;
      while (currentVersion < toVersion) {
        const step = migrations.find((m) => m.from === currentVersion);
        if (!step) {
          throw new Error(`No migration step found from v${currentVersion}`);
        }
        steps.push(step);
        currentVersion = step.to;
      }
    } else {
      // Backward migration (downgrade)
      let currentVersion = fromVersion;
      while (currentVersion > toVersion) {
        const step = migrations.find((m) => m.to === currentVersion);
        if (!step) {
          throw new Error(`No downgrade step found from v${currentVersion}`);
        }
        steps.push(step);
        currentVersion = step.from;
      }
    }

    return steps;
  }

  /**
   * Check if preferences need migration
   */
  static needsMigration(data: any): boolean {
    const version = data?.version ?? 1;
    return version !== CURRENT_SCHEMA_VERSION;
  }

  /**
   * Auto-migrate preferences to current schema version
   */
  static async autoMigrate(data: any): Promise<UIPreferences> {
    const version = data?.version ?? 1;

    if (version === CURRENT_SCHEMA_VERSION) {
      return UIPreferencesSchema.parse(data);
    }

    console.log(`[PreferenceMigrator] Migrating from v${version} to v${CURRENT_SCHEMA_VERSION}`);

    const result = await this.migrate(data, version, CURRENT_SCHEMA_VERSION);

    console.log('[PreferenceMigrator] Migration successful:', {
      changes: result.migration.changes.length,
      details: result.migration.changes,
    });

    return result.data;
  }

  /**
   * Get migration history for a user
   */
  static getMigrationHistory(userId: string): PreferenceMigration[] {
    try {
      const stored = localStorage.getItem(`dawg-ai:migration-history:${userId}`);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  /**
   * Save migration to history
   */
  static saveMigrationHistory(userId: string, migration: PreferenceMigration): void {
    try {
      const history = this.getMigrationHistory(userId);
      history.push(migration);
      // Keep only last 10 migrations
      if (history.length > 10) {
        history.shift();
      }
      localStorage.setItem(`dawg-ai:migration-history:${userId}`, JSON.stringify(history));
    } catch (error) {
      console.error('[PreferenceMigrator] Failed to save migration history:', error);
    }
  }

  /**
   * Validate preferences structure without migration
   */
  static validate(data: any): { valid: boolean; errors: string[] } {
    try {
      UIPreferencesSchema.parse(data);
      return { valid: true, errors: [] };
    } catch (error: any) {
      return {
        valid: false,
        errors: error.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`) || ['Unknown validation error'],
      };
    }
  }

  /**
   * Create backup of preferences before migration
   */
  static createBackup(userId: string, data: UIPreferences): void {
    try {
      const backups = this.getBackups(userId);
      backups.push({
        timestamp: new Date().toISOString(),
        version: data.version,
        data,
      });

      // Keep only last 5 backups
      if (backups.length > 5) {
        backups.shift();
      }

      localStorage.setItem(`dawg-ai:preference-backups:${userId}`, JSON.stringify(backups));
      console.log('[PreferenceMigrator] Backup created successfully');
    } catch (error) {
      console.error('[PreferenceMigrator] Failed to create backup:', error);
    }
  }

  /**
   * Get preference backups
   */
  static getBackups(userId: string): Array<{ timestamp: string; version: number; data: UIPreferences }> {
    try {
      const stored = localStorage.getItem(`dawg-ai:preference-backups:${userId}`);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  /**
   * Restore preferences from backup
   */
  static restoreFromBackup(userId: string, timestamp: string): UIPreferences | null {
    try {
      const backups = this.getBackups(userId);
      const backup = backups.find((b) => b.timestamp === timestamp);

      if (!backup) {
        console.error('[PreferenceMigrator] Backup not found:', timestamp);
        return null;
      }

      console.log('[PreferenceMigrator] Restored preferences from backup:', timestamp);
      return backup.data;
    } catch (error) {
      console.error('[PreferenceMigrator] Failed to restore from backup:', error);
      return null;
    }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Load and auto-migrate preferences from localStorage
 */
export async function loadAndMigratePreferences(userId: string): Promise<UIPreferences> {
  try {
    const stored = localStorage.getItem('dawg-ai:ui-preferences');

    if (!stored) {
      console.log('[PreferenceMigrator] No stored preferences, using defaults');
      return getDefaultUIPreferences(userId);
    }

    const data = JSON.parse(stored);

    // Check if migration needed
    if (PreferenceMigrator.needsMigration(data)) {
      // Create backup before migration
      PreferenceMigrator.createBackup(userId, data);

      // Perform migration
      const migrated = await PreferenceMigrator.autoMigrate(data);

      // Save migrated preferences
      localStorage.setItem('dawg-ai:ui-preferences', JSON.stringify(migrated));

      return migrated;
    }

    // No migration needed, just validate
    return UIPreferencesSchema.parse(data);
  } catch (error) {
    console.error('[PreferenceMigrator] Failed to load preferences:', error);
    // Return defaults if loading fails
    return getDefaultUIPreferences(userId);
  }
}

/**
 * Export preferences for backup/transfer
 */
export function exportPreferences(preferences: UIPreferences): string {
  return JSON.stringify(preferences, null, 2);
}

/**
 * Import preferences from backup/transfer
 */
export async function importPreferences(userId: string, json: string): Promise<UIPreferences> {
  try {
    const data = JSON.parse(json);

    // Validate and migrate if necessary
    const migrated = await PreferenceMigrator.autoMigrate({ ...data, userId });

    return migrated;
  } catch (error) {
    console.error('[PreferenceMigrator] Failed to import preferences:', error);
    throw error;
  }
}
