/**
 * Adaptive Learning Service
 * JARVIS learns from each batch and improves processing
 */

import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
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

const LEARNING_FILE = '/tmp/jarvis-learning.json';

export interface LearningData {
  version: number;
  totalBatchesAnalyzed: number;
  lastUpdated: string;
  improvements: {
    parsingRules: string[];
    commonPatterns: string[];
    errorPatterns: string[];
    successfulTechniques: string[];
  };
  performanceMetrics: {
    averageConfidence: number;
    backgroundMusicDetectionRate: number;
    lyricExtractionQuality: number;
  };
}

export class AdaptiveLearningService {
  private learning: LearningData;

  constructor() {
    this.learning = this.loadLearning();
  }

  /**
   * Sanitize text for safe inclusion in API requests
   * Removes problematic Unicode characters that cause JSON encoding errors
   */
  private sanitizeText(text: string): string {
    return text
      // Replace unpaired surrogates with replacement character
      .replace(/[\uD800-\uDFFF]/g, '')
      // Remove other problematic Unicode characters
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Trim whitespace
      .trim();
  }

  /**
   * Load previous learning or initialize new
   */
  private loadLearning(): LearningData {
    if (fs.existsSync(LEARNING_FILE)) {
      logger.info('📚 Loading previous learning...');
      const data = fs.readFileSync(LEARNING_FILE, 'utf-8');
      return JSON.parse(data);
    }

    return {
      version: 1,
      totalBatchesAnalyzed: 0,
      lastUpdated: new Date().toISOString(),
      improvements: {
        parsingRules: [
          'Remove excessive repetitions of filler words (oh, ah, yeah)',
          'Filter out "Thanks for watching" and similar YouTube artifacts',
          'Detect instrumental sections by repeated non-lyrical sounds',
        ],
        commonPatterns: [],
        errorPatterns: [],
        successfulTechniques: [
          'Claude AI parsing with confidence scoring',
          'Background music detection via pattern matching',
        ],
      },
      performanceMetrics: {
        averageConfidence: 0.8,
        backgroundMusicDetectionRate: 0.7,
        lyricExtractionQuality: 0.8,
      },
    };
  }

  /**
   * Save learning to file
   */
  private saveLearning(): void {
    this.learning.lastUpdated = new Date().toISOString();
    this.learning.version++;
    fs.writeFileSync(LEARNING_FILE, JSON.stringify(this.learning, null, 2));
  }

