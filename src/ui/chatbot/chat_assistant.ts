/**
 * AI DAWG Chat Assistant
 * Main chatbot logic for onboarding and generation assistance
 */

import {
  ChatIntent,
  recognizeIntent,
  getFollowUpQuestions,
  hasRequiredEntities,
  IntentMatch,
} from './intents';

import {
  LYRIC_GENERATION_TEMPLATE,
  MELODY_GENERATION_TEMPLATE,
  TOPLINE_GENERATION_TEMPLATE,
  FULL_SONG_TEMPLATE,
  FEATURE_INFO,
  HELP_TEMPLATES,
  SAMPLE_PROMPTS,
  buildPrompt,
  parseNaturalPrompt,
} from './prompt_templates';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: ChatIntent;
    entities?: Record<string, any>;
    suggestions?: string[];
    generatedContent?: any;
    audioPreview?: string;
  };
}

export interface ConversationContext {
  currentIntent?: ChatIntent;
  entities: Record<string, any>;
  waitingForEntities: string[];
  conversationHistory: ChatMessage[];
}

export class ChatAssistant {
  private context: ConversationContext;
  private onGenerationRequest?: (type: string, params: any) => Promise<any>;
  private onAudioPreview?: (audioUrl: string) => void;

  constructor() {
    this.context = {
      entities: {},
      waitingForEntities: [],
      conversationHistory: [],
    };
  }

  /**
   * Set callback for generation requests
   */
  setGenerationHandler(handler: (type: string, params: any) => Promise<any>) {
    this.onGenerationRequest = handler;
  }

  /**
   * Set callback for audio preview
   */
  setAudioPreviewHandler(handler: (audioUrl: string) => void) {
    this.onAudioPreview = handler;
  }

  /**
   * Process user input and generate response
   */
  async processMessage(userInput: string): Promise<ChatMessage> {
    // Add user message to history
    const userMessage: ChatMessage = {
      id: this.generateId(),
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };
    this.context.conversationHistory.push(userMessage);

    // Recognize intent
    const intentMatch = recognizeIntent(userInput);

    // Handle based on intent
    let response: ChatMessage;

    if (this.context.waitingForEntities.length > 0) {
      // We're collecting entities for a previous intent
      response = await this.handleEntityCollection(userInput, intentMatch);
    } else {
      // New intent
      response = await this.handleIntent(intentMatch, userInput);
    }

    // Add response to history
    this.context.conversationHistory.push(response);

    return response;
  }

  /**
   * Handle intent-based responses
   */
  private async handleIntent(intentMatch: IntentMatch, userInput: string): Promise<ChatMessage> {
    const { intent, entities } = intentMatch;

    switch (intent) {
      case ChatIntent.GREETING:
        return this.createResponse(
          `Hey there! 👋 I'm your AI DAWG assistant. I can help you:\n\n` +
          `• Generate lyrics, melodies, and songs\n` +
          `• Clone your voice for singing\n` +
          `• Answer questions about features\n• Show examples and demos\n\n` +
          `What would you like to create today?`,
          { suggestions: this.getSuggestions('greeting') }
        );

      case ChatIntent.FEATURE_INQUIRY:
        return this.handleFeatureInquiry(entities);

      case ChatIntent.HOW_TO:
        return this.createResponse(HELP_TEMPLATES.generation_tips);

      case ChatIntent.GENERAL_HELP:
        return this.createResponse(HELP_TEMPLATES.getting_started);

      case ChatIntent.GENERATE_LYRICS:
      case ChatIntent.GENERATE_MELODY:
      case ChatIntent.GENERATE_TOPLINE:
      case ChatIntent.GENERATE_FULL_SONG:
        return await this.handleGeneration(intent, entities, userInput);

      case ChatIntent.CLONE_VOICE:
        return this.createResponse(HELP_TEMPLATES.voice_cloning_guide);

      case ChatIntent.PLAY_SAMPLE:
        return await this.handlePlaySample(entities);

      case ChatIntent.SHOW_EXAMPLE:
        return this.handleShowExample(intent);

      case ChatIntent.THANKS:
        return this.createResponse(
          `You're welcome! Happy to help! 🎵\n\n` +
          `Need anything else? I can generate more content or answer questions.`,
          { suggestions: ['Generate another', 'Show me examples', 'Tell me about features'] }
        );

      case ChatIntent.UNKNOWN:
      default:
        return this.createResponse(
          `I'm not quite sure what you're asking for. I can help you with:\n\n` +
          `• Generate lyrics, melodies, or songs\n` +
          `• Answer questions about features\n` +
          `• Show examples and demos\n\n` +
          `Try asking something like "make me a sad pop chorus" or "what is AutoTopline?"`,
          { suggestions: this.getSuggestions('unknown') }
        );
    }
  }

