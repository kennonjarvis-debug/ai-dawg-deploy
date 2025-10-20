/**
 * Buffer Social Media Integration for DAWG AI
 *
 * Adapter for Buffer API to schedule and manage social media posts
 * across Twitter, LinkedIn, and Facebook.
 *
 * @module integrations/buffer
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../utils/logger';

/**
 * Buffer configuration
 */
export interface BufferConfig {
  /** Buffer API access token */
  accessToken: string;
  /** Profile IDs for different platforms */
  profileIds?: Record<string, string>;
}

/**
 * Buffer profile information
 */
export interface BufferProfile {
  id: string;
  service: string;
  service_username: string;
  formatted_service: string;
  timezone: string;
}

/**
 * Social media post structure
 */
export interface SocialPost {
  /** Post text content */
  text: string;
  /** Array of Buffer profile IDs to post to */
  profiles: string[];
  /** Optional media attachments */
  media?: Array<{
    url: string;
    alt?: string;
  }>;
  /** Optional scheduled time */
  scheduledAt?: Date;
}

/**
 * Buffer post update
 */
export interface BufferUpdate {
  id: string;
  text: string;
  profile_ids: string[];
  scheduled_at?: number;
  created_at: number;
  status: string;
  statistics?: {
    likes?: number;
    comments?: number;
    shares?: number;
    clicks?: number;
    reach?: number;
  };
}

/**
 * Buffer API response for create post
 */
export interface CreatePostResponse {
  success: boolean;
  updates: Array<{
    id: string;
    profile_id: string;
    status: string;
    text: string;
    scheduled_at?: number;
  }>;
  message?: string;
}

/**
 * Post analytics data
 */
export interface PostAnalytics {
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  reach: number;
}

/**
 * Scheduled post information
 */
export interface ScheduledPost {
  id: string;
  text: string;
  scheduledAt: Date;
  status: string;
}

/**
 * Buffer API Adapter
 *
 * Manages social media posting through Buffer API
 */
export class BufferAdapter {
  private client: AxiosInstance;
  private accessToken: string;
  private profileIds: Record<string, string>;
  private rateLimitRemaining: number = 10;
  private rateLimitReset: number = Date.now();

