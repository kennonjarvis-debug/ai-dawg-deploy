/**
 * Centralized Zod Schemas - Single Source of Truth
 * Instance 4 (Data & Storage - Karen)
 * All entity schemas with runtime validation
 */

import { z } from 'zod';

// ============================================================================
// CORE ENTITIES
// ============================================================================

/**
 * User Profile Schema
 * Source: ProfileManager.ts, journey-api.yaml
 */
export const VocalRangeSchema = z.object({
  lowest: z.string().regex(/^[A-G][#b]?\d$/, 'Invalid note format'),
  highest: z.string().regex(/^[A-G][#b]?\d$/, 'Invalid note format'),
  comfortable: z.string(),
  semitones: z.number().min(0).max(88).optional(),
});

export const SkillSnapshotSchema = z.object({
  timestamp: z.coerce.date(),
  pitchAccuracy: z.number().min(0).max(100),
  breathControl: z.number().min(0).max(100),
  vibratoControl: z.number().min(0).max(100),
  rangeExpansion: z.number().min(0).max(100),
  tonalQuality: z.number().min(0).max(100),
});

export const SessionRecordSchema = z.object({
  timestamp: z.coerce.date(),
  durationMinutes: z.number().min(1).max(480),
  completed: z.boolean(),
});

export const UserProfileSchema = z.object({
  userId: z.string(),
  userHash: z.string().startsWith('usr_'),
  email: z.string().email().optional(),
  name: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  lastActiveDate: z.coerce.date().optional(),

  // Vocal profile
  vocalRange: VocalRangeSchema,
  strengths: z.array(z.string()),
  growthAreas: z.array(z.string()),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'professional']),
  genre: z.string(),

  // Statistics
  practiceHours: z.number().min(0),
  sessionsCompleted: z.number().int().min(0),
  totalRecordings: z.number().int().min(0),

  // Skills
  skills: z.object({
    pitchAccuracy: z.number().min(0).max(100),
    breathControl: z.number().min(0).max(100),
    vibratoControl: z.number().min(0).max(100),
    rangeExpansion: z.number().min(0).max(100),
    tonalQuality: z.number().min(0).max(100),
  }),

  // History
  skillHistory: z.array(SkillSnapshotSchema).optional(),
  sessionHistory: z.array(SessionRecordSchema).optional(),

  // Preferences
  preferences: z.object({
    autoSaveEnabled: z.boolean(),
    autoSaveInterval: z.number().min(10).max(300),
    theme: z.enum(['dark', 'light']),
    defaultInput: z.string(),
    defaultOutput: z.string(),
  }),

  // Privacy
  privacyConsent: z.object({
    analytics: z.boolean(),
    aiCoaching: z.boolean(),
    dataRetention: z.boolean(),
    acceptedAt: z.coerce.date().optional(),
  }),
});

/**
 * Personalization Signals Schema (PII-free)
 */
export const PersonalizationSignalsSchema = z.object({
  userHash: z.string().startsWith('usr_'),
  vocalRangeSemitones: z.number().min(0).max(88),
  pitchAccuracyAvg: z.number().min(0).max(100),
  practiceHours30d: z.number().min(0),
  skillLevel: z.string(),
  preferredGenre: z.string(),
  topStrengths: z.array(z.string()).max(3),
  topGrowthAreas: z.array(z.string()).max(3),
  recentTrend: z.enum(['improving', 'stable', 'declining']),
  sessionFrequency: z.number().min(0),
  lastActiveDaysAgo: z.number().min(0),
  avgSessionDuration: z.number().min(0),
  recordingCount30d: z.number().int().min(0),
  completionRate: z.number().min(0).max(1),
  skillTrendVelocity: z.number().min(-100).max(100),
  pii: z.literal(false),
});

// ============================================================================
// LAYOUT ENTITIES
// ============================================================================

export const PanelStateSchema = z.object({
  visible: z.boolean(),
  width: z.number().optional(),
  height: z.number().optional(),
  collapsed: z.boolean().optional(),
});

export const WidgetPositionSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  visible: z.boolean(),
});

