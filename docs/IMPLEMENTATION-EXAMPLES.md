# Chat-Testing Integration - Implementation Examples

Real-world implementation examples and code snippets for integrating the AI Testing Agent with the Chat AI Agent.

## Table of Contents

1. [Server Setup](#server-setup)
2. [Chat Integration](#chat-integration)
3. [UI Integration](#ui-integration)
4. [Testing Agent Setup](#testing-agent-setup)
5. [Custom Commands](#custom-commands)
6. [Advanced Features](#advanced-features)

---

## Server Setup

### Complete Server Integration

```typescript
// src/backend/unified-server.ts
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { agentEventBus } from './services/agent-event-bus';
import { testCommandHandler } from './services/test-command-handler';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO with CORS
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:5173',
      'http://localhost:5174'
    ],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Initialize Agent Event Bus with Socket.IO
agentEventBus.initializeSocketIO(io);

// Log successful initialization
console.log('✅ Chat-Testing Integration initialized');
console.log(`✅ Admin users: ${process.env.ADMIN_USER_IDS || 'None configured'}`);

// Start server
const PORT = process.env.PORT || 3100;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 WebSocket server enabled for bi-directional agent communication`);
});

export { io, agentEventBus };
```

### Environment Setup

```bash
# .env
NODE_ENV=production
PORT=3100

# Admin User IDs (from your user database)
ADMIN_USER_IDS=user_abc123,user_def456,user_ghi789

# Test Agent Configuration
TEST_AGENT_AUTO_FIX=true
TEST_AGENT_DASHBOARD_PORT=4000

# AI API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dawg_ai
```

---

## Chat Integration

### Adding Test Commands to Chat AI

```typescript
// src/backend/ai-brain-server.ts
import { testCommandHandler } from './services/test-command-handler';

// Add to your DAW_FUNCTIONS or function definitions
const TEST_FUNCTIONS = [
  {
    name: 'run_tests',
    description: 'Run automated tests (admin only). Use this when user wants to test the application.',
    parameters: {
      type: 'object',
      properties: {
        scope: {
          type: 'string',
          enum: ['all', 'workflow', 'single'],
          description: 'Test scope - all for full suite, workflow for E2E tests, single for specific test'
        },
        testPath: {
          type: 'string',
          description: 'Specific test path or workflow name (required for single scope)'
        }
      },
      required: ['scope']
    }
  },
  {
    name: 'create_test',
    description: 'Generate a new test from natural language description (admin only)',
    parameters: {
      type: 'object',
      properties: {
        feature: {
          type: 'string',
          description: 'Feature or functionality to test'
        },
        testType: {
          type: 'string',
          enum: ['e2e', 'unit', 'integration'],
          description: 'Type of test to generate',
          default: 'e2e'
        }
      },
      required: ['feature']
    }
  },
  {
    name: 'fix_failing_tests',
    description: 'Analyze failing tests and generate auto-fix suggestions (admin only)',
    parameters: {
      type: 'object',
      properties: {
        autoApply: {
          type: 'boolean',
          description: 'Automatically apply high-confidence fixes',
          default: false
        }
      }
    }
  },
  {
    name: 'get_test_report',
    description: 'Retrieve latest test results and coverage report',
    parameters: {
      type: 'object',
      properties: {
        detailed: {
          type: 'boolean',
          description: 'Include detailed results for each test',
          default: false
        }
      }
    }
  }
];

// Merge with existing functions
const ALL_FUNCTIONS = [...DAW_FUNCTIONS, ...TEST_FUNCTIONS];

// Handle test function calls in your chat endpoint
io.on('connection', (socket) => {
  socket.on('function-call', async (data: { call_id: string; name: string; arguments: string }) => {
    const args = JSON.parse(data.arguments);

    switch (data.name) {
      case 'run_tests': {
        const commandText = args.scope === 'single'
          ? `test ${args.testPath}`
          : `run ${args.scope} tests`;

        const result = await testCommandHandler.processVoiceCommand({
          command: commandText,
          parameters: args,
          userId: socket.data.userId || 'unknown'
        });

        socket.emit('function-result', {
          call_id: data.call_id,
          output: result
        });

        // Also send a chat message
        socket.emit('ai-text-done', {
          text: result.message
        });
        break;
      }

      case 'create_test': {
        const result = await testCommandHandler.processVoiceCommand({
          command: `create test for ${args.feature}`,
          parameters: args,
          userId: socket.data.userId || 'unknown'
        });

        socket.emit('function-result', {
          call_id: data.call_id,
          output: result
        });

        socket.emit('ai-text-done', {
          text: result.message
        });
        break;
      }

      case 'fix_failing_tests': {
        const result = await testCommandHandler.processVoiceCommand({
          command: 'fix failing tests',
          parameters: args,
          userId: socket.data.userId || 'unknown'
        });

        socket.emit('function-result', {
          call_id: data.call_id,
          output: result
        });

        socket.emit('ai-text-done', {
          text: result.message
        });
        break;
      }

      case 'get_test_report': {
        const result = await testCommandHandler.processVoiceCommand({
          command: 'show test report',
          parameters: args,
          userId: socket.data.userId || 'unknown'
        });

        socket.emit('function-result', {
          call_id: data.call_id,
          output: result
        });

        socket.emit('ai-text-done', {
          text: result.message
        });
        break;
      }
    }
  });
});
```

### System Prompt Update

```typescript
const SYSTEM_PROMPT = `You are DAWG AI, an expert AI music production assistant with FULL CONTROL over a professional Digital Audio Workstation (DAW).

[...existing system prompt...]

## Test Control (Admin Only)

You can also control the AI Testing Agent:

- **run_tests**: Run automated tests
  - scope: 'all' (full suite), 'workflow' (E2E), 'single' (specific test)
  - testPath: specific test file or workflow name (for single tests)

- **create_test**: Generate new tests from natural language
  - feature: description of functionality to test
  - testType: 'e2e', 'unit', or 'integration'

- **fix_failing_tests**: Auto-generate fixes for test failures
  - autoApply: set to true to automatically apply high-confidence fixes

- **get_test_report**: View latest test results
  - detailed: set to true for per-test breakdown

When users ask about testing, quality assurance, or running tests, use these functions.
Examples:
- "run all tests" → run_tests(scope='all')
- "test the checkout workflow" → run_tests(scope='single', testPath='checkout workflow')
- "create a test for login" → create_test(feature='login functionality')
- "fix broken tests" → fix_failing_tests()
- "show test results" → get_test_report()

Always inform users that test control requires admin privileges.`;
```

---

## UI Integration

### Adding Test Control Panel to Dashboard

```tsx
// src/ui/pages/AdminDashboard.tsx
import React, { useState } from 'react';
import { TestControlPanel } from '@/components/TestControlPanel';
import { useAuth } from '@/hooks/useAuth';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [showTestPanel, setShowTestPanel] = useState(false);

  // Check if user is admin (implement based on your auth system)
  const isAdmin = user?.role === 'admin' ||
                  user?.permissions?.includes('test_control') ||
                  process.env.VITE_ADMIN_USER_IDS?.split(',').includes(user?.id);

  if (!isAdmin) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
        <p className="text-text-dim mt-2">Admin privileges required</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text-base">Admin Dashboard</h1>
        <button
          onClick={() => setShowTestPanel(!showTestPanel)}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-text-base rounded-lg transition-colors"
        >
          {showTestPanel ? 'Hide' : 'Show'} Test Control
        </button>
      </div>

      {/* Other admin panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Management, Analytics, etc. */}
      </div>

      {/* Test Control Panel */}
      {showTestPanel && (
        <TestControlPanel
          userId={user.id}
          isAdmin={isAdmin}
          onSendVoiceCommand={(command) => {
            // Optional: trigger voice command to chat
            console.log('Voice command:', command);
            // Can send to chat AI here
          }}
        />
      )}
    </div>
  );
};
```

### Integrating with Chat Widget

```tsx
// src/ui/components/AIChatWidget.tsx
import { TestControlPanel } from './TestControlPanel';

// Inside your AIChatWidget component
const [showTestPanel, setShowTestPanel] = useState(false);

// Add button to show/hide test panel
<button
  onClick={() => setShowTestPanel(!showTestPanel)}
  className="p-2 rounded hover:bg-bg-surface-hover"
  title="Test Control"
>
  <Wrench className="w-5 h-5" />
</button>

// Render test panel when active
{showTestPanel && (
  <div className="absolute bottom-full right-0 mb-2 w-[600px] max-h-[80vh] overflow-y-auto">
    <TestControlPanel
      userId={userId}
      isAdmin={isAdmin}
      onSendVoiceCommand={(command) => {
        // Send command to chat
        setInputText(command);
      }}
    />
  </div>
)}
```

---

## Testing Agent Setup

### Starting the Chat-Enabled Agent

```typescript
// tests/ai-testing-agent/start-agent.ts
import { ChatEnabledTestingAgent } from './chat-integration';
import { agentEventBus } from '../../src/backend/services/agent-event-bus';

async function startAgent() {
  console.log('🤖 Starting Chat-Enabled AI Testing Agent...');

  // Create agent instance
  const agent = new ChatEnabledTestingAgent();

  // Initialize
  await agent.initialize();

  console.log('✅ Agent initialized and listening for commands');
  console.log('📡 Connected to Event Bus');
  console.log('🎧 Monitoring for test commands from chat...');

  // Log active sessions periodically
  setInterval(() => {
    const sessions = agentEventBus.getActiveSessions();
    if (sessions.length > 0) {
      console.log(`📊 Active test sessions: ${sessions.length}`);
      sessions.forEach(session => {
        console.log(`  - ${session.command.type} (${session.progress.status})`);
      });
    }
  }, 30000); // Every 30 seconds

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down agent...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down agent...');
    process.exit(0);
  });
}

