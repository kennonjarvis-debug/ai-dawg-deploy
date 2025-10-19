# MetronomeEngine Flow Diagram

## Complete Deferred AudioContext Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         APP INITIALIZATION                          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  User Loads Application  │
                    └──────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │   useAudioEngine Hook    │
                    │   Initializes Engines    │
                    └──────────────────────────┘
                                  │
                                  ▼
        ┌─────────────────────────────────────────────────┐
        │  const metronome = getMetronomeEngine()         │
        │  metronome.initialize()  ← NO AudioContext      │
        │  metronomeRef.current = metronome               │
        └─────────────────────────────────────────────────┘
                                  │
                                  ▼
                        [AudioContext = null]
                    [Deferred until user gesture]
                                  │
                                  │
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │   User Arms Track        │
                    │   (Record Enable)        │
                    └──────────────────────────┘
                                  │
                                  ▼
        ┌─────────────────────────────────────────────────┐
        │  requestMicrophoneAccess()                      │
        │  ↓                                              │
        │  ensureAudioContextInitialized()                │
        │  ↓                                              │
        │  Creates AudioContext ← USER GESTURE ✓          │
        └─────────────────────────────────────────────────┘
                                  │
                                  ▼
        ┌─────────────────────────────────────────────────┐
        │  if (metronomeRef.current) {                    │
        │    metronome.initialize(newAudioContext)        │
        │  }                                              │
        └─────────────────────────────────────────────────┘
                                  │
                                  ▼
                    [AudioContext now available!]
                                  │
                                  │
┌─────────────────────────────────────────────────────────────────────┐
│                         RECORDING START                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ User Clicks Record       │
                    └──────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │   startRecording()       │
                    └──────────────────────────┘
                                  │
                                  ▼
                     ┌────────────────────────┐
                     │  countIn > 0 ?         │
                     └────────────────────────┘
                        │                  │
                       YES                NO
                        │                  │
                        ▼                  │
        ┌────────────────────────────┐    │
        │ playCountIn(                │    │
        │   countIn,                  │    │
        │   bpm,                      │    │
        │   timeSignature,            │    │
        │   metronomeVolume           │    │
        │ )                           │    │
        └────────────────────────────┘    │
                        │                  │
                        ▼                  │
        ┌────────────────────────────┐    │
        │ ensureAudioContext()       │    │
        │ ✓ AudioContext available   │    │
        └────────────────────────────┘    │
                        │                  │
                        ▼                  │
        ┌────────────────────────────┐    │
        │ Schedule all clicks:       │    │
        │ • Downbeat: 1200Hz         │    │
        │ • Upbeat: 800Hz            │    │
        │ • Total: bars × signature  │    │
        └────────────────────────────┘    │
                        │                  │
                        ▼                  │
        ┌────────────────────────────┐    │
        │ Wait for count-in to       │    │
        │ complete (Promise.resolve) │    │
        └────────────────────────────┘    │
                        │                  │
                        │◄─────────────────┘
                        │
                        ▼
        ┌────────────────────────────┐
        │ engine.startRecording()    │
        └────────────────────────────┘
                        │
                        ▼
             ┌──────────────────────┐
             │ metronomeEnabled ?   │
             └──────────────────────┘
                │              │
               YES            NO
                │              │
                ▼              │
    ┌────────────────────┐    │
    │ metronome.start(   │    │
    │   bpm,             │    │
    │   timeSignature,   │    │
    │   metronomeVolume  │    │
    │ )                  │    │
    └────────────────────┘    │
                │              │
                ▼              │
    ┌────────────────────┐    │
    │ ensureAudioContext()│   │
    │ ✓ AudioContext OK  │    │
    └────────────────────┘    │
                │              │
                ▼              │
    ┌────────────────────┐    │
    │ Initial click      │    │
    └────────────────────┘    │
                │              │
                ▼              │
    ┌────────────────────┐    │
    │ setInterval(       │    │
    │   tick,            │    │
    │   60/bpm * 1000    │    │
    │ )                  │    │
    └────────────────────┘    │
                │              │
                │◄─────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      RECORDING IN PROGRESS                          │
│                                                                     │
│  ♪ Click... Click... Click... (if metronome enabled)               │
│                                                                     │
│  🔴 Recording audio input                                           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  User Clicks Stop        │
                    └──────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │   stopRecording()        │
                    └──────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │   metronome.stop()       │
                    └──────────────────────────┘
                                  │
                                  ▼
            ┌───────────────────────────────────┐
            │ • Stop all oscillators            │
            │ • Clear interval                  │
            │ • Clean up click sources          │
            │ • Set isPlaying = false           │
            └───────────────────────────────────┘
                                  │
                                  ▼
                          [Recording Complete]


┌─────────────────────────────────────────────────────────────────────┐
│                         ERROR SCENARIOS                             │
└─────────────────────────────────────────────────────────────────────┘

