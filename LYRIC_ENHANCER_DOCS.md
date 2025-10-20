# Lyric Enhancer Documentation

## Overview

The Lyric Enhancer transforms mumbled/gibberish freestyle vocals into coherent, professional lyrics using GPT-4 while preserving the artist's original high-confidence words.

## Architecture

```
Input (Whisper Transcription + Melody)
  ↓
Word Categorization (Real vs Gibberish)
  ↓
Vibe Detection (Energy, Emotion, Genre)
  ↓
GPT-4 Enhancement (Syllable-accurate replacement)
  ↓
Validation & Confidence Scoring
  ↓
Enhanced Lyrics Output
```

---

## GPT-4 Prompt Template

### System Prompt

```
You are an expert lyricist and songwriter. Your job is to enhance freestyle vocal transcriptions by replacing gibberish and mumbles with coherent, meaningful lyrics.

Your priorities:
1. SYLLABLE ACCURACY - rhythm is everything
2. PRESERVE ORIGINAL WORDS - never change high-confidence words
3. CONTEXT AWARENESS - new words must flow with kept words
4. GENRE CONSISTENCY - match the artist's style
5. NATURAL FLOW - avoid awkward phrasing

Always return valid JSON with the exact structure requested.
```

### User Prompt Template

```
You are an expert lyricist. The artist freestyled a melody with these words:

[KEEP] "running" (2 syllables, 0.50s)
[REPLACE] "gahbah" (2 syllables, 1.00s)
[KEEP] "free" (1 syllable, 1.50s)
[REPLACE] "mumblemumble" (4 syllables, 2.00s)
[KEEP] "tonight" (2 syllables, 2.50s)

RULES:
1. NEVER change words marked [KEEP] - these are clear, high-confidence words
2. Replace words marked [REPLACE] with coherent lyrics that:
   - Match syllable count EXACTLY (critical for rhythm)
   - Fit the melody's emotional tone: high-energy, expressive, dynamic, hip-hop
   - Connect logically with surrounding [KEEP] words
   - Maintain natural speech rhythm and flow
3. Genre: hip-hop - use genre-appropriate vocabulary and slang
4. Key: C Major, BPM: 140 - match the energy level
5. Preserve timestamps from original words

EXAMPLE:
Input: [KEEP] "running" (2 syll, 0.5s) [REPLACE] "gahbah" (2 syll, 1.0s) [KEEP] "free" (1 syll, 1.5s)
Output: "running" -> "running" (original), "gahbah" -> "feeling" (2 syll match), "free" -> "free" (original)

Return JSON format:
{
  "lyrics": [
    {
      "word": "running",
      "syllables": 2,
      "timestamp": 0.5,
      "original": true,
      "confidence": 0.95,
      "alternatives": []
    },
    {
      "word": "feeling",
      "syllables": 2,
      "timestamp": 1.0,
      "original": false,
      "confidence": 0.85,
      "alternatives": ["chasing", "moving"]
    }
  ],
  "vibe": "energetic, uplifting, hip-hop",
  "reasoning": "Chose 'feeling' to match 2 syllables and connect 'running' with 'free' for an uplifting message matching the fast tempo."
}
```

---

## Word Categorization Algorithm

### Decision Tree

```
Input: Word { word: string, confidence: number }
  ↓
Step 1: Confidence Check
  - confidence > 0.8 → Go to Step 2 (High Confidence Path)
  - confidence < 0.5 → GIBBERISH (Low Confidence)
  - 0.5 ≤ confidence ≤ 0.8 → Go to Step 3 (Ambiguous Path)
  ↓
Step 2: High Confidence Path
  - Is dictionary word? → REAL
  - Not dictionary word? → Go to Step 4
  ↓
Step 3: Ambiguous Path
  - Is dictionary word? → Go to Step 4
  - Not dictionary word? → GIBBERISH
  ↓
Step 4: Gibberish Pattern Check
  - Has 4+ consecutive consonants? → GIBBERISH
  - No vowels? → GIBBERISH
  - Repeating patterns (e.g., "lalala")? → GIBBERISH
  - Matches gibberish regex? → GIBBERISH
  - Otherwise → REAL (if from Step 2) or AMBIGUOUS (if from Step 3)
```

