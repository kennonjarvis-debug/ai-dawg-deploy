/**
 * Voice Memo Tagging Service
 * Intelligently tags and categorizes voice memos for search and organization
 */

import Anthropic from '@anthropic-ai/sdk';

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

export interface VoiceMemoTags {
  songTitle?: string;
  segment: 'verse' | 'chorus' | 'bridge' | 'hook' | 'intro' | 'outro' | 'full' | 'fragment';
  keywords: string[];
  mood?: string[];
  genre?: string[];
  themes?: string[];
  vocalistNotes?: string[];
  quality: 'rough_demo' | 'working_take' | 'keeper' | 'final';
  isComplete: boolean;
  suggestedFilename: string;
}

export class TaggingService {
  /**
   * Intelligently tag a voice memo based on its content
   */
  async tagVoiceMemo(options: {
    lyrics: string;
    transcription?: string;
    structure?: {
      verses?: string[];
      chorus?: string;
      bridge?: string;
    };
    fileName?: string;
  }): Promise<VoiceMemoTags> {
    try {
      const systemPrompt = `You are an expert music cataloging system that tags voice memos for easy search and organization.

Your task:
1. Extract song title from lyrics (if present) or suggest one based on content
2. Identify segment type (verse, chorus, bridge, hook, intro, outro, full song, or fragment)
3. Extract keywords (key phrases, memorable lines)
4. Detect mood (energetic, melancholy, romantic, aggressive, etc.)
5. Classify genre (country, pop, rock, hip-hop, etc.)
6. Identify themes (love, heartbreak, partying, nostalgia, etc.)
7. Note vocalist performance observations (on-key, rough, emotional, etc.)
8. Assess quality level (rough demo, working take, keeper, final)
9. Determine if song seems complete or partial
10. Suggest a descriptive filename (e.g., "Heartbreak_Chorus_v2", "Whiskey_Eyes_Full_Demo")

Return JSON:
{
  "songTitle": "Title or null",
  "segment": "verse|chorus|bridge|hook|intro|outro|full|fragment",
  "keywords": ["memorable phrase 1", "memorable phrase 2"],
  "mood": ["mood1", "mood2"],
  "genre": ["genre1"],
  "themes": ["theme1", "theme2"],
  "vocalistNotes": ["note1"],
  "quality": "rough_demo|working_take|keeper|final",
  "isComplete": true/false,
  "suggestedFilename": "Descriptive_Name_Segment"
}`;

      const userPrompt = `Analyze this voice memo and provide intelligent tags:

${options.fileName ? `Original file: ${options.fileName}` : ''}

Lyrics:
${options.lyrics}

${options.structure ? `
Detected structure:
- Verses: ${options.structure.verses?.length || 0}
- Chorus: ${options.structure.chorus ? 'Yes' : 'No'}
- Bridge: ${options.structure.bridge ? 'Yes' : 'No'}
` : ''}

${options.transcription && options.transcription !== options.lyrics ? `
Raw transcription (with background):
${options.transcription.slice(0, 500)}...
` : ''}

Provide comprehensive tags for cataloging and search.`;

      const anthropic = getAnthropicClient();
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

      // Extract JSON
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                       responseText.match(/\{[\s\S]*\}/);

      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;

      let parsed: VoiceMemoTags;
      try {
        parsed = JSON.parse(jsonText);
      } catch (error) {
        // Fallback with basic tags
        console.error('Tagging JSON parse error:', error);
        return this.generateFallbackTags(options.lyrics, options.fileName);
      }

      console.log(`✅ Tagged: "${parsed.suggestedFilename}" [${parsed.segment}]`);

      return parsed;
    } catch (error) {
      console.error('Tagging error:', error);
      return this.generateFallbackTags(options.lyrics, options.fileName);
    }
  }

  /**
   * Generate fallback tags when AI tagging fails
   */
  private generateFallbackTags(lyrics: string, fileName?: string): VoiceMemoTags {
    const wordCount = lyrics.split(/\s+/).length;

    // Extract first few words as keywords
    const words = lyrics.split(/\s+/).slice(0, 5);
    const keywords = words.filter(w => w.length > 3);

    // Determine segment based on length and repetition
    let segment: VoiceMemoTags['segment'] = 'fragment';
    if (wordCount > 100) {
      segment = 'full';
    } else if (wordCount > 50) {
      segment = 'verse';
    } else if (lyrics.toLowerCase().includes('chorus') || this.hasRepetition(lyrics)) {
      segment = 'chorus';
    }

    // Generate filename
    const firstLine = lyrics.split('\n')[0].slice(0, 30).trim();
    const sanitized = firstLine.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const suggestedFilename = sanitized || `Voice_Memo_${Date.now()}`;

    return {
      songTitle: undefined,
      segment,
      keywords,
      mood: undefined,
      genre: undefined,
      themes: undefined,
      vocalistNotes: undefined,
      quality: 'rough_demo',
      isComplete: wordCount > 100,
      suggestedFilename,
    };
  }

  /**
   * Check if lyrics have repetitive patterns (chorus indicator)
   */
  private hasRepetition(lyrics: string): boolean {
    const lines = lyrics.split('\n').filter(l => l.trim().length > 10);
    if (lines.length < 2) return false;

    // Check for repeated lines
    const lineCounts = new Map<string, number>();
    for (const line of lines) {
      const normalized = line.toLowerCase().trim();
      lineCounts.set(normalized, (lineCounts.get(normalized) || 0) + 1);
    }

    // If any line repeats 2+ times, likely a chorus
    return Array.from(lineCounts.values()).some(count => count >= 2);
  }

  /**
   * Search voice memos by tag
   */
  searchByTag(
    memos: Array<{ tags: VoiceMemoTags; noteId: string }>,
    query: {
      songTitle?: string;
      segment?: string;
      keyword?: string;
      mood?: string;
      genre?: string;
      theme?: string;
      quality?: string;
    }
  ): Array<{ tags: VoiceMemoTags; noteId: string }> {
    return memos.filter(memo => {
      const { tags } = memo;

      if (query.songTitle && tags.songTitle) {
        if (!tags.songTitle.toLowerCase().includes(query.songTitle.toLowerCase())) {
          return false;
        }
      }

      if (query.segment && tags.segment !== query.segment) {
        return false;
      }

      if (query.keyword) {
        const hasKeyword = tags.keywords.some(k =>
          k.toLowerCase().includes(query.keyword!.toLowerCase())
        );
        if (!hasKeyword) return false;
      }

      if (query.mood && tags.mood) {
        const hasMood = tags.mood.some(m =>
          m.toLowerCase().includes(query.mood!.toLowerCase())
        );
        if (!hasMood) return false;
      }

      if (query.genre && tags.genre) {
        const hasGenre = tags.genre.some(g =>
          g.toLowerCase().includes(query.genre!.toLowerCase())
        );
        if (!hasGenre) return false;
      }

      if (query.theme && tags.themes) {
        const hasTheme = tags.themes.some(t =>
          t.toLowerCase().includes(query.theme!.toLowerCase())
        );
        if (!hasTheme) return false;
      }

      if (query.quality && tags.quality !== query.quality) {
        return false;
      }

      return true;
    });
  }
}

export const taggingService = new TaggingService();
