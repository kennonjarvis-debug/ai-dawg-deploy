/**
 * Jarvis - AI Creative Companion
 * Instance 2: Jarvis AI Brain + NLU
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Command } from '../commands/types';
import { safeValidateCommand } from '../commands/types';
import { JARVIS_SYSTEM_PROMPT } from '../prompts/jarvis-system';
import type { SessionContext, UserProfile } from '../context/SessionContext';
import { CommandParser } from '../nlu/CommandParser';

import { logger } from '$lib/utils/logger';
/**
 * Jarvis response interface
 */
export interface JarvisResponse {
  commands: Command[];           // DAW actions to execute
  response: string;              // Chat message to user (1-2 sentences)
  mood: 'supportive' | 'excited' | 'challenging' | 'chill';
  suggestions?: string[];        // Proactive ideas
  confidence: number;            // 0-1
}

/**
 * Jarvis input interface
 */
export interface JarvisInput {
  transcript: string;
  sessionContext: SessionContext;
  userProfile: UserProfile;
}

/**
 * Jarvis AI - Creative companion brain
 */
export class Jarvis {
  private claude: Anthropic;
  private parser: CommandParser;
  private systemPrompt: string;

  constructor(apiKey?: string) {
    // Initialize Anthropic client
    this.claude = new Anthropic({
      apiKey: apiKey || this.getApiKey()
    });

    this.parser = new CommandParser();
    this.systemPrompt = JARVIS_SYSTEM_PROMPT;
  }

  /**
   * Process user input and generate response
   */
  async process(input: JarvisInput): Promise<JarvisResponse> {
    const { transcript, sessionContext, userProfile } = input;

    try {
      // Try fast path (pattern matching) first
      const parsedIntent = await this.parser.parse(transcript, sessionContext);

      if (parsedIntent.confidence >= 0.8 && parsedIntent.commands.length > 0) {
        // High confidence pattern match - generate personality response
        const mood = this.adaptMood(sessionContext.userEnergy, userProfile);
        const response = this.generateQuickResponse(transcript, parsedIntent.commands, mood);

        return {
          commands: parsedIntent.commands,
          response,
          mood,
          confidence: parsedIntent.confidence
        };
      }

      // Low confidence or complex utterance - use LLM
      return await this.processWithLLM(input);

    } catch (error) {
      logger.error('Jarvis processing error:', error);
      return {
        commands: [],
        response: "Sorry, I didn't catch that. Can you try again?",
        mood: 'supportive',
        confidence: 0
      };
    }
  }

