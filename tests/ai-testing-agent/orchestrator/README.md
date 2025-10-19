# DAWG AI Testing Orchestrator

A comprehensive orchestration system that coordinates all testing agents and automates the complete testing lifecycle.

## Overview

The Master Orchestrator provides:

- **Agent Pool Management**: Dynamic scaling of testing agents
- **Task Distribution**: Intelligent workload distribution across agents
- **Git Watching**: Automated testing on code changes
- **Smart Scheduling**: ML-powered test scheduling
- **Workflow Automation**: Multi-step automated workflows
- **Result Aggregation**: Centralized reporting and metrics
- **CI/CD Integration**: Seamless pipeline integration

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Master Orchestrator                         │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ Agent Pool  │  │ Task Queue   │  │  Metrics & Status   │   │
│  │ Manager     │  │ & Scheduler  │  │  Tracking           │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
           │                  │                    │
    ┌──────┴──────┐    ┌─────┴─────┐    ┌────────┴────────┐
    ▼              ▼    ▼           ▼    ▼                 ▼
┌────────┐    ┌────────┐ ┌──────────┐ ┌──────────┐  ┌──────────┐
│Git     │    │Test    │ │Workflow  │ │Dashboard │  │ ML Model │
│Watcher │    │Scheduler│ │Engine   │ │Updater   │  │ Trainer  │
└────────┘    └────────┘ └──────────┘ └──────────┘  └──────────┘
    │             │          │              │              │
    └─────────────┴──────────┴──────────────┴──────────────┘
                           │
                    ┌──────┴──────┐
                    ▼              ▼
            ┌──────────────┐  ┌──────────────┐
            │Testing Agents│  │ Agent Brain  │
            │(Pool of 2-5) │  │(Vector DB)   │
            └──────────────┘  └──────────────┘
```

## Components

### 1. Master Orchestrator (`master-orchestrator.ts`)

**Responsibilities:**
- Manage agent pool (2-5 agents)
- Queue and distribute tasks
- Monitor agent health
- Aggregate results
- Auto-scaling based on load
- Event emission for monitoring

**Key Features:**
- Priority-based task queue
- Dynamic agent scaling
- Concurrent task execution
- Real-time metrics tracking
- Graceful shutdown handling

### 2. Git Watcher (`git-watcher.ts`)

**Responsibilities:**
- Monitor file system changes
- Detect git commits
- Analyze change impact using ML
- Calculate risk scores
- Trigger appropriate tests
- Block merges on critical failures

**Workflow:**
```
Git Commit Detected
       │
       ▼
Parse Commit Info
       │
       ▼
Analyze Changed Files ──► ML Impact Analysis
       │
       ▼
Calculate Risk Score
       │
       ▼
Determine Test Priority
       │
       ▼
Queue Tests (Critical → High → Medium)
       │
       ▼
Wait for Results (if blocking)
       │
       ├─► Pass  ──► Allow Merge
       │
       └─► Fail  ──► Block Merge + Create Fix PR
```

### 3. Test Scheduler (`scheduler.ts`)

**Responsibilities:**
- Cron-based test execution
- Smart scheduling using historical data
- Resource-aware scheduling
- Performance optimization
- Schedule management

**Schedules:**
- **Hourly**: Smoke tests
- **Every 4 hours**: Integration tests
- **Daily**: Full test suite + AI quality checks
- **Weekly**: Performance benchmarks

**Smart Scheduling:**
```
Historical Data Collection
       │
       ▼
ML Analysis ──► Optimal Time Prediction
       │
       ▼
Resource Availability Check
       │
       ▼
Dynamic Schedule Adjustment
       │
       ▼
Execution with Monitoring
       │
       ▼
