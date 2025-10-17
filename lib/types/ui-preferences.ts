/**
 * UI Preferences Schema
 * Instance 4 (Data & Storage - Karen)
 *
 * Privacy-first UI preferences with granular sync controls
 * All data validated with Zod, encrypted at rest
 */

import { z } from 'zod';

// ============================================================================
// THEME PREFERENCES
// ============================================================================

export const ThemeSchema = z.object({
  mode: z.enum(['light', 'dark', 'system']).default('system'),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).default('#3B82F6'), // Blue-500
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i).default('#10B981'), // Green-500
  fontSize: z.enum(['sm', 'md', 'lg']).default('md'),
  fontFamily: z.enum(['inter', 'system', 'mono']).default('inter'),
  reducedMotion: z.boolean().default(false),
  highContrast: z.boolean().default(false),
});

export type Theme = z.infer<typeof ThemeSchema>;

// ============================================================================
// LAYOUT PREFERENCES
// ============================================================================

export const WidgetPositionSchema = z.object({
  widgetId: z.string(),
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().min(1).max(12), // Grid columns (1-12)
  height: z.number().min(1),
  zIndex: z.number().default(1),
  collapsed: z.boolean().default(false),
  hidden: z.boolean().default(false),
});

export type WidgetPosition = z.infer<typeof WidgetPositionSchema>;

export const LayoutPresetSchema = z.enum([
  'default',
  'recording',
  'mixing',
  'mastering',
  'learning',
  'custom',
]);

export type LayoutPreset = z.infer<typeof LayoutPresetSchema>;

export const LayoutPreferencesSchema = z.object({
  preset: LayoutPresetSchema.default('default'),
  widgets: z.array(WidgetPositionSchema).default([]),
  sidebarCollapsed: z.boolean().default(false),
  sidebarWidth: z.number().min(200).max(600).default(280),
  aiChatPanelWidth: z.number().min(250).max(800).default(400),
  aiChatPanelCollapsed: z.boolean().default(false),
  showTransportControls: z.boolean().default(true),
  compactMode: z.boolean().default(false),
});

export type LayoutPreferences = z.infer<typeof LayoutPreferencesSchema>;

// ============================================================================
// DASHBOARD PREFERENCES
// ============================================================================

