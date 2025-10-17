/**
 * Intent Recognition for DAWG AI Chatbot
 * Detects user intentions from natural language input
 */

export enum ChatIntent {
  // Information intents
  FEATURE_INQUIRY = 'feature_inquiry',
  HOW_TO = 'how_to',
  GENERAL_HELP = 'general_help',

  // Generation intents
  GENERATE_LYRICS = 'generate_lyrics',
  GENERATE_MELODY = 'generate_melody',
  GENERATE_TOPLINE = 'generate_topline',
  GENERATE_FULL_SONG = 'generate_full_song',
  CLONE_VOICE = 'clone_voice',

  // Playback intents
  PLAY_SAMPLE = 'play_sample',
  SHOW_EXAMPLE = 'show_example',

  // Conversation
  GREETING = 'greeting',
  THANKS = 'thanks',
  UNKNOWN = 'unknown',
}

export interface IntentMatch {
  intent: ChatIntent;
  confidence: number;
  entities: Record<string, any>;
}

export interface IntentPattern {
  keywords: string[];
  phrases: string[];
  entities?: string[];
}

/**
 * Intent patterns for matching user input
 */
const INTENT_PATTERNS: Record<ChatIntent, IntentPattern> = {
  [ChatIntent.FEATURE_INQUIRY]: {
    keywords: ['what is', 'tell me about', 'explain', 'feature', 'can you'],
    phrases: [
      'what is autotopline',
      'what is voice clone',
      'what features',
      'what can',
      'tell me about',
    ],
    entities: ['feature_name'],
  },

  [ChatIntent.HOW_TO]: {
    keywords: ['how to', 'how do i', 'how can i', 'tutorial', 'guide'],
    phrases: [
      'how to use',
      'how do i make',
      'show me how',
      'tutorial for',
    ],
  },

  [ChatIntent.GENERAL_HELP]: {
    keywords: ['help', 'stuck', 'confused', 'don\'t understand'],
    phrases: [
      'i need help',
      'can you help',
      'i\'m stuck',
    ],
  },

  [ChatIntent.GENERATE_LYRICS]: {
    keywords: ['lyrics', 'words', 'write', 'song text'],
    phrases: [
      'write lyrics',
      'generate lyrics',
      'make lyrics',
      'create words',
      'song lyrics',
    ],
    entities: ['genre', 'mood', 'theme'],
  },

  [ChatIntent.GENERATE_MELODY]: {
    keywords: ['melody', 'tune', 'notes', 'musical line'],
    phrases: [
      'create melody',
      'generate melody',
      'make a melody',
      'write a tune',
    ],
    entities: ['genre', 'mood', 'key'],
  },

  [ChatIntent.GENERATE_TOPLINE]: {
    keywords: ['topline', 'vocal melody', 'hook'],
    phrases: [
      'create topline',
      'generate topline',
      'make a hook',
      'vocal melody',
      'chorus melody',
      'verse melody',
    ],
    entities: ['genre', 'mood', 'section'],
  },

  [ChatIntent.GENERATE_FULL_SONG]: {
    keywords: ['song', 'track', 'composition', 'full'],
    phrases: [
      'make me a song',
      'create a track',
      'generate a song',
      'full composition',
      'complete song',
    ],
    entities: ['genre', 'mood', 'structure'],
  },

  [ChatIntent.CLONE_VOICE]: {
    keywords: ['voice clone', 'clone voice', 'clone my voice', 'voice model'],
    phrases: [
      'clone voice',
      'voice cloning',
      'create voice model',
      'clone my voice',
    ],
  },

  [ChatIntent.PLAY_SAMPLE]: {
    keywords: ['play', 'listen', 'hear', 'sample', 'preview'],
    phrases: [
      'play sample',
      'let me hear',
      'play example',
      'preview',
    ],
  },

  [ChatIntent.SHOW_EXAMPLE]: {
    keywords: ['example', 'show me', 'demo', 'sample'],
    phrases: [
      'show example',
      'give me an example',
      'demo this',
    ],
  },

  [ChatIntent.GREETING]: {
    keywords: ['hello', 'hi', 'hey', 'greetings', 'sup'],
    phrases: [
      'hello',
      'hi there',
      'hey',
      'what\'s up',
    ],
  },

  [ChatIntent.THANKS]: {
    keywords: ['thanks', 'thank you', 'appreciate', 'awesome'],
    phrases: [
      'thank you',
      'thanks',
      'that\'s great',
      'perfect',
    ],
  },

  [ChatIntent.UNKNOWN]: {
    keywords: [],
    phrases: [],
  },
};

