/**
 * Team Chat API
 * Real-time chat system for coordinating between user and all agents
 */

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

interface ChatMessage {
  id: string;
  timestamp: string;
  from: string; // 'user' or agent name
  to?: string; // Optional: specific agent, or 'all'
  message: string;
  type: 'user' | 'agent' | 'system';
  read: boolean;
}

const CHAT_FILE = path.join(process.cwd(), '_bus', 'team-chat.jsonl');

// Ensure chat file exists
async function ensureChatFile() {
  try {
    await fs.access(CHAT_FILE);
  } catch {
    await fs.mkdir(path.dirname(CHAT_FILE), { recursive: true });
    await fs.writeFile(CHAT_FILE, '');
  }
}

// GET - Fetch recent messages
export async function GET(request: Request) {
  try {
    await ensureChatFile();

    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since'); // Timestamp to fetch messages after
    const limit = parseInt(searchParams.get('limit') || '50');
    const agent = searchParams.get('agent'); // Filter for specific agent

    const content = await fs.readFile(CHAT_FILE, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    let messages: ChatMessage[] = lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Filter by timestamp if provided
    if (since) {
      const sinceTime = new Date(since).getTime();
      messages = messages.filter((m) => new Date(m.timestamp).getTime() > sinceTime);
    }

    // Filter for specific agent (messages to them or from them)
    if (agent) {
      messages = messages.filter(
        (m) => m.to === agent || m.to === 'all' || m.from === agent
      );
    }

    // Get most recent messages
    messages = messages.slice(-limit);

    return NextResponse.json({
      messages,
      count: messages.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[TeamChat] Failed to fetch messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST - Send a new message
export async function POST(request: Request) {
  try {
    await ensureChatFile();

    const body = await request.json();
    const { from, to, message, type } = body;

    if (!from || !message) {
      return NextResponse.json(
        { error: 'from and message are required' },
        { status: 400 }
      );
    }

    const chatMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      from,
      to: to || 'all',
      message,
      type: type || 'user',
      read: false,
    };

    // Append to chat file
    await fs.appendFile(CHAT_FILE, JSON.stringify(chatMessage) + '\n');

    // Also publish to event bus for real-time notifications
    try {
      const today = new Date().toISOString().split('T')[0] as string;
      const eventBusDir = path.join(process.cwd(), '_bus', 'events', today);
      const eventBusFile = path.join(eventBusDir, 'events.jsonl');

      // Ensure event bus directory exists
      await fs.mkdir(eventBusDir, { recursive: true });

      const event = {
        event: 'team.chat.message',
        version: 'v1',
        id: chatMessage.id,
        trace_id: 'tr_team_chat',
        producer: from,
        ts: chatMessage.timestamp,
        signature: 'chat_message',
        payload: {
          from,
          to: chatMessage.to,
          message,
          type,
        },
      };

      await fs.appendFile(eventBusFile, JSON.stringify(event) + '\n');
    } catch (eventError) {
      // Event bus is optional, don't fail if it errors
      console.error('[TeamChat] Event bus error:', eventError);
    }

    return NextResponse.json({
      success: true,
      message: chatMessage,
    });
  } catch (error) {
    console.error('[TeamChat] Failed to send message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// DELETE - Clear chat history (admin only)
export async function DELETE() {
  try {
    await fs.writeFile(CHAT_FILE, '');

    return NextResponse.json({
      success: true,
      message: 'Chat history cleared',
    });
  } catch (error) {
    console.error('[TeamChat] Failed to clear history:', error);
    return NextResponse.json(
      { error: 'Failed to clear history' },
      { status: 500 }
    );
  }
}
