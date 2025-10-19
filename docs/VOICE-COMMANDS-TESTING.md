# Voice Commands for Testing Agent

Quick reference guide for controlling the AI Testing Agent via voice/chat commands.

## Basic Commands

### Run All Tests
Execute the complete test suite.

**Voice Commands:**
- "Run all tests"
- "Test everything"
- "Execute all tests"
- "Run the full test suite"

**Expected Response:**
```
Running full test suite. This may take a few minutes...

Progress:
🧪 25% (10/40 tests)
✅ Passed: 8
❌ Failed: 2
```

**Use Cases:**
- Pre-deployment validation
- CI/CD pipeline verification
- Comprehensive system check
- After major refactoring

---

### Run Workflow Tests
Execute end-to-end workflow tests only.

**Voice Commands:**
- "Run workflow tests"
- "Test all workflows"
- "Execute E2E tests"
- "Run integration tests"

**Expected Response:**
```
Running workflow tests...

Testing:
✅ User Registration Workflow (5.2s)
✅ Login Workflow (3.1s)
⏳ Checkout Workflow...
```

**Use Cases:**
- User journey validation
- Critical path testing
- Feature integration checks

---

### Test Specific Workflow
Run a single workflow test.

**Voice Commands:**
- "Test the [workflow name] workflow"
- "Run [feature] test"
- "Test [specific workflow]"

**Examples:**
- "Test the checkout workflow"
- "Run the user registration test"
- "Test the payment processing workflow"

**Expected Response:**
```
Testing: Checkout Workflow

Steps:
✅ Add item to cart (1.2s)
✅ Navigate to checkout (0.8s)
✅ Enter shipping details (2.1s)
⏳ Process payment...
```

**Use Cases:**
- Debugging specific features
- Focused testing during development
- Validating recent changes

---

### Create Test
Generate a new test using AI.

**Voice Commands:**
- "Create test for [feature]"
- "Generate test for [functionality]"
- "Write a test for [feature name]"

**Examples:**
- "Create test for the user profile page"
- "Generate test for password reset"
- "Write a test for the search functionality"

**Expected Response:**
```
Generating test for user profile page...

✅ Test Created!

File: tests/e2e/user-profile.spec.ts

Test includes:
✓ Navigation to profile
✓ Field validation
✓ Update submission
✓ Success confirmation

Review and run the test to verify.
```

**Use Cases:**
- Rapid test creation
- Coverage expansion
- Feature documentation
- TDD workflow

---

### Fix Failing Tests
Auto-generate fixes for failing tests.

**Voice Commands:**
- "Fix failing tests"
- "Fix all test failures"
- "Generate auto-fixes"
- "Repair broken tests"

**Expected Response:**
```
Analyzing test failures...

🔧 Auto-Fix Suggestion #1
Test: Login workflow
Issue: Selector not found
Fix: Update selector to new data-testid
Confidence: 95%

[Approve] [Reject]

🔧 Auto-Fix Suggestion #2
Test: API validation
Issue: Expected 200, got 201
Fix: Update assertion to 201 (Created)
Confidence: 88%

[Approve] [Reject]
```

**Use Cases:**
- Quick test maintenance
- Selector updates after UI changes
- API contract updates
- Bulk test repairs

---

### Show Test Report
Display the latest test results.

**Voice Commands:**
- "Show test report"
- "Show me test results"
- "Display test summary"
- "What's the test status?"

**Expected Response:**
```
📊 Latest Test Report

Results:
✅ Passed: 35/40
❌ Failed: 5/40
⏭️ Skipped: 0
⏱️ Duration: 2m 15s

Coverage:
• Statements: 85.2%
• Branches: 78.5%
• Functions: 91.3%
• Lines: 84.7%

Critical Issues: 2
Recommendations: 4
```

**Use Cases:**
- Quick status check
- Coverage review
- Failure overview
- Progress tracking

---

## Advanced Commands

### Run Tests with Filter
Execute tests matching a pattern.

**Voice Commands:**
- "Run tests matching [pattern]"
- "Test files containing [keyword]"
- "Execute [category] tests only"

**Examples:**
- "Run tests matching 'auth'"
- "Test files containing 'payment'"
- "Execute unit tests only"

---

### Get Test Coverage
View detailed code coverage report.

**Voice Commands:**
- "Show test coverage"
- "What's our coverage?"
- "Display coverage report"

**Expected Response:**
```
📈 Code Coverage Report

Overall: 84.2%

By Module:
• Authentication: 92.3%
• Payment: 78.1%
• User Management: 85.6%
• API Routes: 81.4%

Uncovered Lines:
• src/auth/oauth.ts: Lines 45-67
• src/payment/refund.ts: Lines 23-31
```

---

### Generate Test Data
Create test fixtures using AI.

**Voice Commands:**
- "Generate test data for [entity]"
- "Create mock data for [feature]"
- "Generate fixtures for [model]"

**Examples:**
- "Generate test data for user accounts"
- "Create mock data for products"
- "Generate fixtures for orders"

---

### Compare Test Runs
Compare current results with previous run.

**Voice Commands:**
- "Compare test results"
- "Show test diff"
- "What changed in tests?"

**Expected Response:**
```
📊 Test Comparison

Current vs Previous:
• Passed: 35 (+3)
• Failed: 5 (-2)
• New Tests: 4
• Fixed Tests: 2
• New Failures: 0

Improvements:
✅ Authentication tests now passing
✅ Payment validation fixed
```

---

## Chat Examples

### Example 1: Full Testing Workflow

**User:** "Hey DAWG, I just pushed some changes. Can you run all tests?"

