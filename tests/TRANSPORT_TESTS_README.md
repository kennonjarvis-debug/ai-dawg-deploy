# Transport Bar and Recording Tests

Comprehensive test suite for transport bar functionality and recording features in DAWG AI.

## Test Coverage

### End-to-End Tests (`tests/e2e/transport-bar-recording.spec.ts`)

Full browser-based tests using Playwright that verify:

#### Basic Transport Button Functionality
- Play button existence and clickability
- Stop button existence and clickability
- Record button existence and clickability
- BPM display visibility and functionality
- Loop toggle functionality
- Time display updates

#### State Transitions
- ✅ Stopped → Playing
- ✅ Playing → Stopped
- ✅ Stopped → Recording
- ✅ Recording → Stopped
- ✅ Playing → Paused → Playing
- ✅ Proper state synchronization with UI

#### Recording Lifecycle
- Recording starts when Record button is pressed
- Recording stops when Stop button is pressed
- Recording can be toggled by clicking Record button again
- Time display updates during recording
- Recording indicator appears during recording
- Waveform preview during recording (visual feedback)
- Clip creation after recording stops

#### Visual Feedback and UI State
- Play button visual state changes when playing
- Record button shows recording indicator (pulse/animation)
- BPM display shows valid value
- Loop button shows active state when enabled
- Transport state persists correctly

#### Edge Cases
- ✅ Double-clicking Play button doesn't cause errors
- ✅ Double-clicking Record button doesn't cause errors
- ✅ Clicking Stop while recording is starting works correctly
- ✅ Rapid button clicks are handled gracefully
- ✅ Play and Record mutual exclusivity
- ✅ Permission handling for microphone access

#### Recording with Tracks
- Recording without armed tracks shows warning
- Can arm tracks for recording
- Multi-track recording functionality
- Recording only on armed tracks
- Aux tracks are excluded from recording

#### Transport State Persistence
- BPM changes persist
- Loop region can be enabled/disabled
- State survives page interactions

#### Transport Controls Integration
- All transport controls are present
- Controls remain functional after page interactions

### Unit Tests (`tests/unit/transportStore.test.ts`)

Tests for the Zustand transport store state management:

#### Initial State
- Correct default values for all state properties

#### Playback Controls
- `play()` - starts playback
- `pause()` - pauses playback
- `stop()` - stops and resets playhead
- `togglePlay()` - toggles between play/pause

#### Recording Controls
- `startRecording()` - starts recording and playback
- `stopRecording()` - stops recording
- `toggleRecord()` - toggles recording state
- Stop button stops both playback and recording

#### BPM Management
- Set BPM within valid range (20-300)
- Validation for BPM out of range
- Edge case BPM values

#### Time Management
- Set current time
- Prevent negative time values
- Seek to specific time

#### Loop Controls
- Toggle loop on/off
- Set loop region
- Calculate loop duration
- Check if current time is in loop region
- Validation for invalid loop ranges

#### Transport Navigation
- Skip backward by one bar
- Skip forward by one bar
- Return to start
- Prevent skipping below zero

#### Time Signature
- Set time signature (numerator/denominator)
- Handle common time signatures (3/4, 5/4, 6/8, 7/8, etc.)

