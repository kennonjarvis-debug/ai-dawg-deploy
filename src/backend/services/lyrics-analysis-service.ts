/**
 * Lyrics Analysis Service
 *
 * Analyzes song lyrics in real-time using GPT-4o to:
 * - Detect song sections (verse, chorus, bridge, pre-chorus, intro, outro)
 * - Identify repeated sections
 * - Suggest structure improvements
 * - Provide genre-specific recommendations
 *
 * Cost-optimized: Uses text-only GPT-4o calls
 */

import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { logApiUsage, calculateGPT4oCost } from './cost-monitoring-service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Song section types
 */
export type SectionType =
  | 'intro'
  | 'verse'
  | 'pre-chorus'
  | 'chorus'
  | 'bridge'
  | 'outro'
  | 'hook'
  | 'unknown';

/**
 * Genre types for recommendations
 */
export type Genre =
  | 'pop'
  | 'country'
  | 'hip-hop'
  | 'rock'
  | 'rnb'
  | 'indie'
  | 'folk'
  | 'other';

/**
 * Section label for a line or group of lines
 */
export interface SectionLabel {
  lineStart: number;
  lineEnd: number;
  sectionType: SectionType;
  sectionNumber?: number; // e.g., "Verse 1", "Verse 2"
  confidence: number; // 0-1
  reasoning?: string;
}

/**
 * Analyzed lyrics structure
 */
export interface LyricsStructure {
  sections: SectionLabel[];
  repeatedSections: Array<{
    sectionType: SectionType;
    occurrences: number;
    lineRanges: Array<{ start: number; end: number }>;
  }>;
  estimatedLength: number; // in seconds (based on typical song structure)
  structure: string; // e.g., "Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus-Outro"
}

/**
 * Structure recommendation
 */
export interface StructureRecommendation {
  type: 'suggestion' | 'warning' | 'info';
  message: string;
  section?: SectionType;
  reasoning: string;
}

/**
 * Complete lyrics analysis result
 */
export interface LyricsAnalysisResult {
  structure: LyricsStructure;
  recommendations: StructureRecommendation[];
  genreAdvice?: {
    genre: Genre;
    suggestions: string[];
  };
  cost: {
    totalCost: number;
    inputTokens: number;
    outputTokens: number;
    breakdown: string;
  };
}

/**
 * Analyze lyrics and detect song structure
 */
