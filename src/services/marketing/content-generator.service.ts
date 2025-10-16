/**
 * Marketing Content Generator Service
 * Handles GPT-powered content generation with fallback strategies
 */

import OpenAI from 'openai';
import { logger } from '../../backend/utils/logger';
import {
  ContentGenerationRequest,
  ContentGenerationResponse,
  ContentType,
} from './types';
import { CONTENT_TEMPLATES, LENGTH_WORD_COUNT, PLATFORM_LIMITS } from './templates';

export class MarketingContentGenerator {
  private openai: OpenAI;
  private fallbackAttempts = 3;
  private cacheEnabled = true;
  private contentCache = new Map<string, ContentGenerationResponse>();

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Generate content based on request parameters
   */
  async generateContent(
    request: ContentGenerationRequest
  ): Promise<ContentGenerationResponse> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cacheKey = this.getCacheKey(request);
      if (this.cacheEnabled && this.contentCache.has(cacheKey)) {
        logger.info('Returning cached content', { cacheKey });
        return this.contentCache.get(cacheKey)!;
      }

      // Get template for content type
      const template = CONTENT_TEMPLATES[request.contentType];
      if (!template) {
        throw new Error(`Unknown content type: ${request.contentType}`);
      }

      // Build prompt from template
      const prompt = this.buildPrompt(template, request);

      // Generate content with retry logic
      let content: string;
      let attempt = 0;
      let lastError: Error | null = null;

      while (attempt < this.fallbackAttempts) {
        try {
          content = await this.callOpenAI(template, prompt);
          break;
        } catch (error) {
          lastError = error as Error;
          attempt++;
          logger.warn(`Content generation attempt ${attempt} failed`, {
            error: (error as Error).message,
            contentType: request.contentType,
          });

          if (attempt < this.fallbackAttempts) {
            // Exponential backoff
            await this.sleep(1000 * Math.pow(2, attempt));
          }
        }
      }

      if (!content!) {
        // All attempts failed, use fallback
        logger.error('All content generation attempts failed, using fallback', {
          error: lastError?.message,
        });
        content = this.getFallbackContent(request);
      }

      // Post-process content
      const processedContent = this.postProcessContent(content, request);

      // Build response
      const response: ContentGenerationResponse = {
        content: processedContent,
        metadata: {
          contentType: request.contentType,
          platform: request.platform,
          wordCount: this.countWords(processedContent),
          characterCount: processedContent.length,
          generatedAt: new Date(),
          model: 'gpt-4',
          tone: request.tone,
          audience: request.audience,
        },
        suggestions: await this.generateSuggestions(request, processedContent),
      };

      // Add SEO metadata for seo_meta content type
      if (request.contentType === 'seo_meta') {
        response.seoMetadata = this.extractSEOMetadata(processedContent);
      }

      // Cache the response
      if (this.cacheEnabled) {
        this.contentCache.set(cacheKey, response);
        // Clear cache after 1 hour
        setTimeout(() => this.contentCache.delete(cacheKey), 3600000);
      }

      const duration = Date.now() - startTime;
      logger.info('Content generated successfully', {
        contentType: request.contentType,
        wordCount: response.metadata.wordCount,
        duration: `${duration}ms`,
      });