  /**
   * Handle feature inquiry
   */
  private handleFeatureInquiry(entities: Record<string, any>): ChatMessage {
    const featureName = entities.feature_name?.toLowerCase() || 'general';

    const featureKey = Object.keys(FEATURE_INFO).find(
      key => featureName.includes(key.toLowerCase())
    );

    if (featureKey) {
      const info = FEATURE_INFO[featureKey as keyof typeof FEATURE_INFO];
      const response = `**${info.name}**\n\n${info.description}\n\n` +
        `**Features:**\n${info.features.map(f => `• ${f}`).join('\n')}\n\n` +
        `**Try:**\n${info.examples.map(e => `• "${e}"`).join('\n')}`;

      return this.createResponse(response, {
        suggestions: info.examples,
      });
    }

    // General features overview
    const allFeatures = Object.values(FEATURE_INFO)
      .map(f => `**${f.name}:** ${f.description}`)
      .join('\n\n');

    return this.createResponse(
      `Here's what AI DAWG can do:\n\n${allFeatures}\n\n` +
      `Ask me about any specific feature for more details!`
    );
  }

  /**
   * Handle generation requests
   */
  private async handleGeneration(
    intent: ChatIntent,
    entities: Record<string, any>,
    userInput: string
  ): Promise<ChatMessage> {
    // Parse additional entities from natural language
    const parsedEntities = parseNaturalPrompt(userInput);
    const allEntities = { ...entities, ...parsedEntities };

    // Store intent and entities in context
    this.context.currentIntent = intent;
    this.context.entities = allEntities;

    // Check if we have all required entities
    if (!hasRequiredEntities(intent, allEntities)) {
      const questions = getFollowUpQuestions(intent, allEntities);
      this.context.waitingForEntities = questions;

      return this.createResponse(
        `Great! Let's create that. I need a bit more info:\n\n${questions.join('\n')}`,
        { suggestions: this.getSuggestions(intent) }
      );
    }

    // We have all entities - generate!
    return await this.executeGeneration(intent, allEntities);
  }

  /**
   * Handle entity collection from follow-up answers
   */
  private async handleEntityCollection(
    userInput: string,
    intentMatch: IntentMatch
  ): Promise<ChatMessage> {
    // Extract entities from answer
    const newEntities = parseNaturalPrompt(userInput);
    this.context.entities = { ...this.context.entities, ...newEntities, ...intentMatch.entities };

    // Remove answered questions
    this.context.waitingForEntities = this.context.waitingForEntities.filter(
      q => !Object.keys(newEntities).some(e => q.toLowerCase().includes(e.toLowerCase()))
    );

    // Check if we have all entities now
    if (this.context.currentIntent && hasRequiredEntities(this.context.currentIntent, this.context.entities)) {
      this.context.waitingForEntities = [];
      return await this.executeGeneration(this.context.currentIntent, this.context.entities);
    }

    // Still waiting for more
    return this.createResponse(
      `Got it! ${this.context.waitingForEntities.join(' ')}`,
      { suggestions: this.getSuggestions(this.context.currentIntent || ChatIntent.UNKNOWN) }
    );
  }

  /**
   * Execute generation based on intent and entities
   */
  private async executeGeneration(intent: ChatIntent, entities: Record<string, any>): Promise<ChatMessage> {
    let template;
    let type: string;

    switch (intent) {
      case ChatIntent.GENERATE_LYRICS:
        template = LYRIC_GENERATION_TEMPLATE;
        type = 'lyrics';
        break;
      case ChatIntent.GENERATE_MELODY:
        template = MELODY_GENERATION_TEMPLATE;
        type = 'melody';
        break;
      case ChatIntent.GENERATE_TOPLINE:
        template = TOPLINE_GENERATION_TEMPLATE;
        type = 'topline';
        break;
      case ChatIntent.GENERATE_FULL_SONG:
        template = FULL_SONG_TEMPLATE;
        type = 'full_song';
        break;
      default:
        return this.createResponse('Sorry, I cannot generate that type of content yet.');
    }

    try {
      const prompt = buildPrompt(template, entities);

      // Call generation handler
      if (this.onGenerationRequest) {
        const result = await this.onGenerationRequest(type, { prompt, ...entities });

        // Format response based on type
        let responseText = `Great! I've generated your ${type}:\n\n`;

        if (type === 'lyrics') {
          responseText += `**Lyrics:**\n${result.lyrics || result.content || 'Generated lyrics here'}\n\n`;
        } else if (type === 'melody' || type === 'topline') {
          responseText += `**Melody generated!**\n`;
          responseText += result.notes ? `${result.notes.length} notes created\n` : '';
          responseText += `Duration: ${result.duration || 'N/A'}s\n\n`;
        } else if (type === 'full_song') {
          responseText += `**Complete song generated!**\n`;
          responseText += `Parts: ${Object.keys(result.parts || {}).join(', ')}\n`;
          responseText += `Structure: ${result.arrangement?.structure || 'N/A'}\n\n`;
        }

        responseText += `Would you like to:\n• Preview it\n• Generate another\n• Modify parameters`;

        return this.createResponse(responseText, {
          generatedContent: result,
          suggestions: ['Play preview', 'Generate another', 'Change genre', 'Export'],
        });
      }

      // Fallback if no handler
      return this.createResponse(
        `I would generate ${type} with these params:\n${JSON.stringify(entities, null, 2)}\n\n` +
        `(Generation API not connected yet)`
      );
    } catch (error: any) {
      return this.createResponse(
        `Oops! Something went wrong: ${error.message}\n\nLet's try again with different parameters.`,
        { suggestions: ['Try again', 'Change parameters'] }
      );
    } finally {
      // Reset context
      this.context.currentIntent = undefined;
      this.context.entities = {};
      this.context.waitingForEntities = [];
    }
  }

