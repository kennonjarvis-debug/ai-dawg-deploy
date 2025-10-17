# Music Generation Setup Guide

**Status:** ✅ Complete (Stage 7)
**Date:** 2025-10-02
**Instance:** 3 (AI Conductor)

---

## Overview

DAWG AI now supports **AI music generation** using Replicate (MusicGen). Users can:
1. **Text-to-music**: Describe a style → Get instrumental backing track
2. **Melody-to-music**: Sing a melody → AI creates full arrangement based on it

This enables the **vocal → MIDI → composition workflow** where users sing ideas and AI transforms them into complete songs.

---

## Prerequisites

### 1. Replicate API Account

Sign up at [replicate.com](https://replicate.com) and get your API token:

1. Visit https://replicate.com/account/api-tokens
2. Create new API token
3. Copy token (starts with `r8_...`)

### 2. Environment Variables

Add to `/Users/benkennon/dawg-ai/.env.local`:

```bash
# Replicate API (for music generation)
REPLICATE_API_TOKEN=r8_your_token_here
```

### 3. Install Dependencies

```bash
npm install replicate
```

---

## Architecture

### Components

1. **`/lib/ai/music-generation.ts`** - Replicate client and generation functions
2. **`/lib/ai/melody-types.ts`** - Data structures for vocal → MIDI analysis
3. **`/app/api/generate/music/route.ts`** - Music generation API endpoint
4. **`/lib/ai/tools.ts`** - Added `generate_backing_track` and `generate_from_melody` tools
5. **`/lib/ai/actions.ts`** - Action handlers for music generation tools

### Data Flow

```
User Request → Claude AI → Tool Call → API Endpoint → Replicate → Audio URL → New Track
```

---

## API Usage

### Endpoint: `POST /api/generate/music`

#### Mode 1: Text-to-Music

Generate backing track from description:

```bash
curl -X POST http://localhost:3000/api/generate/music \
  -H "Content-Type: application/json" \
  -d '{
    "style": {
      "genre": "country",
      "mood": "upbeat",
      "instruments": ["acoustic guitar", "fiddle", "drums"],
      "arrangement": "full band"
    },
    "duration": 30,
    "model": "medium"
  }'
```

**Response:**
```json
{
  "success": true,
  "audio_url": "https://replicate.delivery/pbxt/...",
  "metadata": {
    "prompt": "upbeat country instrumental featuring acoustic guitar, fiddle, drums, full band arrangement",
    "model": "medium",
    "duration": 30,
    "cost": 0.08
  }
}
```

#### Mode 2: Melody-to-Music

Generate arrangement from vocal recording:

```bash
curl -X POST http://localhost:3000/api/generate/music \
  -H "Content-Type: application/json" \
  -d '{
    "melodyInput": "https://your-s3-url.com/recording.webm",
    "style": {
      "genre": "pop",
      "mood": "energetic",
      "instruments": ["piano", "strings", "drums"]
    },
    "duration": 30
  }'
```

**Response:**
```json
{
  "success": true,
  "audio_url": "https://replicate.delivery/pbxt/...",
  "metadata": {
    "prompt": "energetic pop instrumental featuring piano, strings, drums",
    "model": "melody",
    "duration": 30,
    "cost": 0.088,
    "melody_input": "https://your-s3-url.com/recording.webm"
  }
}
```

### Cost Estimation: `GET /api/generate/music`

```bash
curl "http://localhost:3000/api/generate/music?model=medium&duration=60"
```

**Response:**
```json
{
  "cost": 0.16,
  "model": "medium",
  "duration": 60,
  "currency": "USD"
}
```

---

## AI Function Calling

### Tool: `generate_backing_track`

Claude can automatically generate backing tracks when asked:

**User:** "Create an upbeat country backing track with acoustic guitar and fiddle"

**Claude uses tool:**
```json
{
  "name": "generate_backing_track",
  "input": {
    "genre": "country",
    "mood": "upbeat",
    "instruments": ["acoustic guitar", "fiddle"],
    "duration": 30
  }
}
```

**Result:** Backing track added as new track in DAW

### Tool: `generate_from_melody`

Transform vocal recordings into full arrangements:

**User:** "Turn my vocal melody into a pop song with piano and strings"

**Claude uses tool:**
```json
{
  "name": "generate_from_melody",
  "input": {
    "recordingId": "rec-123",
    "genre": "pop",
    "mood": "emotional",
    "instruments": ["piano", "strings"],
    "complexity": "moderate"
  }
}
```

**Result:** AI analyzes melody, generates arrangement following the vocal line

---

## Models

### MusicGen Models (Replicate)

| Model | Parameters | Quality | Speed | Use Case |
|-------|-----------|---------|-------|----------|
| **Small** | 300M | Good | Fast | Quick prototypes |
| **Medium** | 1.5B | Better | Moderate | **Recommended default** |
| **Large** | 3.3B | Best | Slow | High-quality finals |
| **Melody** | 1.5B | Better | Moderate | **Melody conditioning** |

**Default:** Medium (best balance of quality/speed)

---

## Melody Analysis Integration

### Connecting with Pitch Detection (Instance 2)

Instance 2 completed **Stage 5** - real-time pitch detection. This enables melody-to-music workflow:

```typescript
import { pitchDataToMIDI, analyzeMelody } from '@/lib/ai/melody-types';
import { usePitchDetection } from '@/src/core/usePitchDetection';

// 1. Record vocal with pitch tracking
const { pitchHistory } = usePitchDetection({ ... });

// 2. Convert pitch data to MIDI notes
const midiNotes = pitchDataToMIDI(pitchHistory.map(p => p.result));

// 3. Analyze melody characteristics
const melody = analyzeMelody(midiNotes);
// { notes, tempo, key, scale, averagePitch, pitchRange, confidence }

// 4. Generate composition from melody
const result = await fetch('/api/generate/music', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    melodyInput: recordingUrl,
    style: {
      genre: 'pop',
      mood: 'upbeat',
      instruments: ['piano', 'guitar']
    },
    prompt: `${melody.key}, ${melody.tempo} BPM`,
  })
});
```

---

## Pricing

### Replicate (MusicGen)

- **Base cost:** ~$0.08 per generation
- **Duration scaling:** Proportional (60s = 2x cost of 30s)
- **Model scaling:**
  - Small: 80% of base
  - Medium: 100% of base (default)
  - Large: 130% of base
  - Melody: 110% of base

**Examples:**
- 30s Medium track: $0.08
- 60s Medium track: $0.16
- 30s Large track: $0.104
- 60s Melody track: $0.176

**Note:** Replicate charges only for compute time. No monthly fees.

---

## User Workflow (Instance 1 to Build)

### Workflow 1: Text-Based Generation

1. User opens DAW
2. User says to AI: "Create a country backing track"
3. AI calls `generate_backing_track` tool
4. Frontend shows "Generating..." indicator (30-60s)
5. Audio URL returned → Download → Add as new track
6. User can sing over it immediately

### Workflow 2: Melody-Based Generation

1. User records vocal melody (hums/sings idea)
2. User clicks recording → "Transform to composition"
3. Modal appears: "What style?" (genre, mood, instruments)
4. User describes: "Make it a pop ballad with piano"
5. AI calls `generate_from_melody` tool with recording ID
6. Frontend shows progress (analyzing melody → generating music)
7. Generated track added below original vocal
8. User can edit, re-record, or iterate

---

## Frontend Integration Checklist

### For Instance 1 (UI)

- [ ] **Generation UI:**
  - [ ] "Generate Music" button in toolbar
  - [ ] Modal for style input (genre, mood, instruments)
  - [ ] Duration slider (10-120s)
  - [ ] Model selector (small/medium/large)

- [ ] **Progress Tracking:**
  - [ ] Loading indicator during generation (30-60s)
  - [ ] Cost estimate display before generating
  - [ ] Cancel button (if generation takes too long)

- [ ] **Recording Context Menu:**
  - [ ] "Transform to Composition" option
  - [ ] Style selection dialog
  - [ ] Preview original melody while selecting style

- [ ] **Track Management:**
  - [ ] Download generated audio from URL
  - [ ] Add as new track (labeled "Generated: {style}")
  - [ ] Link generated track to source recording (metadata)

- [ ] **AI Chat Integration:**
  - [ ] Handle `generate_backing_track` tool use events
  - [ ] Handle `generate_from_melody` tool use events
  - [ ] Show generation progress in chat
  - [ ] Display cost after generation

---

## Testing

### Manual Testing

#### Test 1: Text-to-Music
```bash
curl -X POST http://localhost:3000/api/generate/music \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "upbeat country music with acoustic guitar",
    "duration": 15,
    "model": "small"
  }'
```

**Expected:** Returns audio URL within 30-60 seconds

#### Test 2: Style-Based Generation
```bash
curl -X POST http://localhost:3000/api/generate/music \
  -H "Content-Type: application/json" \
  -d '{
    "style": {
      "genre": "jazz",
      "mood": "mellow",
      "instruments": ["saxophone", "piano", "upright bass"]
    },
    "duration": 20
  }'
```

#### Test 3: Cost Estimation
```bash
curl "http://localhost:3000/api/generate/music?model=large&duration=90"
```

**Expected:** `{ "cost": 0.312, ... }`

### Automated Testing

Run test suite:
```bash
./test-music-generation.sh
```

---

## Troubleshooting

### Error: "Replicate API token not configured"

**Solution:** Add `REPLICATE_API_TOKEN` to `.env.local`

```bash
REPLICATE_API_TOKEN=r8_your_token_here
```

### Error: "Rate limit exceeded"

**Solution:** Wait a few minutes. Replicate has rate limits for free tier.

**Upgrade:** https://replicate.com/pricing (pay-as-you-go, no monthly fee)

### Generation Takes Too Long (>2 minutes)

**Possible causes:**
1. Large model + long duration
2. Replicate API under heavy load
3. Network issues

**Solutions:**
- Use `small` or `medium` model
- Reduce duration to 30s
- Check Replicate status: https://status.replicate.com

### Poor Quality Output

**Solutions:**
- Use `medium` or `large` model (not `small`)
- Provide more detailed prompts
- Try different instrument combinations
- Adjust `temperature` (0.8-1.2 range)

---

## Next Steps

### Stage 7.1 Complete ✅
- [x] Replicate API integration
- [x] Text-to-music generation
- [x] Melody-to-music generation
- [x] AI function calling tools
- [x] Cost estimation
- [x] Documentation

### Stage 7.2 (Instance 1 - UI)
- [ ] Build generation UI widgets
- [ ] Recording transformation dialog
- [ ] Progress indicators
- [ ] Track import from URLs

### Stage 8 (Instance 3 - Voice Cloning)
- [ ] ElevenLabs/Kits.AI integration
- [ ] Voice profile creation
- [ ] Harmony generation from vocals
- [ ] Multi-part vocal arrangements

---

## Cost Management Tips

1. **Use `small` model for prototyping** - 20% cheaper
2. **Generate shorter clips first** - Test at 15-30s
3. **Cache frequently used styles** - Store generated tracks
4. **Set cost limits** - Track spending in frontend
5. **Batch generations** - Generate multiple variations at once

---

## References

- **Replicate MusicGen:** https://replicate.com/meta/musicgen
- **MusicGen Paper:** https://arxiv.org/abs/2306.05284
- **Meta AudioCraft:** https://github.com/facebookresearch/audiocraft
- **Pricing:** https://replicate.com/pricing

---

**Questions?** See `/API.md` for API documentation or ask Instance 3 (AI Conductor).
