# 🎤 Stage 8 Complete - Voice Cloning & Harmony Generation

**Date:** 2025-10-02
**Instance:** 3 (AI Conductor)
**Status:** ✅ COMPLETE

---

## Summary

**DAWG AI now supports voice cloning and harmony generation!** Users can:
1. Create voice profiles from vocal recordings
2. Generate harmonies using their cloned voice
3. Add multi-part vocal arrangements automatically

This enables the complete **lead vocal → voice profile → harmonies workflow**.

---

## What Was Built

### 1. Voice Cloning Client (`/lib/ai/voice-cloning.ts`)
- Voice profile creation from 6-30 second samples
- Harmony generation with cloned voice
- Text-to-speech with cloned voice
- Cost estimation (~$0.006 per second)
- Voice sample validation

**Key Functions:**
```typescript
createVoiceProfile(userId, name, sampleAudioUrl) → VoiceProfile
generateHarmony(params, voiceProfile) → HarmonyGenerationResult
textToSpeechWithVoice(params, voiceProfile) → TextToSpeechResult
estimateVoiceCloningCost(durationSeconds) → number
validateVoiceSample(duration, format, hasNoise) → {valid, error?}
```

### 2. API Endpoints

**POST /api/voice/clone** - Create voice profile
- Input: userId, name, sampleAudioUrl, duration, format
- Output: Voice profile with ID
- Validation: 6-30s duration, valid format, clean audio

**POST /api/voice/harmony** - Generate harmonies
- Input: leadVocalUrl, voiceProfileId, intervals, language
- Output: Array of harmony audio URLs with costs
- Supports 6 intervals: third/fifth/octave above/below

**GET /api/voice/harmony** - Cost estimation
- Input: duration, intervals (query params)
- Output: Estimated cost breakdown

**GET /api/voice/clone** - Fetch user profiles
- Input: userId (query param)
- Output: Array of voice profiles
- Note: Currently returns empty array (DB integration pending)

### 3. AI Tools Integration
- `create_voice_profile` - Claude creates voice profiles from recordings
- `generate_harmony` - Claude generates harmonies with specified intervals
- Both tools work via chat commands
- Integrated with track store for recording lookup

### 4. Documentation & Testing
- `VOICE_CLONING_SETUP.md` - Complete integration guide
- `test-voice-cloning.sh` - Test suite (10 tests)
- Updated `API.md` with voice cloning endpoints
- Changelog entry for Stage 8

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
POST /api/voice/clone → Voice profile created
↓
Voice profile stored (will be in DB when Stage 6 complete)
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
  - Cost estimate: ~$0.12 for 2 harmonies (10s each)
↓
User selects intervals → Clicks "Generate"
↓
Claude calls generate_harmony tool
↓
POST /api/voice/harmony → Generates harmonies
↓
1-2 minutes later → Harmony audio URLs returned
↓
Frontend downloads harmonies, adds as new tracks
↓
User can mix, adjust volume/pan, export!
```

---

## Available Harmony Intervals

| Interval | Semitones | Example | Musical Use |
|----------|-----------|---------|-------------|
| `third_above` | +4 | C → E | Classic harmony |
| `third_below` | -4 | E → C | Lower harmony |
| `fifth_above` | +7 | C → G | Strong harmony |
| `fifth_below` | -7 | G → C | Bass harmony |
| `octave_above` | +12 | C4 → C5 | Doubling (higher) |
| `octave_below` | -12 | C5 → C4 | Doubling (lower) |

**Typical Country/Pop Stack:**
- Lead vocal (center)
- Third above (panned 30% right)
- Fifth above (panned 30% left)
- Octave below (subtle, center, -6dB)

---

## Integration for Instance 1 (UI)

### What to Build

**1. Voice Profile Management:**
- "Create Voice Profile" button in recording context menu
- Voice profile list widget (view/delete profiles)
- Sample validation UI (duration, format checks)
- Cost display before creation

**2. Harmony Generation UI:**
- "Generate Harmonies" button on recording context menu
- Harmony generator modal:
  - Voice profile dropdown
  - Interval checkboxes (with musical examples)
  - Preview/help tooltips
  - Cost estimate display
- Progress bar (1-2 min generation time)
- Cancel button

**3. Track Management:**
- Download harmony audio from Replicate URLs
- Add as new tracks with labels:
  - "Harmony - Third Above"
  - "Harmony - Fifth Above"
- Link harmonies to source recording (metadata)
- Auto-pan harmonies (left/right spread)
- Waveform display for harmonies

### API Usage Example

```typescript
// 1. Create voice profile
const createResponse = await fetch('/api/voice/clone', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user_123',
    name: 'My Lead Voice',
    sampleAudioUrl: 's3Url', // From S3 upload
    duration: 10,
    format: 'webm'
  })
});

