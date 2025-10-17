# DAWG AI - Data Architecture Documentation
**Instance 4 (Data & Storage - Karen)**
**Created:** 2025-10-02

## Overview

This document describes the complete data architecture for the DAWG AI UI redesign, focusing on privacy-first design, GDPR compliance, and robust state management.

## Table of Contents

1. [Phase 1: UI Preferences](#phase-1-ui-preferences)
2. [Phase 2: Dashboard State Management](#phase-2-dashboard-state-management)
3. [Phase 3: Profile UI Integration](#phase-3-profile-ui-integration)
4. [Phase 4: Analytics & Telemetry](#phase-4-analytics--telemetry)
5. [Privacy & GDPR Compliance](#privacy--gdpr-compliance)
6. [Data Flow Architecture](#data-flow-architecture)
7. [API Reference](#api-reference)
8. [Database Schema](#database-schema)
9. [Migration Guide](#migration-guide)

---

## Phase 1: UI Preferences

### Overview
Privacy-first user preferences system with granular sync controls, localStorage + cloud sync, and automatic schema migrations.

### Features
- ✅ Theme preferences (mode, colors, fonts, accessibility)
- ✅ Layout preferences (widget positions, sidebar, panels)
- ✅ Dashboard filters (search, sort, view mode)
- ✅ Audio preferences (devices, sample rate, monitoring)
- ✅ AI assistant preferences (coaching style, feedback detail)
- ✅ Privacy controls (what syncs, analytics opt-in)

### Data Models

**File:** `lib/types/ui-preferences.ts`

```typescript
interface UIPreferences {
  userId: string;
  version: number; // Schema version
  lastModified: string;
  lastSynced?: string;

  theme: Theme;
  layout: LayoutPreferences;
  dashboard: DashboardFilters;
  audio: AudioPreferences;
  ai: AIAssistantPreferences;
  privacy: PrivacyControls;
}
```

### API Endpoints

**Base URL:** `/api/user/preferences`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/preferences` | Get current user's preferences |
| POST | `/api/user/preferences` | Update preferences (partial updates) |
| DELETE | `/api/user/preferences` | Reset to defaults |

### Sync System

**File:** `lib/ui-preferences/sync.ts`

**Features:**
- Automatic sync every 30 seconds (configurable)
- Optimistic updates (local-first)
- Conflict resolution (local-wins, remote-wins, newest-wins)
- Respects privacy controls (only syncs allowed data)
- Offline support with pending changes tracking

**Usage:**
```typescript
import { getUIPreferencesSyncManager } from '@/lib/ui-preferences/sync';

const syncManager = getUIPreferencesSyncManager({
  userId: 'user@example.com',
  autoSync: true,
  onSyncSuccess: (prefs) => console.log('Synced!', prefs),
  onSyncError: (error) => console.error('Sync failed:', error),
});

syncManager.start();

// Update preferences
await syncManager.update({ theme: { mode: 'dark' } });
```

### Migration System

**File:** `lib/ui-preferences/migrations.ts`

**Features:**
- Versioned schema migrations (forward & backward)
- Automatic migration on load
- Rollback support
- Backup creation before migration
- Migration history tracking

**Usage:**
```typescript
import { loadAndMigratePreferences } from '@/lib/ui-preferences/migrations';

const preferences = await loadAndMigratePreferences('user-id');
// Automatically migrates from any version to current
```

---

## Phase 2: Dashboard State Management

### Overview
Persistent dashboard state with resume-where-you-left-off functionality, optimistic updates, and per-dashboard configuration.

### Supported Dashboards
1. **Projects Dashboard** - Project list filters, sort, view mode
2. **Recordings Dashboard** - Recording filters, playback position
3. **Journeys Dashboard** - Journey filters, active journey
4. **Analytics Dashboard** - Date range, selected metrics, chart types

### Data Models

**File:** `lib/types/dashboard-state.ts`

```typescript
type DashboardState =
  | ProjectsDashboardState
  | RecordingsDashboardState
  | JourneysDashboardState
  | AnalyticsDashboardState;

interface ProjectsDashboardState {
  dashboardId: 'projects';
  userId: string;
  lastAccessed: string;
  lastModified: string;

  viewMode: 'grid' | 'list' | 'compact' | 'table';
  sortBy: 'name' | 'created' | 'modified' | 'status' | 'duration';
  sortOrder: 'asc' | 'desc';
  filters: ProjectsFilter;
  page: number;
  pageSize: number;
  selectedProjectIds: string[];
}
```

### API Endpoints

**Base URL:** `/api/dashboard/state`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/state?dashboardId=projects` | Get dashboard state |
| POST | `/api/dashboard/state` | Update state (optimistic) |
| DELETE | `/api/dashboard/state?dashboardId=projects` | Reset to defaults |

### Optimistic Updates

Dashboard state updates are applied locally first, then synced to the server. If the server update fails, the local state is rolled back.

**Example:**
```typescript
// Update filters with optimistic update
const updateFilters = async (filters: Partial<ProjectsFilter>) => {
  // Apply locally immediately
  setLocalFilters({ ...localFilters, ...filters });

  // Sync to server
  try {
    await fetch('/api/dashboard/state', {
      method: 'POST',
      body: JSON.stringify({
        dashboardId: 'projects',
        updates: { filters },
      }),
    });
  } catch (error) {
    // Rollback on error
    setLocalFilters(previousFilters);
    showError('Failed to save filters');
  }
};
```

---

## Phase 3: Profile UI Integration

### Overview
GDPR-compliant user profile management with avatar uploads, social links, privacy controls, and data portability.

### Features
- ✅ Profile image upload (S3 with presigned URLs)
- ✅ Display name, bio, location
- ✅ Social links (Twitter, Instagram, YouTube, etc.)
- ✅ Achievements/badges
- ✅ Privacy visibility controls
- ✅ GDPR data export (Right to Data Portability)
- ✅ GDPR profile deletion (Right to Erasure)

### Data Models

**File:** `lib/types/user-profile-ui.ts`

```typescript
interface UserProfileUI {
  userId: string;
  userHash: string; // Anonymous ID (usr_xxxxx)

  displayName?: string;
  realName?: string;
  bio?: string;
  location?: string;

  avatar?: ProfileImage;
  coverImage?: ProfileImage;
  socialLinks: SocialLink[];

  visibility: ProfileVisibility;
  achievements: Achievement[];
  publicStats?: PublicStats;

  dataProcessingConsent: boolean;
  marketingConsent: boolean;
}
```

### API Endpoints

**Profile Management:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get current user's profile |
| POST | `/api/user/profile` | Update profile |
| DELETE | `/api/user/profile` | Request deletion (30-day grace period) |

**Avatar Upload:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/user/profile/avatar` | Get presigned S3 upload URL |
| DELETE | `/api/user/profile/avatar` | Delete current avatar |

### Avatar Upload Flow

1. Client requests presigned URL from `/api/user/profile/avatar`
2. Server generates S3 presigned URL (valid 1 hour)
3. Client uploads image directly to S3 using presigned URL
4. Client updates profile with final image URL
5. Server triggers thumbnail generation (Lambda/image processing)

**Example:**
```typescript
// 1. Request upload URL
const response = await fetch('/api/user/profile/avatar', {
  method: 'POST',
  body: JSON.stringify({
    fileName: 'avatar.jpg',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
  }),
});

const { uploadUrl, imageUrl, thumbnailUrl, s3Key } = await response.json();

// 2. Upload to S3
await fetch(uploadUrl, {
  method: 'PUT',
  body: imageFile,
  headers: { 'Content-Type': 'image/jpeg' },
});

// 3. Update profile
await fetch('/api/user/profile', {
  method: 'POST',
  body: JSON.stringify({
    avatar: {
      url: imageUrl,
      thumbnailUrl,
      s3Key,
      uploadedAt: new Date().toISOString(),
      size: 1024000,
      mimeType: 'image/jpeg',
    },
  }),
});
```

---

## Phase 4: Analytics & Telemetry

### Overview
Privacy-safe, opt-in analytics system with PII scrubbing, consent management, and A/B testing infrastructure.

### Features
- ✅ UI interaction tracking (clicks, page views, time spent)
- ✅ Feature usage analytics
- ✅ Performance monitoring (page load, API latency)
- ✅ Error tracking
- ✅ A/B testing framework
- ✅ Consent management (GDPR compliant)
- ✅ PII scrubbing
- ✅ Data retention controls

### Data Models

**File:** `lib/types/analytics.ts`

```typescript
interface UIInteractionEvent {
  eventId: string;
  eventType: UIEventType;
  timestamp: string;
  userHash: string; // Anonymized
  sessionId: string;

  component?: string;
  action?: string;
  currentPage: string;
  metadata?: Record<string, any>; // PII-scrubbed
}

interface TelemetryConsent {
  userHash: string;
  consentGivenAt: string;

  allowUsageAnalytics: boolean;
  allowErrorReporting: boolean;
  allowPerformanceTracking: boolean;
  allowExperiments: boolean;

  dataRetentionDays: number; // Max 730 (2 years)
}
```

### API Endpoints

**Telemetry Collection:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analytics/telemetry` | Submit telemetry batch |
| GET | `/api/analytics/telemetry?period=day` | Get aggregates (admin) |

**Consent Management:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/consent` | Get consent settings |
| POST | `/api/analytics/consent` | Update consent |
| DELETE | `/api/analytics/consent` | Revoke all consent + delete data |

### Telemetry Collection Flow

1. Client creates telemetry batch (max 100 events)
2. Events are PII-scrubbed before sending
3. Batch sent to `/api/analytics/telemetry`
4. Server checks user consent
5. Events stored in time-series database
6. Real-time aggregates updated

**Example:**
```typescript
import { createUIInteractionEvent } from '@/lib/types/analytics';

// Track button click
const event = createUIInteractionEvent(
  'button_click',
  userHash,
  sessionId,
  '/dashboard/projects',
  {
    component: 'ProjectCard',
    action: 'view_details',
    label: 'View Project',
  }
);

// Batch events
const batch = {
  batchId: crypto.randomUUID(),
  userHash,
  sessionId,
  timestamp: new Date().toISOString(),
  uiEvents: [event],
  eventsCount: 1,
};

// Submit batch
await fetch('/api/analytics/telemetry', {
  method: 'POST',
  body: JSON.stringify(batch),
});
```

### A/B Testing

**Experiment Setup:**
```typescript
interface Experiment {
  experimentId: string;
  name: string;
  variants: Array<{
    variantId: string;
    name: string;
    weight: number; // 0-1 (traffic allocation)
  }>;
  primaryMetric: string;
  status: 'draft' | 'running' | 'completed';
}
```

**User Assignment:**
- Users are consistently assigned to same variant (sticky)
- Assignment stored in database
- Variant included in telemetry events

---

## Privacy & GDPR Compliance

### Principles

1. **Privacy by Design** - Privacy built into all systems from the start
2. **Data Minimization** - Collect only necessary data
3. **Purpose Limitation** - Data used only for stated purposes
4. **Transparency** - Clear disclosure of data collection
5. **User Control** - Users control their data

### GDPR Rights Implementation

| Right | Implementation |
|-------|----------------|
| **Right to Access** | GET `/api/user/profile`, `/api/user/preferences` |
| **Right to Rectification** | POST `/api/user/profile`, `/api/user/preferences` |
| **Right to Erasure** | DELETE `/api/user/profile` (30-day grace period) |
| **Right to Data Portability** | Export functionality in user settings |
| **Right to Object** | DELETE `/api/analytics/consent` |
| **Right to Restrict Processing** | Privacy controls in preferences |

### PII Handling

**Stored PII (Encrypted at Rest):**
- User email (userId)
- Real name (optional)
- Location (optional)
- Avatar images

**Anonymous Data (No PII):**
- userHash (SHA-256 of userId)
- Telemetry events
- Analytics aggregates
- A/B test assignments

**PII Scrubbing:**
```typescript
// Before telemetry submission
const scrubbedEvent = scrubEventPII(event);

// Removes: email, name, phone, address, IP
// Keeps: userHash, eventType, component, action
```

### Data Retention

| Data Type | Retention Period |
|-----------|------------------|
| User Profiles | Until account deletion |
| UI Preferences | Until account deletion |
| Dashboard State | Until account deletion + 30 days |
| Telemetry (opt-in) | 365 days (user configurable, max 730) |
| Error Logs | 90 days |
| Audit Logs | 7 years (legal requirement) |

---

## Data Flow Architecture

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. User Action (e.g., change theme)
       ▼
┌─────────────────────────────────────┐
│  Optimistic Update (Local State)    │
│  - Immediate UI feedback             │
│  - Store in localStorage             │
└──────┬──────────────────────────────┘
       │
       │ 2. Sync to Cloud
       ▼
┌─────────────────────────────────────┐
│  API Endpoint (/api/user/preferences) │
│  - Validate with Zod                 │
│  - Check authentication              │
│  - Apply privacy controls            │
└──────┬──────────────────────────────┘
       │
       │ 3. Persist
       ▼
┌─────────────────────────────────────┐
│  Database (PostgreSQL + Prisma)     │
│  - Encrypt PII at rest               │
│  - Index for fast retrieval          │
└──────┬──────────────────────────────┘
       │
       │ 4. Publish Event
       ▼
┌─────────────────────────────────────┐
│  Event Bus (NATS/Redis/GitOps)      │
│  - Notify other systems              │
│  - Trigger webhooks                  │
│  - Update search index               │
└─────────────────────────────────────┘
```

---

## API Reference

### Authentication

All API endpoints require authentication via NextAuth.js session cookies, except:
- POST `/api/analytics/telemetry` (requires consent, not session)

### Error Responses

All errors follow consistent format:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": { /* Zod validation errors if applicable */ }
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (no consent/permission)
- `500` - Internal Server Error

### Rate Limiting

**Recommended Limits:**
- `/api/user/preferences`: 60 requests/minute
- `/api/dashboard/state`: 120 requests/minute
- `/api/user/profile`: 30 requests/minute
- `/api/analytics/telemetry`: 10 batches/minute
- `/api/analytics/consent`: 10 requests/minute

---

## Database Schema

### Production Implementation

**Recommended Stack:**
- **Database:** PostgreSQL 14+
- **ORM:** Prisma
- **Encryption:** pgcrypto extension for PII
- **Search:** PostgreSQL Full-Text Search or Algolia
- **Telemetry:** TimescaleDB (PostgreSQL extension) or InfluxDB

**Tables:**

```sql
-- User Profiles
CREATE TABLE user_profiles (
  user_id TEXT PRIMARY KEY,
  user_hash TEXT UNIQUE NOT NULL,
  display_name TEXT,
  real_name_encrypted TEXT, -- pgcrypto
  bio TEXT,
  location_encrypted TEXT,
  avatar_url TEXT,
  avatar_s3_key TEXT,
  visibility JSONB NOT NULL,
  social_links JSONB,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  last_active TIMESTAMP
);

-- UI Preferences
CREATE TABLE ui_preferences (
  user_id TEXT PRIMARY KEY REFERENCES user_profiles(user_id),
  version INTEGER NOT NULL,
  theme JSONB NOT NULL,
  layout JSONB NOT NULL,
  dashboard JSONB NOT NULL,
  audio JSONB NOT NULL,
  ai JSONB NOT NULL,
  privacy JSONB NOT NULL,
  last_modified TIMESTAMP NOT NULL,
  last_synced TIMESTAMP
);

-- Dashboard State
CREATE TABLE dashboard_state (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id),
  dashboard_id TEXT NOT NULL,
  state JSONB NOT NULL,
  last_accessed TIMESTAMP NOT NULL,
  last_modified TIMESTAMP NOT NULL,
  UNIQUE(user_id, dashboard_id)
);

-- Telemetry Consent
CREATE TABLE telemetry_consent (
  user_hash TEXT PRIMARY KEY,
  allow_usage_analytics BOOLEAN NOT NULL,
  allow_error_reporting BOOLEAN NOT NULL,
  allow_performance_tracking BOOLEAN NOT NULL,
  allow_experiments BOOLEAN NOT NULL,
  data_retention_days INTEGER NOT NULL,
  consent_given_at TIMESTAMP NOT NULL,
  consent_updated_at TIMESTAMP NOT NULL
);

-- Telemetry Events (TimescaleDB Hypertable)
CREATE TABLE telemetry_events (
  event_id UUID PRIMARY KEY,
  user_hash TEXT NOT NULL,
  session_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  payload JSONB NOT NULL
);

-- Convert to TimescaleDB hypertable
SELECT create_hypertable('telemetry_events', 'timestamp');
```

---

## Migration Guide

### Phase 1: Setup Database

1. Install PostgreSQL + TimescaleDB
2. Run Prisma migrations: `npx prisma migrate dev`
3. Enable pgcrypto: `CREATE EXTENSION IF NOT EXISTS pgcrypto;`
4. Create indexes for common queries

### Phase 2: Migrate In-Memory Stores

Replace in-memory Maps with database queries:

**Before:**
```typescript
const profileStore = new Map<string, UserProfileUI>();
```

**After:**
```typescript
import { prisma } from '@/lib/db';

const profile = await prisma.userProfile.findUnique({
  where: { userId },
});
```

### Phase 3: S3 Integration

1. Create S3 bucket: `dawg-ai-avatars`
2. Configure CORS for client uploads
3. Set up CloudFront CDN
4. Implement presigned URL generation with AWS SDK

### Phase 4: Analytics Pipeline

1. Set up TimescaleDB for telemetry storage
2. Create aggregation queries (continuous aggregates)
3. Build admin dashboard for metrics visualization
4. Set up data retention policies (auto-delete old events)

---

## Security Considerations

### Encryption

- **At Rest:** PII encrypted in database (pgcrypto)
- **In Transit:** HTTPS only (TLS 1.3)
- **S3:** Server-side encryption (SSE-S3 or SSE-KMS)

### Access Control

- **API:** NextAuth.js session-based authentication
- **S3:** Presigned URLs with 1-hour expiration
- **Database:** Row-level security (Prisma middleware)

### Input Validation

- **All inputs:** Zod schema validation
- **File uploads:** MIME type verification, size limits
- **SQL injection:** Prevented by Prisma ORM

---

## Monitoring & Observability

### Metrics to Track

1. **API Performance:** Latency, error rate, throughput
2. **Database:** Query performance, connection pool usage
3. **S3:** Upload success rate, CDN hit ratio
4. **Sync:** Conflict rate, sync failures
5. **User Engagement:** Active users, feature adoption

### Logging

**Recommended Stack:**
- **Logs:** Winston + CloudWatch/Datadog
- **Errors:** Sentry
- **APM:** New Relic/Datadog

---

## Future Enhancements

1. **Real-time Sync:** WebSocket-based preference sync
2. **Collaboration:** Share dashboard configurations
3. **AI Insights:** Personalized UI recommendations
4. **Mobile App:** Sync preferences to mobile
5. **Backup/Restore:** Cloud backup of all user data

---

## Support & Maintenance

**Owned by:** Instance 4 (Data & Storage - Karen)
**Contact:** File issues in GitHub repository
**Documentation:** This file + inline code comments
**Tests:** See `/tests/data-architecture/`

---

**Last Updated:** 2025-10-02
**Schema Version:** 1.0.0
