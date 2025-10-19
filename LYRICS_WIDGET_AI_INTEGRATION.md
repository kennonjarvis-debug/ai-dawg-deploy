# LyricsWidget AI Integration - Complete Guide

## Overview

The enhanced LyricsWidget component now includes full AI-powered lyrics analysis with real-time WebSocket integration. The AI analyzes song structure, labels sections (verse, chorus, bridge, etc.), and provides intelligent recommendations.

## Features Implemented

### ✅ 1. WebSocket Integration
- **Socket.IO client** connected to backend WebSocket server
- Real-time bidirectional communication
- Events: `lyrics:update`, `lyrics:analyzed`, `lyrics:section-labels-updated`, `lyrics:recommendations`
- Automatic reconnection handling
- Project room joining for collaborative editing

### ✅ 2. AI Section Labels
- **Inline section labels** displayed above lyrics (VERSE 1, CHORUS, BRIDGE, etc.)
- **Color-coded sections**:
  - Intro: Purple (`#8b5cf6`)
  - Verse: Blue (`#3b82f6`)
  - Pre-Chorus: Orange (`#f59e0b`)
  - Chorus: Green (`#10b981`)
  - Bridge: Pink (`#ec4899`)
  - Outro: Indigo (`#6366f1`)
  - Hook: Teal (`#14b8a6`)
  - Unknown: Gray (`#6b7280`)
- **Clickable labels** to jump to specific sections
- **Confidence indicators**:
  - ✓ for high confidence (≥90%)
  - ? for low confidence (<70%)
- **Animated appearance** with smooth transitions

### ✅ 3. AI Recommendations Panel
- **Side panel** (280px) that slides in from the right
- **Three types of recommendations**:
  - 💡 **Suggestion**: Structural improvements
  - ⚠️ **Warning**: Potential issues
  - ℹ️ **Info**: General advice
- **Accept/Reject buttons** for each recommendation
- **Confidence scores** displayed per recommendation
- **Genre-specific advice** based on selected genre
- **Dismissible** recommendations
- **Staggered animations** for visual appeal

### ✅ 4. "AI Iterate Before Deciding" Feature
- **Multi-iteration analysis**:
  1. Iteration 1: Initial analysis
  2. Iteration 2: Alternative approach
  3. Iteration 3: Final refinement
- **Visual progress indicators**:
  - Spinning loader during analysis
  - "AI is thinking... (Iteration X/3)" status message
  - Step counter in top right
- **AI compares results** and picks best suggestions
- **Manual trigger**: "Ask AI for Help" button
- **Disabled during analysis** to prevent duplicate requests

### ✅ 5. Visual Feedback
- **Loading states**:
  - Pulsing orange dot during analysis
  - Spinning loader icon
  - Status messages with progress
- **Section highlighting**:
  - Subtle background color for each section type
  - Colored left border for active sections
  - Current playback line highlighted in blue
- **Smooth animations**:
  - `slideIn`: Section labels appear from top
  - `slideInRight`: Recommendations panel slides in
  - `fadeIn`: Individual recommendations fade in
  - `pulse-fast`: Analyzing indicator
- **Checkmarks** for high-confidence items (≥90%)

### ✅ 6. Preserved Existing Functionality
- ✅ All original features maintained
- ✅ Edit mode with save/cancel
- ✅ Export to .txt file
- ✅ Copy to clipboard
- ✅ Timestamps display (optional)
- ✅ Auto-scroll to latest lyric
- ✅ Current playback highlighting
- ✅ Word/segment counting
- ✅ Same UI style and positioning
- ✅ Backward compatible props

### ✅ 7. Genre Selector
- **Dropdown menu** with 8 genres:
  - Pop
  - Country
  - Hip-Hop
  - Rock
  - R&B
  - Indie
  - Folk
  - Other
- **Persists selection** in localStorage
- **Affects AI recommendations** (genre-specific advice)
- **Disabled during analysis** to prevent mid-analysis changes

### ✅ 8. Cost Display
- **Real-time cost estimation** fetched from backend
- **Shows before analysis**: "Est. cost: $0.0045"
- **Shows after analysis**: "Last: $0.0045"
- **Session total tracking**: Accumulates all analysis costs
- **API endpoint**: `/api/lyrics/cost-estimate`
- **Cost breakdown** available in response
- **Updates automatically** when lyrics change

---

## API Integration

### Backend Endpoints