const { voiceProfile } = await createResponse.json();
console.log('Voice profile ID:', voiceProfile.id);

// 2. Generate harmonies
const harmonyResponse = await fetch('/api/voice/harmony', {
  method: 'POST',
  body: JSON.stringify({
    leadVocalUrl: 's3Url', // Lead vocal from S3
    voiceProfileId: voiceProfile.id,
    intervals: ['third_above', 'fifth_above'],
    language: 'en'
  })
});

const { harmonies, totalCost } = await harmonyResponse.json();
// harmonies = [
//   { interval: 'third_above', audioUrl: '...', cost: 0.06 },
//   { interval: 'fifth_above', audioUrl: '...', cost: 0.06 }
// ]

// 3. Download and add as tracks
for (const harmony of harmonies) {
  const audioBlob = await fetch(harmony.audioUrl).then(r => r.blob());
  addTrack({
    name: `Harmony - ${formatInterval(harmony.interval)}`,
    audioBlob,
    sourceRecordingId: leadRecordingId
  });
}
```

---

## Pricing

**XTTS-v2 Cost: ~$0.006 per second**

### Examples:
- **Voice profile creation:** Free (no generation, just stores URL)
- **10s harmony (1 part):** ~$0.06
- **10s lead + 2 harmonies:** ~$0.12
- **30s lead + 3 harmonies:** ~$0.54
- **60s lead + 4 harmonies:** ~$1.44

### Comparison to Stage 7 Music Generation:
- Music generation: ~$0.08 per 30s track (higher quality)
- Voice cloning: ~$0.06 per 10s harmony (simpler task)

### Alternative Providers:
- **ElevenLabs:** ~$0.30/1000 chars (10x more expensive, better quality)
- **Kits.AI:** $14.99/month unlimited (best for heavy use)

**Recommendation:** Start with XTTS-v2, upgrade to ElevenLabs if quality becomes critical.

---

## Technical Details

### API Provider: Replicate XTTS-v2

**Model:** `lucataco/xtts-v2:684bc3855b37866c0c65add2ff39c78f3dea3f4ff103a436465326e0f438d55e`

**Pros:**
- Zero-shot voice cloning (no training)
- Multilingual (17 languages)
- Fast (~10-30s per harmony)
- Affordable (~$0.006/sec)
- Already integrated (Replicate client from Stage 7)

**Cons:**
- Lower quality than ElevenLabs
- Requires 6-30s clean sample
- Simplified harmony (no lyrics extraction yet)

### Voice Sample Requirements

**Duration:** 6-30 seconds
- Too short (<6s): Insufficient voice characteristics
- Too long (>30s): Diminishing returns, slower processing

**Quality:**
- Single speaker only
- Minimal background noise
- Clear pronunciation
- Consistent volume

**Formats:** WAV, MP3, WebM, OGG, M4A

### Current Limitations

1. **No lyrics/phoneme extraction** - Simplified harmony generation (full implementation would extract lyrics from lead vocal and synthesize harmonies with correct words)

2. **Fixed intervals** - Only 6 predefined intervals (future: custom intervals, chord-based harmonies)

3. **No real-time preview** - Must generate fully to hear result (future: quick preview mode)

4. **No auto-mixing** - User must manually adjust volume/pan (future: AI-suggested mixing)

5. **Voice quality** - XTTS-v2 is good but not perfect (future: ElevenLabs upgrade option)

---

## Testing

### Manual Test

```bash
# 1. Create voice profile
curl -X POST http://localhost:3000/api/voice/clone \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "name": "Test Voice",
    "sampleAudioUrl": "https://example.com/sample.wav",
    "duration": 10,
    "format": "wav"
  }'

