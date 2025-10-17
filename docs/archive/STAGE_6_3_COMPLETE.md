# Stage 6.3 - Auto-save Mechanism ✅ COMPLETE

**Instance:** 4 (Data & Storage)
**Date:** 2025-10-02
**Status:** ✅ Complete

---

## Summary

Automatic project saving infrastructure is now complete for DAWG AI. Projects can be saved automatically every 30 seconds with debouncing, conflict detection, and visual feedback.

---

## What Was Built

### Auto-save Hook (`/src/hooks/useAutoSave.ts`)

React hook for automatic saving with:
- **Automatic saving** at configurable intervals (default: 30s)
- **Debouncing** - Waits 2s after last change before saving
- **Change detection** - Only saves when dirty (markDirty() called)
- **Manual save trigger** - `saveNow()` for immediate saves
- **Status tracking** - idle/saving/saved/error states
- **Error handling** - Callbacks for error management

**API:**
```typescript
const {
  status,        // 'idle' | 'saving' | 'saved' | 'error'
  lastSaved,     // Date | null
  error,         // Error | null
  saveCount,     // number
  saveNow,       // () => Promise<void>
  markDirty,     // () => void
  debouncedSave, // () => void
} = useAutoSave({
  enabled: true,
  interval: 30000,
  onSave: async () => { /* save logic */ },
  onError: (error) => { /* error handler */ },
  debounceDelay: 2000,
});
```

### Save Status Indicator (`/src/components/SaveStatusIndicator.tsx`)

Visual component showing save status:
- **Idle** - Gray save icon
- **Saving** - Blue spinning icon + "Saving..."
- **Saved** - Green checkmark + "Saved" (2s then back to idle)
- **Error** - Red X icon + "Save failed"
- **Relative time** - "Saved 2m ago", "Saved just now", etc.

**Usage:**
```typescript
<SaveStatusIndicator
  status={status}
  lastSaved={lastSaved}
  error={error}
/>
```

### Conflict Resolver (`/lib/autosave/conflict-resolver.ts`)

Conflict detection and resolution:
- **detectConflicts()** - Compare local vs server versions
- **resolveConflict()** - Multiple strategies (local/server/merge/manual)
- **autoResolveConflict()** - Heuristic-based resolution
- **checkSaveConflicts()** - Pre-save conflict check

**Strategies:**
1. **Local wins** - Keep local changes
2. **Server wins** - Discard local changes
3. **Merge** - Local data + server metadata
4. **Manual** - Show conflict dialog to user

---

## Features

### Auto-save Behavior

**Automatic Saving:**
- Saves every 30 seconds (configurable via `interval` prop)
- Only saves if changes exist (must call `markDirty()`)
- Skips save if already saving

**Debouncing:**
- Wait 2 seconds after last change before saving
- Prevents excessive saves during rapid edits
- Call `debouncedSave()` after each change

**Manual Save:**
- `saveNow()` triggers immediate save
- Clears any pending debounced saves
- Useful for "Save" buttons

### Status Tracking

**States:**
1. **idle** - No active save, no recent save
2. **saving** - Save in progress (shows spinner)
3. **saved** - Save succeeded (shows checkmark, 2s)
4. **error** - Save failed (shows error icon)

**Metadata:**
- `lastSaved` - Timestamp of last successful save
- `saveCount` - Total number of successful saves
- `error` - Last error object (null if no error)

### Conflict Resolution

**Detection:**
```typescript
const conflict = detectConflicts(localVersion, serverVersion);
// Returns: { localVersion, serverVersion, conflictFields: string[] }
```

**Auto-resolve:**
```typescript
const resolved = autoResolveConflict(conflict);
// Heuristics:
// - Metadata only → use server
// - Important fields (tracks/recordings) → merge
// - Default → use server
```

**Manual resolution:**
```typescript
if (conflict) {
  showConflictDialog({
    local: conflict.localVersion,
    server: conflict.serverVersion,
    onResolve: (choice) => {
      const resolved = resolveConflict(conflict, choice);
      await saveProject(resolved);
    }
  });
}
```

---

## Integration Guide (For Instance 1)

### 1. Basic Integration

