# Instance 1 Integration Guide - Auto-save & S3 Storage

**For:** Instance 1 (Frontend/UI)
**From:** Instance 4 (Data & Storage)
**Date:** 2025-10-02

---

## Overview

Instance 4 has completed **all backend infrastructure** for DAWG AI. This guide shows Instance 1 how to integrate:

1. **Auto-save mechanism** - Save projects every 30s with visual feedback
2. **S3 audio storage** - Upload/download recordings to cloud storage
3. **Authentication** - Already documented in `AUTHENTICATION_SETUP.md`

---

## 1. Auto-save Integration

### Step 1: Add Auto-save to Main DAW Page

**File:** `/app/page.tsx`

```typescript
'use client'

import { useAutoSave } from '@/src/hooks/useAutoSave';
import { SaveStatusIndicator } from '@/src/components/SaveStatusIndicator';
import { useTrackStore } from '@/src/core/store';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function DAWPage() {
  const { data: session } = useSession();
  const tracks = useTrackStore((state) => state.tracks);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Initialize or load project
  useEffect(() => {
    if (session?.user?.id) {
      // Load project ID from URL or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('projectId') || localStorage.getItem('currentProjectId');
      setProjectId(id);
    }
  }, [session]);

  // Auto-save hook
  const { status, lastSaved, error, saveNow, markDirty } = useAutoSave({
    enabled: !!session && !!projectId, // Only save when logged in and project exists
    interval: 30000, // Save every 30 seconds
    onSave: async () => {
      const response = await fetch('/api/projects/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: {
            id: projectId,
            name: 'My Project', // Get from project state
            bpm: 120, // Get from transport
            timeSignature: '4/4',
          },
          tracks: tracks.map((track) => ({
            id: track.id,
            name: track.name,
            type: track.type,
            volume: track.volume,
            pan: track.pan,
            mute: track.mute,
            solo: track.solo,
            color: track.color,
            order: track.order,
            recordings: track.recordings.map((rec) => ({
              id: rec.id,
              startTime: rec.startTime,
              duration: rec.duration,
              s3Key: rec.s3Key, // Important: Store S3 key, not blob
            })),
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save project');
      }

      const data = await response.json();

      // Update project ID if new project
      if (!projectId && data.project?.id) {
        setProjectId(data.project.id);
        localStorage.setItem('currentProjectId', data.project.id);
      }
    },
    onError: (error) => {
      console.error('Auto-save failed:', error);
      // Optional: Show toast notification
    },
  });

  // Mark dirty whenever tracks change
  useEffect(() => {
    if (tracks.length > 0) {
      markDirty();
    }
  }, [tracks, markDirty]);

  return (
    <div className="daw-layout">
      {/* Header with save indicator */}
      <header className="daw-header">
        <div className="flex items-center gap-4">
          <h1>DAWG AI</h1>
          <SaveStatusIndicator
            status={status}
            lastSaved={lastSaved}
            error={error}
          />
          <button onClick={saveNow} className="btn-save">
            Save Now
          </button>
        </div>
      </header>

      {/* Your existing DAW UI */}
      <main>
        {/* TransportControls, TrackList, WaveformDisplay, etc. */}
      </main>
    </div>
  );
}
```

### Step 2: Mark Dirty on Track Changes

**File:** `/src/core/store.ts`

Add `markDirty` callback to track actions:

```typescript
export const useTrackStore = create<TrackStore>((set) => ({
  tracks: [],

  // Add this callback reference
  onTrackChange: null as (() => void) | null,

  setOnTrackChange: (callback: (() => void) | null) => set({ onTrackChange: callback }),

  addTrack: (track: Track) => set((state) => {
    state.onTrackChange?.(); // Notify auto-save
    return { tracks: [...state.tracks, track] };
  }),

  updateTrack: (trackId: string, updates: Partial<Track>) => set((state) => {
    state.onTrackChange?.(); // Notify auto-save
    return {
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, ...updates } : t)),
    };
  }),

  deleteTrack: (trackId: string) => set((state) => {
    state.onTrackChange?.(); // Notify auto-save
    return { tracks: state.tracks.filter((t) => t.id !== trackId) };
  }),

  addRecording: (trackId: string, recording: Recording) => set((state) => {
    state.onTrackChange?.(); // Notify auto-save
    return {
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, recordings: [...t.recordings, recording] } : t
      ),
    };
  }),
}));
```

Then in your DAW component:

```typescript
const setOnTrackChange = useTrackStore((state) => state.setOnTrackChange);

useEffect(() => {
  setOnTrackChange(markDirty);
  return () => setOnTrackChange(null);
}, [markDirty, setOnTrackChange]);
```

