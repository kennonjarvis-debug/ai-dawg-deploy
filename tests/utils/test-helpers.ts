/**
 * Test Utilities and Helpers for Chat-to-Create Testing
 * Provides common utilities for unit, integration, and E2E tests
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Wait for a generation job to complete
 * @param jobId - The generation job ID
 * @param timeout - Maximum wait time in ms (default 60s)
 * @returns The completed job
 */
export async function waitForGeneration(
  generationService: any,
  jobId: string,
  timeout: number = 60000
): Promise<any> {
  const startTime = Date.now();
  const pollInterval = 1000; // Check every second

  while (Date.now() - startTime < timeout) {
    const job = await generationService.getJob(jobId);

    if (job.status === 'completed') {
      return job;
    }

    if (job.status === 'failed') {
      throw new Error(`Generation failed: ${job.error || 'Unknown error'}`);
    }

    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Generation timeout after ${timeout}ms`);
}

/**
 * Create a mock conversation for testing
 */
export function createMockConversation(userId: string = 'test-user') {
  return {
    id: uuidv4(),
    userId,
    projectId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: [],
  };
}

/**
 * Create a mock message for testing
 */
export function createMockMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  intent?: string,
  entities?: Record<string, any>
) {
  return {
    id: uuidv4(),
    conversationId,
    role,
    content,
    intent: intent || null,
    entities: entities || null,
    generationId: null,
    createdAt: new Date(),
  };
}

/**
 * Create a mock generation job for testing
 */
export function createMockGeneration(
  userId: string = 'test-user',
  status: 'pending' | 'processing' | 'completed' | 'failed' = 'completed',
  type: 'beat' | 'stems' | 'mix' | 'master' = 'beat'
) {
  return {
    id: uuidv4(),
    userId,
    projectId: null,
    type,
    status,
    input: {
      genre: 'trap',
      bpm: 140,
      key: 'Cm',
      duration: 30,
    },
    output: status === 'completed' ? {
      audioUrl: `https://example.com/${type}-${uuidv4()}.mp3`,
      metadata: {
        genre: 'trap',
        bpm: 140,
        key: 'Cm',
        duration: 30,
      },
    } : null,
    provider: 'openai',
    cost: 0.05,
    duration: status === 'completed' ? 25000 : null,
    createdAt: new Date(),
    completedAt: status === 'completed' ? new Date() : null,
  };
}

/**
 * Create a mock WebSocket connection for testing
 */
export function createMockWebSocket() {
  const events: Record<string, Function[]> = {};

  return {
    on(event: string, handler: Function) {
      if (!events[event]) {
        events[event] = [];
      }
      events[event].push(handler);
    },

    emit(event: string, data: any) {
      if (events[event]) {
        events[event].forEach(handler => handler(data));
      }
    },

    off(event: string, handler: Function) {
      if (events[event]) {
        events[event] = events[event].filter(h => h !== handler);
      }
    },

    // For testing
    _getListeners(event: string) {
      return events[event] || [];
    },

    _clear() {
      Object.keys(events).forEach(key => {
        events[key] = [];
      });
    },
  };
}

/**
 * Create a mock transport store for DAW testing
 */
export function createMockTransportStore() {
  let state = {
    isPlaying: false,
    isRecording: false,
    bpm: 120,
    timeSignature: { numerator: 4, denominator: 4 },
    currentTime: 0,
  };

  return {
    get isPlaying() {
      return state.isPlaying;
    },

    get isRecording() {
      return state.isRecording;
    },

    get bpm() {
      return state.bpm;
    },

    get timeSignature() {
      return state.timeSignature;
    },

    togglePlay() {
      state.isPlaying = !state.isPlaying;
    },

    toggleRecord() {
      state.isRecording = !state.isRecording;
    },

    setBpm(bpm: number) {
      if (bpm < 40 || bpm > 300) {
        throw new Error('BPM must be between 40 and 300');
      }
      state.bpm = bpm;
    },

    setTimeSignature(numerator: number, denominator: number) {
      state.timeSignature = { numerator, denominator };
    },

    reset() {
      state = {
        isPlaying: false,
        isRecording: false,
        bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 },
        currentTime: 0,
      };
    },

    // For testing
    _getState() {
      return { ...state };
    },
  };
}

/**
 * Create a mock tracks store for DAW testing
 */
export function createMockTracksStore() {
  let tracks: any[] = [];

  return {
    get tracks() {
      return [...tracks];
    },

    addTrack(track: any) {
      tracks.push({
        id: uuidv4(),
        ...track,
        createdAt: new Date(),
      });
      return tracks[tracks.length - 1];
    },

    removeTrack(trackId: string) {
      tracks = tracks.filter(t => t.id !== trackId);
    },

    clearTracks() {
      tracks = [];
    },

    reset() {
      tracks = [];
    },
  };
}

