/**
 * Multi-Provider AI Service
 * Unified interface for OpenAI, Anthropic, and Google AI with automatic fallback
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiCache } from '../../services/ai-cache-service';

export interface GenerateOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  skipCache?: boolean; // Force fresh API call, bypassing cache
}

export interface GenerateResponse {
  content: string;
  provider: string;
  tokensUsed: number;
  cost: number;
}

export interface StreamChunk {
  content: string;
  provider: string;
  done: boolean;
}

/**
 * Abstract AI Provider Interface
 */
interface AIProvider {
  name: string;
  generate(prompt: string, options: GenerateOptions): Promise<GenerateResponse>;
  stream(prompt: string, options: GenerateOptions): AsyncIterable<StreamChunk>;
  estimateCost(tokens: number): number;
  isAvailable(): boolean;
}

/**
 * OpenAI Provider
 */
class OpenAIProvider implements AIProvider {
  name = 'openai';
  private client: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async generate(prompt: string, options: GenerateOptions): Promise<GenerateResponse> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized - API key missing');
    }

    // Build cache key from messages
    const messages: any[] = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    // Check cache first (for non-streaming requests)
    if (!options.stream) {
      const cached = await aiCache.get<GenerateResponse>(
        { messages, temperature: options.temperature, maxTokens: options.maxTokens },
        {
          provider: 'openai',
          model: 'gpt-4o-mini',
          ttl: 3600, // 1 hour
          skipCache: options.skipCache,
        }
      );

      if (cached) {
        console.log('✅ Using cached OpenAI response');
        return cached;
      }
    }

    // Make API call
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
    });

    const content = response.choices[0]?.message?.content || '';
    const tokensUsed = response.usage?.total_tokens || 0;

    const result: GenerateResponse = {
      content,
      provider: this.name,
      tokensUsed,
      cost: this.estimateCost(tokensUsed),
    };

    // Cache the result
    if (!options.stream) {
      await aiCache.set(
        { messages, temperature: options.temperature, maxTokens: options.maxTokens },
        result,
        {
          provider: 'openai',
          model: 'gpt-4o-mini',
          ttl: 3600,
          skipCache: options.skipCache,
        }
      );
    }

    return result;
  }

  async *stream(prompt: string, options: GenerateOptions): AsyncIterable<StreamChunk> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized - API key missing');
    }

    const messages: any[] = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const stream = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield {
          content,
          provider: this.name,
          done: false,
        };
      }
    }

    yield {
      content: '',
      provider: this.name,
      done: true,
    };
  }

  estimateCost(tokens: number): number {
    // GPT-4o-mini pricing: $0.15 per 1M input tokens, $0.60 per 1M output tokens
    // Simplified: average $0.375 per 1M tokens
    return (tokens / 1_000_000) * 0.375;
  }
}

/**
 * Anthropic Provider
 */
class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  private client: Anthropic | null = null;

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async generate(prompt: string, options: GenerateOptions): Promise<GenerateResponse> {
    if (!this.client) {
      throw new Error('Anthropic client not initialized - API key missing');
    }

    // Build cache key
    const cacheKey = {
      prompt,
      systemPrompt: options.systemPrompt,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    };

    // Check cache first (for non-streaming requests)
    if (!options.stream) {
      const cached = await aiCache.get<GenerateResponse>(cacheKey, {
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
        ttl: 3600, // 1 hour
        skipCache: options.skipCache,
      });

      if (cached) {
        console.log('✅ Using cached Anthropic response');
        return cached;
      }
    }

    // Make API call
    const response = await this.client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: options.maxTokens ?? 2000,
      temperature: options.temperature ?? 0.7,
      system: options.systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

    const result: GenerateResponse = {
      content,
      provider: this.name,
      tokensUsed,
      cost: this.estimateCost(tokensUsed),
    };

    // Cache the result
    if (!options.stream) {
      await aiCache.set(cacheKey, result, {
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
        ttl: 3600,
        skipCache: options.skipCache,
      });
    }

    return result;
  }

  async *stream(prompt: string, options: GenerateOptions): AsyncIterable<StreamChunk> {
    if (!this.client) {
      throw new Error('Anthropic client not initialized - API key missing');
    }

    const stream = await this.client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: options.maxTokens ?? 2000,
      temperature: options.temperature ?? 0.7,
      system: options.systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield {
          content: event.delta.text,
          provider: this.name,
          done: false,
        };
      }
    }

    yield {
      content: '',
      provider: this.name,
      done: true,
    };
  }

  estimateCost(tokens: number): number {
    // Claude 3.5 Haiku pricing: $0.80 per 1M input tokens, $4.00 per 1M output tokens
    // Simplified: average $2.40 per 1M tokens
    return (tokens / 1_000_000) * 2.4;
  }
}