Learn from Results ──► Improve Future Scheduling
```

### 4. Workflow Engine (`workflow-engine.ts`)

**Responsibilities:**
- Define multi-step workflows
- Execute workflows with retry logic
- Handle failures gracefully
- Coordinate all components
- Trigger downstream actions

**Built-in Workflows:**

#### Pre-Release Testing Workflow
```
1. Analyze Changes          (GPT-4 code analysis)
2. Predict Risks            (ML risk prediction)
3. Run High-Priority Tests  (Parallel execution)
4. Check Critical Failures  (Gate check)
5. Update Dashboard         (Real-time UI update)
6. Store in Agent Brain     (Vector DB storage)
7. Send Notifications       (Slack/Email/Webhook)
```

#### Auto-Fix & PR Creation Workflow
```
1. Analyze Failure          (Root cause analysis)
2. Generate Fix             (GPT-4 code generation)
3. Apply Fix                (Automatic patching)
4. Verify Fix               (Re-run failed tests)
5. Create Pull Request      (GitHub API)
6. Update Dashboard         (Track PR status)
```

#### Continuous Monitoring Workflow
```
1. Health Checks            (API/DB/Redis status)
2. Performance Metrics      (CPU/Memory/Response times)
3. Anomaly Detection        (ML-based detection)
4. Trigger Tests if Needed  (Conditional execution)
5. Update Dashboard         (Live metrics)
```

## Complete Automated Testing Cycle

### Scenario: Developer Commits Code

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. GIT COMMIT                                                    │
└──────────────────────────────────────────────────────────────────┘
Developer commits code to feature branch
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. DETECTION (Git Watcher)                                       │
└──────────────────────────────────────────────────────────────────┘
- File watcher detects change
- Git watcher retrieves commit info
- Extract: hash, files changed, diff, message
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. ANALYSIS (GPT-4 Analysis)                                    │
└──────────────────────────────────────────────────────────────────┘
- Analyze changed files and diffs
- Identify affected components
- Calculate impact score
- Risk Assessment:
  * Critical: AI features, backend services
  * High: API endpoints, integrations
  * Medium: UI components
  * Low: Documentation, tests
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. PREDICTION (ML Risk Model)                                   │
└──────────────────────────────────────────────────────────────────┘
- Predict failure probability
- Identify high-risk areas
- Recommend specific tests
- Estimate test duration
- Decision: Should block merge? (Yes if critical)
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. PRIORITIZATION (Task Queue)                                  │
└──────────────────────────────────────────────────────────────────┘
Queue tests by priority:
├─► Critical: AI feature tests (run first)
├─► High: Integration tests
├─► Medium: E2E tests
└─► Low: UI snapshot tests
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ 6. EXECUTION (Agent Pool)                                       │
└──────────────────────────────────────────────────────────────────┘
Master Orchestrator assigns tasks:
Agent 1 → Critical AI tests
Agent 2 → Integration tests
Agent 3 → E2E tests (parallel)
Agent 4 → Performance tests
Agent 5 → Quality checks
       │
       ▼ (Real-time updates)
┌──────────────────────────────────────────────────────────────────┐
│ 7. MONITORING (Live Dashboard)                                  │
└──────────────────────────────────────────────────────────────────┘
- Update dashboard with test progress
- Show: running tests, pass/fail, metrics
- Real-time WebSocket updates
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ 8. RESULT COLLECTION                                            │
└──────────────────────────────────────────────────────────────────┘
       │
       ├─► ✅ ALL TESTS PASS
       │   │
       │   ▼
       │   ┌────────────────────────────────────────────────────┐
       │   │ Success Path:                                      │
       │   │ - Store results in Agent Brain                    │
       │   │ - Update dashboard (green status)                 │
       │   │ - Send success notification                       │
       │   │ - Allow merge to proceed                          │
       │   │ - Retrain ML model with success data             │
       │   └────────────────────────────────────────────────────┘
       │
       └─► ❌ TESTS FAIL
           │
           ▼
       ┌────────────────────────────────────────────────────────┐
       │ Failure Path:                                          │
       └────────────────────────────────────────────────────────┘
           │
           ▼
       ┌────────────────────────────────────────────────────────┐
       │ 9. FAILURE ANALYSIS (GPT-4)                           │
       └────────────────────────────────────────────────────────┘
       - Analyze stack traces
       - Identify root cause
       - Categorize failure type
       - Determine if auto-fixable
           │
           ▼
       ┌────────────────────────────────────────────────────────┐
       │ 10. AUTO-FIX ATTEMPT                                   │
       └────────────────────────────────────────────────────────┘
       - Generate fix code (GPT-4)
       - Apply fix to codebase
       - Re-run failed tests
           │
           ├─► ✅ Fix Verified
           │   │
           │   ▼
           │   ┌────────────────────────────────────────────────┐
           │   │ 11. CREATE PULL REQUEST                        │
           │   └────────────────────────────────────────────────┘
           │   - Create new branch: fix/auto-generated-{id}
           │   - Commit fix with detailed message
           │   - Push to remote
           │   - Create PR via GitHub API
           │   - Assign reviewers
           │   - Add labels: auto-fix, needs-review
           │   - Link to original failure
           │       │
           │       ▼
           │   ┌────────────────────────────────────────────────┐
           │   │ 12. NOTIFY TEAM                                │
           │   └────────────────────────────────────────────────┘
           │   - Slack message: "Auto-fix PR created"
           │   - Email to original developer
           │   - Dashboard notification
           │
           └─► ❌ Fix Failed or Not Auto-fixable
               │
               ▼
           ┌────────────────────────────────────────────────────┐
           │ BLOCK MERGE + ALERT                                │
           └────────────────────────────────────────────────────┘
           - Create .git/MERGE_BLOCKED file
           - Update PR status check (❌ failed)
           - Send urgent notification
           - Provide detailed failure report
           - Suggest manual fix approach
```

