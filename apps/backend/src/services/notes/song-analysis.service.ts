/**
 * Song Analysis Service
 * Analyzes voice memos to understand song structure, theme, completion status
 * Provides intelligent next actions for song development
 */

import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../../../src/lib/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

export interface SongAnalysis {
  structure: {
    hasVerse: boolean;
    hasChorus: boolean;
    hasBridge: boolean;
    hook?: string; // The main hook/catchphrase
    repetitionScore: number; // 0-1, how much repetition (hooks repeat)
  };
  theme: {
    primary: string; // e.g., "heartbreak", "party", "love", "confidence", "country lifestyle"
    mood: string; // e.g., "upbeat", "sad", "aggressive", "smooth", "melancholic"
    keywords: string[]; // Key themes/words
  };
  completion: {
    status: 'rough_idea' | 'hook_only' | 'partial_lyrics' | 'complete_draft' | 'polished';
    percentage: number; // 0-100, estimated completion
    missingElements: string[]; // e.g., ["Verse 2", "Bridge", "Outro"]
  };
  quality: {
    lyricClarity: number; // 0-1, how clear/coherent the lyrics are
    hasRealLyrics: boolean; // false if just humming/melody
    isActualSong: boolean; // false if just talking/not a song
  };
  nextActions: string[]; // Intelligent suggestions
  appleNotesFolder: 'JARVIS - Complete' | 'JARVIS - In Progress' | 'JARVIS - Ideas' | 'JARVIS - Archive';
}