/**
 * Google AI Provider
 */
class GoogleProvider implements AIProvider {
  name = 'google';
  private client: GoogleGenerativeAI | null = null;

  constructor() {
    if (process.env.GOOGLE_AI_API_KEY) {
      this.client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async generate(prompt: string, options: GenerateOptions): Promise<GenerateResponse> {
    if (!this.client) {
      throw new Error('Google AI client not initialized - API key missing');
    }

    // Build cache key
    const cacheKey = {
      prompt,
      systemPrompt: options.systemPrompt,
      temperature: options.temperature,
    };

    // Check cache first (for non-streaming requests)
    if (!options.stream) {
      const cached = await aiCache.get<GenerateResponse>(cacheKey, {
        provider: 'google',
        model: 'gemini-1.5-flash',
        ttl: 3600, // 1 hour
        skipCache: options.skipCache,
      });

      if (cached) {
        console.log('✅ Using cached Google AI response');
        return cached;
      }
    }

    // Make API call
    const model = this.client.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: options.systemPrompt,
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const content = response.text();

    // Google doesn't provide token counts in free tier, estimate
    const tokensUsed = Math.ceil((prompt.length + content.length) / 4);

    const apiResult: GenerateResponse = {
      content,
      provider: this.name,
      tokensUsed,
      cost: this.estimateCost(tokensUsed),
    };

    // Cache the result
    if (!options.stream) {
      await aiCache.set(cacheKey, apiResult, {
        provider: 'google',
        model: 'gemini-1.5-flash',
        ttl: 3600,
        skipCache: options.skipCache,
      });
    }

    return apiResult;
  }

  async *stream(prompt: string, options: GenerateOptions): AsyncIterable<StreamChunk> {
    if (!this.client) {
      throw new Error('Google AI client not initialized - API key missing');
    }

    const model = this.client.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: options.systemPrompt,
    });

    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const content = chunk.text();
      yield {
        content,
        provider: this.name,
        done: false,
      };
    }

    yield {
      content: '',
      provider: this.name,
      done: true,
    };
  }

  estimateCost(tokens: number): number {
    // Gemini 1.5 Flash pricing: $0.075 per 1M input tokens, $0.30 per 1M output tokens
    // Simplified: average $0.1875 per 1M tokens
    return (tokens / 1_000_000) * 0.1875;
  }
}

/**
 * Multi-Provider Service with Automatic Fallback
 */
export class ProviderService {
  private providers: AIProvider[];
  private primaryProvider: AIProvider | null = null;

  constructor() {
    this.providers = [
      new OpenAIProvider(),
      new AnthropicProvider(),
      new GoogleProvider(),
    ];

    // Set primary provider (first available)
    this.primaryProvider = this.providers.find((p) => p.isAvailable()) || null;

    if (!this.primaryProvider) {
      console.warn('No AI providers available - all API keys missing');
    } else {
      console.log(`Primary AI provider: ${this.primaryProvider.name}`);
    }
  }

