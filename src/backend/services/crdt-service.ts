/**
 * CRDT Service using Y.js
 * Provides conflict-free replicated data types for real-time collaboration
 * Uses Y.js for CRDT synchronization - proven library used by Figma, Notion, etc.
 */

import * as Y from 'yjs';
import { logger } from '../utils/logger';
import type { SyncMessage, Operation } from '../../types/collaboration';

interface ProjectDocument {
  doc: Y.Doc;
  tracks: Y.Map<any>;
  clips: Y.Map<any>;
  effects: Y.Map<any>;
  automation: Y.Map<any>;
  metadata: Y.Map<any>;
  subscribers: Set<(update: Uint8Array) => void>;
  lastModified: Date;
}

export class CRDTService {
  private documents: Map<string, ProjectDocument> = new Map();
  private updateBuffer: Map<string, Uint8Array[]> = new Map();
  private flushTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly FLUSH_INTERVAL = 100; // ms - batch updates for performance

  /**
   * Get or create a Y.js document for a project
   */
  getDocument(projectId: string): ProjectDocument {
    let projectDoc = this.documents.get(projectId);

    if (!projectDoc) {
      const doc = new Y.Doc();

      // Create shared types for different parts of the project
      const tracks = doc.getMap('tracks');
      const clips = doc.getMap('clips');
      const effects = doc.getMap('effects');
      const automation = doc.getMap('automation');
      const metadata = doc.getMap('metadata');

      projectDoc = {
        doc,
        tracks,
        clips,
        effects,
        automation,
        metadata,
        subscribers: new Set(),
        lastModified: new Date(),
      };

      // Set up update listener
      doc.on('update', (update: Uint8Array, origin: any) => {
        if (origin !== 'remote') {
          // Local change - broadcast to subscribers
          this.bufferUpdate(projectId, update);
        }
      });

      this.documents.set(projectId, projectDoc);
      logger.info(`CRDT document created for project: ${projectId}`);
    }

    return projectDoc;
  }

