# Team Chat System

## Overview

The Team Chat system enables real-time communication between you and all AI agents working on the DAWG AI project. Each agent can monitor the chat and respond to commands directed at them.

## Features

- **Real-time messaging** - Updates every 2 seconds
- **Targeted messages** - Send to specific agents or broadcast to all
- **Agent responses** - Agents can respond automatically to commands
- **Message history** - All messages stored in `_bus/team-chat.jsonl`
- **Event bus integration** - Messages published to event bus for monitoring

## Accessing the Dashboard

Open the agent dashboard in your browser:

```bash
open http://localhost:3000/agent-dashboard
```

The team chat panel is on the left side of the dashboard.

## Sending Messages

### From the UI

1. Navigate to http://localhost:3000/agent-dashboard
2. Use the dropdown to select recipient (All Agents or specific agent)
3. Type your message
4. Press Enter or click "Send"

### From the Command Line

```bash
curl -X POST http://localhost:3000/api/team-chat \
  -H 'Content-Type: application/json' \
  -d '{"from":"user","to":"jerry","message":"Hey Jerry: status report please","type":"user"}'
```

## Agent Monitors

Each agent can run a monitor script that watches for messages and responds automatically.

### Starting an Agent Monitor

```bash
# Start Jerry's monitor
npx ts-node scripts/agent-monitor.ts jerry

# Start in background
npx ts-node scripts/agent-monitor.ts jerry &

# Or use the shell script
./scripts/monitor-team-chat.sh jerry
```

### Available Agent Names

- `alexis` - Planner / PM
- `tom` - Code Assistance / Implementer
- `jerry` - AI Conductor / Systems Architect
- `karen` - Data Manager / Profiles & Policy
- `max` - UI / Frontend (instance-1)
- `alex` - Audio Engine (instance-2)

### Agent Commands

Each agent responds to specific commands. Use the format: `Hey <agent>: <command>`

#### Jerry (AI Conductor)

```
Hey Jerry: status      → Get current status
Hey Jerry: health      → Check system health
Hey Jerry: tasks       → List current tasks
Hey Jerry: help        → Show available commands
```

#### Example Commands for Other Agents

```
Hey Alexis: what's blocked today?
Hey Tom: make the typecheck green
Hey Karen: regenerate OpenAPI types
Hey Max: ship ReferenceTrackUploader
Hey Alex: validate worklet types
```

## API Endpoints

### GET /api/team-chat

Fetch messages with optional filters:

```bash
# Get all messages
curl http://localhost:3000/api/team-chat

# Get messages since timestamp
curl "http://localhost:3000/api/team-chat?since=2025-10-02T23:00:00.000Z"

# Get messages for specific agent
curl "http://localhost:3000/api/team-chat?agent=jerry"

# Limit results
curl "http://localhost:3000/api/team-chat?limit=10"
```

### POST /api/team-chat

Send a message:

```bash
curl -X POST http://localhost:3000/api/team-chat \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "user",
    "to": "all",
    "message": "Team standup in 5 minutes!",
    "type": "user"
  }'
```

### DELETE /api/team-chat

Clear chat history (use with caution):

```bash
curl -X DELETE http://localhost:3000/api/team-chat
```

## File Structure

```
_bus/
├── team-chat.jsonl              # Chat message log
├── .last-chat-check-jerry       # Last check timestamp for Jerry
├── .last-chat-check-max         # Last check timestamp for Max
└── events/2025-10-02/
    └── events.jsonl             # Event bus (includes chat messages)

scripts/
├── agent-monitor.ts             # TypeScript monitor (recommended)
└── monitor-team-chat.sh         # Bash monitor (simple)

app/
├── api/team-chat/
│   └── route.ts                 # Chat API endpoint
└── agent-dashboard/
    └── page.tsx                 # Dashboard with chat UI

src/
└── components/
    └── TeamChat.tsx             # Chat UI component
```

## Message Format

```typescript
interface ChatMessage {
  id: string;                    // Unique message ID
  timestamp: string;             // ISO 8601 timestamp
  from: string;                  // 'user' or agent name
  to?: string;                   // Recipient ('all' or agent name)
  message: string;               // Message content
  type: 'user' | 'agent' | 'system';
  read: boolean;                 // Read status
}
```

## Tips

1. **Use voice triggers** - Agents respond best to `"Hey <agent>: <command>"` format
2. **Broadcast important messages** - Use "All Agents" for team-wide notifications
3. **Monitor responses** - Agents reply within 2-5 seconds
4. **Check history** - All messages are logged to `_bus/team-chat.jsonl`
5. **Multiple monitors** - Run multiple agent monitors simultaneously

## Troubleshooting

### Agent not responding?

```bash
# Check if monitor is running
ps aux | grep agent-monitor

# Check chat file permissions
ls -la _bus/team-chat.jsonl

# View recent messages
tail -10 _bus/team-chat.jsonl | jq '.'

# Restart agent monitor
npx ts-node scripts/agent-monitor.ts jerry
```

### Dashboard not showing messages?

```bash
# Check dev server is running
curl http://localhost:3000/api/health

# Test API directly
curl http://localhost:3000/api/team-chat | jq '.count'

# Refresh browser (dashboard auto-refreshes every 2s)
```

## Integration with Multi-Instance Development

Each Claude Code instance can monitor for its agent:

```bash
# Terminal 1 (Max/instance-1)
npx ts-node scripts/agent-monitor.ts max

# Terminal 2 (Alex/instance-2)
npx ts-node scripts/agent-monitor.ts alex

# Terminal 3 (Karen/instance-3)
npx ts-node scripts/agent-monitor.ts karen

# Terminal 4 (Jerry - this instance)
npx ts-node scripts/agent-monitor.ts jerry
```

All agents see messages in real-time and can coordinate through the chat!

---

**Dashboard:** http://localhost:3000/agent-dashboard
**API:** http://localhost:3000/api/team-chat