#### 1. Analyze Lyrics
```typescript
POST /api/lyrics/analyze
{
  "lyrics": "string",
  "genre": "pop" | "country" | "hip-hop" | "rock" | "rnb" | "indie" | "folk" | "other",
  "trackId": "string",
  "projectId": "string"
}

Response:
{
  "success": true,
  "analysis": {
    "structure": {
      "sections": SectionLabel[],
      "repeatedSections": [...],
      "estimatedLength": number,
      "structure": "Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus-Outro"
    },
    "recommendations": Recommendation[],
    "genreAdvice": {
      "genre": "pop",
      "suggestions": string[]
    },
    "cost": {
      "totalCost": 0.0045,
      "inputTokens": 1200,
      "outputTokens": 800,
      "breakdown": "..."
    }
  }
}
```

#### 2. Cost Estimate
```typescript
GET /api/lyrics/cost-estimate?lyricsLength=500&includeGenreAdvice=true

Response:
{
  "success": true,
  "estimate": {
    "estimatedCost": 0.0045,
    "inputTokens": 1200,
    "outputTokens": 800,
    "breakdown": "1200 input tokens + 800 output tokens = $0.0045"
  }
}
```

### WebSocket Events

#### Client → Server

```typescript
// Update lyrics (debounced 1 second)
socket.emit('lyrics:update', {
  projectId: string,
  trackId: string,
  lyrics: string
});
```

#### Server → Client

```typescript
// Analysis complete
socket.on('lyrics:analyzed', (data) => {
  trackId: string,
  analysis: {
    structure: LyricsStructure,
    cost: CostData
  },
  timestamp: Date
});

// Section labels updated
socket.on('lyrics:section-labels-updated', (data) => {
  trackId: string,
  sectionLabels: SectionLabel[],
  timestamp: Date
});

// Recommendations ready
socket.on('lyrics:recommendations', (data) => {
  trackId: string,
  recommendations: Recommendation[],
  timestamp: Date
});
```

---

## Usage Examples

### Basic Usage

```typescript
import { LyricsWidget, LyricsSegment } from './ui/recording/LyricsWidget';

function MyComponent() {
  const [lyrics, setLyrics] = useState<LyricsSegment[]>([
    { text: "In the morning light", timestamp: 1000, start: 0, end: 2 },
    { text: "I see your face", timestamp: 2000, start: 2, end: 4 },
  ]);

  return (
    <LyricsWidget
      isVisible={true}
      position="bottom-right"
      lyrics={lyrics}
      trackId="my-track-123"
      projectId="my-project-456"
      userId="user-789"
      websocketUrl="http://localhost:3000"
    />
  );
}
```

### Advanced Usage with All Props

```typescript
<LyricsWidget
  isVisible={true}
  position="bottom-right"
  lyrics={lyricsSegments}
  onLyricsEdit={(editedText) => {
    console.log('User edited lyrics:', editedText);
    // Update your state/backend
  }}
  autoScroll={true}
  showTimestamps={true}
  allowEdit={true}
  currentTime={playbackPosition}
  trackId="track-abc-123"
  projectId="project-xyz-789"
  userId="user-john-doe"
  websocketUrl="http://localhost:3000"
/>
```

### Handling AI Events Manually

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { userId: 'user-123' }
});

socket.on('lyrics:analyzed', (data) => {
  console.log('Analysis complete:', data.analysis);
  console.log('Cost:', data.analysis.cost.totalCost);
});

socket.on('lyrics:section-labels-updated', (data) => {
  console.log('Section labels:', data.sectionLabels);
  // Update UI with section labels
});

socket.on('lyrics:recommendations', (data) => {
  console.log('Recommendations:', data.recommendations);
  // Show recommendations to user
});
```

---

## Component Props

```typescript
interface LyricsWidgetProps {
  // Core props
  isVisible: boolean;                    // Show/hide widget
  lyrics: LyricsSegment[];               // Array of lyric segments

  // Optional configuration
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  onLyricsEdit?: (editedLyrics: string) => void;
  autoScroll?: boolean;                  // Auto-scroll to latest lyric
  showTimestamps?: boolean;              // Show timestamps next to lyrics
  allowEdit?: boolean;                   // Enable edit mode
  currentTime?: number;                  // Current playback position (seconds)

  // AI integration props
  trackId?: string;                      // Unique track identifier
  projectId?: string;                    // Project identifier (for collaboration)
  userId?: string;                       // User identifier
  websocketUrl?: string;                 // WebSocket server URL (default: http://localhost:3000)
}

interface LyricsSegment {
  text: string;                          // The lyric text
  timestamp: number;                     // When it was transcribed (ms)
  start?: number;                        // Start time in audio (seconds)
  end?: number;                          // End time in audio (seconds)
  isEditable?: boolean;                  // Whether this segment can be edited
}

