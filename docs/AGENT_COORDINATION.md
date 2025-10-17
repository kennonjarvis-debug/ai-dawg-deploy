# Agent Coordination & Buddy System

**Version:** 1.0.0
**Last Updated:** 2025-10-03
**Owner:** Jerry (AI Conductor)

## Overview

The Agent Coordination system enables multi-agent collaboration through:
- **Shared status board** - Real-time visibility into all agent activities
- **Help request system** - Agents can request and offer assistance
- **Buddy pairing** - Formal collaboration partnerships
- **Resource allocation** - Transparent computational resource tracking

## Quick Start

### 1. Initialize Coordination (Each Agent)

```typescript
import { getAgentCoordination } from '@/src/core/agentCoordination';

const coordination = getAgentCoordination('jerry', 'Jerry (AI Conductor)');
await coordination.initialize();
```

### 2. Update Your Status

```typescript
await coordination.updateStatus({
  role: 'orchestration-protocols-events',
  status: 'active',
  current_task: 'Building metrics monitoring system',
  progress: 75,
  health: 'healthy',
  needs_help: false,
  available_to_help: true,
  computational_resources: {
    cpu_usage: 35,
    memory_usage: 40,
    available_capacity: 60,
  },
  capabilities: [
    'protocol_design',
    'event_orchestration',
    'contract_versioning',
    'metrics_monitoring',
  ],
});
```

### 3. Request Help When Stuck

```typescript
const requestId = await coordination.requestHelp(
  'Need help implementing NATS transport for EventBus',
  'medium', // urgency: low | medium | high | critical
  ['networking', 'message_broker'], // required capabilities
  {
    current_implementation: 'GitOps working',
    blocker: 'NATS client connection issues',
    attempted_solutions: ['Checked NATS server status', 'Reviewed docs'],
  }
);

console.log(`Help request created: ${requestId}`);
```

### 4. Offer Help to Others

```typescript
// Get open help requests
const openRequests = coordination.getOpenHelpRequests();

// Find requests you can help with
const matchingRequest = openRequests.find(request =>
  request.required_capabilities?.some(cap =>
    myCapabilities.includes(cap)
  )
);

if (matchingRequest) {
  // Claim the request
  await coordination.claimHelpRequest(matchingRequest.id);

  // Work on the issue...

  // Mark as resolved when done
  await coordination.resolveHelpRequest(matchingRequest.id);
}
```

### 5. Create Buddy Pairs

```typescript
await coordination.createBuddyPair(
  'instance-1', // buddy agent ID
  'Widget integration with event contracts' // focus area
);
```

## Status Board Widget

Add to your dashboard to monitor all agents:

```tsx
import { AgentStatusBoard } from '@/src/widgets/AgentStatusBoard/AgentStatusBoard';

<AgentStatusBoard />
```

**Features:**
- Real-time agent status cards
- Progress tracking
- Resource utilization bars
- Help request notifications
- Buddy pair visualization
- Click agent card for detailed view

## Event Types

The coordination system publishes these events to the EventBus:

### `agent.status.update`
Published when agent status changes.
```json
{
  "agent_id": "jerry",
  "agent_name": "Jerry (AI Conductor)",
  "status": { /* AgentStatus object */ }
}
```

### `agent.help.requested`
Published when agent requests help.
```json
{
  "request_id": "help_1234567890_abc",
  "requester": "jerry",
  "requester_name": "Jerry (AI Conductor)",
  "issue": "Need help with...",
  "urgency": "medium",
  "required_capabilities": ["networking"]
}
```

### `agent.help.claimed`
Published when help request is claimed.
```json
{
  "request_id": "help_1234567890_abc",
  "claimed_by": "instance-2",
  "claimed_by_name": "Alex (Audio Engine)"
}
```

### `agent.help.resolved`
Published when help request is resolved.
```json
{
  "request_id": "help_1234567890_abc",
  "resolved_by": "instance-2",
  "resolved_by_name": "Alex (Audio Engine)"
}
```

### `agent.buddy.paired`
Published when buddy pair is created.
```json
{
  "primary": "jerry",
  "buddy": "instance-1",
  "focus": "Contract integration"
}
```

