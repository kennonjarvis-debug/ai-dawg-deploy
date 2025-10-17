# DAWG AI - Auto-save Setup Guide

## Overview
DAWG AI implements automatic project saving with conflict detection, debouncing, and user feedback. Projects are saved every 30 seconds (configurable) with visual status indicators.

**Stage:** 6.3 - Auto-save ✅

---

## Features

### Auto-save Behavior
- ✅ **Automatic saving** every 30 seconds (configurable)
- ✅ **Debouncing** - Waits 2 seconds after user stops editing before saving
- ✅ **Change detection** - Only saves when changes exist
- ✅ **Visual feedback** - Status indicator shows saving state
- ✅ **Manual save** - Save button for immediate save
- ✅ **Error handling** - Retry logic and error display
- ✅ **Conflict resolution** - Handles concurrent edits

### Status Indicators
- **Idle** - No unsaved changes
- **Saving...** - Save in progress (spinning icon)
- **Saved** - Successfully saved (checkmark, green)
- **Save failed** - Error occurred (X icon, red)
- **Last saved** - Shows time since last save

---

## Frontend Integration

### 1. Basic Auto-save Hook

```typescript
'use client'

import { useAutoSave } from '@/src/hooks/useAutoSave';
import { SaveStatusIndicator } from '@/src/components/SaveStatusIndicator';
import { useTrackStore } from '@/src/core/store';

export function DAWPage() {
  const tracks = useTrackStore((state) => state.tracks);
  const [projectId, setProjectId] = useState<string>('proj123');

  const { status, lastSaved, error, saveNow, markDirty } = useAutoSave({
    enabled: true,
    interval: 30000, // 30 seconds
    onSave: async () => {
      // Save project to server
      await fetch('/api/projects/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: {
            id: projectId,
            name: 'My Project',
            bpm: 120,
          },
          tracks: tracks.map(/* serialize tracks */),
        }),
      });
    },
    onError: (error) => {
      console.error('Auto-save failed:', error);
      // Show error notification
    },
  });

  // Mark dirty when tracks change
  useEffect(() => {
    markDirty();
  }, [tracks, markDirty]);

  return (
    <div>
      {/* Status indicator in header */}
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

### 2. With Conflict Detection

```typescript
import { checkSaveConflicts, autoResolveConflict } from '@/lib/autosave/conflict-resolver';

const { status, saveNow } = useAutoSave({
  enabled: true,
  interval: 30000,
  onSave: async () => {
    // Check for conflicts before saving
    const conflict = await checkSaveConflicts(projectId, localUpdatedAt);

    if (conflict) {
      // Auto-resolve or prompt user
      const resolved = autoResolveConflict(conflict);
      // Save resolved version
      await saveProject(resolved);
    } else {
      // No conflict, save normally
      await saveProject(currentState);
    }
  },
});
```

### 3. Debounced Save on Change

```typescript
const { debouncedSave, markDirty } = useAutoSave({
  enabled: true,
  interval: 30000,
  debounceDelay: 2000, // Wait 2s after last change
  onSave: saveProject,
});

// Call on every change
const handleTrackChange = (trackId: string, updates: any) => {
  updateTrack(trackId, updates);
  markDirty();
  debouncedSave(); // Will save 2s after last call
};
```

---

## Hook API

### `useAutoSave(options)`

**Options:**
```typescript
interface AutoSaveOptions {
  enabled?: boolean;           // Enable/disable auto-save (default: true)
  interval?: number;            // Save interval in ms (default: 30000)
  onSave: () => Promise<void>;  // Save function (required)
  onError?: (error: Error) => void; // Error callback
  debounceDelay?: number;       // Debounce delay in ms (default: 2000)
}
```

**Returns:**
```typescript
{
  status: 'idle' | 'saving' | 'saved' | 'error'; // Current status
  lastSaved: Date | null;       // Last successful save time
  error: Error | null;          // Last error
  saveCount: number;            // Total saves
  saveNow: () => Promise<void>; // Manual save trigger
  markDirty: () => void;        // Mark changes
  debouncedSave: () => void;    // Debounced save
}
```

---

## Save Status Indicator

### Component Usage

```typescript
import { SaveStatusIndicator } from '@/src/components/SaveStatusIndicator';

