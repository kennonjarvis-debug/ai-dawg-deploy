# 🎤 Voice Cloning & Harmony Generation - Setup Guide

**Stage 8: Voice Cloning Integration**

This guide explains how to integrate voice cloning and harmony generation into DAWG AI.

---

## Overview

Voice cloning enables users to:
1. **Create voice profiles** from vocal recordings (6-30 seconds)
2. **Generate harmonies** using the cloned voice
3. **Create vocal parts** that sound like the user

This enables the complete **lead vocal → voice profile → harmonies workflow**.

---

## API Provider: Replicate XTTS-v2

**Why XTTS-v2?**
- ✅ Most affordable (~$0.006 per second)
- ✅ Zero-shot voice cloning (no training required)
- ✅ Multilingual support (17 languages)
- ✅ Already integrated via Replicate
- ⚠️ Lower quality than ElevenLabs (but 50x cheaper)

**Alternative Options:**
- **ElevenLabs**: Best quality (~$0.30/1000 chars), expensive
- **Kits.AI**: Music-focused ($14.99/month), API in beta

---

## Setup Instructions

### 1. Environment Variables

Add to `.env.local` (already set if you completed Stage 7):

```bash
REPLICATE_API_TOKEN=r8_your_replicate_token_here
```

Get your token: https://replicate.com/account/api-tokens

### 2. Install Dependencies

```bash
npm install replicate
```

(Already installed if you completed Stage 7)

### 3. Test the API

```bash
./test-voice-cloning.sh
```

This will test:
- Voice profile creation
- Harmony generation
- Cost estimation
- Error handling

---

## Architecture

### Files Created

**Backend:**
- `/lib/ai/voice-cloning.ts` - Replicate XTTS-v2 client
- `/app/api/voice/clone/route.ts` - Voice profile creation endpoint
- `/app/api/voice/harmony/route.ts` - Harmony generation endpoint

**AI Integration:**
- `/lib/ai/tools.ts` - Added 2 new Claude tools
- `/lib/ai/actions.ts` - Added handlers for voice cloning

**Documentation:**
- `/VOICE_CLONING_SETUP.md` - This file
- `test-voice-cloning.sh` - Test suite

### Workflow

```
1. User records vocal (6-30s clean audio)
   ↓
2. User clicks "Create Voice Profile"
   ↓
3. POST /api/voice/clone → Creates voice profile
   ↓
4. User records lead vocal
   ↓
5. User clicks "Generate Harmonies"
   ↓
6. POST /api/voice/harmony → Generates harmony parts
   ↓
7. Harmonies added as new tracks (downloadable URLs)
```

---

## API Endpoints

### POST /api/voice/clone

Create a voice profile from a vocal sample.

**Request:**
```json
{
  "userId": "user_123",
  "name": "My Lead Voice",
  "sampleAudioUrl": "https://dawg-ai-recordings.s3.amazonaws.com/.../vocal.webm",
  "duration": 10,
  "format": "webm"
}
```

**Response:**
```json
{
  "success": true,
  "voiceProfile": {
    "id": "voice_1696800000_abc123",
    "userId": "user_123",
    "name": "My Lead Voice",
    "sampleAudioUrl": "https://...",
    "createdAt": "2025-10-02T12:00:00.000Z"
  }
}
```

**Requirements:**
- Sample duration: 6-30 seconds
- Single speaker
- Clean audio (minimal background noise)
- Formats: WAV, MP3, WebM, OGG, M4A

---

### POST /api/voice/harmony

Generate harmony vocals from lead vocal.

**Request:**
```json
{
  "leadVocalUrl": "https://dawg-ai-recordings.s3.amazonaws.com/.../lead.webm",
  "voiceProfileId": "voice_1696800000_abc123",
  "intervals": ["third_above", "fifth_above"],
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "harmonies": [
    {
      "interval": "third_above",
      "audioUrl": "https://replicate.delivery/.../third_above.wav",
      "cost": 0.06
    },
    {
      "interval": "fifth_above",
      "audioUrl": "https://replicate.delivery/.../fifth_above.wav",
      "cost": 0.06
    }
  ],
  "totalCost": 0.12
}
```

**Available Intervals:**
- `third_above` - Major third up (e.g., C → E)
- `third_below` - Major third down (e.g., E → C)
- `fifth_above` - Perfect fifth up (e.g., C → G)
- `fifth_below` - Perfect fifth down (e.g., G → C)
- `octave_above` - Octave up (e.g., C4 → C5)
- `octave_below` - Octave down (e.g., C5 → C4)

---

### GET /api/voice/harmony (Cost Estimation)

Estimate cost before generating harmonies.

**Request:**
```
GET /api/voice/harmony?duration=10&intervals=third_above,fifth_above
```

**Response:**
```json
{
  "success": true,
  "estimatedCost": 0.12,
  "breakdown": {
    "third_above": 0.06,
    "fifth_above": 0.06
  },
  "durationPerHarmony": 10,
  "intervalCount": 2
}
```

---

## AI Tools

Claude can now use these tools via chat:

### 1. `create_voice_profile`

**User:** "Create a voice profile from recording 'rec_123' called 'John's Voice'"

**Claude calls:**
```json
{
  "name": "create_voice_profile",
  "input": {
    "recordingId": "rec_123",
    "name": "John's Voice"
  }
}
```

**AI Response:** "Creating voice profile 'John's Voice' from 'Track 1'... This will take a few seconds."

---

### 2. `generate_harmony`

**User:** "Generate a third above and fifth above harmony from recording 'rec_456' using voice profile 'voice_789'"