### Implementation Details

```typescript
categorizeWords(transcription: Word[]): WordCategories {
  const real: Word[] = [];
  const gibberish: Word[] = [];
  const ambiguous: Word[] = [];

  for (const word of transcription) {
    const cleanWord = word.word.toLowerCase().replace(/[^a-z]/g, '');

    // HIGH CONFIDENCE + DICTIONARY = REAL
    if (word.confidence > 0.8 && this.isDictionaryWord(cleanWord)) {
      real.push(word);
    }
    // LOW CONFIDENCE OR GIBBERISH PATTERNS = GIBBERISH
    else if (word.confidence < 0.5 || this.isGibberish(cleanWord)) {
      gibberish.push(word);
    }
    // MIDDLE GROUND = AMBIGUOUS (treated as gibberish for enhancement)
    else {
      ambiguous.push(word);
      gibberish.push(word); // Conservative: let GPT-4 handle it
    }
  }

  return { real, gibberish, ambiguous };
}
```

### Gibberish Detection Patterns

```typescript
isGibberish(word: string): boolean {
  // Pattern 1: Excessive consonant clusters
  if (/[bcdfghjklmnpqrstvwxz]{4,}/.test(word)) return true;

  // Pattern 2: No vowels
  if (!/[aeiouy]/.test(word)) return true;

  // Pattern 3: Repeating patterns
  if (/(.{2,})\1{2,}/.test(word)) return true;

  // Pattern 4: Nonsense filler words
  const gibberishPatterns = [
    /^(uh|um|ah|eh|mm|hm|er)+$/,  // Filler sounds
    /^[aeiou]{4,}$/,               // Vowel strings
    /^(na|la|da|ba){3,}$/,         // Repetitive syllables
  ];

  return gibberishPatterns.some(pattern => pattern.test(word));
}
```

---

## Vibe Detection Algorithm

### Inputs
- Melody: `MIDINote[]` - pitch, velocity, timing
- Metadata: `{ key, bpm, genre? }`

### Analysis Process

```typescript
detectVibe(melody: MIDINote[], metadata: TrackMetadata): VibeDescription {
  // 1. Calculate pitch statistics
  const avgPitch = mean(melody.map(n => n.pitch));
  const pitchRange = max(pitch) - min(pitch);
  const bpm = metadata.bpm;

  // 2. Energy from tempo
  let energy: string;
  if (bpm > 140) energy = 'high-energy';
  else if (bpm < 80) energy = 'slow';
  else energy = 'mid-tempo';

  // 3. Emotion from pitch range
  let emotion: string;
  if (pitchRange > 12) emotion = 'expressive, dynamic';
  else if (pitchRange < 5) emotion = 'monotone, focused';
  else emotion = 'smooth, controlled';

  // 4. Add pitch register context
  if (avgPitch > 72) emotion += ', bright';
  else if (avgPitch < 60) emotion += ', dark';

  // 5. Compile description
  return `${energy}, ${emotion}, ${metadata.genre || 'general'}`;
}
```

### Example Outputs

| BPM | Pitch Range | Avg Pitch | Output Vibe |
|-----|-------------|-----------|-------------|
| 150 | 15 | 75 | "high-energy, expressive, dynamic, bright, hip-hop" |
| 70 | 8 | 58 | "slow, smooth, controlled, dark, R&B" |
| 120 | 4 | 65 | "mid-tempo, monotone, focused, pop" |

---

## Example Enhancement Output

### Input Transcription (from Whisper)