  constructor(config: BufferConfig) {
    if (!config.accessToken) {
      throw new Error('Buffer access token is required');
    }

    this.accessToken = config.accessToken;
    this.profileIds = config.profileIds || {};

    // Initialize axios client with Buffer API base URL
    this.client = axios.create({
      baseURL: 'https://api.bufferapp.com/1',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Setup request/response interceptors
    this.setupInterceptors();

    logger.info('Buffer adapter initialized', {
      profileCount: Object.keys(this.profileIds).length,
    });
  }

  /**
   * Setup axios interceptors for retry logic and rate limiting
   */
  private setupInterceptors(): void {
    // Request interceptor for rate limiting
    this.client.interceptors.request.use(
      async (config) => {
        // Check rate limit before making request
        if (this.rateLimitRemaining <= 0 && Date.now() < this.rateLimitReset) {
          const waitTime = this.rateLimitReset - Date.now();
          logger.warn('Rate limit reached, waiting', { waitTime });
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for rate limit tracking and retries
    this.client.interceptors.response.use(
      (response) => {
        // Update rate limit info from headers
        const remaining = response.headers['x-ratelimit-remaining'];
        const reset = response.headers['x-ratelimit-reset'];

        if (remaining !== undefined) {
          this.rateLimitRemaining = parseInt(remaining, 10);
        }

        if (reset !== undefined) {
          this.rateLimitReset = parseInt(reset, 10) * 1000; // Convert to ms
        }

        return response;
      },
      async (error: AxiosError) => {
        const config = error.config;

        // Handle rate limiting
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000;

          logger.warn('Rate limit exceeded, retrying after delay', { waitTime });

          // Wait and retry
          await new Promise((resolve) => setTimeout(resolve, waitTime));

          if (config) {
            return this.client.request(config);
          }
        }

        // Handle transient errors with exponential backoff
        if (
          config &&
          error.response?.status &&
          error.response.status >= 500 &&
          error.response.status < 600
        ) {
          const retryCount = (config as any).__retryCount || 0;

          if (retryCount < 3) {
            (config as any).__retryCount = retryCount + 1;
            const backoffDelay = Math.pow(2, retryCount) * 1000;

            logger.debug('Retrying request after server error', {
              retryCount: retryCount + 1,
              backoffDelay,
            });

            await new Promise((resolve) => setTimeout(resolve, backoffDelay));
            return this.client.request(config);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Get all Buffer profiles associated with the account
   *
   * @returns Promise resolving to array of profiles
   */
  async getProfiles(): Promise<BufferProfile[]> {
    logger.debug('Fetching Buffer profiles');

    try {
      const response = await this.client.get<BufferProfile[]>('/profiles.json');

      logger.info('Profiles fetched successfully', {
        count: response.data.length,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch profiles', error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid Buffer access token');
        }

        if (error.response?.status === 429) {
          throw new Error('Buffer API rate limit exceeded');
        }
      }

      throw new Error('Failed to fetch Buffer profiles');
    }
  }

  /**
   * Get profile ID for a specific platform
   *
   * @param platform - Platform name (twitter, linkedin, facebook)
   * @returns Promise resolving to profile ID
   */
  async getProfileId(platform: string): Promise<string> {
    const normalizedPlatform = platform.toLowerCase();

    // Check cache first
    if (this.profileIds[normalizedPlatform]) {
      logger.debug('Using cached profile ID', { platform: normalizedPlatform });
      return this.profileIds[normalizedPlatform];
    }

    // Fetch from API
    logger.debug('Fetching profile ID from API', { platform: normalizedPlatform });

    const profiles = await this.getProfiles();
    const profile = profiles.find(
      (p) => p.service.toLowerCase() === normalizedPlatform
    );

    if (!profile) {
      const availablePlatforms = profiles.map((p) => p.service);
      throw new Error(
        `No Buffer profile found for platform: ${platform}. Available: ${availablePlatforms.join(', ')}`
      );
    }

    // Cache for future use
    this.profileIds[normalizedPlatform] = profile.id;

    logger.info('Profile ID retrieved', {
      platform: normalizedPlatform,
      profileId: profile.id,
    });

    return profile.id;
  }

  /**
   * Create or schedule a social media post
   *
   * @param post - Post content and configuration
   * @returns Promise resolving to post creation result
   */
  async createPost(post: SocialPost): Promise<{
    id: string;
    profileIds: string[];
    scheduledAt: Date;
  }> {
    logger.info('Creating Buffer post', {
      profileCount: post.profiles.length,
      hasMedia: !!(post.media && post.media.length > 0),
      scheduled: !!post.scheduledAt,
    });

    // Validate required fields
    if (!post.text || post.text.trim().length === 0) {
      throw new Error('Post text is required');
    }

    if (!post.profiles || post.profiles.length === 0) {
      throw new Error('At least one profile ID is required');
    }

    try {
      // Build request payload
      const payload: any = {
        profile_ids: post.profiles,
        text: post.text,
        now: !post.scheduledAt,
      };

      // Add scheduling if specified
      if (post.scheduledAt) {
        payload.scheduled_at = Math.floor(post.scheduledAt.getTime() / 1000);
      }

      // Add media if provided
      if (post.media && post.media.length > 0) {
        payload.media = {
          photo: post.media[0].url,
          description: post.media[0].alt || '',
        };
      }

      const response = await this.client.post<CreatePostResponse>(
        '/updates/create.json',
        payload
      );

      if (!response.data.success || !response.data.updates || response.data.updates.length === 0) {
        throw new Error(response.data.message || 'Post creation failed');
      }

      const update = response.data.updates[0];

      logger.info('Post created successfully', {
        updateId: update.id,
        status: update.status,
      });

      return {
        id: update.id,
        profileIds: post.profiles,
        scheduledAt: post.scheduledAt || new Date(),
      };
    } catch (error) {
      logger.error('Failed to create post', error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid Buffer access token');
        }

        if (error.response?.status === 429) {
          throw new Error('Buffer API rate limit exceeded');
        }

        if (error.response?.status === 400) {
          throw new Error(
            `Invalid post data: ${error.response.data.message || error.message}`
          );
        }
      }

      throw new Error('Failed to create Buffer post');
    }
  }

  /**
   * Get analytics for a specific post
   *
   * @param postId - Buffer update ID
   * @returns Promise resolving to post analytics
   */
  async getPostAnalytics(postId: string): Promise<PostAnalytics> {
    logger.debug('Fetching post analytics', { postId });

    try {
      const response = await this.client.get<BufferUpdate>(`/updates/${postId}.json`);

      const stats = response.data.statistics || {};

      const analytics: PostAnalytics = {
        likes: stats.likes || 0,
        comments: stats.comments || 0,
        shares: stats.shares || 0,
        clicks: stats.clicks || 0,
        reach: stats.reach || 0,
      };

      logger.info('Post analytics retrieved', {
        postId,
        analytics,
      });

      return analytics;
    } catch (error) {
      logger.error('Failed to fetch post analytics', error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Post not found: ${postId}`);
        }

        if (error.response?.status === 401) {
          throw new Error('Invalid Buffer access token');
        }
      }

      throw new Error('Failed to fetch post analytics');
    }
  }

  /**
   * Get scheduled posts for a profile
   *
   * @param profileId - Buffer profile ID
   * @returns Promise resolving to array of scheduled posts
   */
  async getScheduledPosts(profileId: string): Promise<ScheduledPost[]> {
    logger.debug('Fetching scheduled posts', { profileId });

    try {
      const response = await this.client.get<{ updates: BufferUpdate[] }>(
        `/profiles/${profileId}/updates/scheduled.json`
      );

      const posts: ScheduledPost[] = response.data.updates.map((update) => ({
        id: update.id,
        text: update.text,
        scheduledAt: new Date((update.scheduled_at || update.created_at) * 1000),
        status: update.status,
      }));

      logger.info('Scheduled posts retrieved', {
        profileId,
        count: posts.length,
      });

      return posts;
    } catch (error) {
      logger.error('Failed to fetch scheduled posts', error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Profile not found: ${profileId}`);
        }

        if (error.response?.status === 401) {
          throw new Error('Invalid Buffer access token');
        }
      }

      throw new Error('Failed to fetch scheduled posts');
    }
  }

  /**
   * Delete a scheduled post
   *
   * @param postId - Buffer update ID
   */
  async deletePost(postId: string): Promise<void> {
    logger.info('Deleting post', { postId });

    try {
      await this.client.post(`/updates/${postId}/destroy.json`);

      logger.info('Post deleted successfully', { postId });
    } catch (error) {
      logger.error('Failed to delete post', error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Post not found: ${postId}`);
        }

        if (error.response?.status === 401) {
          throw new Error('Invalid Buffer access token');
        }
      }

      throw new Error('Failed to delete post');
    }
  }

  /**
   * Test connection to Buffer API
   *
   * @returns Promise resolving to true if connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getProfiles();
      return true;
    } catch (error) {
      logger.error('Buffer connection test failed', error);
      return false;
    }
  }
}

/**
 * Helper function to create BufferAdapter from environment variables
 */
export function createBufferAdapterFromEnv(): BufferAdapter {
  const accessToken = process.env.BUFFER_ACCESS_TOKEN || '';

  if (!accessToken) {
    throw new Error(
      'Buffer access token not configured. Set BUFFER_ACCESS_TOKEN environment variable.'
    );
  }

  const profileIds: Record<string, string> = {};

  if (process.env.BUFFER_TWITTER_PROFILE_ID) {
    profileIds.twitter = process.env.BUFFER_TWITTER_PROFILE_ID;
  }

  if (process.env.BUFFER_LINKEDIN_PROFILE_ID) {
    profileIds.linkedin = process.env.BUFFER_LINKEDIN_PROFILE_ID;
  }

  if (process.env.BUFFER_FACEBOOK_PROFILE_ID) {
    profileIds.facebook = process.env.BUFFER_FACEBOOK_PROFILE_ID;
  }

  return new BufferAdapter({
    accessToken,
    profileIds,
  });
}