export const UserLayoutSchema = z.object({
  userId: z.string(),
  layoutId: z.string(),
  name: z.string().min(1).max(50),
  isDefault: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),

  sidebar: PanelStateSchema.extend({
    width: z.number().min(200).max(500),
  }),

  mainContent: z.object({
    tracksHeight: z.number().min(0).max(100),
    waveformHeight: z.number().min(0).max(100),
  }),

  bottomWidgets: z.object({
    columns: z.number().min(4).max(6),
    height: z.number().min(100).max(200),
    widgets: z.array(WidgetPositionSchema),
  }),

  widgets: z.object({
    compactPitchMonitor: z.boolean(),
    compactEQ: z.boolean(),
    projectStats: z.boolean(),
    quickActions: z.boolean(),
    voiceInterface: z.boolean(),
    chatPanel: z.boolean(),
    projectSelector: z.boolean(),
  }),

  windows: z.record(z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  })).optional(),
});

// ============================================================================
// AUDIO ENTITIES
// ============================================================================

export const TrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['audio', 'midi']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  volume: z.number().min(0).max(1),
  pan: z.number().min(-1).max(1),
  solo: z.boolean(),
  mute: z.boolean(),
  recordArmed: z.boolean(),
  inputDeviceId: z.string().optional(),
  outputDeviceId: z.string().optional(),
});

export const RecordingSchema = z.object({
  id: z.string(),
  blob: z.custom<Blob>((val) => val instanceof Blob || val === undefined).optional(), // Browser only
  duration: z.number().min(0),
  createdAt: z.coerce.date(),
  waveformData: z.array(z.number()).optional(),
  s3Url: z.string().url().optional(),
  s3Key: z.string().optional(),
});

export const ProjectSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1).max(100),
  bpm: z.number().min(20).max(300),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  tracks: z.array(TrackSchema),
  recordings: z.record(z.array(RecordingSchema)),
});

// ============================================================================
// MILESTONE ENTITIES
// ============================================================================

export const MilestoneTypeSchema = z.enum([
  'pitch_mastery',
  'consistency',
  'song_completion',
  'practice_streak',
  'range_expansion',
  'technique_mastery',
]);

export const MilestoneSchema = z.object({
  id: z.string(),
  type: MilestoneTypeSchema,
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  icon: z.string().optional(),
  target: z.number().min(0),
  currentProgress: z.number().min(0),
  isUnlocked: z.boolean(),
  unlockedAt: z.coerce.date().optional(),
  celebrationShown: z.boolean().default(false),
});

