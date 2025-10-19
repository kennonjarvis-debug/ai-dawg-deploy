/**
 * Project Chat Service
 * Handles in-project chat, comments, and @mentions for collaboration
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { collaborationService } from './collaboration-service';
import type {
  ChatMessage,
  Comment,
  SendChatMessageRequest,
  CreateCommentRequest,
  UpdateCommentRequest,
} from '../../types/collaboration';

export class ProjectChatService {
  /**
   * Send a chat message
   */
  async sendMessage(
    projectId: string,
    userId: string,
    request: SendChatMessageRequest
  ): Promise<ChatMessage> {
    // Verify user has chat permission
    const canChat = await collaborationService.hasPermission(projectId, userId, 'canChat');
    if (!canChat) {
      throw new Error('You do not have permission to chat in this project');
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create message
    const message = await prisma.projectChatMessage.create({
      data: {
        projectId,
        userId,
        username: user.name || user.email,
        text: request.text,
        mentions: request.mentions ? JSON.stringify(request.mentions) : null,
        attachments: request.attachments ? JSON.stringify(request.attachments) : null,
        replyToId: request.replyToId,
      },
    });

    logger.info(`User ${userId} sent chat message in project ${projectId}`);

    // Create notifications for @mentions
    if (request.mentions && request.mentions.length > 0) {
      await this.createMentionNotifications(
        projectId,
        userId,
        request.mentions,
        message.id,
        'chat'
      );
    }

    return {
      id: message.id,
      projectId: message.projectId,
      userId: message.userId,
      username: message.username,
      avatar: user.profileImage || undefined,
      text: message.text,
      mentions: message.mentions ? JSON.parse(message.mentions) : [],
      attachments: message.attachments ? JSON.parse(message.attachments) : undefined,
      replyToId: message.replyToId || undefined,
      isEdited: message.isEdited,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }

  /**
   * Edit a chat message
   */
  async editMessage(
    messageId: string,
    userId: string,
    text: string
  ): Promise<ChatMessage> {
    const message = await prisma.projectChatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.userId !== userId) {
      throw new Error('You can only edit your own messages');
    }

    const updated = await prisma.projectChatMessage.update({
      where: { id: messageId },
      data: {
        text,
        isEdited: true,
        updatedAt: new Date(),
      },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });

    return {
      id: updated.id,
      projectId: updated.projectId,
      userId: updated.userId,
      username: updated.username,
      avatar: user?.profileImage || undefined,
      text: updated.text,
      mentions: updated.mentions ? JSON.parse(updated.mentions) : [],
      attachments: updated.attachments ? JSON.parse(updated.attachments) : undefined,
      replyToId: updated.replyToId || undefined,
      isEdited: updated.isEdited,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Delete a chat message
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await prisma.projectChatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Only message author or project owner can delete
    if (message.userId !== userId) {
      const isOwner = await collaborationService.hasPermission(
        message.projectId,
        userId,
        'canManagePermissions'
      );
      if (!isOwner) {
        throw new Error('You do not have permission to delete this message');
      }
    }

    await prisma.projectChatMessage.delete({
      where: { id: messageId },
    });

    logger.info(`User ${userId} deleted chat message ${messageId}`);
  }

  /**
   * Get chat messages for a project
   */
  async getMessages(
    projectId: string,
    limit: number = 50,
    before?: string
  ): Promise<ChatMessage[]> {
    const messages = await prisma.projectChatMessage.findMany({
      where: {
        projectId,
        ...(before && {
          createdAt: {
            lt: (await prisma.projectChatMessage.findUnique({ where: { id: before } }))!.createdAt,
          },
        }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Get user info for avatars
    const userIds = [...new Set(messages.map((m) => m.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return messages.map((message) => {
      const user = userMap.get(message.userId);
      return {
        id: message.id,
        projectId: message.projectId,
        userId: message.userId,
        username: message.username,
        avatar: user?.profileImage || undefined,
        text: message.text,
        mentions: message.mentions ? JSON.parse(message.mentions) : [],
        attachments: message.attachments ? JSON.parse(message.attachments) : undefined,
        replyToId: message.replyToId || undefined,
        isEdited: message.isEdited,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      };
    }).reverse(); // Return in chronological order
  }

  /**
   * Create a comment on a track or region
   */
  async createComment(
    projectId: string,
    userId: string,
    request: CreateCommentRequest
  ): Promise<Comment> {
    const canComment = await collaborationService.hasPermission(
      projectId,
      userId,
      'canComment'
    );
    if (!canComment) {
      throw new Error('You do not have permission to comment in this project');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const comment = await prisma.projectComment.create({
      data: {
        projectId,
        userId,
        username: user.name || user.email,
        trackId: request.trackId,
        regionId: request.regionId,
        timestamp: request.timestamp,
        text: request.text,
        mentions: request.mentions ? JSON.stringify(request.mentions) : null,
      },
    });

    logger.info(
      `User ${userId} created comment in project ${projectId}${
        request.trackId ? ` on track ${request.trackId}` : ''
      }`
    );

    // Create notifications for @mentions
    if (request.mentions && request.mentions.length > 0) {
      await this.createMentionNotifications(
        projectId,
        userId,
        request.mentions,
        comment.id,
        'comment'
      );
    }

    return {
      id: comment.id,
      projectId: comment.projectId,
      userId: comment.userId,
      username: comment.username,
      avatar: user.profileImage || undefined,
      trackId: comment.trackId || undefined,
      regionId: comment.regionId || undefined,
      timestamp: comment.timestamp || undefined,
      text: comment.text,
      mentions: comment.mentions ? JSON.parse(comment.mentions) : [],
      replies: [],
      isResolved: comment.isResolved,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  /**
   * Update a comment
   */
  async updateComment(
    commentId: string,
    userId: string,
    update: UpdateCommentRequest
  ): Promise<Comment> {
    const comment = await prisma.projectComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new Error('You can only edit your own comments');
    }

    const updated = await prisma.projectComment.update({
      where: { id: commentId },
      data: {
        ...update,
        updatedAt: new Date(),
      },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });

    return {
      id: updated.id,
      projectId: updated.projectId,
      userId: updated.userId,
      username: updated.username,
      avatar: user?.profileImage || undefined,
      trackId: updated.trackId || undefined,
      regionId: updated.regionId || undefined,
      timestamp: updated.timestamp || undefined,
      text: updated.text,
      mentions: updated.mentions ? JSON.parse(updated.mentions) : [],
      replies: [],
      isResolved: updated.isResolved,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await prisma.projectComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.userId !== userId) {
      const isOwner = await collaborationService.hasPermission(
        comment.projectId,
        userId,
        'canManagePermissions'
      );
      if (!isOwner) {
        throw new Error('You do not have permission to delete this comment');
      }
    }

    await prisma.projectComment.delete({
      where: { id: commentId },
    });

    logger.info(`User ${userId} deleted comment ${commentId}`);
  }

  /**
   * Get comments for a project
   */
  async getComments(projectId: string, trackId?: string): Promise<Comment[]> {
    const comments = await prisma.projectComment.findMany({
      where: {
        projectId,
        ...(trackId && { trackId }),
        parentId: null, // Only top-level comments
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get user info
    const userIds = [...new Set(comments.map((c) => c.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Get replies
    const commentIds = comments.map((c) => c.id);
    const replies = await prisma.projectComment.findMany({
      where: { parentId: { in: commentIds } },
      orderBy: { createdAt: 'asc' },
    });

    const repliesMap = new Map<string, typeof replies>();
    replies.forEach((reply) => {
      if (!reply.parentId) return;
      const existing = repliesMap.get(reply.parentId) || [];
      existing.push(reply);
      repliesMap.set(reply.parentId, existing);
    });

    return comments.map((comment) => {
      const user = userMap.get(comment.userId);
      const commentReplies = repliesMap.get(comment.id) || [];

      return {
        id: comment.id,
        projectId: comment.projectId,
        userId: comment.userId,
        username: comment.username,
        avatar: user?.profileImage || undefined,
        trackId: comment.trackId || undefined,
        regionId: comment.regionId || undefined,
        timestamp: comment.timestamp || undefined,
        text: comment.text,
        mentions: comment.mentions ? JSON.parse(comment.mentions) : [],
        replies: commentReplies.map((reply) => ({
          id: reply.id,
          projectId: reply.projectId,
          userId: reply.userId,
          username: reply.username,
          avatar: userMap.get(reply.userId)?.profileImage || undefined,
          trackId: reply.trackId || undefined,
          regionId: reply.regionId || undefined,
          timestamp: reply.timestamp || undefined,
          text: reply.text,
          mentions: reply.mentions ? JSON.parse(reply.mentions) : [],
          replies: [],
          isResolved: reply.isResolved,
          createdAt: reply.createdAt,
          updatedAt: reply.updatedAt,
        })),
        isResolved: comment.isResolved,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      };
    });
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(projectId: string, userId: string, since?: Date): Promise<number> {
    const count = await prisma.projectChatMessage.count({
      where: {
        projectId,
        userId: { not: userId }, // Don't count own messages
        createdAt: since ? { gt: since } : undefined,
      },
    });

    return count;
  }

  /**
   * Create notifications for @mentions
   */
  private async createMentionNotifications(
    projectId: string,
    fromUserId: string,
    mentionedUserIds: string[],
    messageId: string,
    type: 'chat' | 'comment'
  ): Promise<void> {
    const fromUser = await prisma.user.findUnique({
      where: { id: fromUserId },
    });

    if (!fromUser) return;

    const notifications = mentionedUserIds.map((userId) => ({
      userId,
      projectId,
      type: 'mention' as const,
      title: `${fromUser.name || fromUser.email} mentioned you`,
      message:
        type === 'chat'
          ? 'You were mentioned in a chat message'
          : 'You were mentioned in a comment',
      data: JSON.stringify({ messageId, fromUserId, type }),
    }));

    await prisma.collaborationNotification.createMany({
      data: notifications,
    });

    logger.debug(`Created ${notifications.length} mention notifications`);
  }
}

// Singleton instance
export const projectChatService = new ProjectChatService();