interface SectionLabel {
  lineStart: number;                     // Starting line index
  lineEnd: number;                       // Ending line index
  sectionType: 'intro' | 'verse' | 'pre-chorus' | 'chorus' | 'bridge' | 'outro' | 'hook' | 'unknown';
  sectionNumber?: number;                // e.g., 1 for "Verse 1"
  confidence: number;                    // 0-1 confidence score
  reasoning?: string;                    // Why AI chose this label
}

interface Recommendation {
  type: 'suggestion' | 'warning' | 'info';
  message: string;                       // Main recommendation message
  section?: string;                      // Related section (optional)
  reasoning: string;                     // Why AI made this recommendation
  confidence?: number;                   // 0-1 confidence score
  accepted?: boolean;                    // User acceptance state
}
```

---

## UI Behavior

### Normal State (400px width)
- Genre selector at top
- "Ask AI for Help" button
- Lyrics display with optional section labels
- Footer stats (segments, words, sections)

### Analyzing State
- Orange pulsing indicator in header
- "AI is thinking... (Iteration X/3)" message
- Spinning loader icon
- Progress counter: "Step X/3"
- Genre selector disabled
- Button shows "Analyzing..."

### With Recommendations (700px width)
- Widget expands to accommodate recommendations panel
- Recommendations panel slides in from right (280px)
- Badge on recommendations button shows count
- Red dot indicator for unread recommendations
- Smooth width transition (0.3s ease)

### Section Labels
- Appear above first line of each section
- Color-coded by section type
- Uppercase text with letter spacing
- Clickable to scroll to section
- Animated appearance (slideIn)
- Tooltip shows confidence and reasoning

### Recommendations Panel
- Scrollable if many recommendations
- Each recommendation card shows:
  - Icon (💡/⚠️/ℹ️)
  - Message (bold)
  - Reasoning (smaller text)
  - Confidence score (if available)
  - Accept/Dismiss buttons
- Staggered fade-in animation
- Color-coded by type
- Accepted state turns green

---

## Cost Monitoring

### How It Works

1. **Estimation**: When lyrics change, widget fetches cost estimate
2. **Display**: Shows "Est. cost: $X.XXXX" before analysis
3. **Tracking**: After analysis, shows "Last: $X.XXXX"
4. **Session Total**: Accumulates all analysis costs in current session
5. **Breakdown**: Backend provides token counts and cost calculation

### Cost Formula

```
Input cost: (inputTokens / 1M) × $2.50
Output cost: (outputTokens / 1M) × $10.00
Total cost: Input cost + Output cost

Typical analysis: ~$0.0045 - $0.0060
With genre advice: ~$0.0055 - $0.0075
```

### Cost Optimization

- Debounced lyrics updates (1 second delay)
- Single API call per analysis
- Estimated costs shown before API call
- Optional genre advice (adds cost)
- Token-efficient prompts

---

## Keyboard Shortcuts

*Note: These are planned for future implementation*

- `Ctrl/Cmd + E`: Enter edit mode
- `Ctrl/Cmd + S`: Save edits (when in edit mode)
- `Escape`: Cancel edit mode
- `Ctrl/Cmd + K`: Trigger AI analysis
- `Ctrl/Cmd + R`: Toggle recommendations panel

---

## Testing

### Manual Testing Steps

1. **Start Backend Server**
   ```bash
   cd ai-dawg-deploy
   npm run dev
   ```

2. **Open Example Page**
   - Create a test page that imports `LyricsWidget.example.tsx`
   - Or use Storybook if configured

3. **Test Scenarios**:
   - ✅ Lyrics streaming (segments appear one by one)
   - ✅ Genre selection (dropdown changes)
   - ✅ AI analysis trigger (button click)
   - ✅ Iteration visualization (3 steps)
   - ✅ Section labels appear
   - ✅ Recommendations panel opens
   - ✅ Accept/dismiss recommendations
   - ✅ Click section labels to scroll
   - ✅ Edit mode (edit, save, cancel)
   - ✅ Export/copy functionality
   - ✅ Cost display updates
   - ✅ WebSocket reconnection

### Integration Testing

```typescript
// Test WebSocket connection
const socket = io('http://localhost:3000');
socket.on('connect', () => console.log('Connected!'));

