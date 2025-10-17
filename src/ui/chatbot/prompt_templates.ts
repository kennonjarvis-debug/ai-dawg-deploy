/**
 * Prompt Templates for DAWG AI Chatbot
 * Templates for generating lyrics, melodies, and compositions
 */

export interface PromptTemplate {
  name: string;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
  build: (params: Record<string, any>) => string;
}

/**
 * Lyric generation prompt template
 */
export const LYRIC_GENERATION_TEMPLATE: PromptTemplate = {
  name: 'Lyric Generation',
  description: 'Generate song lyrics based on genre, mood, and theme',
  requiredFields: ['genre', 'mood'],
  optionalFields: ['theme', 'section', 'lineCount'],
  build: (params) => {
    const { genre, mood, theme, section = 'verse', lineCount = 8 } = params;

    return `Generate ${genre} lyrics with a ${mood} mood${theme ? ` about ${theme}` : ''} for a ${section}. Create ${lineCount} lines.`;
  },
};

/**
 * Melody generation prompt template
 */
export const MELODY_GENERATION_TEMPLATE: PromptTemplate = {
  name: 'Melody Generation',
  description: 'Generate melody based on genre, mood, and key',
  requiredFields: ['genre', 'mood'],
  optionalFields: ['key', 'tempo', 'bars'],
  build: (params) => {
    const { genre, mood, key = 'C', tempo = 120, bars = 8 } = params;

    return `Generate a ${genre} melody with ${mood} mood in ${key} at ${tempo} BPM for ${bars} bars.`;
  },
};

/**
 * Topline generation prompt template
 */
export const TOPLINE_GENERATION_TEMPLATE: PromptTemplate = {
  name: 'Topline Generation',
  description: 'Generate vocal melody and lyrics (topline)',
  requiredFields: ['genre', 'mood'],
  optionalFields: ['key', 'section', 'theme'],
  build: (params) => {
    const { genre, mood, key = 'C', section = 'chorus', theme } = params;

    return `Generate a ${genre} ${section} topline with ${mood} mood in ${key}${theme ? `, about ${theme}` : ''}.`;
  },
};

/**
 * Full song generation prompt template
 */
export const FULL_SONG_TEMPLATE: PromptTemplate = {
  name: 'Full Song Generation',
  description: 'Generate complete song with all instruments',
  requiredFields: ['genre', 'mood'],
  optionalFields: ['key', 'tempo', 'structure'],
  build: (params) => {
    const { genre, mood, key = 'C', tempo = 120, structure = 'simple' } = params;

    return `Generate a complete ${genre} song with ${mood} mood in ${key} at ${tempo} BPM with ${structure} structure.`;
  },
};

/**
 * Sample prompts for quick generation
 */
export const SAMPLE_PROMPTS = {
  lyrics: [
    {
      label: 'Sad Love Song Verse',
      prompt: 'Generate pop lyrics with a sad mood about heartbreak for a verse. Create 8 lines.',
      params: { genre: 'pop', mood: 'sad', theme: 'heartbreak', section: 'verse', lineCount: 8 },
    },
    {
      label: 'Upbeat Party Chorus',
      prompt: 'Generate hip-hop lyrics with an energetic mood about partying for a chorus. Create 4 lines.',
      params: { genre: 'hip-hop', mood: 'energetic', theme: 'party', section: 'chorus', lineCount: 4 },
    },
    {
      label: 'Chill Lofi Lyrics',
      prompt: 'Generate lofi lyrics with a chill mood about summer for a verse. Create 6 lines.',
      params: { genre: 'lofi', mood: 'chill', theme: 'summer', section: 'verse', lineCount: 6 },
    },
  ],

  melodies: [
    {
      label: 'Happy Pop Melody',
      prompt: 'Generate a pop melody with happy mood in C at 120 BPM for 8 bars.',
      params: { genre: 'pop', mood: 'happy', key: 'C', tempo: 120, bars: 8 },
    },
    {
      label: 'Dark EDM Drop',
      prompt: 'Generate an EDM melody with dark mood in A minor at 128 BPM for 16 bars.',
      params: { genre: 'edm', mood: 'dark', key: 'Am', tempo: 128, bars: 16 },
    },
    {
      label: 'Jazzy Lofi Hook',
      prompt: 'Generate a lofi melody with dreamy mood in D at 85 BPM for 4 bars.',
      params: { genre: 'lofi', mood: 'dreamy', key: 'D', tempo: 85, bars: 4 },
    },
  ],

  toplines: [
    {
      label: 'Catchy Pop Chorus',
      prompt: 'Generate a pop chorus topline with upbeat mood in G.',
      params: { genre: 'pop', mood: 'upbeat', key: 'G', section: 'chorus' },
    },
    {
      label: 'R&B Verse Topline',
      prompt: 'Generate an r&b verse topline with romantic mood in E major.',
      params: { genre: 'r&b', mood: 'romantic', key: 'E', section: 'verse' },
    },
    {
      label: 'Rock Bridge Melody',
      prompt: 'Generate a rock bridge topline with energetic mood in D.',
      params: { genre: 'rock', mood: 'energetic', key: 'D', section: 'bridge' },
    },
  ],

  fullSongs: [
    {
      label: 'Happy Pop Song',
      prompt: 'Generate a complete pop song with happy mood in C at 120 BPM with simple structure.',
      params: { genre: 'pop', mood: 'happy', key: 'C', tempo: 120, structure: 'simple' },
    },
    {
      label: 'Chill Lofi Beat',
      prompt: 'Generate a complete lofi song with chill mood in D at 85 BPM with standard structure.',
      params: { genre: 'lofi', mood: 'chill', key: 'D', tempo: 85, structure: 'standard' },
    },
    {
      label: 'Epic EDM Track',
      prompt: 'Generate a complete EDM song with dark mood in A minor at 128 BPM with complex structure.',
      params: { genre: 'edm', mood: 'dark', key: 'Am', tempo: 128, structure: 'complex' },
    },
  ],
};