export class SongAnalysisService {
  /**
   * Analyze voice memo lyrics to understand song development stage
   */
  async analyzeSong(
    lyrics: string,
    metadata?: {
      duration?: number;
      fileName?: string;
    }
  ): Promise<SongAnalysis> {
    try {
      // Quick pre-filter: Skip analysis for very short/empty content
      if (!lyrics || lyrics.trim().length < 10) {
        return this.getDefaultAnalysis('rough_idea', 'Not enough content to analyze');
      }

      const systemPrompt = `You are an expert music producer and songwriter who analyzes voice memos to understand song development status.

Your task is to analyze voice memo lyrics and determine:
1. **Song Structure** - Does it have verses, chorus, bridge? Is there a clear hook?
2. **Theme & Mood** - What's the song about? What's the emotional tone?
3. **Completion Status** - How complete is this song?
4. **Quality** - Are these real lyrics or just humming/ideas?
5. **Next Actions** - What should the artist do next?

Song Completion Levels:
- **rough_idea**: Just humming, melody ideas, or scattered thoughts (< 20% complete)
- **hook_only**: Strong hook/chorus but needs verses (20-40% complete)
- **partial_lyrics**: Has some verses but incomplete structure (40-70% complete)
- **complete_draft**: Full song structure with all elements (70-90% complete)
- **polished**: Ready for production, refined lyrics (90-100% complete)

Theme Categories:
- heartbreak, love, party, confidence/flex, country lifestyle, nostalgia, rebellion, celebration, struggle, ambition

Mood Types:
- upbeat, sad, aggressive, smooth, melancholic, energetic, chill, romantic, defiant

IMPORTANT: Be realistic about completion status. Most voice memos are rough ideas or partial lyrics.

Return JSON:
{
  "structure": {
    "hasVerse": boolean,
    "hasChorus": boolean,
    "hasBridge": boolean,
    "hook": "the main hook if present",
    "repetitionScore": 0.0-1.0
  },
  "theme": {
    "primary": "main theme",
    "mood": "mood type",
    "keywords": ["key", "themes"]
  },
  "completion": {
    "status": "rough_idea | hook_only | partial_lyrics | complete_draft | polished",
    "percentage": 0-100,
    "missingElements": ["what's missing"]
  },
  "quality": {
    "lyricClarity": 0.0-1.0,
    "hasRealLyrics": boolean,
    "isActualSong": boolean
  },
  "nextActions": ["specific action suggestions"],
  "reasoning": "brief explanation of your analysis"
}`;

      const userPrompt = `Analyze this voice memo and determine its song development status:

${metadata?.fileName ? `File: ${metadata.fileName}` : ''}
${metadata?.duration ? `Duration: ${metadata.duration}s` : ''}

Lyrics:
${lyrics}

Provide detailed analysis of structure, theme, completion status, and next actions.`;

      const anthropic = getAnthropicClient();
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

      // Extract JSON from response
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                       responseText.match(/\{[\s\S]*\}/);

      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;

      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch (error) {
        // Fallback if JSON parsing fails
        logger.error('Song analysis JSON parse error', { error: error.message || String(error) });
        return this.getDefaultAnalysis('partial_lyrics', 'JSON parsing failed');
      }

      // Map status to Apple Notes folder
      let appleNotesFolder: SongAnalysis['appleNotesFolder'];
      switch (parsed.completion?.status) {
        case 'polished':
        case 'complete_draft':
          appleNotesFolder = 'JARVIS - Complete';
          break;
        case 'partial_lyrics':
        case 'hook_only':
          appleNotesFolder = 'JARVIS - In Progress';
          break;
        case 'rough_idea':
          if (parsed.quality?.isActualSong === false) {
            appleNotesFolder = 'JARVIS - Archive';
          } else {
            appleNotesFolder = 'JARVIS - Ideas';
          }
          break;
        default:
          appleNotesFolder = 'JARVIS - Ideas';
      }

      logger.info('📊 Song Analysis: ${parsed.completion?.status} (${parsed.completion?.percentage}% complete)');
      logger.info('🎵 Theme: ${parsed.theme?.primary} | Mood: ${parsed.theme?.mood}');
      logger.info('📁 Folder: ${appleNotesFolder}');

      return {
        structure: parsed.structure || { hasVerse: false, hasChorus: false, hasBridge: false, repetitionScore: 0 },
        theme: parsed.theme || { primary: 'unknown', mood: 'neutral', keywords: [] },
        completion: parsed.completion || { status: 'partial_lyrics', percentage: 50, missingElements: [] },
        quality: parsed.quality || { lyricClarity: 0.5, hasRealLyrics: true, isActualSong: true },
        nextActions: parsed.nextActions || ['Continue developing lyrics'],
        appleNotesFolder,
      };
    } catch (error) {
      logger.error('Song analysis error', { error: error.message || String(error) });
      // Fallback to default analysis
      return this.getDefaultAnalysis('partial_lyrics', 'Analysis failed');
    }
  }

  /**
   * Get default analysis when analysis fails or content is insufficient
   */
  private getDefaultAnalysis(
    status: SongAnalysis['completion']['status'],
    reason: string
  ): SongAnalysis {
    let appleNotesFolder: SongAnalysis['appleNotesFolder'];

    switch (status) {
      case 'polished':
      case 'complete_draft':
        appleNotesFolder = 'JARVIS - Complete';
        break;
      case 'partial_lyrics':
      case 'hook_only':
        appleNotesFolder = 'JARVIS - In Progress';
        break;
      case 'rough_idea':
      default:
        appleNotesFolder = 'JARVIS - Ideas';
    }

    return {
      structure: {
        hasVerse: false,
        hasChorus: false,
        hasBridge: false,
        repetitionScore: 0,
      },
      theme: {
        primary: 'unknown',
        mood: 'neutral',
        keywords: [],
      },
      completion: {
        status,
        percentage: status === 'rough_idea' ? 15 : 50,
        missingElements: ['Unable to determine'],
      },
      quality: {
        lyricClarity: 0.5,
        hasRealLyrics: true,
        isActualSong: true,
      },
      nextActions: [reason],
      appleNotesFolder,
    };
  }
}

export const songAnalysisService = new SongAnalysisService();