  /**
   * Analyze a batch and learn from it
   */
  async analyzeBatchAndLearn(batchResults: {
    memos: Array<{
      fileName: string;
      originalTranscription: string;
      cleanedLyrics: string;
      confidence: number;
      hasBackgroundMusic: boolean;
      structure?: any;
    }>;
  }): Promise<{
    insights: string[];
    improvements: string[];
    newRules: string[];
  }> {
    try {
      logger.info('\n🧠 JARVIS is analyzing the batch and learning...');

      // Build analysis prompt
      const systemPrompt = `You are JARVIS, an adaptive AI system that learns from each batch of voice memo transcriptions.

Your task:
1. Analyze the batch results to identify patterns
2. Determine what worked well
3. Identify issues or areas for improvement
4. Suggest specific improvements for the next batch

Focus on:
- Common transcription errors
- Background music detection accuracy
- Lyric extraction quality
- Patterns in song structure
- Better ways to parse voice memos

Return a JSON object with:
{
  "insights": ["Key observations about this batch"],
  "improvements": ["Specific improvements to implement"],
  "newRules": ["New parsing rules to add"],
  "confidence": 0.0-1.0
}`;

      const userPrompt = `Analyze this batch of ${batchResults.memos.length} voice memos:

Current Learning State:
- Total batches analyzed: ${this.learning.totalBatchesAnalyzed}
- Average confidence: ${(this.learning.performanceMetrics.averageConfidence * 100).toFixed(1)}%
- Existing rules: ${this.learning.improvements.parsingRules.length}

Batch Results:
${batchResults.memos.map((memo, i) => `
Memo ${i + 1}: ${memo.fileName}
- Confidence: ${(memo.confidence * 100).toFixed(0)}%
- Background music: ${memo.hasBackgroundMusic ? 'Yes' : 'No'}
- Original length: ${memo.originalTranscription.split(' ').length} words
- Cleaned length: ${memo.cleanedLyrics.split(' ').length} words
- Sample original: ${this.sanitizeText(memo.originalTranscription.substring(0, 150))}...
- Sample cleaned: ${this.sanitizeText(memo.cleanedLyrics.substring(0, 150))}...
`).join('\n')}

Current Parsing Rules:
${this.learning.improvements.parsingRules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}

What can we learn? What should we improve for the next batch?`;

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

      // Parse response
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                       responseText.match(/\{[\s\S]*\}/);

      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
      const analysis = JSON.parse(jsonText);

      // Update learning
      this.learning.totalBatchesAnalyzed++;

      // Add new insights
      if (analysis.insights) {
        logger.info('\n💡 New Insights:');
        analysis.insights.forEach((insight: string) => {
          logger.info('   - ${insight}');
          if (!this.learning.improvements.commonPatterns.includes(insight)) {
            this.learning.improvements.commonPatterns.push(insight);
          }
        });
      }

      // Add new rules
      if (analysis.newRules) {
        logger.info('\n📋 New Rules to Apply:');
        analysis.newRules.forEach((rule: string) => {
          logger.info('   - ${rule}');
          if (!this.learning.improvements.parsingRules.includes(rule)) {
            this.learning.improvements.parsingRules.push(rule);
          }
        });
      }

      // Add improvements
      if (analysis.improvements) {
        logger.info('\n🔧 Improvements for Next Batch:');
        analysis.improvements.forEach((improvement: string) => {
          logger.info('   - ${improvement}');
          if (!this.learning.improvements.successfulTechniques.includes(improvement)) {
            this.learning.improvements.successfulTechniques.push(improvement);
          }
        });
      }

      // Update performance metrics
      const avgConfidence = batchResults.memos.reduce((sum, m) => sum + m.confidence, 0) / batchResults.memos.length;
      this.learning.performanceMetrics.averageConfidence =
        (this.learning.performanceMetrics.averageConfidence + avgConfidence) / 2;

      const bgMusicRate = batchResults.memos.filter(m => m.hasBackgroundMusic).length / batchResults.memos.length;
      this.learning.performanceMetrics.backgroundMusicDetectionRate =
        (this.learning.performanceMetrics.backgroundMusicDetectionRate + bgMusicRate) / 2;

      // Save learning
      this.saveLearning();

      logger.info('\n✅ Learning updated (Version ${this.learning.version})');

      return {
        insights: analysis.insights || [],
        improvements: analysis.improvements || [],
        newRules: analysis.newRules || [],
      };
    } catch (error) {
      logger.error('Learning analysis error', { error: error.message || String(error) });
      return {
        insights: [],
        improvements: [],
        newRules: [],
      };
    }
  }

