# Implementation Fixes Guide - Live Waveform Recording

## Overview
This guide provides step-by-step instructions to fix the live waveform recording preview and clip rendering issues.

---

## Root Causes Identified

1. **Missing Animation Loop Call** - The `updateLiveWaveform()` function exists but is never invoked
2. **Empty Waveform Data** - Live waveform stays empty because animation loop never starts
3. **Component Never Renders** - LiveRecordingWaveform condition fails due to empty data
4. **No Recording Feedback** - Users see no visual indication during recording

---

## Fix #1: Enable Live Waveform Updates in useMultiTrackRecording

### Location
File: `/src/hooks/useMultiTrackRecording.ts`
Lines: 134-149

### Current Code (BROKEN)
```typescript
// Update track to show it's recording
updateTrack(track.id, {
  isRecording: true,
  liveRecordingStartTime: currentTime,
  liveRecordingDuration: 0,
  liveWaveformData: new Float32Array(analyser.frequencyBinCount),
});

// Start waveform animation for this track
// ❌ THIS LINE IS MISSING:
// updateLiveWaveform(track.id, analyser);
```

### Fixed Code
```typescript
// Update track to show it's recording
updateTrack(track.id, {
  isRecording: true,
  liveRecordingStartTime: currentTime,
  liveRecordingDuration: 0,
  liveWaveformData: new Float32Array(analyser.frequencyBinCount),
});

// Start waveform animation for this track
// ✓ ADD THIS LINE:
updateLiveWaveform(track.id, analyser);

console.log(`[MultiTrackRecording] Started recording on track: ${track.name}`);
```

### Exact Change
After line 141, add:
```typescript
updateLiveWaveform(track.id, analyser);
```

---

## Fix #2: Enable Live Waveform Updates in useMultiTrackRecordingEnhanced

### Location
File: `/src/hooks/useMultiTrackRecordingEnhanced.ts`
Lines: 333-340

### Current Code (BROKEN)
```typescript
// Update track state
updateTrack(track.id, {
  isRecording: true,
  liveRecordingStartTime: currentTime,
  liveRecordingDuration: 0,
  liveWaveformData: new Float32Array(analyser.frequencyBinCount),
});

// ❌ MISSING: updateLiveWaveform() call
console.log(`[MultiTrackRecordingEnhanced] Started recording on track: ${track.name}`);
```

### Fixed Code
```typescript
// Update track state
updateTrack(track.id, {
  isRecording: true,
  liveRecordingStartTime: currentTime,
  liveRecordingDuration: 0,
  liveWaveformData: new Float32Array(analyser.frequencyBinCount),
});

// ✓ ADD THIS LINE:
updateLiveWaveform(track.id, analyser);

console.log(`[MultiTrackRecordingEnhanced] Started recording on track: ${track.name}`);
```

### Exact Change
After line 338, add:
```typescript
updateLiveWaveform(track.id, analyser);
```

### Important Note
The enhanced hook needs a complete `updateLiveWaveform` function. Look for it around line 257 in the original hook and adapt it for the enhanced version. The function should:
1. Extract audio data from the analyser
2. Downsample to 1000 points
3. Update the track state
4. Continue the animation loop

---

## Fix #3: Add Recording State Visual Feedback (Optional Enhancement)

### Location
File: `/src/ui/components/Track.tsx` or `/src/ui/components/AudioClip.tsx`

### Enhancement: Recording Indicator Badge

Add a visual indicator for recording clips:

```typescript
{track.isRecording && track.liveRecordingStartTime !== undefined && (
  <div className="absolute top-2 left-2 z-20 px-3 py-1 rounded-lg bg-red-500/90 backdrop-blur-sm flex items-center gap-2">
    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
    <span className="text-xs font-bold text-white uppercase">REC</span>
  </div>
)}
```

### Enhancement: Recording Duration Timer

Add duration display:

