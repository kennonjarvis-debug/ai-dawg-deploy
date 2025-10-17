/**
 * Analytics & Telemetry Schemas
 * Instance 4 (Data & Storage - Karen)
 *
 * Privacy-safe UI interaction tracking
 * Opt-in telemetry with PII scrubbing
 * A/B testing infrastructure
 */

import { z } from 'zod';

// ============================================================================
// UI INTERACTION EVENTS
// ============================================================================

export const UIEventTypeSchema = z.enum([
  // Navigation
  'page_view',
  'route_change',
  'modal_open',
  'modal_close',
  'tab_switch',

  // Clicks
  'button_click',
  'link_click',
  'menu_item_click',
  'widget_minimize',
  'widget_maximize',

  // Recording
  'recording_start',
  'recording_stop',
  'recording_play',
  'recording_delete',
  'recording_export',

  // Project
  'project_create',
  'project_open',
  'project_save',
  'project_delete',

  // Journey
  'journey_start',
  'journey_complete',
  'journey_pause',
  'journey_resume',

  // AI Interaction
  'ai_chat_send',
  'ai_suggestion_accept',
  'ai_suggestion_reject',
  'ai_coach_feedback_view',

  // Error
  'error_occurred',
  'error_dismissed',

  // Performance
  'page_load',
  'api_request',
  'audio_processing',
]);

export type UIEventType = z.infer<typeof UIEventTypeSchema>;

export const UIInteractionEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: UIEventTypeSchema,
  timestamp: z.string().datetime(),

  // User context (anonymized)
  userHash: z.string().startsWith('usr_'),
  sessionId: z.string().uuid(),

  // Event details
  component: z.string().optional(), // e.g., 'TransportControls', 'ChatPanel'
  action: z.string().optional(), // e.g., 'play', 'record', 'send'
  label: z.string().optional(), // Additional context
  value: z.number().optional(), // Numeric value if applicable

  // Context
  currentPage: z.string(),
  previousPage: z.string().optional(),
  referrer: z.string().optional(),

  // Metadata (privacy-safe)
  metadata: z.record(z.string(), z.any()).optional(),

  // Device info (anonymized)
  deviceType: z.enum(['desktop', 'tablet', 'mobile']).optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
  screenResolution: z.string().optional(),

  // A/B testing
  experimentId: z.string().optional(),
  variant: z.string().optional(),
});

export type UIInteractionEvent = z.infer<typeof UIInteractionEventSchema>;

// ============================================================================
// TIME TRACKING EVENTS
// ============================================================================

export const TimeTrackingEventSchema = z.object({
  eventId: z.string().uuid(),
  userHash: z.string().startsWith('usr_'),
  sessionId: z.string().uuid(),
  timestamp: z.string().datetime(),

  // What was tracked
  context: z.enum(['page', 'widget', 'modal', 'feature']),
  contextId: z.string(), // page URL, widget name, etc.

  // Duration
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  durationMs: z.number().positive(),

  // Engagement quality
  activeTimeMs: z.number().positive(), // Time user was actively engaged
  visibilityChanges: z.number().min(0), // How many times tab was hidden
  scrollDepth: z.number().min(0).max(100).optional(), // For pages
  interactions: z.number().min(0), // Number of clicks/actions
});

export type TimeTrackingEvent = z.infer<typeof TimeTrackingEventSchema>;

// ============================================================================
// FEATURE USAGE EVENTS
// ============================================================================

export const FeatureUsageEventSchema = z.object({
  eventId: z.string().uuid(),
  userHash: z.string().startsWith('usr_'),
  timestamp: z.string().datetime(),

  // Feature details
  featureId: z.string(), // e.g., 'vocal-effects', 'auto-comping'
  featureName: z.string(),
  featureCategory: z.enum(['recording', 'editing', 'mixing', 'ai', 'journey', 'analytics']),

  // Usage
  action: z.enum(['enabled', 'disabled', 'configured', 'used']),
  usageCount: z.number().min(0).default(1),

  // Settings (privacy-safe)
  settings: z.record(z.string(), z.any()).optional(),

  // Outcome
  successful: z.boolean().optional(),
  errorCode: z.string().optional(),
});

