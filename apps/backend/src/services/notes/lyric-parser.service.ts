/**
 * Lyric Parser Service
 * Intelligently extracts lyrics from voice memo transcriptions
 * Removes background beats, instrumental sections, and noise
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

// Load .env from project root
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

export class LyricParserService {
  /**
   * Validate Claude's parsing output to ensure quality
   * Returns true if output passes quality checks
   */
  private validateParsedLyrics(cleanLyrics: string, rawTranscription: string): {
    isValid: boolean;
    reason?: string;
  } {
    // Empty is valid (instrumental)
    if (!cleanLyrics || cleanLyrics.trim().length === 0) {
      return { isValid: true };
    }

    const lines = cleanLyrics.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Check first line for junk (most common issue)
    if (lines.length > 0) {
      const firstLine = lines[0];

      // Reject if first line is just music symbols
      if (/^[♪♫\s]+$/.test(firstLine)) {
        return {
          isValid: false,
          reason: 'First line contains only music symbols'
        };
      }

      // Reject if first line has too many repeated words
      const words = firstLine.split(/\s+/);
      const uniqueWords = new Set(words);
      if (words.length >= 4 && uniqueWords.size <= 2) {
        return {
          isValid: false,
          reason: 'First line has excessive word repetition'
        };
      }

      // Reject if first line contains YouTube artifacts
      if (
        firstLine.toLowerCase().includes('thank you for watching') ||
        firstLine.toLowerCase().includes('subscribe') ||
        firstLine.toLowerCase().includes('see you next time')
      ) {
        return {
          isValid: false,
          reason: 'First line contains YouTube artifacts'
        };
      }

      // Reject if first line is mostly symbols/non-alphabetic
      const alphaCount = (firstLine.match(/[a-zA-Z]/g) || []).length;
      if (alphaCount < firstLine.length * 0.5) {
        return {
          isValid: false,
          reason: 'First line is mostly non-alphabetic'
        };
      }
    }

    // Check if entire output contains YouTube junk
    const lowerContent = cleanLyrics.toLowerCase();
    if (
      lowerContent.includes('thank you for watching') ||
      lowerContent.includes('subscribe to') ||
      lowerContent.includes('see you next time')
    ) {
      return {
        isValid: false,
        reason: 'Contains YouTube artifacts'
      };
    }

    // Check if output is mostly music symbols
    const symbolCount = (cleanLyrics.match(/[♪♫]/g) || []).length;
    if (symbolCount > cleanLyrics.length * 0.2) {
      return {
        isValid: false,
        reason: 'Contains too many music symbols'
      };
    }

    return { isValid: true };
  }

  /**
   * Parse voice memo transcription to extract clean lyrics
   * Removes background beats, instrumental markers, and focuses on vocals
   */
  async parseVoiceMemoLyrics(rawTranscription: string, metadata?: {
    fileName?: string;
    duration?: number;
  }): Promise<{
    cleanLyrics: string;
    hasBackgroundMusic: boolean;
    confidence: number;
    structure?: {
      verses: string[];
      chorus?: string;
      bridge?: string;
    };
    notes?: string;
  }> {
    try {
      console.log('Parsing voice memo lyrics from transcription...');

      const systemPrompt = `You are an expert music transcription parser specializing in extracting clean lyrics from voice memo transcriptions.

Your task:
1. Identify and extract ONLY the sung/spoken lyrics that are meaningful
2. Remove background music descriptions, beat sounds, instrumental markers
3. Filter out non-lyrical sounds (humming, "oh", "ah" unless they're part of actual lyrics)
4. Detect song structure (verse, chorus, bridge)
5. Preserve the artist's intended words and phrasing

CRITICAL FILTERS - You MUST remove:
1. **YouTube/Video artifacts:**
   - "Thank you for watching"
   - "Subscribe"
   - "See you next time"
   - "Like and comment"
   - Any video-related prompts

2. **Music symbols:**
   - DO NOT add symbols like ♪♪, ♫♫, or any musical notation
   - If a section is purely instrumental with no vocals, return an empty string or skip it
   - Never use symbols to represent instrumentals

3. **Repeated nonsense/filler:**
   - Excessive repeated words like "So So So So So So"
   - Filler sounds that aren't lyrics: "Uh uh uh uh uh"
   - Remove unless it's clearly intentional lyrics (e.g., "So so so in love with you")

4. **Background noise descriptions:**
   - [Music], [Applause], [Coughing], [Noise] tags
   - Descriptions like "beat drops", "instrumental plays"
   - Sound effect descriptions

QUALITY STANDARDS:
- If the transcription is mostly instrumental or unclear, return minimal content or empty string
- Focus on extracting real, meaningful lyrics that someone would want to read
- When in doubt, less is more - don't include questionable content

EXAMPLES:

Bad Input: "♪♪ ♪♪ ♪♪ Thank you for watching this video. Please subscribe."
Good Output: "" (empty - no actual lyrics)

Bad Input: "Uh So So So So So So So [Music] Yeah yeah yeah"
Good Output: "" (empty - no meaningful lyrics, just filler)

Bad Input: "I'm no stranger to the pain ♪♪ [Background music] Thank you for watching"
Good Output: "I'm no stranger to the pain"

Bad Input: "Girl you're the one I want to hold [Music] So so so beautiful"
Good Output: "Girl you're the one I want to hold\nSo so so beautiful"

Return a JSON object:
{
  "cleanLyrics": "The cleaned up lyrics with proper line breaks (or empty string if no real lyrics)",
  "hasBackgroundMusic": true/false,
  "confidence": 0.0-1.0,
  "structure": {
    "verses": ["verse 1 text", "verse 2 text"],
    "chorus": "chorus text (if detected)",
    "bridge": "bridge text (if detected)"
  },
  "notes": "Any important observations about the transcription"
}`;

      const userPrompt = `Parse this voice memo transcription and extract clean lyrics:

${metadata?.fileName ? `File: ${metadata.fileName}` : ''}
${metadata?.duration ? `Duration: ${metadata.duration}s` : ''}

Raw Transcription:
${rawTranscription}

Extract the clean lyrics, removing any background music, beats, or non-lyrical content.`;

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

      // Extract JSON from response with retry logic
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                       responseText.match(/\{[\s\S]*\}/);

      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;

      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch (error) {
        // Retry with cleaned text
        try {
          const cleanedJson = jsonText.replace(/^[^{[]*/, '').replace(/[^}\]]*$/, '');
          parsed = JSON.parse(cleanedJson);
        } catch (retryError) {
          // Fallback: return original transcription without parsing
          console.error('Lyric parsing error:', error instanceof Error ? error.message : 'Unknown error');
          return {
            cleanLyrics: rawTranscription,
            hasBackgroundMusic: false,
            confidence: 0.5,
            structure: undefined,
            notes: 'JSON parsing failed',
          };
        }
      }

      console.log(`Lyric parsing complete (confidence: ${parsed.confidence || 0.8})`);

      // VALIDATION LAYER: Check if Claude's output is actually good
      const validation = this.validateParsedLyrics(parsed.cleanLyrics || '', rawTranscription);

      if (!validation.isValid) {
        console.log(`⚠️  Validation failed: ${validation.reason}`);
        console.log('Falling back to cleaned raw transcription');

        // Fall back to quick cleanup of raw transcription
        const fallbackLyrics = this.quickCleanup(rawTranscription);

        return {
          cleanLyrics: fallbackLyrics,
          hasBackgroundMusic: false,
          confidence: 0.6,
          structure: undefined,
          notes: `Validation failed: ${validation.reason}. Using cleaned raw transcription.`,
        };
      }

      console.log('✅ Validation passed');

      return {
        cleanLyrics: parsed.cleanLyrics || rawTranscription,
        hasBackgroundMusic: parsed.hasBackgroundMusic || false,
        confidence: parsed.confidence || 0.8,
        structure: parsed.structure,
        notes: parsed.notes,
      };
    } catch (error) {
      console.error('Lyric parsing error:', error);
      // Fallback: return raw transcription if parsing fails
      return {
        cleanLyrics: rawTranscription,
        hasBackgroundMusic: false,
        confidence: 0.5,
        notes: 'Failed to parse - returning raw transcription',
      };
    }
  }

  /**
   * Quick check if transcription likely contains background music/beats
   */
  hasBackgroundMusicIndicators(transcription: string): boolean {
    const indicators = [
      /\b(beat|instrumental|music plays|background)\b/i,
      /\b(drop|drops|sample)\b/i,
      /oh oh oh oh/i,  // Repetitive melodic sounds
      /yeah yeah yeah yeah/i,  // Excessive repetition
      /\b(woo|aye|uh|mm)\b.*\b(woo|aye|uh|mm)\b.*\b(woo|aye|uh|mm)\b/i,  // Multiple ad-libs
    ];

    return indicators.some(pattern => pattern.test(transcription));
  }

  /**
   * Clean up common transcription artifacts
   */
  quickCleanup(transcription: string): string {
    let cleaned = transcription;

    // Remove excessive repetitions of filler words
    cleaned = cleaned.replace(/(\b(?:oh|ah|yeah|uh|mm)\b\s*){4,}/gi, (match) => {
      // Keep max 2 repetitions
      const word = match.trim().split(/\s+/)[0];
      return `${word} ${word} `;
    });

    // Remove standalone single letters repeated
    cleaned = cleaned.replace(/\b([a-z])\s+\1\s+\1\s+\1\b/gi, '');

    // Clean up extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  }
}

export const lyricParserService = new LyricParserService();
