# Testing Guide for Audio Visualization Components

## Table of Contents

1. [Testing Checklist](#testing-checklist)
2. [Manual Testing](#manual-testing)
3. [Performance Testing](#performance-testing)
4. [Browser Compatibility Testing](#browser-compatibility-testing)
5. [Accessibility Testing](#accessibility-testing)
6. [Integration Testing](#integration-testing)
7. [Common Issues](#common-issues)

## Testing Checklist

### Pre-Flight Checks

- [ ] TypeScript compiles without errors
- [ ] All dependencies installed (wavesurfer.js, react, etc.)
- [ ] CSS file imported in main App
- [ ] Browser supports Web Audio API
- [ ] HTTPS enabled (required for microphone access)

### Component Tests

#### Waveform Display
- [ ] Displays audio buffer correctly
- [ ] Waveform scales to container size
- [ ] Zoom in/out controls work
- [ ] Zoom reset works
- [ ] Click to seek works
- [ ] Time display updates correctly
- [ ] Playback cursor moves smoothly
- [ ] Multiple waveforms can coexist
- [ ] Colors can be customized
- [ ] No memory leaks during repeated loads

#### Pitch Display
- [ ] Displays current note correctly
- [ ] Cents deviation shows accurate values
- [ ] Color changes based on pitch accuracy (green/yellow/red)
- [ ] Pitch history scrolls smoothly
- [ ] Grid lines visible
- [ ] Legend displays correctly
- [ ] Handles silence gracefully
- [ ] Confidence level shown when low
- [ ] No lag with continuous pitch input
- [ ] Data history limited to prevent memory issues

#### Rhythm Grid
- [ ] BPM display correct
- [ ] Beat lines appear on time
- [ ] Downbeats highlighted (green)
- [ ] Current position cursor moves smoothly
- [ ] Flash effect on beats
- [ ] Timing accuracy indicator works
- [ ] Measure numbers shown
- [ ] Subdivision lines visible
- [ ] Time signature display correct
- [ ] Smooth 60 FPS animation

#### Volume Meter
- [ ] Responds to audio input
- [ ] Peak indicator holds and decays
- [ ] Clip warning appears when clipping
- [ ] dB scale visible
- [ ] Color gradient displays (green to red)
- [ ] Vertical orientation works
- [ ] Horizontal orientation works
- [ ] Multiple meters can run simultaneously
- [ ] No performance degradation
- [ ] RMS calculation accurate

#### Spectrogram
- [ ] Scrolls from right to left
- [ ] Frequency labels visible
- [ ] Color scheme can be changed
- [ ] Hot color scheme works
- [ ] Cool color scheme works
- [ ] Rainbow color scheme works
- [ ] Grayscale color scheme works
- [ ] Frequency range configurable
- [ ] Smooth scrolling at 60 FPS
- [ ] No memory leaks during long sessions

#### Recording Indicator
- [ ] Shows "READY" when not recording
- [ ] Shows "RECORDING" with red dot when active
- [ ] Red dot pulses during recording
- [ ] Timer counts up correctly
- [ ] File size estimate accurate
- [ ] Quality settings display correctly
- [ ] Summary shows after recording stops
- [ ] Time format correct (M:SS.S)
- [ ] Transitions smooth

#### Visualization Dashboard
- [ ] All tabs clickable
- [ ] Active tab highlighted
- [ ] View switches correctly
- [ ] Volume meter always visible in sidebar
- [ ] Recording indicator at top
- [ ] Placeholders show when no data
- [ ] Multiple tracks can be displayed
- [ ] Controls work in each view
- [ ] Responsive to container size
- [ ] No flashing during tab switches

## Manual Testing

### Test 1: Basic Recording Flow

```
1. Open the application
2. Click "Start Recording"
3. Grant microphone permission if prompted
4. Speak or sing into the microphone
5. Observe:
   - Recording indicator shows red dot and timer
   - Volume meter responds to audio
   - Pitch display shows detected notes
6. Click "Stop Recording"
7. Verify:
   - Waveform appears
   - Recording indicator shows summary
   - Audio can be played back
```

### Test 2: Waveform Interaction

```
1. Load an audio file or complete a recording
2. Go to Waveform tab
3. Test:
   - Click on waveform to seek
   - Use zoom controls (in, out, reset)
   - Verify time display updates
   - Play audio and watch cursor move
4. Load a second audio file (backing track)
5. Verify both waveforms display
```

### Test 3: Pitch Accuracy

```
1. Start recording
2. Play a known pitch (e.g., A440 on a tuner app)
3. Verify:
   - Note shows as "A4"
   - Frequency near 440 Hz
   - Cents near 0
   - Indicator is green
4. Play slightly sharp/flat
5. Verify:
   - Cents deviation shows correctly
   - Color changes to yellow/red
6. Stop making sound
7. Verify:
   - "No pitch detected" message appears
```

### Test 4: Rhythm Grid Sync

```
1. Set BPM to known value (e.g., 120)
2. Start playback
3. Use a metronome app to verify:
   - Beat lines align with metronome clicks
   - Flash effect syncs with beats
   - Downbeats occur every 4 beats (4/4 time)
4. Change BPM
5. Verify grid adjusts accordingly
```

### Test 5: Spectrogram Analysis

```
1. Start recording or playing audio
2. Go to Spectrum tab
3. Verify:
   - Spectrogram scrolls smoothly
   - High frequencies at top
   - Low frequencies at bottom
   - Color intensity matches audio
4. Test different color schemes
5. Whistle or sing different pitches
6. Observe frequency bands light up
```

### Test 6: Long Recording Session

```
1. Start recording
2. Let it run for 5+ minutes
3. Monitor:
   - File size estimate
   - Timer accuracy
   - Memory usage (browser dev tools)
   - FPS (browser dev tools)
4. Verify no performance degradation
5. Stop recording
6. Check:
   - All data captured
   - Visualizations still responsive
```

## Performance Testing

### FPS Monitoring

Use browser developer tools:

```javascript
// In console
let lastTime = performance.now();
let frames = 0;

function measureFPS() {
  frames++;
  const now = performance.now();

  if (now >= lastTime + 1000) {
    console.log('FPS:', frames);
    frames = 0;
    lastTime = now;
  }

  requestAnimationFrame(measureFPS);
}

measureFPS();
```

Target: 60 FPS for all visualizations

### Memory Monitoring

```javascript
// In console (Chrome)
console.log('Memory:', performance.memory);

// Monitor over time
setInterval(() => {
  const used = performance.memory.usedJSHeapSize / 1048576;
  console.log('Memory used:', used.toFixed(2), 'MB');
}, 5000);
```

Expected: <50MB for all visualizations combined

### CPU Usage

1. Open Chrome DevTools > Performance
2. Start recording
3. Use visualizations for 30 seconds
4. Stop recording
5. Analyze:
   - Main thread activity
   - Frame rendering time
   - JavaScript execution time

Target: <30% CPU on modern hardware

### Optimization Verification

```typescript
// Check that cleanup happens
useEffect(() => {
  const animationId = requestAnimationFrame(animate);

  return () => {
    console.log('Cleanup called'); // Should log on unmount
    cancelAnimationFrame(animationId);
  };
}, []);
```

## Browser Compatibility Testing

### Chrome (v89+)

```
✓ All features supported
✓ Performance optimal
✓ No known issues
```

### Firefox (v88+)

```
✓ All features supported
✓ Performance good
⚠ Slight audio latency on some systems
```

### Safari (v14.1+)

```
✓ Core features supported
⚠ Requires user gesture for AudioContext
⚠ MediaDevices API may need permission prompts
```

### Edge (v89+)

```
✓ All features supported
✓ Same as Chrome (Chromium-based)
```

### Mobile Browsers

#### iOS Safari
```
✓ Basic features work
⚠ Reduced performance (target 30 FPS)
⚠ Limited microphone access
⚠ Canvas rendering may be slower
```

#### Chrome Android
```
✓ Most features work
⚠ Reduced performance on low-end devices
✓ Microphone access supported
```

### Feature Detection Test

```typescript
function runCompatibilityTest() {
  const results = {
    webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
    canvas: !!document.createElement('canvas').getContext,
    mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    requestAnimationFrame: 'requestAnimationFrame' in window,
    performance: 'performance' in window
  };

  console.table(results);

  const allSupported = Object.values(results).every(v => v);
  console.log(allSupported ? '✓ All features supported' : '✗ Missing features');

  return results;
}
```

## Accessibility Testing

### Keyboard Navigation

```
1. Use Tab to navigate between elements
2. Verify:
   - Tab buttons receive focus
   - Focus outline visible
   - Enter/Space activates buttons
3. Test with screen reader
```

### Screen Reader Testing

Test with NVDA (Windows) or VoiceOver (Mac):

```
1. Enable screen reader
2. Navigate through dashboard
3. Verify:
   - Tab labels announced
   - Button purposes clear
   - Status information readable
   - Time values announced
```

### Color Blind Testing

Use browser extensions:

1. Install "Colorblind - Dalton" or similar
2. Test with different color blindness types
3. Verify:
   - Information not solely conveyed by color
   - Text labels supplement color coding
   - Contrast ratios meet WCAG AA standards

### High Contrast Mode

```
1. Enable Windows High Contrast mode
2. Verify:
   - Text remains readable
   - Borders visible
   - Controls distinguishable
```

### Reduced Motion

```css
/* Test that animations respect user preference */
@media (prefers-reduced-motion: reduce) {
  .rec-dot {
    animation: none;
  }
}
```

## Integration Testing

### With Agent 2 (Pitch Detection)

```typescript
// Test that pitch data flows correctly
import { PitchDetector } from '../PitchDetection';
import { PitchDisplay } from '../Visualizations';

const detector = new PitchDetector();
detector.onPitchDetected((pitchData) => {
  // Should update visualization
  console.assert(pitchData.frequency > 0);
  console.assert(pitchData.note.length > 0);
});
```

### With Agent 1 (UI Layout)

```typescript
// Test that components fit in layout
import { MainLayout } from '../Layout';
import { VisualizationDashboard } from '../Visualizations';

// Verify:
// - Dashboard fits in allocated space
// - Responsive to container size changes
// - Z-index doesn't conflict with other UI
```

### With Audio Recording System

```typescript
// Test audio pipeline
const testAudioPipeline = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const context = new AudioContext();
  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();

  source.connect(analyser);

  // Should provide data to visualizations
  const dataArray = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(dataArray);

  console.assert(dataArray.some(v => v !== 128)); // Should have audio data
};
```

## Common Issues

### Issue: "Microphone permission denied"

**Debug Steps:**
1. Check browser console for errors
2. Verify HTTPS (required for getUserMedia)
3. Check browser permissions in settings
4. Try different browser

**Fix:**
```typescript
try {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
} catch (error) {
  if (error.name === 'NotAllowedError') {
    alert('Please grant microphone permission');
  }
}
```

### Issue: "Waveform not displaying"

**Debug Steps:**
1. Check that audioBuffer is not null
2. Verify container has dimensions
3. Check console for WaveSurfer errors
4. Ensure WaveSurfer.js is imported

**Fix:**
```typescript
// Log for debugging
useEffect(() => {
  console.log('Audio buffer:', audioBuffer);
  console.log('Container:', containerRef.current);
}, [audioBuffer]);
```

### Issue: "Low FPS / choppy animations"

**Debug Steps:**
1. Open Chrome DevTools > Performance
2. Check CPU usage
3. Look for memory leaks
4. Verify cleanup on unmount

**Fix:**
```typescript
// Reduce update frequency
const throttledUpdate = useCallback(
  throttle((data) => {
    updateVisualization(data);
  }, 50), // 20 FPS instead of 60
  []
);
```

### Issue: "Pitch detection not working"

**Debug Steps:**
1. Verify analyser is connected
2. Check if audio input is working
3. Test with known frequency
4. Check confidence threshold

**Fix:**
```typescript
// Verify audio input
analyser.getByteTimeDomainData(dataArray);
const hasAudio = dataArray.some(v => v !== 128);
console.log('Has audio input:', hasAudio);
```

### Issue: "Memory leak during long sessions"

**Debug Steps:**
1. Monitor memory in DevTools
2. Check for uncancelled animations
3. Verify array sizes are bounded
4. Look for event listeners not removed

**Fix:**
```typescript
// Limit data history
setPitchData(prev => prev.slice(-500));

// Cleanup animations
useEffect(() => {
  return () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };
}, []);
```

## Automated Testing Script

```bash
#!/bin/bash

echo "Running Audio Visualization Tests..."

# Check TypeScript compilation
echo "1. TypeScript compilation..."
npm run build
if [ $? -eq 0 ]; then
  echo "✓ TypeScript compiled successfully"
else
  echo "✗ TypeScript compilation failed"
  exit 1
fi

# Check for missing dependencies
echo "2. Checking dependencies..."
npm list wavesurfer.js > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✓ WaveSurfer.js installed"
else
  echo "✗ WaveSurfer.js missing"
  exit 1
fi

# Run linter
echo "3. Running linter..."
npm run lint
if [ $? -eq 0 ]; then
  echo "✓ No lint errors"
else
  echo "⚠ Lint warnings found"
fi

echo "All automated tests passed!"
```

## Test Coverage Goals

- [ ] 100% of components render without errors
- [ ] 100% of props validated
- [ ] 90%+ of user interactions tested
- [ ] 80%+ of edge cases handled
- [ ] All performance metrics met
- [ ] All browsers tested
- [ ] Accessibility standards met

## Continuous Testing

1. Test after every major change
2. Test on different devices/browsers weekly
3. Performance monitoring in production
4. User feedback collection
5. Regression testing before releases