### Step 3: Disable Auto-save During Recording/Playback

```typescript
const isRecording = useTrackStore((state) => state.tracks.some((t) => t.recordArm));
const isPlaying = useTransport((state) => state.isPlaying);

const { ... } = useAutoSave({
  enabled: !isRecording && !isPlaying && !!session, // Don't interrupt audio
  onSave: saveProject,
});
```

---

## 2. S3 Audio Storage Integration

### Step 1: Upload Recording to S3

**File:** `/src/core/useRecording.ts`

After recording stops, upload to S3 instead of storing Blob:

```typescript
const stopRecording = async () => {
  if (!mediaRecorderRef.current || !isRecording) return;

  mediaRecorderRef.current.stop();

  // Wait for recorded chunks
  const blob = await new Promise<Blob>((resolve) => {
    mediaRecorderRef.current!.addEventListener('dataavailable', (e) => {
      resolve(e.data);
    }, { once: true });
  });

  // Upload to S3
  const formData = new FormData();
  formData.append('file', blob, `recording-${Date.now()}.webm`);
  formData.append('projectId', projectId);
  formData.append('recordingId', recordingId);

  const response = await fetch('/api/audio/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload recording');
  }

  const { url, key } = await response.json();

  // Store S3 reference in track store (not Blob)
  addRecording(trackId, {
    id: recordingId,
    startTime: recordingStartTime,
    duration: Date.now() - recordingStartTime,
    s3Key: key,        // Store S3 key
    s3Url: url,        // Store S3 URL
    // Don't store blob: blob
  });
};
```

### Step 2: Load Recording from S3 for Playback

**File:** `/src/core/usePlayback.ts`

When loading a recording, fetch signed URL:

```typescript
const loadRecording = async (recording: Recording) => {
  // If recording has S3 key, fetch signed URL
  if (recording.s3Key) {
    const response = await fetch(
      `/api/audio/url?key=${recording.s3Key}&recordingId=${recording.id}`
    );

    if (!response.ok) {
      throw new Error('Failed to get audio URL');
    }

    const { url } = await response.json();

    // Fetch audio file
    const audioResponse = await fetch(url);
    const arrayBuffer = await audioResponse.arrayBuffer();

    // Decode to AudioBuffer
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  }

  // Legacy: Load from Blob (for backwards compatibility)
  if (recording.blob) {
    const arrayBuffer = await recording.blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  }

  throw new Error('No audio data found');
};
```

### Step 3: Delete Recording from S3

When user deletes a recording:

```typescript
const deleteRecording = async (trackId: string, recordingId: string) => {
  const track = tracks.find((t) => t.id === trackId);
  const recording = track?.recordings.find((r) => r.id === recordingId);

  if (recording?.s3Key) {
    // Delete from S3
    await fetch('/api/audio/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: recording.s3Key,
        recordingId,
      }),
    });
  }

  // Remove from track store
  removeRecording(trackId, recordingId);
};
```

---

## 3. Load Project on Page Load

**File:** `/app/page.tsx`

Add project loading logic:

```typescript
useEffect(() => {
  const loadProject = async () => {
    if (!session?.user?.id || !projectId) return;

    try {
      const response = await fetch(`/api/projects/load?projectId=${projectId}`);

      if (!response.ok) {
        throw new Error('Failed to load project');
      }

      const { project, tracks: savedTracks } = await response.json();

      // Update transport with project data
      setTransportBPM(project.bpm);
      setTransportTimeSignature(project.timeSignature);

      // Load tracks into store
      setTracks(
        savedTracks.map((track: any) => ({
          ...track,
          recordings: track.recordings.map((rec: any) => ({
            ...rec,
            // S3 data already in recording
          })),
        }))
      );

      console.log('Project loaded:', project.name);
    } catch (error) {
      console.error('Failed to load project:', error);
      // Optional: Show error notification
    }
  };

  loadProject();
}, [session, projectId]);
```

---

## 4. Save Before Leaving Page

Add browser warning for unsaved changes:

```typescript
useEffect(() => {
  const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
    if (status === 'idle' && lastSaved) {
      // Has changes since last save
      e.preventDefault();
      e.returnValue = '';

      // Try to save before leaving
      await saveNow();
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [status, lastSaved, saveNow]);
```

---

## 5. Testing Checklist

