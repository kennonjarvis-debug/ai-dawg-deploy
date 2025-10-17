/**
 * AI Analysis Service
 * Uses Claude to analyze notes and determine appropriate actions
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';
import type { AIAnalysis, Action, AnalysisRequest, Note } from '../../types/notes.js';

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

let anthropicClient: Anthropic | null = null;
const prisma = new PrismaClient();

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

export class AnalysisService {
  /**
   * Analyze a note and determine appropriate actions
   */
  async analyzeNote(note: Note, appContext: 'jarvis' | 'dawg_ai', userPreferences?: any): Promise<AIAnalysis> {
    try {
      console.log(`Analyzing note ${note.id} for ${appContext}`);

      const systemPrompt = this.buildSystemPrompt(appContext, userPreferences);
      const userPrompt = this.buildUserPrompt(note);

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

      const analysisText = response.content[0].type === 'text' ? response.content[0].text : '';
      const analysis = await this.parseAndSaveAnalysisResponse(analysisText, note.id, appContext);

      console.log(`Analysis complete: ${analysis.contentType} (confidence: ${analysis.confidence})`);

      return analysis;
    } catch (error) {
      console.error('Analysis error:', error);
      throw new Error(`Failed to analyze note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build system prompt based on app context
   */
  private buildSystemPrompt(appContext: 'jarvis' | 'dawg_ai', userPreferences?: any): string {
    const basePrompt = `You are an intelligent content analyzer that helps users manage their notes and voice memos.
Your job is to:
1. Classify the content type
2. Extract key information
3. Suggest appropriate actions based on the app context

Return your analysis as a JSON object with this structure:
{
  "contentType": "song_lyrics | song_idea | reminder | meeting_note | todo | general_note | other",
  "confidence": 0.0-1.0,
  "summary": "Brief summary of the content",
  "extractedData": {
    "keywords": ["key", "words"],
    "entities": ["people", "places"],
    "dates": ["any dates mentioned"],
    "actionItems": ["things to do"],
    "songStructure": {
      "verses": ["verse text"],
      "chorus": ["chorus text"],
      "bridge": "bridge text"
    }
  },
  "suggestedActions": [
    {
      "type": "action_type",
      "priority": "high | medium | low",
      "description": "What to do",
      "appContext": "jarvis | dawg_ai | both",
      "metadata": {}
    }
  ]
}`;

    if (appContext === 'dawg_ai') {
      return `${basePrompt}

APP CONTEXT: DAWG AI (Music Production & Songwriting Assistant)

Focus on:
- Identifying song lyrics, melodies, and musical ideas
- Detecting song structure (verse, chorus, bridge)
- Analyzing writing style and patterns
- Suggesting song improvements, production ideas
- Recommending track creation or recording sessions
${userPreferences?.musicGenre ? `\nUser's preferred genre: ${userPreferences.musicGenre}` : ''}
${userPreferences?.writingStyle ? `\nUser's writing style: ${userPreferences.writingStyle}` : ''}

Suggested action types for DAWG AI:
- "finalize_song": Complete and polish a song
- "create_track": Set up a new recording track
- "suggest_improvements": Offer lyric/melody suggestions
- "archive": Save for later reference`;
    } else {
      return `${basePrompt}

APP CONTEXT: JARVIS (Personal AI Assistant)

Focus on:
- Identifying reminders, calendar events, and tasks
- Extracting dates, times, and locations
- Detecting meeting notes and action items
- Prioritizing tasks and deadlines

Suggested action types for JARVIS:
- "schedule_event": Create calendar event
- "create_reminder": Set up reminder
- "create_todo": Add to task list
- "archive": Save for reference

Ignore musical/songwriting content - those are for DAWG AI.`;
    }
  }

  /**
   * Build user prompt with note content
   */
  private buildUserPrompt(note: Note): string {
    return `Please analyze the following note:

Title: ${note.title}
Source: ${note.sourceType}
Created: ${note.createdAt.toISOString()}

Content:
${note.content}

Provide your analysis as a JSON object.`;
  }

  /**
   * Parse Claude's response and save to database
   */
  private async parseAndSaveAnalysisResponse(responseText: string, noteId: string, appContext: string): Promise<AIAnalysis> {
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                       responseText.match(/\{[\s\S]*\}/);

      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
      const parsed = JSON.parse(jsonText);

      // Save analysis and actions to database
      const dbAnalysis = await prisma.aIAnalysis.create({
        data: {
          noteId,
          contentType: parsed.contentType || 'other',
          confidence: parsed.confidence || 0.5,
          summary: parsed.summary || 'No summary available',
          appContext,
          extractedData: parsed.extractedData || {},
          actions: {
            create: (parsed.suggestedActions || []).map((action: any) => ({
              type: action.type,
              priority: action.priority || 'medium',
              description: action.description,
              appContext: action.appContext || appContext,
              metadata: action.metadata || {},
            })),
          },
        },
        include: {
          actions: true,
        },
      });

      // Convert to our AIAnalysis type
      return {
        id: dbAnalysis.id,
        noteId: dbAnalysis.noteId,
        analyzedAt: dbAnalysis.analyzedAt,
        contentType: dbAnalysis.contentType as any,
        confidence: dbAnalysis.confidence,
        summary: dbAnalysis.summary,
        extractedData: dbAnalysis.extractedData as any,
        suggestedActions: dbAnalysis.actions.map(action => ({
          type: action.type,
          priority: action.priority as 'high' | 'medium' | 'low',
          description: action.description,
          appContext: action.appContext as 'jarvis' | 'dawg_ai' | 'both',
          metadata: action.metadata as any,
        })),
      };
    } catch (error) {
      console.error('Failed to parse analysis response:', error);
      // Return fallback analysis and save it
      const dbAnalysis = await prisma.aIAnalysis.create({
        data: {
          noteId,
          contentType: 'other',
          confidence: 0.3,
          summary: 'Failed to analyze content',
          appContext,
          extractedData: {},
        },
      });

      return {
        id: dbAnalysis.id,
        noteId: dbAnalysis.noteId,
        analyzedAt: dbAnalysis.analyzedAt,
        contentType: 'other',
        confidence: 0.3,
        summary: 'Failed to analyze content',
        extractedData: {},
        suggestedActions: [],
      };
    }
  }

  /**
   * Batch analyze multiple notes
   */
  async analyzeBatch(notes: Note[], appContext: 'jarvis' | 'dawg_ai'): Promise<AIAnalysis[]> {
    const analyses: AIAnalysis[] = [];

    for (const note of notes) {
      try {
        const analysis = await this.analyzeNote(note, appContext);
        analyses.push(analysis);
      } catch (error) {
        console.error(`Failed to analyze note ${note.id}:`, error);
      }
    }

    return analyses;
  }

  /**
   * Re-analyze with different context
   */
  async reanalyzeForContext(noteId: string, note: Note, newContext: 'jarvis' | 'dawg_ai'): Promise<AIAnalysis> {
    return this.analyzeNote(note, newContext);
  }

  /**
   * Get analyses for a note
   */
  async getAnalysesForNote(noteId: string): Promise<AIAnalysis[]> {
    const dbAnalyses = await prisma.aIAnalysis.findMany({
      where: { noteId },
      include: { actions: true },
      orderBy: { analyzedAt: 'desc' },
    });

    return dbAnalyses.map(dbAnalysis => ({
      id: dbAnalysis.id,
      noteId: dbAnalysis.noteId,
      analyzedAt: dbAnalysis.analyzedAt,
      contentType: dbAnalysis.contentType as any,
      confidence: dbAnalysis.confidence,
      summary: dbAnalysis.summary,
      extractedData: dbAnalysis.extractedData as any,
      suggestedActions: dbAnalysis.actions.map(action => ({
        type: action.type,
        priority: action.priority as 'high' | 'medium' | 'low',
        description: action.description,
        appContext: action.appContext as 'jarvis' | 'dawg_ai' | 'both',
        metadata: action.metadata as any,
      })),
    }));
  }
}

export const analysisService = new AnalysisService();
