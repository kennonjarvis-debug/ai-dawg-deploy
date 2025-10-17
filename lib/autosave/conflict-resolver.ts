// Conflict resolution for auto-save
// Handles scenarios where local changes conflict with server state

export interface ConflictResolutionStrategy {
  type: 'local' | 'server' | 'merge' | 'manual';
  description: string;
}

export interface ProjectConflict {
  localVersion: any;
  serverVersion: any;
  conflictFields: string[];
}

/**
 * Detect conflicts between local and server versions
 */
export function detectConflicts(
  local: any,
  server: any,
  ignoredFields: string[] = ['updatedAt', 'lastOpenedAt']
): ProjectConflict | null {
  const conflicts: string[] = [];

  // Compare timestamps
  const localUpdated = new Date(local.updatedAt || 0);
  const serverUpdated = new Date(server.updatedAt || 0);

  // If server is newer, potential conflict
  if (serverUpdated > localUpdated) {
    // Check which fields differ
    for (const key in local) {
      if (ignoredFields.includes(key)) continue;

      if (JSON.stringify(local[key]) !== JSON.stringify(server[key])) {
        conflicts.push(key);
      }
    }

    if (conflicts.length > 0) {
      return {
        localVersion: local,
        serverVersion: server,
        conflictFields: conflicts,
      };
    }
  }

  return null;
}

/**
 * Resolve conflict using specified strategy
 */
export function resolveConflict(
  conflict: ProjectConflict,
  strategy: ConflictResolutionStrategy['type']
): any {
  switch (strategy) {
    case 'local':
      // Keep local version
      return conflict.localVersion;

    case 'server':
      // Use server version
      return conflict.serverVersion;

    case 'merge':
      // Simple merge strategy: prefer local for data, server for metadata
      return {
        ...conflict.serverVersion,
        ...conflict.localVersion,
        // Keep server timestamps
        updatedAt: conflict.serverVersion.updatedAt,
        lastOpenedAt: conflict.serverVersion.lastOpenedAt,
      };

    case 'manual':
      // Return both versions for manual resolution
      return {
        local: conflict.localVersion,
        server: conflict.serverVersion,
        requiresManualResolution: true,
      };

    default:
      return conflict.localVersion;
  }
}

/**
 * Auto-resolve conflicts using heuristics
 */
export function autoResolveConflict(conflict: ProjectConflict): any {
  const { localVersion, serverVersion, conflictFields } = conflict;

  // If only metadata conflicts, prefer server
  const metadataFields = ['updatedAt', 'lastOpenedAt', 'createdAt'];
  const dataConflicts = conflictFields.filter(
    (field) => !metadataFields.includes(field)
  );

  if (dataConflicts.length === 0) {
    return serverVersion;
  }

  // If local has more recent changes to important fields, prefer local
  const importantFields = ['tracks', 'recordings', 'bpm', 'name'];
  const hasImportantLocalChanges = dataConflicts.some((field) =>
    importantFields.includes(field)
  );

  if (hasImportantLocalChanges) {
    // Merge: keep local data with server metadata
    return {
      ...serverVersion,
      ...localVersion,
      updatedAt: new Date().toISOString(),
    };
  }

  // Default: prefer server
  return serverVersion;
}

/**
 * Check if save is safe (no conflicts)
 */
export async function checkSaveConflicts(
  projectId: string,
  localUpdatedAt: string
): Promise<ProjectConflict | null> {
  try {
    // Fetch current server version
    const response = await fetch(`/api/projects/load?projectId=${projectId}`);

    if (!response.ok) {
      return null;
    }

    const { project: serverProject } = await response.json();

    // Compare timestamps
    const localTime = new Date(localUpdatedAt);
    const serverTime = new Date(serverProject.updatedAt);

    if (serverTime > localTime) {
      // Potential conflict
      return {
        localVersion: { updatedAt: localUpdatedAt },
        serverVersion: serverProject,
        conflictFields: ['updatedAt'],
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to check conflicts:', error);
    return null;
  }
}
