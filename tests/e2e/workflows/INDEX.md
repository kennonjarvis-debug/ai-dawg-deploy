# DAWG AI Workflows - E2E Test Suite Index

**Quick Navigation Guide**

## Start Here

### New to These Tests?
👉 **[QUICK_START.md](./QUICK_START.md)** - Get running in 5 minutes

### Want Full Documentation?
📚 **[README.md](./README.md)** - Complete guide with all details

### Need an Overview?
📊 **[TEST_SUITE_SUMMARY.md](./TEST_SUITE_SUMMARY.md)** - Comprehensive summary

## Test Files by Workflow

| # | Workflow | File | Tests | Lines |
|---|----------|------|-------|-------|
| 1 | Freestyle | [freestyle-workflow.spec.ts](./freestyle-workflow.spec.ts) | 15 | 367 |
| 2 | Melody-to-Vocals | [melody-vocals-workflow.spec.ts](./melody-vocals-workflow.spec.ts) | 22 | 419 |
| 3 | Stem Separation | [stem-separation-workflow.spec.ts](./stem-separation-workflow.spec.ts) | 25 | 469 |
| 4 | AI Mastering | [ai-mastering-workflow.spec.ts](./ai-mastering-workflow.spec.ts) | 26 | 462 |
| 5 | Live Vocal Analysis | [live-vocal-analysis-workflow.spec.ts](./live-vocal-analysis-workflow.spec.ts) | 25 | 477 |
| 6 | AI Memory | [ai-memory-workflow.spec.ts](./ai-memory-workflow.spec.ts) | 23 | 434 |
| 7 | Voice Commands | [voice-commands-workflow.spec.ts](./voice-commands-workflow.spec.ts) | 25 | 516 |
| 8 | Budget Alerts | [budget-alerts-workflow.spec.ts](./budget-alerts-workflow.spec.ts) | 25 | 508 |

**Total: 186 test scenarios across 3,911 lines**

## Documentation Files

| File | Purpose |
|------|---------|
| [README.md](./README.md) | Complete test execution guide |
| [TEST_SUITE_SUMMARY.md](./TEST_SUITE_SUMMARY.md) | Detailed test overview |
| [QUICK_START.md](./QUICK_START.md) | 5-minute getting started |
| [fixtures/README.md](./fixtures/README.md) | Fixture generation guide |

## Utilities

| File | Purpose |
|------|---------|
| [fixtures/generate-test-audio.sh](./fixtures/generate-test-audio.sh) | Generate test audio files |

## Quick Commands

```bash
# Run all workflow tests
npm run test:e2e -- tests/e2e/workflows

# Run specific workflow
npm run test:e2e -- tests/e2e/workflows/freestyle-workflow.spec.ts

# Run in UI mode (interactive)
npm run test:e2e:ui -- tests/e2e/workflows

# View report
npx playwright show-report

# Generate fixtures
cd fixtures && ./generate-test-audio.sh
```

## Test Coverage by Category

### Audio Processing (4 workflows)
- ✅ Freestyle (voice + beat)
- ✅ Melody-to-Vocals (generation)
- ✅ Stem Separation (4 stems)
- ✅ AI Mastering (LUFS targets)

### Real-time Analysis (2 workflows)
- ✅ Live Vocal Analysis (pitch detection)
- ✅ Voice Commands (command recognition)

### Data Management (2 workflows)
- ✅ AI Memory (preferences/storage)
- ✅ Budget Alerts (usage tracking)

## What Each Test Covers

### Freestyle (15 tests)
- Voice commands, beat playback, live transcription, lyrics organization

### Melody-to-Vocals (22 tests)
- File upload, generation, lyrics quality, audio output

### Stem Separation (25 tests)
- 4-stem separation, quality metrics, playback, download

### AI Mastering (26 tests)
- LUFS targets, mastering chain, genre processing, comparison

### Live Vocal Analysis (25 tests)
- Pitch detection, sharp/flat alerts, WebSocket, feedback

### AI Memory (23 tests)
- Storage, retrieval, filtering, importance, expiration

### Voice Commands (25 tests)
- 8 commands, recognition, execution, customization

### Budget Alerts (25 tests)
- Limits, tracking, alerts, cost breakdown, history

## Support

- 🐛 **Issues**: GitHub Issues
- 📖 **Docs**: See README.md
- 📧 **Email**: support@dawg-ai.com

## Version

- **Version**: 1.0.0
- **Created**: October 19, 2025
- **Framework**: Playwright v1.55.1
- **Node**: v20+

---

**Choose your path:**
- 🚀 Quick start → [QUICK_START.md](./QUICK_START.md)
- 📚 Full guide → [README.md](./README.md)
- 📊 Overview → [TEST_SUITE_SUMMARY.md](./TEST_SUITE_SUMMARY.md)
