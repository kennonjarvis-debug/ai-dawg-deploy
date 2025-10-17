/**
 * Mock Chat API for Testing
 * Use this endpoint to test AI function calling without an API key
 */

import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { messages } = body;

  const userMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';

  console.log('[MockChatAPI] Received message:', userMessage);

  // Simulate streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Detect what the user is asking for
        let toolName = null;
        let toolInput = {};

        if (userMessage.includes('bpm') || userMessage.includes('tempo')) {
          toolName = 'set_bpm';
          const bpmMatch = userMessage.match(/(\d+)/);
          toolInput = { bpm: bpmMatch ? parseInt(bpmMatch[1]) : 140 };
        } else if (userMessage.includes('create') && userMessage.includes('track')) {
          toolName = 'create_track';
          const nameMatch = userMessage.match(/called\s+([a-zA-Z\s]+)/i);
          toolInput = { name: nameMatch ? nameMatch[1].trim() : 'New Track' };
        } else if (userMessage.includes('volume')) {
          toolName = 'adjust_volume';
          const volumeMatch = userMessage.match(/(\d+)/);
          toolInput = { volume: volumeMatch ? parseInt(volumeMatch[1]) : 75 };
        } else if (userMessage.includes('mute')) {
          toolName = 'toggle_mute';
          toolInput = {};
        }

        // Send tool use event
        if (toolName) {
          console.log('[MockChatAPI] Triggering tool:', toolName, toolInput);

          // Send tool_use event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'tool_use',
                name: toolName,
                id: 'mock-tool-' + Date.now(),
              })}\n\n`
            )
          );

          // Send tool input
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'tool_input',
                partial_json: JSON.stringify(toolInput),
              })}\n\n`
            )
          );

          // Wait a bit
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Send text response
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                text: `I've ${toolName.replace('_', ' ')}!`,
              })}\n\n`
            )
          );
        } else {
          // Just send text response
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                text: "I'm a mock AI. Try saying 'set BPM to 140' or 'create a track called Vocals'",
              })}\n\n`
            )
          );
        }

        // Send done
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error: any) {
        console.error('[MockChatAPI] Error:', error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
        );
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
