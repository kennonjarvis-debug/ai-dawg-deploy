# Lyrics Analysis & Multi-Clip Analysis System

## Overview

This implementation provides comprehensive lyrics analysis and multi-clip analysis capabilities for the AI DAW. The system uses GPT-4o for intelligent text analysis and leverages the existing MetadataAnalyzer for audio processing.

## Features Implemented

### 1. Live Lyrics Analysis Service (`src/backend/services/lyrics-analysis-service.ts`)

**Capabilities:**
- Real-time lyrics structure analysis
- Automatic section detection (verse, chorus, bridge, pre-chorus, intro, outro)
- Repetition identification for chorus detection
- Sequential verse labeling (Verse 1, Verse 2, etc.)
- Genre-specific recommendations
- Cost-optimized GPT-4o text-only analysis

**Key Functions:**
- `analyzeLyrics()` - Main analysis function
- `estimateLyricsAnalysisCost()` - Pre-analysis cost estimation
- `quickLyricsValidation()` - Fast validation without AI

**Cost Structure:**
- Input tokens: ~500 (system) + lyrics length/4
- Output tokens: ~800 (structured JSON)
- Total: ~$0.004-0.006 per analysis
- Genre advice (optional): +$0.002

### 2. Multi-Clip Analysis System (`src/backend/services/multi-clip-analyzer.ts`)

**Capabilities:**
- Analyze up to 10 clips simultaneously
- Extract metadata (BPM, key, energy, vocal detection)
- Identify relationships (complementary keys, matching BPMs)
- Suggest optimal arrangement order
- Detect conflicts (tempo mismatches, key clashes)
- AI-powered arrangement recommendations

**Key Functions:**
- `analyzeMultipleClips()` - Main analysis function
- `estimateMultiClipAnalysisCost()` - Cost estimation
- `analyzeClipRelationships()` - Relationship detection
- `detectClipConflicts()` - Conflict identification

**Cost Structure:**
- Metadata extraction: FREE (local processing)
- Relationship analysis: FREE (local processing)
- Conflict detection: FREE (local processing)
- AI arrangement suggestions: ~$0.003-0.008 per request

### 3. WebSocket Events (Real-time Updates)

**Lyrics Events:**
- `lyrics:update` - Client → Server (lyrics text changed)
- `lyrics:analyzing` - Server → Client (analysis started)
- `lyrics:analyzed` - Server → Client (analysis complete)
- `lyrics:section-labels-updated` - Server → Client (section labels)
- `lyrics:recommendations` - Server → Client (recommendations ready)

**Multi-Clip Events:**
- `clips:analyze-request` - Client → Server (request analysis)
- `clips:analyzing` - Server → Client (analysis started)
- `clips:analyzed` - Server → Client (analysis complete)

### 4. API Endpoints

#### Lyrics Analysis Endpoints (`/api/lyrics`)

**POST /api/lyrics/analyze**
```json
{
  "lyrics": "string (song lyrics)",
  "genre": "pop | country | hip-hop | rock | rnb | indie | folk | other",
  "suggestedStructure": "optional structure hint",
  "trackId": "optional track ID for WebSocket events",
  "projectId": "optional project ID"
}
```

Response:
```json
{
  "success": true,
  "analysis": {
    "structure": {
      "sections": [
        {
          "lineStart": 0,
          "lineEnd": 4,
          "sectionType": "verse",
          "sectionNumber": 1,
          "confidence": 0.9,
          "reasoning": "..."
        }
      ],
      "repeatedSections": [...],
      "estimatedLength": 180,
      "structure": "Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus-Outro"
    },
    "recommendations": [
      {
        "type": "suggestion",
        "message": "...",
        "section": "chorus",
        "reasoning": "..."
      }
    ],
    "genreAdvice": {
      "genre": "pop",
      "suggestions": [...]
    },
    "cost": {
      "totalCost": 0.0045,
      "inputTokens": 1200,
      "outputTokens": 800,
      "breakdown": "..."
    }
  },
  "validation": {
    "warnings": []
  }
}
```

**GET /api/lyrics/cost-estimate**
```
Query: ?lyricsLength=1000&includeGenreAdvice=true
```

**POST /api/lyrics/validate**
```json
{
  "lyrics": "string"
}
```

#### Multi-Clip Analysis Endpoints (`/api/clips`)

