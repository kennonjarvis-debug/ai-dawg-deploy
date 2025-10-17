# Centralized Type System

**Instance 4 (Data & Storage - Karen)** - Type safety and runtime validation

## 🎯 Overview

Single source of truth for all types in DAWG AI. No more scattered DTOs, duplicated interfaces, or type drift between layers.

### Architecture

```
┌─────────────────────────────────────────────────┐
│           API Contracts (OpenAPI)                │
│         specs/openapi/*.yaml                     │
└─────────────────────┬───────────────────────────┘
                      │ openapi-typescript
                      ↓
┌─────────────────────────────────────────────────┐
│       Generated Types (TypeScript)               │
│      lib/types/*-api.ts                          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│         Zod Schemas (Runtime Validation)         │
│         lib/types/schemas.ts                     │
└─────────────────────┬───────────────────────────┘
                      │ z.infer<>
                      ↓
┌─────────────────────────────────────────────────┐
│           TypeScript Types                       │
│         lib/types/index.ts                       │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬───────────┐
        ↓             ↓             ↓           ↓
   ┌────────┐  ┌─────────┐  ┌──────────┐  ┌────────┐
   │   UI   │  │  Audio  │  │    API   │  │Storage │
   │ Layer  │  │  Layer  │  │  Layer   │  │ Layer  │
   └────────┘  └─────────┘  └──────────┘  └────────┘
```

## 📦 Files

### Generated from OpenAPI Specs
```
lib/types/
├── journey-api.ts       # Journey API types (auto-generated)
├── automix-api.ts       # Automix API types (auto-generated)
└── masterme-api.ts      # MasterMe API types (auto-generated)
```

### Centralized Schemas & Types
```
lib/types/
├── schemas.ts           # Zod schemas + inferred types
└── index.ts             # Type exports + helpers
```

## 🚀 Quick Start

### 1. Import Types

```typescript
// ✅ CORRECT: Import from centralized types
import { UserProfile, Track, Recording } from '@/lib/types';

// ❌ WRONG: Don't duplicate types
interface UserProfile {  // Don't do this!
  userId: string;
  // ...
}
```

### 2. Validate at Boundaries

```typescript
import {
  UserProfileSchema,
  validateApiResponse,
  validateStorageData,
  validateUserInput,
} from '@/lib/types';

// Network boundary (API responses)
const response = await fetch('/api/profile');
const data = await response.json();
const profile = validateApiResponse(UserProfileSchema, data, '/api/profile');

// Storage boundary (localStorage, database)
const saved = localStorage.getItem('profile');
const profile = validateStorageData(UserProfileSchema, JSON.parse(saved), 'profile');

// User input boundary (forms, user actions)
const formData = Object.fromEntries(new FormData(form));
const validated = validateUserInput(ProfileUpdateRequestSchema, formData, 'profile form');
```

### 3. Use Type Guards

```typescript
import { isUserProfile, isTrack, isRecording } from '@/lib/types';

const data: unknown = JSON.parse(localStorage.getItem('data'));

if (isUserProfile(data)) {
  // TypeScript knows data is UserProfile here
  console.log(data.vocalRange.semitones);
}
```

## 📋 Available Schemas

### Core Entities

| Schema | Type | Purpose |
|--------|------|---------|
| `VocalRangeSchema` | `VocalRange` | User's vocal range (notes + semitones) |
| `SkillSnapshotSchema` | `SkillSnapshot` | Point-in-time skill metrics |
| `SessionRecordSchema` | `SessionRecord` | Practice session record |
| `UserProfileSchema` | `UserProfile` | Complete user profile |
| `PersonalizationSignalsSchema` | `PersonalizationSignals` | PII-free user signals |

### Layout Entities

| Schema | Type | Purpose |
|--------|------|---------|
| `PanelStateSchema` | `PanelState` | Panel visibility/size state |
| `WidgetPositionSchema` | `WidgetPosition` | Widget position in grid |
| `UserLayoutSchema` | `UserLayout` | Complete layout configuration |

### Audio Entities

