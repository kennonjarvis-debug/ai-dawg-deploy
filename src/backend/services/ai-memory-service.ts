/**
 * AI Memory Service
 * Persistent memory system for DAWG AI to remember user preferences,
 * past interactions, and contextual information
 */

import { prisma } from '../config/database';

export interface CreateMemoryInput {
  userId: string;
  type: 'preference' | 'fact' | 'context' | 'interaction';
  category?: string;
  content: string;
  metadata?: any;
  importance?: number;
  expiresAt?: Date;
}

export interface RetrieveMemoryOptions {
  userId: string;
  type?: string;
  category?: string;
  limit?: number;
  minImportance?: number;
}

export class AIMemoryService {
  /**
   * Store a new memory
   */
  async storeMemory(input: CreateMemoryInput) {
    const memory = await prisma.aIMemory.create({
      data: {
        userId: input.userId,
        type: input.type,
        category: input.category,
        content: input.content,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        importance: input.importance || 5,
        expiresAt: input.expiresAt,
      },
    });

    return memory;
  }

  /**
   * Retrieve memories for a user
   * Returns most important and recently accessed memories first
   */
  async retrieveMemories(options: RetrieveMemoryOptions) {
    const { userId, type, category, limit = 50, minImportance = 1 } = options;

    const memories = await prisma.aIMemory.findMany({
      where: {
        userId,
        type: type || undefined,
        category: category || undefined,
        importance: { gte: minImportance },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: [
        { importance: 'desc' },
        { lastAccessed: 'desc' },
      ],
      take: limit,
    });

    // Update access count and last accessed time
    const memoryIds = memories.map((m) => m.id);
    await this.incrementAccessCounts(memoryIds);

    return memories.map((m) => ({
      ...m,
      metadata: m.metadata ? JSON.parse(m.metadata) : null,
    }));
  }

  /**
   * Get relevant memories based on context
   * Uses semantic similarity (can be enhanced with embeddings)
   */
  async getRelevantMemories(userId: string, context: string, limit: number = 10) {
    // For now, simple keyword matching
    // TODO: Implement vector embeddings for semantic search
    const memories = await prisma.aIMemory.findMany({
      where: {
        userId,
        OR: [
          { content: { contains: context, mode: 'insensitive' } },
          { category: { contains: context, mode: 'insensitive' } },
        ],
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: [
        { importance: 'desc' },
        { lastAccessed: 'desc' },
      ],
      take: limit,
    });

    // Update access counts
    const memoryIds = memories.map((m) => m.id);
    await this.incrementAccessCounts(memoryIds);

    return memories.map((m) => ({
      ...m,
      metadata: m.metadata ? JSON.parse(m.metadata) : null,
    }));
  }

  /**
   * Update a memory
   */
  async updateMemory(memoryId: string, updates: Partial<CreateMemoryInput>) {
    const data: any = {};

    if (updates.content) data.content = updates.content;
    if (updates.type) data.type = updates.type;
    if (updates.category) data.category = updates.category;
    if (updates.importance !== undefined) data.importance = updates.importance;
    if (updates.metadata) data.metadata = JSON.stringify(updates.metadata);
    if (updates.expiresAt) data.expiresAt = updates.expiresAt;

    const memory = await prisma.aIMemory.update({
      where: { id: memoryId },
      data,
    });

    return {
      ...memory,
      metadata: memory.metadata ? JSON.parse(memory.metadata) : null,
    };
  }

  /**
   * Delete a memory
   */
  async deleteMemory(memoryId: string) {
    await prisma.aIMemory.delete({
      where: { id: memoryId },
    });
  }

  /**
   * Delete expired memories (cleanup)
   */
  async deleteExpiredMemories() {
    const result = await prisma.aIMemory.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });

    return result.count;
  }

  /**
   * Get memory statistics for a user
   */
  async getMemoryStats(userId: string) {
    const total = await prisma.aIMemory.count({
      where: { userId },
    });

    const byType = await prisma.aIMemory.groupBy({
      by: ['type'],
      where: { userId },
      _count: true,
    });

    const byCategory = await prisma.aIMemory.groupBy({
      by: ['category'],
      where: { userId, category: { not: null } },
      _count: true,
    });

    return {
      total,
      byType,
      byCategory,
    };
  }

  /**
   * Increment access counts for memories
   */
  private async incrementAccessCounts(memoryIds: string[]) {
    if (memoryIds.length === 0) return;

    await prisma.aIMemory.updateMany({
      where: { id: { in: memoryIds } },
      data: {
        accessCount: { increment: 1 },
        lastAccessed: new Date(),
      },
    });
  }

  /**
   * Store user preference (convenience method)
   */
  async storePreference(userId: string, preference: string, value: any) {
    return this.storeMemory({
      userId,
      type: 'preference',
      category: 'user_preferences',
      content: preference,
      metadata: { value },
      importance: 8, // Preferences are important
    });
  }

  /**
   * Get user preference (convenience method)
   */
  async getPreference(userId: string, preference: string) {
    const memories = await prisma.aIMemory.findMany({
      where: {
        userId,
        type: 'preference',
        content: preference,
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    if (memories.length === 0) return null;

    const memory = memories[0];
    return memory.metadata ? JSON.parse(memory.metadata).value : null;
  }

  /**
   * Store interaction summary (for conversation context)
   */
  async storeInteraction(userId: string, summary: string, metadata?: any) {
    return this.storeMemory({
      userId,
      type: 'interaction',
      category: 'conversation',
      content: summary,
      metadata,
      importance: 5,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expire after 30 days
    });
  }

  /**
   * Get conversation context for AI
   * Returns formatted string of relevant memories
   */
  async getConversationContext(userId: string, currentContext?: string): Promise<string> {
    let memories;

    if (currentContext) {
      memories = await this.getRelevantMemories(userId, currentContext, 10);
    } else {
      memories = await this.retrieveMemories({
        userId,
        limit: 15,
        minImportance: 5,
      });
    }

    if (memories.length === 0) {
      return 'No previous context available.';
    }

    const sections: string[] = [
      '=== AI Memory Context ===\n',
    ];

    // Group by type
    const preferences = memories.filter((m) => m.type === 'preference');
    const facts = memories.filter((m) => m.type === 'fact');
    const interactions = memories.filter((m) => m.type === 'interaction');

    if (preferences.length > 0) {
      sections.push('User Preferences:');
      preferences.forEach((m) => {
        const value = m.metadata?.value;
        sections.push(`- ${m.content}: ${value !== undefined ? value : '(stored)'}`);
      });
      sections.push('');
    }

    if (facts.length > 0) {
      sections.push('Known Facts:');
      facts.forEach((m) => {
        sections.push(`- ${m.content}`);
      });
      sections.push('');
    }

    if (interactions.length > 0) {
      sections.push('Recent Interactions:');
      interactions.slice(0, 5).forEach((m) => {
        sections.push(`- ${m.content}`);
      });
      sections.push('');
    }

    return sections.join('\n');
  }
}

export const aiMemoryService = new AIMemoryService();