  /**
   * Review and consolidate all learnings - meta-learning layer
   * Every 5 batches, JARVIS reviews ALL previous learnings and consolidates them
   */
  async reviewAndConsolidateLearnings(): Promise<{
    consolidated: boolean;
    removedRules: number;
    updatedRules: number;
    summary: string;
  }> {
    try {
      logger.info('\n🔄 JARVIS is reviewing ALL previous learnings...');

      const systemPrompt = `You are JARVIS, an adaptive AI system performing meta-learning - learning about your own learning process.

Your task:
1. Review ALL accumulated insights, rules, and improvements from the beginning
2. Consolidate duplicate or similar rules
3. Remove contradictory rules (keep the most recent/accurate)
4. Update outdated rules based on new evidence
5. Identify patterns across all batches
6. Create a refined, consolidated set of learnings

Focus on:
- Removing redundancy
- Resolving contradictions
- Building cumulative knowledge
- Identifying meta-patterns about the learning process itself

Return a JSON object with:
{
  "consolidatedRules": ["Refined, deduplicated parsing rules"],
  "consolidatedPatterns": ["Key patterns observed across all batches"],
  "consolidatedTechniques": ["Proven techniques that work consistently"],
  "removedRules": ["Rules that were removed and why"],
  "updatedRules": ["Rules that were updated and how"],
  "metaInsights": ["Higher-level insights about the learning process"],
  "summary": "Brief summary of consolidation"
}`;

      const userPrompt = `Review and consolidate ALL learnings from ${this.learning.totalBatchesAnalyzed} batches:

CURRENT PARSING RULES (${this.learning.improvements.parsingRules.length}):
${this.learning.improvements.parsingRules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}

OBSERVED PATTERNS (${this.learning.improvements.commonPatterns.length}):
${this.learning.improvements.commonPatterns.map((pattern, i) => `${i + 1}. ${pattern}`).join('\n')}

SUCCESSFUL TECHNIQUES (${this.learning.improvements.successfulTechniques.length}):
${this.learning.improvements.successfulTechniques.map((tech, i) => `${i + 1}. ${tech}`).join('\n')}

Performance Metrics:
- Average confidence: ${(this.learning.performanceMetrics.averageConfidence * 100).toFixed(1)}%
- Background music detection rate: ${(this.learning.performanceMetrics.backgroundMusicDetectionRate * 100).toFixed(1)}%

Consolidate these learnings into a refined, deduplicated knowledge base. Remove contradictions, merge similar rules, and identify meta-patterns.`;

      const anthropic = getAnthropicClient();
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

      // Parse response
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                       responseText.match(/\{[\s\S]*\}/);

      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
      const consolidation = JSON.parse(jsonText);

      // Apply consolidation
      const oldRulesCount = this.learning.improvements.parsingRules.length;
      const oldPatternsCount = this.learning.improvements.commonPatterns.length;

      this.learning.improvements.parsingRules = consolidation.consolidatedRules || this.learning.improvements.parsingRules;
      this.learning.improvements.commonPatterns = consolidation.consolidatedPatterns || this.learning.improvements.commonPatterns;
      this.learning.improvements.successfulTechniques = consolidation.consolidatedTechniques || this.learning.improvements.successfulTechniques;

      const removedRules = oldRulesCount - this.learning.improvements.parsingRules.length;
      const updatedRules = (consolidation.updatedRules || []).length;

      // Save consolidated learning
      this.saveLearning();

      logger.info('\n🎯 Learning Consolidation Complete:');
      logger.info('   Parsing rules: ${oldRulesCount} → ${this.learning.improvements.parsingRules.length} (-${removedRules})');
      logger.info('   Patterns: ${oldPatternsCount} → ${this.learning.improvements.commonPatterns.length}');
      if (consolidation.metaInsights) {
        logger.info('\n💡 Meta-Insights:');
        consolidation.metaInsights.forEach((insight: string) => logger.info('   - ${insight}'););
      }
      logger.info('\n📝 ${consolidation.summary}');

      return {
        consolidated: true,
        removedRules,
        updatedRules,
        summary: consolidation.summary || 'Learnings consolidated successfully',
      };
    } catch (error) {
      logger.error('Learning consolidation error', { error: error.message || String(error) });
      return {
        consolidated: false,
        removedRules: 0,
        updatedRules: 0,
        summary: 'Consolidation failed',
      };
    }
  }

