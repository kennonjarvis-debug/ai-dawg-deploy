# Auto-Fix PR Creation System

An intelligent system that automatically analyzes test failures, generates fixes using GPT-4o, validates the fixes, and creates GitHub pull requests with comprehensive documentation.

## Overview

This system provides end-to-end automation for handling test failures:

1. **Analyze Failures** - Uses GPT-4o to understand the root cause
2. **Generate Fixes** - Creates multiple fix options with confidence scores
3. **Validate Fixes** - Runs tests to verify fixes work correctly
4. **Create PRs** - Automatically creates GitHub pull requests with detailed descriptions

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Auto-Fix Orchestrator                    │
└─────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│     Fix      │    │     Fix      │    │   GitHub     │
│  Generator   │───▶│  Validator   │───▶│ PR Creator   │
└──────────────┘    └──────────────┘    └──────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Agent Brain │    │  Test Runner │    │  GitHub API  │
│ (Past Fixes) │    │   (Pytest/   │    │   (gh CLI)   │
│              │    │  Playwright) │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Components

### 1. Fix Generator (`fix-generator.ts`)

Analyzes test failures and generates fix suggestions using GPT-4o.

**Features:**
- Intelligent failure analysis with root cause identification
- Searches agent brain for similar past fixes
- Generates multiple fix options with confidence scores
- Provides detailed reasoning for each fix
- Learns from past fixes to improve over time

**Example:**
```typescript
import { FixGenerator } from './fix-generator';

const generator = new FixGenerator();
await generator.initialize();

const { analysis, options, recommendedOption } =
  await generator.generateCompleteFix(failure);

console.log(`Root cause: ${analysis.rootCause}`);
console.log(`Recommended fix: ${recommendedOption.description}`);
console.log(`Confidence: ${recommendedOption.confidence * 100}%`);
```

### 2. Fix Validator (`fix-validator.ts`)

Validates generated fixes by running tests and calculating confidence scores.

**Features:**
- Runs originally failing test to verify it now passes
- Runs affected tests to ensure no regressions
- Optional full test suite execution
- Calculates confidence scores based on results
- Checks coverage and performance impact
- Creates backups before applying fixes

**Example:**
```typescript
import { FixValidator } from './fix-validator';

const validator = new FixValidator({
  runAffectedTestsOnly: true,
  checkCoverage: true,
  checkPerformance: true,
});

const result = await validator.validateFix(
  'should generate music',
  'tests/e2e/music.spec.ts',
  ['src/services/music-service.ts']
);

console.log(`Validation: ${result.success ? 'PASSED' : 'FAILED'}`);
console.log(`Confidence: ${result.confidence * 100}%`);
console.log(`Tests: ${result.passed}/${result.total} passed`);
```

### 3. PR Creator (`pr-creator.ts`)

Creates GitHub pull requests with comprehensive documentation.

**Features:**
- Creates feature branches with descriptive names
- Commits changes with detailed messages
- Creates PRs using GitHub CLI or Octokit
- Adds appropriate labels automatically
- Requests reviews from team members
- Links to test reports and analysis

**Example:**
```typescript
import { GitHubPRCreator } from './pr-creator';

const creator = new GitHubPRCreator();
await creator.initialize();

const result = await creator.createAutoFixPR({
  testName: 'should generate music',
  fixType: 'Fix',
  files: ['src/services/music-service.ts'],
  commitMessage: '[AUTO-FIX] Fix music generation timeout',
  prBody: prBodyFromTemplate,
  labels: ['auto-fix', 'testing', 'high-confidence'],
  reviewers: ['team-lead'],
});

console.log(`PR created: ${result.prUrl}`);
```

### 4. PR Template (`pr-template.md`)

Comprehensive template for PR descriptions including:
- Test failure analysis with root cause
- Fix strategy and reasoning
- Verification results (before/after)
- Similar past fixes from agent brain
- Code changes with diffs
- Review checklist
- AI agent metadata

## Usage

### Basic Usage

```typescript
import { AutoFixOrchestrator } from './auto-fix';

const orchestrator = new AutoFixOrchestrator();
await orchestrator.initialize();

const failure = {
  testName: 'should generate music from voice',
  testFile: 'tests/e2e/voice-to-music.spec.ts',
  errorMessage: 'Timeout waiting for music generation',
  failureType: 'timeout',
};

const result = await orchestrator.processTestFailure(failure, {
  autoApply: true,
  createPR: true,
  reviewers: ['team-lead', 'qa-lead'],
});
```

### CLI Usage

```bash
# Process a test failure and create PR
npm run test:ai-agent -- --auto-fix "should generate music"

# Analyze failure without creating PR
npm run test:ai-agent -- --analyze "test-name"

# Run example scenarios
tsx tests/ai-testing-agent/auto-fix/example.ts
```

### Integration with Test Runner

Add to your test suite to automatically fix failures:

```typescript
// In your test setup/teardown
afterEach(async function() {
  if (this.currentTest.state === 'failed') {
    const { autoFixTestFailure } = await import('./auto-fix');

    await autoFixTestFailure(
      this.currentTest.title,
      this.currentTest.file,
      this.currentTest.err.message,
      { createPR: true }
    );
  }
});
```

## Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your-openai-api-key

