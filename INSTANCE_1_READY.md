# Instance 1 - Integration Ready! 🎉

**From:** Instance 4 (Data & Storage)
**To:** Instance 1 (Frontend)
**Date:** 2025-10-02

---

## Summary

Instance 4 has **prepared everything** you need to integrate auto-save + S3 storage into the DAW. All helper utilities, type updates, and code examples are ready to copy/paste.

---

## What Instance 4 Did

### 1. ✅ Updated Core Types
**File:** `/src/core/types.ts`
- Added `s3Key` and `s3Url` to `Recording` interface
- Added `Project` interface for project metadata
- Made `blob` optional (for backwards compatibility)
- Added `order` field to `Track` interface

### 2. ✅ Enhanced Zustand Store
**File:** `/src/core/store.ts`
- Added `setTracks()` - Load tracks from database
- Added `updateRecording()` - Update recording with S3 data
- Added `setOnTrackChange()` - Hook for auto-save
- Added `onTrackChange` callback that fires on all track mutations
- Auto-save will be notified on every track/recording change

### 3. ✅ Created Helper Utilities
**File:** `/src/utils/recordingStorage.ts`
- `uploadRecordingToS3()` - Upload blob to S3, returns key + URL
- `getRecordingPlaybackUrl()` - Get signed URL for playback
- `deleteRecordingFromS3()` - Delete recording from S3
- `loadRecordingAudio()` - Load audio for playback (S3 or blob)
- Helper functions for checking storage type

**File:** `/src/utils/projectSerializer.ts`
- `serializeTracks()` - Convert tracks to API format
- `deserializeTracks()` - Convert API format to tracks
- `createSavePayload()` - Create complete save payload
- `getUnsavedRecordings()` - Find recordings that need S3 upload
- `hasUnsavedRecordings()` - Check if upload needed
- `getProjectStats()` - Get project statistics

### 4. ✅ Added SessionProvider
**File:** `/app/layout.tsx`
- Wrapped app with `<SessionProvider>` from NextAuth
- Authentication now available via `useSession()` hook

### 5. ✅ Created Complete Integration Example
**File:** `/INTEGRATION_EXAMPLE.tsx`
- Full working example of `/app/page.tsx` with:
  - Auto-save hook integrated
  - SaveStatusIndicator in header
  - S3 upload after recording
  - Project loading on mount
  - Save before page unload
  - Authentication checks
- **Ready to copy/paste!**

---

## Quick Start (5 Steps)

### Step 1: Review the example
Open `/INTEGRATION_EXAMPLE.tsx` and read through it.

### Step 2: Copy the imports
Add these to your `/app/page.tsx`:
```typescript
import { useSession } from 'next-auth/react';
import { useAutoSave } from '@/src/hooks/useAutoSave';
import { SaveStatusIndicator } from '@/src/components/SaveStatusIndicator';
import { uploadRecordingToS3 } from '@/src/utils/recordingStorage';
import { createSavePayload, deserializeTracks } from '@/src/utils/projectSerializer';
import type { Project } from '@/src/core/types';
```

### Step 3: Add state for project
```typescript
const [project, setProject] = useState<Project>({
  name: 'Untitled Project',
  bpm: 120,
  timeSignature: '4/4',
});
```

### Step 4: Add auto-save hook
Copy the `useAutoSave` hook from `/INTEGRATION_EXAMPLE.tsx` (lines 35-110).

### Step 5: Add SaveStatusIndicator to header
```tsx
<SaveStatusIndicator
  status={saveStatus}
  lastSaved={lastSaved}
  error={saveError}
/>
<button onClick={saveNow}>Save Now</button>
```

---

## Integration Checklist

Use this checklist as you integrate:

### Auto-save Integration
- [ ] Add `useAutoSave` hook to main page component
- [ ] Add `SaveStatusIndicator` to header/footer
- [ ] Connect `setOnTrackChange` to mark dirty on changes
- [ ] Test auto-save triggers after 30s
- [ ] Test manual "Save Now" button
- [ ] Verify projects save to database

### S3 Integration
- [ ] Upload recordings to S3 after stopping record
- [ ] Update `Recording` object with `s3Key` after upload
- [ ] Use `getRecordingPlaybackUrl()` to fetch signed URLs
- [ ] Update `usePlayback` to load from S3
- [ ] Test recordings playback after page refresh
- [ ] Verify S3 bucket receives files

### Project Loading
- [ ] Load project on page mount if `projectId` in URL/localStorage
- [ ] Deserialize tracks from database format
- [ ] Update transport BPM from loaded project
- [ ] Set active track after loading
- [ ] Handle missing/invalid project IDs gracefully