  /**
   * Get enhanced system prompt based on learning
   */
  getEnhancedParsingPrompt(): string {
    const basePrompt = `You are an expert music transcription parser specializing in extracting clean lyrics from voice memo transcriptions.

Your task:
1. Identify and extract ONLY the sung/spoken lyrics
2. Remove background music descriptions, beat sounds, instrumental markers
3. Filter out non-lyrical sounds
4. Detect song structure (verse, chorus, bridge)
5. Preserve the artist's intended words and phrasing`;

    const learningPrompt = `

LEARNED PARSING RULES (from ${this.learning.totalBatchesAnalyzed} batches):
${this.learning.improvements.parsingRules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}

COMMON PATTERNS OBSERVED:
${this.learning.improvements.commonPatterns.map((pattern, i) => `${i + 1}. ${pattern}`).join('\n')}

SUCCESSFUL TECHNIQUES:
${this.learning.improvements.successfulTechniques.map((tech, i) => `${i + 1}. ${tech}`).join('\n')}`;

    return basePrompt + learningPrompt;
  }

  /**
   * Get current learning stats
   */
  getLearningStats(): LearningData {
    return this.learning;
  }

  /**
   * Reset learning (start fresh)
   */
  reset(): void {
    if (fs.existsSync(LEARNING_FILE)) {
      fs.unlinkSync(LEARNING_FILE);
    }
    this.learning = this.loadLearning();
    logger.info('🔄 Learning reset - starting fresh');
  }

  /**
   * Analyze batch results and determine note management actions
   * (update, delete, merge)
   */
  async analyzeAndManageNotes(batchResults: {
    memos: Array<{
      fileName: string;
      noteId: string;
      originalTranscription: string;
      cleanedLyrics: string;
      confidence: number;
      hasBackgroundMusic: boolean;
      structure?: any;
    }>;
  }): Promise<{
    actions: Array<{
      type: 'delete' | 'merge' | 'update';
      noteId: string;
      reason: string;
      targetNoteId?: string; // For merge operations
      sourceNoteIds?: string[]; // For merge operations
      updates?: { title?: string; content?: string }; // For update operations
    }>;
  }> {
    try {
      logger.info('\n🔧 Analyzing batch for note management actions...');

      const systemPrompt = `You are JARVIS, an adaptive AI system managing a music note database.

Your task:
1. Analyze the batch of voice memo transcriptions and notes
2. Identify notes that should be deleted (low quality, corrupted, empty, too short)
3. Identify notes that should be merged (duplicates, same song, related content)
4. Identify notes that need updates (corrections, improvements)

Deletion criteria:
- Very low confidence (<0.3)
- Almost no content (< 10 words)
- Completely corrupted transcription
- Only contains noise/filler words

Merge criteria:
- Same song detected (similar lyrics, same title)
- Related recordings (continuations, different takes)
- Duplicate content

Update criteria:
- Title needs correction
- Content needs cleanup
- Structure needs improvement

Return a JSON object:
{
  "actions": [
    {
      "type": "delete",
      "noteId": "note_id",
      "reason": "Why this note should be deleted"
    },
    {
      "type": "merge",
      "noteId": "target_note_id",
      "sourceNoteIds": ["source1", "source2"],
      "reason": "Why these notes should be merged"
    },
    {
      "type": "update",
      "noteId": "note_id",
      "updates": {
        "title": "New title",
        "content": "Updated content"
      },
      "reason": "Why this note should be updated"
    }
  ]
}`;

      const userPrompt = `Analyze this batch of ${batchResults.memos.length} voice memos and determine management actions:

Batch Results:
${batchResults.memos.map((memo, i) => `
Memo ${i + 1}: ${memo.fileName}
- Note ID: ${memo.noteId}
- Confidence: ${(memo.confidence * 100).toFixed(0)}%
- Background music: ${memo.hasBackgroundMusic ? 'Yes' : 'No'}
- Word count (original): ${memo.originalTranscription.split(' ').length}
- Word count (cleaned): ${memo.cleanedLyrics.split(' ').length}
- Content preview: ${this.sanitizeText(memo.cleanedLyrics.substring(0, 200))}...
`).join('\n')}

Current Learning Context:
- Total batches analyzed: ${this.learning.totalBatchesAnalyzed}
- Parsing rules: ${this.learning.improvements.parsingRules.length}

What management actions should be taken?`;

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

      // Parse response
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                       responseText.match(/\{[\s\S]*\}/);

      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
      const analysis = JSON.parse(jsonText);

      // Log actions
      if (analysis.actions && analysis.actions.length > 0) {
        logger.info('\n📊 Recommended Actions: ${analysis.actions.length}');

        const deleteCount = analysis.actions.filter((a: any) => a.type === 'delete').length;
        const mergeCount = analysis.actions.filter((a: any) => a.type === 'merge').length;
        const updateCount = analysis.actions.filter((a: any) => a.type === 'update').length;

        if (deleteCount > 0) logger.info('   🗑️  Delete: ${deleteCount} notes');
        if (mergeCount > 0) logger.info('   🔗 Merge: ${mergeCount} groups');
        if (updateCount > 0) logger.info('   ✏️  Update: ${updateCount} notes');
      }

      return {
        actions: analysis.actions || [],
      };
    } catch (error) {
      logger.error('Note management analysis error', { error: error.message || String(error) });
      return {
        actions: [],
      };
    }
  }