| Schema | Type | Purpose |
|--------|------|---------|
| `TrackSchema` | `Track` | Audio/MIDI track |
| `RecordingSchema` | `Recording` | Recording blob + metadata |
| `ProjectSchema` | `Project` | Complete DAW project |

### API Request/Response Schemas

| Schema | Type | Purpose |
|--------|------|---------|
| `ProfileUpdateRequestSchema` | `ProfileUpdateRequest` | Profile update payload |
| `SkillsUpdateRequestSchema` | `SkillsUpdateRequest` | Skills update payload |
| `SessionLogRequestSchema` | `SessionLogRequest` | Session logging payload |
| `LayoutSaveRequestSchema` | `LayoutSaveRequest` | Layout save payload |

## 🔧 Validation Helpers

### `validateSchema<T>(schema, data, context?)`

Safe parse with detailed error messages.

```typescript
try {
  const validated = validateSchema(UserProfileSchema, data, 'user profile');
  // validated is properly typed
} catch (error) {
  // Error includes context and validation details
  console.error(error.message);
}
```

### `validateApiResponse<T>(schema, data, endpoint)`

Validate at network boundary (API responses).

```typescript
const profile = validateApiResponse(
  UserProfileSchema,
  apiData,
  'GET /api/profile'
);
```

### `validateStorageData<T>(schema, data, key)`

Validate at storage boundary (localStorage, database).

```typescript
const layout = validateStorageData(
  UserLayoutSchema,
  storedData,
  'layouts_user123'
);
```

### `validateUserInput<T>(schema, data, field?)`

Validate user input before processing.

```typescript
const skills = validateUserInput(
  SkillsUpdateRequestSchema,
  formData,
  'skills form'
);
```

## 📡 Using Generated API Types

### Extract Request/Response Types

```typescript
import type {
  JourneyApiPaths,
  RequestBody,
  ResponseBody
} from '@/lib/types';

// Extract request type
type StartJourneyRequest = RequestBody<
  JourneyApiPaths,
  '/journey/start',
  'post'
>;

// Extract response type
type StartJourneyResponse = ResponseBody<
  JourneyApiPaths,
  '/journey/start',
  'post',
  200
>;

// Use in API handler
export async function POST(request: NextRequest) {
  const body: StartJourneyRequest = await request.json();
  const response: StartJourneyResponse = await startJourney(body);
  return NextResponse.json(response);
}
```

### Use Component Schemas

```typescript
import type {
  VocalProfileApi,
  StylePreferencesApi,
  JourneyStateApi
} from '@/lib/types';

function JourneyDashboard({ state }: { state: JourneyStateApi }) {
  // state is typed from OpenAPI spec
}
```

## 🔄 Migration Guide

### Step 1: Replace Local Interfaces

```typescript
// Before (scattered DTOs)
interface Track {
  id: string;
  name: string;
  // ...
}

// After (centralized types)
import { Track } from '@/lib/types';
```

### Step 2: Add Validation at Boundaries

```typescript
// Before (no validation)
const profile = await fetch('/api/profile').then(r => r.json());

// After (validated)
import { UserProfileSchema, validateApiResponse } from '@/lib/types';

const response = await fetch('/api/profile');
const data = await response.json();
const profile = validateApiResponse(UserProfileSchema, data, '/api/profile');
```

### Step 3: Update API Routes

```typescript
// Before (inline validation)
const body = await request.json();
if (!body.durationMinutes) {
  return NextResponse.json({ error: 'Missing duration' }, { status: 400 });
}

// After (schema validation)
import { SessionLogRequestSchema, validateUserInput } from '@/lib/types';

const body = await request.json();
try {
  const validated = validateUserInput(SessionLogRequestSchema, body, 'session log');
  // validated.durationMinutes is properly typed
} catch (error) {
  return NextResponse.json(
    { success: false, error: error.message },
    { status: 400 }
  );
}
```

## 🔒 Type Safety Guarantees

### Compile-Time Safety

- ✅ TypeScript catches type mismatches before runtime
- ✅ Auto-complete and IntelliSense for all types
- ✅ Refactoring tools work correctly
- ✅ Import errors caught immediately

### Runtime Safety

