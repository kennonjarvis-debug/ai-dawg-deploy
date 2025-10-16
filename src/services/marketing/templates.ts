/**
 * Marketing Content Prompt Templates
 * Pre-configured prompts for different content types
 */

import { ContentTemplate, ContentType } from './types';

export const CONTENT_TEMPLATES: Record<ContentType, ContentTemplate> = {
  blog_post: {
    id: 'blog_post',
    name: 'Blog Post',
    contentType: 'blog_post',
    systemPrompt: `You are an expert content writer specializing in creating engaging, SEO-optimized blog posts.
Your writing is clear, informative, and tailored to the target audience. You understand content marketing best practices
and know how to structure articles for maximum engagement and readability.`,
    userPromptTemplate: `Write a {{length}} blog post about: {{topic}}

Target Audience: {{audience}}
Tone: {{tone}}
{{#if keywords}}SEO Keywords to include naturally: {{keywords}}{{/if}}
{{#if additionalContext}}Additional Context: {{additionalContext}}{{/if}}
{{#if includeCTA}}Include a compelling call-to-action at the end{{/if}}

Requirements:
- Include an engaging headline
- Break content into clear sections with subheadings
- Use bullet points or numbered lists where appropriate
- Write in a {{tone}} tone suitable for {{audience}}
- Make it actionable and valuable
- Keep paragraphs short and scannable
{{#if length === 'short'}}Target: 500-800 words{{/if}}
{{#if length === 'medium'}}Target: 1000-1500 words{{/if}}
{{#if length === 'long'}}Target: 2000-3000 words{{/if}}`,
    defaultParams: {
      tone: 'professional',
      audience: 'general',
      length: 'medium',
    },
    maxTokens: 2000,
    temperature: 0.7,
  },

  social_caption: {
    id: 'social_caption',
    name: 'Social Media Caption',
    contentType: 'social_caption',
    systemPrompt: `You are a social media expert who creates engaging, scroll-stopping captions for various platforms.
You understand platform-specific best practices, hashtag strategies, and how to drive engagement through compelling copy.`,
    userPromptTemplate: `Create a {{platform}} caption about: {{topic}}

Platform: {{platform}}
Target Audience: {{audience}}
Tone: {{tone}}
{{#if keywords}}Key themes: {{keywords}}{{/if}}
{{#if additionalContext}}Context: {{additionalContext}}{{/if}}
{{#if includeCTA}}Call-to-action: {{ctaText}}{{/if}}

Requirements:
- Write in a {{tone}} tone
- Perfect for {{platform}} (consider character limits and best practices)
- Include {{#if platform === 'twitter'}}2-3{{else}}5-10{{/if}} relevant hashtags
- Drive engagement (likes, comments, shares)
- Make it authentic and relatable to {{audience}}
{{#if platform === 'twitter'}}- Keep under 280 characters if possible{{/if}}
{{#if platform === 'instagram'}}- Create a hook in the first line{{/if}}
{{#if platform === 'linkedin'}}- Professional but engaging{{/if}}`,
    defaultParams: {
      platform: 'instagram',
      tone: 'friendly',
      audience: 'general',
      length: 'short',
    },
    maxTokens: 300,
    temperature: 0.8,
  },

  email_newsletter: {
    id: 'email_newsletter',
    name: 'Email Newsletter',
    contentType: 'email_newsletter',
    systemPrompt: `You are an email marketing specialist who creates newsletters that people actually want to read.
You understand email best practices, subject line psychology, and how to balance promotional content with value.`,
    userPromptTemplate: `Write an email newsletter about: {{topic}}

Target Audience: {{audience}}
Tone: {{tone}}
{{#if keywords}}Key points to cover: {{keywords}}{{/if}}
{{#if additionalContext}}Background: {{additionalContext}}{{/if}}
{{#if includeCTA}}Primary CTA: {{ctaText}}{{/if}}

Requirements:
- Start with an attention-grabbing subject line
- Write a compelling preview text (50-80 characters)
- Personal and conversational {{tone}} tone
- Clear structure with sections
- Balance value with {{#if includeCTA}}promotional content{{else}}pure value{{/if}}
- Include a clear call-to-action
- End with a personal sign-off
- Optimize for mobile reading (short paragraphs)`,
    defaultParams: {
      tone: 'friendly',
      audience: 'general',
      length: 'medium',
    },
    maxTokens: 1500,
    temperature: 0.7,
  },

  seo_meta: {
    id: 'seo_meta',
    name: 'SEO Metadata',
    contentType: 'seo_meta',
    systemPrompt: `You are an SEO specialist who creates optimized metadata that ranks well and drives clicks.
You understand search intent, keyword placement, and how to write compelling meta descriptions within character limits.`,
    userPromptTemplate: `Create SEO metadata for a page about: {{topic}}

Target Audience: {{audience}}
{{#if keywords}}Primary Keywords: {{keywords}}{{/if}}
{{#if additionalContext}}Page Context: {{additionalContext}}{{/if}}

Create:
1. Meta Title (50-60 characters, include primary keyword)
2. Meta Description (150-160 characters, compelling and keyword-rich)
3. 5-7 relevant keywords/phrases
4. URL slug (lowercase, hyphens, keyword-focused)

Requirements:
- Natural keyword integration (avoid keyword stuffing)
- Compelling and click-worthy
- Accurately represent the content
- Follow SEO best practices
- Target {{audience}} specifically`,
    defaultParams: {
      audience: 'general',
      length: 'short',
    },
    maxTokens: 400,
    temperature: 0.5,
  },

  product_description: {
    id: 'product_description',
    name: 'Product Description',
    contentType: 'product_description',
    systemPrompt: `You are a conversion-focused copywriter who creates product descriptions that sell.
You understand how to highlight benefits over features and create desire through compelling copy.`,
    userPromptTemplate: `Write a product description for: {{topic}}

Target Audience: {{audience}}
Tone: {{tone}}
{{#if keywords}}Key features/benefits: {{keywords}}{{/if}}
{{#if additionalContext}}Product details: {{additionalContext}}{{/if}}
{{#if includeCTA}}Call-to-action: {{ctaText}}{{/if}}

Requirements:
- Lead with the main benefit
- Transform features into benefits
- Address pain points
- Create desire and urgency
- Use sensory language
- Include social proof elements if relevant
- End with a clear call-to-action
- Write in {{tone}} tone for {{audience}}
{{#if length === 'short'}}Keep it punchy: 100-150 words{{/if}}
{{#if length === 'medium'}}Standard length: 200-300 words{{/if}}
{{#if length === 'long'}}Detailed: 400-500 words{{/if}}`,
    defaultParams: {
      tone: 'enthusiastic',
      audience: 'general',
      length: 'medium',
      includeCTA: true,
    },
    maxTokens: 800,
    temperature: 0.7,
  },

  ad_copy: {
    id: 'ad_copy',
    name: 'Ad Copy',
    contentType: 'ad_copy',
    systemPrompt: `You are a direct response copywriter who creates high-converting ad copy.
You understand how to grab attention, create desire, and drive action in just a few words.`,
    userPromptTemplate: `Create ad copy for: {{topic}}

Platform: {{platform}}
Target Audience: {{audience}}
Tone: {{tone}}
{{#if keywords}}Key selling points: {{keywords}}{{/if}}
{{#if additionalContext}}Offer details: {{additionalContext}}{{/if}}
{{#if ctaText}}Call-to-action: {{ctaText}}{{/if}}

Create multiple versions:
1. Headline (attention-grabbing, benefit-focused)
2. Primary Text (compelling body copy)
3. Call-to-Action Button Text

Requirements:
- AIDA framework (Attention, Interest, Desire, Action)
- Clear unique value proposition
- Address specific pain point or desire
- Create urgency or scarcity if appropriate
- {{tone}} tone for {{audience}}
- Platform-optimized ({{platform}} best practices)
- Direct and action-oriented
{{#if platform === 'facebook'}}- Mobile-first, scroll-stopping{{/if}}
{{#if platform === 'google'}}- Search intent focused{{/if}}`,
    defaultParams: {
      platform: 'facebook',
      tone: 'promotional',
      audience: 'general',
      length: 'short',
      includeCTA: true,
    },
    maxTokens: 500,
    temperature: 0.8,
  },
};

