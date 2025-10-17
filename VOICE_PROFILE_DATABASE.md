# VoiceProfile Database Integration - Complete

**For:** Instance 3 (AI Conductor)
**From:** Instance 4 (Data & Storage)
**Date:** 2025-10-02

---

## Summary

Instance 4 has completed database integration for voice cloning profiles. Voice profiles are now persisted to PostgreSQL and can be queried/managed via updated API endpoints.

---

## What Was Done

### 1. ✅ Added VoiceProfile Model to Prisma Schema

**File:** `/prisma/schema.prisma`

```prisma
model VoiceProfile {
  id              String   @id @default(cuid())
  userId          String
  name            String   // User-friendly name (e.g., "My Voice", "Lead Singer")

  // Voice sample reference
  sampleAudioUrl  String   // S3 URL to 6-30 second voice sample
  s3Key           String   // S3 key for deletion

  // Metadata
  duration        Float    // Duration of voice sample in seconds
  sampleRate      Int      @default(48000)
  format          String   @default("webm") // webm, wav, mp3
  fileSize        Int?     // Size in bytes

  // Usage tracking
  harmoniesGenerated Int   @default(0) // Number of harmonies generated with this profile
  lastUsedAt      DateTime? // Last time this profile was used

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, createdAt])
  @@map("voice_profiles")
}
```

### 2. ✅ Updated Voice Clone API

**File:** `/app/api/voice/clone/route.ts`

**Changes:**
- `POST /api/voice/clone` - Now saves voice profiles to database
  - Requires authentication (`requireAuth()`)
  - Stores S3 key, duration, sample rate, format
  - Returns Prisma VoiceProfile object

- `GET /api/voice/clone` - Fetches user's voice profiles from database
  - Requires authentication
  - Returns all voice profiles for authenticated user
  - Sorted by creation date (newest first)

- `DELETE /api/voice/clone` - New endpoint for deleting voice profiles
  - Requires authentication
  - Verifies ownership before deletion
  - Deletes from both S3 and database
  - Returns success confirmation

### 3. ✅ Updated Harmony Generation API

**File:** `/app/api/voice/harmony/route.ts`

**Changes:**
- Fetches voice profile from database (not mocked)
- Verifies ownership before generating harmonies
- Converts Prisma model to VoiceProfile interface
- **New:** Tracks usage statistics
  - Increments `harmoniesGenerated` counter
  - Updates `lastUsedAt` timestamp

---

## API Changes

### POST /api/voice/clone

**Before:**
```typescript
{
  userId: string; // Manually provided
  name: string;
  sampleAudioUrl: string;
  duration: number;
  format: string;
}
```

**After:**
```typescript
{
  // userId removed (comes from auth session)
  name: string;
  sampleAudioUrl: string;
  s3Key: string; // NEW - required for deletion
  duration: number;
  format: string;
  sampleRate?: number; // OPTIONAL
  fileSize?: number; // OPTIONAL
}
```

### GET /api/voice/clone

**Before:**
```typescript
GET /api/voice/clone?userId=xxx
// Returns empty array (TODO comment)
```

**After:**
```typescript
GET /api/voice/clone
// No query params needed (uses auth session)
// Returns actual voice profiles from database
```

**Response:**
```typescript
{
  success: true;
  voiceProfiles: [
    {
      id: "clx123...",
      userId: "user_abc",
      name: "My Voice",
      sampleAudioUrl: "https://s3.amazonaws.com/...",
      s3Key: "users/user_abc/voices/voice_123.webm",
      duration: 12.5,
      sampleRate: 48000,
      format: "webm",
      fileSize: 524288,
      harmoniesGenerated: 5,
      lastUsedAt: "2025-10-02T20:30:00Z",
      createdAt: "2025-10-01T14:22:00Z",
      updatedAt: "2025-10-02T20:30:00Z"
    }
  ];
}
```

### DELETE /api/voice/clone (NEW)

```typescript
DELETE /api/voice/clone
Body: {
  voiceProfileId: string;
}

Response: {
  success: true;
}
```

---

## Migration Steps

### Step 1: Run Database Migration

```bash
# Generate migration
npx prisma migrate dev --name add_voice_profiles

# Or push schema changes (for development)
npx prisma db push
```

### Step 2: Update Voice Cloning Workflow

**Old workflow:**
```typescript
// 1. Upload voice sample to S3
const s3Url = await uploadToS3(voiceBlob);

// 2. Create voice profile (stored in memory)
const response = await fetch('/api/voice/clone', {
  method: 'POST',
  body: JSON.stringify({
    userId: currentUserId,
    name: 'My Voice',
    sampleAudioUrl: s3Url,
    duration: 12.5,
    format: 'webm',
  }),
});
```

**New workflow:**
```typescript
// 1. Upload voice sample to S3 (using Instance 4's API)
const formData = new FormData();
formData.append('file', voiceBlob, 'voice-sample.webm');
formData.append('projectId', 'voices'); // Or use a special folder
formData.append('recordingId', `voice-${Date.now()}`);

const uploadResponse = await fetch('/api/audio/upload', {
  method: 'POST',
  body: formData,
});
const { url: s3Url, key: s3Key } = await uploadResponse.json();

// 2. Create voice profile (stored in database)
const response = await fetch('/api/voice/clone', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    // userId removed - comes from auth
    name: 'My Voice',
    sampleAudioUrl: s3Url,
    s3Key: s3Key, // NEW - required
    duration: 12.5,
    format: 'webm',
    sampleRate: 48000, // Optional
    fileSize: voiceBlob.size, // Optional
  }),
});
```