export const UserMilestonesSchema = z.object({
  userId: z.string(),
  milestones: z.array(MilestoneSchema),
  currentStreak: z.number().int().min(0),
  longestStreak: z.number().int().min(0),
  lastPracticeDate: z.coerce.date().optional(),
  totalMilestonesUnlocked: z.number().int().min(0),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const MilestoneUnlockRequestSchema = z.object({
  milestoneId: z.string(),
  progress: z.number().min(0),
});

export const StreakUpdateRequestSchema = z.object({
  practiceDate: z.coerce.date(),
});

export type MilestoneType = z.infer<typeof MilestoneTypeSchema>;
export type Milestone = z.infer<typeof MilestoneSchema>;
export type UserMilestones = z.infer<typeof UserMilestonesSchema>;
export type MilestoneUnlockRequest = z.infer<typeof MilestoneUnlockRequestSchema>;
export type StreakUpdateRequest = z.infer<typeof StreakUpdateRequestSchema>;

// ============================================================================
// JOURNEY API ENTITIES (from OpenAPI specs)
// ============================================================================

export const StylePreferencesSchema = z.object({
  primaryGenre: z.string(),
  subgenres: z.array(z.string()),
  influences: z.array(z.string()),
  avoidances: z.array(z.string()),
});

export const JourneyTypeSchema = z.enum([
  'record_song',
  'expand_range',
  'improve_control',
  'build_confidence',
]);

export const TimeframeSchema = z.enum(['15min', '30min', '60min']);

export const JourneyStartRequestSchema = z.object({
  user_id: z.string(),
  journey_type: JourneyTypeSchema,
  timeframe: TimeframeSchema.optional(),
  vocal_profile: UserProfileSchema,
  style_preferences: StylePreferencesSchema,
  focus_areas: z.array(z.string()).optional(),
});

export const JourneyStateSchema = z.object({
  journey_id: z.string(),
  user_id: z.string(),
  status: z.enum(['active', 'paused', 'completed', 'abandoned']),
  current_phase: z.string(),
  progress_percentage: z.number().min(0).max(100),
  next_milestones: z.array(z.object({
    milestone_id: z.string(),
    description: z.string(),
    eta_sessions: z.number(),
  })),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// ============================================================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================================================

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.any().optional(),
});

export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

// Profile API
export const ProfileUpdateRequestSchema = UserProfileSchema.partial().omit({
  userId: true,
  userHash: true,
  createdAt: true,
  updatedAt: true,
});

export const SkillsUpdateRequestSchema = z.object({
  pitchAccuracy: z.number().min(0).max(100).optional(),
  breathControl: z.number().min(0).max(100).optional(),
  vibratoControl: z.number().min(0).max(100).optional(),
  rangeExpansion: z.number().min(0).max(100).optional(),
  tonalQuality: z.number().min(0).max(100).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one skill must be provided',
});

export const SessionLogRequestSchema = z.object({
  durationMinutes: z.number().min(1).max(480),
});

// Layout API
export const LayoutSaveRequestSchema = UserLayoutSchema.partial().omit({
  userId: true,
  createdAt: true,
  updatedAt: true,
});

// ============================================================================
// TYPE EXPORTS (inferred from schemas)
// ============================================================================

export type VocalRange = z.infer<typeof VocalRangeSchema>;
export type SkillSnapshot = z.infer<typeof SkillSnapshotSchema>;
export type SessionRecord = z.infer<typeof SessionRecordSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type PersonalizationSignals = z.infer<typeof PersonalizationSignalsSchema>;

export type PanelState = z.infer<typeof PanelStateSchema>;
export type WidgetPosition = z.infer<typeof WidgetPositionSchema>;
export type UserLayout = z.infer<typeof UserLayoutSchema>;

export type Track = z.infer<typeof TrackSchema>;
export type Recording = z.infer<typeof RecordingSchema>;
export type Project = z.infer<typeof ProjectSchema>;

export type StylePreferences = z.infer<typeof StylePreferencesSchema>;
export type JourneyType = z.infer<typeof JourneyTypeSchema>;
export type Timeframe = z.infer<typeof TimeframeSchema>;
export type JourneyStartRequest = z.infer<typeof JourneyStartRequestSchema>;
export type JourneyState = z.infer<typeof JourneyStateSchema>;

export type ApiError = z.infer<typeof ApiErrorSchema>;
export type ProfileUpdateRequest = z.infer<typeof ProfileUpdateRequestSchema>;
export type SkillsUpdateRequest = z.infer<typeof SkillsUpdateRequestSchema>;
export type SessionLogRequest = z.infer<typeof SessionLogRequestSchema>;
export type LayoutSaveRequest = z.infer<typeof LayoutSaveRequestSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Safe parse with detailed error messages
 */
export function validateSchema<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  context?: string
): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errorMessages = result.error.issues.map(
      (err) => `${err.path.join('.')}: ${err.message}`
    ).join(', ');

    throw new Error(
      `Validation failed${context ? ` for ${context}` : ''}: ${errorMessages}`
    );
  }

  return result.data;
}

/**
 * Validate at network boundary (API responses)
 */
export function validateApiResponse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  endpoint: string
): z.infer<T> {
  return validateSchema(schema, data, `API response from ${endpoint}`);
}

/**
 * Validate at storage boundary (localStorage, database)
 */
export function validateStorageData<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  key: string
): z.infer<T> {
  return validateSchema(schema, data, `storage data for ${key}`);
}

/**
 * Validate user input before processing
 */
export function validateUserInput<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  field?: string
): z.infer<T> {
  return validateSchema(schema, data, field ? `user input: ${field}` : 'user input');
}
