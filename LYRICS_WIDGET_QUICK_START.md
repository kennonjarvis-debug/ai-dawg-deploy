# LyricsWidget - Quick Start Guide

## 30-Second Setup

```tsx
import { LyricsWidget } from './ui/recording/LyricsWidget';

<LyricsWidget
  isVisible={true}
  lyrics={myLyricsArray}
  trackId="track-123"
  userId="user-456"
  websocketUrl="http://localhost:3000"
/>
```

That's it! The widget will appear with full AI capabilities.

---

## Visual Guide

### 1. Initial State
```
┌────────────────────────────────────────────┐
│ 🔵 Live Lyrics          Copy Export Edit   │ ← Header with controls
├────────────────────────────────────────────┤
│ [Pop ▼]  [Ask AI for Help]                 │ ← Genre + AI button
│ Est. cost: $0.0045 | Session: $0.0123     │ ← Cost tracking
├────────────────────────────────────────────┤
│ Waiting for lyrics...                      │ ← Lyrics area
├────────────────────────────────────────────┤
│ 0 segments | 0 words                       │ ← Stats footer
└────────────────────────────────────────────┘
```

### 2. With Lyrics (Before AI Analysis)
```
┌────────────────────────────────────────────┐
│ 🔵 Live Lyrics          Copy Export Edit   │
├────────────────────────────────────────────┤
│ [Pop ▼]  [Ask AI for Help]                 │
│ Est. cost: $0.0045 | Session: $0.0123     │
├────────────────────────────────────────────┤
│ In the morning light                       │ ← Plain lyrics
│ I see your face                            │
│ A gentle reminder                          │
│ Of a better place                          │
│                                            │
│ Take me higher                             │
│ Where the angels sing                      │
├────────────────────────────────────────────┤
│ 7 segments | 28 words                      │
└────────────────────────────────────────────┘
```

### 3. During AI Analysis
```
┌────────────────────────────────────────────┐
│ 🟠 Live Lyrics (AI Analyzing...)           │ ← Orange pulse
├────────────────────────────────────────────┤
│ [Pop ▼ disabled]  [Analyzing...]           │ ← Disabled controls
│ ⭕ AI is thinking... (Iteration 2/3) Step 2/3 │ ← Progress
├────────────────────────────────────────────┤
│ In the morning light                       │
│ I see your face                            │
│ ...                                        │
└────────────────────────────────────────────┘
```

### 4. After AI Analysis (With Section Labels)
```
┌────────────────────────────────────────────┐
│ 🔵 Live Lyrics          Copy Export Edit   │
├────────────────────────────────────────────┤
│ [Pop ▼]  [Ask AI for Help]  [3]            │ ← Recommendations badge
│ Est. cost: $0.0045 | Last: $0.0045 | Session: $0.0168 │
├────────────────────────────────────────────┤
│ ┌─────────┐                                │
│ │VERSE 1✓│  ← Clickable, blue, high confidence
│ └─────────┘                                │
│ │ In the morning light                     │ ← Blue left border
│ │ I see your face                          │
│ │ A gentle reminder                        │
│ │ Of a better place                        │
│                                            │
│ ┌─────────┐                                │
│ │CHORUS ✓│  ← Clickable, green, high confidence
│ └─────────┘                                │
│ │ Take me higher                           │ ← Green left border
│ │ Where the angels sing                    │
├────────────────────────────────────────────┤
│ 7 segments | 28 words | 2 sections         │ ← Section count
└────────────────────────────────────────────┘
```

### 5. With Recommendations Panel Open
```
┌──────────────────────────┬──────────────────────────┐
│ 🔵 Live Lyrics     [3]🔴 │                          │
├──────────────────────────┤ AI Recommendations Close │
│ [Pop ▼] [Ask AI] [3]     │──────────────────────────┤
│                          │ 💡 SUGGESTION            │
│ ┌─────────┐              │ Consider adding a bridge │
│ │VERSE 1✓│              │                          │
│ └─────────┘              │ Reasoning: Typical pop   │
│ │ In the morning light   │ songs benefit from...    │
│ │ I see your face        │                          │
│                          │ Confidence: 85%          │
│ ┌─────────┐              │ [Accept] [Dismiss]       │
│ │CHORUS ✓│              │──────────────────────────┤
│ └─────────┘              │ ⚠️ WARNING               │
│ │ Take me higher         │ Chorus repeats only 1x   │
│ │ Where the angels sing  │                          │
│                          │ Reasoning: Most pop...   │
│                          │ Confidence: 92%          │
│                          │ [Accept] [Dismiss]       │
└──────────────────────────┴──────────────────────────┘
     400px → 700px width (smooth transition)
```