  /**
   * Auto-comp: Identify takes of the same song and comp them together
   */
  async autoCompRelatedTakes(memos: Array<{
    fileName: string;
    noteId: string;
    originalTranscription: string;
    cleanedLyrics: string;
    confidence: number;
  }>): Promise<{
    comps: Array<{
      songTitle: string;
      takeNoteIds: string[];
      reason: string;
    }>;
  }> {
    // Group memos by similarity to identify takes of the same song
    const groups: Map<string, typeof memos> = new Map();

    for (const memo of memos) {
      // Find group this memo belongs to by checking similarity with existing groups
      let foundGroup = false;

      for (const [key, group] of groups.entries()) {
        // Check if this memo is similar to any memo in the group
        const isSimilar = group.some(existingMemo => {
          return this.areTakesOfSameSong(memo.cleanedLyrics, existingMemo.cleanedLyrics);
        });

        if (isSimilar) {
          group.push(memo);
          foundGroup = true;
          break;
        }
      }

      if (!foundGroup) {
        // Create new group
        const firstLine = memo.cleanedLyrics.split('\n')[0].slice(0, 50);
        groups.set(firstLine || memo.fileName, [memo]);
      }
    }

    // Identify groups with multiple takes (candidates for comping)
    const comps: Array<{
      songTitle: string;
      takeNoteIds: string[];
      reason: string;
    }> = [];

    for (const [songTitle, takes] of groups.entries()) {
      if (takes.length >= 2) {
        // Sort by confidence (best quality first)
        takes.sort((a, b) => b.confidence - a.confidence);

        // Multiple takes detected - recommend comp
        comps.push({
          songTitle,
          takeNoteIds: takes.map(t => t.noteId),
          reason: `Found ${takes.length} takes of the same song - comping from best quality (${(takes[0].confidence * 100).toFixed(0)}% conf)`,
        });
      }
    }

    return { comps };
  }

  /**
   * Check if two lyrics are takes of the same song
   */
  private areTakesOfSameSong(lyrics1: string, lyrics2: string): boolean {
    // Normalize lyrics for comparison
    const normalize = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .trim()
        .split(/\s+/)
        .slice(0, 20) // First 20 words
        .join(' ');
    };

    const normalized1 = normalize(lyrics1);
    const normalized2 = normalize(lyrics2);

    // Calculate similarity
    const words1 = normalized1.split(' ');
    const words2 = normalized2.split(' ');

    const commonWords = words1.filter(w => words2.includes(w));
    const similarity = commonWords.length / Math.max(words1.length, words2.length);

    // If >60% of words match in first 20 words, likely same song
    return similarity > 0.6;
  }
}

export const adaptiveLearningService = new AdaptiveLearningService();