```typescript
{track.isRecording && track.liveRecordingDuration !== undefined && (
  <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
    <span className="text-xs font-mono text-white font-semibold">
      {formatTime(track.liveRecordingDuration)}
    </span>
  </div>
)}
```

### Helper Function
```typescript
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};
```

---

## Fix #4: Performance Optimization (Recommended)

### Problem
Updating Zustand store every frame can cause excessive re-renders.

### Location
File: `/src/hooks/useMultiTrackRecording.ts`
Function: `updateLiveWaveform` (lines 257-287)

### Current Implementation (May Cause Performance Issues)
```typescript
const updateLiveWaveform = useCallback((trackId: string, analyser: AnalyserNode) => {
  const update = () => {
    // ... update every frame
    requestAnimationFrame(() => updateLiveWaveform(trackId, analyser));
  };
  update();
}, []);
```

### Optimized Implementation (Debounced)
```typescript
const updateLiveWaveform = useCallback((trackId: string, analyser: AnalyserNode) => {
  let lastUpdate = 0;
  const UPDATE_INTERVAL = 50; // Update every 50ms instead of every frame
  
  const update = () => {
    const now = Date.now();
    if (now - lastUpdate >= UPDATE_INTERVAL) {
      const dataArray = new Float32Array(analyser.frequencyBinCount);
      analyser.getFloatTimeDomainData(dataArray);

      // Downsample to 1000 points
      const downsampled = new Float32Array(1000);
      const step = dataArray.length / 1000;
      for (let i = 0; i < 1000; i++) {
        const index = Math.floor(i * step);
        downsampled[i] = Math.abs(dataArray[index]);
      }

      const track = tracks.find(t => t.id === trackId);
      if (track && track.isRecording) {
        const duration = currentTime - (track.liveRecordingStartTime || currentTime);
        updateTrack(trackId, {
          liveWaveformData: downsampled,
          liveRecordingDuration: duration,
        });
      }
      
      lastUpdate = now;
    }

    // Continue animation if still recording
    if (mediaRecordersRef.current.has(trackId)) {
      const frameId = requestAnimationFrame(update);
      animationFramesRef.current.set(trackId, frameId);
    }
  };

  update();
}, [tracks, currentTime, updateTrack]);
```

### Benefits
- Reduces re-renders from 60/sec to ~20/sec
- Maintains smooth visual experience
- Reduces CPU usage
- Maintains proper waveform visualization

---

## Fix #5: Add Memoization (Advanced Optimization)

### Location
File: `/src/ui/components/Track.tsx`

### Memoize LiveRecordingWaveform Component
```typescript
const LiveRecordingWaveform = React.memo(({
  waveformData,
  startTime,
  duration,
  zoom,
  trackHeight,
  color,
}: LiveRecordingWaveformProps) => {
  // ... component code unchanged
}, (prev, next) => {
  // Custom comparison for optimization
  return (
    prev.waveformData === next.waveformData &&
    prev.startTime === next.startTime &&
    prev.duration === next.duration &&
    prev.zoom === next.zoom &&
    prev.trackHeight === next.trackHeight &&
    prev.color === next.color
  );
});
```

### Benefits
- Prevents unnecessary re-renders when props haven't changed
- Further reduces CPU usage
- Only re-renders when actual data changes

---

## Testing After Implementation

### Test 1: Basic Recording Visualization
```
1. Add a new track
2. Arm the track (toggle R button)
3. Press Record
4. Expected: Blue/colored waveform appears in clip lane
5. Expected: Waveform grows as you record
6. Speak or make noise
7. Expected: Waveform responds to audio input
8. Stop recording
9. Expected: Clip saved with waveform visualization
```

### Test 2: Multi-Track Recording
```
1. Add 3 tracks
2. Arm 2 of them
3. Press Record
4. Expected: Both armed tracks show live waveform
5. Non-armed tracks should show any existing clips
6. Stop recording
7. Expected: Both clips saved with proper waveform
```

