/**
 * Presence Tracking Service
 * Tracks online users, their activity status, and cursor positions in real-time
 * Uses Redis for distributed presence tracking across multiple server instances
 */

import Redis from 'ioredis';
import { logger } from '../utils/logger';
import type {
  UserPresence,
  PresenceUpdate,
  UserActivityStatus,
} from '../../types/collaboration';

interface PresenceOptions {
  redisUrl?: string;
  presenceTTL?: number; // Time-to-live for presence records in seconds
  heartbeatInterval?: number; // How often clients should send heartbeats
}

const USER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
  '#F8B500', // Orange
  '#EC7063', // Coral
];

export class PresenceService {
  private redis: Redis | null = null;
  private presences: Map<string, Map<string, UserPresence>> = new Map(); // projectId -> userId -> presence
  private userColors: Map<string, string> = new Map(); // userId -> color
  private presenceTTL: number;
  private heartbeatInterval: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: PresenceOptions = {}) {
    this.presenceTTL = options.presenceTTL || 30; // 30 seconds default
    this.heartbeatInterval = options.heartbeatInterval || 10000; // 10 seconds default

    // Initialize Redis if URL provided
    if (options.redisUrl || process.env.REDIS_URL) {
      try {
        this.redis = new Redis(options.redisUrl || process.env.REDIS_URL!, {
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });

        this.redis.on('connect', () => {
          logger.info('Presence Service: Redis connected');
        });

        this.redis.on('error', (err) => {
          logger.error('Presence Service: Redis error:', err);
        });
      } catch (error) {
        logger.warn('Presence Service: Failed to connect to Redis, using in-memory storage');
        this.redis = null;
      }
    } else {
      logger.info('Presence Service: Using in-memory storage (no Redis configured)');
    }

    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Get a unique color for a user
   */
  private getUserColor(userId: string): string {
    let color = this.userColors.get(userId);

    if (!color) {
      // Assign color based on hash of user ID for consistency
      const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      color = USER_COLORS[hash % USER_COLORS.length];
      this.userColors.set(userId, color);
    }

    return color;
  }

  /**
   * User joins a project
   */
  async join(
    projectId: string,
    userId: string,
    username: string,
    avatar?: string
  ): Promise<UserPresence> {
    const presence: UserPresence = {
      userId,
      username,
      avatar,
      color: this.getUserColor(userId),
      status: 'active',
      lastActiveAt: new Date(),
      joinedAt: new Date(),
    };

    if (this.redis) {
      // Store in Redis for distributed systems
      const key = `presence:${projectId}:${userId}`;
      await this.redis.setex(key, this.presenceTTL, JSON.stringify(presence));
    } else {
      // Store in memory
      let projectPresences = this.presences.get(projectId);
      if (!projectPresences) {
        projectPresences = new Map();
        this.presences.set(projectId, projectPresences);
      }
      projectPresences.set(userId, presence);
    }

    logger.info(`User ${username} (${userId}) joined project ${projectId}`);
    return presence;
  }

  /**
   * User leaves a project
   */
  async leave(projectId: string, userId: string): Promise<void> {
    if (this.redis) {
      const key = `presence:${projectId}:${userId}`;
      await this.redis.del(key);
    } else {
      const projectPresences = this.presences.get(projectId);
      if (projectPresences) {
        projectPresences.delete(userId);
      }
    }

    logger.info(`User ${userId} left project ${projectId}`);
  }

  /**
   * Update user presence
   */
  async update(projectId: string, userId: string, update: PresenceUpdate): Promise<void> {
    const current = await this.get(projectId, userId);

    if (!current) {
      logger.warn(`Cannot update presence for user ${userId} - not in project ${projectId}`);
      return;
    }

    const updated: UserPresence = {
      ...current,
      ...update,
      lastActiveAt: new Date(),
    };

    if (this.redis) {
      const key = `presence:${projectId}:${userId}`;
      await this.redis.setex(key, this.presenceTTL, JSON.stringify(updated));
    } else {
      const projectPresences = this.presences.get(projectId);
      if (projectPresences) {
        projectPresences.set(userId, updated);
      }
    }

    logger.debug(`Updated presence for user ${userId} in project ${projectId}`);
  }

  /**
   * Send heartbeat to keep presence alive
   */
  async heartbeat(projectId: string, userId: string): Promise<void> {
    await this.update(projectId, userId, {
      userId,
      lastActiveAt: new Date(),
    });
  }

  /**
   * Get presence for a specific user
   */
  async get(projectId: string, userId: string): Promise<UserPresence | null> {
    if (this.redis) {
      const key = `presence:${projectId}:${userId}`;
      const data = await this.redis.get(key);
      if (!data) return null;

      const presence = JSON.parse(data);
      // Convert date strings back to Date objects
      presence.lastActiveAt = new Date(presence.lastActiveAt);
      presence.joinedAt = new Date(presence.joinedAt);
      return presence;
    } else {
      const projectPresences = this.presences.get(projectId);
      return projectPresences?.get(userId) || null;
    }
  }

  /**
   * Get all presences for a project
   */
  async getAll(projectId: string): Promise<UserPresence[]> {
    if (this.redis) {
      const pattern = `presence:${projectId}:*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length === 0) return [];

      const values = await this.redis.mget(...keys);
      const presences: UserPresence[] = [];

      for (const value of values) {
        if (value) {
          const presence = JSON.parse(value);
          presence.lastActiveAt = new Date(presence.lastActiveAt);
          presence.joinedAt = new Date(presence.joinedAt);
          presences.push(presence);
        }
      }

      return presences;
    } else {
      const projectPresences = this.presences.get(projectId);
      if (!projectPresences) return [];
      return Array.from(projectPresences.values());
    }
  }

  /**
   * Get count of active users in a project
   */
  async getCount(projectId: string): Promise<number> {
    if (this.redis) {
      const pattern = `presence:${projectId}:*`;
      const keys = await this.redis.keys(pattern);
      return keys.length;
    } else {
      const projectPresences = this.presences.get(projectId);
      return projectPresences?.size || 0;
    }
  }

  /**
   * Check if user is in project
   */
  async isPresent(projectId: string, userId: string): Promise<boolean> {
    const presence = await this.get(projectId, userId);
    return presence !== null;
  }

  /**
   * Get all projects a user is in
   */
  async getUserProjects(userId: string): Promise<string[]> {
    if (this.redis) {
      const pattern = `presence:*:${userId}`;
      const keys = await this.redis.keys(pattern);

      // Extract project IDs from keys: presence:{projectId}:{userId}
      return keys.map((key) => {
        const parts = key.split(':');
        return parts[1];
      });
    } else {
      const projects: string[] = [];

      this.presences.forEach((projectPresences, projectId) => {
        if (projectPresences.has(userId)) {
          projects.push(projectId);
        }
      });

      return projects;
    }
  }

  /**
   * Set user activity status
   */
  async setStatus(
    projectId: string,
    userId: string,
    status: UserActivityStatus
  ): Promise<void> {
    await this.update(projectId, userId, { userId, status });
  }

  /**
   * Update cursor position
   */
  async updateCursor(
    projectId: string,
    userId: string,
    cursor: { time: number; trackId?: string }
  ): Promise<void> {
    await this.update(projectId, userId, { userId, cursor });
  }

  /**
   * Clean up stale presences
   */
  private async cleanupStalePresences(): Promise<void> {
    const now = Date.now();
    const staleThreshold = this.presenceTTL * 1000; // Convert to milliseconds

    if (this.redis) {
      // Redis TTL handles cleanup automatically
      return;
    }

    // Clean up in-memory presences
    this.presences.forEach((projectPresences, projectId) => {
      const staleUsers: string[] = [];

      projectPresences.forEach((presence, userId) => {
        const inactiveTime = now - presence.lastActiveAt.getTime();
        if (inactiveTime > staleThreshold) {
          staleUsers.push(userId);
        }
      });

      staleUsers.forEach((userId) => {
        projectPresences.delete(userId);
        logger.debug(`Removed stale presence for user ${userId} in project ${projectId}`);
      });

      // Remove empty project maps
      if (projectPresences.size === 0) {
        this.presences.delete(projectId);
      }
    });
  }

  /**
   * Start periodic cleanup
   */
  private startCleanupInterval(): void {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupStalePresences().catch((error) => {
        logger.error('Error during presence cleanup:', error);
      });
    }, 60 * 1000);
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    totalProjects: number;
    totalUsers: number;
    averageUsersPerProject: number;
  }> {
    if (this.redis) {
      const pattern = 'presence:*';
      const keys = await this.redis.keys(pattern);

      const projects = new Set<string>();
      const users = new Set<string>();

      keys.forEach((key) => {
        const parts = key.split(':');
        projects.add(parts[1]); // projectId
        users.add(parts[2]); // userId
      });

      return {
        totalProjects: projects.size,
        totalUsers: users.size,
        averageUsersPerProject: projects.size > 0 ? users.size / projects.size : 0,
      };
    } else {
      const totalProjects = this.presences.size;
      let totalUsers = 0;

      this.presences.forEach((projectPresences) => {
        totalUsers += projectPresences.size;
      });

      return {
        totalProjects,
        totalUsers,
        averageUsersPerProject: totalProjects > 0 ? totalUsers / totalProjects : 0,
      };
    }
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }

    this.presences.clear();
    this.userColors.clear();

    logger.info('Presence Service: Shutdown complete');
  }
}

// Singleton instance
export const presenceService = new PresenceService({
  redisUrl: process.env.REDIS_URL,
});
