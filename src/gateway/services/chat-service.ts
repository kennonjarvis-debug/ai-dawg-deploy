/**
 * Chat Service
 * Manages conversations and messages with database persistence
 */

import { PrismaClient } from '@prisma/client';
import { ExtractedEntities } from './intent-service';

const prisma = new PrismaClient();

export interface CreateConversationParams {
  userId: string;
  projectId?: string;
}

export interface AddMessageParams {
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent?: string;
  entities?: ExtractedEntities;
  generationId?: string;
}

export interface ConversationWithMessages {
  id: string;
  userId: string;
  projectId: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    intent: string | null;
    entities: any;
    generationId: string | null;
    createdAt: Date;
  }>;
}

export interface ListConversationsParams {
  userId: string;
  projectId?: string;
  limit?: number;
  offset?: number;
}

export class ChatService {
  /**
   * Create a new conversation
   */
  async createConversation(params: CreateConversationParams): Promise<ConversationWithMessages> {
    const { userId, projectId } = params;

    const conversation = await prisma.conversation.create({
      data: {
        userId,
        projectId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return this.formatConversation(conversation);
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(params: AddMessageParams): Promise<ConversationWithMessages> {
    const { conversationId, role, content, intent, entities, generationId } = params;

    // Create the message
    await prisma.message.create({
      data: {
        conversationId,
        role,
        content,
        intent: intent || null,
        entities: entities ? JSON.stringify(entities) : null,
        generationId: generationId || null,
      },
    });

    // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Return full conversation with all messages
    return this.getConversation(conversationId);
  }

  /**
   * Get a conversation with all its messages
   */
  async getConversation(conversationId: string): Promise<ConversationWithMessages> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    return this.formatConversation(conversation);
  }

  /**
   * List conversations for a user
   */
  async listConversations(params: ListConversationsParams): Promise<{
    conversations: Array<{
      id: string;
      userId: string;
      projectId: string | null;
      createdAt: Date;
      updatedAt: Date;
      messageCount: number;
      lastMessage?: {
        content: string;
        createdAt: Date;
      };
    }>;
    total: number;
  }> {
    const { userId, projectId, limit = 20, offset = 0 } = params;

    const where: any = { userId };
    if (projectId) {
      where.projectId = projectId;
    }

    // Get total count
    const total = await prisma.conversation.count({ where });

    // Get conversations with message preview
    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get last message only
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return {
      conversations: conversations.map((conv) => ({
        id: conv.id,
        userId: conv.userId,
        projectId: conv.projectId,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messageCount: conv.messages.length,
        lastMessage: conv.messages[0]
          ? {
              content: conv.messages[0].content,
              createdAt: conv.messages[0].createdAt,
            }
          : undefined,
      })),
      total,
    };
  }

  /**
   * Delete a conversation and all its messages
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await prisma.conversation.delete({
      where: { id: conversationId },
    });
  }

  /**
   * Get messages for a conversation with pagination
   */
  async getMessages(
    conversationId: string,
    params: { limit?: number; offset?: number } = {}
  ): Promise<Array<{
    id: string;
    role: string;
    content: string;
    intent: string | null;
    entities: any;
    generationId: string | null;
    createdAt: Date;
  }>> {
    const { limit = 50, offset = 0 } = params;

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });

    return messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      intent: msg.intent,
      entities: msg.entities ? JSON.parse(msg.entities) : null,
      generationId: msg.generationId,
      createdAt: msg.createdAt,
    }));
  }

  /**
   * Update a message (useful for streaming completions)
   */
  async updateMessage(
    messageId: string,
    updates: {
      content?: string;
      intent?: string;
      entities?: ExtractedEntities;
      generationId?: string;
    }
  ): Promise<void> {
    const data: any = {};

    if (updates.content !== undefined) data.content = updates.content;
    if (updates.intent !== undefined) data.intent = updates.intent;
    if (updates.entities !== undefined) data.entities = JSON.stringify(updates.entities);
    if (updates.generationId !== undefined) data.generationId = updates.generationId;

    await prisma.message.update({
      where: { id: messageId },
      data,
    });
  }

  /**
   * Get conversation context (last N messages for AI context)
   */
  async getConversationContext(
    conversationId: string,
    limit: number = 10
  ): Promise<Array<{ role: string; content: string }>> {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Reverse to get chronological order
    return messages
      .reverse()
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
  }

  /**
   * Search conversations by content
   */
  async searchConversations(
    userId: string,
    query: string,
    limit: number = 10
  ): Promise<Array<{
    conversationId: string;
    message: {
      id: string;
      content: string;
      createdAt: Date;
    };
  }>> {
    const messages = await prisma.message.findMany({
      where: {
        conversation: { userId },
        content: { contains: query },
      },
      include: {
        conversation: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages.map((msg) => ({
      conversationId: msg.conversationId,
      message: {
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt,
      },
    }));
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(conversationId: string): Promise<{
    messageCount: number;
    userMessages: number;
    assistantMessages: number;
    generationsCount: number;
    firstMessageAt: Date | null;
    lastMessageAt: Date | null;
  }> {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      select: {
        role: true,
        generationId: true,
        createdAt: true,
      },
    });

    const userMessages = messages.filter((m) => m.role === 'user').length;
    const assistantMessages = messages.filter((m) => m.role === 'assistant').length;
    const generationsCount = messages.filter((m) => m.generationId).length;

    return {
      messageCount: messages.length,
      userMessages,
      assistantMessages,
      generationsCount,
      firstMessageAt: messages.length > 0 ? messages[0].createdAt : null,
      lastMessageAt: messages.length > 0 ? messages[messages.length - 1].createdAt : null,
    };
  }

  /**
   * Format conversation for API response
   */
  private formatConversation(conversation: any): ConversationWithMessages {
    return {
      id: conversation.id,
      userId: conversation.userId,
      projectId: conversation.projectId,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: conversation.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        intent: msg.intent,
        entities: msg.entities ? JSON.parse(msg.entities) : null,
        generationId: msg.generationId,
        createdAt: msg.createdAt,
      })),
    };
  }

  /**
   * Clean up old conversations (maintenance task)
   */
  async cleanupOldConversations(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.conversation.deleteMany({
      where: {
        updatedAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }
}

// Export singleton instance
export const chatService = new ChatService();
