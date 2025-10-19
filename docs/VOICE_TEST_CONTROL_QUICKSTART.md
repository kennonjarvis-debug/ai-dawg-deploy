# Voice Test Control - Quick Start Guide

Get up and running with DAWG AI's voice-controlled test execution in under 5 minutes.

## Prerequisites

- Node.js 18+ installed
- OpenAI API key
- Admin access to DAWG AI
- Microphone-enabled device

## Installation

### 1. Clone and Install

```bash
git clone https://github.com/dawg-ai/ai-dawg-deploy.git
cd ai-dawg-deploy
npm install
```

### 2. Configure Environment

Create `.env` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-key-here

# Voice Test Control
VOICE_TEST_ENABLED=true
VOICE_TEST_RATE_LIMIT=10
VOICE_TEST_ADMIN_ONLY=true
```

### 3. Set Up Admin User

Edit `config/admin-permissions.json`:

```json
{
  "adminUsers": {
    "users": [
      {
        "userId": "your-user-id",
        "email": "your-email@example.com",
        "name": "Your Name",
        "role": "admin",
        "features": {
          "voiceTestControl": true
        }
      }
    ]
  }
}
```

### 4. Start the Server

```bash
npm run dev:unified
```

Server starts on `http://localhost:3001`

### 5. Open the UI

```bash
open http://localhost:5173
```

## First Voice Command

### 1. Click the Voice Test Control Button

Look for the microphone icon in the admin toolbar.

### 2. Authenticate

The system verifies your admin role automatically.

### 3. Click the Microphone Button

The button turns red when recording.

### 4. Speak Your Command

**Try this**: "Run all tests on DAWG AI"

### 5. Watch the Magic

- Your voice is transcribed in real-time
- Intent is detected with confidence score
- Tests execute automatically
- Results appear with visual feedback
- Audio response plays through speakers

## Supported Commands

### Quick Reference

| Say This | System Does |
|----------|-------------|
| "Run all tests" | Executes entire test suite |
| "Test freestyle workflow" | Runs workflow-specific tests |
| "Show test results" | Displays last test run |
| "Check coverage" | Shows test coverage metrics |
| "Fix failing tests" | Auto-fixes failed tests (requires confirmation) |
| "Run security tests" | Executes security test suite |

### Command Patterns

```
"Run [all/workflow name] tests"
"Test [feature name]"
"Create tests for [feature name]"
"Show [me] [test] results"
"Fix [the] failing tests"
"Generate [a] test for [feature name]"
"What's [the] [current] test coverage?"
"Run security tests"
"Test [the] [production] deployment"
```

## Using the UI

### Main Interface

```
┌────────────────────────────────────────────────────┐
│  🎤 Voice Test Control                    [x] Close│
├────────────────────────────────────────────────────┤
│                                                     │
│  Status: ● Ready                                   │
│                                                     │
│         ┌──────────┐                               │
│         │    🎤    │  ← Click to record            │
│         └──────────┘                               │
│                                                     │
│  "Click to start voice command"                    │
│  Speak naturally...                                │
│                                                     │
├────────────────────────────────────────────────────┤
│  📝 Transcription:                                 │
│  "Run all tests on DAWG AI"                       │
│                                                     │
│  🎯 Detected Intent:                               │
│  Action: run_all_tests                            │
│  Confidence: 96%                                   │
│                                                     │
│  ✅ Test Results:                                  │
│  ┌─────────┬─────────┬─────────┬─────────┐       │
│  │ 47 Run  │ 47 Pass │ 0 Fail  │ 125.3s  │       │
│  └─────────┴─────────┴─────────┴─────────┘       │
│                                                     │
│  📊 Coverage:                                      │
│  Lines:     78.5% ████████████░░░░░              │
│  Functions: 82.3% █████████████░░░░              │
│  Branches:  71.2% ███████████░░░░░░              │
└────────────────────────────────────────────────────┘
```

### Status Indicators

- **🟢 Ready**: System ready for commands
- **🔴 Recording**: Currently recording audio
- **🔵 Processing**: Analyzing and executing
- **✅ Success**: Command completed successfully
- **❌ Error**: Command failed or error occurred

## Example Workflows

### Workflow 1: Quick Test Run

```
1. Click microphone button
2. Say: "Run all tests"
3. Wait for results (usually 30-120 seconds)
4. Listen to audio response: "All 47 tests passed successfully!"
```

### Workflow 2: Check Coverage

```
1. Click microphone button
2. Say: "What's the current test coverage?"
3. View coverage breakdown on screen
4. Listen to: "Your current test coverage is 78.5% for lines..."
```

