/**
 * Centralized Type Exports
 * Instance 4 (Data & Storage - Karen)
 *
 * Single source of truth for all types in the application.
 * Import from here instead of duplicating DTOs.
 */

// ============================================================================
// ZOD SCHEMAS & INFERRED TYPES
// ============================================================================

export * from './schemas';

// ============================================================================
// GENERATED API TYPES (from OpenAPI specs)
// ============================================================================

export type { paths as JourneyApiPaths } from './journey-api';
export type { paths as AutomixApiPaths } from './automix-api';
export type { paths as MasterMeApiPaths } from './masterme-api';

export type { components as JourneyApiComponents } from './journey-api';
export type { components as AutomixApiComponents } from './automix-api';
export type { components as MasterMeApiComponents } from './masterme-api';

// ============================================================================
// RE-EXPORTS OF COMMONLY USED TYPES
// ============================================================================

import type { components as JourneyApiComponents } from './journey-api';
import type { components as AutomixApiComponents } from './automix-api';
import type { components as MasterMeApiComponents } from './masterme-api';

// Journey API types
export type JourneyApi = JourneyApiComponents['schemas']['Journey'];
export type JourneyStageApi = JourneyApiComponents['schemas']['JourneyStage'];
export type VocalProfileApi = JourneyApiComponents['schemas']['VocalProfile'];
export type StylePreferencesApi = JourneyApiComponents['schemas']['StylePreferences'];
export type MilestoneApi = JourneyApiComponents['schemas']['Milestone'];

// Automix API types
export type MixSuggestionApi = AutomixApiComponents['schemas']['MixSuggestion'];
export type AudioAnalysisApi = AutomixApiComponents['schemas']['AudioAnalysis'];
export type EffectSuggestionApi = AutomixApiComponents['schemas']['EffectSuggestion'];
export type MixMetricsApi = AutomixApiComponents['schemas']['MixMetrics'];
export type MixPresetApi = AutomixApiComponents['schemas']['MixPreset'];

// MasterMe API types
export type MasteringJobApi = MasterMeApiComponents['schemas']['MasteringJob'];
export type MasteringPresetApi = MasterMeApiComponents['schemas']['MasteringPreset'];
export type MasteringMetricsApi = MasterMeApiComponents['schemas']['MasteringMetrics'];
export type QualityReportApi = MasterMeApiComponents['schemas']['QualityReport'];
export type MasteringReportApi = MasterMeApiComponents['schemas']['MasteringReport'];

// ============================================================================
// TYPE GUARDS
// ============================================================================

import {
  UserProfileSchema,
  TrackSchema,
  RecordingSchema,
  UserLayoutSchema,
  type UserProfile,
  type Track,
  type Recording,
  type UserLayout,
} from './schemas';

/**
 * Check if value is a valid UserProfile
 */
export function isUserProfile(value: unknown): value is UserProfile {
  try {
    UserProfileSchema.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if value is a valid Track
 */
export function isTrack(value: unknown): value is Track {
  try {
    TrackSchema.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if value is a valid Recording
 */
export function isRecording(value: unknown): value is Recording {
  try {
    RecordingSchema.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if value is a valid UserLayout
 */
export function isUserLayout(value: unknown): value is UserLayout {
  try {
    UserLayoutSchema.parse(value);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract request body type from API path
 */
export type RequestBody<
  Paths,
  Path extends keyof Paths,
  Method extends keyof Paths[Path]
> = Paths[Path][Method] extends { requestBody: { content: { 'application/json': infer T } } }
  ? T
  : never;

/**
 * Extract response type from API path
 */
export type ResponseBody<
  Paths,
  Path extends keyof Paths,
  Method extends keyof Paths[Path],
  Status = 200
> = Paths[Path][Method] extends { responses: infer R }
  ? R extends Record<string | number, { content: { 'application/json': unknown } }>
    ? Status extends keyof R
      ? R[Status] extends { content: { 'application/json': infer T } }
        ? T
        : never
      : never
    : never
  : never;

// ============================================================================
// USAGE EXAMPLES (in comments for documentation)
// ============================================================================

/*
// Example 1: Using Zod schemas for validation
import { UserProfileSchema, validateApiResponse } from '@/lib/types';

const response = await fetch('/api/profile');
const data = await response.json();
const profile = validateApiResponse(UserProfileSchema, data, '/api/profile');

// Example 2: Using generated API types
import type { JourneyApiPaths, RequestBody, ResponseBody } from '@/lib/types';

type StartJourneyRequest = RequestBody<JourneyApiPaths, '/journey/start', 'post'>;
type StartJourneyResponse = ResponseBody<JourneyApiPaths, '/journey/start', 'post', 200>;

// Example 3: Using type guards
import { isUserProfile } from '@/lib/types';

const data = JSON.parse(localStorage.getItem('profile'));
if (isUserProfile(data)) {
  // TypeScript knows data is UserProfile here
  console.log(data.vocalRange.semitones);
}

// Example 4: Validating user input
import { ProfileUpdateRequestSchema, validateUserInput } from '@/lib/types';

const handleSubmit = (formData: FormData) => {
  const input = Object.fromEntries(formData);
  const validated = validateUserInput(ProfileUpdateRequestSchema, input, 'profile form');
  // validated is now properly typed and safe to use
};
*/
