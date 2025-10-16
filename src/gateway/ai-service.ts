/**
 * AI Analysis Service
 * Analyzes session logs and provides command suggestions (manual trigger only)
 */

import OpenAI from 'openai';
import { AIAnalysisRequest, AIAnalysisResponse } from './types';
import { SessionMonitor } from './monitor';
import { logger } from './logger';
import { config } from './config';

export class AIService {
  private openai: OpenAI | null = null;
  private monitor: SessionMonitor;

  constructor(monitor: SessionMonitor) {
    this.monitor = monitor;

    if (config.enableAI && process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      logger.info('AI service initialized with OpenAI');
    } else {
      logger.warn('AI service disabled - OPENAI_API_KEY not set or ENABLE_AI=false');
    }
  }

  /**
   * Analyze session and provide suggestions (manual trigger only)
   */
  async analyzeSession(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    if (!this.openai) {
      throw new Error('AI service not available - OpenAI API key not configured');
    }

    const { sessionId, tokenBudget = 1000 } = request;

    // Get session data
    const buffer = this.monitor.getBuffer(sessionId);
    if (!buffer) {
      throw new Error('Session not found or no monitoring data available');
    }

    // Get summary and recent entries
    const summary = this.monitor.getSessionSummary(sessionId);
    const recentEntries = this.monitor.getRecentEntries(sessionId, 50);

    // Build context for AI
    const context = this.buildAnalysisContext(summary, recentEntries);

    logger.info('Requesting AI analysis', {
      sessionId,
      tokenBudget,
      entriesCount: recentEntries.length,
    });

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: tokenBudget,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: `You are a helpful DevOps assistant analyzing terminal session logs.
Your task is to:
1. Analyze the session activity and identify patterns
2. Suggest helpful commands based on the user's workflow
3. Assess risk levels for suggested commands
4. Provide a brief summary of the session

Focus on productivity and safety. Only suggest commands that are commonly used and safe.
Risk levels: low (read-only), medium (modifications), high (system changes), critical (destructive).

Respond in JSON format:
{
  "summary": "Brief session summary",
  "suggestions": [
    {
      "command": "example command",
      "description": "what it does",
      "riskLevel": "low|medium|high|critical",
      "requiresApproval": boolean
    }
  ]
}`,
          },
          {
            role: 'user',
            content: context,
          },
        ],
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      const tokenUsage = completion.usage?.total_tokens || 0;

      // Parse AI response
      const aiResponse = JSON.parse(responseText);

      logger.info('AI analysis completed', {
        sessionId,
        tokenUsage,
        suggestionsCount: aiResponse.suggestions?.length || 0,
      });

      return {
        suggestions: aiResponse.suggestions || [],
        summary: aiResponse.summary || 'No summary available',
        tokenUsage,
      };
    } catch (error) {
      logger.error('AI analysis failed', {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Build analysis context from session data
   */
  private buildAnalysisContext(summary: string, entries: any[]): string {
    let context = '=== Session Summary ===\n';
    context += summary + '\n\n';

    context += '=== Recent Activity ===\n';
    entries.forEach((entry) => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      if (entry.type === 'command') {
        context += `[${time}] COMMAND: ${entry.content}\n`;
      } else if (entry.type === 'denied') {
        context += `[${time}] DENIED: ${entry.content}\n`;
      } else if (entry.type === 'output' && this.isSignificantOutput(entry.content)) {
        context += `[${time}] OUTPUT: ${entry.content.substring(0, 100)}...\n`;
      }
    });

    return context;
  }

  /**
   * Check if output is significant for analysis
   */
  private isSignificantOutput(output: string): boolean {
    // Filter out noise - only include errors or important messages
    const significantPatterns = [/error/i, /warning/i, /failed/i, /success/i, /complete/i];

    return significantPatterns.some((pattern) => pattern.test(output));
  }

  /**
   * Check if command requires approval based on config and risk level
   */
  requiresApproval(riskLevel: 'low' | 'medium' | 'high' | 'critical'): boolean {
    if (!config.privilegedApproval) {
      return false;
    }

    // Require approval for high and critical risk commands
    return riskLevel === 'high' || riskLevel === 'critical';
  }
}