**POST /api/clips/analyze-by-ids** (Recommended)
```json
{
  "clipIds": ["clip-1", "clip-2", "clip-3"],
  "suggestArrangement": true,
  "detectConflicts": true,
  "projectId": "optional"
}
```

Response:
```json
{
  "success": true,
  "analysis": {
    "clips": [
      {
        "clipId": "clip-1",
        "clipName": "Vocal Take 1",
        "bpm": 120,
        "key": "C",
        "energy": 0.7,
        "isVocal": true,
        "duration": 30
      }
    ],
    "relationships": [
      {
        "clipId1": "clip-1",
        "clipId2": "clip-2",
        "relationshipType": "complementary",
        "score": 0.85,
        "reasons": ["Matching BPM", "Complementary keys"]
      }
    ],
    "arrangementSuggestions": [
      {
        "order": ["clip-1", "clip-2", "clip-3"],
        "reasoning": "...",
        "sections": [
          {
            "name": "Intro",
            "clipIds": ["clip-1"],
            "startTime": 0,
            "duration": 8
          }
        ]
      }
    ],
    "conflicts": [
      {
        "clipIds": ["clip-2", "clip-3"],
        "conflictType": "tempo-mismatch",
        "severity": "high",
        "description": "...",
        "suggestion": "..."
      }
    ],
    "aiRecommendations": [...],
    "cost": {
      "totalCost": 0.006,
      "inputTokens": 1500,
      "outputTokens": 1000,
      "breakdown": "..."
    }
  }
}
```

**GET /api/clips/analysis-cost-estimate**
```
Query: ?clipCount=5&includeArrangement=true
```

**GET /api/clips/features**
- Returns information about supported features and formats

## Cost Breakdown

### Lyrics Analysis
| Feature | Cost | Notes |
|---------|------|-------|
| Structure analysis | $0.004-0.006 | Required |
| Genre advice | +$0.002 | Optional |
| Quick validation | FREE | No AI call |

**Example Costs:**
- 500-word song: ~$0.0045
- 1000-word song: ~$0.0055
- With genre advice: +$0.002

### Multi-Clip Analysis
| Feature | Cost | Notes |
|---------|------|-------|
| Metadata extraction | FREE | Local processing |
| Relationship analysis | FREE | Local processing |
| Conflict detection | FREE | Local processing |
| AI arrangement | $0.003-0.008 | Optional |

**Example Costs:**
- 3 clips (no AI): $0.00
- 5 clips + AI arrangement: ~$0.005
- 10 clips + AI arrangement: ~$0.008

## Integration Guide

### Backend Integration

1. **Import services:**
```typescript
import { analyzeLyrics, estimateLyricsAnalysisCost } from './services/lyrics-analysis-service';
import { analyzeMultipleClips, estimateMultiClipAnalysisCost } from './services/multi-clip-analyzer';
```

2. **Routes are already integrated in `server.ts`:**
```typescript
app.use('/api/lyrics', lyricsRoutes);
app.use('/api/clips', clipsRoutes);
```

3. **WebSocket events are available:**
```typescript
import {
  emitLyricsAnalyzed,
  emitClipsAnalyzed
} from '../api/websocket/server';
```

### Frontend Integration

1. **Subscribe to WebSocket events:**
```typescript
import { wsClient } from './api/websocket';

// Lyrics events
wsClient.on('lyrics:analyzed', (data) => {
  console.log('Lyrics analyzed:', data);
});

wsClient.on('lyrics:section-labels-updated', (data) => {
  console.log('Section labels:', data);
});

// Clips events
wsClient.on('clips:analyzed', (data) => {
  console.log('Clips analyzed:', data);
});
```

2. **Make API calls:**
```typescript
// Analyze lyrics
const response = await fetch('/api/lyrics/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lyrics: userLyrics,
    genre: 'pop',
    trackId: currentTrackId
  })
});
const result = await response.json();

// Analyze clips
const response = await fetch('/api/clips/analyze-by-ids', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clipIds: selectedClipIds,
    suggestArrangement: true,
    detectConflicts: true
  })
});
const result = await response.json();
```

3. **Cost estimation before analysis:**
```typescript
// Estimate lyrics cost
const estimate = await fetch(`/api/lyrics/cost-estimate?lyricsLength=${lyrics.length}&includeGenreAdvice=true`);
const cost = await estimate.json();

// Estimate clips cost
const estimate = await fetch(`/api/clips/analysis-cost-estimate?clipCount=5&includeArrangement=true`);
const cost = await estimate.json();
```

