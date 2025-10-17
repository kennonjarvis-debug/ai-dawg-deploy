/**
 * DAWG AI Chatbot Module
 * Exports all chatbot components and utilities
 */

export { ChatbotWidget } from './ChatbotWidget';
export { ChatAssistant } from './chat_assistant';
export { ChatbotIntegrationExample, useLyricGeneration, useToplineGeneration, useFullSongGeneration } from './integration-example';

export type { ChatMessage, ConversationContext } from './chat_assistant';
export { ChatIntent, recognizeIntent, getFollowUpQuestions, hasRequiredEntities } from './intents';
export type { IntentMatch, IntentPattern } from './intents';

export {
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

export type { PromptTemplate } from './prompt_templates';
