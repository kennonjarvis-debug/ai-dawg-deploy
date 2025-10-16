/**
 * Marketing & Content Generation Types
 * Defines interfaces for GPT-powered content generation
 */

export type ContentType =
  | 'blog_post'
  | 'social_caption'
  | 'email_newsletter'
  | 'seo_meta'
  | 'product_description'
  | 'ad_copy';

export type Platform =
  | 'twitter'
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'email'
  | 'website'
  | 'blog';

export type Tone =
  | 'professional'
  | 'casual'
  | 'friendly'
  | 'enthusiastic'
  | 'educational'
  | 'promotional'
  | 'inspirational'
  | 'humorous';

export type Audience =
  | 'general'
  | 'musicians'
  | 'producers'
  | 'beginners'
  | 'professionals'
  | 'educators'
  | 'businesses';

export interface ContentGenerationRequest {
  contentType: ContentType;
  platform?: Platform;
  tone?: Tone;
  audience?: Audience;
  length?: 'short' | 'medium' | 'long';
  topic: string;
  keywords?: string[];
  additionalContext?: string;
  includeCTA?: boolean;
  ctaText?: string;
}

export interface ContentGenerationResponse {
  content: string;
  metadata: {
    contentType: ContentType;
    platform?: Platform;
    wordCount: number;
    characterCount: number;
    generatedAt: Date;
    model: string;
    tone?: Tone;
    audience?: Audience;
  };
  suggestions?: {
    hashtags?: string[];
    improvements?: string[];
    relatedTopics?: string[];
  };
  seoMetadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
    slug?: string;
  };
}

export interface ContentTemplate {
  id: string;
  name: string;
  contentType: ContentType;
  systemPrompt: string;
  userPromptTemplate: string;
  defaultParams: Partial<ContentGenerationRequest>;
  maxTokens: number;
  temperature: number;
}

export interface ScheduledContentJob {
  id: string;
  userId: string;
  request: ContentGenerationRequest;
  schedule: {
    frequency: 'once' | 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    time?: string; // HH:mm format
    nextRun?: Date;
  };
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentGenerationStats {
  totalGenerated: number;
  byContentType: Record<ContentType, number>;
  byPlatform: Record<Platform, number>;
  averageWordCount: number;
  successRate: number;
}
