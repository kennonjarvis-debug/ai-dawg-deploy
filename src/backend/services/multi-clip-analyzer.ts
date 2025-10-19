/**
 * Multi-Clip Analysis Service
 *
 * Analyzes multiple audio clips simultaneously to:
 * - Extract metadata from each clip (BPM, key, energy, vocals vs instrumental)
 * - Identify relationships between clips (complementary keys, matching BPMs)
 * - Suggest arrangement order
 * - Detect conflicts (clashing keys, tempo mismatches)
 *
 * Uses MetadataAnalyzer for individual clip analysis
 */

import { MetadataAnalyzer } from './MetadataAnalyzer';
import { logger } from '../utils/logger';
import OpenAI from 'openai';
import { logApiUsage, calculateGPT4oCost } from './cost-monitoring-service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Clip metadata with ID
 */
export interface ClipMetadata {
  clipId: string;
  clipName: string;
  bpm?: number;
  key?: string;
  scale?: string;
  energy?: number;
  isVocal: boolean;
  duration: number;
  vocalCharacteristics?: any;
  rhythmCharacteristics?: any;
  style?: any;
}

/**
 * Relationship between two clips
 */
export interface ClipRelationship {
  clipId1: string;
  clipId2: string;
  relationshipType: 'complementary' | 'matching' | 'conflicting' | 'neutral';
  score: number; // 0-1, higher is better
  reasons: string[];
}

/**
 * Arrangement suggestion
 */
export interface ArrangementSuggestion {
  order: string[]; // Clip IDs in suggested order
  reasoning: string;
  sections: Array<{
    name: string;
    clipIds: string[];
    startTime?: number;
    duration?: number;
  }>;
}

/**
 * Conflict detection
 */
export interface ClipConflict {
  clipIds: string[];
  conflictType: 'tempo-mismatch' | 'key-clash' | 'energy-mismatch' | 'style-clash';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion?: string;
}

/**
 * Multi-clip analysis result
 */
export interface MultiClipAnalysisResult {
  clips: ClipMetadata[];
  relationships: ClipRelationship[];
  arrangementSuggestions: ArrangementSuggestion[];
  conflicts: ClipConflict[];
  aiRecommendations: string[];
  cost: {
    totalCost: number;
    inputTokens: number;
    outputTokens: number;
    breakdown: string;
  };
}

/**
 * Analyze multiple clips simultaneously
 */
