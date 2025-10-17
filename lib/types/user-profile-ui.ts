/**
 * User Profile UI Data Model
 * Instance 4 (Data & Storage - Karen)
 *
 * Privacy-first profile management with GDPR compliance
 * Avatar upload, display name, bio, public visibility controls
 */

import { z } from 'zod';

// ============================================================================
// PROFILE IMAGE
// ============================================================================

export const ProfileImageSchema = z.object({
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  s3Key: z.string().optional(), // S3 object key for deletion
  uploadedAt: z.string().datetime(),
  size: z.number().positive(), // bytes
  mimeType: z.string().regex(/^image\/(jpeg|png|webp|gif)$/),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

export type ProfileImage = z.infer<typeof ProfileImageSchema>;

// ============================================================================
// SOCIAL LINKS
// ============================================================================

export const SocialLinkSchema = z.object({
  platform: z.enum(['twitter', 'instagram', 'youtube', 'spotify', 'soundcloud', 'tiktok', 'website']),
  url: z.string().url(),
  handle: z.string().optional(),
  verified: z.boolean().default(false),
});

export type SocialLink = z.infer<typeof SocialLinkSchema>;

// ============================================================================
// PROFILE VISIBILITY SETTINGS
// ============================================================================

export const ProfileVisibilitySchema = z.object({
  profilePublic: z.boolean().default(false), // Is profile page public?
  showRealName: z.boolean().default(false),
  showEmail: z.boolean().default(false),
  showLocation: z.boolean().default(false),
  showBio: z.boolean().default(true),
  showSocialLinks: z.boolean().default(true),
  showStats: z.boolean().default(false), // Show recording count, practice hours, etc.
  showAchievements: z.boolean().default(false),
  searchable: z.boolean().default(false), // Can profile be found in search?
});

export type ProfileVisibility = z.infer<typeof ProfileVisibilitySchema>;

// ============================================================================
// ACHIEVEMENTS / BADGES
// ============================================================================

export const AchievementSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string().url().optional(),
  unlockedAt: z.string().datetime(),
  category: z.enum(['practice', 'recording', 'journey', 'skill', 'social']),
  rarity: z.enum(['common', 'rare', 'epic', 'legendary']).default('common'),
});

export type Achievement = z.infer<typeof AchievementSchema>;

// ============================================================================
// USER PROFILE UI
// ============================================================================

export const UserProfileUISchema = z.object({
  userId: z.string(),
  userHash: z.string().startsWith('usr_'), // Anonymous ID for public display

  // Basic info
  displayName: z.string().min(1).max(50).optional(),
  realName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  timezone: z.string().optional(),

  // Profile image
  avatar: ProfileImageSchema.optional(),
  coverImage: ProfileImageSchema.optional(),

  // Social
  socialLinks: z.array(SocialLinkSchema).max(10).default([]),

  // Privacy
  visibility: ProfileVisibilitySchema.default({}),

  // Metadata
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastActive: z.string().datetime().optional(),

  // Achievements (optional, for gamification)
  achievements: z.array(AchievementSchema).default([]),

  // Public stats (if visibility.showStats === true)
  publicStats: z
    .object({
      totalRecordings: z.number().min(0).default(0),
      totalPracticeHours: z.number().min(0).default(0),
      journeysCompleted: z.number().min(0).default(0),
      skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    })
    .optional(),

  // GDPR compliance
  dataProcessingConsent: z.boolean().default(false),
  marketingConsent: z.boolean().default(false),
  privacyPolicyAcceptedAt: z.string().datetime().optional(),
});

export type UserProfileUI = z.infer<typeof UserProfileUISchema>;

// ============================================================================
// PROFILE UPDATE REQUEST
// ============================================================================

export const UserProfileUpdateSchema = UserProfileUISchema.partial().omit({
  userId: true,
  userHash: true,
  createdAt: true,
  updatedAt: true,
  lastActive: true,
  achievements: true, // Achievements cannot be manually set
  publicStats: true, // Stats are computed, not set
});

export type UserProfileUpdate = z.infer<typeof UserProfileUpdateSchema>;

// ============================================================================
// AVATAR UPLOAD REQUEST
// ============================================================================