```json
[
  { "word": "I'm", "start": 0.0, "end": 0.2, "confidence": 0.92 },
  { "word": "running", "start": 0.3, "end": 0.7, "confidence": 0.88 },
  { "word": "gahbah", "start": 0.8, "end": 1.2, "confidence": 0.35 },
  { "word": "mumble", "start": 1.3, "end": 1.7, "confidence": 0.25 },
  { "word": "tonight", "start": 1.8, "end": 2.3, "confidence": 0.91 },
  { "word": "yeah", "start": 2.4, "end": 2.7, "confidence": 0.95 },
  { "word": "uhhhh", "start": 2.8, "end": 3.2, "confidence": 0.15 },
  { "word": "feeling", "start": 3.3, "end": 3.8, "confidence": 0.87 },
  { "word": "blahblah", "start": 3.9, "end": 4.3, "confidence": 0.22 }
]
```

### Categorization Result

```json
{
  "real": [
    { "word": "I'm", "confidence": 0.92 },
    { "word": "running", "confidence": 0.88 },
    { "word": "tonight", "confidence": 0.91 },
    { "word": "yeah", "confidence": 0.95 },
    { "word": "feeling", "confidence": 0.87 }
  ],
  "gibberish": [
    { "word": "gahbah", "confidence": 0.35 },
    { "word": "mumble", "confidence": 0.25 },
    { "word": "uhhhh", "confidence": 0.15 },
    { "word": "blahblah", "confidence": 0.22 }
  ],
  "ambiguous": []
}
```

### Enhanced Lyrics Output

```json
{
  "lyrics": [
    {
      "word": "I'm",
      "syllables": 1,
      "timestamp": 0.0,
      "original": true,
      "confidence": 0.92,
      "alternatives": []
    },
    {
      "word": "running",
      "syllables": 2,
      "timestamp": 0.3,
      "original": true,
      "confidence": 0.88,
      "alternatives": []
    },
    {
      "word": "chasing",
      "syllables": 2,
      "timestamp": 0.8,
      "original": false,
      "confidence": 0.82,
      "alternatives": ["racing", "moving"]
    },
    {
      "word": "freedom",
      "syllables": 2,
      "timestamp": 1.3,
      "original": false,
      "confidence": 0.85,
      "alternatives": ["greatness", "glory"]
    },
    {
      "word": "tonight",
      "syllables": 2,
      "timestamp": 1.8,
      "original": true,
      "confidence": 0.91,
      "alternatives": []
    },
    {
      "word": "yeah",
      "syllables": 1,
      "timestamp": 2.4,
      "original": true,
      "confidence": 0.95,
      "alternatives": []
    },
    {
      "word": "I'm",
      "syllables": 1,
      "timestamp": 2.8,
      "original": false,
      "confidence": 0.78,
      "alternatives": ["just", "still"]
    },
    {
      "word": "feeling",
      "syllables": 2,
      "timestamp": 3.3,
      "original": true,
      "confidence": 0.87,
      "alternatives": []
    },
    {
      "word": "alive",
      "syllables": 2,
      "timestamp": 3.9,
      "original": false,
      "confidence": 0.88,
      "alternatives": ["so high", "unstoppable"]
    }
  ],
  "vibe": "high-energy, uplifting, hip-hop",
  "overallConfidence": 0.87,
  "stats": {
    "totalWords": 9,
    "originalWords": 5,
    "aiEnhanced": 4,
    "syllableMatchRate": 1.0
  }
}
```

### Visual Representation

```
ORIGINAL (with confidence):
I'm (92%) running (88%) [gahbah (35%)] [mumble (25%)] tonight (91%) yeah (95%) [uhhhh (15%)] feeling (87%) [blahblah (22%)]

ENHANCED (with markers):
I'm ✓ running ✓ chasing ✨ freedom ✨ tonight ✓ yeah ✓ I'm ✨ feeling ✓ alive ✨

Legend:
✓ = Original word (preserved)
✨ = AI enhanced (replaced gibberish)

FINAL LYRICS:
"I'm running, chasing freedom tonight
Yeah, I'm feeling alive"
```

