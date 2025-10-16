/**
 * AI-Powered Rhyme Suggestions Service
 *
 * Provides real-time rhyme suggestions during freestyle recording
 * Unique feature not found in Pro Tools or Logic Pro
 */

interface RhymeSuggestion {
  word: string;
  type: 'perfect' | 'near' | 'slant' | 'assonance';
  syllables: number;
  score: number;
}

interface RhymeContext {
  lastWords: string[];
  currentLine: string;
  genre?: string;
  mood?: string;
}

/**
 * Phonetic similarity scoring for rhyme detection
 */
function getPhoneticScore(word1: string, word2: string): number {
  const w1 = word1.toLowerCase();
  const w2 = word2.toLowerCase();

  // Perfect rhyme: same ending sounds
  const ending1 = w1.slice(-3);
  const ending2 = w2.slice(-3);

  if (ending1 === ending2) return 1.0;

  // Near rhyme: similar vowel sounds
  const vowels1 = w1.match(/[aeiou]/g) || [];
  const vowels2 = w2.match(/[aeiou]/g) || [];

  if (vowels1.length > 0 && vowels2.length > 0) {
    const lastVowel1 = vowels1[vowels1.length - 1];
    const lastVowel2 = vowels2[vowels2.length - 1];

    if (lastVowel1 === lastVowel2) return 0.7;
  }

  // Slant rhyme: similar consonant sounds
  const consonants1 = w1.match(/[^aeiou]/g) || [];
  const consonants2 = w2.match(/[^aeiou]/g) || [];

  if (consonants1.length > 0 && consonants2.length > 0) {
    const lastConsonant1 = consonants1[consonants1.length - 1];
    const lastConsonant2 = consonants2[consonants2.length - 1];

    if (lastConsonant1 === lastConsonant2) return 0.5;
  }

  return 0;
}

/**
 * Count syllables in a word (simple heuristic)
 */
function countSyllables(word: string): number {
  word = word.toLowerCase().trim();
  if (word.length === 0) return 0;

  // Count vowel groups
  const vowelGroups = word.match(/[aeiouy]+/g) || [];
  let count = vowelGroups.length;

  // Adjust for silent e
  if (word.endsWith('e')) {
    count--;
  }

  // Ensure at least one syllable
  return Math.max(1, count);
}

/**
 * Common rap/hip-hop vocabulary by category
 */
const vocabularyBank = {
  emotions: [
    'love', 'hate', 'fear', 'hope', 'pain', 'joy', 'rage', 'peace',
    'dream', 'fight', 'win', 'lose', 'rise', 'fall', 'shine', 'fade',
  ],
  actions: [
    'run', 'fly', 'jump', 'climb', 'move', 'break', 'make', 'take',
    'give', 'get', 'push', 'pull', 'stand', 'walk', 'talk', 'rock',
  ],
  descriptors: [
    'real', 'fake', 'cold', 'bold', 'gold', 'soul', 'whole', 'free',
    'wild', 'mild', 'fire', 'higher', 'wire', 'desire', 'inspire',
  ],
  locations: [
    'street', 'beat', 'seat', 'heat', 'city', 'block', 'top', 'rock',
    'place', 'space', 'face', 'race', 'ground', 'sound', 'town', 'crown',
  ],
};

/**
 * Get rhyme suggestions for a given word
 */
export function getRhymeSuggestions(
  targetWord: string,
  context?: RhymeContext,
  maxSuggestions: number = 10
): RhymeSuggestion[] {
  if (!targetWord || targetWord.length < 2) {
    return [];
  }

  const target = targetWord.toLowerCase().trim();
  const suggestions: RhymeSuggestion[] = [];

  // Collect all words from vocabulary
  const allWords = Object.values(vocabularyBank).flat();

  // Score each word for rhyming potential
  for (const word of allWords) {
    if (word === target) continue; // Don't suggest the same word

    const score = getPhoneticScore(target, word);
    if (score > 0.4) {
      // Only include decent rhymes
      let type: RhymeSuggestion['type'] = 'slant';
      if (score >= 0.9) type = 'perfect';
      else if (score >= 0.7) type = 'near';
      else if (score >= 0.5) type = 'assonance';

      suggestions.push({
        word,
        type,
        syllables: countSyllables(word),
        score,
      });
    }
  }

  // Sort by score (best rhymes first)
  suggestions.sort((a, b) => b.score - a.score);

  // If context is provided, boost relevant suggestions
  if (context) {
    const currentWords = context.currentLine.toLowerCase().split(/\s+/);
    suggestions.forEach((suggestion) => {
      // Avoid recently used words
      if (context.lastWords.some((w) => w.toLowerCase() === suggestion.word)) {
        suggestion.score *= 0.5;
      }

      // Boost words that fit current context
      if (currentWords.some((w) => getPhoneticScore(w, suggestion.word) > 0.3)) {
        suggestion.score *= 1.2;
      }
    });

    // Re-sort after context adjustments
    suggestions.sort((a, b) => b.score - a.score);
  }

  return suggestions.slice(0, maxSuggestions);
}