export type FeatureUsageEvent = z.infer<typeof FeatureUsageEventSchema>;

// ============================================================================
// PERFORMANCE EVENTS
// ============================================================================

export const PerformanceEventSchema = z.object({
  eventId: z.string().uuid(),
  userHash: z.string().startsWith('usr_'),
  timestamp: z.string().datetime(),

  // Performance metric
  metricType: z.enum([
    'page_load',
    'api_latency',
    'audio_processing',
    'waveform_render',
    'ai_response_time',
    'file_upload',
    'file_export',
  ]),

  // Timing
  durationMs: z.number().positive(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),

  // Context
  context: z.string(), // URL, API endpoint, etc.
  statusCode: z.number().optional(), // HTTP status code for API calls

  // Performance marks (Web Vitals)
  ttfb: z.number().optional(), // Time to First Byte
  fcp: z.number().optional(), // First Contentful Paint
  lcp: z.number().optional(), // Largest Contentful Paint
  fid: z.number().optional(), // First Input Delay
  cls: z.number().optional(), // Cumulative Layout Shift

  // Resource info
  resourceSize: z.number().optional(), // bytes
  cacheHit: z.boolean().optional(),
});

export type PerformanceEvent = z.infer<typeof PerformanceEventSchema>;

// ============================================================================
// ERROR EVENTS
// ============================================================================

export const ErrorEventSchema = z.object({
  eventId: z.string().uuid(),
  userHash: z.string().startsWith('usr_'),
  timestamp: z.string().datetime(),

  // Error details
  errorType: z.enum(['javascript', 'api', 'audio', 'network', 'validation', 'unknown']),
  errorCode: z.string().optional(),
  errorMessage: z.string(),
  errorStack: z.string().optional(),

  // Context
  component: z.string().optional(),
  action: z.string().optional(),
  currentPage: z.string(),

  // Severity
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),

  // User impact
  userVisible: z.boolean().default(true),
  recoverable: z.boolean().default(true),

  // Environment
  browser: z.string().optional(),
  os: z.string().optional(),
  deviceType: z.enum(['desktop', 'tablet', 'mobile']).optional(),
});

export type ErrorEvent = z.infer<typeof ErrorEventSchema>;

// ============================================================================
// A/B TESTING
// ============================================================================

export const ExperimentSchema = z.object({
  experimentId: z.string(),
  name: z.string(),
  description: z.string(),
  hypothesis: z.string(),

  // Variants
  variants: z.array(
    z.object({
      variantId: z.string(),
      name: z.string(),
      description: z.string(),
      weight: z.number().min(0).max(1), // Traffic allocation (0-1)
    })
  ),

  // Targeting
  targetAudience: z.enum(['all', 'new_users', 'returning_users', 'beta_testers']).default('all'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),

  // Metrics
  primaryMetric: z.string(), // e.g., 'recording_completion_rate'
  secondaryMetrics: z.array(z.string()).default([]),

  // Status
  status: z.enum(['draft', 'running', 'paused', 'completed', 'archived']).default('draft'),
});

export type Experiment = z.infer<typeof ExperimentSchema>;

export const ExperimentAssignmentSchema = z.object({
  assignmentId: z.string().uuid(),
  userHash: z.string().startsWith('usr_'),
  experimentId: z.string(),
  variantId: z.string(),
  assignedAt: z.string().datetime(),
  sticky: z.boolean().default(true), // Once assigned, always get same variant
});

export type ExperimentAssignment = z.infer<typeof ExperimentAssignmentSchema>;

// ============================================================================
// ANALYTICS AGGREGATES
// ============================================================================