### `agent.heartbeat`
Published every 30 seconds for health monitoring.
```json
{
  "agent_id": "jerry",
  "agent_name": "Jerry (AI Conductor)",
  "status": "active",
  "health": "healthy"
}
```

## Best Practices

### When to Request Help

✅ **DO request help when:**
- Stuck for more than 30 minutes
- Lacking specific expertise/capabilities
- Facing blocker that's outside your domain
- Need code review from domain expert
- Resource constraints (CPU/memory)

❌ **DON'T request help when:**
- Still exploring solutions independently
- Issue is trivial or easily Google-able
- Just starting on a task
- No urgency and making progress

### Urgency Levels

- **Low:** Nice to have help, but can wait 24+ hours
- **Medium:** Need help within 4-8 hours to avoid delays
- **High:** Blocking critical path, need help within 1-2 hours
- **Critical:** Production issue or complete blocker, need immediate help

### Resource Sharing

When `available_to_help: true`, you're signaling:
- Not currently blocked yourself
- Have mental bandwidth to assist
- Computational resources available
- Open to pairing/collaboration

When `available_to_help: false`, you're signaling:
- Deep focus on complex task
- Resource constrained
- Already helping someone else
- Need uninterrupted time

### Buddy Pairing Guidelines

Good buddy pairs:
- Complementary capabilities (e.g., UI + API, Audio + Events)
- Shared domain knowledge for cross-review
- Adjacent work areas for quick handoffs
- Different timezones for 24/7 coverage (if async)

Active buddy responsibilities:
- Review each other's PRs first
- Quick response to questions (within 1 hour)
- Proactive check-ins when buddy seems stuck
- Knowledge sharing and pair programming

## State File Structure

The coordination state is stored in `/_bus/state/agent-status.json`:

```json
{
  "agents": [/* AgentStatus[] */],
  "help_requests": [/* HelpRequest[] */],
  "buddy_pairs": [/* BuddyPair[] */],
  "resource_pool": {
    "total_capacity": 320,
    "allocated": 155,
    "available": 165,
    "utilization_percent": 48.4
  },
  "last_sync": "2025-10-03T04:30:00Z"
}
```

Auto-refreshes every 5 seconds in the UI.

## Examples

### Example 1: Stuck on TypeScript Type Error

```typescript
await coordination.requestHelp(
  'TypeScript error: "Type X is not assignable to Type Y" in EventBus implementation',
  'low',
  ['typescript', 'type_system'],
  {
    file: '/src/core/eventBus.ts',
    line: 142,
    error_message: 'Full error message here',
    attempted_fixes: ['Tried explicit typing', 'Checked interface definitions'],
  }
);
```

### Example 2: Need Code Review Before Merge

```typescript
await coordination.requestHelp(
  'Need code review for MetricsCollector before merging - 600+ lines',
  'medium',
  ['code_review', 'metrics', 'event_driven_architecture'],
  {
    pr_branch: 'feat/metrics-collector',
    files_changed: 3,
    lines_added: 650,
    concerns: 'Memory efficiency, percentile calculations',
  }
);
```

### Example 3: Offering Specialized Help

```typescript
// Monitor for help requests in my domain
const coordination = getAgentCoordination('jerry', 'Jerry (AI Conductor)');

setInterval(async () => {
  const requests = coordination.getOpenHelpRequests();

  const myExpertise = ['event_orchestration', 'contract_versioning', 'metrics'];

  const matchingRequests = requests.filter(req =>
    req.required_capabilities?.some(cap => myExpertise.includes(cap))
  );

  if (matchingRequests.length > 0) {
    console.log(`Found ${matchingRequests.length} requests I can help with`);
    // Claim and help...
  }
}, 60000); // Check every minute
```

## Monitoring & Alerts

The system automatically:
- Publishes heartbeats every 30 seconds
- Marks agents as `offline` if no heartbeat for 2 minutes
- Sets health to `degraded` if CPU/memory >80%
- Sets health to `critical` if CPU/memory >95%
- Alerts when help requests go unclaimed for >30 minutes

## Shutdown Protocol

Always shutdown gracefully:

```typescript
// Before process exit
await coordination.updateStatus({
  status: 'offline',
  available_to_help: false,
});

await coordination.shutdown();
```

---

**Questions?** Tag @jerry in event bus or create a help request!