/**
 * Get next line suggestions based on current context
 */
export function getNextLineSuggestions(context: RhymeContext): string[] {
  const suggestions: string[] = [];

  if (context.lastWords.length === 0) {
    return suggestions;
  }

  const lastWord = context.lastWords[context.lastWords.length - 1];
  const rhymes = getRhymeSuggestions(lastWord, context, 5);

  // Generate simple line suggestions
  for (const rhyme of rhymes) {
    // Simple templates for line suggestions
    const templates = [
      `And I ${rhyme.word}`,
      `Can't ${rhyme.word}`,
      `I ${rhyme.word}`,
      `We ${rhyme.word}`,
      `They ${rhyme.word}`,
    ];

    suggestions.push(...templates.map((t) => t + '...'));
  }

  return suggestions.slice(0, 3);
}

/**
 * Analyze rhyme scheme of completed lyrics
 */
export function analyzeRhymeScheme(lines: string[]): {
  scheme: string;
  quality: number;
  patterns: string[];
} {
  if (lines.length < 2) {
    return { scheme: 'none', quality: 0, patterns: [] };
  }

  const lastWords = lines.map((line) => {
    const words = line.trim().split(/\s+/);
    return words[words.length - 1]?.toLowerCase().replace(/[^a-z]/g, '') || '';
  });

  // Detect rhyme scheme (AABB, ABAB, etc.)
  const rhymeMap = new Map<string, string>();
  let currentLetter = 'A';
  const schemePattern: string[] = [];

  for (const word of lastWords) {
    if (!word) {
      schemePattern.push('X');
      continue;
    }

    // Check if this word rhymes with any previous word
    let foundRhyme = false;
    for (const [previousWord, letter] of rhymeMap.entries()) {
      if (getPhoneticScore(word, previousWord) >= 0.7) {
        schemePattern.push(letter);
        foundRhyme = true;
        break;
      }
    }

    if (!foundRhyme) {
      rhymeMap.set(word, currentLetter);
      schemePattern.push(currentLetter);
      currentLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1);
    }
  }

  // Calculate quality score
  const rhymeCount = schemePattern.filter((l, i) => {
    return schemePattern.some((l2, i2) => i !== i2 && l === l2 && l !== 'X');
  }).length;

  const quality = rhymeCount / Math.max(lastWords.length, 1);

  // Identify common patterns
  const patterns: string[] = [];
  const scheme = schemePattern.join('');

  if (scheme.match(/AABB/)) patterns.push('Couplets (AABB)');
  if (scheme.match(/ABAB/)) patterns.push('Alternating (ABAB)');
  if (scheme.match(/AAAA/)) patterns.push('Monorhyme (AAAA)');
  if (scheme.match(/ABBA/)) patterns.push('Enclosed (ABBA)');

  return {
    scheme: schemePattern.join(''),
    quality,
    patterns: patterns.length > 0 ? patterns : ['Freestyle/No Pattern'],
  };
}

/**
 * Get real-time word suggestions as user types
 */
export function getWordCompletions(
  partialWord: string,
  context?: RhymeContext
): string[] {
  if (!partialWord || partialWord.length < 2) {
    return [];
  }

  const partial = partialWord.toLowerCase();
  const allWords = Object.values(vocabularyBank).flat();

  const matches = allWords
    .filter((word) => word.startsWith(partial) && word !== partial)
    .slice(0, 5);

  // If we have context, also suggest rhyming words that start with the partial
  if (context && context.lastWords.length > 0) {
    const lastWord = context.lastWords[context.lastWords.length - 1];
    const rhymes = getRhymeSuggestions(lastWord, context, 10);

    const rhymingMatches = rhymes
      .map((r) => r.word)
      .filter((word) => word.startsWith(partial) && word !== partial)
      .slice(0, 3);

    // Merge and deduplicate
    const combined = [...new Set([...rhymingMatches, ...matches])];
    return combined.slice(0, 5);
  }

  return matches;
}

export default {
  getRhymeSuggestions,
  getNextLineSuggestions,
  analyzeRhymeScheme,
  getWordCompletions,
};