export async function analyzeLyrics(
  lyrics: string,
  userId: string,
  options: {
    genre?: Genre;
    suggestedStructure?: string;
  } = {}
): Promise<LyricsAnalysisResult> {
  const startTime = Date.now();

  try {
    logger.info('[LyricsAnalysis] Starting analysis', {
      userId,
      lyricsLength: lyrics.length,
      genre: options.genre,
    });

    // Split lyrics into lines for analysis
    const lines = lyrics.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) {
      throw new Error('No lyrics provided');
    }

    // Build the analysis prompt
    const analysisPrompt = buildAnalysisPrompt(lyrics, options.genre, options.suggestedStructure);

    // Call GPT-4o for structure analysis
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: LYRICS_ANALYSIS_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from GPT-4o');
    }

    // Parse the structured response
    const analysis = JSON.parse(response);

    // Build structured result
    const structure: LyricsStructure = {
      sections: analysis.sections || [],
      repeatedSections: analysis.repeatedSections || [],
      estimatedLength: analysis.estimatedLength || 0,
      structure: analysis.structure || '',
    };

    const recommendations: StructureRecommendation[] = analysis.recommendations || [];

    // Add genre-specific advice if genre provided
    let genreAdvice;
    if (options.genre) {
      genreAdvice = await getGenreSpecificAdvice(
        structure,
        options.genre,
        userId
      );
    }

    // Calculate cost
    const inputTokens = completion.usage?.prompt_tokens || 0;
    const outputTokens = completion.usage?.completion_tokens || 0;
    const costCalc = calculateGPT4oCost(inputTokens, outputTokens);

    // Log usage
    await logApiUsage(userId, 'gpt-4o', 'chat', {
      inputTokens,
      outputTokens,
    }, {
      operation: 'lyrics-analysis',
      lyricsLength: lyrics.length,
      genre: options.genre,
    });

    const duration = Date.now() - startTime;

    logger.info('[LyricsAnalysis] Analysis complete', {
      userId,
      duration,
      cost: costCalc.totalCost,
      sectionsFound: structure.sections.length,
    });

    return {
      structure,
      recommendations,
      genreAdvice,
      cost: {
        totalCost: costCalc.totalCost,
        inputTokens,
        outputTokens,
        breakdown: costCalc.breakdown || '',
      },
    };
  } catch (error) {
    logger.error('[LyricsAnalysis] Analysis failed', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get genre-specific advice for song structure
 */
async function getGenreSpecificAdvice(
  structure: LyricsStructure,
  genre: Genre,
  userId: string
): Promise<{ genre: Genre; suggestions: string[] }> {
  try {
    const prompt = buildGenreAdvicePrompt(structure, genre);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: GENRE_ADVICE_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      return { genre, suggestions: [] };
    }

    const advice = JSON.parse(response);

    // Log this additional API call
    const inputTokens = completion.usage?.prompt_tokens || 0;
    const outputTokens = completion.usage?.completion_tokens || 0;

    await logApiUsage(userId, 'gpt-4o', 'chat', {
      inputTokens,
      outputTokens,
    }, {
      operation: 'genre-advice',
      genre,
    });

    return {
      genre,
      suggestions: advice.suggestions || [],
    };
  } catch (error) {
    logger.error('[LyricsAnalysis] Genre advice failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { genre, suggestions: [] };
  }
}

/**
 * Estimate cost before running analysis
 */
export function estimateLyricsAnalysisCost(lyrics: string, includeGenreAdvice: boolean = false): {
  estimatedCost: number;
  inputTokens: number;
  outputTokens: number;
  breakdown: string;
} {
  // Rough token estimation (1 token ~= 4 characters for English)
  const lyricsTokens = Math.ceil(lyrics.length / 4);
  const systemPromptTokens = 500; // Approximate
  const inputTokens = lyricsTokens + systemPromptTokens;

  // Output is structured JSON, estimate based on expected structure
  const outputTokens = 800; // Typical output size

  let totalInputTokens = inputTokens;
  let totalOutputTokens = outputTokens;

  // Add genre advice call if requested
  if (includeGenreAdvice) {
    totalInputTokens += 600; // Additional call
    totalOutputTokens += 300;
  }

  const costCalc = calculateGPT4oCost(totalInputTokens, totalOutputTokens);

  return {
    estimatedCost: costCalc.totalCost,
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    breakdown: `${totalInputTokens} input tokens + ${totalOutputTokens} output tokens = $${costCalc.totalCost.toFixed(6)}`,
  };
}

/**
 * Build analysis prompt
 */
function buildAnalysisPrompt(lyrics: string, genre?: Genre, suggestedStructure?: string): string {
  let prompt = `Analyze the following song lyrics and identify the structure:\n\n${lyrics}\n\n`;

  if (genre) {
    prompt += `Genre: ${genre}\n`;
  }

  if (suggestedStructure) {
    prompt += `Suggested structure: ${suggestedStructure}\n`;
  }

  prompt += `
Please provide a detailed analysis in JSON format with:
1. sections: Array of section labels with line ranges (lineStart, lineEnd, sectionType, sectionNumber, confidence, reasoning)
2. repeatedSections: Array of sections that repeat (sectionType, occurrences, lineRanges)
3. estimatedLength: Estimated song length in seconds
4. structure: String representation of the structure (e.g., "Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus-Outro")
5. recommendations: Array of suggestions for improvement (type, message, section, reasoning)

Section types: intro, verse, pre-chorus, chorus, bridge, outro, hook, unknown
`;

  return prompt;
}

/**
 * Build genre advice prompt
 */
function buildGenreAdvicePrompt(structure: LyricsStructure, genre: Genre): string {
  return `
Analyze this song structure for the ${genre} genre:

Structure: ${structure.structure}
Sections found: ${structure.sections.length}
Repeated sections: ${JSON.stringify(structure.repeatedSections, null, 2)}

Provide genre-specific advice in JSON format:
{
  "suggestions": [
    "Specific, actionable suggestion 1",
    "Specific, actionable suggestion 2",
    ...
  ]
}

Focus on:
- Typical ${genre} song structures
- Section placement best practices
- Length recommendations
- Hook/chorus strategies for ${genre}
`;
}

/**
 * System prompt for lyrics analysis
 */
const LYRICS_ANALYSIS_SYSTEM_PROMPT = `You are an expert music producer and songwriter specializing in song structure analysis.

Your task is to analyze song lyrics and identify:
1. Song sections (verse, chorus, pre-chorus, bridge, intro, outro, hook)
2. Repeated sections (especially choruses)
3. Structural patterns and conventions
4. Areas for improvement

Guidelines:
- Choruses typically repeat multiple times with identical or very similar lyrics
- Verses tell the story and vary between occurrences
- Bridges provide contrast and typically appear once
- Pre-choruses build tension before the chorus
- Consider line-by-line analysis for precise section boundaries
- Provide confidence scores (0-1) for your identifications
- Give specific, actionable recommendations

Return analysis in JSON format as specified in the user prompt.`;

/**
 * System prompt for genre-specific advice
 */
const GENRE_ADVICE_SYSTEM_PROMPT = `You are an expert music producer specializing in genre-specific song structures.

Provide specific, actionable advice for improving song structure based on genre conventions.

Consider:
- Typical section lengths and arrangements for the genre
- Standard vs. creative structural choices
- Hook placement and repetition strategies
- When to follow conventions vs. when to break them

Be specific and practical in your suggestions.`;

/**
 * Detect if lyrics have likely issues (for quick validation)
 */
export function quickLyricsValidation(lyrics: string): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  const lines = lyrics.split('\n').filter(line => line.trim() !== '');

  if (lines.length < 4) {
    warnings.push('Very short lyrics - may not be enough for structure analysis');
  }

  if (lines.length > 100) {
    warnings.push('Very long lyrics - consider breaking into multiple songs');
  }

  // Check for very repetitive content (might be placeholder)
  const uniqueLines = new Set(lines.map(l => l.trim().toLowerCase()));
  if (uniqueLines.size < lines.length * 0.3) {
    warnings.push('Highly repetitive content detected - verify lyrics are complete');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