// Test lyrics analysis
fetch('http://localhost:3000/api/lyrics/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lyrics: "Test lyrics\nVerse 1\nChorus\n",
    genre: 'pop',
    trackId: 'test-track',
    projectId: 'test-project'
  })
})
.then(r => r.json())
.then(data => console.log('Analysis:', data));
```

---

## Troubleshooting

### WebSocket Not Connecting

**Symptoms**: Console shows "WebSocket disconnected"

**Solutions**:
1. Check backend server is running on port 3000
2. Verify `websocketUrl` prop is correct
3. Check CORS settings in backend
4. Look for firewall/proxy blocking WebSocket connections
5. Try changing `transports` order: `['polling', 'websocket']`

### AI Analysis Not Working

**Symptoms**: Clicking "Ask AI for Help" shows error

**Solutions**:
1. Check `OPENAI_API_KEY` is set in backend `.env`
2. Verify `/api/lyrics/analyze` endpoint is responding
3. Check browser console for error messages
4. Ensure lyrics have content (not empty)
5. Check backend logs for API errors

### Section Labels Not Appearing

**Symptoms**: Analysis completes but no labels shown

**Solutions**:
1. Check WebSocket event `lyrics:section-labels-updated` is received
2. Verify `trackId` matches between widget and backend response
3. Look for `sectionLabels` array in WebSocket data
4. Check browser console for parsing errors
5. Ensure backend is emitting correct event format

### Recommendations Panel Not Showing

**Symptoms**: Analysis completes but no recommendations

**Solutions**:
1. Check if recommendations array is empty (no suggestions for this song)
2. Verify WebSocket event `lyrics:recommendations` is received
3. Click the badge button (number) to toggle panel
4. Check `trackId` matching
5. Look for recommendations in browser console logs

### Cost Display Shows $0

**Symptoms**: Cost estimate or actual cost shows $0.0000

**Solutions**:
1. Check `/api/lyrics/cost-estimate` endpoint is accessible
2. Verify lyrics have content (cost is based on length)
3. Look for errors in cost estimation API call
4. Check backend cost calculation logic
5. Ensure `cost` object is in analysis response

---

## Performance Considerations

### Optimization Tips

1. **Debouncing**: Lyrics updates debounced to 1 second
2. **Memoization**: Consider using `React.memo` for large lyric lists
3. **Virtual Scrolling**: For 100+ lyric segments, implement virtual scrolling
4. **WebSocket Pooling**: Reuse socket connection across components
5. **Cost Caching**: Cache cost estimates for same lyric length

### Bundle Size

- Socket.IO client: ~80KB (gzipped: ~25KB)
- Component code: ~15KB (gzipped: ~5KB)
- Total addition: ~95KB (gzipped: ~30KB)

---

## Future Enhancements

### Planned Features

- [ ] **Offline mode**: Cache last analysis results
- [ ] **Undo/redo**: Track edit history
- [ ] **Multi-language support**: Analyze lyrics in different languages
- [ ] **Export with sections**: Export with section labels included
- [ ] **Collaborative editing**: See other users' cursors and edits
- [ ] **Voice commands**: Trigger AI analysis via voice
- [ ] **Section reordering**: Drag-and-drop to rearrange sections
- [ ] **AI suggestions for rhymes**: Suggest rhyming words
- [ ] **Sentiment analysis**: Detect mood/emotion in lyrics
- [ ] **Plagiarism check**: Check for similar existing songs

---

## Support

### Getting Help

- **Documentation**: This file and inline code comments
- **Example**: See `LyricsWidget.example.tsx`
- **Backend API**: See backend routes in `/src/backend/routes/lyrics-routes.ts`
- **WebSocket**: See server implementation in `/src/api/websocket/server.ts`

### Common Issues

| Issue | Solution |
|-------|----------|
| Widget not appearing | Check `isVisible={true}` |
| No lyrics showing | Verify `lyrics` array has content |
| AI not responding | Check backend server and API key |
| Cost always $0 | Verify cost-estimate endpoint |
| Recommendations missing | Check WebSocket events in console |
| Section colors wrong | Verify section type matches enum |

---

## Changelog

### Version 2.0.0 (Current)
- ✅ Added WebSocket integration
- ✅ Implemented AI section labeling
- ✅ Created recommendations panel
- ✅ Added iteration visualization
- ✅ Implemented genre selector
- ✅ Added cost tracking
- ✅ Preserved all original features

### Version 1.0.0 (Original)
- Basic lyrics display
- Edit mode
- Export/copy functionality
- Timestamp support
- Auto-scroll

---

## License

Part of the AI-DAWG project. See main project LICENSE file.

---

## Credits

**Enhanced by**: AI Integration Team
**Original Component**: Recording Team
**Backend Services**: Lyrics Analysis Service, WebSocket Server
**AI Model**: OpenAI GPT-4o

---

**Last Updated**: 2025-10-18
