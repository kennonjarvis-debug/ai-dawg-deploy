/**
 * OpenAI Realtime API WebSocket Proxy
 * Enables live voice conversation with OpenAI's Realtime API
 *
 * This endpoint acts as a secure proxy between the client and OpenAI's Realtime API.
 * Client connects via WebSocket, and we forward messages to/from OpenAI.
 */

import { NextRequest } from 'next/server';

const OPENAI_REALTIME_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';

export async function GET(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'OpenAI API key not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get the upgrade header
    const upgradeHeader = request.headers.get('upgrade');

    if (upgradeHeader !== 'websocket') {
      return new Response(
        JSON.stringify({ error: 'Expected WebSocket upgrade' }),
        { status: 426, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Note: Next.js Edge Runtime doesn't support WebSocket servers directly
    // We need to use a library like 'ws' or handle this at the reverse proxy level
    // For production, consider using a dedicated WebSocket server or service

    return new Response(
      JSON.stringify({
        error: 'WebSocket upgrade not supported in this environment',
        suggestion: 'Use a dedicated WebSocket server or deploy to a platform that supports WebSocket upgrades'
      }),
      { status: 501, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[Realtime API] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
