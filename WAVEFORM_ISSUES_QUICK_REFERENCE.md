# Live Waveform & Clip Rendering Issues - Quick Reference

## The Core Problem In One Picture

```
RECORDING START
    ↓
Create Analyser + mediaRecorder
    ↓
updateTrack({
  isRecording: true,
  liveWaveformData: new Float32Array() ← EMPTY
})
    ↓
❌ MISSING: updateLiveWaveform() call ← THIS IS THE BUG
    ↓
liveWaveformData never gets populated
    ↓
LiveRecordingWaveform component condition fails (Line 312 Track.tsx)
    ↓
NO VISUALIZATION DURING RECORDING
```

---

## Critical Missing Code

### Hook: useMultiTrackRecording.ts (Line 142)
```typescript
// Current (BROKEN):
updateTrack(track.id, {
  isRecording: true,
  liveRecordingStartTime: currentTime,
  liveRecordingDuration: 0,
  liveWaveformData: new Float32Array(analyser.frequencyBinCount),
});
// ❌ Missing: updateLiveWaveform(track.id, analyser);

// Should be (FIXED):
updateTrack(track.id, {
  isRecording: true,
  liveRecordingStartTime: currentTime,
  liveRecordingDuration: 0,
  liveWaveformData: new Float32Array(analyser.frequencyBinCount),
});
// ✓ Add this line:
updateLiveWaveform(track.id, analyser);  // START THE ANIMATION LOOP
```

---

## File Locations & Issues

| File | Line(s) | Issue | Fix |
|------|---------|-------|-----|
| useMultiTrackRecording.ts | 134-149 | `updateLiveWaveform()` not called | Call it after setting `isRecording: true` |
| useMultiTrackRecordingEnhanced.ts | 333-339 | Same - never calls `updateLiveWaveform()` | Add the call |
| Track.tsx | 312-321 | LiveRecordingWaveform condition requires populated data | Data will populate when hook is fixed |
| Track.tsx | 327-424 | LiveRecordingWaveform component renders correctly | Component is fine, just needs data |
| AudioClip.tsx | 30-94 | Requires `clip.waveformData` to render | Clips created after recording; during recording use LiveRecordingWaveform |
| AudioClip.tsx | 194 | Solid color styling ✓ | This part works correctly |
| timelineStore.ts | 50-54 | Track fields defined but never updated | Hooks need to call updateLiveWaveform() |

---

## Animation Loop That Should Run

```typescript
// This function exists but is NEVER CALLED:
const updateLiveWaveform = useCallback((trackId: string, analyser: AnalyserNode) => {
  const update = () => {
    // 1. Get current audio data from analyser
    const dataArray = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatTimeDomainData(dataArray);

    // 2. Downsample to 1000 points (for performance)
    const downsampled = new Float32Array(1000);
    const step = dataArray.length / 1000;
    for (let i = 0; i < 1000; i++) {
      downsampled[i] = Math.abs(dataArray[Math.floor(i * step)]);
    }

    // 3. Update track with live waveform data
    updateTrack(trackId, {
      liveWaveformData: downsampled,
      liveRecordingDuration: currentTime - recordingStart,
    });

    // 4. Continue loop while recording
    if (mediaRecordersRef.current.has(trackId)) {
      requestAnimationFrame(update);
    }
  };
  
  update();  // Start loop
}, []);
```

**Status:** Defined at Line 257-287 ✓ but never invoked ❌

---

## Component Hierarchy During Recording

### What SHOULD Happen:
```
Track Component
├── Track Header (shows "REC" indicator)
└── Clip Lane
    ├── LiveRecordingWaveform ← VISIBLE (but currently always hidden)
    │   ├── Solid color background (track.color + 'CC')
    │   ├── Canvas with live waveform
    │   ├── Glow effect
    │   └── REC badge + duration timer
    └── Other clips (non-recording)
```

### What ACTUALLY Happens:
```
Track Component
├── Track Header (shows "REC" indicator)
└── Clip Lane
    ├── LiveRecordingWaveform ← HIDDEN (waveformData is empty)
    └── Other clips
```

**Why Hidden?** 
Condition on Line 312 (Track.tsx):
```typescript
{track.isRecording && track.liveWaveformData && track.liveRecordingStartTime !== undefined && (
                                      ↑
                                  Always empty until fix applied
```

---

## Visualization Pipeline Breakdown

### Current (Broken) Pipeline:
```
MediaStream (getUserMedia)
    ↓
AnalyserNode (analyser)
    ↓
Track state (liveWaveformData: empty)
    ↓
[NO UPDATE LOOP]
    ↓
Component never updates
    ↓
NO VISUALIZATION
```

