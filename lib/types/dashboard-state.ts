/**
 * Dashboard State Schemas
 * Instance 4 (Data & Storage - Karen)
 *
 * State persistence for all dashboards (filters, sort, search, view mode)
 * Optimistic updates, resume-where-you-left-off functionality
 */

import { z } from 'zod';

// ============================================================================
// COMMON DASHBOARD STATE
// ============================================================================

export const DashboardViewModeSchema = z.enum(['grid', 'list', 'compact', 'table']);
export type DashboardViewMode = z.infer<typeof DashboardViewModeSchema>;

export const SortOrderSchema = z.enum(['asc', 'desc']);
export type SortOrder = z.infer<typeof SortOrderSchema>;

export const DateRangePresetSchema = z.enum(['all', 'today', 'yesterday', 'week', 'month', 'custom']);
export type DateRangePreset = z.infer<typeof DateRangePresetSchema>;

export const DateRangeSchema = z.object({
  preset: DateRangePresetSchema.default('all'),
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
});

export type DateRange = z.infer<typeof DateRangeSchema>;

// ============================================================================
// PROJECTS DASHBOARD STATE
// ============================================================================

export const ProjectsFilterSchema = z.object({
  showArchived: z.boolean().default(false),
  showCompleted: z.boolean().default(true),
  showInProgress: z.boolean().default(true),
  showPaused: z.boolean().default(true),
  dateRange: DateRangeSchema.default({}),
  tags: z.array(z.string()).default([]),
  collaborators: z.array(z.string()).default([]),
  searchQuery: z.string().default(''),
});

export type ProjectsFilter = z.infer<typeof ProjectsFilterSchema>;

export const ProjectsDashboardStateSchema = z.object({
  dashboardId: z.literal('projects'),
  userId: z.string(),
  lastAccessed: z.string().datetime(),
  lastModified: z.string().datetime(),

  // View settings
  viewMode: DashboardViewModeSchema.default('grid'),
  sortBy: z.enum(['name', 'created', 'modified', 'status', 'duration']).default('modified'),
  sortOrder: SortOrderSchema.default('desc'),

  // Filters
  filters: ProjectsFilterSchema.default({}),

  // Pagination
  page: z.number().min(1).default(1),
  pageSize: z.number().min(10).max(100).default(20),

  // Selected items (for bulk actions)
  selectedProjectIds: z.array(z.string()).default([]),

  // Expanded groups (for tree view)
  expandedGroups: z.array(z.string()).default([]),
});

export type ProjectsDashboardState = z.infer<typeof ProjectsDashboardStateSchema>;

// ============================================================================
// RECORDINGS DASHBOARD STATE
// ============================================================================

export const RecordingsFilterSchema = z.object({
  showDeleted: z.boolean().default(false),
  dateRange: DateRangeSchema.default({}),
  minDuration: z.number().min(0).optional(),
  maxDuration: z.number().min(0).optional(),
  minQualityScore: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).default([]),
  searchQuery: z.string().default(''),
  trackType: z.enum(['all', 'vocal', 'instrumental', 'backing']).default('all'),
});

export type RecordingsFilter = z.infer<typeof RecordingsFilterSchema>;

export const RecordingsDashboardStateSchema = z.object({
  dashboardId: z.literal('recordings'),
  userId: z.string(),
  lastAccessed: z.string().datetime(),
  lastModified: z.string().datetime(),

  // View settings
  viewMode: DashboardViewModeSchema.default('grid'),
  sortBy: z.enum(['date', 'name', 'duration', 'quality', 'size']).default('date'),
  sortOrder: SortOrderSchema.default('desc'),

  // Filters
  filters: RecordingsFilterSchema.default({}),

  // Pagination
  page: z.number().min(1).default(1),
  pageSize: z.number().min(10).max(100).default(30),

  // Selected items
  selectedRecordingIds: z.array(z.string()).default([]),

  // Playback state (resume playback position)
  currentlyPlaying: z.string().optional(),
  playbackPosition: z.number().min(0).default(0),
});

export type RecordingsDashboardState = z.infer<typeof RecordingsDashboardStateSchema>;

// ============================================================================
// JOURNEYS DASHBOARD STATE
// ============================================================================

export const JourneysFilterSchema = z.object({
  showCompleted: z.boolean().default(false),
  showAbandoned: z.boolean().default(false),
  journeyType: z.enum(['all', 'record_song', 'expand_range', 'improve_control', 'build_confidence']).default('all'),
  dateRange: DateRangeSchema.default({}),
  searchQuery: z.string().default(''),
});

export type JourneysFilter = z.infer<typeof JourneysFilterSchema>;