Scenario 1: Count-in without AudioContext
┌────────────────────────────────────────────────────────────────┐
│  playCountIn(1, 120, 4, 0.5)                                   │
│  ↓                                                             │
│  ensureAudioContext()                                          │
│  ↓                                                             │
│  if (!this.audioContext) {                                     │
│    throw new Error('AudioContext not available...')           │
│  }                                                             │
│  ↓                                                             │
│  ❌ Error thrown, caught in try-catch                          │
│  ↓                                                             │
│  toast.error('Failed to start recording')                     │
│  stopTransport()                                               │
└────────────────────────────────────────────────────────────────┘

Scenario 2: Start metronome without AudioContext
┌────────────────────────────────────────────────────────────────┐
│  start(120, 4, 0.5)                                            │
│  ↓                                                             │
│  ensureAudioContext()                                          │
│  ↓                                                             │
│  if (!this.audioContext) {                                     │
│    throw new Error('AudioContext not available...')           │
│  }                                                             │
│  ↓                                                             │
│  ❌ Error thrown, metronome doesn't start                      │
└────────────────────────────────────────────────────────────────┘

Scenario 3: Stop metronome without AudioContext
┌────────────────────────────────────────────────────────────────┐
│  stop()                                                        │
│  ↓                                                             │
│  ✅ No ensureAudioContext() call                               │
│  ↓                                                             │
│  Clean up resources (if any exist)                            │
│  ↓                                                             │
│  ✅ Graceful handling, no errors                               │
└────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                       IMPLEMENTATION DETAILS                        │
└─────────────────────────────────────────────────────────────────────┘

MetronomeEngine.ts Key Methods:
┌────────────────────────────────────────────────────────────────┐
│ constructor(audioContext?: AudioContext)                       │
│   • Optional parameter                                         │
│   • Defaults to null                                           │
│   • No errors thrown                                           │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ initialize(audioContext?: AudioContext): void                  │
│   • Optional parameter                                         │
│   • Can be called multiple times                              │
│   • Allows late binding of AudioContext                       │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ private ensureAudioContext(): void                             │
│   • Throws if audioContext is null                            │
│   • Called before any audio operations                        │
│   • Prevents silent failures                                  │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ playCountIn(bars, bpm, timeSig, volume): Promise<void>         │
│   1. ensureAudioContext()  ← Error if not available           │
│   2. Calculate total beats = bars × timeSignature             │
│   3. Schedule all clicks ahead of time                        │
│   4. Return Promise that resolves after count-in              │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ start(bpm, timeSig, volume): void                              │
│   1. ensureAudioContext()  ← Error if not available           │
│   2. stop() any existing metronome                            │
│   3. Generate initial click                                   │
│   4. setInterval() for recurring clicks                       │
│   5. Set isPlaying = true                                     │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ stop(): void                                                   │
│   1. Set isPlaying = false                                    │
│   2. Clear interval                                           │
│   3. Stop all active oscillators                              │
│   4. Clear click sources array                                │
│   • No ensureAudioContext() - works without AudioContext      │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ private generateClick(when, isDownbeat, volume): void          │
│   1. Early return if no audioContext                          │
│   2. Create oscillator (1200Hz downbeat / 800Hz upbeat)       │
│   3. Create gain node with volume                             │
│   4. Schedule short envelope (50ms click)                     │
│   5. Connect nodes                                            │
│   6. Start and stop oscillator                                │
│   7. Clean up on ended event                                  │
└────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                          TEST COVERAGE                              │
└─────────────────────────────────────────────────────────────────────┘

✓ Initialization (4 tests)
  ✓ Create instance without AudioContext
  ✓ Accept optional AudioContext in constructor
  ✓ Initialize without AudioContext (deferred)
  ✓ Initialize with AudioContext provided

✓ Error Handling (3 tests)
  ✓ Throw error when playCountIn called without AudioContext
  ✓ Throw error when start called without AudioContext
  ✓ No error when stop called without AudioContext

✓ Count-In Functionality (5 tests)
  ✓ Resolve immediately when bars is 0
  ✓ Schedule clicks for count-in
  ✓ Schedule downbeat and upbeat clicks correctly
  ✓ Handle different time signatures
  ✓ Handle multiple bars in count-in

✓ Metronome Start/Stop (5 tests)
  ✓ Start metronome successfully
  ✓ Stop metronome successfully
  ✓ Stop previous metronome when starting new one
  ✓ Generate clicks at correct intervals
  ✓ Clean up click sources on stop

✓ Volume Control (2 tests)
  ✓ Respect volume parameter in playCountIn
  ✓ Respect volume parameter in start

✓ Cleanup (2 tests)
  ✓ Dispose cleanly
  ✓ Clean up click sources on stop

✓ Integration (2 tests)
  ✓ Work with deferred AudioContext pattern
  ✓ Work when AudioContext is provided later

✓ Edge Cases (2 tests)
  ✓ Handle very fast BPM (240)
  ✓ Handle very slow BPM (40)

Total: 25 tests, 100% passing
```
