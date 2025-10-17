/**
 * Voice Bridge API - Connects voice chat to real Claude Code instances
 * Writes messages to voice-bridge.json, reads responses
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BRIDGE_FILE = path.join(process.cwd(), 'voice-bridge.json');

interface VoiceMessage {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: string;
  status: 'pending' | 'complete';
  response?: string;
  responded_at?: string;
}

interface BridgeData {
  messages: VoiceMessage[];
}

// Detect which instance to route to
function detectInstance(text: string): string {
  const lower = text.toLowerCase();

  if (lower.includes('max') || lower.includes('instance 1') || lower.includes('frontend')) return 'max';
  if (lower.includes('alex') || lower.includes('instance 2') || lower.includes('audio')) return 'alex';
  if (lower.includes('sage') || lower.includes('instance 3') || lower.includes('ai')) return 'sage';
  if (lower.includes('jordan') || lower.includes('instance 4') || lower.includes('data')) return 'jordan';

  return 'team'; // Default
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    // Detect target instance
    const targetInstance = detectInstance(text);

    // Read current bridge data
    let bridgeData: BridgeData = { messages: [] };
    if (fs.existsSync(BRIDGE_FILE)) {
      const fileContent = fs.readFileSync(BRIDGE_FILE, 'utf-8');
      bridgeData = JSON.parse(fileContent);
    }

    // Create new message
    const messageId = `msg_${Date.now()}`;
    const newMessage: VoiceMessage = {
      id: messageId,
      from: 'user',
      to: targetInstance,
      text,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    // Add to bridge
    bridgeData.messages.push(newMessage);
    fs.writeFileSync(BRIDGE_FILE, JSON.stringify(bridgeData, null, 2));

    // Wait for response (poll for up to 30 seconds)
    const maxWaitTime = 30000; // 30 seconds
    const pollInterval = 500; // Check every 500ms
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      // Check if response is ready
      const currentData = JSON.parse(fs.readFileSync(BRIDGE_FILE, 'utf-8'));
      const message = currentData.messages.find((m: VoiceMessage) => m.id === messageId);

      if (message && message.status === 'complete' && message.response) {
        return NextResponse.json({
          message: message.response,
          instance: targetInstance,
          id: messageId,
        });
      }
    }

    // Timeout - return fallback
    return NextResponse.json({
      message: `${targetInstance} is not responding. They may be busy or not monitoring voice chat.`,
      instance: targetInstance,
      id: messageId,
      timeout: true,
    });
  } catch (error: any) {
    console.error('[Voice Bridge API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Voice bridge failed' },
      { status: 500 }
    );
  }
}

// GET endpoint to check pending messages for an instance
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instance = searchParams.get('instance');

    if (!fs.existsSync(BRIDGE_FILE)) {
      return NextResponse.json({ messages: [] });
    }

    const bridgeData: BridgeData = JSON.parse(fs.readFileSync(BRIDGE_FILE, 'utf-8'));

    if (instance) {
      const pending = bridgeData.messages.filter(
        m => m.to === instance && m.status === 'pending'
      );
      return NextResponse.json({ messages: pending });
    }

    return NextResponse.json({ messages: bridgeData.messages });
  } catch (error: any) {
    console.error('[Voice Bridge API] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