---

## Quality Metrics

### Syllable Match Rate

```typescript
syllableMatchRate = matchingWords / totalWords

Example:
- Original: ["gahbah" (2 syll), "mumble" (2 syll), "uhhhh" (1 syll)]
- Enhanced: ["chasing" (2 syll), "freedom" (2 syll), "I'm" (1 syll)]
- Match Rate: 3/3 = 100%
```

### Confidence Score Calculation

```typescript
// Weighted average: original words weighted 1.5x
totalConfidence = sum(
  originalWords.map(w => w.confidence * 1.5) +
  aiWords.map(w => w.confidence * 1.0)
)
totalWeight = (originalWords.length * 1.5) + aiWords.length
overallConfidence = totalConfidence / totalWeight
```

### Quality Thresholds

| Metric | Target | Minimum Acceptable |
|--------|--------|-------------------|
| Syllable Match Rate | >95% | >90% |
| Overall Confidence | >85% | >75% |
| Original Word Preservation | 100% | 100% |
| AI Enhancement Confidence | >80% | >70% |

---

## Usage Example

```typescript
import { LyricEnhancer } from './services/lyric-enhancer';

const enhancer = new LyricEnhancer(process.env.OPENAI_API_KEY);

const input = {
  transcription: [
    { word: "running", start: 0.5, end: 1.0, confidence: 0.92 },
    { word: "gahbah", start: 1.1, end: 1.5, confidence: 0.35 },
    { word: "free", start: 1.6, end: 2.0, confidence: 0.88 },
  ],
  melody: [
    { pitch: 60, velocity: 80, start: 0.5, duration: 0.5 },
    { pitch: 62, velocity: 75, start: 1.1, duration: 0.4 },
    { pitch: 64, velocity: 85, start: 1.6, duration: 0.4 },
  ],
  metadata: {
    key: "C Major",
    bpm: 140,
    genre: "hip-hop",
  },
};

const result = await enhancer.enhanceGibberish(input);

console.log(result);
// {
//   lyrics: [
//     { word: "running", syllables: 2, timestamp: 0.5, original: true, confidence: 0.92 },
//     { word: "feeling", syllables: 2, timestamp: 1.1, original: false, confidence: 0.85 },
//     { word: "free", syllables: 1, timestamp: 1.6, original: true, confidence: 0.88 }
//   ],
//   vibe: "high-energy, expressive, dynamic, hip-hop",
//   overallConfidence: 0.88,
//   stats: {
//     totalWords: 3,
//     originalWords: 2,
//     aiEnhanced: 1,
//     syllableMatchRate: 1.0
//   }
// }
```

---

## Error Handling

### Common Issues

1. **GPT-4 API Failure**
   - Fallback: Return original transcription with warning
   - Retry logic: 3 attempts with exponential backoff

2. **Syllable Mismatch**
   - Alert: Log warning if match rate < 90%
   - Action: Request alternatives from GPT-4

3. **Low Overall Confidence**
   - Alert: If overall confidence < 75%
   - Action: Suggest manual review to user

4. **No Melody Data**
   - Fallback: Use metadata only for vibe detection
   - Default vibe: "moderate, neutral"

---

## Future Enhancements

1. **Dictionary Expansion**
   - Load comprehensive English dictionary (50k+ words)
   - Add slang/urban dictionary for hip-hop/rap
   - Support multilingual lyrics

2. **Advanced Syllable Matching**
   - Use pronunciation library (CMU Pronouncing Dictionary)
   - Handle compound words and contractions better

3. **Context Window**
   - Analyze surrounding lines for better coherence
   - Maintain rhyme schemes when detected

4. **User Feedback Loop**
   - Learn from user edits to improve suggestions
   - Build artist-specific vocabulary preferences

5. **Real-time Processing**
   - Stream lyrics as they're enhanced
   - Provide instant feedback during recording