## Architecture Decisions

### Why GPT-4o for Lyrics?
- Cost-effective for text analysis ($2.50/$10 per 1M tokens)
- Excellent at pattern recognition and structure detection
- Can provide genre-specific recommendations
- Faster than custom ML models for this use case

### Why Local Processing for Clips?
- MetadataAnalyzer already provides BPM/key detection
- Relationship analysis is simple pattern matching
- Conflict detection is rule-based
- Only use GPT-4o for complex arrangement suggestions

### Cost Optimization Strategies
1. **Batch operations** - Analyze multiple clips together
2. **Cache results** - Store analysis results in database
3. **Progressive enhancement** - Free local analysis, optional AI suggestions
4. **Pre-validation** - Quick checks before expensive AI calls
5. **User budgets** - Integrated with existing cost monitoring

## Future Enhancements

### Lyrics Analysis
- [ ] Real-time streaming analysis (as user types)
- [ ] Rhyme scheme detection
- [ ] Syllable counting and rhythm analysis
- [ ] Multi-language support
- [ ] Sentiment analysis per section
- [ ] Collaboration suggestions (suggest lyric changes)

### Multi-Clip Analysis
- [ ] Automatic clip trimming based on analysis
- [ ] Transition effect suggestions
- [ ] Key change recommendations
- [ ] Tempo mapping for live recordings
- [ ] Audio similarity search (find similar clips)
- [ ] Style transfer suggestions

### Integration
- [ ] Auto-arrange timeline based on suggestions
- [ ] Visual section markers in lyrics editor
- [ ] Interactive conflict resolution UI
- [ ] A/B testing different arrangements
- [ ] Export analysis reports (PDF/JSON)

## Testing

### Manual Testing

1. **Lyrics Analysis:**
```bash
curl -X POST http://localhost:3001/api/lyrics/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "lyrics": "Verse 1 lyrics...\n\nChorus lyrics...\n\nVerse 2 lyrics...\n\nChorus lyrics...",
    "genre": "pop"
  }'
```

2. **Cost Estimate:**
```bash
curl http://localhost:3001/api/lyrics/cost-estimate?lyricsLength=1000&includeGenreAdvice=true
```

3. **Validation:**
```bash
curl -X POST http://localhost:3001/api/lyrics/validate \
  -H "Content-Type: application/json" \
  -d '{"lyrics": "test lyrics"}'
```

### WebSocket Testing

Use the browser console:
```javascript
wsClient.connect('your-auth-token');
wsClient.on('lyrics:analyzed', console.log);
```

## Error Handling

All endpoints include:
- Input validation
- Budget limit checks
- Detailed error messages
- Proper HTTP status codes
- Logging for debugging

## Performance Considerations

1. **Lyrics Analysis**: ~2-4 seconds per analysis
2. **Multi-Clip Analysis**:
   - Local processing: <1 second
   - With AI suggestions: ~3-5 seconds
3. **WebSocket latency**: <100ms for real-time updates
4. **Concurrent requests**: Handled by Express + Node.js event loop

## Security

- Budget limits prevent abuse
- Input validation on all endpoints
- Cost tracking for all operations
- User authentication (when enabled)
- Rate limiting recommended for production

## Production Checklist

- [ ] Enable authentication middleware
- [ ] Set up rate limiting
- [ ] Configure budget alerts
- [ ] Set up monitoring/logging
- [ ] Test with real audio files
- [ ] Implement audio storage integration
- [ ] Add caching layer for repeated analyses
- [ ] Set up error alerting
- [ ] Document API for external consumers
- [ ] Load testing for concurrent users

## Support

For questions or issues:
1. Check logs in `/Users/benkennon/Projects_Archive/dawg/ai-dawg-deploy/logs`
2. Review cost monitoring dashboard: `/api/cost-monitoring/summary`
3. Test endpoints individually using curl/Postman
4. Check WebSocket connection status in browser console

## Files Created/Modified

**New Files:**
- `src/backend/services/lyrics-analysis-service.ts`
- `src/backend/services/multi-clip-analyzer.ts`
- `src/backend/routes/lyrics-routes.ts`
- `src/backend/routes/clips-routes.ts`

**Modified Files:**
- `src/backend/server.ts` (added route imports and mounting)
- `src/api/websocket/server.ts` (added event handlers and emitters)
- `src/api/types.ts` (added new type definitions)

## License

Same as parent project.