### Workflow 3: Fix Failing Tests

```
1. Click microphone button
2. Say: "Fix the failing tests"
3. Confirmation dialog appears ⚠️
4. Click "Confirm" or say "Yes, proceed"
5. System generates fixes with AI
6. Tests re-run automatically
7. Listen to: "3 tests fixed. All tests now pass."
```

### Workflow 4: Generate New Test

```
1. Click microphone button
2. Say: "Generate a test for multi-track recording"
3. GPT-4 writes comprehensive test code
4. Test file saved to tests/ai-generated/
5. Test runs automatically
6. Listen to: "I've created 5 new tests. They all passed!"
```

## Troubleshooting

### Problem: Microphone not detected

**Solution**:
```javascript
// Check browser permissions
navigator.mediaDevices.getUserMedia({ audio: true })
```

Grant microphone access when prompted.

### Problem: Low transcription accuracy

**Solutions**:
- Reduce background noise
- Speak clearly at moderate pace
- Use high-quality microphone
- Try rephrasing command

### Problem: "Admin privileges required"

**Solution**:
Add your user to `config/admin-permissions.json`:

```json
{
  "adminUsers": {
    "users": [
      {
        "userId": "your-id",
        "email": "your-email@example.com",
        "role": "admin"
      }
    ]
  }
}
```

### Problem: Rate limit exceeded

**Solution**:
Wait 60 seconds. System allows 10 commands per minute.

### Problem: Command not understood

**Solution**:
Use more explicit phrasing:
- ❌ "Maybe run tests"
- ✅ "Run all tests"

## Advanced Features

### 1. Command History

Click the 📄 icon to view past commands.

```
Command History
─────────────────
10:30 AM ✓ Run all tests
         47/47 passed

10:28 AM ✓ Check coverage
         78.5% lines

10:25 AM ✓ Test freestyle workflow
         12/12 passed
```

### 2. Audit Log (Admin Only)

```bash
# View audit log
GET /api/voice-test/audit-log

# Or in UI
Click "View Audit Log" button
```

### 3. Custom Commands (Coming Soon)

Define shortcuts:
```json
{
  "customCommands": {
    "quick test": "run_workflow_test:freestyle",
    "full check": "run_all_tests && check_coverage"
  }
}
```

## Best Practices

### 1. Use Clear Commands

✅ Good:
- "Run all tests"
- "Test the freestyle workflow"
- "Check test coverage"

❌ Avoid:
- "Um, maybe test something"
- "I think we should run tests or whatever"

### 2. Wait for Completion

Don't issue multiple commands simultaneously. Wait for:
- ✅ Success indicator
- 🔊 Audio response completion

### 3. Confirm Destructive Operations

Always verify before:
- Fixing tests (modifies code)
- Testing production (affects live system)

### 4. Monitor Rate Limits

Maximum 10 commands per minute. For batch operations, use programmatic API.

## Integration with Chat AI

Voice commands integrate seamlessly with chat:

```
User (voice): "Run all tests"
        ↓
Chat AI: "Running all 47 tests now..."
        ↓
Voice System: Executes tests
        ↓
Chat AI: "All tests passed! ✅"
        ↓
TTS: "All 47 tests passed successfully!"
```

## Security Notes

- ✅ Admin-only access enforced
- ✅ All commands logged for audit
- ✅ Rate limiting prevents abuse
- ✅ Confirmations for destructive ops
- ✅ Session management with timeouts
- ✅ HTTPS required in production

## Next Steps

1. **Try the examples**:
   ```bash
   npm run dev:examples
   ```

2. **Run integration tests**:
   ```bash
   npm run test:voice
   ```

3. **Read full documentation**:
   ```bash
   open docs/VOICE_TEST_CONTROL_DEMO.md
   ```

4. **Customize admin permissions**:
   ```bash
   vim config/admin-permissions.json
   ```

5. **Monitor audit logs**:
   ```bash
   tail -f logs/voice-commands/*.jsonl
   ```

## Support

- **Documentation**: `/docs/VOICE_TEST_CONTROL_DEMO.md`
- **Examples**: `/examples/voice-test-control-example.ts`
- **Issues**: GitHub Issues
- **Email**: support@dawg-ai.com

## Quick Command Reference

```bash
# Start server
npm run dev:unified

# Run tests
npm run test:voice

# View examples
npm run dev:examples

# Check logs
tail -f logs/voice-commands/*.jsonl

# Monitor in real-time
npm run test:dashboard
```

---

**Ready to start?** Open the UI, click the microphone, and say: **"Run all tests"**

You're now controlling tests with your voice! 🎤✨
