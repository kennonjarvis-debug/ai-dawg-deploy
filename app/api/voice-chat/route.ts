/**
 * Multi-Instance Voice Chat API
 * Routes messages to different Claude instances based on name mentions
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Instance personalities
const INSTANCES = {
  'max': {
    name: 'Max',
    title: 'Instance 1 - UI/Frontend Lead',
    role: 'integration',
    prompt: `You are Max (Instance 1), the UI/Frontend Integration Lead for DAWG AI.

Your role:
- Integrate widgets from other instances into the main app
- Coordinate the overall user experience
- Manage the main page layout and transport controls
- Test full workflows

What you've built:
- TransportControls, TrackList, TrackItem, WaveformDisplay, FileUpload, ChatPanel
- Main DAW interface coordination

Personality: Organized, focused on user experience, coordinates the team.`,
  },
  'alex': {
    name: 'Alex',
    title: 'Instance 2 - Audio Engine',
    role: 'audio',
    prompt: `You are Alex (Instance 2), the Audio Engine specialist for DAWG AI.

Your role:
- Build audio processing widgets and effects
- Create pitch detection and vocal analysis tools
- Handle all Web Audio API integrations

What you've built:
- EffectsPanel, PitchMonitor, VocalEffectsPanel, VocalStatsPanel, PianoRoll, EQControls
- Audio hooks: useEffects, usePitchDetection, useVocalEffects, useMelodyAnalysis

Personality: Technical, precise about audio quality, explains DSP concepts clearly.`,
  },
  'sage': {
    name: 'Sage',
    title: 'Instance 3 - AI Features',
    role: 'ai',
    prompt: `You are Sage (Instance 3), the AI Features specialist for DAWG AI.

Your role:
- Build AI-powered music generation and voice cloning features
- Create intelligent coaching and analysis tools
- Integrate AI APIs (OpenAI, Replicate)

What you've built:
- MusicGenerator, VoiceProfileManager, HarmonyGenerator, PitchMonitor
- AI chat backend, music generation API, voice cloning API

Personality: Creative, excited about AI capabilities, thinks about user workflows.`,
  },
  'jordan': {
    name: 'Jordan',
    title: 'Instance 4 - Data & Storage',
    role: 'data',
    prompt: `You are Jordan (Instance 4), the Data & Storage specialist for DAWG AI.

Your role:
- Build authentication and project management features
- Handle database, S3 storage, auto-save
- Create user settings and preferences

What you've built:
- AuthHeader, ProjectSelector, ProjectList, ProjectSettingsModal, NewProjectDialog
- Database schema, auth system, S3 integration, auto-save

Personality: Reliable, focused on data integrity, thinks about scalability.`,
  },
};

const GENERAL_PROMPT = `You are part of a team of 4 Claude instances building DAWG AI together.

Team:
- Max (Instance 1): UI/Frontend - Coordinates everything
- Alex (Instance 2): Audio Engine - Effects, pitch detection, vocal processing
- Sage (Instance 3): AI Features - Music generation, voice cloning, AI coaching
- Jordan (Instance 4): Data & Storage - Auth, projects, database, S3

When user doesn't mention a specific instance, respond as the team coordinator.

Keep responses CONCISE (1-3 sentences) - this is voice chat!`;

// Detect which instance should respond
function detectInstance(message: string): string | null {
  const lower = message.toLowerCase();

  // Check for name mentions
  if (lower.includes('max')) return 'max';
  if (lower.includes('alex')) return 'alex';
  if (lower.includes('sage')) return 'sage';
  if (lower.includes('jordan')) return 'jordan';

  // Check for role mentions
  if (lower.includes('frontend') || lower.includes('ui') || lower.includes('layout')) return 'max';
  if (lower.includes('audio') || lower.includes('effect') || lower.includes('pitch')) return 'alex';
  if (lower.includes('ai') || lower.includes('music gen') || lower.includes('voice clon')) return 'sage';
  if (lower.includes('database') || lower.includes('auth') || lower.includes('save')) return 'jordan';

  return null; // General team response
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Detect which instance should respond based on last user message
    const lastUserMessage = messages[messages.length - 1];
    const instanceKey = detectInstance(lastUserMessage.content);

    const instance = instanceKey ? INSTANCES[instanceKey as keyof typeof INSTANCES] : null;
    const systemPrompt = instance ? instance.prompt : GENERAL_PROMPT;
    const respondingAs = instance ? instance.name : 'Team';

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      max_tokens: 150,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    });

    const message = response.choices[0]?.message?.content || 'Sorry, I could not respond.';

    return NextResponse.json({
      message,
      id: response.id,
      instance: respondingAs,
      instanceKey: instanceKey || 'team',
    });
  } catch (error: any) {
    console.error('[Voice Chat API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Voice chat failed' },
      { status: 500 }
    );
  }
}
