/**
 * Collaboration Service
 * Main service for managing real-time collaboration features
 * Coordinates CRDT sync, presence tracking, permissions, and versioning
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { crdtService } from './crdt-service';
import { presenceService } from './presence-service';
import type {
  ProjectCollaborator,
  CollaboratorRole,
  ProjectPermissions,
  ROLE_PERMISSIONS,
  TrackLock,
  LockRequest,
  LockResponse,
  ProjectVersion,
  InviteCollaboratorRequest,
  UpdateCollaboratorRequest,
  ForkProjectRequest,
  RestoreVersionRequest,
} from '../../types/collaboration';

export class CollaborationService {
  /**
   * Invite a collaborator to a project
   */
  async inviteCollaborator(
    projectId: string,
    invitedBy: string,
    request: InviteCollaboratorRequest
  ): Promise<ProjectCollaborator> {
    // Verify inviter has permission
    const canInvite = await this.hasPermission(projectId, invitedBy, 'canInvite');
    if (!canInvite) {
      throw new Error('You do not have permission to invite collaborators');
    }

    // Check if collaborator already exists
    const existing = await prisma.projectCollaborator.findUnique({
      where: {
        projectId_email: {
          projectId,
          email: request.email,
        },
      },
    });

    if (existing) {
      throw new Error('User is already a collaborator on this project');
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: request.email },
    });

    // Create collaborator invite
    const collaborator = await prisma.projectCollaborator.create({
      data: {
        projectId,
        userId: user?.id || '',
        email: request.email,
        role: request.role,
        invitedBy,
      },
    });

    logger.info(`User ${invitedBy} invited ${request.email} to project ${projectId} as ${request.role}`);

    // TODO: Send invitation email

    return collaborator as ProjectCollaborator;
  }

  /**
   * Accept collaboration invite
   */
  async acceptInvite(projectId: string, userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const collaborator = await prisma.projectCollaborator.findUnique({
      where: {
        projectId_email: {
          projectId,
          email: user.email,
        },
      },
    });

    if (!collaborator) {
      throw new Error('Invitation not found');
    }

    if (collaborator.inviteStatus === 'ACCEPTED') {
      throw new Error('Invitation already accepted');
    }

    await prisma.projectCollaborator.update({
      where: { id: collaborator.id },
      data: {
        userId,
        inviteStatus: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    logger.info(`User ${userId} accepted invite to project ${projectId}`);
  }

  /**
   * Update collaborator role
   */
  async updateCollaborator(
    projectId: string,
    collaboratorId: string,
    updatedBy: string,
    update: UpdateCollaboratorRequest
  ): Promise<void> {
    const canManage = await this.hasPermission(projectId, updatedBy, 'canManagePermissions');
    if (!canManage) {
      throw new Error('You do not have permission to manage collaborators');
    }

    await prisma.projectCollaborator.update({
      where: { id: collaboratorId },
      data: update,
    });

    logger.info(`User ${updatedBy} updated collaborator ${collaboratorId} in project ${projectId}`);
  }

  /**
   * Remove collaborator
   */
  async removeCollaborator(
    projectId: string,
    collaboratorId: string,
    removedBy: string
  ): Promise<void> {
    const canManage = await this.hasPermission(projectId, removedBy, 'canManagePermissions');
    if (!canManage) {
      throw new Error('You do not have permission to remove collaborators');
    }

    await prisma.projectCollaborator.delete({
      where: { id: collaboratorId },
    });

    logger.info(`User ${removedBy} removed collaborator ${collaboratorId} from project ${projectId}`);
  }

  /**
   * Get all collaborators for a project
   */
  async getCollaborators(projectId: string): Promise<ProjectCollaborator[]> {
    const collaborators = await prisma.projectCollaborator.findMany({
      where: { projectId },
      orderBy: { invitedAt: 'asc' },
    });

    return collaborators as ProjectCollaborator[];
  }

  /**
   * Get user's role in a project
   */
  async getUserRole(projectId: string, userId: string): Promise<CollaboratorRole | null> {
    // Check if user is owner
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (project?.userId === userId) {
      return 'OWNER';
    }

    // Check if user is a collaborator
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    const collaborator = await prisma.projectCollaborator.findFirst({
      where: {
        projectId,
        email: user.email,
        inviteStatus: 'ACCEPTED',
      },
    });

    return (collaborator?.role as CollaboratorRole) || null;
  }

  /**
   * Get permissions for a user in a project
   */
  async getPermissions(projectId: string, userId: string): Promise<ProjectPermissions> {
    const role = await this.getUserRole(projectId, userId);

    if (!role) {
      // No access
      return {
        canEdit: false,
        canDelete: false,
        canInvite: false,
        canManagePermissions: false,
        canExport: false,
        canComment: false,
        canChat: false,
        canLockTracks: false,
      };
    }

    const permissions = {
      OWNER: {
        canEdit: true,
        canDelete: true,
        canInvite: true,
        canManagePermissions: true,
        canExport: true,
        canComment: true,
        canChat: true,
        canLockTracks: true,
      },
      EDITOR: {
        canEdit: true,
        canDelete: false,
        canInvite: false,
        canManagePermissions: false,
        canExport: true,
        canComment: true,
        canChat: true,
        canLockTracks: true,
      },
      VIEWER: {
        canEdit: false,
        canDelete: false,
        canInvite: false,
        canManagePermissions: false,
        canExport: false,
        canComment: true,
        canChat: true,
        canLockTracks: false,
      },
    };

    return permissions[role];
  }

  /**
   * Check if user has a specific permission
   */
  async hasPermission(
    projectId: string,
    userId: string,
    permission: keyof ProjectPermissions
  ): Promise<boolean> {
    const permissions = await this.getPermissions(projectId, userId);
    return permissions[permission];
  }

  /**
   * Request a lock on a track
   */
  async requestTrackLock(
    projectId: string,
    userId: string,
    username: string,
    request: LockRequest
  ): Promise<LockResponse> {
    const canLock = await this.hasPermission(projectId, userId, 'canLockTracks');
    if (!canLock) {
      return {
        success: false,
        message: 'You do not have permission to lock tracks',
      };
    }

    // Check if track is already locked
    const existingLock = await prisma.trackLock.findUnique({
      where: {
        projectId_trackId: {
          projectId,
          trackId: request.trackId,
        },
      },
    });

    if (existingLock) {
      // Check if lock is expired
      if (existingLock.expiresAt > new Date()) {
        return {
          success: false,
          currentHolder: {
            userId: existingLock.userId,
            username: existingLock.username,
          },
          message: `Track is locked by ${existingLock.username}`,
        };
      }

      // Lock expired, delete it
      await prisma.trackLock.delete({
        where: { id: existingLock.id },
      });
    }

    // Create new lock
    const duration = request.duration || 300; // 5 minutes default
    const expiresAt = new Date(Date.now() + duration * 1000);

    const lock = await prisma.trackLock.create({
      data: {
        projectId,
        trackId: request.trackId,
        userId,
        username,
        expiresAt,
        autoRelease: true,
      },
    });

    logger.info(`User ${username} locked track ${request.trackId} in project ${projectId}`);

    return {
      success: true,
      lock: lock as TrackLock,
    };
  }

  /**
   * Release a track lock
   */
  async releaseTrackLock(projectId: string, trackId: string, userId: string): Promise<void> {
    const lock = await prisma.trackLock.findUnique({
      where: {
        projectId_trackId: {
          projectId,
          trackId,
        },
      },
    });

    if (!lock) {
      throw new Error('Track is not locked');
    }

    if (lock.userId !== userId) {
      // Only lock holder or owner can release
      const isOwner = await this.hasPermission(projectId, userId, 'canManagePermissions');
      if (!isOwner) {
        throw new Error('You do not have permission to release this lock');
      }
    }

    await prisma.trackLock.delete({
      where: { id: lock.id },
    });

    logger.info(`Track ${trackId} unlocked in project ${projectId}`);
  }

  /**
   * Get all locked tracks in a project
   */
  async getLockedTracks(projectId: string): Promise<TrackLock[]> {
    const locks = await prisma.trackLock.findMany({
      where: {
        projectId,
        expiresAt: { gt: new Date() }, // Only active locks
      },
    });

    return locks as TrackLock[];
  }

  /**
   * Clean up expired locks
   */
  async cleanupExpiredLocks(): Promise<number> {
    const result = await prisma.trackLock.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        autoRelease: true,
      },
    });

    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} expired track locks`);
    }

    return result.count;
  }

  /**
   * Create a version snapshot
   */
  async createVersion(
    projectId: string,
    userId: string,
    changeDescription?: string
  ): Promise<ProjectVersion> {
    // Get current project state
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Export CRDT state
    const snapshot = crdtService.exportSnapshot(projectId);
    const snapshotJson = JSON.stringify(snapshot);
    const size = Buffer.byteLength(snapshotJson, 'utf8');

    // Get next version number
    const latestVersion = await prisma.projectVersion.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
    });

    const nextVersion = (latestVersion?.version || 0) + 1;

    // Create version record
    const version = await prisma.projectVersion.create({
      data: {
        projectId,
        version: nextVersion,
        snapshot: snapshotJson,
        changeDescription,
        createdBy: userId,
        size,
      },
    });

    // Update project version
    await prisma.project.update({
      where: { id: projectId },
      data: { version: nextVersion },
    });

    logger.info(`Created version ${nextVersion} for project ${projectId} (size: ${size} bytes)`);

    return version as ProjectVersion;
  }

  /**
   * Get version history
   */
  async getVersionHistory(projectId: string, limit: number = 20): Promise<ProjectVersion[]> {
    const versions = await prisma.projectVersion.findMany({
      where: { projectId },
      orderBy: { version: 'desc' },
      take: limit,
    });

    return versions as ProjectVersion[];
  }

  /**
   * Restore a specific version
   */
  async restoreVersion(
    projectId: string,
    userId: string,
    request: RestoreVersionRequest
  ): Promise<void> {
    const canEdit = await this.hasPermission(projectId, userId, 'canEdit');
    if (!canEdit) {
      throw new Error('You do not have permission to restore versions');
    }

    // Get version
    const version = await prisma.projectVersion.findUnique({
      where: { id: request.versionId },
    });

    if (!version || version.projectId !== projectId) {
      throw new Error('Version not found');
    }

    // Create backup if requested
    if (request.createBackup) {
      await this.createVersion(projectId, userId, `Backup before restoring v${version.version}`);
    }

    // Load snapshot into CRDT
    const snapshot = JSON.parse(version.snapshot);
    crdtService.loadSnapshot(projectId, snapshot);

    // Update project
    await prisma.project.update({
      where: { id: projectId },
      data: {
        tracks: JSON.stringify(snapshot.tracks || {}),
        updatedAt: new Date(),
      },
    });

    logger.info(`Restored project ${projectId} to version ${version.version}`);
  }

  /**
   * Fork a project (create a copy)
   */
  async forkProject(
    projectId: string,
    userId: string,
    request: ForkProjectRequest
  ): Promise<string> {
    // Get original project
    const original = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!original) {
      throw new Error('Project not found');
    }

    // Verify user has access
    const canExport = await this.hasPermission(projectId, userId, 'canExport');
    if (!canExport) {
      throw new Error('You do not have permission to fork this project');
    }

    // Create forked project
    const forked = await prisma.project.create({
      data: {
        userId,
        name: request.name,
        description: request.description || `Fork of ${original.name}`,
        tempo: original.tempo,
        key: original.key,
        timeSignature: original.timeSignature,
        tracks: original.tracks,
        metadata: original.metadata,
      },
    });

    // Copy CRDT state
    const snapshot = crdtService.exportSnapshot(projectId);
    crdtService.loadSnapshot(forked.id, snapshot);

    // Optionally copy collaborators
    if (request.includeCollaborators) {
      const collaborators = await this.getCollaborators(projectId);

      for (const collab of collaborators) {
        if (collab.inviteStatus === 'ACCEPTED' && collab.email !== (await prisma.user.findUnique({ where: { id: userId } }))?.email) {
          await prisma.projectCollaborator.create({
            data: {
              projectId: forked.id,
              userId: collab.userId,
              email: collab.email,
              role: collab.role,
              inviteStatus: 'PENDING',
              invitedBy: userId,
            },
          });
        }
      }
    }

    logger.info(`User ${userId} forked project ${projectId} to ${forked.id}`);

    return forked.id;
  }

  /**
   * Get session statistics
   */
  async getSessionStats(projectId: string): Promise<{
    activeUsers: number;
    lockedTracks: number;
    currentVersion: number;
  }> {
    const [activeUsers, locks, project] = await Promise.all([
      presenceService.getCount(projectId),
      this.getLockedTracks(projectId),
      prisma.project.findUnique({ where: { id: projectId } }),
    ]);

    return {
      activeUsers,
      lockedTracks: locks.length,
      currentVersion: project?.version || 1,
    };
  }
}

// Singleton instance
export const collaborationService = new CollaborationService();

// Periodic cleanup of expired locks (every 2 minutes)
setInterval(() => {
  collaborationService.cleanupExpiredLocks().catch((error) => {
    logger.error('Error cleaning up expired locks:', error);
  });
}, 2 * 60 * 1000);