### Step 3: Update AI Actions

**File:** `/lib/ai/actions.ts`

Update the `create_voice_profile` action:

```typescript
case 'create_voice_profile': {
  const { recordingId, name } = input;

  // 1. Get recording from store
  const recording = /* get recording */;

  // 2. Upload to S3 first
  const formData = new FormData();
  formData.append('file', recording.blob, `voice-${recordingId}.webm`);
  formData.append('projectId', 'voices');
  formData.append('recordingId', `voice-${recordingId}`);

  const uploadResponse = await fetch('/api/audio/upload', {
    method: 'POST',
    body: formData,
  });
  const { url: s3Url, key: s3Key } = await uploadResponse.json();

  // 3. Create voice profile in database
  const response = await fetch('/api/voice/clone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      sampleAudioUrl: s3Url,
      s3Key, // NEW
      duration: recording.duration / 1000,
      format: 'webm',
    }),
  });

  const { voiceProfile } = await response.json();
  return {
    success: true,
    message: `Created voice profile "${name}" (${voiceProfile.id})`,
    data: { voiceProfile },
  };
}
```

### Step 4: Update UI Components (Instance 1)

**Voice Profile Selector:**
```typescript
const [voiceProfiles, setVoiceProfiles] = useState([]);

useEffect(() => {
  const fetchVoiceProfiles = async () => {
    const response = await fetch('/api/voice/clone');
    const { voiceProfiles } = await response.json();
    setVoiceProfiles(voiceProfiles);
  };
  fetchVoiceProfiles();
}, []);

// Render
<select>
  {voiceProfiles.map(profile => (
    <option key={profile.id} value={profile.id}>
      {profile.name} ({profile.harmoniesGenerated} harmonies)
    </option>
  ))}
</select>
```

**Delete Voice Profile:**
```typescript
const deleteVoiceProfile = async (voiceProfileId: string) => {
  const response = await fetch('/api/voice/clone', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voiceProfileId }),
  });

  if (response.ok) {
    // Refresh list
    fetchVoiceProfiles();
  }
};
```

---

## Database Indexes

The VoiceProfile model has two indexes for optimal query performance:

1. `@@index([userId])` - Fast lookups for user's voice profiles
2. `@@index([userId, createdAt])` - Optimized for sorted queries

---

## Usage Tracking

The system now tracks:
- **harmoniesGenerated** - Incremented each time a harmony is generated
- **lastUsedAt** - Updated each time the profile is used

This enables:
- Showing "most used" profiles in UI
- Deleting unused profiles
- Analytics on voice profile usage

---

## Testing

### Manual Testing

```bash
# 1. Create voice profile
curl -X POST http://localhost:3000/api/voice/clone \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Voice",
    "sampleAudioUrl": "https://s3.amazonaws.com/test.webm",
    "s3Key": "users/test/voices/test.webm",
    "duration": 10.5,
    "format": "webm"
  }'

# 2. List voice profiles
curl http://localhost:3000/api/voice/clone

# 3. Generate harmony (updates usage)
curl -X POST http://localhost:3000/api/voice/harmony \
  -H "Content-Type": application/json" \
  -d '{
    "leadVocalUrl": "https://...",
    "voiceProfileId": "clx123...",
    "intervals": ["third_above"]
  }'

# 4. Delete voice profile
curl -X DELETE http://localhost:3000/api/voice/clone \
  -H "Content-Type: application/json" \
  -d '{"voiceProfileId": "clx123..."}'
```

---

## Breaking Changes

⚠️ **API Breaking Changes:**

1. **POST /api/voice/clone**
   - Removed `userId` field (now from auth session)
   - Added required `s3Key` field
   - Added optional `sampleRate` and `fileSize` fields

2. **GET /api/voice/clone**
   - Removed `userId` query parameter
   - Now uses authenticated session

---

## Files Modified

- `/prisma/schema.prisma` - Added VoiceProfile model
- `/app/api/voice/clone/route.ts` - Updated to use database
- `/app/api/voice/harmony/route.ts` - Fetch profiles from database, track usage

---

## Next Steps for Instance 3

1. Run database migration (`npx prisma migrate dev`)
2. Update AI action handlers to use new API format
3. Test voice profile creation/listing/deletion
4. Update documentation if needed

---

## For Instance 1 (UI)

Voice cloning UI components needed:
1. **Voice Profile List** - Show user's voice profiles
2. **Create Voice Profile** - Upload voice sample + name input
3. **Voice Profile Selector** - Dropdown for harmony generation
4. **Delete Voice Profile** - Delete button with confirmation
5. **Usage Statistics** - Show harmonies generated count

See `VOICE_CLONING_SETUP.md` for complete voice cloning workflow.

---

**Status:** ✅ Complete - Voice profiles now persisted to database

**Last Updated:** 2025-10-02