```typescript
'use client'

import { useAutoSave } from '@/src/hooks/useAutoSave';
import { SaveStatusIndicator } from '@/src/components/SaveStatusIndicator';
import { useTrackStore } from '@/src/core/store';

export function DAWPage() {
  const tracks = useTrackStore((state) => state.tracks);
  const [projectId, setProjectId] = useState('proj123');

  const { status, lastSaved, error, saveNow, markDirty } = useAutoSave({
    enabled: true,
    interval: 30000,
    onSave: async () => {
      const response = await fetch('/api/projects/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: { id: projectId, name: 'My Project', bpm: 120 },
          tracks: /* serialize tracks */,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }
    },
    onError: (error) => {
      console.error('Auto-save failed:', error);
      // Show notification to user
    },
  });

  // Mark dirty when tracks change
  useEffect(() => {
    markDirty();
  }, [tracks, markDirty]);

  return (
    <div>
      <header>
        <SaveStatusIndicator
          status={status}
          lastSaved={lastSaved}
          error={error}
        />
        <button onClick={saveNow}>Save Now</button>
      </header>
      {/* Your DAW UI */}
    </div>
  );
}
```

### 2. Debounced Save on Change

```typescript
const { debouncedSave, markDirty } = useAutoSave({
  enabled: true,
  interval: 30000,
  debounceDelay: 2000, // Wait 2s after last change
  onSave: saveProject,
});

// Call on every change
const handleTrackChange = (trackId, updates) => {
  updateTrack(trackId, updates);
  markDirty();
  debouncedSave(); // Will save 2s after last call
};
```

### 3. With Conflict Detection

```typescript
import { checkSaveConflicts, autoResolveConflict } from '@/lib/autosave/conflict-resolver';

const { saveNow } = useAutoSave({
  onSave: async () => {
    // Check for conflicts before saving
    const conflict = await checkSaveConflicts(projectId, localUpdatedAt);

    if (conflict) {
      // Auto-resolve or show dialog
      const resolved = autoResolveConflict(conflict);
      await saveProject(resolved);
    } else {
      // No conflict
      await saveProject(currentState);
    }
  },
});
```

### 4. Conditional Auto-save

```typescript
const isRecording = useTrackStore((state) => state.isRecording);
const isPlaying = useTransport((state) => state.isPlaying);

const { ... } = useAutoSave({
  enabled: !isRecording && !isPlaying, // Disable during audio
  onSave: saveProject,
});
```

---

## Configuration Options

### Save Interval

```typescript
// Save every 60 seconds (less frequent)
useAutoSave({ interval: 60000, onSave });

// Save every 10 seconds (more frequent)
useAutoSave({ interval: 10000, onSave });
```

### Debounce Delay

```typescript
// Wait 5 seconds after last change
useAutoSave({ debounceDelay: 5000, onSave });

// Wait 500ms after last change
useAutoSave({ debounceDelay: 500, onSave });
```

### Enable/Disable

```typescript
const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

useAutoSave({
  enabled: autoSaveEnabled && isLoggedIn,
  onSave: saveProject,
});

// Toggle button
<button onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}>
  {autoSaveEnabled ? 'Disable' : 'Enable'} Auto-save
</button>
```

---

## Best Practices

### 1. Mark Dirty on All Changes

```typescript
const updateTrack = (trackId, updates) => {
  setTracks(/* update */);
  markDirty(); // Important!
};

const addRecording = (trackId, recording) => {
  /* add recording */
  markDirty();
};
```

### 2. Save Before Navigation

```typescript
useEffect(() => {
  const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      await saveNow();
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasUnsavedChanges, saveNow]);
```

### 3. Show User-Friendly Errors

```typescript
onError: (error) => {
  if (error.message.includes('Unauthorized')) {
    showNotification('Please log in to save changes');
  } else if (error.message.includes('Network')) {
    showNotification('Check your internet connection');
  } else {
    showNotification('Failed to save. Try again?');
  }
}
```

### 4. Disable During Audio Operations

Don't interrupt playback/recording with saves:

```typescript
const isRecording = useTrackStore((state) => state.isRecording);

const { ... } = useAutoSave({
  enabled: !isRecording, // Disable while recording
  onSave: saveProject,
});
```

---

## Conflict Scenarios