  /**
   * Generate a response with automatic fallback
   */
  async generate(prompt: string, options: GenerateOptions = {}): Promise<GenerateResponse> {
    const errors: Array<{ provider: string; error: string }> = [];

    // Try each provider in order
    for (const provider of this.providers) {
      if (!provider.isAvailable()) {
        continue;
      }

      try {
        const response = await provider.generate(prompt, options);
        console.log(`Successfully generated with ${provider.name}`);
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ provider: provider.name, error: errorMessage });
        console.error(`${provider.name} failed:`, errorMessage);
        // Continue to next provider
      }
    }

    // All providers failed
    throw new Error(
      `All AI providers failed:\n${errors.map((e) => `${e.provider}: ${e.error}`).join('\n')}`
    );
  }

  /**
   * Stream a response with automatic fallback
   */
  async *stream(prompt: string, options: GenerateOptions = {}): AsyncIterable<StreamChunk> {
    const errors: Array<{ provider: string; error: string }> = [];

    // Try each provider in order
    for (const provider of this.providers) {
      if (!provider.isAvailable()) {
        continue;
      }

      try {
        console.log(`Attempting to stream with ${provider.name}`);

        for await (const chunk of provider.stream(prompt, options)) {
          yield chunk;
        }

        return; // Success, exit
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ provider: provider.name, error: errorMessage });
        console.error(`${provider.name} streaming failed:`, errorMessage);
        // Continue to next provider
      }
    }

    // All providers failed
    throw new Error(
      `All AI providers failed for streaming:\n${errors.map((e) => `${e.provider}: ${e.error}`).join('\n')}`
    );
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): string[] {
    return this.providers.filter((p) => p.isAvailable()).map((p) => p.name);
  }

  /**
   * Get primary provider name
   */
  getPrimaryProvider(): string | null {
    return this.primaryProvider?.name || null;
  }

  /**
   * Check if any provider is available
   */
  isAvailable(): boolean {
    return this.providers.some((p) => p.isAvailable());
  }

  /**
   * Generate a chat response with context-aware system prompt
   */
  async generateChatResponse(
    userMessage: string,
    context: Array<{ role: string; content: string }> = [],
    intent?: string
  ): Promise<GenerateResponse> {
    const systemPrompt = this.buildChatSystemPrompt(intent);

    // Build conversation context
    let prompt = '';
    if (context.length > 0) {
      prompt += 'Previous conversation:\n';
      context.forEach((msg) => {
        prompt += `${msg.role}: ${msg.content}\n`;
      });
      prompt += '\n';
    }
    prompt += `User: ${userMessage}`;

    return this.generate(prompt, {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 2000,
    });
  }

  /**
   * Stream a chat response with context
   */
  async *streamChatResponse(
    userMessage: string,
    context: Array<{ role: string; content: string }> = [],
    intent?: string
  ): AsyncIterable<StreamChunk> {
    const systemPrompt = this.buildChatSystemPrompt(intent);

    // Build conversation context
    let prompt = '';
    if (context.length > 0) {
      prompt += 'Previous conversation:\n';
      context.forEach((msg) => {
        prompt += `${msg.role}: ${msg.content}\n`;
      });
      prompt += '\n';
    }
    prompt += `User: ${userMessage}`;

    for await (const chunk of this.stream(prompt, {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 2000,
      stream: true,
    })) {
      yield chunk;
    }
  }

  /**
   * Build context-aware system prompt based on intent
   */
  private buildChatSystemPrompt(intent?: string): string {
    const basePrompt = `You are an AI assistant for DAWG AI, a music production platform.
You help users create beats, mix tracks, master songs, and control the DAW through natural conversation.

Be concise, helpful, and enthusiastic about music production. When users request music generation,
acknowledge their request and confirm what you're creating.`;

    if (!intent) {
      return basePrompt;
    }

    const intentPrompts: Record<string, string> = {
      GENERATE_BEAT: `${basePrompt}\n\nThe user wants to generate a beat. Confirm the genre, BPM, and key if provided.
Let them know you're creating it and it will be ready in about 20-30 seconds.`,

      MIX_TRACK: `${basePrompt}\n\nThe user wants to mix a track. Explain what mixing adjustments you're applying
(EQ, compression, reverb, etc.) in simple terms.`,

      MASTER_TRACK: `${basePrompt}\n\nThe user wants to master a track. Explain that you're optimizing loudness,
stereo width, and final polish for streaming/distribution.`,

      DAW_PLAY: `${basePrompt}\n\nThe user wants to control playback. Confirm the action and provide playback status.`,

      DAW_RECORD: `${basePrompt}\n\nThe user wants to record. Confirm recording status and provide tips if needed.`,

      REGENERATE: `${basePrompt}\n\nThe user wants to regenerate the previous output. Confirm you're creating a new version.`,

      UPDATE_PARAMETER: `${basePrompt}\n\nThe user wants to update a parameter. Confirm what's changing and regenerate if needed.`,
    };

    return intentPrompts[intent] || basePrompt;
  }
}

// Export singleton instance
export const providerService = new ProviderService();