// Start agent
startAgent().catch(error => {
  console.error('❌ Agent startup failed:', error);
  process.exit(1);
});
```

### Package.json Scripts

```json
{
  "scripts": {
    "test:agent": "ts-node tests/ai-testing-agent/start-agent.ts",
    "test:agent:dev": "nodemon --watch tests/ai-testing-agent --exec ts-node tests/ai-testing-agent/start-agent.ts",
    "test:agent:prod": "NODE_ENV=production ts-node tests/ai-testing-agent/start-agent.ts",
    "test:integration": "vitest run tests/integration/chat-testing-integration.test.ts"
  }
}
```

---

## Custom Commands

### Adding Custom Test Command

```typescript
// src/backend/services/custom-test-commands.ts
import { agentEventBus, TestCommand } from './agent-event-bus';

// Custom command: Visual regression testing
export async function runVisualRegressionTests(command: TestCommand): Promise<void> {
  agentEventBus.updateTestProgress({
    testCommandId: command.id,
    status: 'running',
    currentTest: 'Visual regression tests',
    progress: 0,
    totalTests: 0,
    completedTests: 0,
    failedTests: 0,
    timestamp: new Date()
  });

  try {
    // Run visual regression tests (example with Percy or similar)
    const { execAsync } = require('child_process');
    const { promisify } = require('util');
    const exec = promisify(execAsync);

    const { stdout } = await exec('npm run test:visual');

    // Parse results
    const passed = (stdout.match(/✓/g) || []).length;
    const failed = (stdout.match(/✗/g) || []).length;

    agentEventBus.sendTestReport({
      testCommandId: command.id,
      totalTests: passed + failed,
      passed,
      failed,
      skipped: 0,
      duration: 0,
      results: [],
      recommendations: failed > 0
        ? ['Visual regressions detected. Review snapshots and approve changes if intentional.']
        : [],
      criticalIssues: [],
      timestamp: new Date()
    });
  } catch (error: any) {
    agentEventBus.sendError(command.id, error.message);
  }
}