/**
 * Feature information templates
 */
export const FEATURE_INFO = {
  autotopline: {
    name: 'AutoTopline',
    description: 'AI-powered vocal melody and lyric generation',
    features: [
      'Generate catchy vocal melodies',
      'Write genre-appropriate lyrics',
      'Combine melody and lyrics into complete toplines',
      'Support for verse, chorus, bridge, etc.',
      'Multiple genre and mood options',
    ],
    examples: [
      'Create a pop chorus with upbeat mood',
      'Generate an R&B verse about love',
      'Make a rock bridge with energetic feel',
    ],
  },

  'voice clone': {
    name: 'Voice Cloning',
    description: 'Clone your voice for singing and speaking',
    features: [
      'Clone voice from 1-3 minutes of audio',
      'Synthesize speech with your cloned voice',
      'Sing melodies with your voice',
      'Apply to lyrics and toplines',
      'Support for multiple voice models',
    ],
    examples: [
      'Upload voice samples to create model',
      'Generate speech from text',
      'Sing a melody with your cloned voice',
    ],
  },

  'full composer': {
    name: 'Full Composer',
    description: 'Generate complete multi-instrument songs',
    features: [
      'Create full instrumental arrangements',
      'Drums, bass, chords, melody, synth',
      'Professional song structures',
      'Multiple genre support',
      'Export as MIDI',
    ],
    examples: [
      'Generate a complete pop song',
      'Create a lofi beat with all instruments',
      'Make an EDM track with build-ups and drops',
    ],
  },

  'lyric engine': {
    name: 'Lyric Engine',
    description: 'AI-powered lyric generation with GPT-4',
    features: [
      'Generate lyrics for any genre',
      'Theme and mood customization',
      'Verse, chorus, bridge sections',
      'Rhyme scheme control',
      'Creative and natural language',
    ],
    examples: [
      'Write a sad love song verse',
      'Create an upbeat party chorus',
      'Generate meaningful bridge lyrics',
    ],
  },
};

/**
 * Help templates for common questions
 */
export const HELP_TEMPLATES = {
  getting_started: `Welcome to DAWG AI! 🎵

I can help you:
- Generate lyrics, melodies, and complete songs
- Clone your voice for singing
- Answer questions about features
- Show examples and previews

Try asking:
- "Make me a sad pop chorus"
- "Generate lofi lyrics about summer"
- "Create a happy melody in C"
- "What is AutoTopline?"`,

  generation_tips: `Generation Tips:

**For Best Results:**
- Specify genre (pop, rock, EDM, lofi, etc.)
- Choose a mood (happy, sad, energetic, chill)
- Pick a key if you have one in mind
- Be specific about sections (verse, chorus, bridge)

**Example Prompts:**
- "Write sad lyrics about heartbreak for a verse"
- "Create an upbeat pop melody in G"
- "Generate a chill lofi chorus"`,

  voice_cloning_guide: `Voice Cloning Guide:

**Steps:**
1. Upload 1-3 minutes of clear audio samples
2. AI creates your voice model (takes ~2 min)
3. Generate speech or singing with your voice
4. Apply to melodies and lyrics

**Tips:**
- Use clean audio (no background noise)
- Record in a quiet environment
- Speak/sing clearly and naturally
- Multiple samples = better quality`,
};

/**
 * Build a prompt from a template
 */
export function buildPrompt(template: PromptTemplate, params: Record<string, any>): string {
  // Validate required fields
  for (const field of template.requiredFields) {
    if (!params[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return template.build(params);
}

/**
 * Parse a natural language prompt into structured parameters
 */
export function parseNaturalPrompt(prompt: string): Record<string, any> {
  const params: Record<string, any> = {};
  const lower = prompt.toLowerCase();

  // Extract genre
  const genres = ['pop', 'rock', 'jazz', 'edm', 'lofi', 'hip-hop', 'r&b', 'country', 'blues', 'funk'];
  for (const genre of genres) {
    if (lower.includes(genre)) {
      params.genre = genre;
      break;
    }
  }

  // Extract mood
  const moods = ['happy', 'sad', 'energetic', 'chill', 'dark', 'dreamy', 'angry', 'romantic', 'upbeat', 'melancholic'];
  for (const mood of moods) {
    if (lower.includes(mood)) {
      params.mood = mood;
      break;
    }
  }

  // Extract section
  const sections = ['verse', 'chorus', 'bridge', 'intro', 'outro', 'pre-chorus'];
  for (const section of sections) {
    if (lower.includes(section)) {
      params.section = section;
      break;
    }
  }

  // Extract key
  const keyMatch = lower.match(/\b([a-g](?:#|b)?\s*(?:major|minor)?)\b/i);
  if (keyMatch) {
    params.key = keyMatch[1].trim();
  }

  // Extract theme
  const themes = ['love', 'heartbreak', 'party', 'summer', 'winter', 'journey', 'freedom'];
  for (const theme of themes) {
    if (lower.includes(theme)) {
      params.theme = theme;
      break;
    }
  }

  return params;
}
