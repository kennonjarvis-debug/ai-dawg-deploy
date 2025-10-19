# Melody-to-Vocals: Examples & Workflows

Real-world examples, sample prompts, and proven workflows for the Melody-to-Vocals feature.

## Table of Contents

- [Example Prompts](#example-prompts)
- [Genre-Specific Examples](#genre-specific-examples)
- [Common Workflows](#common-workflows)
- [Parameter Combinations](#parameter-combinations)
- [Use Case Scenarios](#use-case-scenarios)
- [Before & After](#before--after)

## Example Prompts

### Pop Examples

#### Example 1: Upbeat Pop
```javascript
{
  prompt: "A celebration of living in the moment and enjoying life",
  genre: "pop",
  mood: "uplifting",
  theme: "celebration"
}
```
**Expected output**: Energetic lyrics about seizing the day, having fun, memorable choruses

**Sample generated lyrics**:
```
Living for today, no worries in sight
Dancing through the day, into the night
Every moment counts, we're feeling alive
This is our time, let's take it and thrive
```

#### Example 2: Romantic Pop
```javascript
{
  prompt: "A love song about finding the perfect person",
  genre: "pop",
  mood: "romantic",
  theme: "new love"
}
```
**Expected output**: Sweet, relatable love lyrics with universal appeal

**Sample generated lyrics**:
```
I never knew that love could feel this way
You walked into my life and changed everything today
With you beside me, the world just feels so right
You're my sunshine in the morning, my stars at night
```

#### Example 3: Heartbreak Pop
```javascript
{
  prompt: "Moving on after a relationship ends",
  genre: "pop",
  mood: "bittersweet",
  theme: "heartbreak"
}
```
**Expected output**: Emotional but hopeful lyrics about recovery and growth

**Sample generated lyrics**:
```
I'm learning how to let you go
Even though it hurts, I know
I'll be stronger on the other side
Found my strength, restored my pride
```

### Rock Examples

#### Example 4: Empowering Rock Anthem
```javascript
{
  prompt: "Breaking free from limitations and rising above",
  genre: "rock",
  mood: "empowering",
  theme: "freedom",
  vocal_model: "musicgen"
}
```
**Expected output**: Bold, powerful lyrics with strong imagery

**Sample generated lyrics**:
```
They built these walls to hold me down
But I'm breaking through, I'm breaking out
Nothing's gonna stop me now
I'm taking back control somehow
Rising up from the ground
Hear me roar, hear the sound
```

#### Example 5: Rebellious Rock
```javascript
{
  prompt: "Refusing to conform to society's expectations",
  genre: "rock",
  mood: "angry",
  theme: "rebellion",
  vocal_model: "musicgen"
}
```
**Expected output**: Defiant, aggressive lyrics with attitude

### Hip-Hop Examples

#### Example 6: Success Story
```javascript
{
  prompt: "Rising from poverty to success through hard work",
  genre: "hip-hop",
  mood: "confident",
  theme: "success",
  ai_provider: "openai"
}
```
**Expected output**: Modern vernacular, hustle mentality, confident delivery

**Sample generated lyrics**:
```
Started from the bottom, now we here
Grinding every day, year after year
They doubted me, but now they see
I made it happen, just believe
```

#### Example 7: Reflective Hip-Hop
```javascript
{
  prompt: "Looking back on the journey and lessons learned",
  genre: "hip-hop",
  mood: "reflective",
  theme: "personal growth",
  ai_provider: "anthropic"
}
```
**Expected output**: Introspective lyrics with storytelling elements

### Country Examples

#### Example 8: Traditional Country
```javascript
{
  prompt: "Life on a family farm, simple pleasures and hard work",
  genre: "country",
  mood: "peaceful",
  theme: "rural life",
  style: "John Denver",
  vocal_model: "musicgen"
}
```
**Expected output**: Storytelling lyrics with rural imagery and traditional values

**Sample generated lyrics**:
```
Wake up with the sunrise, coffee in my hand
Another day of working this blessed piece of land
Tractor running steady, fields as far as I can see
This simple life of country living's all I'll ever need
```

#### Example 9: Modern Country
```javascript
{
  prompt: "A summer night love story at a lake party",
  genre: "country",
  mood: "romantic",
  theme: "summer romance",
  style: "Morgan Wallen"
}
```
**Expected output**: Modern country production feel, relatable scenarios

### Folk Examples

#### Example 10: Nostalgic Folk
```javascript
{
  prompt: "Childhood memories of a small hometown",
  genre: "folk",
  mood: "nostalgic",
  theme: "childhood",
  vocal_model: "bark"
}
```
**Expected output**: Personal, narrative lyrics with specific details and imagery

**Sample generated lyrics**:
```
Down the old dirt road where we used to play
Barefoot summers, seemed like yesterday
The creek where we'd swim on those golden days
Those memories still call me in so many ways
```

#### Example 11: Protest Folk
```javascript
{
  prompt: "Standing up for what's right and fighting for change",
  genre: "folk",
  mood: "determined",
  theme: "social justice"
}
```
**Expected output**: Message-driven lyrics with call-to-action themes

### R&B Examples

#### Example 12: Smooth R&B
```javascript
{
  prompt: "Late night thoughts about a special person",
  genre: "r&b",
  mood: "romantic",
  theme: "longing",
  vocal_model: "bark"
}
```
**Expected output**: Smooth, sensual lyrics with emotional depth

**Sample generated lyrics**:
```
Late night, thinking 'bout you
Can't get you off my mind, it's true
Your touch, your smile, the way you move
Got me falling deeper, nothing left to prove
```

#### Example 13: Upbeat R&B
```javascript
{
  prompt: "Confidence and self-love anthem",
  genre: "r&b",
  mood: "confident",
  theme: "self-love"
}
```
**Expected output**: Empowering lyrics with soulful expression

### Indie Examples

#### Example 14: Introspective Indie
```javascript
{
  prompt: "Finding yourself in a new city, feeling lost but hopeful",
  genre: "indie",
  mood: "melancholic",
  theme: "self-discovery",
  ai_provider: "anthropic"
}
```
**Expected output**: Artistic, introspective lyrics with unique perspective

**Sample generated lyrics**:
```
Concrete jungle, faces passing by
Searching for myself beneath this endless sky
Lost in the noise but finding something true
This city's teaching me to start anew
```

#### Example 15: Quirky Indie
```javascript
{
  prompt: "The absurdity and beauty of everyday life",
  genre: "indie",
  mood: "playful",
  theme: "everyday life"
}
```
**Expected output**: Unconventional perspective, creative wordplay

## Genre-Specific Examples

### Pop Genre Deep Dive

**Characteristics**:
- Universal, relatable themes
- Catchy, memorable phrases
- Simple but effective language
- Focus on melody and hook

**Best practices**:
- Keep prompts accessible and broad
- Use moods: happy, romantic, nostalgic, empowering
- Themes: love, friendship, celebration, heartbreak
- Vocal model: Bark (for clarity)

**Sample prompts that work well**:
1. "A song about the excitement of new love"
2. "Dancing all night with friends at a party"
3. "Getting over a breakup and feeling stronger"
4. "Summer vibes and good times"
5. "Believing in yourself and your dreams"

### Rock Genre Deep Dive

**Characteristics**:
- Bold, powerful language
- Themes of rebellion, freedom, strength
- Dynamic range and energy
- Direct, impactful messaging

**Best practices**:
- Use strong, active verbs
- Moods: empowering, angry, rebellious, energetic
- Themes: freedom, struggle, power, defiance
- Vocal model: MusicGen (for energy)

**Sample prompts that work well**:
1. "Breaking free from anything holding you back"
2. "Standing up against injustice"
3. "Overcoming obstacles through sheer determination"
4. "Refusing to give up or back down"
5. "The power of unity and standing together"

### Hip-Hop Genre Deep Dive

**Characteristics**:
- Contemporary vernacular
- Rhythmic, flow-oriented phrasing
- Confidence and authenticity
- Storytelling with modern context

**Best practices**:
- Reference modern experiences
- Moods: confident, reflective, determined, celebratory
- Themes: success, struggle, authenticity, hustle
- AI provider: OpenAI (handles modern language well)
- Vocal model: Bark (for clear delivery)

**Sample prompts that work well**:
1. "Rising from nothing to success through hard work"
2. "Staying true to yourself despite pressure"
3. "Celebrating achievements with the crew"
4. "Reflecting on the journey and lessons learned"
5. "Grinding every day toward your goals"

### Country Genre Deep Dive

**Characteristics**:
- Storytelling focus
- Rural imagery and traditional values
- Personal, relatable narratives
- Specific details and scenarios

**Best practices**:
- Include specific settings and imagery
- Moods: nostalgic, peaceful, romantic, heartfelt
- Themes: rural life, love, family, tradition, home
- Style references: John Denver, Morgan Wallen, etc.
- Vocal model: MusicGen (for that sung quality)

**Sample prompts that work well**:
1. "Growing up in a small town, memories of home"
2. "A summer romance at a bonfire by the lake"
3. "Working the land, simple life, honest living"
4. "Coming home after being away for too long"
5. "Love story set in the heartland"

## Common Workflows

### Workflow 1: Quick Demo Creation

**Goal**: Rapidly capture a melodic idea with lyrics

**Steps**:
1. Hum melody into phone (10 seconds)
2. Upload to Melody-to-Vocals
3. Add minimal prompt + genre
4. Generate with default settings
5. Download and share

**Best for**: Songwriting sessions, capturing inspiration, collaboration

**Example**:
```bash
# Record quick voice memo on phone
# Transfer to computer

curl -X POST http://localhost:8003/melody-to-vocals \
  -F "audio_file=@quick_idea.m4a" \
  -F "prompt=A song about chasing dreams" \
  -F "genre=pop"

# Get result in ~30 seconds, share link with collaborators
```

### Workflow 2: Full Song Development

**Goal**: Create complete song with verses, chorus, bridge

**Steps**:
1. Record verse melody (10s)
2. Generate verse vocals with specific prompt
3. Record chorus melody (8s)
4. Generate chorus with different mood/energy
5. Record bridge melody (6s)
6. Generate bridge vocals
7. Import all sections into DAW
8. Arrange, add instrumentation, mix

**Best for**: Professional production, album work

**Example**:
```javascript
// Verse
const verse = await generateVocalsFromMelody({
  audioFilePath: 'verse_melody.wav',
  prompt: 'Reflecting on a difficult journey',
  genre: 'folk',
  mood: 'reflective'
});

// Chorus
const chorus = await generateVocalsFromMelody({
  audioFilePath: 'chorus_melody.wav',
  prompt: 'Hope and determination to keep going',
  genre: 'folk',
  mood: 'hopeful'
});

// Bridge
const bridge = await generateVocalsFromMelody({
  audioFilePath: 'bridge_melody.wav',
  prompt: 'Breakthrough moment, finding strength',
  genre: 'folk',
  mood: 'empowering'
});

// Combine in DAW
```

### Workflow 3: Genre Exploration

**Goal**: Find the right style for your melody

**Steps**:
1. Record one melody
2. Generate in 3-5 different genres
3. Compare results
4. Choose best fit or hybrid approach

**Best for**: Finding direction, exploring options, creative exploration

**Example**:
```python
# Same melody, different genres
melody_file = 'my_melody.wav'
base_prompt = 'A song about finding freedom'

genres = ['pop', 'rock', 'folk', 'indie', 'country']

results = {}
for genre in genres:
    result = generate_vocals(
        audio_file_path=melody_file,
        prompt=base_prompt,
        genre=genre
    )
    results[genre] = result

# Listen to all versions, pick favorite
```

### Workflow 4: Lyric Brainstorming

**Goal**: Explore different lyrical angles for one melody

**Steps**:
1. Record melody once
2. Create multiple prompts with different themes
3. Generate all versions
4. Compare lyrics
5. Choose best or combine elements

**Best for**: Overcoming writer's block, exploring concepts

**Example**:
```javascript
const melody = 'my_melody.wav';

// Try different angles
const prompts = [
  'A love song about missing someone',
  'A song about cherishing memories',
  'A reflection on time passing',
  'A message to someone far away',
  'A celebration of the time we had'
];

const results = await Promise.all(
  prompts.map(prompt =>
    generateVocalsFromMelody({
      audioFilePath: melody,
      prompt,
      genre: 'pop'
    })
  )
);

// Review all lyrical interpretations
```

### Workflow 5: Vocal Model Comparison

**Goal**: Choose the best vocal synthesis for your track

**Steps**:
1. Generate with Bark (fast, clear)
2. Generate with MusicGen (musical, sung)
3. Compare side-by-side
4. Choose based on style needs

**Best for**: Quality control, professional production

**Example**:
```typescript
// Generate both versions
const barkVersion = await generateVocalsFromMelody({
  audioFilePath: 'melody.wav',
  prompt: 'A heartfelt ballad',
  genre: 'pop',
  vocalModel: 'bark'
});

const musicgenVersion = await generateVocalsFromMelody({
  audioFilePath: 'melody.wav',
  prompt: 'A heartfelt ballad',
  genre: 'pop',
  vocalModel: 'musicgen'
});

// A/B test both in your production
```

### Workflow 6: Iterative Refinement

**Goal**: Perfect your results through iteration

**Steps**:
1. Generate initial version
2. Analyze what's working/not working
3. Adjust parameters (prompt, genre, mood, theme)
4. Regenerate
5. Repeat until satisfied

**Best for**: High-quality output, professional work

**Example iteration**:
```
Iteration 1:
  prompt: "Love song"
  genre: "pop"
  Result: Too generic

Iteration 2:
  prompt: "A love song about unexpected romance"
  genre: "pop"
  mood: "surprised"
  Result: Better but lacks depth

Iteration 3:
  prompt: "Falling in love when you least expect it"
  genre: "indie pop"
  mood: "wonderstruck"
  theme: "unexpected love"
  Result: Perfect! Specific, emotional, authentic
```

## Parameter Combinations

### High Energy Combinations

```javascript
// Rock anthem
{
  genre: "rock",
  mood: "empowering",
  theme: "freedom",
  vocal_model: "musicgen"
}

// EDM/Electronic
{
  genre: "electronic",
  mood: "energetic",
  theme: "celebration",
  vocal_model: "bark"
}

// Hip-hop banger
{
  genre: "hip-hop",
  mood: "confident",
  theme: "success",
  vocal_model: "bark"
}
```

### Emotional/Ballad Combinations

```javascript
// Folk ballad
{
  genre: "folk",
  mood: "nostalgic",
  theme: "memories",
  vocal_model: "bark"
}

// R&B slow jam
{
  genre: "r&b",
  mood: "romantic",
  theme: "longing",
  vocal_model: "bark"
}

// Indie emotional
{
  genre: "indie",
  mood: "melancholic",
  theme: "loss",
  ai_provider: "anthropic",
  vocal_model: "bark"
}
```

### Uplifting Combinations

```javascript
// Pop celebration
{
  genre: "pop",
  mood: "uplifting",
  theme: "celebration",
  vocal_model: "bark"
}

// Country feel-good
{
  genre: "country",
  mood: "happy",
  theme: "simple pleasures",
  vocal_model: "musicgen"
}

// Gospel-inspired soul
{
  genre: "soul",
  mood: "hopeful",
  theme: "faith",
  vocal_model: "bark"
}
```

### Introspective Combinations

```javascript
// Reflective hip-hop
{
  genre: "hip-hop",
  mood: "reflective",
  theme: "personal growth",
  ai_provider: "anthropic",
  vocal_model: "bark"
}

// Singer-songwriter
{
  genre: "folk",
  mood: "introspective",
  theme: "self-discovery",
  vocal_model: "bark"
}

// Alternative indie
{
  genre: "indie",
  mood: "contemplative",
  theme: "life questions",
  ai_provider: "anthropic"
}
```

## Use Case Scenarios

### Scenario 1: Songwriter with Writer's Block

**Challenge**: Has a melody but can't find the right lyrics

**Solution**:
```javascript
// Try multiple thematic approaches
const themes = [
  'personal growth',
  'new beginnings',
  'letting go',
  'finding peace'
];

// Generate versions with each theme
// Use resulting lyrics as inspiration
// Potentially use as-is or modify
```

### Scenario 2: Producer Creating Demo

**Challenge**: Need placeholder vocals for instrumental track

**Solution**:
```javascript
// Quick generation for demo purposes
{
  prompt: "Generic pop lyrics about the track's vibe",
  genre: "pop",
  vocal_model: "bark" // Fast processing
}

// Use for client presentation
// Replace with real vocals later
```

### Scenario 3: Content Creator

**Challenge**: Need unique vocal content for video/podcast

**Solution**:
```javascript
// Create custom intro/outro music
{
  prompt: "Welcome message and exciting introduction",
  genre: "pop",
  mood: "uplifting"
}

// Generate several versions
// Pick best fit for brand
```

### Scenario 4: Music Student Learning

**Challenge**: Understanding lyric structure and songwriting

**Solution**:
```javascript
// Experiment with different genres
// Study how AI interprets prompts
// Learn lyrical conventions
// Practice melody-lyric alignment

// Educational use: Compare outputs across genres
```

### Scenario 5: Live Performer

**Challenge**: Want new material quickly for setlist

**Solution**:
```javascript
// Record melody ideas from rehearsal
// Generate full vocals overnight
// Test in next rehearsal
// Keep best ones for rotation
```

## Before & After

### Example 1: Pop Melody Transformation

**Before (Input)**:
- 12-second hummed melody
- Upbeat, major key
- Simple vocal recording on phone

**Parameters**:
```javascript
{
  prompt: "A song about living your best life",
  genre: "pop",
  mood: "uplifting",
  theme: "celebration"
}
```

**After (Output)**:
```
Audio: Professional pop vocals
Lyrics:
  "Living my best life, feeling so free
  No holding back, just being me
  Dancing through the days, smiling through the nights
  This is my time, everything feels right"

Melody Info:
  - 28 notes detected
  - Key: G major
  - Duration: 12.3 seconds
  - Range: G3 to D5
```

### Example 2: Rock Anthem Transformation

**Before (Input)**:
- 15-second energetic hummed melody
- Driving rhythm, power notes
- Recorded in home studio

**Parameters**:
```javascript
{
  prompt: "Breaking free and taking control",
  genre: "rock",
  mood: "empowering",
  theme: "freedom",
  vocal_model: "musicgen"
}
```

**After (Output)**:
```
Audio: Powerful rock vocals with energy
Lyrics:
  "No more chains, no more lies
  I'm breaking free, I'm gonna rise
  Taking back what's mine tonight
  Standing tall, ready to fight
  This is my time to shine
  Breaking free, this life is mine"

Processing: 52 seconds
Model: MusicGen for sung quality
```

### Example 3: Folk Story Transformation

**Before (Input)**:
- 10-second gentle, melodic humming
- Slow, contemplative pace
- Acoustic feel

**Parameters**:
```javascript
{
  prompt: "Memories of childhood home and family",
  genre: "folk",
  mood: "nostalgic",
  theme: "childhood",
  style: "James Taylor"
}
```

**After (Output)**:
```
Audio: Intimate, storytelling vocals
Lyrics:
  "Old photographs and dusty roads
  Stories that my grandma told
  The house where I grew up still stands
  But time has changed the lay of the land
  Those memories keep calling me back home
  To a place and time I've always known"

Style: Narrative focus, personal details
Vocal: Clear, conversational delivery
```

## Tips for Each Genre

### Pop Tips
- Keep themes universal and relatable
- Use contemporary language
- Focus on hooks and memorable phrases
- Moods: happy, romantic, nostalgic, empowering
- Vocal model: Bark

### Rock Tips
- Bold, powerful language
- Active verbs and strong imagery
- Themes of struggle, freedom, power
- Moods: empowering, angry, rebellious
- Vocal model: MusicGen

### Hip-Hop Tips
- Modern, authentic voice
- Rhythmic phrasing
- Confidence and authenticity
- AI provider: OpenAI works well
- Vocal model: Bark

### Country Tips
- Storytelling with specific details
- Rural/traditional imagery
- Personal narratives
- Include style references
- Vocal model: MusicGen

### Folk Tips
- Personal, intimate stories
- Detailed imagery and scenes
- Acoustic, organic feel
- AI provider: Anthropic for poetry
- Vocal model: Bark

### R&B Tips
- Smooth, sensual language
- Emotional depth
- Romantic or introspective themes
- Moods: romantic, reflective, passionate
- Vocal model: Bark

### Indie Tips
- Artistic, unique perspectives
- Avoid clichés
- Introspective or quirky angles
- AI provider: Anthropic
- Vocal model: Bark

---

**Last Updated**: 2025-10-18

**Note**: All examples are illustrative. Actual AI-generated results will vary based on your specific melody and parameters. Experiment to find what works best for your creative vision!