### Auto-save Testing
- [ ] Make changes to track → See "Saving..." after 2s (debounce)
- [ ] Wait 30s → See "Saved" with green checkmark
- [ ] Check console for successful POST to `/api/projects/save`
- [ ] Refresh page → Project loads with saved changes
- [ ] Disconnect internet → See "Save failed" error
- [ ] Click "Save Now" button → Immediate save

### S3 Storage Testing
- [ ] Record audio → Recording uploads to S3 (check Network tab)
- [ ] Play recording → Audio loads from S3 signed URL
- [ ] Delete recording → Recording removed from S3
- [ ] Check S3 bucket for uploaded files (organized by user/project/recording)
- [ ] Verify signed URLs expire after 1 hour

### Integration Testing
- [ ] Record audio + wait for auto-save → Recording saved with S3 reference
- [ ] Load project → Recordings play from S3
- [ ] Make changes while offline → Local state updates, save fails gracefully
- [ ] Go back online → Next auto-save succeeds

---

## 6. Environment Variables

Make sure `.env.local` has all required variables:

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# S3 Storage
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="dawg-ai-audio"

# Optional: Cloudflare R2
S3_ENDPOINT="https://your-account.r2.cloudflarestorage.com"

# AI (Claude)
ANTHROPIC_API_KEY="sk-ant-..."
```

---

## 7. TypeScript Types Update

**File:** `/src/core/types.ts`

Update Recording interface:

```typescript
export interface Recording {
  id: string;
  startTime: number;
  duration: number;

  // S3 storage (new)
  s3Key?: string;
  s3Url?: string;

  // Legacy blob storage (deprecated)
  blob?: Blob;
  url?: string;
}
```

---

## 8. Common Issues & Solutions

### Issue: "Failed to save project" (401 Unauthorized)
**Solution:** User not logged in. Wrap app with `<SessionProvider>` and check `session` before enabling auto-save.

### Issue: "File too large" (413)
**Solution:** Recording exceeds 100MB limit. Split into multiple recordings or compress audio.

### Issue: Auto-save triggers too frequently
**Solution:** Increase `debounceDelay` to 5000ms (5 seconds) or increase `interval` to 60000ms (1 minute).

### Issue: Recordings don't play after page refresh
**Solution:** Ensure recordings are uploaded to S3 and `s3Key` is stored in database. Check signed URL is fetched correctly.

### Issue: Conflict detected on every save
**Solution:** Ignore timestamp fields in conflict detection. See `AUTOSAVE_SETUP.md` troubleshooting.

---

## 9. Optional Enhancements

### Show Upload Progress
```typescript
const uploadRecording = async (blob: Blob) => {
  const xhr = new XMLHttpRequest();

  xhr.upload.addEventListener('progress', (e) => {
    const percent = (e.loaded / e.total) * 100;
    setUploadProgress(percent);
  });

  // ... upload logic
};
```

### Retry Failed Saves
```typescript
const { saveNow, status, error } = useAutoSave({
  onSave: saveProject,
  onError: async (error) => {
    console.error('Save failed, retrying in 5s...', error);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await saveNow(); // Retry once
  },
});
```

### Offline Mode
```typescript
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
  window.addEventListener('online', () => setIsOnline(true));
  window.addEventListener('offline', () => setIsOnline(false));
}, []);

const { ... } = useAutoSave({
  enabled: isOnline && !!session,
  onSave: saveProject,
});
```

---

## Summary

**Instance 4 provides:**
- ✅ `/src/hooks/useAutoSave.ts` - Auto-save hook
- ✅ `/src/components/SaveStatusIndicator.tsx` - Save status UI
- ✅ `/lib/autosave/conflict-resolver.ts` - Conflict handling
- ✅ `/app/api/projects/*` - Project CRUD endpoints
- ✅ `/app/api/audio/*` - S3 upload/download/delete endpoints
- ✅ `/app/api/auth/*` - Authentication endpoints

**Instance 1 needs to do:**
1. Add `useAutoSave` hook to main DAW page
2. Add `SaveStatusIndicator` to header
3. Connect `markDirty` to track store changes
4. Upload recordings to S3 after recording stops
5. Fetch signed URLs when loading recordings for playback
6. Add project loading logic on page mount
7. Wrap app with `<SessionProvider>` (if not done yet)

**Estimated Time:** 2-3 hours for basic integration

---

**Questions?** Check:
- `AUTOSAVE_SETUP.md` - Detailed auto-save guide
- `S3_STORAGE_SETUP.md` - S3 setup and configuration
- `AUTHENTICATION_SETUP.md` - Auth integration guide
- `API.md` - Complete API reference

**Instance 4 Status:** All backend infrastructure complete! 🎉
