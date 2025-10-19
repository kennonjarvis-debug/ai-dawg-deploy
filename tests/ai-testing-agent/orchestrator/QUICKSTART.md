# Quick Start Guide - DAWG AI Testing Orchestrator

Get the orchestrator up and running in 5 minutes!

## Prerequisites

```bash
# Required environment variable
export OPENAI_API_KEY="your-openai-api-key"

# Optional (for enhanced features)
export GITHUB_TOKEN="your-github-token"
export SLACK_WEBHOOK_URL="your-slack-webhook"
```

## Installation

```bash
# No additional installation needed - uses existing project dependencies
# Just ensure you have:
npm install
```

## Basic Usage

### 1. Start the Orchestrator

```bash
npm run test:orchestrator:start
```

This will:
- Initialize 2-5 testing agents
- Start git watching (if enabled)
- Activate scheduled tasks
- Begin monitoring

**Expected Output:**
```
🎯 Initializing Master Orchestrator...

👥 Initializing agent pool...
   Created 2 agents in pool

👁️  Initializing Git watcher...
   ✓ Git repository detected
   ✓ Current commit: abc123d

⏰ Initializing scheduler...
   ✓ Configured 5 schedules

🔄 Initializing workflow engine...
   ✓ Registered 5 workflows

✅ Master Orchestrator initialized successfully!

🚀 Starting Master Orchestrator...

✅ Master Orchestrator is running. Press Ctrl+C to stop.
```

### 2. Check Status (in another terminal)

```bash
npm run test:orchestrator:status
```

**Expected Output:**
```
📊 Orchestrator Status

Status:
  Running: ✅
  Agent Pool: 0/2 busy
  Available: 2

Tasks:
  Queued: 0
  Running: 0
  Completed: 0

Metrics:
  Total Processed: 0
  Success Rate: 100.0%
  Avg Duration: 0.00s
  Last Run: 2025-10-19T14:30:00.000Z
```

### 3. Run Example (full demo)

```bash
npm run test:orchestrator:example
```

This demonstrates:
- Git commit simulation
- Manual test execution
- Scheduled tests
- Workflow execution
- Complete automation cycle

## Common Tasks

### Queue a Manual Test

```bash
npm run test:orchestrator queue test
```

### List All Workflows

```bash
npm run test:orchestrator workflows
```

**Output:**
```
🔄 Available Workflows

1. pre-release-testing
   Description: Comprehensive testing before PR merge
   Trigger: commit
   Steps: 7

2. auto-fix-and-pr
   Description: Auto-fix failures and create PR
   Trigger: failure
   Steps: 6

3. continuous-monitoring
   Description: Continuous production monitoring
   Trigger: schedule
   Steps: 5

4. post-deployment
   Description: Post-deployment verification
   Trigger: deployment
   Steps: 4

5. regression-detection
   Description: Detect and handle regressions
   Trigger: failure
   Steps: 4
```

### Execute a Specific Workflow

```bash
npm run test:orchestrator workflow pre-release-testing
```

### View Metrics

```bash
npm run test:orchestrator metrics
```

**Output:**
```
📈 Orchestrator Metrics

Performance:
  Total Tasks Processed: 42
  Success Rate: 95.2%
  Average Task Duration: 45.32s

Current State:
  Active Agents: 3
  Queued Tasks: 2

Last Run:
  2025-10-19T14:35:00.000Z
```

### View Execution History

```bash
npm run test:orchestrator history
```

## Configuration

Edit `tests/ai-testing-agent/orchestrator/config.json`:

### Adjust Agent Pool Size

```json
{
  "agentPool": {
    "minAgents": 3,  // Start with 3 agents
    "maxAgents": 8   // Scale up to 8 max
  }
}
```

### Enable/Disable Git Watching

```json
{
  "gitWatcher": {
    "enabled": true,  // Set to false to disable
    "paths": [
      "src/**/*.ts",
      "tests/**/*.ts"
    ]
  }
}
```

### Customize Schedules

```json
{
  "scheduler": {
    "schedules": [
      {
        "name": "my-custom-schedule",
        "cron": "*/30 * * * *",  // Every 30 minutes
        "tests": ["smoke", "integration"],
        "priority": "high",
        "enabled": true
      }
    ]
  }
}
```

## Programmatic Usage

```typescript
import { MasterOrchestrator } from './orchestrator';

async function myTest() {
  // Create orchestrator
  const orchestrator = new MasterOrchestrator();
  
  // Initialize
  await orchestrator.initialize();
  await orchestrator.start();
  
  // Queue a task
  const taskId = await orchestrator.queueTask({
    type: 'test',
    priority: 'high',
    payload: { tests: ['my-test'] }
  });
  
  // Listen for completion
  orchestrator.on('taskCompleted', (task) => {
    console.log('Task done:', task.result);
  });
  
  // Stop when done
  await orchestrator.stop();
}
```

## Troubleshooting

### "OpenAI API key not found"

**Solution:**
```bash
export OPENAI_API_KEY="your-key-here"
```

### "No git repository found"

**Solution:**
- Ensure you're in a git repository
- Or disable git watcher in config:
```json
{ "gitWatcher": { "enabled": false } }
```

### "Port already in use"

**Solution:**
- Change dashboard port in config:
```json
{ "monitoring": { "dashboardPort": 3003 } }
```

### Tasks stuck in queue

**Solution:**
```bash
# Check agent status
npm run test:orchestrator status

# If needed, restart orchestrator
# Ctrl+C to stop, then:
npm run test:orchestrator:start
```

## Next Steps

1. **Read Full Documentation**: See `README.md` for complete details
2. **Review Workflows**: Check `WORKFLOWS.md` for visual diagrams
3. **Explore Examples**: Run `example.ts` to see full automation
4. **Customize Config**: Adjust settings in `config.json`
5. **Integrate with CI/CD**: Add to your GitHub Actions

## Quick Reference

| Command | Purpose |
|---------|---------|
| `start` | Start orchestrator |
| `status` | Check status |
| `queue <type>` | Queue task |
| `workflows` | List workflows |
| `workflow <name>` | Run workflow |
| `schedules` | Show schedules |
| `schedule <name>` | Trigger schedule |
| `metrics` | View metrics |
| `history` | View history |

## Getting Help

- Check logs: `logs/orchestrator.log`
- View dashboard: `http://localhost:3002`
- Read documentation: `README.md`
- See examples: `example.ts`
- Review workflows: `WORKFLOWS.md`

---

**Ready to automate? Run:** `npm run test:orchestrator:example`