// Register custom command handler
agentEventBus.on('test:command', async (command: TestCommand) => {
  if (command.type === 'run_visual') {
    await runVisualRegressionTests(command);
  }
});
```

### Voice Command for Custom Test

```typescript
// Add to test-command-handler.ts
private mapVoiceCommandToType(command: string): TestCommand['type'] {
  const lowerCommand = command.toLowerCase();

  if (lowerCommand.includes('visual') || lowerCommand.includes('screenshot')) {
    return 'run_visual' as any;
  }

  // ... existing mappings
}
```

---

## Advanced Features

### Real-time Test Streaming to Chat

```typescript
// src/backend/services/test-stream-handler.ts
import { agentEventBus } from './agent-event-bus';
import { io } from '../unified-server';

// Stream test progress to specific chat session
export class TestStreamHandler {
  static streamToChat(testCommandId: string, chatSessionId: string) {
    // Listen for test events
    agentEventBus.on('testing-agent:progress', (progress) => {
      if (progress.testCommandId === testCommandId) {
        // Send to specific chat session
        io.to(chatSessionId).emit('chat-message', {
          type: 'system',
          content: `🧪 Test Progress: ${progress.progress}% (${progress.completedTests}/${progress.totalTests})`,
          metadata: { progress }
        });
      }
    });

    agentEventBus.on('testing-agent:result', (result) => {
      if (result.testCommandId === testCommandId) {
        const icon = result.status === 'passed' ? '✅' : '❌';
        io.to(chatSessionId).emit('chat-message', {
          type: 'system',
          content: `${icon} ${result.testName} (${result.duration}ms)`,
          metadata: { result }
        });
      }
    });

    agentEventBus.on('testing-agent:complete', (report) => {
      if (report.testCommandId === testCommandId) {
        io.to(chatSessionId).emit('chat-message', {
          type: 'system',
          content: `✅ Tests Complete!\n\nPassed: ${report.passed}\nFailed: ${report.failed}\nDuration: ${(report.duration / 1000).toFixed(1)}s`,
          metadata: { report }
        });
      }
    });
  }
}