#### Musical Key
- Set musical key (C, C#, D, etc.)

#### Master Volume
- Set master volume
- Clamp volume to 0-1 range

#### Punch Recording
- Set punch mode (off, quick-punch, track-punch)
- Set punch in/out times
- Validation for punch time ranges
- Clear punch times

#### Recording Aids
- Set pre-roll (0-4 bars)
- Set post-roll (0-4 bars)
- Toggle pre-roll/post-roll
- Set count-in (0-4 bars)
- Validation for recording aid ranges

#### Metronome
- Toggle metronome on/off
- Set metronome volume (0-1)
- Validation for metronome volume range

#### Time Calculations
- Calculate seconds per beat
- Calculate seconds per bar
- Convert bars to seconds
- Calculate pre-roll seconds
- Calculate post-roll seconds
- Calculate count-in seconds
- Calculate total pre-recording time

#### Store Reset
- Reset all state to initial values

#### Complex State Transitions
- Handle play → record → stop sequences
- Maintain consistency during rapid toggles
- Handle time changes during different states

### Integration Tests (`tests/integration/multiTrackRecording.test.ts`)

Tests for the multi-track recording hook integration:

#### Hook Initialization
- Initialize without errors
- Provide required functions

#### Recording State Management
- Update transport store when recording starts
- Request microphone access for armed tracks
- Request stereo input for stereo tracks
- Show warning when no tracks are armed

#### Multi-Track Recording
- Record multiple armed tracks simultaneously
- Skip unarmed tracks
- Exclude aux tracks from recording

#### Recording Lifecycle
- Clean up resources when stopping
- Handle recording errors gracefully

#### Transport Store Integration
- Sync with transport store recording state
- Respect current time from transport store

#### Audio Context Management
- Create AudioContext on first recording
- Reuse existing AudioContext

### Test Helpers (`tests/helpers/transport-helpers.ts`)

Reusable utility functions:

- `findTransportButton()` - Find buttons by type
- `getTransportButtonState()` - Get button state
- `waitForButtonState()` - Wait for state change
- `getBPMDisplay()` - Get BPM input element
- `getTimeDisplay()` - Get time display element
- `setupDAW()` - Login and open project
- `filterRealErrors()` - Filter known errors
- `isTransportBarVisible()` - Check visibility
- `getTransportControls()` - Get all controls
- `takeScreenshot()` - Labeled screenshots
- `clickAndWaitForState()` - Click and verify
- `verifyTransportBarComplete()` - Verify all controls
- `parseTimeDisplay()` - Parse time strings
- `waitForTimeUpdate()` - Wait for time change
- `findTrackArmButtons()` - Find arm buttons
- `armTrack()` - Arm a track
- `hasRecordingIndicator()` - Check recording state
- `hasWarningMessage()` - Check for warnings
- `performRecordingCycle()` - Complete recording
- `getCurrentBPM()` - Get BPM value
- `setBPM()` - Set BPM value
- `rapidClickStressTest()` - Stress test buttons

## Running the Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers (if not already installed)
npx playwright install
```

### Run E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run only transport bar recording tests
npx playwright test tests/e2e/transport-bar-recording.spec.ts

# Run with UI (headed mode)
npx playwright test tests/e2e/transport-bar-recording.spec.ts --headed

# Run with debug mode
npx playwright test tests/e2e/transport-bar-recording.spec.ts --debug

# Run specific test by name
npx playwright test tests/e2e/transport-bar-recording.spec.ts -g "Play button"

# Run with HTML report
npx playwright test tests/e2e/transport-bar-recording.spec.ts --reporter=html
```

### Run Unit Tests

```bash
# Run all unit tests
npm run test

# Run only transport store tests
npm run test -- tests/unit/transportStore.test.ts

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Run Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run only multi-track recording tests
npm run test -- tests/integration/multiTrackRecording.test.ts
```

### Run All Transport-Related Tests

```bash
# Run all tests (unit, integration, and e2e)
npm run test:unit && npm run test:integration && npm run test:e2e
```

## Test Configuration

### Playwright Configuration (`playwright.config.ts`)

```typescript
{
  testDir: './tests',
  timeout: 60000,
  retries: 1,
  workers: 1,
  baseURL: 'https://www.dawg-ai.com',
  use: {
    viewport: { width: 1920, height: 1080 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  }
}
```

### Vitest Configuration

Unit and integration tests use Vitest with the following setup:
- TypeScript support
- React Testing Library
- Mock Web Audio API
- Mock MediaRecorder API

## Test Debugging

### View Screenshots

Failed tests automatically save screenshots to:
- `/tmp/transport-*.png` - During test execution
- `test-results/` - After test completion

### View Videos

Failed E2E tests save videos to:
- `test-results/` directory

### View HTML Report

```bash
npx playwright show-report
```

### Debug a Specific Test

```bash
# Open Playwright Inspector
npx playwright test tests/e2e/transport-bar-recording.spec.ts --debug

# Run with --headed to see browser
npx playwright test tests/e2e/transport-bar-recording.spec.ts --headed --slowmo=1000
```

## Test Structure

### E2E Test Organization

```
Transport Bar - Recording E2E Tests
├── Basic Transport Button Functionality
│   ├── Play button
│   ├── Stop button
│   └── Record button
├── State Transitions
│   ├── Stopped → Playing
│   ├── Playing → Stopped
│   ├── Stopped → Recording
│   └── Recording → Stopped
├── Recording Lifecycle
│   ├── Recording starts
│   ├── Recording stops
│   └── Time display updates
├── Visual Feedback and UI State
│   ├── Button state changes
│   └── Recording indicators
├── Edge Cases
│   ├── Double-clicks
│   ├── Rapid clicks
│   └── Race conditions
├── Recording with Tracks
│   ├── Without armed tracks
│   └── With armed tracks
├── Transport State Persistence
│   ├── BPM changes
│   └── Loop state
└── Transport Controls Integration
    ├── All controls present
    └── Remain functional
```

### Unit Test Organization

```
Transport Store - State Management
├── Initial State
├── Playback Controls
├── Recording Controls
├── BPM Management
├── Time Management
├── Loop Controls
├── Transport Navigation
├── Time Signature
├── Musical Key
├── Master Volume
├── Punch Recording
├── Recording Aids
├── Metronome
├── Time Calculations
├── Input Monitoring
├── Store Reset
└── Complex State Transitions
```

## Coverage Goals

- ✅ **Unit Tests**: 100% coverage of transport store
- ✅ **Integration Tests**: All critical recording hook paths
- ✅ **E2E Tests**: All user-facing transport and recording workflows

## Expected Test Results

### All Tests Passing

```
✓ tests/unit/transportStore.test.ts (80 tests)
✓ tests/integration/multiTrackRecording.test.ts (20 tests)
✓ tests/e2e/transport-bar-recording.spec.ts (30 tests)

Total: 130 tests passing
```

## Known Issues and Limitations

### E2E Tests
- Microphone permissions may vary by browser
- Some tests require user interaction simulation
- Recording actual audio requires browser permissions

### Integration Tests
- Mocked Web Audio API (not real audio processing)
- Mocked MediaRecorder API
- Limited to state and lifecycle testing

### Unit Tests
- Pure state management only
- No actual audio processing
- No DOM interaction

## Contributing

When adding new transport or recording features:

1. Add unit tests for store state management
2. Add integration tests for hook behavior
3. Add E2E tests for user-facing functionality
4. Update this README with new test coverage

## Maintenance

### Updating Tests

When transport bar UI changes:
1. Update selectors in `transport-helpers.ts`
2. Update E2E tests to match new UI
3. Add new test cases for new features

### Regular Test Runs

Run tests before:
- ✅ Every commit
- ✅ Every pull request
- ✅ Every deployment
- ✅ After transport bar changes
- ✅ After recording system changes

## Performance

### Test Execution Times

- Unit tests: ~5 seconds
- Integration tests: ~10 seconds
- E2E tests: ~3-5 minutes (depends on browser)

### Optimization Tips

- Run unit tests first (fastest feedback)
- Run E2E tests in parallel when possible
- Use `--headed` only when debugging
- Use `--grep` to run specific tests during development

## Support

For questions or issues with tests:
1. Check test output and screenshots
2. Review this documentation
3. Check Playwright/Vitest documentation
4. Review the test helpers for reusable utilities

## References

- [Playwright Documentation](https://playwright.dev)
- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