---

## Workflow

### Step-by-Step User Flow

1. **Widget Appears**
   - User sees "Waiting for lyrics..."
   - Genre selector shows "Pop" (or last selected)

2. **Lyrics Stream In**
   - Each line appears in real-time
   - Auto-scrolls to latest line
   - Word/segment counts update

3. **User Selects Genre**
   - Clicks dropdown
   - Chooses "Country" (example)
   - Selection saved to localStorage

4. **User Clicks "Ask AI for Help"**
   - Button changes to "Analyzing..."
   - Orange pulsing dot appears
   - Status shows: "AI is thinking... (Iteration 1/3)"

5. **AI Iterates**
   - Iteration 1/3 → 800ms
   - Iteration 2/3 → 800ms
   - Iteration 3/3 → 800ms
   - "Comparing results..." → 600ms

6. **API Call Completes**
   - Backend analyzes lyrics
   - Returns structure + recommendations
   - Emits WebSocket events

7. **Section Labels Appear**
   - "VERSE 1 ✓" slides in from top (blue)
   - "CHORUS ✓" slides in from top (green)
   - "BRIDGE ?" slides in from top (pink, low confidence)
   - Each label is clickable

8. **Recommendations Badge Lights Up**
   - Badge shows "3" with red dot
   - User clicks badge
   - Panel slides in from right (300ms transition)

9. **User Interacts with Recommendations**
   - Reads first recommendation
   - Clicks "Accept" → turns green
   - Reads second recommendation
   - Clicks "Dismiss" → disappears
   - Leaves third recommendation pending

10. **User Clicks Section Label**
    - Clicks "CHORUS ✓"
    - Scrolls smoothly to chorus section
    - Highlights that section temporarily

11. **User Edits Lyrics**
    - Clicks "Edit" button
    - Textarea appears with full lyrics
    - Makes changes
    - Clicks "Save"
    - Debounced WebSocket update sent (1 second)

12. **User Views Cost**
    - Sees "Last: $0.0045" (previous analysis)
    - Sees "Session: $0.0168" (total for session)
    - Hovers for more details

---

## Color Legend

### Section Colors
- 🟣 **Intro** - Purple `#8b5cf6`
- 🔵 **Verse** - Blue `#3b82f6`
- 🟠 **Pre-Chorus** - Orange `#f59e0b`
- 🟢 **Chorus** - Green `#10b981`
- 🌸 **Bridge** - Pink `#ec4899`
- 🔷 **Outro** - Indigo `#6366f1`
- 🔶 **Hook** - Teal `#14b8a6`
- ⚪ **Unknown** - Gray `#6b7280`

### Status Indicators
- 🔵 **Normal** - Blue pulse (ready)
- 🟠 **Analyzing** - Orange pulse (working)
- 🟢 **Success** - Green (completed)
- 🔴 **Error** - Red (failed)

### Confidence Markers
- ✓ **High** (≥90%) - Checkmark
- ❓ **Low** (<70%) - Question mark
- (none) **Medium** (70-89%) - No marker

---

## Props Cheat Sheet

### Required Props
```tsx
isVisible: boolean          // true to show widget
lyrics: LyricsSegment[]     // array of { text, timestamp, start?, end? }
```

### Recommended Props
```tsx
trackId: string            // unique track ID for WebSocket
projectId: string          // project ID for collaboration
userId: string             // user ID for analytics
websocketUrl: string       // "http://localhost:3000"
```

### Optional Props
```tsx
position: string           // "bottom-right" (default)
onLyricsEdit: Function     // callback(editedText: string)
autoScroll: boolean        // true (default)
showTimestamps: boolean    // false (default)
allowEdit: boolean         // true (default)
currentTime: number        // playback position in seconds
```

---

## Common Tasks

### Change Widget Position
```tsx
<LyricsWidget position="top-left" ... />
// Options: top-left, top-right, bottom-left, bottom-right, center
```

### Handle Lyrics Edits
```tsx
<LyricsWidget
  onLyricsEdit={(editedText) => {
    console.log('New lyrics:', editedText);
    updateLyricsInDatabase(editedText);
  }}
/>
```

### Show Timestamps
```tsx
<LyricsWidget showTimestamps={true} ... />
// Shows "0:32" next to each line
```