**Claude calls:**
```json
{
  "name": "generate_harmony",
  "input": {
    "leadVocalRecordingId": "rec_456",
    "voiceProfileId": "voice_789",
    "intervals": ["third_above", "fifth_above"]
  }
}
```

**AI Response:** "Generating 2 harmony parts (Third Above, Fifth Above) from 'Lead Vocals'... This will take 1-2 minutes."

---

## Integration for Instance 1 (Frontend)

### What to Build

**1. Voice Profile Management UI:**
- "Create Voice Profile" button on recording context menu
- Voice profile list (view/delete profiles)
- Sample validation (6-30s, clean audio)
- Cost display (~$0.006 per second)

**2. Harmony Generation UI:**
- "Generate Harmonies" button on recording
- Interval selector (checkboxes for third/fifth/octave)
- Voice profile dropdown
- Progress bar (1-2 minutes generation time)
- Cost estimate display

**3. Track Management:**
- Download harmony audio from Replicate
- Add as new tracks ("Harmony - Third Above", etc.)
- Link to source recording (metadata)
- Waveform display for harmonies

### Usage Example

```typescript
// Create voice profile
const response = await fetch('/api/voice/clone', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user_123',
    name: 'My Lead Voice',
    sampleAudioUrl: 'https://s3.../vocal.webm',
    duration: 10,
    format: 'webm'
  })
});

const { voiceProfile } = await response.json();

// Generate harmonies
const harmonyResponse = await fetch('/api/voice/harmony', {
  method: 'POST',
  body: JSON.stringify({
    leadVocalUrl: 'https://s3.../lead.webm',
    voiceProfileId: voiceProfile.id,
    intervals: ['third_above', 'fifth_above'],
    language: 'en'
  })
});

const { harmonies, totalCost } = await harmonyResponse.json();
// harmonies = [{ interval, audioUrl, cost }, ...]
```

---

## Pricing

**XTTS-v2 Cost: ~$0.006 per second**

### Examples:
- **10s harmony (1 part):** ~$0.06
- **10s lead + 2 harmonies:** ~$0.12
- **30s lead + 3 harmonies:** ~$0.54

**Comparison:**
- ElevenLabs: ~$0.30/1000 chars (~10x more expensive)
- Kits.AI: $14.99/month (unlimited, but requires subscription)

---

## Limitations & Future Improvements

### Current Limitations:
1. **Voice cloning quality** - XTTS-v2 is good but not perfect
2. **No lyrics/phoneme extraction** - Currently simplified (full implementation would extract lyrics from vocal)
3. **Fixed intervals** - No custom interval support yet
4. **No mixing** - Harmonies need manual volume/pan adjustment

### Future Improvements (Stage 9+):
1. **Upgrade to ElevenLabs** - Better quality, higher cost
2. **Lyrics extraction** - Use Whisper API for accurate phonemes
3. **Custom intervals** - User-defined harmony intervals
4. **Auto-mixing** - AI-suggested volume/pan for harmonies
5. **Real-time preview** - Hear harmony before generating

---

## Testing

### Manual Test

```bash
# Create voice profile
curl -X POST http://localhost:3000/api/voice/clone \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "name": "Test Voice",
    "sampleAudioUrl": "https://example.com/sample.wav",
    "duration": 10,
    "format": "wav"
  }'

# Generate harmonies
curl -X POST http://localhost:3000/api/voice/harmony \
  -H "Content-Type: application/json" \
  -d '{
    "leadVocalUrl": "https://example.com/lead.wav",
    "voiceProfileId": "voice_123",
    "intervals": ["third_above", "fifth_above"],
    "language": "en"
  }'
```

### Test Suite

```bash
# Requires REPLICATE_API_TOKEN in .env.local
./test-voice-cloning.sh
```

---

## User Workflows

### Workflow 1: Create Voice Profile

```
User records 10s clean vocal sample
   ↓
User clicks recording → "Create Voice Profile"
   ↓
Modal: "Name this voice profile" → User: "My Voice"
   ↓
Claude calls create_voice_profile tool
   ↓
Voice profile created (stored in DB)
   ↓
"Voice profile 'My Voice' created successfully!"
```

### Workflow 2: Generate Harmonies

```
User records lead vocal
   ↓
User clicks recording → "Generate Harmonies"
   ↓
Modal shows:
  - Voice profile dropdown (select "My Voice")
  - Interval checkboxes (third above/below, fifth, octave)
  - Cost estimate: ~$0.12 for 2 harmonies
   ↓
User selects intervals → Clicks "Generate"
   ↓
Claude calls generate_harmony tool
   ↓
1-2 minutes later → Harmony tracks added
   ↓
User can mix, adjust, export!
```

---

## Next Steps

### Immediate (Instance 1):
1. Build voice profile UI widgets
2. Add "Create Voice Profile" to recording context menu
3. Build harmony generation modal
4. Download & add harmony tracks
5. Test end-to-end workflow

### Future (Instance 3):
- Stage 9: Adaptive AI coaching with vocal analysis
- Advanced voice cloning (upgrade to ElevenLabs)
- Custom interval support
- Real-time harmony preview

---

## Troubleshooting

### Error: "Invalid API token"
- Check `REPLICATE_API_TOKEN` in `.env.local`
- Verify token at https://replicate.com/account/api-tokens

### Error: "Voice sample must be at least 6 seconds"
- Record longer sample (6-30s required)
- Use clean, single-speaker audio

### Error: "Rate limit exceeded"
- Replicate free tier has rate limits
- Upgrade to paid plan or wait and retry

### Poor harmony quality
- Ensure voice sample is clean (no background noise)
- Use longer sample (15-30s recommended)
- Consider upgrading to ElevenLabs for better quality

---

**🚀 Stage 8 complete! Ready for frontend integration.**