export const DailyMetricsSchema = z.object({
  date: z.string().date(), // YYYY-MM-DD
  userHash: z.string().startsWith('usr_'),

  // Session metrics
  sessionCount: z.number().min(0).default(0),
  totalSessionDurationMs: z.number().min(0).default(0),
  avgSessionDurationMs: z.number().min(0).default(0),

  // Activity metrics
  pageViews: z.number().min(0).default(0),
  uniquePagesViewed: z.number().min(0).default(0),
  buttonClicks: z.number().min(0).default(0),

  // Feature usage
  recordingsCreated: z.number().min(0).default(0),
  projectsCreated: z.number().min(0).default(0),
  journeysStarted: z.number().min(0).default(0),
  aiInteractions: z.number().min(0).default(0),

  // Errors
  errorsEncountered: z.number().min(0).default(0),
  criticalErrors: z.number().min(0).default(0),

  // Performance
  avgPageLoadMs: z.number().min(0).default(0),
  avgApiLatencyMs: z.number().min(0).default(0),
});

export type DailyMetrics = z.infer<typeof DailyMetricsSchema>;

// ============================================================================
// TELEMETRY BATCH
// ============================================================================

export const TelemetryBatchSchema = z.object({
  batchId: z.string().uuid(),
  userHash: z.string().startsWith('usr_'),
  sessionId: z.string().uuid(),
  timestamp: z.string().datetime(),

  // Events in this batch
  uiEvents: z.array(UIInteractionEventSchema).default([]),
  timeTrackingEvents: z.array(TimeTrackingEventSchema).default([]),
  featureUsageEvents: z.array(FeatureUsageEventSchema).default([]),
  performanceEvents: z.array(PerformanceEventSchema).default([]),
  errorEvents: z.array(ErrorEventSchema).default([]),

  // Metadata
  eventsCount: z.number().min(0),
  compressed: z.boolean().default(false),
});

export type TelemetryBatch = z.infer<typeof TelemetryBatchSchema>;

// ============================================================================
// CONSENT & PRIVACY
// ============================================================================

export const TelemetryConsentSchema = z.object({
  userHash: z.string().startsWith('usr_'),
  consentGivenAt: z.string().datetime(),
  consentUpdatedAt: z.string().datetime(),

  // What user consented to
  allowUsageAnalytics: z.boolean().default(false),
  allowErrorReporting: z.boolean().default(false),
  allowPerformanceTracking: z.boolean().default(false),
  allowExperiments: z.boolean().default(false),

  // Data retention
  dataRetentionDays: z.number().min(1).max(730).default(365), // Max 2 years
});

export type TelemetryConsent = z.infer<typeof TelemetryConsentSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create anonymized UI interaction event
 */
export function createUIInteractionEvent(
  eventType: UIEventType,
  userHash: string,
  sessionId: string,
  currentPage: string,
  options?: Partial<UIInteractionEvent>
): UIInteractionEvent {
  return UIInteractionEventSchema.parse({
    eventId: crypto.randomUUID(),
    eventType,
    timestamp: new Date().toISOString(),
    userHash,
    sessionId,
    currentPage,
    ...options,
  });
}

/**
 * Scrub PII from event metadata
 */
export function scrubEventPII(event: UIInteractionEvent): UIInteractionEvent {
  const scrubbed = { ...event };

  // Remove potentially sensitive metadata
  if (scrubbed.metadata) {
    const safeMetadata: Record<string, any> = {};
    for (const [key, value] of Object.entries(scrubbed.metadata)) {
      // Exclude fields that might contain PII
      if (!['email', 'name', 'phone', 'address', 'ip'].includes(key.toLowerCase())) {
        safeMetadata[key] = value;
      }
    }
    scrubbed.metadata = safeMetadata;
  }

  return scrubbed;
}

/**
 * Check if user has consented to analytics
 */
export function hasAnalyticsConsent(consent: TelemetryConsent, eventType: UIEventType): boolean {
  if (eventType.startsWith('error')) {
    return consent.allowErrorReporting;
  }
  if (eventType.includes('load') || eventType.includes('api') || eventType.includes('processing')) {
    return consent.allowPerformanceTracking;
  }
  return consent.allowUsageAnalytics;
}