### Test 3: Recording Duration Display
```
1. Arm a track
2. Press Record
3. Expected: Duration timer appears (00:00.00)
4. Record for ~30 seconds
5. Expected: Timer increments correctly
6. Stop recording
```

### Test 4: Clip Color Accuracy
```
1. Create multiple tracks with different colors
2. Record on each
3. Expected: Each recorded waveform shows with correct track color
4. After recording, clips should maintain color
```

### Test 5: Performance Check
```
1. Record on 4+ tracks simultaneously
2. Monitor CPU usage (DevTools Performance tab)
3. Expected: CPU < 50% on modern machine
4. Waveform should remain smooth (no stuttering)
```

---

## Rollback Plan

If issues occur after implementation:

### Rollback Step 1: Remove Animation Loop Calls
Remove the `updateLiveWaveform()` calls added in Fix #1 and #2

### Rollback Step 2: Revert to Previous Branch
```bash
git checkout -- src/hooks/useMultiTrackRecording.ts
git checkout -- src/hooks/useMultiTrackRecordingEnhanced.ts
```

### Rollback Step 3: Clear Cache
```bash
npm run clean
npm run build
```

---

## Verification Checklist

- [ ] updateLiveWaveform() call added to useMultiTrackRecording.ts (line 142)
- [ ] updateLiveWaveform() call added to useMultiTrackRecordingEnhanced.ts (line 338+)
- [ ] Live waveform appears during recording
- [ ] Waveform color matches track color
- [ ] Waveform grows as recording continues
- [ ] Waveform responds to audio input
- [ ] Recording indicator badge visible
- [ ] Duration timer updates correctly
- [ ] Clips save after recording stops
- [ ] No console errors
- [ ] Performance acceptable (CPU < 50%)
- [ ] Works on mobile browsers (if applicable)

---

## Common Issues & Solutions

### Issue 1: Waveform still doesn't appear after adding updateLiveWaveform() call

**Solution:**
1. Check browser console for errors
2. Verify analyser is properly connected
3. Check that track.isRecording is true
4. Verify liveRecordingStartTime is set
5. Try refreshing the page (may need cache clear)

### Issue 2: High CPU usage / Stuttering

**Solution:**
1. Implement debouncing (Fix #4)
2. Reduce FFT size in analyser (from 2048 to 1024)
3. Increase UPDATE_INTERVAL from 50ms to 100ms
4. Memoize LiveRecordingWaveform component (Fix #5)

### Issue 3: Waveform data disappears when recording multiple tracks

**Solution:**
1. Check that each track has its own analyser node
2. Verify animation frames are tracked per-track
3. Ensure cleanup happens properly on recording stop
4. Check mediaRecordersRef has correct entries

### Issue 4: Component renders but waveform doesn't draw

**Solution:**
1. Check canvas dimensions are correct
2. Verify waveformData is not empty
3. Check that canvas.getContext('2d') succeeds
4. Verify line drawing code in LiveRecordingWaveform

---

## Code Review Checklist

Before merging these changes:

- [ ] Changes only in specified files
- [ ] No breaking changes to API
- [ ] No console.log statements left (except for debug)
- [ ] Types are correct (TypeScript compiles)
- [ ] No unused imports
- [ ] Follows existing code style
- [ ] Comments explain complex logic
- [ ] No memory leaks (cleanup on unmount)
- [ ] Animation frames cancelled on stop
- [ ] Streams disposed properly

---

## References

- Full Analysis: `WAVEFORM_ANALYSIS_REPORT.md`
- Quick Reference: `WAVEFORM_ISSUES_QUICK_REFERENCE.md`
- Track Component: `/src/ui/components/Track.tsx`
- Recording Hook: `/src/hooks/useMultiTrackRecording.ts`
- Enhanced Hook: `/src/hooks/useMultiTrackRecordingEnhanced.ts`