### Required (Fixed) Pipeline:
```
MediaStream (getUserMedia)
    ↓
AnalyserNode (analyser)
    ↓
updateLiveWaveform() loop [MUST BE CALLED]
    ↓
requestAnimationFrame
    ↓
analyser.getFloatTimeDomainData()
    ↓
Track state update (liveWaveformData: populated)
    ↓
Zustand triggers re-render
    ↓
LiveRecordingWaveform renders
    ↓
Canvas draws waveform
    ↓
Loop repeats (30-60fps)
```

---

## Data Flow - Track.liveWaveformData

### Initialization (Line 134-139, useMultiTrackRecording.ts):
```
liveWaveformData: new Float32Array(analyser.frequencyBinCount)
                  ↑
                  EMPTY ARRAY (length = analyser.frequencyBinCount)
```

### Update Loop (Should happen but doesn't):
```
analyser.getFloatTimeDomainData(dataArray)  // Get live audio data
    ↓
Downsample to 1000 points
    ↓
updateTrack(trackId, { liveWaveformData: downsampled })
    ↓
Zustand store update → React re-render
    ↓
Track.tsx re-renders with new data
    ↓
LiveRecordingWaveform receives new waveformData prop
    ↓
Canvas re-draws with latest waveform
```

---

## Clip Styling - The Good News

**Solid Color Implementation (AudioClip.tsx Line 194):**
```typescript
backgroundColor: clip.color + 'CC'  // Works perfectly
// Examples:
// #3B82F6CC  - Blue with 80% opacity
// #8B5CF6CC  - Purple with 80% opacity
// #EC4899CC  - Pink with 80% opacity
```

✓ This is working correctly for completed clips.

❌ The issue is that during recording, clips aren't created. Instead, a temporary LiveRecordingWaveform appears (which does have this styling).

---

## Visual State During Recording (Expected vs Actual)

### EXPECTED - After Fix:
```
┌─ Track: Vocals ─────────────────────────────────┐
│ [M] [S] [R] [I] ← Track controls               │
│ ┌────────────────────────────────────────────┐  │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ SOLID BLUE COLOR   │  │
│ │ ▓ Live Waveform:  /\/\/\  /\  /\/\        │  │
│ │ ▓ [REC] 00:45.32              ← Duration │  │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ GROWS RIGHT    │  │
│ └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### ACTUAL - Current Bug:
```
┌─ Track: Vocals ─────────────────────────────────┐
│ [M] [S] [R] [I] ← Track controls               │
│ ┌────────────────────────────────────────────┐  │
│ │                                             │  │
│ │  [Empty - No visualization]                │  │
│ │                                             │  │
│ └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## The One-Line Fix (Conceptual)

### File: useMultiTrackRecording.ts
### Location: After line 141

```typescript
// Add this ONE line:
updateLiveWaveform(track.id, analyser);
```

**That's it.** This starts the animation loop that populates liveWaveformData.

---

## Performance Implications

### Current (No Update Loop):
- Memory: Minimal (no loop running)
- CPU: None (visualization disabled)
- Renders: No re-renders from waveform
- Visual Feedback: **NONE** ❌

### After Fix (With Update Loop):
- Memory: ~1KB per frame × number of recording tracks
- CPU: ~5-15% per track (requestAnimationFrame @ 60fps)
- Renders: One re-render per track per frame (potential bottleneck)
- Visual Feedback: **LIVE WAVEFORM** ✓

### Optimization Needed:
1. Debounce updates: Update every 50ms instead of every frame
2. Use context API: Separate waveform context to avoid full tree re-renders
3. Memoize component: React.memo(LiveRecordingWaveform)
4. Batch updates: Combine multiple track updates

---

## Testing Checklist

- [ ] Arm a track
- [ ] Press Record
- [ ] **Expected:** Blue waveform appears and grows in real-time
- [ ] **Current:** Empty clip lane (BROKEN)
- [ ] Speak/sing into microphone
- [ ] **Expected:** Waveform responds to audio input
- [ ] Stop recording
- [ ] **Expected:** Clip saved with waveform data

---

## References

- **Main Report:** WAVEFORM_ANALYSIS_REPORT.md
- **Hook Code:** /src/hooks/useMultiTrackRecording.ts
- **Track Component:** /src/ui/components/Track.tsx
- **Clip Component:** /src/ui/components/AudioClip.tsx
- **Store:** /src/stores/timelineStore.ts