  /**
   * Process with LLM (Claude API)
   */
  private async processWithLLM(input: JarvisInput): Promise<JarvisResponse> {
    const { transcript, sessionContext, userProfile } = input;

    // Build context for Claude
    const contextSummary = this.buildContextSummary(sessionContext, userProfile);
    const userMessage = `${contextSummary}\n\nUser said: "${transcript}"\n\nRespond with JSON: {"commands": [...], "response": "...", "mood": "...", "suggestions": [...], "confidence": 0.95}`;

    // Call Claude API
    const message = await this.claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      temperature: 0.8,
      system: this.systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    });

    // Parse response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    return this.parseClaudeResponse(responseText);
  }

  /**
   * Generate proactive suggestion
   */
  async generateProactiveSuggestion(
    context: SessionContext
  ): Promise<string | null> {
    // Check if user wants proactive suggestions
    // TODO: Check user preferences when profile system is implemented

    // Apply 20% unexpected creativity rule
    const isUnexpected = this.apply20PercentRule();

    const contextSummary = this.buildContextSummary(context, {
      userId: 'default',
      skillLevel: 'intermediate',
      favoriteGenres: context.recentStyles,
      totalSessions: 0,
      totalProjects: 0,
      preferences: {
        proactiveSuggestions: true,
        challengingMode: false,
        verbosity: 'normal'
      }
    });

    const prompt = isUnexpected
      ? `${contextSummary}\n\nSuggest something UNEXPECTED and creative that pushes boundaries. Keep it brief (1 sentence).`
      : `${contextSummary}\n\nSuggest a helpful next step based on context. Keep it brief (1 sentence).`;

    try {
      const message = await this.claude.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        temperature: isUnexpected ? 1.0 : 0.7,
        system: this.systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      });

      const suggestion = message.content[0].type === 'text' ? message.content[0].text : null;
      return suggestion ? suggestion.trim() : null;

    } catch (error) {
      logger.error('Proactive suggestion error:', error);
      return null;
    }
  }

  /**
   * Adapt mood based on user energy and profile
   */
  private adaptMood(
    userEnergy: 'chill' | 'focused' | 'hyped',
    profile: UserProfile
  ): 'supportive' | 'excited' | 'challenging' | 'chill' {
    // Match user energy
    if (userEnergy === 'hyped') return 'excited';
    if (userEnergy === 'chill') return 'chill';

    // Focused users might want challenging mode
    if (profile.preferences?.challengingMode && Math.random() < 0.3) {
      return 'challenging';
    }

    // Default to supportive
    return 'supportive';
  }

  /**
   * Apply 20% unexpected creativity rule
   */
  private apply20PercentRule(): boolean {
    return Math.random() < 0.2;
  }

  /**
   * Build context summary for Claude
   */
  private buildContextSummary(context: SessionContext, profile: UserProfile): string {
    const parts: string[] = [];

    // Recent styles
    if (context.recentStyles.length > 0) {
      parts.push(`Recent styles: ${context.recentStyles.slice(-3).join(', ')}`);
    }

    // Favorite BPMs
    if (context.favoriteBpms.length > 0) {
      parts.push(`Favorite BPMs: ${context.favoriteBpms.slice(-3).join(', ')}`);
    }

    // User energy
    parts.push(`User energy: ${context.userEnergy}`);

    // Skill level
    parts.push(`Skill level: ${profile.skillLevel}`);

    // Successful suggestions
    const lovedSuggestions = context.successfulSuggestions
      .filter(s => s.outcome === 'loved' || s.outcome === 'liked')
      .slice(-3)
      .map(s => s.suggestion);

    if (lovedSuggestions.length > 0) {
      parts.push(`User loved: ${lovedSuggestions.join(', ')}`);
    }

    // Recent chat messages
    if (context.chatHistory.length > 0) {
      const recentMessages = context.chatHistory.slice(-5)
        .map(m => `${m.from}: ${m.text}`)
        .join('\n');
      parts.push(`\nRecent chat:\n${recentMessages}`);
    }

    return parts.join('\n');
  }

  /**
   * Parse Claude response JSON
   */
  private parseClaudeResponse(responseText: string): JarvisResponse {
    try {
      // Extract JSON from response (might have markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate commands
      const validatedCommands: Command[] = [];
      if (Array.isArray(parsed.commands)) {
        for (const cmd of parsed.commands) {
          const validation = safeValidateCommand(cmd);
          if (validation.success) {
            validatedCommands.push(validation.data);
          }
        }
      }

      return {
        commands: validatedCommands,
        response: parsed.response || "Got it!",
        mood: parsed.mood || 'supportive',
        suggestions: parsed.suggestions || undefined,
        confidence: parsed.confidence || 0.8
      };

    } catch (error) {
      logger.error('Failed to parse Claude response:', error);
      return {
        commands: [],
        response: "I'm processing that...",
        mood: 'supportive',
        confidence: 0
      };
    }
  }

  /**
   * Generate quick response for pattern-matched commands
   */
  private generateQuickResponse(
    transcript: string,
    commands: Command[],
    mood: 'supportive' | 'excited' | 'challenging' | 'chill'
  ): string {
    const cmd = commands[0];

    // Beat load responses
    if (cmd.type === 'beat.load') {
      const moodResponses = {
        supportive: "Finding some beats for you—I'll pick the best ones.",
        excited: "Let's find that perfect vibe! Loading candidates now.",
        challenging: "Let's see if we can find something that pushes your sound.",
        chill: "Cool, let me grab some beats. Take your time picking."
      };
      return moodResponses[mood];
    }

    // Beat generate responses
    if (cmd.type === 'beat.generate') {
      const moodResponses = {
        supportive: `Making a ${cmd.bpm} BPM ${cmd.style} beat—give me a sec.`,
        excited: `Let's GO! Cooking up that ${cmd.style} vibe at ${cmd.bpm} BPM!`,
        challenging: `Generating ${cmd.style}. Let's see if we can make it better than the last one.`,
        chill: `Building that ${cmd.style} beat at ${cmd.bpm}. Easy does it.`
      };
      return moodResponses[mood];
    }

    // Record responses
    if (cmd.type === 'transport.record') {
      const moodResponses = {
        supportive: `Recording ${cmd.bars} bars with ${cmd.countIn}-bar count-in. You got this!`,
        excited: `LET'S RECORD! ${cmd.bars} bars, here we go!`,
        challenging: `${cmd.bars} bars. Make it count—let's get the best take yet.`,
        chill: `Recording ${cmd.bars} bars. Nice and easy, take your time.`
      };
      return moodResponses[mood];
    }

    // Comp responses
    if (cmd.type === 'comp.create') {
      const moodResponses = {
        supportive: "Creating your comp from the best segments. This'll be fire.",
        excited: "Comping the BEST parts! This is gonna be crazy!",
        challenging: "Let's see which takes made the cut. Hopefully they're solid.",
        chill: "Building the comp from your best moments. Smooth."
      };
      return moodResponses[mood];
    }

    // Transport responses
    if (cmd.type === 'transport.play') return "Playing now!";
    if (cmd.type === 'transport.pause') return "Paused.";
    if (cmd.type === 'transport.stop') return "Stopped.";

    // Effect responses
    if (cmd.type === 'effect.add') {
      return `Adding ${cmd.effectType}. Let's hear how it sounds.`;
    }

    // Project responses
    if (cmd.type === 'project.save') return "Saved!";
    if (cmd.type === 'project.export') return "Exporting now. This'll take a moment.";

    // Generic
    return "On it!";
  }

  /**
   * Get API key from environment
   */
  private getApiKey(): string {
    // Check environment variables
    if (typeof process !== 'undefined' && process.env?.ANTHROPIC_API_KEY) {
      return process.env.ANTHROPIC_API_KEY;
    }

    // Check window (browser)
    if (typeof window !== 'undefined' && (window as any).ANTHROPIC_API_KEY) {
      return (window as any).ANTHROPIC_API_KEY;
    }

    // Fallback (will error if not set)
    throw new Error('Anthropic API key not found. Set ANTHROPIC_API_KEY environment variable.');
  }
}

/**
 * Global Jarvis instance
 */
let globalJarvis: Jarvis | null = null;

export function getJarvis(apiKey?: string): Jarvis {
  if (!globalJarvis) {
    globalJarvis = new Jarvis(apiKey);
  }
  return globalJarvis;
}