export const AvatarUploadRequestSchema = z.object({
  fileName: z.string(),
  fileSize: z.number().positive().max(5 * 1024 * 1024), // Max 5MB
  mimeType: z.string().regex(/^image\/(jpeg|png|webp)$/),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

export type AvatarUploadRequest = z.infer<typeof AvatarUploadRequestSchema>;

export const AvatarUploadResponseSchema = z.object({
  uploadUrl: z.string().url(), // Presigned S3 URL
  imageUrl: z.string().url(), // Final CDN URL
  thumbnailUrl: z.string().url().optional(),
  s3Key: z.string(),
  expiresAt: z.string().datetime(), // Upload URL expiration
});

export type AvatarUploadResponse = z.infer<typeof AvatarUploadResponseSchema>;

// ============================================================================
// PROFILE DELETION REQUEST (GDPR RIGHT TO ERASURE)
// ============================================================================

export const ProfileDeletionRequestSchema = z.object({
  userId: z.string(),
  reason: z.string().max(500).optional(),
  deleteRecordings: z.boolean().default(false),
  deleteProjects: z.boolean().default(false),
  deleteAnalytics: z.boolean().default(true),
  requestedAt: z.string().datetime(),
  scheduledDeletionDate: z.string().datetime(), // 30 days grace period
  confirmationEmail: z.string().email(),
});

export type ProfileDeletionRequest = z.infer<typeof ProfileDeletionRequestSchema>;

// ============================================================================
// DATA EXPORT REQUEST (GDPR RIGHT TO DATA PORTABILITY)
// ============================================================================

export const DataExportRequestSchema = z.object({
  userId: z.string(),
  includeProfile: z.boolean().default(true),
  includeRecordings: z.boolean().default(true),
  includeProjects: z.boolean().default(true),
  includeAnalytics: z.boolean().default(true),
  includePreferences: z.boolean().default(true),
  format: z.enum(['json', 'csv', 'zip']).default('zip'),
  requestedAt: z.string().datetime(),
});

export type DataExportRequest = z.infer<typeof DataExportRequestSchema>;

export const DataExportResponseSchema = z.object({
  exportId: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  downloadUrl: z.string().url().optional(),
  expiresAt: z.string().datetime().optional(),
  fileSize: z.number().optional(),
  createdAt: z.string().datetime(),
});

export type DataExportResponse = z.infer<typeof DataExportResponseSchema>;

// ============================================================================
// DEFAULT GENERATORS
// ============================================================================

export function getDefaultUserProfileUI(userId: string, userHash: string): UserProfileUI {
  return UserProfileUISchema.parse({
    userId,
    userHash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    visibility: {},
    socialLinks: [],
    achievements: [],
  });
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateDisplayName(name: string): { valid: boolean; error?: string } {
  if (name.length < 1) {
    return { valid: false, error: 'Display name is required' };
  }
  if (name.length > 50) {
    return { valid: false, error: 'Display name must be 50 characters or less' };
  }
  if (!/^[a-zA-Z0-9\s\-_\.]+$/.test(name)) {
    return { valid: false, error: 'Display name can only contain letters, numbers, spaces, hyphens, underscores, and periods' };
  }
  return { valid: true };
}

export function validateBio(bio: string): { valid: boolean; error?: string } {
  if (bio.length > 500) {
    return { valid: false, error: 'Bio must be 500 characters or less' };
  }
  return { valid: true };
}

export function validateSocialUrl(platform: SocialLink['platform'], url: string): { valid: boolean; error?: string } {
  const patterns: Record<SocialLink['platform'], RegExp> = {
    twitter: /^https?:\/\/(www\.)?twitter\.com\/[a-zA-Z0-9_]+\/?$/,
    instagram: /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/,
    youtube: /^https?:\/\/(www\.)?youtube\.com\/(c\/|channel\/|user\/)?[a-zA-Z0-9_-]+\/?$/,
    spotify: /^https?:\/\/open\.spotify\.com\/(user|artist)\/[a-zA-Z0-9]+\/?$/,
    soundcloud: /^https?:\/\/(www\.)?soundcloud\.com\/[a-zA-Z0-9_-]+\/?$/,
    tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9_.]+\/?$/,
    website: /^https?:\/\/.+$/,
  };

  const pattern = patterns[platform];
  if (!pattern.test(url)) {
    return { valid: false, error: `Invalid ${platform} URL format` };
  }

  return { valid: true };
}

// ============================================================================
// PII SCRUBBING (FOR ANALYTICS)
// ============================================================================

export function scrubPII(profile: UserProfileUI): Partial<UserProfileUI> {
  return {
    userHash: profile.userHash,
    displayName: profile.displayName,
    bio: profile.visibility.showBio ? profile.bio : undefined,
    avatar: profile.avatar,
    socialLinks: profile.visibility.showSocialLinks ? profile.socialLinks : [],
    achievements: profile.visibility.showAchievements ? profile.achievements : [],
    publicStats: profile.visibility.showStats ? profile.publicStats : undefined,
    // PII fields excluded: realName, email, location, userId
  };
}