## Installation & Setup

### Prerequisites

```bash
# Required
export OPENAI_API_KEY="your-api-key"

# Optional (for enhanced features)
export GITHUB_TOKEN="your-github-token"
export SLACK_WEBHOOK_URL="your-slack-webhook"
```

### Install Dependencies

```bash
npm install
```

### Configuration

Edit `tests/ai-testing-agent/orchestrator/config.json`:

```json
{
  "agentPool": {
    "minAgents": 2,
    "maxAgents": 5
  },
  "gitWatcher": {
    "enabled": true,
    "paths": ["src/**/*.ts"]
  },
  "scheduler": {
    "enabled": true,
    "schedules": [...]
  }
}
```

## Usage

### CLI Commands

```bash
# Start orchestrator (runs indefinitely)
npm run orchestrator start

# Show status
npm run orchestrator status

# Queue a task
npm run orchestrator queue test

# List workflows
npm run orchestrator workflows

# Execute specific workflow
npm run orchestrator workflow pre-release-testing

# Show schedules
npm run orchestrator schedules

# Trigger schedule manually
npm run orchestrator schedule daily-full-suite

# View metrics
npm run orchestrator metrics

# View execution history
npm run orchestrator history

# Help
npm run orchestrator help
```

### Programmatic Usage

```typescript
import { MasterOrchestrator } from './orchestrator';

// Create orchestrator
const orchestrator = new MasterOrchestrator({
  agentPool: {
    minAgents: 3,
    maxAgents: 6,
  },
  gitWatcher: {
    enabled: true,
  },
});

// Initialize
await orchestrator.initialize();

// Start
await orchestrator.start();

// Queue task
const taskId = await orchestrator.queueTask({
  type: 'test',
  priority: 'high',
  payload: {
    tests: ['smoke', 'integration'],
  },
});

// Listen to events
orchestrator.on('taskCompleted', (task) => {
  console.log('Task completed:', task);
});

// Stop
await orchestrator.stop();
```

## Workflows

### Pre-Release Testing

Automatically triggered on git commits to feature branches.

**Steps:**
1. Analyze code changes
2. Predict potential risks
3. Run high-priority tests
4. Check for critical failures
5. Update dashboard
6. Store results in agent brain
7. Send notifications

**Blocking:** Yes (blocks merge if critical tests fail)

### Auto-Fix & PR Creation

Triggered when tests fail.

**Steps:**
1. Analyze failure
2. Generate fix using GPT-4
3. Apply fix to codebase
4. Verify fix
5. Create pull request
6. Update dashboard

**Conditions:** Only for auto-fixable issues

### Continuous Monitoring

Runs on schedule (every 5 minutes).

**Steps:**
1. Health checks
2. Collect performance metrics
3. Detect anomalies using ML
4. Trigger tests if anomalies detected
5. Update monitoring dashboard

**Alerting:** Yes (on anomalies or failures)

### Post-Deployment

Triggered after deployment.

**Steps:**
1. Run smoke tests
2. Verify integrations
3. Retrain ML model
4. Update dashboard

**Rollback:** Optional (can trigger automatic rollback)

## Scheduling

### Built-in Schedules

| Schedule | Frequency | Tests | Priority |
|----------|-----------|-------|----------|
| Smoke Tests | Hourly | smoke | Medium |
| Integration | Every 4h | integration | High |
| Full Suite | Daily | all | High |
| Performance | Weekly | performance, load | Medium |
| AI Quality | Nightly | ai-quality, ai-accuracy | Critical |