export async function analyzeMultipleClips(
  clips: Array<{
    clipId: string;
    clipName: string;
    audioBuffer: AudioBuffer;
    suggestedType?: 'vocal' | 'instrument';
  }>,
  userId: string,
  options: {
    suggestArrangement?: boolean;
    detectConflicts?: boolean;
  } = {}
): Promise<MultiClipAnalysisResult> {
  const startTime = Date.now();

  try {
    logger.info('[MultiClipAnalyzer] Starting analysis', {
      userId,
      clipCount: clips.length,
    });

    if (clips.length === 0) {
      throw new Error('No clips provided for analysis');
    }

    if (clips.length > 10) {
      throw new Error('Maximum 10 clips can be analyzed simultaneously');
    }

    // Analyze each clip individually
    const analyzer = new MetadataAnalyzer();
    const clipMetadata: ClipMetadata[] = [];

    for (const clip of clips) {
      const metadata = await analyzer.analyzeAudio(clip.audioBuffer, {
        trackType: clip.suggestedType || 'unknown',
      });

      const isVocal = clip.suggestedType === 'vocal' || analyzer.detectIsVocal(clip.audioBuffer);

      clipMetadata.push({
        clipId: clip.clipId,
        clipName: clip.clipName,
        bpm: metadata.rhythmCharacteristics?.bpm,
        key: metadata.rhythmCharacteristics?.key,
        scale: metadata.rhythmCharacteristics?.scale,
        energy: metadata.style?.energy,
        isVocal,
        duration: clip.audioBuffer.duration,
        vocalCharacteristics: metadata.vocalCharacteristics,
        rhythmCharacteristics: metadata.rhythmCharacteristics,
        style: metadata.style,
      });
    }

    // Analyze relationships between clips
    const relationships = analyzeClipRelationships(clipMetadata);

    // Detect conflicts
    const conflicts = options.detectConflicts
      ? detectClipConflicts(clipMetadata, relationships)
      : [];

    // Get AI-powered arrangement suggestions and recommendations
    let arrangementSuggestions: ArrangementSuggestion[] = [];
    let aiRecommendations: string[] = [];
    let aiCost = { inputTokens: 0, outputTokens: 0 };

    if (options.suggestArrangement && clipMetadata.length >= 2) {
      const aiResult = await getAIArrangementSuggestions(
        clipMetadata,
        relationships,
        conflicts,
        userId
      );
      arrangementSuggestions = aiResult.suggestions;
      aiRecommendations = aiResult.recommendations;
      aiCost = aiResult.cost;
    }

    // Calculate total cost
    const costCalc = calculateGPT4oCost(aiCost.inputTokens, aiCost.outputTokens);

    const duration = Date.now() - startTime;

    logger.info('[MultiClipAnalyzer] Analysis complete', {
      userId,
      duration,
      clipCount: clips.length,
      relationshipsFound: relationships.length,
      conflictsFound: conflicts.length,
      cost: costCalc.totalCost,
    });

    return {
      clips: clipMetadata,
      relationships,
      arrangementSuggestions,
      conflicts,
      aiRecommendations,
      cost: {
        totalCost: costCalc.totalCost,
        inputTokens: aiCost.inputTokens,
        outputTokens: aiCost.outputTokens,
        breakdown: costCalc.breakdown || '',
      },
    };
  } catch (error) {
    logger.error('[MultiClipAnalyzer] Analysis failed', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Analyze relationships between clips
 */
function analyzeClipRelationships(clips: ClipMetadata[]): ClipRelationship[] {
  const relationships: ClipRelationship[] = [];

  for (let i = 0; i < clips.length; i++) {
    for (let j = i + 1; j < clips.length; j++) {
      const clip1 = clips[i];
      const clip2 = clips[j];

      const relationship = analyzeClipPair(clip1, clip2);
      relationships.push(relationship);
    }
  }

  return relationships;
}

/**
 * Analyze relationship between two clips
 */
function analyzeClipPair(clip1: ClipMetadata, clip2: ClipMetadata): ClipRelationship {
  const reasons: string[] = [];
  let score = 0.5; // Start neutral
  let relationshipType: ClipRelationship['relationshipType'] = 'neutral';

  // BPM matching
  if (clip1.bpm && clip2.bpm) {
    const bpmDiff = Math.abs(clip1.bpm - clip2.bpm);
    if (bpmDiff <= 2) {
      score += 0.3;
      reasons.push(`Matching BPM (${clip1.bpm} vs ${clip2.bpm})`);
    } else if (bpmDiff <= 5) {
      score += 0.1;
      reasons.push(`Close BPM (${clip1.bpm} vs ${clip2.bpm})`);
    } else if (bpmDiff > 20) {
      score -= 0.2;
      reasons.push(`Tempo mismatch (${clip1.bpm} vs ${clip2.bpm} BPM)`);
    }
  }

  // Key compatibility
  if (clip1.key && clip2.key) {
    if (clip1.key === clip2.key) {
      score += 0.3;
      reasons.push(`Same key (${clip1.key})`);
    } else if (isComplementaryKey(clip1.key, clip2.key)) {
      score += 0.2;
      reasons.push(`Complementary keys (${clip1.key} and ${clip2.key})`);
    } else {
      score -= 0.1;
      reasons.push(`Different keys (${clip1.key} vs ${clip2.key})`);
    }
  }

  // Energy matching
  if (clip1.energy !== undefined && clip2.energy !== undefined) {
    const energyDiff = Math.abs(clip1.energy - clip2.energy);
    if (energyDiff <= 0.2) {
      score += 0.1;
      reasons.push('Similar energy levels');
    } else if (energyDiff > 0.5) {
      score += 0.05; // Can be good for contrast
      reasons.push('Contrasting energy (good for dynamics)');
    }
  }

  // Vocal/instrumental pairing
  if (clip1.isVocal !== clip2.isVocal) {
    score += 0.1;
    reasons.push('Vocal + instrumental pairing');
  }

  // Determine relationship type
  if (score >= 0.7) {
    relationshipType = 'complementary';
  } else if (score >= 0.5) {
    relationshipType = 'matching';
  } else if (score < 0.3) {
    relationshipType = 'conflicting';
  }

  return {
    clipId1: clip1.clipId,
    clipId2: clip2.clipId,
    relationshipType,
    score: Math.max(0, Math.min(1, score)),
    reasons,
  };
}

/**
 * Check if two keys are complementary
 */
function isComplementaryKey(key1: string, key2: string): boolean {
  const complementaryPairs: Record<string, string[]> = {
    'C': ['Am', 'G', 'F'],
    'G': ['Em', 'C', 'D'],
    'D': ['Bm', 'G', 'A'],
    'A': ['F#m', 'D', 'E'],
    'E': ['C#m', 'A', 'B'],
    'F': ['Dm', 'C', 'Bb'],
    'Bb': ['Gm', 'F', 'Eb'],
    'Eb': ['Cm', 'Bb', 'Ab'],
  };

  const pair = complementaryPairs[key1];
  return pair ? pair.includes(key2) : false;
}

/**
 * Detect conflicts between clips
 */
function detectClipConflicts(
  clips: ClipMetadata[],
  relationships: ClipRelationship[]
): ClipConflict[] {
  const conflicts: ClipConflict[] = [];

  // Find conflicting relationships
  for (const rel of relationships) {
    if (rel.relationshipType === 'conflicting') {
      const clip1 = clips.find(c => c.clipId === rel.clipId1);
      const clip2 = clips.find(c => c.clipId === rel.clipId2);

      if (!clip1 || !clip2) continue;

      // Determine conflict type
      if (clip1.bpm && clip2.bpm && Math.abs(clip1.bpm - clip2.bpm) > 20) {
        conflicts.push({
          clipIds: [rel.clipId1, rel.clipId2],
          conflictType: 'tempo-mismatch',
          severity: 'high',
          description: `Tempo mismatch: ${clip1.clipName} (${clip1.bpm} BPM) vs ${clip2.clipName} (${clip2.bpm} BPM)`,
          suggestion: 'Consider time-stretching one clip to match the other, or use them in different sections',
        });
      }

      if (clip1.key && clip2.key && !isComplementaryKey(clip1.key, clip2.key) && clip1.key !== clip2.key) {
        conflicts.push({
          clipIds: [rel.clipId1, rel.clipId2],
          conflictType: 'key-clash',
          severity: 'medium',
          description: `Key clash: ${clip1.clipName} (${clip1.key}) vs ${clip2.clipName} (${clip2.key})`,
          suggestion: 'Consider pitch-shifting one clip, or use in separate sections',
        });
      }
    }
  }

  return conflicts;
}

/**
 * Get AI-powered arrangement suggestions
 */
async function getAIArrangementSuggestions(
  clips: ClipMetadata[],
  relationships: ClipRelationship[],
  conflicts: ClipConflict[],
  userId: string
): Promise<{
  suggestions: ArrangementSuggestion[];
  recommendations: string[];
  cost: { inputTokens: number; outputTokens: number };
}> {
  try {
    const prompt = buildArrangementPrompt(clips, relationships, conflicts);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: ARRANGEMENT_SYSTEM_PROMPT,
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
      return { suggestions: [], recommendations: [], cost: { inputTokens: 0, outputTokens: 0 } };
    }

    const analysis = JSON.parse(response);

    // Log API usage
    const inputTokens = completion.usage?.prompt_tokens || 0;
    const outputTokens = completion.usage?.completion_tokens || 0;

    await logApiUsage(userId, 'gpt-4o', 'chat', {
      inputTokens,
      outputTokens,
    }, {
      operation: 'multi-clip-arrangement',
      clipCount: clips.length,
    });

    return {
      suggestions: analysis.arrangements || [],
      recommendations: analysis.recommendations || [],
      cost: { inputTokens, outputTokens },
    };
  } catch (error) {
    logger.error('[MultiClipAnalyzer] AI arrangement failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { suggestions: [], recommendations: [], cost: { inputTokens: 0, outputTokens: 0 } };
  }
}

/**
 * Build arrangement prompt
 */
function buildArrangementPrompt(
  clips: ClipMetadata[],
  relationships: ClipRelationship[],
  conflicts: ClipConflict[]
): string {
  const clipsInfo = clips.map((c, i) => ({
    index: i,
    id: c.clipId,
    name: c.clipName,
    bpm: c.bpm,
    key: c.key,
    energy: c.energy,
    isVocal: c.isVocal,
    duration: c.duration,
  }));

  return `
Analyze these audio clips and suggest optimal arrangements:

CLIPS:
${JSON.stringify(clipsInfo, null, 2)}

RELATIONSHIPS:
${JSON.stringify(relationships, null, 2)}

CONFLICTS:
${JSON.stringify(conflicts, null, 2)}

Provide arrangement suggestions in JSON format:
{
  "arrangements": [
    {
      "order": ["clipId1", "clipId2", ...],
      "reasoning": "Why this arrangement works",
      "sections": [
        {
          "name": "Intro",
          "clipIds": ["clipId1"],
          "startTime": 0,
          "duration": 8
        },
        ...
      ]
    }
  ],
  "recommendations": [
    "Specific, actionable recommendation 1",
    "Specific, actionable recommendation 2",
    ...
  ]
}

Consider:
- Song structure conventions (intro, verse, chorus, bridge, outro)
- BPM and key compatibility
- Energy flow and dynamics
- Vocal vs instrumental balance
- Transitions between clips
- Conflict resolution
`;
}

/**
 * System prompt for arrangement suggestions
 */
const ARRANGEMENT_SYSTEM_PROMPT = `You are an expert music producer and arranger specializing in song composition.

Your task is to analyze multiple audio clips and suggest optimal arrangements that create cohesive, engaging songs.

Consider:
- Musical compatibility (BPM, key, energy)
- Song structure conventions
- Dynamic flow and energy progression
- Vocal/instrumental balance
- Transition quality
- Genre conventions

Provide specific, actionable arrangement suggestions with clear reasoning.`;

/**
 * Estimate cost for multi-clip analysis
 */
export function estimateMultiClipAnalysisCost(clipCount: number, includeArrangement: boolean): {
  estimatedCost: number;
  inputTokens: number;
  outputTokens: number;
  breakdown: string;
} {
  if (!includeArrangement) {
    // No AI calls, no cost
    return {
      estimatedCost: 0,
      inputTokens: 0,
      outputTokens: 0,
      breakdown: 'No AI analysis - using local metadata extraction only',
    };
  }

  // Estimate tokens based on clip count
  const baseInputTokens = 800; // System prompt and base context
  const perClipTokens = 200; // Metadata per clip
  const inputTokens = baseInputTokens + (clipCount * perClipTokens);

  const outputTokens = 1000; // Typical arrangement suggestion output

  const costCalc = calculateGPT4oCost(inputTokens, outputTokens);

  return {
    estimatedCost: costCalc.totalCost,
    inputTokens,
    outputTokens,
    breakdown: `${clipCount} clips: ${inputTokens} input tokens + ${outputTokens} output tokens = $${costCalc.totalCost.toFixed(6)}`,
  };
}
