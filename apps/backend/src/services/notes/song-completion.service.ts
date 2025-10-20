/**
 * Song Completion Service
 * Uses AI to complete partial songs, add missing sections, and label structure
 */

import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { InstrumentalAnalysis } from './audio-analysis.service.js';
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

export interface SongCompletionResult {
  isCompletable: boolean;
  reason: string;
  completedLyrics?: string; // Fully labeled with sections
  structure?: {
    verse1?: string;
    chorus?: string;
    verse2?: string;
    bridge?: string;
    outro?: string;
  };
  improvements: string[]; // What was added/fixed
  metadata?: {
    key: string;           // Musical key (e.g., "C Major", "G Minor")
    bpm: number;           // Tempo (e.g., 120)
    mood: string;          // Mood/vibe (e.g., "Melancholic", "Upbeat")
    referenceArtists: string[];  // Similar artists
    referenceSongs: string[];    // Similar songs
  };
}

export class SongCompletionService {
  /**
   * Analyze if song is completable and complete it
   */
  async completeSong(rawLyrics: string, metadata?: {
    fileName?: string;
    duration?: number;
    instrumentalAnalysis?: InstrumentalAnalysis;
  }): Promise<SongCompletionResult> {
    try {
      // Quick filter: Skip very short content
      if (!rawLyrics || rawLyrics.trim().length < 20) {
        return {
          isCompletable: false,
          reason: 'Too short - not enough content to complete',
          improvements: [],
        };
      }

      const systemPrompt = `You are an expert country/pop songwriter in the style of Morgan Wallen, Jason Aldean, and Drake. Your job is to:

1. **Assess Completability**: Determine if this voice memo can become a full song
2. **Complete the Song**: Add missing verses, refine chorus, add bridge if needed
3. **Label Structure**: Clearly mark each section

**Song Structure Requirements:**
- Minimum: Verse 1, Chorus, Verse 2, Chorus (repeat)
- Full song: Verse 1, Chorus, Verse 2, Chorus, Bridge, Chorus (final)
- Optional: Outro

**When to Complete:**
✅ Has a strong hook/chorus → Build verses around it
✅ Has good verse content → Add proper chorus
✅ Has potential theme → Develop into full song
✅ Clear emotion/story → Complete the narrative

**When NOT to Complete:**
❌ Just humming/melody with no lyrics
❌ Random talking/not a song
❌ Sound effects or noise
❌ No clear theme or emotion
❌ Transcription too corrupted

**Completion Guidelines:**
- Stay true to the original vibe and theme
- Match the artist's style (country/pop)
- Use the existing best lines as anchors
- Add verses that tell a story
- Make chorus catchy and repetitive
- Bridge should shift perspective or add depth
- Keep it authentic - don't over-write

**Output Format:**
Return JSON:
{
  "isCompletable": boolean,
  "reason": "why completable or not",
  "completedLyrics": "Full song with section labels:
[Verse 1]
actual lyrics here

[Chorus]
hook lyrics here

[Verse 2]
more lyrics

[Chorus]
repeat chorus

[Bridge]
shift in perspective

[Chorus]
final chorus

[Outro] (optional)
ending",
  "improvements": ["what you added/fixed"],
  "metadata": {
    "key": "C Major or G Minor etc",
    "bpm": 120,
    "mood": "Melancholic/Upbeat/Reflective/etc",
    "referenceArtists": ["Morgan Wallen", "Jason Aldean"],
    "referenceSongs": ["Specific song name 1", "Specific song name 2"]
  }
}

**IMPORTANT**:
- Only return completedLyrics if isCompletable = true
- Label EVERY section clearly with brackets
- Keep original lyrics where they're good
- Add sections organically to complete the story
- **ALWAYS provide accurate metadata**: key, BPM, mood, reference artists/songs that match the vibe
- Reference songs should be REAL songs that sound similar in style/energy`;

      // Build instrumental context if available
      const instrumentalContext = metadata?.instrumentalAnalysis?.hasInstrumental
        ? `
🎸 INSTRUMENTAL BACKING TRACK DETECTED:
Genre: ${metadata.instrumentalAnalysis.genre || 'Unknown'} ${metadata.instrumentalAnalysis.subgenre ? `(${metadata.instrumentalAnalysis.subgenre})` : ''}
Instruments: ${metadata.instrumentalAnalysis.instruments?.join(', ') || 'Unknown'}
Tempo: ${metadata.instrumentalAnalysis.tempo || 'Unknown'} ${metadata.instrumentalAnalysis.bpm ? `(${metadata.instrumentalAnalysis.bpm} BPM)` : ''}
Mood: ${metadata.instrumentalAnalysis.mood || 'Unknown'}
Energy: ${metadata.instrumentalAnalysis.energy || 'Unknown'}
Production: ${metadata.instrumentalAnalysis.productionQuality || 'Unknown'}
Style: ${metadata.instrumentalAnalysis.styleDescription || 'N/A'}

⚠️ IMPORTANT: Use this instrumental analysis to guide your completion:
- Match the genre and mood in your lyrics
- Consider the tempo/BPM for phrasing
- Align the song's energy with the backing track
- Write lyrics that complement the instrumental style
`
        : '';

      const userPrompt = `Analyze this voice memo and determine if it can be completed into a full song:

${metadata?.fileName ? `File: ${metadata.fileName}` : ''}
${metadata?.duration ? `Duration: ${metadata.duration}s` : ''}
${instrumentalContext}
Raw Lyrics:
${rawLyrics}

Can this become a full song? If yes, complete it with proper structure and section labels.`;

      const anthropic = getAnthropicClient();
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096, // Increased for full song generation
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
        logger.error('Song completion JSON parse error', { error: error.message || String(error) });
        return {
          isCompletable: false,
          reason: 'AI response parsing failed',
          improvements: [],
        };
      }

      if (parsed.isCompletable) {
        logger.info('✅ Song completable: ${parsed.reason}');
        logger.info('📝 Improvements: ${parsed.improvements?.join(', ')}');

        return {
          isCompletable: true,
          reason: parsed.reason,
          completedLyrics: parsed.completedLyrics,
          improvements: parsed.improvements || [],
          metadata: parsed.metadata,  // Include metadata from AI response
        };
      } else {
        logger.info('❌ Not completable: ${parsed.reason}');
        return {
          isCompletable: false,
          reason: parsed.reason,
          improvements: [],
        };
      }
    } catch (error) {
      logger.error('Song completion error', { error: error.message || String(error) });
      return {
        isCompletable: false,
        reason: 'Completion process failed',
        improvements: [],
      };
    }
  }

  /**
   * Extract just the hook/chorus from lyrics for title generation
   */
  extractHook(completedLyrics: string): string | null {
    const chorusMatch = completedLyrics.match(/\[Chorus\]\s*\n(.*?)(?:\n\n|\n\[|$)/s);
    if (chorusMatch && chorusMatch[1]) {
      const chorusLines = chorusMatch[1].trim().split('\n');
      // Return first line of chorus as potential hook
      return chorusLines[0]?.trim() || null;
    }
    return null;
  }
}

export const songCompletionService = new SongCompletionService();