/**
 * Length to word count mapping
 */
export const LENGTH_WORD_COUNT = {
  short: { min: 100, max: 500 },
  medium: { min: 500, max: 1500 },
  long: { min: 1500, max: 3000 },
};

/**
 * Platform-specific character limits and best practices
 */
export const PLATFORM_LIMITS = {
  twitter: {
    maxChars: 280,
    optimalHashtags: 3,
    bestPractices: ['concise', 'engaging', 'timely'],
  },
  facebook: {
    maxChars: 63206,
    optimalLength: 80,
    optimalHashtags: 3,
    bestPractices: ['storytelling', 'visual', 'community-focused'],
  },
  instagram: {
    maxChars: 2200,
    optimalLength: 138,
    optimalHashtags: 10,
    bestPractices: ['visual-first', 'authentic', 'hashtag-rich'],
  },
  linkedin: {
    maxChars: 3000,
    optimalLength: 150,
    optimalHashtags: 5,
    bestPractices: ['professional', 'thought-leadership', 'industry-relevant'],
  },
  email: {
    subjectLineMax: 50,
    previewTextMax: 100,
    optimalBodyLength: 200,
    bestPractices: ['personalized', 'mobile-optimized', 'clear-cta'],
  },
  website: {
    metaTitleMax: 60,
    metaDescriptionMax: 160,
    bestPractices: ['seo-optimized', 'keyword-rich', 'user-intent-focused'],
  },
  blog: {
    minWords: 300,
    optimalWords: 1500,
    bestPractices: ['structured', 'scannable', 'seo-optimized'],
  },
};