<SaveStatusIndicator
  status={status}       // Auto-save status
  lastSaved={lastSaved} // Last save date
  error={error}         // Error object (optional)
  className="..."       // Custom CSS classes
/>
```

### Status States

| Status | Icon | Color | Description |
|--------|------|-------|-------------|
| `idle` | Save | Gray | No unsaved changes |
| `saving` | Spinner | Blue | Save in progress |
| `saved` | Checkmark | Green | Successfully saved |
| `error` | X | Red | Save failed |

### Relative Time Display
- "Saved just now" (< 10s)
- "Saved 30s ago" (< 60s)
- "Saved 5m ago" (< 60m)
- "Saved 2h ago" (< 24h)
- "Saved 12/25/2024" (> 24h)

---

## Conflict Resolution

### Detection

```typescript
import { detectConflicts } from '@/lib/autosave/conflict-resolver';

const conflict = detectConflicts(localVersion, serverVersion);

if (conflict) {
  console.log('Conflicting fields:', conflict.conflictFields);
  // Handle conflict
}
```

### Resolution Strategies

**1. Local Wins (default):**
```typescript
const resolved = resolveConflict(conflict, 'local');
// Keep local changes, discard server
```

**2. Server Wins:**
```typescript
const resolved = resolveConflict(conflict, 'server');
// Discard local changes, use server
```

**3. Auto-merge:**
```typescript
const resolved = resolveConflict(conflict, 'merge');
// Merge: local data + server metadata
```

**4. Manual Resolution:**
```typescript
const resolved = resolveConflict(conflict, 'manual');
// Show conflict dialog to user
```

### Auto-resolve Logic

```typescript
import { autoResolveConflict } from '@/lib/autosave/conflict-resolver';

const resolved = autoResolveConflict(conflict);
// Heuristics:
// - Metadata only → use server
// - Important fields (tracks, recordings) → merge
// - Default → use server
```

---

## Best Practices

### 1. Change Detection

Mark dirty on every state change:

```typescript
const updateTrack = (trackId: string, updates: any) => {
  setTracks((prev) => /* update tracks */);
  markDirty(); // Important!
};

const addRecording = (trackId: string, recording: any) => {
  /* add recording */
  markDirty();
};
```

### 2. Optimistic UI Updates

Show "Saving..." immediately, don't wait for server:

```typescript
const { status } = useAutoSave({
  onSave: async () => {
    // Status already shows "saving"
    await saveToServer();
    // Status updates to "saved"
  },
});
```

### 3. Error Handling

Show user-friendly error messages:

```typescript
const { error } = useAutoSave({
  onError: (error) => {
    if (error.message.includes('Unauthorized')) {
      showNotification('Please log in to save changes');
    } else if (error.message.includes('Network')) {
      showNotification('Check your internet connection');
    } else {
      showNotification('Failed to save. Try again?');
    }
  },
});
```

### 4. Save Before Navigation

Save before user leaves page:

```typescript
useEffect(() => {
  const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      await saveNow(); // Save before leaving
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasUnsavedChanges, saveNow]);
```

### 5. Disable During Playback/Recording

Don't interrupt audio operations:

```typescript
const isRecording = useTrackStore((state) => state.isRecording);
const isPlaying = useTransport((state) => state.isPlaying);

const { saveNow } = useAutoSave({
  enabled: !isRecording && !isPlaying, // Disable during audio
  onSave: saveProject,
});
```

---

## Configuration Options

### Adjust Save Interval

```typescript
// Save every 60 seconds (less frequent)
const { ... } = useAutoSave({ interval: 60000, ... });

// Save every 10 seconds (more frequent)
const { ... } = useAutoSave({ interval: 10000, ... });
```

### Adjust Debounce Delay

```typescript
// Wait 5 seconds after last change (more patient)
const { ... } = useAutoSave({ debounceDelay: 5000, ... });

// Wait 500ms after last change (more responsive)
const { ... } = useAutoSave({ debounceDelay: 500, ... });
```

### Conditional Auto-save

```typescript
const [isAutoSaveEnabled, setAutoSaveEnabled] = useState(true);

const { ... } = useAutoSave({
  enabled: isAutoSaveEnabled && isLoggedIn,
  onSave: saveProject,
});

// User can toggle
<button onClick={() => setAutoSaveEnabled(!isAutoSaveEnabled)}>
  {isAutoSaveEnabled ? 'Disable' : 'Enable'} Auto-save