### Authentication
- [ ] Check `useSession()` before enabling auto-save
- [ ] Show "Not logged in" message when unauthenticated
- [ ] Disable auto-save when session is null
- [ ] Show user name/email in header when authenticated

### Error Handling
- [ ] Show error notification on save failure
- [ ] Retry failed saves (optional)
- [ ] Handle offline mode gracefully
- [ ] Show warning before leaving with unsaved changes

---

## Testing Plan

### 1. Auto-save Testing
```bash
# Start app
npm run dev

# Test flow:
1. Create a track
2. Wait 2 seconds (debounce delay)
3. See "Saving..." indicator
4. Wait for save to complete
5. See "Saved" with checkmark
6. Refresh page
7. Verify track persisted
```

### 2. S3 Storage Testing
```bash
# Record audio
1. Click record button
2. Record 5 seconds of audio
3. Stop recording
4. Check Network tab for POST /api/audio/upload
5. Verify recording has s3Key in store
6. Play recording back
7. Check Network tab for GET /api/audio/url
```

### 3. Project Loading Testing
```bash
# Save and reload
1. Create 3 tracks with recordings
2. Wait for auto-save
3. Copy project ID from localStorage
4. Refresh page
5. Verify all 3 tracks load
6. Verify BPM matches
7. Verify recordings play correctly
```

---

## Common Issues & Solutions

### Issue: "Not authenticated" error
**Solution:** User needs to log in. Create login UI or use `signIn()` from NextAuth.

### Issue: Recordings don't persist
**Solution:** Make sure `uploadRecordingToS3()` is called before saving project. Check S3 credentials in `.env.local`.

### Issue: Auto-save not triggering
**Solution:** Verify `setOnTrackChange` is connected. Check `markDirty()` is called on changes.

### Issue: "Failed to load recording"
**Solution:** Check signed URL is valid. Verify S3 bucket CORS settings allow GET requests.

### Issue: Type errors in page.tsx
**Solution:** Run `npm run type-check` to see errors. Likely need to add `| null` to some types.

---

## Next Steps After Integration

Once auto-save + S3 are working:

1. **Add Login UI** - Create sign-in/sign-up components
2. **Add Project List** - Use `/api/projects/list` to show user's projects
3. **Add New Project Button** - Clear state, start fresh project
4. **Add Project Settings** - Edit project name, BPM, time signature
5. **Add Delete Project** - Use `/api/projects/delete` endpoint

---

## Files Created by Instance 4

**Core Infrastructure:**
- `/src/hooks/useAutoSave.ts` - Auto-save React hook
- `/src/components/SaveStatusIndicator.tsx` - Save status UI component
- `/lib/autosave/conflict-resolver.ts` - Conflict detection
- `/lib/storage/s3-client.ts` - S3 utilities
- `/lib/auth/session-provider.tsx` - NextAuth provider

**Integration Helpers:**
- `/src/utils/recordingStorage.ts` - S3 upload/download helpers ✅ **NEW**
- `/src/utils/projectSerializer.ts` - Project serialization ✅ **NEW**

**API Endpoints:**
- `POST /api/projects/save` - Save project
- `GET /api/projects/load` - Load project
- `GET /api/projects/list` - List projects
- `DELETE /api/projects/delete` - Delete project
- `POST /api/audio/upload` - Upload to S3
- `GET /api/audio/url` - Get signed URL
- `DELETE /api/audio/delete` - Delete from S3
- `POST /api/auth/register` - User registration
- `/api/auth/*` - NextAuth endpoints

**Documentation:**
- `INSTANCE_1_INTEGRATION.md` - Step-by-step integration guide
- `INTEGRATION_EXAMPLE.tsx` - Complete working example ✅ **NEW**
- `INSTANCE_1_READY.md` - This file (quick start guide) ✅ **NEW**
- `AUTOSAVE_SETUP.md` - Auto-save API reference
- `S3_STORAGE_SETUP.md` - S3 setup guide
- `AUTHENTICATION_SETUP.md` - Auth integration guide
- `API.md` - Complete API reference

---

## Questions?

If you run into issues:
1. Check `/INTEGRATION_EXAMPLE.tsx` for working code
2. Read `/INSTANCE_1_INTEGRATION.md` for detailed explanations
3. Check API.md for endpoint documentation
4. Look at helper utilities in `/src/utils/`

---

## Instance 4 Status

**All backend infrastructure complete! 🎊**

Instance 4 is now in **support mode** - ready to help with integration issues, create additional utilities, or fix bugs discovered during testing.

**Estimated Integration Time:** 2-3 hours for complete integration

---

**Good luck with the integration! 🚀**