      return response;
    } catch (error) {
      logger.error('Content generation failed', {
        error: (error as Error).message,
        request,
      });
      throw error;
    }
  }

  /**
   * Call OpenAI API with the constructed prompt
   */
  private async callOpenAI(template: any, prompt: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: template.systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: template.maxTokens,
      temperature: template.temperature,
      top_p: 0.9,
      frequency_penalty: 0.5,
      presence_penalty: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    return content.trim();
  }

  /**
   * Build prompt from template and request
   */
  private buildPrompt(template: any, request: ContentGenerationRequest): string {
    let prompt = template.userPromptTemplate;

    // Simple template replacement (production would use a proper template engine)
    const replacements: Record<string, string> = {
      '{{topic}}': request.topic,
      '{{audience}}': request.audience || template.defaultParams.audience || 'general',
      '{{tone}}': request.tone || template.defaultParams.tone || 'professional',
      '{{length}}': request.length || template.defaultParams.length || 'medium',
      '{{platform}}': request.platform || 'website',
      '{{keywords}}': request.keywords?.join(', ') || '',
      '{{additionalContext}}': request.additionalContext || '',
      '{{ctaText}}': request.ctaText || 'Learn more',
    };

    Object.entries(replacements).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(key, 'g'), value);
    });

    // Handle conditional sections (basic implementation)
    prompt = prompt.replace(/\{\{#if keywords\}\}(.*?)\{\{\/if\}\}/gs, (match, content) => {
      return request.keywords && request.keywords.length > 0 ? content : '';
    });

    prompt = prompt.replace(/\{\{#if additionalContext\}\}(.*?)\{\{\/if\}\}/gs, (match, content) => {
      return request.additionalContext ? content : '';
    });

    prompt = prompt.replace(/\{\{#if includeCTA\}\}(.*?)\{\{\/if\}\}/gs, (match, content) => {
      return request.includeCTA ? content : '';
    });

    // Clean up any remaining template syntax
    prompt = prompt.replace(/\{\{.*?\}\}/g, '').trim();

    return prompt;
  }

  /**
   * Post-process generated content
   */
  private postProcessContent(content: string, request: ContentGenerationRequest): string {
    let processed = content;

    // Apply platform-specific limits
    if (request.platform && PLATFORM_LIMITS[request.platform]) {
      const limits = PLATFORM_LIMITS[request.platform];
      if (limits.maxChars && processed.length > limits.maxChars) {
        processed = processed.substring(0, limits.maxChars - 3) + '...';
        logger.warn('Content truncated to platform limit', {
          platform: request.platform,
          originalLength: content.length,
          truncatedLength: processed.length,
        });
      }
    }

    // Add CTA if requested and not present
    if (request.includeCTA && request.ctaText && !processed.includes(request.ctaText)) {
      processed += `\n\n${request.ctaText}`;
    }

    return processed.trim();
  }

  /**
   * Generate suggestions for the content
   */
  private async generateSuggestions(
    request: ContentGenerationRequest,
    content: string
  ): Promise<ContentGenerationResponse['suggestions']> {
    const suggestions: ContentGenerationResponse['suggestions'] = {};

    // Generate hashtags for social content
    if (request.contentType === 'social_caption' || request.platform) {
      suggestions.hashtags = await this.generateHashtags(request.topic, request.keywords);
    }

    // Generate improvement suggestions
    suggestions.improvements = [
      'Consider adding more specific data or statistics',
      'Include a personal anecdote or case study',
      'Test different CTAs to optimize conversion',
    ];

    // Generate related topics
    suggestions.relatedTopics = this.generateRelatedTopics(request.topic, request.keywords);

    return suggestions;
  }

  /**
   * Generate hashtags for social media content
   */
  private async generateHashtags(topic: string, keywords?: string[]): Promise<string[]> {
    const hashtags: string[] = [];

    // Add topic-based hashtag
    const topicHashtag = topic
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    hashtags.push(`#${topicHashtag}`);

    // Add keyword-based hashtags
    if (keywords) {
      keywords.forEach(keyword => {
        const hashtag = keyword.replace(/\s+/g, '');
        if (hashtag && !hashtags.includes(`#${hashtag}`)) {
          hashtags.push(`#${hashtag}`);
        }
      });
    }

    return hashtags.slice(0, 10);
  }

  /**
   * Generate related topics
   */
  private generateRelatedTopics(topic: string, keywords?: string[]): string[] {
    // Simple implementation - would use AI for better results
    const related: string[] = [];

    if (keywords) {
      keywords.forEach(keyword => {
        related.push(`${keyword} best practices`);
        related.push(`${keyword} tips and tricks`);
      });
    }

    return related.slice(0, 5);
  }

  /**
   * Extract SEO metadata from content
   */
  private extractSEOMetadata(content: string): ContentGenerationResponse['seoMetadata'] {
    const lines = content.split('\n').filter(line => line.trim());

    const metadata: ContentGenerationResponse['seoMetadata'] = {};

    // Extract title (first non-empty line)
    metadata.title = lines[0]?.replace(/^(Meta Title:|Title:)\s*/i, '').trim();

    // Extract description (second non-empty line)
    metadata.description = lines[1]?.replace(/^(Meta Description:|Description:)\s*/i, '').trim();

    // Extract keywords (look for "Keywords:" line)
    const keywordsLine = lines.find(line => line.toLowerCase().startsWith('keywords:'));
    if (keywordsLine) {
      metadata.keywords = keywordsLine
        .replace(/^keywords:/i, '')
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);
    }

    // Extract slug (look for "URL Slug:" line)
    const slugLine = lines.find(line => line.toLowerCase().includes('slug:'));
    if (slugLine) {
      metadata.slug = slugLine
        .replace(/^.*slug:/i, '')
        .trim()
        .toLowerCase();
    }

    return metadata;
  }

  /**
   * Get fallback content when API fails
   */
  private getFallbackContent(request: ContentGenerationRequest): string {
    logger.warn('Using fallback content', { contentType: request.contentType });

    const fallbacks: Record<ContentType, string> = {
      blog_post: `# ${request.topic}\n\n[Content generation temporarily unavailable. Please try again later or generate content manually based on this topic: ${request.topic}]`,
      social_caption: `Check out our latest update about ${request.topic}! ${request.keywords?.map(k => `#${k.replace(/\s+/g, '')}`).join(' ') || ''}`,
      email_newsletter: `Subject: ${request.topic}\n\n[Content generation temporarily unavailable. Please try again later.]`,
      seo_meta: `Meta Title: ${request.topic}\nMeta Description: Learn more about ${request.topic}.\nKeywords: ${request.keywords?.join(', ') || request.topic}`,
      product_description: `${request.topic} - [Full description coming soon. Please contact us for more information.]`,
      ad_copy: `Discover ${request.topic}. ${request.ctaText || 'Learn more'} →`,
    };

    return fallbacks[request.contentType] || `Content about: ${request.topic}`;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(Boolean).length;
  }

  /**
   * Get cache key for a request
   */
  private getCacheKey(request: ContentGenerationRequest): string {
    return `${request.contentType}-${request.topic}-${request.platform || 'default'}-${
      request.audience || 'general'
    }`;
  }

  /**
   * Sleep utility for retry backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear all cached content
   */
  clearCache(): void {
    this.contentCache.clear();
    logger.info('Content cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.contentCache.size,
      keys: Array.from(this.contentCache.keys()),
    };
  }
}

// Export singleton instance
export const contentGenerator = new MarketingContentGenerator();