- ✅ Zod validates data at boundaries
- ✅ Detailed error messages for debugging
- ✅ Prevents invalid data from entering system
- ✅ Graceful degradation on validation failures

### Example: Full Type Safety

```typescript
import {
  UserProfile,
  UserProfileSchema,
  validateApiResponse,
  validateStorageData,
} from '@/lib/types';

// 1. Fetch from API (network boundary)
const response = await fetch('/api/profile');
const apiData = await response.json();
const profile = validateApiResponse(
  UserProfileSchema,
  apiData,
  'GET /api/profile'
); // ✅ Runtime validated + typed

// 2. Save to localStorage (storage boundary)
localStorage.setItem('profile', JSON.stringify(profile));

// 3. Load from localStorage (storage boundary)
const stored = localStorage.getItem('profile');
const loaded = validateStorageData(
  UserProfileSchema,
  JSON.parse(stored!),
  'profile'
); // ✅ Runtime validated + typed

// 4. Use in component (UI boundary)
function ProfileCard({ profile }: { profile: UserProfile }) {
  // profile is guaranteed valid by TypeScript + Zod
  return <div>{profile.vocalRange.semitones} semitones</div>;
}
```

## 📝 Adding New Types

### 1. Add Zod Schema

```typescript
// lib/types/schemas.ts

export const NewEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number().min(0).max(100),
});

export type NewEntity = z.infer<typeof NewEntitySchema>;
```

### 2. Export from Index

```typescript
// lib/types/index.ts

export * from './schemas';
```

### 3. Use Throughout App

```typescript
import { NewEntity, NewEntitySchema, validateApiResponse } from '@/lib/types';
```

## 🔄 Regenerating API Types

When OpenAPI specs change:

```bash
# Regenerate all API types
npx openapi-typescript specs/openapi/journey-api.yaml -o lib/types/journey-api.ts
npx openapi-typescript specs/openapi/automix-api.yaml -o lib/types/automix-api.ts
npx openapi-typescript specs/openapi/masterme-api.yaml -o lib/types/masterme-api.ts

# Or use npm script (if added to package.json)
npm run generate:types
```

## 🐛 Troubleshooting

### Validation Errors

```typescript
// Error: "Validation failed for API response from /api/profile: ..."
// Solution: Check API response matches schema

// Debug the actual data
console.log('API response:', data);

// Check schema requirements
console.log('Expected schema:', UserProfileSchema);
```

### Type Mismatches

```typescript
// Error: Type 'X' is not assignable to type 'Y'
// Solution: Use centralized type instead of local interface

// ❌ Wrong
interface UserProfile { ... }

// ✅ Correct
import { UserProfile } from '@/lib/types';
```

### Missing Fields

```typescript
// Error: "Property 'semitones' is missing"
// Solution: Check if field is optional in schema

// Make field optional
export const VocalRangeSchema = z.object({
  semitones: z.number().optional(), // Add .optional()
});
```

## 📊 Benefits

### Before Centralized Types

- ❌ Duplicate type definitions across files
- ❌ Type drift between layers
- ❌ No runtime validation
- ❌ Silent data corruption
- ❌ API contract violations undetected

### After Centralized Types

- ✅ Single source of truth
- ✅ Type consistency enforced
- ✅ Runtime validation at all boundaries
- ✅ Early error detection
- ✅ API contracts enforced

## 🎯 Best Practices

1. **Always validate at boundaries**
   - Network (API responses)
   - Storage (localStorage, database)
   - User input (forms, actions)

2. **Use centralized types everywhere**
   - Import from `@/lib/types`
   - Never duplicate interfaces

3. **Leverage type guards**
   - Use `isUserProfile()`, `isTrack()`, etc.
   - Narrow unknown types safely

4. **Keep schemas updated**
   - Update when data structure changes
   - Regenerate API types when specs change

5. **Add helpful error context**
   - Use `validateApiResponse(schema, data, 'GET /api/endpoint')`
   - Include meaningful context strings

---

**Created by:** Instance 4 (Data & Storage - Karen)
**Status:** ✅ Complete
**Files:** `lib/types/schemas.ts`, `lib/types/index.ts`, `lib/types/*-api.ts`