// Usage in chat endpoint
socket.on('start-test-stream', (data: { testCommandId: string }) => {
  TestStreamHandler.streamToChat(data.testCommandId, socket.id);
});
```

### Notification System

```typescript
// src/backend/services/test-notifications.ts
import { agentEventBus } from './agent-event-bus';

// Send email/Slack notifications on test completion
agentEventBus.on('testing-agent:complete', async (report) => {
  if (report.failed > 0) {
    // Send notification
    await sendSlackNotification({
      channel: '#test-alerts',
      message: `⚠️ ${report.failed} tests failed in latest run`,
      attachments: [{
        color: 'danger',
        fields: [
          { title: 'Total Tests', value: report.totalTests.toString(), short: true },
          { title: 'Failed', value: report.failed.toString(), short: true },
          { title: 'Duration', value: `${(report.duration / 1000).toFixed(1)}s`, short: true }
        ]
      }]
    });

    // Send email to admins
    await sendEmail({
      to: process.env.ADMIN_EMAILS?.split(',') || [],
      subject: `Test Failures Detected - ${report.failed} tests failed`,
      html: generateTestReportEmail(report)
    });
  }
});
```

### Test Analytics Dashboard

```typescript
// src/backend/services/test-analytics.ts
import { agentEventBus } from './agent-event-bus';
import { TestReport } from './agent-event-bus';