/**
 * Entity extractors for different entity types
 */
const ENTITY_PATTERNS = {
  genre: {
    patterns: ['pop', 'rock', 'jazz', 'edm', 'lofi', 'hip-hop', 'r&b', 'country', 'blues', 'funk'],
  },
  mood: {
    patterns: ['happy', 'sad', 'energetic', 'chill', 'dark', 'dreamy', 'angry', 'romantic', 'upbeat', 'melancholic'],
  },
  key: {
    patterns: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C major', 'A minor', 'key of'],
  },
  section: {
    patterns: ['verse', 'chorus', 'bridge', 'intro', 'outro', 'pre-chorus'],
  },
  theme: {
    patterns: ['love', 'heartbreak', 'party', 'summer', 'winter', 'journey', 'freedom'],
  },
  structure: {
    patterns: ['simple', 'standard', 'complex'],
  },
  feature_name: {
    patterns: ['autotopline', 'voice clone', 'voice cloning', 'lyric engine', 'full composer'],
  },
};

/**
 * Recognize intent from user input
 */
export function recognizeIntent(input: string): IntentMatch {
  const normalized = input.toLowerCase().trim();

  // Check for exact phrase matches first (highest confidence)
  for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
    for (const phrase of pattern.phrases) {
      if (normalized.includes(phrase.toLowerCase())) {
        const entities = extractEntities(normalized, pattern.entities || []);
        return {
          intent: intent as ChatIntent,
          confidence: 0.9,
          entities,
        };
      }
    }
  }

  // Check for keyword matches (medium confidence)
  const intentScores: Record<string, number> = {};

  for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
    let score = 0;
    for (const keyword of pattern.keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    if (score > 0) {
      intentScores[intent] = score;
    }
  }

  // Find best match
  if (Object.keys(intentScores).length > 0) {
    const bestIntent = Object.entries(intentScores)
      .sort(([, a], [, b]) => b - a)[0][0] as ChatIntent;

    const pattern = INTENT_PATTERNS[bestIntent];
    const entities = extractEntities(normalized, pattern.entities || []);

    return {
      intent: bestIntent,
      confidence: 0.7,
      entities,
    };
  }

  // No match found
  return {
    intent: ChatIntent.UNKNOWN,
    confidence: 0.0,
    entities: {},
  };
}

/**
 * Extract entities from user input
 */
function extractEntities(input: string, entityTypes: string[]): Record<string, any> {
  const entities: Record<string, any> = {};

  for (const entityType of entityTypes) {
    const pattern = ENTITY_PATTERNS[entityType as keyof typeof ENTITY_PATTERNS];
    if (!pattern) continue;

    for (const value of pattern.patterns) {
      if (input.includes(value.toLowerCase())) {
        entities[entityType] = value;
        break;
      }
    }
  }

  return entities;
}

/**
 * Get follow-up questions based on intent
 */
export function getFollowUpQuestions(intent: ChatIntent, entities: Record<string, any>): string[] {
  const questions: string[] = [];

  switch (intent) {
    case ChatIntent.GENERATE_LYRICS:
      if (!entities.genre) questions.push('What genre would you like?');
      if (!entities.mood) questions.push('What mood are you going for?');
      if (!entities.theme) questions.push('Any specific theme or topic?');
      break;

    case ChatIntent.GENERATE_MELODY:
    case ChatIntent.GENERATE_TOPLINE:
      if (!entities.genre) questions.push('What genre?');
      if (!entities.mood) questions.push('What mood?');
      if (!entities.key) questions.push('What key? (e.g., C major)');
      break;

    case ChatIntent.GENERATE_FULL_SONG:
      if (!entities.genre) questions.push('What genre?');
      if (!entities.mood) questions.push('What mood?');
      if (!entities.structure) questions.push('Simple, standard, or complex structure?');
      break;
  }

  return questions;
}

/**
 * Check if we have all required entities for an intent
 */
export function hasRequiredEntities(intent: ChatIntent, entities: Record<string, any>): boolean {
  switch (intent) {
    case ChatIntent.GENERATE_LYRICS:
      return !!(entities.genre && entities.mood);

    case ChatIntent.GENERATE_MELODY:
    case ChatIntent.GENERATE_TOPLINE:
      return !!(entities.genre && entities.mood);

    case ChatIntent.GENERATE_FULL_SONG:
      return !!(entities.genre && entities.mood);

    default:
      return true;
  }
}
