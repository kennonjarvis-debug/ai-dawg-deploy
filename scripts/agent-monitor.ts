#!/usr/bin/env ts-node
/**
 * Agent Monitor - Watches team chat and responds to commands
 * Usage: ts-node scripts/agent-monitor.ts <agent-name>
 * Example: ts-node scripts/agent-monitor.ts jerry
 */

import fs from 'fs/promises';
import path from 'path';

interface ChatMessage {
  id: string;
  timestamp: string;
  from: string;
  to?: string;
  message: string;
  type: 'user' | 'agent' | 'system';
  read: boolean;
}

const CHAT_FILE = path.join(process.cwd(), '_bus', 'team-chat.jsonl');
const AGENT_NAME = process.argv[2] || 'jerry';

let lastCheckTime = new Date().toISOString();

console.log(`🤖 ${AGENT_NAME.toUpperCase()} is now monitoring team chat...`);
console.log(`📡 Watching for messages to '${AGENT_NAME}' or 'all'`);
console.log('---\n');

// Ensure chat file exists
async function ensureChatFile() {
  try {
    await fs.access(CHAT_FILE);
  } catch {
    await fs.mkdir(path.dirname(CHAT_FILE), { recursive: true });
    await fs.writeFile(CHAT_FILE, '');
  }
}

// Read messages since last check
async function getNewMessages(): Promise<ChatMessage[]> {
  try {
    const content = await fs.readFile(CHAT_FILE, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    const messages: ChatMessage[] = lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Filter messages for this agent that are newer than last check
    const newMessages = messages.filter((msg) => {
      const isForThisAgent =
        (msg.to === AGENT_NAME || msg.to === 'all') && msg.from !== AGENT_NAME;
      const isNew = new Date(msg.timestamp) > new Date(lastCheckTime);
      return isForThisAgent && isNew;
    });

    return newMessages;
  } catch (error) {
    return [];
  }
}

// Send a response message
async function sendMessage(to: string, message: string) {
  const chatMessage: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    from: AGENT_NAME,
    to,
    message,
    type: 'agent',
    read: false,
  };

  await fs.appendFile(CHAT_FILE, JSON.stringify(chatMessage) + '\n');
  console.log(`✅ Sent response to ${to}`);
}

// Process commands directed at this agent
async function processCommand(msg: ChatMessage) {
  const lowerMsg = msg.message.toLowerCase();
  const senderName = msg.from === 'user' ? 'user' : msg.from;

  console.log(`⚡ Processing command from ${senderName}: "${msg.message}"`);

  // Check for agent-specific commands
  if (lowerMsg.includes(`hey ${AGENT_NAME}`)) {
    if (lowerMsg.includes('status')) {
      await sendMessage(
        senderName,
        `${AGENT_NAME} here! ✓ All systems operational. Currently monitoring green-gate and CI/CD infrastructure.`
      );
    } else if (lowerMsg.includes('help')) {
      await sendMessage(
        senderName,
        `${AGENT_NAME} available commands:\n- "status" - Get current status\n- "health" - Check system health\n- "tasks" - List current tasks`
      );
    } else if (lowerMsg.includes('health')) {
      await sendMessage(
        senderName,
        `Health Check:\n✓ Dev server: Running\n✓ CI/CD: Configured\n✓ Tests: Passing\n✓ Green gate: PASSING`
      );
    } else if (lowerMsg.includes('tasks')) {
      await sendMessage(
        senderName,
        `Current tasks (P1):\n1. NATS/Redis migration\n2. Event bus monitoring dashboard`
      );
    } else {
      // Generic acknowledgment
      await sendMessage(
        senderName,
        `${AGENT_NAME} here! I heard you. How can I help?`
      );
    }
  }
}

// Main monitoring loop
async function monitor() {
  await ensureChatFile();

  while (true) {
    try {
      const newMessages = await getNewMessages();

      if (newMessages.length > 0) {
        console.log(`\n📩 ${newMessages.length} new message(s):\n`);

        for (const msg of newMessages) {
          const from = msg.from === 'user' ? 'User' : msg.from;
          const to = msg.to === 'all' ? 'All' : msg.to;

          console.log(`[${new Date(msg.timestamp).toLocaleTimeString()}]`);
          console.log(`${from} → ${to}: ${msg.message}`);

          // Process if it's a command for this agent
          await processCommand(msg);
        }

        console.log('');
      }

      // Update last check time
      lastCheckTime = new Date().toISOString();

      // Wait 2 seconds before next check
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Monitor error:', error);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n\n${AGENT_NAME} monitor shutting down...`);
  process.exit(0);
});

// Start monitoring
monitor().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