interface TestMetrics {
  totalRuns: number;
  avgDuration: number;
  passRate: number;
  failureRate: number;
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  trends: {
    date: string;
    passed: number;
    failed: number;
  }[];
}

export class TestAnalytics {
  private reports: TestReport[] = [];

  constructor() {
    // Collect test reports
    agentEventBus.on('testing-agent:complete', (report) => {
      this.reports.push(report);

      // Keep last 100 reports
      if (this.reports.length > 100) {
        this.reports.shift();
      }
    });
  }

  getMetrics(): TestMetrics {
    if (this.reports.length === 0) {
      return {
        totalRuns: 0,
        avgDuration: 0,
        passRate: 0,
        failureRate: 0,
        coverage: { statements: 0, branches: 0, functions: 0, lines: 0 },
        trends: []
      };
    }

    const totalTests = this.reports.reduce((sum, r) => sum + r.totalTests, 0);
    const totalPassed = this.reports.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.reports.reduce((sum, r) => sum + r.failed, 0);
    const avgDuration = this.reports.reduce((sum, r) => sum + r.duration, 0) / this.reports.length;

    return {
      totalRuns: this.reports.length,
      avgDuration,
      passRate: (totalPassed / totalTests) * 100,
      failureRate: (totalFailed / totalTests) * 100,
      coverage: this.getAverageCoverage(),
      trends: this.getTrends()
    };
  }

  private getAverageCoverage() {
    const reportsWithCoverage = this.reports.filter(r => r.coverage);
    if (reportsWithCoverage.length === 0) {
      return { statements: 0, branches: 0, functions: 0, lines: 0 };
    }

    return {
      statements: reportsWithCoverage.reduce((sum, r) => sum + (r.coverage?.statements || 0), 0) / reportsWithCoverage.length,
      branches: reportsWithCoverage.reduce((sum, r) => sum + (r.coverage?.branches || 0), 0) / reportsWithCoverage.length,
      functions: reportsWithCoverage.reduce((sum, r) => sum + (r.coverage?.functions || 0), 0) / reportsWithCoverage.length,
      lines: reportsWithCoverage.reduce((sum, r) => sum + (r.coverage?.lines || 0), 0) / reportsWithCoverage.length
    };
  }

  private getTrends() {
    return this.reports.slice(-30).map(r => ({
      date: r.timestamp.toISOString().split('T')[0],
      passed: r.passed,
      failed: r.failed
    }));
  }
}

export const testAnalytics = new TestAnalytics();
```

---

## Production Deployment

### Docker Setup

```dockerfile
# Dockerfile.test-agent
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY tests/ai-testing-agent ./tests/ai-testing-agent
COPY src/backend/services ./src/backend/services

# Install Playwright
RUN npx playwright install --with-deps

# Start agent
CMD ["npm", "run", "test:agent:prod"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  test-agent:
    build:
      context: .
      dockerfile: Dockerfile.test-agent
    environment:
      - NODE_ENV=production
      - ADMIN_USER_IDS=${ADMIN_USER_IDS}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DATABASE_URL=${DATABASE_URL}
    restart: unless-stopped
    networks:
      - dawg-network

networks:
  dawg-network:
    driver: bridge
```

---

## Summary

You now have complete bi-directional integration between the Chat AI Agent and Testing Agent with:

✅ **WebSocket Communication** - Real-time command/response flow
✅ **Voice Command Processing** - Natural language test control
✅ **Progress Streaming** - Live test execution updates
✅ **Auto-Fix Suggestions** - AI-generated test repairs
✅ **Admin Controls** - Role-based access control
✅ **UI Components** - Test Control Panel
✅ **Integration Tests** - Comprehensive test coverage
✅ **Documentation** - Complete implementation guides

For more details, see:
- [Full Integration Guide](./CHAT-TESTING-INTEGRATION.md)
- [Voice Commands Reference](./VOICE-COMMANDS-TESTING.md)
- [API Documentation](./API-REFERENCE.md)