**DAWG AI:** "Sure! Running the full test suite now..."

*[Progress updates stream in]*

**DAWG AI:** "Tests complete! 35 out of 40 passed. You have 5 failures - would you like me to generate auto-fixes?"

**User:** "Yes, fix them"

**DAWG AI:** "Analyzing failures and generating fixes..."

*[Auto-fix suggestions displayed]*

**DAWG AI:** "I found fixes for all 5 failures with high confidence. Shall I apply them?"

**User:** "Apply all"

**DAWG AI:** "Fixes applied! Re-running tests..."

**DAWG AI:** "All tests passing now! ✅ (40/40)"

---

### Example 2: Creating Tests for New Feature

**User:** "I just built a new dark mode toggle. Can you create tests for it?"

**DAWG AI:** "Absolutely! I'll generate comprehensive tests for the dark mode feature."

*[Test generation in progress]*

**DAWG AI:** "Test created at `tests/e2e/dark-mode.spec.ts`

The test covers:
✓ Default theme on load
✓ Toggle functionality
✓ Theme persistence
✓ Accessibility compliance
✓ CSS variable updates

Shall I run the new test?"

**User:** "Yes, run it"

**DAWG AI:** "Running dark mode test..."

**DAWG AI:** "✅ All checks passed! Your dark mode implementation is working perfectly."

---

### Example 3: Debugging Workflow

**User:** "The checkout workflow is failing. Can you investigate?"

**DAWG AI:** "Running checkout workflow test with debugging enabled..."

*[Detailed execution log]*

**DAWG AI:** "Found the issue! The payment button selector changed. The test is looking for `button.submit` but it's now `button[data-testid="checkout-submit"]`.

Would you like me to fix this?"

**User:** "Yes, fix it"

**DAWG AI:** "Fix applied! Running checkout workflow again..."

**DAWG AI:** "✅ Checkout workflow passing! (8/8 steps completed in 15.2s)"

---

### Example 4: Coverage Check

**User:** "What's our current test coverage?"

**DAWG AI:** "Current test coverage: 84.2%

Strong areas:
✅ Authentication: 92.3%
✅ User Management: 85.6%

Needs improvement:
⚠️ Payment Module: 78.1%
⚠️ API Routes: 81.4%

Would you like me to create tests for the uncovered areas?"

**User:** "Create tests for the payment module"

**DAWG AI:** "Generating tests for payment module..."

*[Multiple tests created]*

**DAWG AI:** "Created 6 new tests covering:
- Payment processing
- Refund handling
- Invoice generation
- Subscription management

New coverage: 91.2% (+13.1%)

Shall I run these tests?"

---

## Command Patterns

### Natural Language Support

The testing agent understands natural variations:

**Direct Commands:**
- "Run tests"
- "Test everything"
- "Execute all tests"

**Conversational:**
- "Can you run the tests for me?"
- "Hey DAWG, test the application"
- "I'd like to run all tests please"

**Contextual:**
- "Test it" (after discussing a feature)
- "Run those" (after listing test files)
- "Check that workflow" (after mentioning it)

### Multi-Command Sequences

Chain commands together:

**User:** "Run all tests, and if anything fails, fix it automatically"

**DAWG AI:** *Executes both commands in sequence*

**User:** "Create a test for login, then run it, then show me coverage"

**DAWG AI:** *Executes all three commands*

---

## Response Times

Typical command execution times:

| Command | Expected Duration |
|---------|------------------|
| Run All Tests | 2-5 minutes |
| Run Workflow Tests | 30-90 seconds |
| Single Test | 5-30 seconds |
| Create Test | 10-30 seconds |
| Fix Tests | 20-60 seconds |
| Show Report | Instant |

---

## Error Handling

### Command Not Recognized

**User:** "Do the test thing"

**DAWG AI:** "I'm not sure which test operation you want. You can:
- Run all tests
- Run workflow tests
- Test a specific feature
- Create a new test
- Fix failing tests
- Show test report

Which would you like?"

### Insufficient Permissions

**User:** "Run all tests"

**DAWG AI:** "I need admin privileges to run tests. Please contact your administrator to grant access."

### Test Execution Failed

**User:** "Run all tests"

**DAWG AI:** "Test execution encountered an error: Test framework not found. Please ensure Playwright is installed."

---

## Tips for Best Results

1. **Be Specific**: "Test the checkout workflow" is better than "test something"

2. **Use Feature Names**: Reference features by their actual names in the codebase

3. **Provide Context**: "I just updated the login page, test it" helps the AI focus

4. **Approve Fixes Carefully**: Review auto-fix suggestions before approving

5. **Check Reports**: Use "show test report" to track progress over time

6. **Create Tests Early**: Generate tests while building features for better coverage

---

## Keyboard Shortcuts (Test Control Panel)

| Shortcut | Action |
|----------|--------|
| `Ctrl+T` | Run all tests |
| `Ctrl+W` | Run workflow tests |
| `Ctrl+F` | Fix failing tests |
| `Ctrl+R` | Show report |
| `Ctrl+C` | Cancel running tests |

---

## Integration with Chat

All test commands work seamlessly in the chat interface:

1. **Voice Input**: Speak commands naturally
2. **Text Input**: Type commands in chat
3. **Button Triggers**: Click quick action buttons
4. **Context Aware**: AI remembers conversation context

---

## Next Steps

- [Full Integration Guide](./CHAT-TESTING-INTEGRATION.md)
- [Admin Setup](./ADMIN-SETUP.md)
- [API Reference](./API-REFERENCE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