/**
 * Wait for a specific WebSocket event
 */
export function waitForEvent(
  socket: any,
  eventName: string,
  timeout: number = 5000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(eventName, handler);
      reject(new Error(`Timeout waiting for event: ${eventName}`));
    }, timeout);

    const handler = (data: any) => {
      clearTimeout(timer);
      socket.off(eventName, handler);
      resolve(data);
    };

    socket.on(eventName, handler);
  });
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await sleep(delay);
      }
    }
  }

  throw new Error(`Max retries (${maxRetries}) exceeded. Last error: ${lastError?.message}`);
}

/**
 * Assert that a value is defined (TypeScript type guard)
 */
export function assertDefined<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || 'Expected value to be defined');
  }
}

/**
 * Mock AI provider response
 */
export function createMockAIProvider(mockResponses: string[] = ['Hello!']) {
  let responseIndex = 0;

  return {
    async generate(prompt: string, options?: any): Promise<string> {
      const response = mockResponses[responseIndex % mockResponses.length];
      responseIndex++;
      await sleep(100); // Simulate API delay
      return response;
    },

    async *stream(prompt: string, options?: any): AsyncIterable<string> {
      const response = mockResponses[responseIndex % mockResponses.length];
      responseIndex++;

      // Stream character by character
      for (const char of response) {
        await sleep(10);
        yield char;
      }
    },

    estimateCost(tokens: number): number {
      return tokens * 0.00002; // $0.02 per 1000 tokens
    },

    // For testing
    _resetIndex() {
      responseIndex = 0;
    },
  };
}

/**
 * Mock S3 upload service
 */
export function createMockS3Service() {
  const uploads: Map<string, Buffer> = new Map();

  return {
    async uploadAudio(buffer: Buffer, filename: string): Promise<string> {
      const key = `audio/${uuidv4()}/${filename}`;
      uploads.set(key, buffer);
      await sleep(50); // Simulate upload delay
      return `https://s3.example.com/${key}`;
    },

    async getSignedUrl(url: string, expiresIn: number = 3600): Promise<string> {
      return `${url}?signature=mock-signature&expires=${Date.now() + expiresIn * 1000}`;
    },

    // For testing
    _getUploads() {
      return uploads;
    },

    _clear() {
      uploads.clear();
    },
  };
}

/**
 * Mock database client for testing
 */
export function createMockPrismaClient() {
  const data: Record<string, any[]> = {
    conversation: [],
    message: [],
    generation: [],
  };

  return {
    conversation: {
      create: async ({ data: createData }: any) => {
        const conv = { id: uuidv4(), ...createData, createdAt: new Date(), updatedAt: new Date() };
        data.conversation.push(conv);
        return conv;
      },

      findUnique: async ({ where }: any) => {
        return data.conversation.find(c => c.id === where.id) || null;
      },

      findMany: async ({ where, skip, take }: any = {}) => {
        let results = data.conversation;
        if (where?.userId) {
          results = results.filter(c => c.userId === where.userId);
        }
        if (skip) {
          results = results.slice(skip);
        }
        if (take) {
          results = results.slice(0, take);
        }
        return results;
      },

      delete: async ({ where }: any) => {
        const index = data.conversation.findIndex(c => c.id === where.id);
        if (index >= 0) {
          const deleted = data.conversation[index];
          data.conversation.splice(index, 1);
          // Cascade delete messages
          data.message = data.message.filter(m => m.conversationId !== where.id);
          return deleted;
        }
        return null;
      },
    },

    message: {
      create: async ({ data: createData }: any) => {
        const msg = { id: uuidv4(), ...createData, createdAt: new Date() };
        data.message.push(msg);
        return msg;
      },

      findMany: async ({ where, orderBy, skip, take }: any = {}) => {
        let results = data.message;
        if (where?.conversationId) {
          results = results.filter(m => m.conversationId === where.conversationId);
        }
        if (orderBy?.createdAt === 'asc') {
          results.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        } else if (orderBy?.createdAt === 'desc') {
          results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        if (skip) {
          results = results.slice(skip);
        }
        if (take) {
          results = results.slice(0, take);
        }
        return results;
      },
    },

    generation: {
      create: async ({ data: createData }: any) => {
        const gen = { id: uuidv4(), ...createData, createdAt: new Date() };
        data.generation.push(gen);
        return gen;
      },

      findUnique: async ({ where }: any) => {
        return data.generation.find(g => g.id === where.id) || null;
      },

      update: async ({ where, data: updateData }: any) => {
        const gen = data.generation.find(g => g.id === where.id);
        if (gen) {
          Object.assign(gen, updateData);
        }
        return gen || null;
      },
    },

    // For testing
    _clear() {
      Object.keys(data).forEach(key => {
        data[key] = [];
      });
    },

    _getData() {
      return data;
    },
  };
}
