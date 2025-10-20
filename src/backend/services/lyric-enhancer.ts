import OpenAI from 'openai';

/**
 * LyricEnhancer Service
 *
 * Transforms mumbled/gibberish freestyle vocals into coherent, professional lyrics
 * while preserving the artist's original high-confidence words.
 *
 * Key Features:
 * - GPT-4 powered lyric enhancement
 * - Syllable-accurate rhythm preservation
 * - Vibe detection from melody and metadata
 * - Real vs gibberish word categorization
 * - Genre-aware vocabulary selection
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Word {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface MIDINote {
  pitch: number;      // MIDI note number (0-127)
  velocity: number;   // Note velocity (0-127)
  start: number;      // Start time in seconds
  duration: number;   // Duration in seconds
}

export interface TrackMetadata {
  key: string;        // Musical key (e.g., "C Major", "A Minor")
  bpm: number;        // Beats per minute
  genre?: string;     // Optional genre (e.g., "hip-hop", "pop")
  mood?: string;      // Optional mood override
}

export interface EnhancementInput {
  transcription: Word[];
  melody: MIDINote[];
  metadata: TrackMetadata;
}

export interface EnhancedLyric {
  word: string;
  syllables: number;
  timestamp: number;
  original: boolean;         // true = user's word, false = AI filled
  confidence: number;
  alternatives?: string[];   // AI suggestions
}

export interface EnhancedLyrics {
  lyrics: EnhancedLyric[];
  vibe: string;
  overallConfidence: number;
  stats: {
    totalWords: number;
    originalWords: number;
    aiEnhanced: number;
    syllableMatchRate: number;
  };
}

export interface WordCategories {
  real: Word[];
  gibberish: Word[];
  ambiguous: Word[];
}

export interface VibeDescription {
  energy: string;
  emotion: string;
  genre: string;
  description: string;
}

export interface EnhancementContext {
  categories: WordCategories;
  vibe: VibeDescription;
  metadata: TrackMetadata;
  melody: MIDINote[];
}

export interface GPT4LyricResult {
  lyrics: Array<{
    word: string;
    syllables: number;
    timestamp: number;
    original: boolean;
    confidence: number;
    alternatives?: string[];
  }>;
  vibe: string;
  reasoning: string;
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

export class LyricEnhancer {
  private openai: OpenAI;
  private dictionaryCache: Set<string>;

  constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
    this.dictionaryCache = new Set();
    this.initializeDictionary();
  }

  /**
   * Main entry point for lyric enhancement
   */
  async enhanceGibberish(input: EnhancementInput): Promise<EnhancedLyrics> {
    console.log('Starting lyric enhancement process...');

    // Step 1: Categorize words as real vs gibberish
    const categories = this.categorizeWords(input.transcription);
    console.log(`Categorized: ${categories.real.length} real, ${categories.gibberish.length} gibberish, ${categories.ambiguous.length} ambiguous`);

    // Step 2: Detect vibe from melody and metadata
    const vibe = this.detectVibe(input.melody, input.metadata);
    console.log(`Detected vibe: ${vibe.description}`);

    // Step 3: Create enhancement context
    const context: EnhancementContext = {
      categories,
      vibe,
      metadata: input.metadata,
      melody: input.melody,
    };

    // Step 4: Use GPT-4 to enhance lyrics
    const gpt4Result = await this.aiEnhancement(context);

    // Step 5: Validate syllable matching
    const syllableMatchRate = this.validateSyllableMatching(
      input.transcription,
      gpt4Result.lyrics
    );

    // Step 6: Calculate overall confidence
    const overallConfidence = this.calculateLyricConfidence(gpt4Result.lyrics);

    // Step 7: Compile results
    const enhancedLyrics: EnhancedLyrics = {
      lyrics: gpt4Result.lyrics,
      vibe: gpt4Result.vibe,
      overallConfidence,
      stats: {
        totalWords: gpt4Result.lyrics.length,
        originalWords: gpt4Result.lyrics.filter(l => l.original).length,
        aiEnhanced: gpt4Result.lyrics.filter(l => !l.original).length,
        syllableMatchRate,
      },
    };

    console.log(`Enhancement complete: ${enhancedLyrics.stats.aiEnhanced} words enhanced`);
    return enhancedLyrics;
  }

  /**
   * Categorize words as real, gibberish, or ambiguous
   */
  categorizeWords(transcription: Word[]): WordCategories {
    const real: Word[] = [];
    const gibberish: Word[] = [];
    const ambiguous: Word[] = [];

    for (const word of transcription) {
      const cleanWord = word.word.toLowerCase().replace(/[^a-z]/g, '');

      // High confidence + dictionary word = REAL
      if (word.confidence > 0.8 && this.isDictionaryWord(cleanWord)) {
        real.push(word);
      }
      // Low confidence OR obvious gibberish = GIBBERISH
      else if (word.confidence < 0.5 || this.isGibberish(cleanWord)) {
        gibberish.push(word);
      }
      // Middle ground - let GPT-4 decide
      else {
        // Conservative approach: treat ambiguous as gibberish for AI enhancement
        ambiguous.push(word);
        gibberish.push(word); // Also add to gibberish for replacement
      }
    }

    return { real, gibberish, ambiguous };
  }

  /**
   * Detect vibe from melody and metadata
   */
  detectVibe(melody: MIDINote[], metadata: TrackMetadata): VibeDescription {
    if (melody.length === 0) {
      return {
        energy: 'moderate',
        emotion: 'neutral',
        genre: metadata.genre || 'general',
        description: 'moderate, neutral',
      };
    }

    // Calculate pitch statistics
    const pitches = melody.map(n => n.pitch);
    const avgPitch = pitches.reduce((sum, p) => sum + p, 0) / pitches.length;
    const pitchRange = Math.max(...pitches) - Math.min(...pitches);
    const bpm = metadata.bpm;

    // Determine energy from tempo
    let energy: string;
    if (bpm > 140) energy = 'high-energy';
    else if (bpm < 80) energy = 'slow';
    else energy = 'mid-tempo';

    // Determine emotion from pitch characteristics
    let emotion: string;
    if (pitchRange > 12) {
      emotion = 'expressive, dynamic';
    } else if (pitchRange < 5) {
      emotion = 'monotone, focused';
    } else {
      emotion = 'smooth, controlled';
    }

    // Add pitch register context
    if (avgPitch > 72) {
      emotion += ', bright';
    } else if (avgPitch < 60) {
      emotion += ', dark';
    }

    // Compile description
    let description = `${energy}, ${emotion}`;
    if (metadata.genre) {
      description += `, ${metadata.genre}`;
    }
    if (metadata.mood) {
      description += `, ${metadata.mood}`;
    }

    return {
      energy,
      emotion,
      genre: metadata.genre || 'general',
      description,
    };
  }

  /**
   * GPT-4 powered lyric enhancement
   */
  async aiEnhancement(context: EnhancementContext): Promise<GPT4LyricResult> {
    const prompt = this.buildEnhancementPrompt(context);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      // Validate and return
      return {
        lyrics: result.lyrics || [],
        vibe: result.vibe || context.vibe.description,
        reasoning: result.reasoning || 'No reasoning provided',
      };
    } catch (error) {
      console.error('GPT-4 enhancement error:', error);
      throw new Error(`AI enhancement failed: ${error.message}`);
    }
  }

  /**
   * Match syllables between original and replacement
   */
  matchSyllables(original: string, replacement: string): number {
    const originalCount = this.countSyllables(original);
    const replacementCount = this.countSyllables(replacement);

    // Return similarity score (1.0 = perfect match)
    if (originalCount === 0 && replacementCount === 0) return 1.0;
    if (originalCount === 0 || replacementCount === 0) return 0.0;

    const diff = Math.abs(originalCount - replacementCount);
    return Math.max(0, 1 - (diff / Math.max(originalCount, replacementCount)));
  }

  /**
   * Calculate overall lyric confidence score
   */
  calculateLyricConfidence(enhanced: EnhancedLyric[]): number {
    if (enhanced.length === 0) return 0;

    // Weight original words higher than AI-generated
    let totalWeightedConfidence = 0;
    let totalWeight = 0;

    for (const lyric of enhanced) {
      const weight = lyric.original ? 1.5 : 1.0; // Original words weighted 50% higher
      totalWeightedConfidence += lyric.confidence * weight;
      totalWeight += weight;
    }

    return totalWeightedConfidence / totalWeight;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Build the GPT-4 enhancement prompt
   */
  private buildEnhancementPrompt(context: EnhancementContext): string {
    const { categories, vibe, metadata } = context;

    // Build transcription with markers
    const transcriptionText = categories.real
      .concat(categories.gibberish)
      .concat(categories.ambiguous)
      .sort((a, b) => a.start - b.start)
      .map(w => {
        const isReal = categories.real.includes(w);
        const marker = isReal ? '[KEEP]' : '[REPLACE]';
        return `${marker} "${w.word}" (${this.countSyllables(w.word)} syllables, ${w.start.toFixed(2)}s)`;
      })
      .join('\n');

    return `You are an expert lyricist. The artist freestyled a melody with these words:

${transcriptionText}

RULES:
1. NEVER change words marked [KEEP] - these are clear, high-confidence words
2. Replace words marked [REPLACE] with coherent lyrics that:
   - Match syllable count EXACTLY (critical for rhythm)
   - Fit the melody's emotional tone: ${vibe.description}
   - Connect logically with surrounding [KEEP] words
   - Maintain natural speech rhythm and flow
3. Genre: ${vibe.genre} - use genre-appropriate vocabulary and slang
4. Key: ${metadata.key}, BPM: ${metadata.bpm} - match the energy level
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
    },
    {
      "word": "free",
      "syllables": 1,
      "timestamp": 1.5,
      "original": true,
      "confidence": 0.95,
      "alternatives": []
    }
  ],
  "vibe": "energetic, uplifting, hip-hop",
  "reasoning": "Chose 'feeling' to match 2 syllables and connect 'running' with 'free' for an uplifting message matching the fast tempo."
}`;
  }

  /**
   * System prompt for GPT-4
   */
  private getSystemPrompt(): string {
    return `You are an expert lyricist and songwriter. Your job is to enhance freestyle vocal transcriptions by replacing gibberish and mumbles with coherent, meaningful lyrics.

Your priorities:
1. SYLLABLE ACCURACY - rhythm is everything
2. PRESERVE ORIGINAL WORDS - never change high-confidence words
3. CONTEXT AWARENESS - new words must flow with kept words
4. GENRE CONSISTENCY - match the artist's style
5. NATURAL FLOW - avoid awkward phrasing

Always return valid JSON with the exact structure requested.`;
  }

  /**
   * Validate syllable matching across all replacements
   */
  private validateSyllableMatching(
    original: Word[],
    enhanced: EnhancedLyric[]
  ): number {
    if (enhanced.length === 0) return 1.0;

    let matches = 0;
    let total = 0;

    for (let i = 0; i < Math.min(original.length, enhanced.length); i++) {
      const origSyllables = this.countSyllables(original[i].word);
      const enhSyllables = enhanced[i].syllables;

      if (origSyllables === enhSyllables) {
        matches++;
      }
      total++;
    }

    return total > 0 ? matches / total : 1.0;
  }

  /**
   * Count syllables in a word
   * Uses a simple vowel-group counting algorithm
   */
  private countSyllables(word: string): number {
    if (!word || word.length === 0) return 0;

    const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
    if (cleaned.length === 0) return 1;

    // Special cases
    if (cleaned.length <= 2) return 1;

    // Count vowel groups
    let count = 0;
    let previousWasVowel = false;

    for (const char of cleaned) {
      const isVowel = 'aeiouy'.includes(char);

      if (isVowel && !previousWasVowel) {
        count++;
      }

      previousWasVowel = isVowel;
    }

    // Adjust for silent 'e'
    if (cleaned.endsWith('e') && count > 1) {
      count--;
    }

    // Ensure at least 1 syllable
    return Math.max(1, count);
  }

  /**
   * Check if word is in dictionary
   */
  private isDictionaryWord(word: string): boolean {
    if (!word || word.length === 0) return false;

    const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');

    // Check cache first
    if (this.dictionaryCache.has(cleaned)) return true;

    // Basic English word patterns (common words)
    const commonWords = this.getCommonWords();
    return commonWords.has(cleaned);
  }

  /**
   * Detect if word is gibberish
   */
  private isGibberish(word: string): boolean {
    if (!word || word.length === 0) return true;

    const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');

    // Too short to be gibberish
    if (cleaned.length <= 2) return false;

    // Check for excessive consonant clusters (more than 3 in a row)
    if (/[bcdfghjklmnpqrstvwxz]{4,}/.test(cleaned)) return true;

    // Check for no vowels
    if (!/[aeiouy]/.test(cleaned)) return true;

    // Check for repeating patterns (e.g., "lalala")
    if (/(.{2,})\1{2,}/.test(cleaned)) return true;

    // Check for nonsense patterns common in Whisper output
    const gibberishPatterns = [
      /^(uh|um|ah|eh|mm|hm|er)+$/,
      /^[aeiou]{4,}$/,
      /^(na|la|da|ba){3,}$/,
    ];

    return gibberishPatterns.some(pattern => pattern.test(cleaned));
  }

  /**
   * Initialize basic dictionary
   */
  private initializeDictionary(): void {
    const common = this.getCommonWords();
    this.dictionaryCache = new Set(common);
  }

  /**
   * Get common English words for dictionary checking
   * In production, this would load from a comprehensive dictionary file
   */
  private getCommonWords(): Set<string> {
    return new Set([
      // Common articles, pronouns, prepositions
      'i', 'me', 'my', 'mine', 'we', 'us', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her',
      'it', 'its', 'they', 'them', 'their', 'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of',
      'with', 'by', 'from', 'up', 'down', 'out', 'off', 'over', 'under', 'about', 'as', 'into',

      // Common verbs
      'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'go', 'goes', 'went',
      'gone', 'get', 'got', 'make', 'made', 'take', 'took', 'see', 'saw', 'seen', 'come', 'came',
      'know', 'knew', 'think', 'thought', 'say', 'said', 'feel', 'felt', 'want', 'run', 'running',

      // Common adjectives
      'good', 'bad', 'big', 'small', 'great', 'little', 'new', 'old', 'high', 'low', 'long', 'short',
      'hot', 'cold', 'fast', 'slow', 'right', 'wrong', 'free', 'real', 'true', 'false',

      // Common nouns
      'time', 'year', 'day', 'way', 'man', 'thing', 'woman', 'life', 'child', 'world', 'school',
      'state', 'family', 'student', 'group', 'country', 'problem', 'hand', 'part', 'place', 'case',
      'week', 'company', 'system', 'program', 'question', 'work', 'government', 'number', 'night',
      'point', 'home', 'water', 'room', 'mother', 'area', 'money', 'story', 'fact', 'month', 'lot',

      // Hip-hop/music specific
      'yeah', 'yo', 'uh', 'ay', 'oh', 'hey', 'word', 'flow', 'beat', 'track', 'mic', 'money',
      'feeling', 'vibe', 'style', 'game', 'move', 'dance', 'music', 'song', 'sound', 'rhythm',
      'love', 'hate', 'dream', 'pain', 'soul', 'heart', 'mind', 'eyes', 'night', 'light',
    ]);
  }
}

// ============================================================================
// EXPORT DEFAULT INSTANCE
// ============================================================================

export default LyricEnhancer;