### Scenario 1: User Edits in Multiple Tabs

**Problem:** User has project open in 2 tabs, edits in both.

**Solution:**
```typescript
const conflict = await checkSaveConflicts(projectId, localUpdatedAt);

if (conflict) {
  // Show dialog: "Project was modified in another tab"
  showDialog({
    title: 'Conflict Detected',
    message: 'This project was modified in another tab. What would you like to do?',
    options: ['Use my changes', 'Reload from server'],
    onSelect: (choice) => {
      if (choice === 0) {
        await saveProject(localVersion);
      } else {
        reloadProject();
      }
    }
  });
}
```

### Scenario 2: Offline Edits

**Problem:** User makes changes while offline.

**Solution:**
```typescript
if (!navigator.onLine) {
  localStorage.setItem('unsaved-project', JSON.stringify(project));
  showNotification('Changes saved locally. Will sync when online.');
}

window.addEventListener('online', async () => {
  const unsaved = localStorage.getItem('unsaved-project');
  if (unsaved) {
    await saveProject(JSON.parse(unsaved));
    localStorage.removeItem('unsaved-project');
  }
});
```

---

## Troubleshooting

### Auto-save not triggering

**Check:**
1. `enabled` prop is `true`
2. `markDirty()` is called on changes
3. `onSave` function doesn't throw errors
4. User is authenticated (for protected endpoints)

### Save indicator stuck on "Saving..."

**Cause:** `onSave` promise never resolves

**Fix:**
```typescript
onSave: async () => {
  try {
    await saveToServer();
  } catch (error) {
    throw error; // Re-throw to update status
  }
}
```

### Conflicts on every save

**Cause:** `updatedAt` timestamp mismatch

**Fix:**
```typescript
// Ignore timestamp fields in conflict detection
const conflict = detectConflicts(local, server, [
  'updatedAt',
  'lastOpenedAt',
  'createdAt'
]);
```

---

## Next Steps

### For Instance 1 (Frontend - REQUIRED)

1. **Integrate `useAutoSave` hook** in main DAW component
2. **Add `SaveStatusIndicator`** to header/footer
3. **Connect to Zustand store** - mark dirty on all state changes
4. **Test auto-save flow** - verify saves after 30s
5. **Handle conflicts** - show dialog when detected
6. **Add manual save button** - calls `saveNow()`

### Optional Enhancements (Instance 4)

1. **Version history** - Store last N versions of each project
2. **Undo/redo** - Based on saved versions
3. **Backup system** - Daily backups of all projects
4. **Cleanup old versions** - Keep last 10 versions per project

---

## Files Created

**Created:**
- `/src/hooks/useAutoSave.ts` - Auto-save React hook
- `/src/components/SaveStatusIndicator.tsx` - Status indicator UI component
- `/lib/autosave/conflict-resolver.ts` - Conflict detection and resolution
- `AUTOSAVE_SETUP.md` - Complete integration guide
- `STAGE_6_3_COMPLETE.md` - This completion summary

---

## Instance 4 Progress Summary

**✅ ALL CORE INFRASTRUCTURE COMPLETE:**
- Stage 6.1 - Database & Prisma ORM
- Stage 6.2 - Authentication (NextAuth.js)
- Stage 6.3 - Auto-save Mechanism ✅ **JUST COMPLETED**
- Stage 6.4 - S3 Audio Storage
- Project CRUD API

**Instance 4 has completed all planned backend work for MVP!**

---

## Resources

- **Setup Guide:** `/AUTOSAVE_SETUP.md`
- **Hook API:** `/src/hooks/useAutoSave.ts`
- **Component:** `/src/components/SaveStatusIndicator.tsx`
- **Conflict Resolver:** `/lib/autosave/conflict-resolver.ts`

---

**🎉 Stage 6.3 Complete!**

Auto-save infrastructure is ready. Instance 1 can now integrate the `useAutoSave` hook for automatic project persistence with conflict detection.

**Instance 4 Status:** All core data/storage features complete! 🎊
- ✅ Database & Prisma
- ✅ Project CRUD API
- ✅ Authentication (NextAuth.js)
- ✅ S3 Audio Storage
- ✅ Auto-save Mechanism

**Last Updated:** 2025-10-02