# 2. Generate harmonies
curl -X POST http://localhost:3000/api/voice/harmony \
  -H "Content-Type: application/json" \
  -d '{
    "leadVocalUrl": "https://example.com/lead.wav",
    "voiceProfileId": "voice_123",
    "intervals": ["third_above", "fifth_above"],
    "language": "en"
  }'

# 3. Get cost estimate
curl "http://localhost:3000/api/voice/harmony?duration=10&intervals=third_above,fifth_above"
```

### Test Suite

```bash
# Requires REPLICATE_API_TOKEN in .env.local
./test-voice-cloning.sh
```

**Test Coverage:**
- ✅ Voice profile creation (valid)
- ✅ Voice profile creation (sample too short)
- ✅ Voice profile creation (sample too long)
- ✅ Voice profile creation (missing fields)
- ✅ Harmony generation (valid)
- ✅ Harmony generation (invalid intervals)
- ✅ Harmony generation (missing fields)
- ✅ Cost estimation
- ✅ Voice profile retrieval
- ✅ Voice profile retrieval (missing userId)

---

## Next Steps

### Immediate (Instance 1)
1. Build voice profile management UI
2. Add "Create Voice Profile" to recording context menu
3. Build harmony generation modal
4. Download & add harmony tracks
5. Integrate with ChatPanel for AI commands
6. Test end-to-end workflow

### Integration Points (Other Instances)
- **Instance 2 (Pitch Detection):** Use pitch data for better harmony timing
- **Instance 4 (S3 Storage):** Store voice profiles in database (not just temp IDs)
- **Instance 4 (Database):** Add `VoiceProfile` model to Prisma schema

### Future Enhancements (Stage 9+)
- Lyrics extraction (Whisper API) for accurate phoneme synthesis
- Custom intervals (user-defined semitones)
- Chord-based harmonies (analyze chord progression, generate appropriate intervals)
- Real-time preview (quick 5s sample before full generation)
- Auto-mixing (AI-suggested volume/pan for harmonies)
- ElevenLabs upgrade option (better quality, higher cost)
- Harmony templates (country, pop, gospel, barbershop)

---

## Files Created/Modified

**New Files:**
- `/lib/ai/voice-cloning.ts` - Voice cloning client
- `/app/api/voice/clone/route.ts` - Voice profile creation endpoint
- `/app/api/voice/harmony/route.ts` - Harmony generation endpoint
- `/VOICE_CLONING_SETUP.md` - Setup guide
- `test-voice-cloning.sh` - Test suite
- `STAGE_8_COMPLETE.md` - This file

**Modified Files:**
- `/lib/ai/tools.ts` - Added 2 new tools (create_voice_profile, generate_harmony)
- `/lib/ai/actions.ts` - Added handlers for voice cloning tools
- `/API.md` - Added voice cloning endpoints section + changelog
- No `.env.example` changes (REPLICATE_API_TOKEN already added in Stage 7)

---

## Documentation

- **Setup Guide:** `VOICE_CLONING_SETUP.md`
- **API Docs:** `API.md` (Voice Cloning Endpoints section)
- **Test Suite:** `test-voice-cloning.sh`

---

## Example Use Cases

### Use Case 1: Country Harmony Stack
```
Lead vocal: "I'm gonna take my horse to the old town road"
↓
Generate harmonies:
  - Third above (bright harmony)
  - Fifth above (strong support)
  - Octave below (bass doubling)
↓
Mix:
  - Lead: 0dB, center
  - Third above: -3dB, 30% right
  - Fifth above: -3dB, 30% left
  - Octave below: -6dB, center
↓
Result: Rich, full country vocal sound
```

### Use Case 2: Gospel-Style Stacking
```
Lead vocal: Powerful main melody
↓
Generate harmonies:
  - Third above
  - Third below
  - Fifth above
  - Octave above
↓
Mix with wide stereo spread
↓
Result: Gospel choir effect from single voice
```

### Use Case 3: Pop Vocal Doubling
```
Lead vocal: Pop melody
↓
Generate harmonies:
  - Octave above (slight delay, 10% wet)
  - Octave below (subtle, -10dB)
↓
Mix tightly with lead
↓
Result: Thick, modern pop vocal
```

---

**🚀 Stage 8 is complete and ready for frontend integration!**

**Next:** Instance 1 builds the voice cloning UI, or Instance 3 continues to Stage 9 (Adaptive AI Coaching).
