# Chat-Testing Agent Integration

Complete integration guide for bi-directional communication between the AI Chat Agent and AI Testing Agent.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Setup](#setup)
- [Voice Commands](#voice-commands)
- [Integration Points](#integration-points)
- [Examples](#examples)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

## Overview

The Chat-Testing Integration enables you to control the AI Testing Agent directly from the chat interface using natural language voice commands. This provides:

- **Real-time Test Control**: Run tests via voice/text commands
- **Live Progress Streaming**: Watch tests execute in real-time
- **Intelligent Auto-Fixes**: Get AI-generated fixes for failing tests
- **Test Reports**: View comprehensive test results and coverage
- **Admin Voice Commands**: Control testing with simple phrases

## Architecture

```
┌─────────────────┐         WebSocket          ┌──────────────────┐
│   Chat AI       │◄────────────────────────────►│  Testing Agent   │
│   Agent         │                              │                  │
└────────┬────────┘                              └────────┬─────────┘
         │                                                │
         │                                                │
         │              ┌──────────────────┐             │
         └──────────────►│  Agent Event Bus │◄────────────┘
                        │  (WebSocket Hub) │
                        └──────────────────┘
                                 │
                                 │
                        ┌────────▼─────────┐
                        │  Test Command    │
                        │  Handler         │
                        └──────────────────┘
```

### Key Components

1. **Agent Event Bus** (`src/backend/services/agent-event-bus.ts`)
   - WebSocket hub for agent communication
   - Manages test sessions and state
   - Routes commands and streams results

2. **Test Command Handler** (`src/backend/services/test-command-handler.ts`)
   - Processes voice commands
   - Executes tests
   - Generates auto-fixes

3. **Chat Integration** (`tests/ai-testing-agent/chat-integration.ts`)
   - Enables testing agent to receive chat commands
   - Streams progress back to chat
   - Handles test lifecycle

4. **Test Control Panel** (`src/ui/components/TestControlPanel.tsx`)
   - UI component for test control
   - Displays real-time progress
   - Shows results and auto-fix suggestions

## Setup

### 1. Environment Configuration

Add admin user IDs to `.env`:

```bash
# Admin User IDs (comma-separated)
ADMIN_USER_IDS=user_abc123,user_def456,user_ghi789

# Enable auto-fix suggestions
TEST_AGENT_AUTO_FIX=true

# Test dashboard port
TEST_AGENT_DASHBOARD_PORT=4000
```

### 2. Initialize Event Bus

In your main server file (e.g., `src/backend/unified-server.ts`):

```typescript
import { Server as SocketIOServer } from 'socket.io';
import { agentEventBus } from './services/agent-event-bus';
import { testCommandHandler } from './services/test-command-handler';

// Initialize Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true
  }
});

// Initialize Agent Event Bus
agentEventBus.initializeSocketIO(io);

// Test command handler is auto-initialized as singleton
console.log('✅ Chat-Testing integration enabled');
```

### 3. Start Testing Agent

Run the chat-enabled testing agent:

```bash
# Start the agent in listen mode
npx ts-node tests/ai-testing-agent/chat-integration.ts

# Or add to package.json:
"scripts": {
  "test:agent": "ts-node tests/ai-testing-agent/chat-integration.ts"
}
```

### 4. Add Test Control Panel to UI

```tsx
import { TestControlPanel } from '@/components/TestControlPanel';

function AdminDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin'; // Or check against ADMIN_USER_IDS

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <TestControlPanel
        userId={user?.id}
        isAdmin={isAdmin}
        onSendVoiceCommand={(cmd) => {
          // Optional: trigger voice command to chat
          console.log('Voice command:', cmd);
        }}
      />
    </div>
  );
}
```

## Voice Commands

### Available Commands

| Voice Command | Action | Example |
|--------------|--------|---------|
| "Run all tests" | Execute full test suite | "Hey DAWG, run all tests" |
| "Run workflow tests" | Run E2E workflow tests only | "Run workflow tests please" |
| "Test [workflow name]" | Run specific workflow | "Test the user registration workflow" |
| "Create test for [feature]" | Generate new test via AI | "Create test for the payment checkout" |
| "Fix failing tests" | Generate auto-fix suggestions | "Fix all failing tests" |
| "Show test report" | Display latest test results | "Show me the test report" |

### Command Flow

1. User speaks command to chat
2. Chat AI extracts intent
3. Command sent to Test Command Handler
4. Testing Agent executes tests
5. Progress streamed back to chat
6. Results displayed in chat and Test Control Panel

## Integration Points

### 1. Chat AI Agent Integration

Update `src/backend/ai-brain-server.ts` to handle test commands:

```typescript
import { testCommandHandler } from './services/test-command-handler';

// Add to DAW_FUNCTIONS array
{
  name: 'run_tests',
  description: 'Run automated tests (admin only)',
  parameters: {
    type: 'object',
    properties: {
      scope: {
        type: 'string',
        enum: ['all', 'workflow', 'single'],
        description: 'Test scope'
      },
      testPath: {
        type: 'string',
        description: 'Specific test path (for single tests)'
      }
    },
    required: ['scope']
  }
},
{
  name: 'create_test',
  description: 'Generate new test from natural language (admin only)',
  parameters: {
    type: 'object',
    properties: {
      feature: {
        type: 'string',
        description: 'Feature to test'
      }
    },
    required: ['feature']
  }
},
{
  name: 'fix_tests',
  description: 'Generate auto-fix suggestions for failing tests (admin only)',
  parameters: {
    type: 'object',
    properties: {}
  }
}

// Handle function calls
if (functionCall?.name === 'run_tests') {
  const result = await testCommandHandler.processVoiceCommand({
    command: `run ${args.scope} tests`,
    parameters: args,
    userId: user.id
  });

  socket.emit('test-command-sent', result);
}
```

### 2. UI Integration

Add TestControlPanel to your admin dashboard:

```tsx
import { TestControlPanel } from '@/components/TestControlPanel';

<TestControlPanel
  userId={currentUser.id}
  isAdmin={currentUser.isAdmin}
  onSendVoiceCommand={(command) => {
    // Trigger voice command to chat AI
    handleVoiceCommand(command);
  }}
/>
```

## Examples

### Example 1: Run All Tests via Chat

**User:** "Hey DAWG, run all tests"

**Chat AI Response:** "Running full test suite. This may take a few minutes..."

**Progress Updates:**
```
🧪 Running Tests... 25% (10/40 tests)
✅ Passed: 8
❌ Failed: 2
⏭️ Skipped: 0
```

**Final Report:**
```
✅ Test Suite Complete!

Results:
- Total: 40 tests
- Passed: 35 ✅
- Failed: 5 ❌
- Skipped: 0
- Duration: 2m 15s

Coverage:
- Statements: 85.2%
- Branches: 78.5%
- Functions: 91.3%
- Lines: 84.7%

Recommendations:
• 5 tests failed - use "fix failing tests" to auto-generate fixes
• Coverage could be improved in auth module
```

### Example 2: Create Test for New Feature

**User:** "Create a test for the user profile update feature"

**Chat AI Response:** "Generating test for user profile update..."

**Testing Agent:**
1. Analyzes feature requirements
2. Generates Playwright test code
3. Saves to `tests/e2e/user-profile-update.spec.ts`
4. Returns confirmation

**Chat AI Response:**
```
✅ Test Created!

File: tests/e2e/user-profile-update.spec.ts

Test includes:
✓ Navigation to profile page
✓ Form field validation
✓ Update submission
✓ Success confirmation
✓ Error handling

Next steps:
1. Review the generated test
2. Run: npm test tests/e2e/user-profile-update.spec.ts
3. Adjust assertions as needed
```

### Example 3: Auto-Fix Failing Tests

**User:** "Fix all failing tests"

**Chat AI Response:** "Analyzing failures and generating auto-fixes..."

**Auto-Fix Suggestions:**

```
🔧 Auto-Fix Suggestion #1

Test: Login workflow
Issue: Element not found: button[data-testid="submit"]
Suggested Fix: Update selector to button[data-testid="login-submit"]
Confidence: 95%
File: tests/e2e/auth.spec.ts:42

[Approve] [Reject]

---

🔧 Auto-Fix Suggestion #2

Test: API response validation
Issue: Expected status 200, received 201
Suggested Fix: Update assertion to expect 201 (Created) status
Confidence: 88%
File: tests/api/users.test.ts:67

[Approve] [Reject]
```

**After Approval:**
```
✅ Auto-fixes applied!

Modified files:
- tests/e2e/auth.spec.ts
- tests/api/users.test.ts

Re-running tests...

✅ All tests passing! (37/37)
```

### Example 4: Run Specific Workflow Test

**User:** "Test the checkout workflow"

**Chat AI Response:** "Running checkout workflow tests..."

**Progress:**
```
🧪 Testing: Checkout Workflow

Steps:
✅ Add item to cart
✅ Navigate to checkout
✅ Enter shipping details
✅ Enter payment info
⏳ Process payment...
```

**Result:**
```
✅ Checkout Workflow Passed!

Duration: 15.2s
Steps: 8/8 passed

Screenshots saved:
- checkout-cart.png
- checkout-shipping.png
- checkout-payment.png
- checkout-confirmation.png
```

## API Reference

### Agent Event Bus

#### Events

**Outbound (Testing Agent → Chat):**

```typescript
// Test progress update
socket.emit('test:progress', {
  testCommandId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  currentTest?: string;
  progress: number; // 0-100
  totalTests: number;
  completedTests: number;
  failedTests: number;
  timestamp: Date;
});

// Individual test result
socket.emit('test:result', {
  testCommandId: string;
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshots?: string[];
  metrics?: Record<string, number>;
  timestamp: Date;
});

// Test completion
socket.emit('test:complete', {
  testCommandId: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: TestResult[];
  recommendations: string[];
  criticalIssues: string[];
  coverage?: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  timestamp: Date;
});

// Auto-fix suggestion
socket.emit('test:auto-fix', {
  testCommandId: string;
  testName: string;
  issue: string;
  suggestedFix: string;
  confidence: number; // 0-1
  autoApplicable: boolean;
  filePath?: string;
  lineNumber?: number;
  timestamp: Date;
});
```

**Inbound (Chat → Testing Agent):**

```typescript
// Send test command
socket.emit('test:command', {
  command: {
    id: string;
    type: 'run_all' | 'run_workflow' | 'run_single' | 'create_test' | 'fix_tests' | 'get_report';
    payload: any;
    userId: string;
    timestamp: Date;
  }
});

// Approve auto-fix
socket.emit('test:approve-fix', {
  testCommandId: string;
  fixId: string;
});

// Cancel test
socket.emit('test:cancel', {
  testCommandId: string;
});
```

### Test Command Handler

```typescript
import { testCommandHandler } from './services/test-command-handler';

// Process voice command
const result = await testCommandHandler.processVoiceCommand({
  command: 'run all tests',
  parameters?: Record<string, any>,
  userId: string
});

// Returns:
// {
//   success: boolean;
//   message: string;
//   testCommandId?: string;
// }
```

## Troubleshooting

### Issue: Commands not executing

**Check:**
1. User has admin privileges (`ADMIN_USER_IDS` in `.env`)
2. Testing agent is running (`npm run test:agent`)
3. WebSocket connection is active (check browser console)

**Solution:**
```bash
# Restart testing agent
npm run test:agent

# Check logs
tail -f logs/test-agent.log
```

### Issue: Auto-fixes not applying

**Check:**
1. `TEST_AGENT_AUTO_FIX=true` in `.env`
2. File permissions allow writing
3. Git working directory is clean

**Solution:**
```bash
# Verify auto-fix is enabled
grep TEST_AGENT_AUTO_FIX .env

# Check file permissions
ls -la tests/
```

### Issue: Progress not streaming

**Check:**
1. WebSocket connection established
2. Event listeners registered
3. No CORS issues

**Solution:**
```typescript
// Debug WebSocket connection
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

### Issue: Tests hanging

**Check:**
1. Test timeout settings
2. Headless browser configuration
3. Resource availability

**Solution:**
```typescript
// Increase timeout in test config
{
  timeout: 60000, // 60 seconds
}
```

## Best Practices

### 1. Admin Access Control

Always verify admin access before executing commands:

```typescript
if (!agentEventBus.isAdmin(userId)) {
  throw new Error('Unauthorized: Admin access required');
}
```

### 2. Error Handling

Wrap test executions in try-catch:

```typescript
try {
  await runTests();
} catch (error) {
  agentEventBus.sendError(testCommandId, error.message);
}
```

### 3. Progress Updates

Send frequent progress updates for long-running tests:

```typescript
// Every test completion
agentEventBus.updateTestProgress({
  testCommandId,
  progress: (completedTests / totalTests) * 100,
  completedTests,
  failedTests,
  timestamp: new Date()
});
```

### 4. Audit Logging

Log all test commands for compliance:

```typescript
console.log('Test command:', {
  id: command.id,
  type: command.type,
  userId: command.userId,
  timestamp: command.timestamp
});
```

## Additional Resources

- [AI Testing Agent Documentation](./AI-TESTING-AGENT.md)
- [WebSocket Integration Guide](./WEBSOCKET-GUIDE.md)
- [Voice Command Reference](./VOICE-COMMANDS.md)
- [Admin Configuration](./ADMIN-SETUP.md)

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-repo/issues
- Documentation: https://docs.dawg-ai.com
- Discord: https://discord.gg/dawg-ai