### Smart Scheduling

The scheduler uses ML to optimize test timing:

- Analyzes historical execution data
- Predicts optimal execution times
- Adapts to resource availability
- Learns from success/failure patterns

## Metrics & Monitoring

### Available Metrics

- **Total Tasks Processed**: Cumulative count
- **Success Rate**: % of successful tasks
- **Average Task Duration**: Mean execution time
- **Active Agents**: Current agent count
- **Queued Tasks**: Pending tasks
- **Agent Utilization**: % of busy agents

### Dashboard Integration

Real-time updates via WebSocket to `.claude/dashboard-server.ts`

## Events

The orchestrator emits the following events:

```typescript
// Lifecycle events
orchestrator.on('initialized', () => {});
orchestrator.on('started', () => {});
orchestrator.on('stopped', () => {});

// Task events
orchestrator.on('taskQueued', (task) => {});
orchestrator.on('taskStarted', (task) => {});
orchestrator.on('taskCompleted', (task) => {});
orchestrator.on('taskFailed', (task) => {});

// Agent events
orchestrator.on('agentScaledUp', (agentId) => {});
orchestrator.on('agentScaledDown', (agentId) => {});

// Git events
gitWatcher.on('commitDetected', ({ commitInfo, impact }) => {});
gitWatcher.on('mergeBlocked', ({ commitInfo, testResult }) => {});

// Schedule events
scheduler.on('scheduleStarted', (execution) => {});
scheduler.on('scheduleCompleted', (execution) => {});
scheduler.on('scheduleFailed', (execution) => {});

// Workflow events
workflowEngine.on('workflowStarted', (execution) => {});
workflowEngine.on('workflowCompleted', (execution) => {});
workflowEngine.on('workflowFailed', (execution) => {});
```

## Integration with CI/CD

### GitHub Actions

```yaml
name: Pre-Release Testing

on:
  push:
    branches: [feature/*, develop]

jobs:
  orchestrate-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run orchestrator
        run: npm run orchestrator workflow pre-release-testing
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### Git Hooks

```bash
# .git/hooks/pre-commit
#!/bin/bash
npm run orchestrator queue test
```

## Best Practices

1. **Resource Management**
   - Set appropriate min/max agent counts
   - Monitor queue length
   - Use auto-scaling conservatively

2. **Test Prioritization**
   - Critical tests first
   - Run fast tests before slow ones
   - Parallel execution where possible

3. **Failure Handling**
   - Enable auto-fix for simple issues
   - Manual review for complex failures
   - Always verify auto-generated fixes

4. **Monitoring**
   - Keep dashboard running
   - Set up alerts for critical failures
   - Review metrics regularly

5. **Scheduling**
   - Run heavy tests during off-hours
   - Use smart scheduling for optimization
   - Balance thoroughness vs speed

## Troubleshooting

### Common Issues

**Orchestrator won't start:**
- Check OPENAI_API_KEY is set
- Verify config.json is valid JSON
- Ensure ports are not in use

**Tasks stuck in queue:**
- Check agent availability
- Verify agents are healthy
- Look for errors in logs

**Git watcher not detecting commits:**
- Verify you're in a git repository
- Check git watcher is enabled in config
- Ensure paths are correct

**Tests not running:**
- Check task queue status
- Verify test commands are correct
- Look for agent errors

## Performance Optimization

- **Agent Pool**: Start with 2-3 agents, scale up if queue grows
- **Task Batching**: Process multiple similar tasks together
- **Caching**: Enable result caching for repeated tests
- **Parallel Workflows**: Enable if infrastructure supports it
- **Smart Retry**: Use exponential backoff for retries

## Security Considerations

- Store API keys in environment variables
- Validate all inputs before execution
- Sanitize outputs before storage
- Encrypt sensitive data
- Enable audit logging
- Review auto-generated code before merging

## Future Enhancements

- [ ] Distributed execution across multiple machines
- [ ] Advanced ML models for better predictions
- [ ] Real-time collaboration features
- [ ] Integration with more CI/CD platforms
- [ ] Enhanced visualization and reporting
- [ ] Cost optimization for AI API usage

## Contributing

See main project README for contribution guidelines.

## License

MIT