</button>
```

---

## Conflict Scenarios

### Scenario 1: User Edits in Multiple Tabs

**Problem:** User has project open in 2 tabs, edits in both.

**Solution:**
```typescript
// Check for conflicts before save
const conflict = await checkSaveConflicts(projectId, localUpdatedAt);

if (conflict) {
  // Show dialog: "Project was modified in another tab. Use your changes or reload?"
  if (userChoseLocal) {
    await saveProject(localVersion);
  } else {
    reloadProject();
  }
}
```

### Scenario 2: Concurrent Collaboration (Future)

**Problem:** Multiple users editing same project.

**Solution:**
- Implement real-time sync (Stage 11 - Socket.io)
- Use operational transformation or CRDTs
- Show presence indicators

### Scenario 3: Offline Edits

**Problem:** User makes changes while offline.

**Solution:**
```typescript
// Store locally while offline
if (!navigator.onLine) {
  localStorage.setItem('unsaved-project', JSON.stringify(project));
  showNotification('Changes saved locally. Will sync when online.');
}

// Sync when back online
window.addEventListener('online', async () => {
  const unsaved = localStorage.getItem('unsaved-project');
  if (unsaved) {
    await saveProject(JSON.parse(unsaved));
    localStorage.removeItem('unsaved-project');
  }
});
```

---

## Testing

### Unit Tests (useAutoSave)

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '@/src/hooks/useAutoSave';

test('auto-saves at interval', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);

  const { result } = renderHook(() =>
    useAutoSave({ interval: 1000, onSave })
  );

  // Mark dirty
  act(() => {
    result.current.markDirty();
  });

  // Wait for interval
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1100));
  });

  expect(onSave).toHaveBeenCalledTimes(1);
});

test('debounces rapid changes', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);

  const { result } = renderHook(() =>
    useAutoSave({ debounceDelay: 500, onSave })
  );

  // Rapid changes
  act(() => {
    result.current.markDirty();
    result.current.debouncedSave();
  });

  act(() => {
    result.current.markDirty();
    result.current.debouncedSave();
  });

  // Should only save once after debounce
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
  });

  expect(onSave).toHaveBeenCalledTimes(1);
});
```

### Integration Tests

```bash
# Manual testing checklist
1. Make changes to track → See "Saving..." after 2s
2. Wait 30s → See "Saved" with checkmark
3. Disconnect internet → See "Save failed" with retry
4. Reconnect → See "Saved" when reconnected
5. Click "Save Now" → Immediate save
6. Open in 2 tabs, edit both → See conflict dialog
7. Leave page with unsaved changes → See "unsaved changes" warning
```

---

## Troubleshooting

### Auto-save not triggering

**Check:**
1. `enabled` is `true`
2. `markDirty()` is called on changes
3. `onSave` function is not throwing errors
4. User is authenticated (for protected endpoints)

### Conflicts on every save

**Cause:** `updatedAt` timestamp mismatch

**Fix:**
```typescript
// Ignore timestamp fields in conflict detection
const conflict = detectConflicts(local, server, ['updatedAt', 'lastOpenedAt']);
```

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

---

## Next Steps

### For Instance 1 (Frontend - REQUIRED)

1. **Integrate `useAutoSave` hook** in main DAW page
2. **Add `SaveStatusIndicator`** to header
3. **Connect to track store** - mark dirty on changes
4. **Test auto-save flow** with real data
5. **Handle conflicts** - show user dialog when needed
6. **Add manual save button** for immediate saves

### For Instance 4 (Backend - Optional Enhancements)

1. **Version history** - Store previous versions
2. **Undo/redo** - Based on saved versions
3. **Backup system** - Daily backups of all projects
4. **Cleanup old versions** - Keep last 10 versions per project

---

## Files Created

**Created:**
- `/src/hooks/useAutoSave.ts` - Auto-save React hook
- `/src/components/SaveStatusIndicator.tsx` - Status indicator component
- `/lib/autosave/conflict-resolver.ts` - Conflict detection and resolution
- `AUTOSAVE_SETUP.md` - This documentation

---

**Status:** ✅ Auto-save infrastructure complete
**Waiting on:** Instance 1 (frontend integration)
**Last Updated:** 2025-10-02