export const DashboardFiltersSchema = z.object({
  showCompleted: z.boolean().default(true),
  showArchived: z.boolean().default(false),
  dateRange: z.enum(['all', 'today', 'week', 'month', 'custom']).default('all'),
  customDateStart: z.string().datetime().optional(),
  customDateEnd: z.string().datetime().optional(),
  searchQuery: z.string().default(''),
  sortBy: z.enum(['date', 'name', 'status', 'duration', 'quality']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  viewMode: z.enum(['grid', 'list', 'compact']).default('grid'),
});

export type DashboardFilters = z.infer<typeof DashboardFiltersSchema>;

// ============================================================================
// AUDIO PREFERENCES
// ============================================================================

export const AudioPreferencesSchema = z.object({
  inputDeviceId: z.string().optional(),
  outputDeviceId: z.string().optional(),
  sampleRate: z.enum(['44100', '48000', '96000']).default('48000'),
  bufferSize: z.enum(['128', '256', '512', '1024']).default('512'),
  monitoringEnabled: z.boolean().default(true),
  metronomeVolume: z.number().min(0).max(1).default(0.5),
  clickTrackEnabled: z.boolean().default(false),
  autoGainControl: z.boolean().default(false),
  noiseSuppression: z.boolean().default(true),
});

export type AudioPreferences = z.infer<typeof AudioPreferencesSchema>;

// ============================================================================
// AI ASSISTANT PREFERENCES
// ============================================================================

export const AIAssistantPreferencesSchema = z.object({
  voiceEnabled: z.boolean().default(false),
  autoSuggestions: z.boolean().default(true),
  suggestionFrequency: z.enum(['low', 'medium', 'high']).default('medium'),
  coachingStyle: z.enum(['encouraging', 'direct', 'technical', 'friendly']).default('encouraging'),
  feedbackDetail: z.enum(['minimal', 'standard', 'detailed']).default('standard'),
  proactiveTips: z.boolean().default(true),
  contextAwareness: z.boolean().default(true),
});

export type AIAssistantPreferences = z.infer<typeof AIAssistantPreferencesSchema>;

// ============================================================================
// PRIVACY CONTROLS
// ============================================================================

export const PrivacyControlsSchema = z.object({
  // What data syncs to cloud
  syncTheme: z.boolean().default(true),
  syncLayout: z.boolean().default(true),
  syncDashboardFilters: z.boolean().default(true),
  syncAudioSettings: z.boolean().default(false), // Device-specific, don't sync by default
  syncAIPreferences: z.boolean().default(true),

  // Analytics opt-in
  allowUsageAnalytics: z.boolean().default(false),
  allowErrorReporting: z.boolean().default(true),
  allowPerformanceTracking: z.boolean().default(false),

  // Data retention
  keepLocalBackups: z.boolean().default(true),
  localBackupDays: z.number().min(1).max(90).default(30),

  // PII controls
  anonymizeAnalytics: z.boolean().default(true),
  shareImprovementData: z.boolean().default(false),
});

export type PrivacyControls = z.infer<typeof PrivacyControlsSchema>;

// ============================================================================
// COMPLETE UI PREFERENCES
// ============================================================================

export const UIPreferencesSchema = z.object({
  userId: z.string(),
  version: z.number().default(1), // Schema version for migrations
  lastModified: z.string().datetime(),
  lastSynced: z.string().datetime().optional(),

  // Preference categories
  theme: ThemeSchema.default({}),
  layout: LayoutPreferencesSchema.default({}),
  dashboard: DashboardFiltersSchema.default({}),
  audio: AudioPreferencesSchema.default({}),
  ai: AIAssistantPreferencesSchema.default({}),
  privacy: PrivacyControlsSchema.default({}),

  // Metadata
  deviceId: z.string().optional(), // Track which device created these preferences
  deviceName: z.string().optional(),
});

export type UIPreferences = z.infer<typeof UIPreferencesSchema>;

// ============================================================================
// PREFERENCE UPDATE REQUEST
// ============================================================================

export const UIPreferencesUpdateSchema = UIPreferencesSchema.partial().omit({
  userId: true,
  version: true,
}).extend({
  // Allow deep partial updates
  theme: ThemeSchema.partial().optional(),
  layout: LayoutPreferencesSchema.partial().optional(),
  dashboard: DashboardFiltersSchema.partial().optional(),
  audio: AudioPreferencesSchema.partial().optional(),
  ai: AIAssistantPreferencesSchema.partial().optional(),
  privacy: PrivacyControlsSchema.partial().optional(),
});

export type UIPreferencesUpdate = z.infer<typeof UIPreferencesUpdateSchema>;

// ============================================================================
// PREFERENCE MIGRATION
// ============================================================================

export const PreferenceMigrationSchema = z.object({
  fromVersion: z.number(),
  toVersion: z.number(),
  migratedAt: z.string().datetime(),
  changes: z.array(z.object({
    field: z.string(),
    oldValue: z.any(),
    newValue: z.any(),
    reason: z.string(),
  })),
  success: z.boolean(),
  errors: z.array(z.string()).default([]),
});

export type PreferenceMigration = z.infer<typeof PreferenceMigrationSchema>;

// ============================================================================
// SYNC STATUS
// ============================================================================

export const SyncStatusSchema = z.object({
  lastSyncAttempt: z.string().datetime(),
  lastSuccessfulSync: z.string().datetime().optional(),
  syncInProgress: z.boolean().default(false),
  pendingChanges: z.number().default(0),
  conflicts: z.array(z.object({
    field: z.string(),
    localValue: z.any(),
    remoteValue: z.any(),
    timestamp: z.string().datetime(),
  })).default([]),
  error: z.string().optional(),
});

export type SyncStatus = z.infer<typeof SyncStatusSchema>;

// ============================================================================
// DEFAULT PREFERENCES
// ============================================================================

export function getDefaultUIPreferences(userId: string): UIPreferences {
  return UIPreferencesSchema.parse({
    userId,
    version: 1,
    lastModified: new Date().toISOString(),
    theme: {},
    layout: {},
    dashboard: {},
    audio: {},
    ai: {},
    privacy: {},
  });
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isValidUIPreferences(data: unknown): data is UIPreferences {
  try {
    UIPreferencesSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function isValidUIPreferencesUpdate(data: unknown): data is UIPreferencesUpdate {
  try {
    UIPreferencesUpdateSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}