# Optional
GITHUB_TOKEN=your-github-token  # If not using gh CLI
AUTO_FIX_ENABLED=true           # Enable/disable auto-fix
AUTO_CREATE_PR=true             # Auto-create PRs
DEFAULT_REVIEWERS=user1,user2   # Default PR reviewers
```

### Fix Generator Config

```typescript
const generator = new FixGenerator({
  model: 'gpt-4o',  // or 'gpt-4-turbo'
  brainPath: './brain/past-fixes.json',
});
```

### Validator Config

```typescript
const validator = new FixValidator({
  runFullTestSuite: false,       // Run all tests
  runAffectedTestsOnly: true,    // Run only affected tests
  timeout: 120000,               // Test timeout (ms)
  retries: 1,                    // Number of retries
  checkCoverage: true,           // Check coverage impact
  checkPerformance: true,        // Check performance impact
});
```

### PR Creator Config

```typescript
const creator = new GitHubPRCreator({
  repoRoot: process.cwd(),
  baseBranch: 'main',
  useGhCli: true,  // Use gh CLI vs Octokit
});
```

## Example PR

Here's what an automatically generated PR looks like:

### Title
```
[AUTO-FIX] Fix failing test: should generate music from voice command
```

### Labels
- `auto-fix`
- `testing`
- `high-confidence`
- `timeout`
- `verified`

### Description
```markdown
## Summary

This PR contains an automated fix for a timeout issue in the voice-to-music generation test.

**Fix Confidence:** 87.5%
**Validation Status:** ✅ PASSED

## Test Failure Analysis

**Root Cause:** WebSocket timeout (5s) insufficient for music generation (10-15s)
**Category:** timeout
**Severity:** high

## Fix Strategy

Increase timeout to 30s and add retry logic with exponential backoff.

**Complexity:** low
**Breaking Change:** No

## Verification Results

| Metric | Value |
|--------|-------|
| Tests Passed | 12 / 12 |
| Confidence Score | 87.5% |
| Execution Time | 45.3s |

### Before Fix
- Status: FAILED ❌
- Duration: 5012ms

### After Fix
- Status: PASSED ✅
- Duration: 12453ms

## Similar Past Fixes

- **should stream real-time audio** - WebSocket timeout fix (✅ Success)
- **should process long commands** - Added retry logic (✅ Success)

## Review Checklist

- [ ] Fix addresses root cause
- [ ] All tests pass
- [ ] No new failures
- [ ] Code quality acceptable

---
🤖 Generated with DAWG AI Testing Agent
```

## Advanced Features

### Learning from Past Fixes

The system maintains a "brain" of past fixes:

```json
{
  "testName": "should generate music",
  "issue": "Timeout waiting for WebSocket",
  "solution": "Increased timeout to 30s",
  "timestamp": "2025-10-19T...",
  "success": true
}
```

This helps generate better fixes for similar issues in the future.

### Multi-Option Fix Generation

The system generates multiple fix options:

```typescript
{
  options: [
    {
      id: 'fix-1',
      description: 'Increase timeout to 30s',
      confidence: 0.85,
      complexity: 'low',
      breakingChange: false
    },
    {
      id: 'fix-2',
      description: 'Add retry logic with backoff',
      confidence: 0.75,
      complexity: 'medium',
      breakingChange: false
    },
    {
      id: 'fix-3',
      description: 'Refactor to async/await pattern',
      confidence: 0.60,
      complexity: 'high',
      breakingChange: true
    }
  ]
}
```

### Confidence Scoring

Confidence is calculated based on:
- **50%** - Original test passes after fix
- **30%** - No affected tests break
- **20%** - Full test suite passes (if run)

### Automatic Rollback

If validation fails, changes are automatically rolled back:

```typescript
const backupDir = await validator.createBackup(files);
const result = await validator.validateFix(...);

if (!result.success) {
  await validator.rollbackFix(files, backupDir);
}
```

## GitHub Integration

### Using GitHub CLI (Recommended)

```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login

# The system will automatically use gh CLI
```

### Using Octokit (Alternative)

```bash
# Install Octokit
npm install @octokit/rest

# Set token
export GITHUB_TOKEN=your-token
```

The system automatically detects which method to use.

## Best Practices

1. **Review Auto-Generated PRs** - Always review before merging
2. **Monitor Confidence Scores** - Low confidence (<50%) needs careful review
3. **Check Breaking Changes** - Flag indicates potential issues
4. **Use Appropriate Labels** - System auto-labels but you can customize
5. **Learn from Failures** - Failed fixes are saved to improve future fixes

## Troubleshooting

### "GitHub CLI not available"

```bash
# Install gh CLI
brew install gh
gh auth login
```

### "OpenAI API key not set"

```bash
export OPENAI_API_KEY="your-key"
```

### "Validation failed"

- Check test logs in `tests/reports/auto-fix/`
- Review confidence score and warnings
- Consider using a different fix option
- May require manual intervention

### "PR creation failed"

- Ensure GitHub authentication is configured
- Check repository permissions
- Verify base branch exists

## Metrics and Reports

The system generates detailed reports:

### Fix Analysis Report
```
tests/reports/auto-fix/fix-analysis-{timestamp}.md
```

Contains:
- Root cause analysis
- All fix options generated
- Similar past fixes
- Recommendations

### Validation Report
```
tests/reports/auto-fix/validation-{timestamp}.md
```

Contains:
- Test results before/after
- Coverage impact
- Performance metrics
- Warnings and errors

## Contributing

When adding new features:

1. Update the appropriate component (`fix-generator.ts`, `fix-validator.ts`, or `pr-creator.ts`)
2. Add tests for the new functionality
3. Update this README
4. Run the example file to ensure everything works

## License

MIT

---

**Built with GPT-4o and the DAWG AI Testing Agent** 🤖