  /**
   * Handle play sample request
   */
  private async handlePlaySample(entities: Record<string, any>): Promise<ChatMessage> {
    // Find sample based on entities
    const genre = entities.genre || 'pop';
    const type = entities.type || 'toplines';

    const samples = SAMPLE_PROMPTS[type as keyof typeof SAMPLE_PROMPTS] || SAMPLE_PROMPTS.toplines;
    const sample = samples.find(s => s.params.genre === genre) || samples[0];

    if (this.onAudioPreview && sample.params.audioUrl) {
      this.onAudioPreview(sample.params.audioUrl);
    }

    return this.createResponse(
      `Playing sample: "${sample.label}"\n\n` +
      `Prompt: ${sample.prompt}\n\n` +
      `Like what you hear? I can generate something similar for you!`,
      { suggestions: ['Generate similar', 'Try different genre', 'Show more examples'] }
    );
  }

  /**
   * Handle show example request
   */
  private handleShowExample(intent: ChatIntent): ChatMessage {
    const exampleType = intent === ChatIntent.GENERATE_LYRICS ? 'lyrics' :
                       intent === ChatIntent.GENERATE_MELODY ? 'melodies' :
                       intent === ChatIntent.GENERATE_TOPLINE ? 'toplines' : 'fullSongs';

    const examples = SAMPLE_PROMPTS[exampleType as keyof typeof SAMPLE_PROMPTS] || SAMPLE_PROMPTS.toplines;

    const exampleText = examples
      .map((ex, i) => `${i + 1}. **${ex.label}**\n   "${ex.prompt}"`)
      .join('\n\n');

    return this.createResponse(
      `Here are some example prompts:\n\n${exampleText}\n\n` +
      `Try one of these or create your own!`,
      { suggestions: examples.map(ex => ex.label) }
    );
  }

  /**
   * Get contextual suggestions
   */
  private getSuggestions(context: ChatIntent | string): string[] {
    const suggestionMap: Record<string, string[]> = {
      greeting: [
        'Generate a sad pop chorus',
        'Create lofi lyrics about summer',
        'What is AutoTopline?',
        'Show me examples',
      ],
      unknown: [
        'Make me a happy song',
        'Write lyrics about love',
        'Generate a melody in C',
        'Tell me about voice cloning',
      ],
      [ChatIntent.GENERATE_LYRICS]: ['Pop', 'Rock', 'Hip-hop', 'Lofi', 'Jazz'],
      [ChatIntent.GENERATE_MELODY]: ['Happy', 'Sad', 'Energetic', 'Chill', 'Dark'],
      [ChatIntent.GENERATE_TOPLINE]: ['Verse', 'Chorus', 'Bridge', 'Intro', 'Outro'],
      [ChatIntent.GENERATE_FULL_SONG]: ['Simple', 'Standard', 'Complex'],
    };

    return suggestionMap[context] || suggestionMap.unknown;
  }

  /**
   * Create response message
   */
  private createResponse(content: string, metadata?: any): ChatMessage {
    return {
      id: this.generateId(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      metadata,
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get conversation history
   */
  getHistory(): ChatMessage[] {
    return this.context.conversationHistory;
  }

  /**
   * Clear conversation
   */
  clearHistory(): void {
    this.context = {
      entities: {},
      waitingForEntities: [],
      conversationHistory: [],
    };
  }

  /**
   * Get sample prompts for quick access
   */
  getSamplePrompts(): typeof SAMPLE_PROMPTS {
    return SAMPLE_PROMPTS;
  }
}