  /**
   * Apply a remote update to the document
   */
  applyUpdate(projectId: string, update: Uint8Array, userId: string): void {
    const projectDoc = this.getDocument(projectId);

    try {
      // Apply update with 'remote' origin to prevent echo
      Y.applyUpdate(projectDoc.doc, update, 'remote');
      projectDoc.lastModified = new Date();

      logger.debug(`Applied CRDT update to project ${projectId} from user ${userId}`);
    } catch (error) {
      logger.error(`Failed to apply CRDT update to project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get the current state vector for a project
   * Used for efficient synchronization of new clients
   */
  getStateVector(projectId: string): Uint8Array {
    const projectDoc = this.getDocument(projectId);
    return Y.encodeStateVector(projectDoc.doc);
  }

  /**
   * Get the state difference between client and server
   * Used for catching up new or disconnected clients
   */
  getStateDifference(projectId: string, clientStateVector: Uint8Array): Uint8Array {
    const projectDoc = this.getDocument(projectId);
    return Y.encodeStateAsUpdate(projectDoc.doc, clientStateVector);
  }

  /**
   * Subscribe to updates for a project
   */
  subscribe(projectId: string, callback: (update: Uint8Array) => void): () => void {
    const projectDoc = this.getDocument(projectId);
    projectDoc.subscribers.add(callback);

    logger.debug(`Subscriber added for project ${projectId} (total: ${projectDoc.subscribers.size})`);

    // Return unsubscribe function
    return () => {
      projectDoc.subscribers.delete(callback);
      logger.debug(`Subscriber removed for project ${projectId} (total: ${projectDoc.subscribers.size})`);

      // Clean up document if no more subscribers
      if (projectDoc.subscribers.size === 0) {
        this.cleanupDocument(projectId);
      }
    };
  }

  /**
   * Buffer updates and batch them for performance
   */
  private bufferUpdate(projectId: string, update: Uint8Array): void {
    // Get or create buffer
    let buffer = this.updateBuffer.get(projectId);
    if (!buffer) {
      buffer = [];
      this.updateBuffer.set(projectId, buffer);
    }

    buffer.push(update);

    // Clear existing timer
    const existingTimer = this.flushTimers.get(projectId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer to flush
    const timer = setTimeout(() => {
      this.flushUpdates(projectId);
    }, this.FLUSH_INTERVAL);

    this.flushTimers.set(projectId, timer);
  }

  /**
   * Flush buffered updates to subscribers
   */
  private flushUpdates(projectId: string): void {
    const buffer = this.updateBuffer.get(projectId);
    const projectDoc = this.documents.get(projectId);

    if (!buffer || buffer.length === 0 || !projectDoc) {
      return;
    }

    // Merge all buffered updates into one
    const mergedUpdate = Y.mergeUpdates(buffer);

    // Send to all subscribers
    projectDoc.subscribers.forEach((callback) => {
      try {
        callback(mergedUpdate);
      } catch (error) {
        logger.error(`Error in CRDT subscriber callback:`, error);
      }
    });

    // Clear buffer and timer
    this.updateBuffer.delete(projectId);
    this.flushTimers.delete(projectId);

    logger.debug(`Flushed ${buffer.length} CRDT updates for project ${projectId}`);
  }

  /**
   * Load project state from JSON snapshot
   */
  loadSnapshot(projectId: string, snapshot: Record<string, any>): void {
    const projectDoc = this.getDocument(projectId);

    try {
      // Load data into shared types
      if (snapshot.tracks) {
        const tracksMap = new Map(Object.entries(snapshot.tracks));
        projectDoc.tracks.clear();
        tracksMap.forEach((value, key) => {
          projectDoc.tracks.set(key, value);
        });
      }

      if (snapshot.clips) {
        const clipsMap = new Map(Object.entries(snapshot.clips));
        projectDoc.clips.clear();
        clipsMap.forEach((value, key) => {
          projectDoc.clips.set(key, value);
        });
      }

      if (snapshot.effects) {
        const effectsMap = new Map(Object.entries(snapshot.effects));
        projectDoc.effects.clear();
        effectsMap.forEach((value, key) => {
          projectDoc.effects.set(key, value);
        });
      }

      if (snapshot.automation) {
        const automationMap = new Map(Object.entries(snapshot.automation));
        projectDoc.automation.clear();
        automationMap.forEach((value, key) => {
          projectDoc.automation.set(key, value);
        });
      }

      if (snapshot.metadata) {
        const metadataMap = new Map(Object.entries(snapshot.metadata));
        projectDoc.metadata.clear();
        metadataMap.forEach((value, key) => {
          projectDoc.metadata.set(key, value);
        });
      }

      projectDoc.lastModified = new Date();
      logger.info(`Loaded snapshot for project ${projectId}`);
    } catch (error) {
      logger.error(`Failed to load snapshot for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Export current state as JSON snapshot
   */
  exportSnapshot(projectId: string): Record<string, any> {
    const projectDoc = this.getDocument(projectId);

    return {
      tracks: Object.fromEntries(projectDoc.tracks.entries()),
      clips: Object.fromEntries(projectDoc.clips.entries()),
      effects: Object.fromEntries(projectDoc.effects.entries()),
      automation: Object.fromEntries(projectDoc.automation.entries()),
      metadata: Object.fromEntries(projectDoc.metadata.entries()),
    };
  }

  /**
   * Get track by ID
   */
  getTrack(projectId: string, trackId: string): any {
    const projectDoc = this.getDocument(projectId);
    return projectDoc.tracks.get(trackId);
  }

  /**
   * Set track data
   */
  setTrack(projectId: string, trackId: string, trackData: any): void {
    const projectDoc = this.getDocument(projectId);
    projectDoc.tracks.set(trackId, trackData);
  }

  /**
   * Delete track
   */
  deleteTrack(projectId: string, trackId: string): void {
    const projectDoc = this.getDocument(projectId);
    projectDoc.tracks.delete(trackId);
  }

  /**
   * Get clip by ID
   */
  getClip(projectId: string, clipId: string): any {
    const projectDoc = this.getDocument(projectId);
    return projectDoc.clips.get(clipId);
  }

  /**
   * Set clip data
   */
  setClip(projectId: string, clipId: string, clipData: any): void {
    const projectDoc = this.getDocument(projectId);
    projectDoc.clips.set(clipId, clipData);
  }

  /**
   * Delete clip
   */
  deleteClip(projectId: string, clipId: string): void {
    const projectDoc = this.getDocument(projectId);
    projectDoc.clips.delete(clipId);
  }

  /**
   * Get all tracks
   */
  getAllTracks(projectId: string): Map<string, any> {
    const projectDoc = this.getDocument(projectId);
    return new Map(projectDoc.tracks.entries());
  }

  /**
   * Get all clips
   */
  getAllClips(projectId: string): Map<string, any> {
    const projectDoc = this.getDocument(projectId);
    return new Map(projectDoc.clips.entries());
  }

  /**
   * Clean up document when no longer needed
   */
  private cleanupDocument(projectId: string): void {
    const timer = this.flushTimers.get(projectId);
    if (timer) {
      clearTimeout(timer);
      this.flushTimers.delete(projectId);
    }

    this.updateBuffer.delete(projectId);
    this.documents.delete(projectId);

    logger.info(`Cleaned up CRDT document for project ${projectId}`);
  }

  /**
   * Force cleanup for a specific project
   */
  destroyDocument(projectId: string): void {
    const projectDoc = this.documents.get(projectId);
    if (projectDoc) {
      projectDoc.doc.destroy();
      this.cleanupDocument(projectId);
    }
  }

  /**
   * Get statistics about active documents
   */
  getStats(): {
    activeDocuments: number;
    totalSubscribers: number;
    bufferedUpdates: number;
  } {
    let totalSubscribers = 0;
    let bufferedUpdates = 0;

    this.documents.forEach((doc) => {
      totalSubscribers += doc.subscribers.size;
    });

    this.updateBuffer.forEach((buffer) => {
      bufferedUpdates += buffer.length;
    });

    return {
      activeDocuments: this.documents.size,
      totalSubscribers,
      bufferedUpdates,
    };
  }

  /**
   * Clean up old inactive documents (run periodically)
   */
  cleanupInactiveDocuments(inactivityThresholdMs: number = 30 * 60 * 1000): void {
    const now = new Date();

    this.documents.forEach((doc, projectId) => {
      const inactiveTime = now.getTime() - doc.lastModified.getTime();

      if (doc.subscribers.size === 0 && inactiveTime > inactivityThresholdMs) {
        logger.info(
          `Cleaning up inactive document for project ${projectId} (inactive for ${Math.round(
            inactiveTime / 1000
          )}s)`
        );
        this.destroyDocument(projectId);
      }
    });
  }
}

// Singleton instance
export const crdtService = new CRDTService();

// Periodic cleanup of inactive documents (every 10 minutes)
setInterval(() => {
  crdtService.cleanupInactiveDocuments();
}, 10 * 60 * 1000);