### Disable Edit Mode
```tsx
<LyricsWidget allowEdit={false} ... />
// Hides Edit button
```

### Highlight Current Line
```tsx
const [currentTime, setCurrentTime] = useState(0);

// Update during playback
useEffect(() => {
  const interval = setInterval(() => {
    setCurrentTime(audioElement.currentTime);
  }, 100);
  return () => clearInterval(interval);
}, []);

<LyricsWidget currentTime={currentTime} ... />
```

---

## Keyboard Shortcuts (Planned)

*These are planned for future implementation:*

- `Ctrl/Cmd + E` - Enter edit mode
- `Ctrl/Cmd + S` - Save edits
- `Escape` - Cancel edit mode
- `Ctrl/Cmd + K` - Trigger AI analysis
- `Ctrl/Cmd + R` - Toggle recommendations

---

## API Endpoints

### Analyze Lyrics
```bash
POST http://localhost:3000/api/lyrics/analyze
Content-Type: application/json

{
  "lyrics": "In the morning light\nI see your face",
  "genre": "pop",
  "trackId": "track-123",
  "projectId": "project-456"
}
```

### Estimate Cost
```bash
GET http://localhost:3000/api/lyrics/cost-estimate?lyricsLength=500&includeGenreAdvice=true
```

---

## WebSocket Events

### Subscribe to Events
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { userId: 'user-123' }
});

socket.on('lyrics:analyzed', (data) => {
  console.log('Analysis:', data.analysis);
});

socket.on('lyrics:section-labels-updated', (data) => {
  console.log('Labels:', data.sectionLabels);
});

socket.on('lyrics:recommendations', (data) => {
  console.log('Recommendations:', data.recommendations);
});
```

---

## Troubleshooting

### Widget not appearing?
✅ Check `isVisible={true}`
✅ Verify lyrics array has content
✅ Check z-index (widget uses 1000)

### AI not working?
✅ Backend running on port 3000?
✅ `OPENAI_API_KEY` set in .env?
✅ Check browser console for errors

### No section labels?
✅ AI analysis completed successfully?
✅ WebSocket connected?
✅ `trackId` matches between requests?

### Cost shows $0?
✅ Lyrics have content?
✅ Backend cost endpoint working?
✅ Check network tab for failed requests

---

## Performance Tips

1. **Debounce lyrics updates** (already implemented)
2. **Reuse WebSocket connection** across components
3. **Memoize large lyric arrays** with `useMemo`
4. **Lazy load recommendations panel** (already implemented)
5. **Throttle scroll events** if performance issues

---

## Example Complete Component

```tsx
import React, { useState, useEffect } from 'react';
import { LyricsWidget, LyricsSegment } from './ui/recording/LyricsWidget';

export function MyRecordingView() {
  const [lyrics, setLyrics] = useState<LyricsSegment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Simulate real-time lyrics
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setLyrics(prev => [...prev, {
          text: `Line ${prev.length + 1}`,
          timestamp: Date.now(),
          start: prev.length * 2,
          end: (prev.length + 1) * 2,
        }]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <button onClick={() => setIsRecording(!isRecording)}>
        {isRecording ? 'Stop' : 'Start'} Recording
      </button>

      <LyricsWidget
        isVisible={true}
        position="bottom-right"
        lyrics={lyrics}
        currentTime={currentTime}
        trackId="my-track-123"
        projectId="my-project-456"
        userId="user-789"
        websocketUrl="http://localhost:3000"
        onLyricsEdit={(edited) => {
          console.log('Lyrics edited:', edited);
        }}
      />
    </div>
  );
}
```

---

## Next Steps

1. **Start backend**: `npm run dev`
2. **Import widget**: Add to your component
3. **Pass lyrics**: Provide real-time lyrics array
4. **Test AI**: Click "Ask AI for Help"
5. **Explore features**: Try all buttons and interactions
6. **Read full docs**: See `LYRICS_WIDGET_AI_INTEGRATION.md`

---

## Support

- **Full Documentation**: `LYRICS_WIDGET_AI_INTEGRATION.md`
- **Summary**: `LYRICS_WIDGET_SUMMARY.md`
- **Example Code**: `src/ui/recording/LyricsWidget.example.tsx`
- **Component Source**: `src/ui/recording/LyricsWidget.tsx`

---

**Last Updated**: 2025-10-18
**Version**: 2.0.0
**Status**: Production Ready ✅