export const JourneysDashboardStateSchema = z.object({
  dashboardId: z.literal('journeys'),
  userId: z.string(),
  lastAccessed: z.string().datetime(),
  lastModified: z.string().datetime(),

  // View settings
  viewMode: DashboardViewModeSchema.default('list'),
  sortBy: z.enum(['started', 'modified', 'progress', 'type']).default('modified'),
  sortOrder: SortOrderSchema.default('desc'),

  // Filters
  filters: JourneysFilterSchema.default({}),

  // Pagination
  page: z.number().min(1).default(1),
  pageSize: z.number().min(10).max(100).default(20),

  // Active journey
  activeJourneyId: z.string().optional(),
});

export type JourneysDashboardState = z.infer<typeof JourneysDashboardStateSchema>;

// ============================================================================
// ANALYTICS DASHBOARD STATE
// ============================================================================

export const AnalyticsMetricSchema = z.enum([
  'vocal_range',
  'pitch_accuracy',
  'breath_control',
  'vibrato_control',
  'session_duration',
  'practice_streaks',
  'skill_progress',
]);

export type AnalyticsMetric = z.infer<typeof AnalyticsMetricSchema>;

export const AnalyticsDashboardStateSchema = z.object({
  dashboardId: z.literal('analytics'),
  userId: z.string(),
  lastAccessed: z.string().datetime(),
  lastModified: z.string().datetime(),

  // View settings
  dateRange: DateRangeSchema.default({ preset: 'month' }),
  timeGranularity: z.enum(['day', 'week', 'month']).default('day'),

  // Selected metrics (multi-select)
  selectedMetrics: z.array(AnalyticsMetricSchema).default(['pitch_accuracy', 'session_duration']),

  // Chart type per metric
  chartTypes: z.record(AnalyticsMetricSchema, z.enum(['line', 'bar', 'area'])).default({}),

  // Comparison mode
  comparisonEnabled: z.boolean().default(false),
  comparisonDateRange: DateRangeSchema.optional(),
});

export type AnalyticsDashboardState = z.infer<typeof AnalyticsDashboardStateSchema>;

// ============================================================================
// UNIFIED DASHBOARD STATE TYPE
// ============================================================================

export const DashboardStateSchema = z.discriminatedUnion('dashboardId', [
  ProjectsDashboardStateSchema,
  RecordingsDashboardStateSchema,
  JourneysDashboardStateSchema,
  AnalyticsDashboardStateSchema,
]);

export type DashboardState =
  | ProjectsDashboardState
  | RecordingsDashboardState
  | JourneysDashboardState
  | AnalyticsDashboardState;

// ============================================================================
// DASHBOARD STATE UPDATE (PARTIAL)
// ============================================================================

export const DashboardStateUpdateSchema = z.object({
  dashboardId: z.enum(['projects', 'recordings', 'journeys', 'analytics']),
  updates: z.record(z.string(), z.any()), // Partial update to any field
});

export type DashboardStateUpdate = z.infer<typeof DashboardStateUpdateSchema>;

// ============================================================================
// OPTIMISTIC UPDATE TRACKING
// ============================================================================

export const OptimisticUpdateSchema = z.object({
  id: z.string(),
  dashboardId: z.string(),
  timestamp: z.string().datetime(),
  field: z.string(),
  oldValue: z.any(),
  newValue: z.any(),
  synced: z.boolean().default(false),
  error: z.string().optional(),
});

export type OptimisticUpdate = z.infer<typeof OptimisticUpdateSchema>;

// ============================================================================
// DEFAULT STATE GENERATORS
// ============================================================================

export function getDefaultProjectsState(userId: string): ProjectsDashboardState {
  return ProjectsDashboardStateSchema.parse({
    dashboardId: 'projects',
    userId,
    lastAccessed: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  });
}

export function getDefaultRecordingsState(userId: string): RecordingsDashboardState {
  return RecordingsDashboardStateSchema.parse({
    dashboardId: 'recordings',
    userId,
    lastAccessed: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  });
}

export function getDefaultJourneysState(userId: string): JourneysDashboardState {
  return JourneysDashboardStateSchema.parse({
    dashboardId: 'journeys',
    userId,
    lastAccessed: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  });
}

export function getDefaultAnalyticsState(userId: string): AnalyticsDashboardState {
  return AnalyticsDashboardStateSchema.parse({
    dashboardId: 'analytics',
    userId,
    lastAccessed: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  });
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isProjectsState(state: DashboardState): state is ProjectsDashboardState {
  return state.dashboardId === 'projects';
}

export function isRecordingsState(state: DashboardState): state is RecordingsDashboardState {
  return state.dashboardId === 'recordings';
}

export function isJourneysState(state: DashboardState): state is JourneysDashboardState {
  return state.dashboardId === 'journeys';
}

export function isAnalyticsState(state: DashboardState): state is AnalyticsDashboardState {
  return state.dashboardId === 'analytics';
}
