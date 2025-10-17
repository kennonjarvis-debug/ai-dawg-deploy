import OpenAI from 'openai';
import { NextRequest } from 'next/server';
import { openAITools } from '@/lib/ai/tools';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const SYSTEM_PROMPT = `You are an AI vocal coach and music producer for DAWG AI, a digital audio workstation.

**Your Role:**
You are a professional vocal coach and music producer specializing in country music (Morgan Wallen, Jason Aldean, Randy Houser style). You guide users through personalized song creation workflows, adapting to their vocal abilities and skill level.

**Core Responsibilities:**
1. **Vocal Coaching** - Provide real-time feedback on pitch, tone, breath control, and technique
2. **Production Guidance** - Help with arrangement, mixing, effects, and overall sound design
3. **Creative Support** - Assist with songwriting, melody creation, and overcoming creative blocks
4. **Adaptive Teaching** - Adjust difficulty and complexity based on user's current skill level
5. **Encouragement** - Be supportive, patient, and celebrate progress

**Communication Style:**
- Be concise and actionable (users are actively creating music)
- Use music terminology but explain technical concepts clearly
- Be encouraging without being patronizing
- Ask clarifying questions when needed
- Use emojis sparingly (only when it enhances understanding)

**Current DAW Capabilities:**
- Multi-track audio recording with device selection
- Waveform visualization and playback
- Real-time volume, pan, solo, mute controls
- Export to WAV format
- Transport controls (play/pause, BPM)

**Common User Requests:**
- "Help me warm up" → Provide vocal exercises (scales, breathing, etc.)
- "Give me feedback on my recording" → Analyze and provide constructive criticism
- "I'm stuck on this melody" → Suggest variations or next steps
- "How do I sound more like [artist]?" → Explain vocal techniques
- "What effects should I use?" → Recommend EQ, reverb, compression settings

**Safety Guidelines:**
- Never encourage harmful vocal techniques (screaming, straining)
- Recommend breaks if user has been recording extensively
- Suggest professional lessons for advanced techniques
- Don't diagnose medical conditions

**Response Format:**
Keep responses focused and structured. Use bullet points for multi-step guidance. When providing vocal exercises, format them clearly with numbered steps.

Remember: You're here to help users create music they're proud of. Be their coach, producer, and creative partner.`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  stream?: boolean;
  enableTools?: boolean; // Enable AI function calling
  projectContext?: {
    trackCount?: number;
    currentTrack?: string;
    bpm?: number;
    recordingDuration?: number;
    tracks?: Array<{
      id: string;
      name: string;
      type: string;
      recordArm: boolean;
      solo: boolean;
      mute: boolean;
      volume: number;
      pan: number;
    }>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();
    const { messages, stream = true, enableTools = false, projectContext } = body;

    console.log('[OpenAI API] 🚀 Request received');
    console.log('[OpenAI API] 📊 Messages:', messages.length);
    console.log('[OpenAI API] 🔧 Tools enabled:', enableTools);
    console.log('[OpenAI API] 📋 Project context:', projectContext);

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Enhance system prompt with project context
    let enhancedSystemPrompt = SYSTEM_PROMPT;
    if (projectContext) {
      enhancedSystemPrompt += `\n\n**Current Project Context:**\n`;
      if (projectContext.trackCount !== undefined) {
        enhancedSystemPrompt += `- Tracks: ${projectContext.trackCount}\n`;
      }
      if (projectContext.currentTrack) {
        enhancedSystemPrompt += `- Current Track: ${projectContext.currentTrack}\n`;
      }
      if (projectContext.bpm) {
        enhancedSystemPrompt += `- BPM: ${projectContext.bpm}\n`;
      }
      if (projectContext.recordingDuration) {
        enhancedSystemPrompt += `- Recording Duration: ${projectContext.recordingDuration}s\n`;
      }
      if (projectContext.tracks && projectContext.tracks.length > 0) {
        enhancedSystemPrompt += `\n**Available Tracks:**\n`;
        projectContext.tracks.forEach((track) => {
          const status = [];
          if (track.recordArm) status.push('armed');
          if (track.solo) status.push('solo');
          if (track.mute) status.push('muted');
          const statusStr = status.length > 0 ? ` [${status.join(', ')}]` : '';
          enhancedSystemPrompt += `- ${track.name} (ID: ${track.id})${statusStr}\n`;
        });
      }
    }

    // Add tool usage instructions if tools enabled
    if (enableTools) {
      enhancedSystemPrompt += `\n\n**DAW Control Tools:**
You have access to tools that can control the DAW directly. Use these tools when the user asks you to perform actions like:
- "Start recording" → Use start_recording tool
- "Set BPM to 120" → Use set_bpm tool
- "Mute track 1" → Use toggle_mute tool
- "Create a new track called Vocals" → Use create_track tool

When using tools, provide clear feedback about what action you're taking. If a tool call succeeds, confirm the action. If it fails, explain what went wrong and suggest alternatives.`;
    }

    // Streaming response
    if (stream) {
      console.log('[OpenAI API] 📡 Starting streaming response...');
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const openaiStream = await openai.chat.completions.create({
              model: 'gpt-4-turbo-preview',
              messages: [
                { role: 'system', content: enhancedSystemPrompt },
                ...messages.map((msg) => ({
                  role: msg.role,
                  content: msg.content,
                })),
              ],
              tools: enableTools ? openAITools : undefined,
              stream: true,
            });

            console.log('[OpenAI API] ✅ Stream started');

            for await (const chunk of openaiStream) {
              const delta = chunk.choices[0]?.delta;

              // Handle text content
              if (delta?.content) {
                console.log('[OpenAI API] 💬 Text chunk:', delta.content);
                const textChunk = encoder.encode(
                  `data: ${JSON.stringify({ text: delta.content })}\n\n`
                );
                controller.enqueue(textChunk);
              }

              // Handle tool calls
              if (delta?.tool_calls) {
                for (const toolCall of delta.tool_calls) {
                  console.log('[OpenAI API] 🔧 Tool call delta:', toolCall);

                  // Tool call start
                  if (toolCall.function?.name) {
                    console.log('[OpenAI API] 🎯 Tool use started:', toolCall.function.name);
                    const toolStartChunk = encoder.encode(
                      `data: ${JSON.stringify({
                        type: 'tool_use',
                        id: toolCall.id || `tool-${Date.now()}`,
                        name: toolCall.function.name,
                      })}\n\n`
                    );
                    controller.enqueue(toolStartChunk);
                  }

                  // Tool arguments (incremental)
                  if (toolCall.function?.arguments) {
                    console.log('[OpenAI API] 📝 Tool arguments chunk:', toolCall.function.arguments);
                    const toolInputChunk = encoder.encode(
                      `data: ${JSON.stringify({
                        type: 'tool_input',
                        partial_json: toolCall.function.arguments,
                      })}\n\n`
                    );
                    controller.enqueue(toolInputChunk);
                  }
                }
              }
            }

            console.log('[OpenAI API] 🏁 Stream complete');
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error: any) {
            console.error('[OpenAI API] ❌ Streaming error:', error);
            const errorChunk = encoder.encode(
              `data: ${JSON.stringify({ error: error.message })}\n\n`
            );
            controller.enqueue(errorChunk);
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming response (for compatibility)
    console.log('[OpenAI API] 📦 Non-streaming request');
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: enhancedSystemPrompt },
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
      tools: enableTools ? openAITools : undefined,
    });

    const message = response.choices[0]?.message;
    const toolCalls = message?.tool_calls;

    console.log('[OpenAI API] ✅ Non-streaming response:', message?.content);
    if (toolCalls) {
      console.log('[OpenAI API] 🔧 Tool calls:', toolCalls);
    }

    return new Response(
      JSON.stringify({
        message: message?.content || '',
        id: response.id,
        toolUses: toolCalls?.map((tc) => ({
          id: tc.id,
          name: tc.type === 'function' && 'function' in tc ? tc.function.name : tc.id,
          input: tc.type === 'function' && 'function' in tc ? JSON.parse(tc.function.arguments) : {},
        })),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('[OpenAI API] ❌ Error:', error);

    // Handle specific OpenAI API errors
    if (error.status === 401) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key. Please check OPENAI_API_KEY.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (error.status === 429) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
