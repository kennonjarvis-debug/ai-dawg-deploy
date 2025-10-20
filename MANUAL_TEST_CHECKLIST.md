# DAWG AI - Manual Test Checklist

**Version**: 1.0
**Date**: October 19, 2025
**Test Environment**: Browser-based (Chrome, Firefox, Safari)

---

## Table of Contents

1. [Widget Sizing & Resizability](#1-widget-sizing--resizability)
2. [AI Auto-Routing System](#2-ai-auto-routing-system)
3. [AI Mix/Master with Progress Indicators](#3-ai-mixmaster-with-progress-indicators)
4. [Multi-Track Recorder](#4-multi-track-recorder)
5. [AI Mix Presets Submenu](#5-ai-mix-presets-submenu)
6. [Core DAW Functionality](#6-core-daw-functionality)

---

## 1. Widget Sizing & Resizability

### Test 1.1: Timeline Widget - 8-Handle Resize
**Objective**: Verify Timeline widget can be resized from all 8 handles

**Steps**:
1. Navigate to DAW Dashboard (`/project/:projectId`)
2. Locate the Timeline widget (top panel)
3. Hover over top edge → cursor should change to `ns-resize`
4. Drag top edge → widget should resize vertically
5. Hover over bottom edge → cursor should change to `ns-resize`
6. Drag bottom edge → widget should resize vertically
7. Hover over left edge → cursor should change to `ew-resize`
8. Drag left edge → widget should resize horizontally
9. Hover over right edge → cursor should change to `ew-resize`
10. Drag right edge → widget should resize horizontally
11. Hover over top-left corner → cursor should change to `nwse-resize`
12. Drag top-left corner → widget should resize diagonally
13. Hover over top-right corner → cursor should change to `nesw-resize`
14. Drag top-right corner → widget should resize diagonally
15. Hover over bottom-left corner → cursor should change to `nesw-resize`
16. Drag bottom-left corner → widget should resize diagonally
17. Hover over bottom-right corner → cursor should change to `nwse-resize`
18. Drag bottom-right corner → widget should resize diagonally

**Expected Results**:
- ✅ All 8 handles visible and functional
- ✅ Min height: 300px enforced
- ✅ Max height: 600px enforced
- ✅ Cursor changes appropriately for each handle
- ✅ Smooth resize animation
- ✅ Widget position saved to localStorage

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 1.2: Mixer Widget - 8-Handle Resize
**Objective**: Verify Mixer widget can be resized from all 8 handles

**Steps**:
1. Locate the Mixer widget (left panel)
2. Repeat steps 3-18 from Test 1.1

**Expected Results**:
- ✅ All 8 handles functional
- ✅ Min width: 300px
- ✅ Max width: 1200px
- ✅ Min height: 200px
- ✅ Max height: 500px
- ✅ Position persists across page reloads

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 1.3: Lyrics Widget - 8-Handle Resize
**Objective**: Verify Lyrics widget can be resized from all 8 handles

**Steps**:
1. Locate the Lyrics widget (right panel)
2. Repeat steps 3-18 from Test 1.1

**Expected Results**:
- ✅ All 8 handles functional
- ✅ Min width: 250px
- ✅ Max width: 600px
- ✅ Min height: 200px
- ✅ Max height: 500px

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 1.4: Widget Position Persistence
**Objective**: Verify widget sizes persist across browser reloads

**Steps**:
1. Resize Timeline widget to 500px height
2. Resize Mixer widget to 800px width
3. Note the exact sizes in DevTools
4. Refresh the page (Cmd/Ctrl + R)
5. Measure widget sizes again

**Expected Results**:
- ✅ Timeline height: 500px (± 2px)
- ✅ Mixer width: 800px (± 2px)
- ✅ All widget positions maintained

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

## 2. AI Auto-Routing System

### Test 2.1: Vocal Track Detection
**Objective**: Verify system automatically detects vocal tracks

**Steps**:
1. Create new project
2. Add 3 tracks:
   - Track 1: "Lead Vocal"
   - Track 2: "Drums"
   - Track 3: "Backing Vocals"
3. Open DevTools Console
4. Click "DAWG AI" → "AI Mix" → "AI Auto (Intelligent)"
5. Check console logs for detected tracks

**Expected Results**:
- ✅ System detects "Lead Vocal" as vocal track
- ✅ System detects "Backing Vocals" as vocal track
- ✅ System does NOT detect "Drums" as vocal track
- ✅ Success notification appears

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 2.2: Vocal Mix Bus Creation
**Objective**: Verify system creates vocal mix bus automatically

**Steps**:
1. Create project with tracks: "Lead Vocal", "Harmony 1", "Harmony 2"
2. Click "DAWG AI" → "AI Mix" → "Clean Mix"
3. Open Mixer panel
4. Check for "Vocal Mix Bus" in bus list

**Expected Results**:
- ✅ "Vocal Mix Bus" appears in mixer
- ✅ All 3 vocal tracks routed to bus
- ✅ Bus has appropriate EQ and compression
- ✅ Visual routing diagram shows connections
- ✅ Success notification: "✓ Created vocal chain: Lead Vocal, Harmony 1, Harmony 2 → EQ → Comp → Vocal Mix Bus → Master"

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 2.3: Send/Return Creation (Reverb)
**Objective**: Verify system creates reverb send/return automatically

**Steps**:
1. Create project with "Lead Vocal" track
2. Click "DAWG AI" → "AI Mix" → "Warm Mix"
3. Open Mixer panel
4. Check for "Reverb Send" and "Reverb Return" buses

**Expected Results**:
- ✅ Reverb Send bus created
- ✅ Reverb Return bus created
- ✅ Lead Vocal has send to Reverb (25% level)
- ✅ Reverb configured as post-fader send
- ✅ Reverb return routed to Master

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 2.4: Genre-Specific Processing (Hip-Hop)
**Objective**: Verify Hip-Hop preset applies genre-appropriate processing

**Steps**:
1. Create project with "Lead Vocal" track
2. Click "DAWG AI" → "AI Mix" → "Punchy Mix"
3. Check applied effects on Lead Vocal track
4. Verify EQ settings (should boost high-mids for clarity)

**Expected Results**:
- ✅ High-pass filter at 80 Hz applied
- ✅ De-esser at 7 kHz applied
- ✅ Compression ratio: 4:1 to 6:1
- ✅ EQ boost at 3-5 kHz (presence)
- ✅ Attack: 1-5ms, Release: 50-150ms

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 2.5: Time Savings Verification
**Objective**: Measure time savings vs manual routing

**Steps**:
1. Create project with 5 vocal tracks
2. **Manual Method**:
   - Time yourself creating vocal bus manually
   - Time yourself routing all 5 tracks
   - Time yourself adding EQ, compression, sends
   - Record total time: __________ minutes
3. **AI Auto-Routing Method**:
   - Delete all buses
   - Time yourself using "AI Mix" → "AI Auto"
   - Record total time: __________ seconds

**Expected Results**:
- ✅ Manual time: 15-30 minutes
- ✅ AI Auto time: <20 seconds
- ✅ Time savings: >95%

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

## 3. AI Mix/Master with Progress Indicators

### Test 3.1: Loudness Meter Display
**Objective**: Verify real-time LUFS meter displays correctly

**Steps**:
1. Load audio track (any duration > 30 seconds)
2. Open "Advanced Features" panel
3. Scroll to "AI Mastering" section
4. Click "Streaming (-14 LUFS)" button
5. Observe loudness meter during processing

**Expected Results**:
- ✅ Loudness meter appears
- ✅ Current LUFS displayed (e.g., "-18 LUFS")
- ✅ Target LUFS displayed ("-14 LUFS")
- ✅ Meter needle animates smoothly (60fps)
- ✅ Color-coded zones visible:
  - Quiet (blue)
  - Streaming (green)
  - Club (yellow)
  - Hot (orange)
  - Danger (red)
- ✅ True Peak (dBTP) displayed
- ✅ Dynamic Range (PLR) displayed

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 3.2: Progress Bar - 5-Step Pipeline
**Objective**: Verify progress bar shows all 5 mastering steps

**Steps**:
1. Load audio track
2. Click "Club/EDM (-9 LUFS)" button
3. Watch progress bar

**Expected Results**:
- ✅ Step 1: "Analyzing Audio..." (0-20%)
- ✅ Step 2: "Applying EQ..." (20-40%)
- ✅ Step 3: "Compressing..." (40-60%)
- ✅ Step 4: "Enhancing Stereo..." (60-80%)
- ✅ Step 5: "Final Limiting..." (80-100%)
- ✅ Each step shows checkmark when complete
- ✅ Estimated time remaining displayed
- ✅ Cancel button functional

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 3.3: Before/After A/B Comparison
**Objective**: Verify A/B toggle works correctly

**Steps**:
1. Load audio track
2. Complete mastering process (-14 LUFS)
3. Click "A/B Compare" button
4. Play audio
5. Toggle between Original (A) and Mastered (B)

**Expected Results**:
- ✅ "A" shows original audio
- ✅ "B" shows mastered audio
- ✅ Toggle switches smoothly without glitches
- ✅ Loudness difference displayed (e.g., "+4 dB")
- ✅ Visual indicator shows which version is playing

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 3.4: Error Handling
**Objective**: Verify graceful error handling during mastering

**Steps**:
1. Load audio track
2. Click "Streaming (-14 LUFS)"
3. **During processing**, click "Cancel" button

**Expected Results**:
- ✅ Processing stops immediately
- ✅ Error message: "Mastering cancelled"
- ✅ UI returns to initial state
- ✅ No partial processing applied
- ✅ Can retry mastering after cancel

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 3.5: Progress Event Accuracy
**Objective**: Verify progress events match actual processing time

**Steps**:
1. Load 3-minute audio track
2. Click "Streaming (-14 LUFS)"
3. Record timestamps for each step:
   - Step 1 start: __________
   - Step 2 start: __________
   - Step 3 start: __________
   - Step 4 start: __________
   - Step 5 start: __________
   - Complete: __________

**Expected Results**:
- ✅ Total processing time: 8-15 seconds
- ✅ Each step takes approximately 1.5-3 seconds
- ✅ Progress bar matches actual processing
- ✅ Estimated time remaining accurate (± 2 seconds)

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

## 4. Multi-Track Recorder

### Test 4.1: Open Multi-Track Recorder (Menu)
**Objective**: Verify multi-track recorder opens from menu

**Steps**:
1. Navigate to DAW Dashboard
2. Click "DAWG AI" menu in top bar
3. Click "Multi-Track Recorder"

**Expected Results**:
- ✅ Multi-Track Recorder widget appears at bottom
- ✅ Toast notification: "Multi-Track Recorder opened"
- ✅ Menu item shows "✓ Open" indicator
- ✅ Widget is full-width (lg:col-span-12)
- ✅ Default height: 600px

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 4.2: Open Multi-Track Recorder (Keyboard Shortcut)
**Objective**: Verify keyboard shortcut opens recorder

**Steps**:
1. Navigate to DAW Dashboard
2. Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

**Expected Results**:
- ✅ Multi-Track Recorder opens immediately
- ✅ Toast notification appears
- ✅ Shortcut works from anywhere in DAW

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 4.3: Add Tracks (Up to 16)
**Objective**: Verify ability to add up to 16 tracks

**Steps**:
1. Open Multi-Track Recorder
2. Click "Add Track" button repeatedly
3. Count total tracks created

**Expected Results**:
- ✅ Tracks 1-16 can be added successfully
- ✅ Each track has unique name (Track 1, Track 2, etc.)
- ✅ After 16 tracks, "Add Track" button disabled
- ✅ Error toast: "Maximum 16 tracks allowed"
- ✅ Track list scrollable (max-h-96 with overflow-y-auto)

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 4.4: Track Controls - Arm/Mute/Solo
**Objective**: Verify individual track controls work

**Steps**:
1. Add 3 tracks
2. **Arm Track 1**: Click "Arm" button
3. **Mute Track 2**: Click "Mute" button
4. **Solo Track 3**: Click "Solo" button
5. Start recording

**Expected Results**:
- ✅ Track 1: Armed (red indicator), recording active
- ✅ Track 2: Muted (no audio output during playback)
- ✅ Track 3: Solo (only Track 3 audible during playback)
- ✅ Visual indicators for each state
- ✅ Multiple tracks can be armed simultaneously

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 4.5: Simultaneous Recording (16 Tracks)
**Objective**: Verify 16 tracks can record simultaneously

**Steps**:
1. Add 16 tracks
2. Arm all 16 tracks
3. Click "Record" button on transport controls
4. Record for 10 seconds
5. Click "Stop"

**Expected Results**:
- ✅ All 16 tracks record simultaneously
- ✅ Recording timer displays accurately
- ✅ Red pulsing indicator shows recording state
- ✅ Individual level meters for each track
- ✅ No audio glitches or dropouts

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 4.6: Level and Pan Controls
**Objective**: Verify level faders and pan knobs work

**Steps**:
1. Add 2 tracks
2. Set Track 1 level to 50% (0.5)
3. Set Track 1 pan to hard left (-1.0)
4. Set Track 2 level to 80% (0.8)
5. Set Track 2 pan to hard right (1.0)
6. Play back recording

**Expected Results**:
- ✅ Track 1: Quieter (50% level), panned left
- ✅ Track 2: Louder (80% level), panned right
- ✅ Faders respond smoothly to mouse drag
- ✅ Pan knobs respond smoothly
- ✅ Values displayed numerically

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 4.7: Export Session
**Objective**: Verify export functionality

**Steps**:
1. Record 2 tracks
2. Click "Export Session" button
3. Choose export format (WAV/MP3)

**Expected Results**:
- ✅ Export dialog appears
- ✅ Format options available (WAV, MP3)
- ✅ All recorded tracks included in export
- ✅ Download initiates successfully
- ✅ File playable in external audio player

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

## 5. AI Mix Presets Submenu

### Test 5.1: Open AI Mix Submenu
**Objective**: Verify AI Mix submenu opens correctly

**Steps**:
1. Select at least 1 audio clip
2. Click "DAWG AI" menu
3. Click "AI Mix" (should show submenu arrow)

**Expected Results**:
- ✅ Submenu expands inline
- ✅ ChevronDown icon rotates -90deg
- ✅ 5 mix styles displayed:
  - ✨ Clean Mix
  - 🔥 Warm Mix
  - 💥 Punchy Mix
  - 📻 Radio-Ready
  - 🤖 AI Auto (Intelligent)
- ✅ Each style shows description on hover

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 5.2: Clean Mix Preset
**Objective**: Verify Clean Mix preset applies correct processing

**Steps**:
1. Select vocal clip
2. Click "DAWG AI" → "AI Mix" → "Clean Mix"

**Expected Results**:
- ✅ Processing starts immediately
- ✅ Toast notification: "Applying Clean Mix..."
- ✅ Transparent, natural sound
- ✅ Minimal compression
- ✅ Light EQ adjustments
- ✅ Success notification with routing summary

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 5.3: Warm Mix Preset
**Objective**: Verify Warm Mix preset applies vintage characteristics

**Steps**:
1. Select vocal clip
2. Click "DAWG AI" → "AI Mix" → "Warm Mix"

**Expected Results**:
- ✅ Analog warmth applied
- ✅ Vintage-style compression
- ✅ Subtle saturation
- ✅ Warm EQ curve (gentle high-frequency roll-off)

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 5.4: Punchy Mix Preset
**Objective**: Verify Punchy Mix preset adds aggression

**Steps**:
1. Select vocal clip
2. Click "DAWG AI" → "AI Mix" → "Punchy Mix"

**Expected Results**:
- ✅ Aggressive compression (higher ratio)
- ✅ Transient enhancement
- ✅ Boosted mids and highs
- ✅ In-your-face sound

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 5.5: Radio-Ready Preset
**Objective**: Verify Radio-Ready preset achieves commercial loudness

**Steps**:
1. Select full song/mix
2. Click "DAWG AI" → "AI Mix" → "Radio-Ready"

**Expected Results**:
- ✅ Competitive loudness (-9 to -6 LUFS)
- ✅ Heavy limiting applied
- ✅ Maximized perceived volume
- ✅ No clipping or distortion

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 5.6: AI Auto Preset (Intelligent)
**Objective**: Verify AI Auto analyzes and chooses best style

**Steps**:
1. Select vocal clip
2. Click "DAWG AI" → "AI Mix" → "AI Auto (Intelligent)"
3. Check console logs for AI decision

**Expected Results**:
- ✅ AI analyzes audio characteristics
- ✅ Console log: "AI chose: [style]" (e.g., "Warm Mix")
- ✅ Appropriate style applied automatically
- ✅ Success notification explains AI's choice

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 5.7: Submenu Closes After Selection
**Objective**: Verify submenu behavior after selection

**Steps**:
1. Open "DAWG AI" → "AI Mix" submenu
2. Click any mix style
3. Observe menu state

**Expected Results**:
- ✅ Submenu closes immediately after selection
- ✅ Main menu closes
- ✅ Processing starts
- ✅ Can reopen menu without issues

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

## 6. Core DAW Functionality

### Test 6.1: Project Load Time
**Objective**: Measure project load performance

**Steps**:
1. Create project with 10 tracks, 50+ clips
2. Close project
3. Reopen project
4. Measure time from click to fully loaded

**Expected Results**:
- ✅ Load time: <3 seconds
- ✅ All tracks visible
- ✅ All clips rendered
- ✅ Playback ready immediately

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 6.2: Audio Playback Quality
**Objective**: Verify high-quality audio playback

**Steps**:
1. Load high-quality WAV file (24-bit/96kHz)
2. Play audio
3. Check for artifacts, glitches, dropouts

**Expected Results**:
- ✅ No audio glitches
- ✅ No dropouts
- ✅ No clipping
- ✅ Smooth playback

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

### Test 6.3: Cross-Browser Compatibility
**Objective**: Verify all features work across browsers

**Test on**:
- ⬜ Chrome (latest)
- ⬜ Firefox (latest)
- ⬜ Safari (latest)
- ⬜ Edge (latest)

**Features to Test** (in each browser):
1. Widget resize (all 8 handles)
2. AI Mix/Master progress indicators
3. Multi-track recorder
4. AI Mix presets submenu
5. Audio playback

**Expected Results**:
- ✅ All features functional in all browsers
- ✅ No browser-specific bugs
- ✅ Consistent UI appearance

**Pass/Fail**: ⬜ PASS  ⬜ FAIL

**Notes**: _______________________________________________

---

## Test Summary

**Date Tested**: _______________
**Tested By**: _______________
**Browser**: _______________
**OS**: _______________

**Overall Results**:
- Total Tests: 35
- Passed: _____
- Failed: _____
- Pass Rate: _____%

**Critical Issues Found**:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Non-Critical Issues Found**:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Recommendations**:
_______________________________________________
_______________________________________________
_______________________________________________

---

## Appendix: Test Data Files

**Recommended Test Files**:
- `test-vocal.wav` - Clean vocal recording (30 sec, 24-bit/48kHz)
- `test-full-mix.wav` - Full song mix (3 min, 24-bit/48kHz)
- `test-short.mp3` - Short clip for quick tests (10 sec)
- `test-long.wav` - Long-form audio (10 min) for stress testing

**Create Test Files**:
```bash
# Generate test tones (requires ffmpeg)
ffmpeg -f lavfi -i "sine=frequency=440:duration=30" -ar 48000 -sample_fmt s24 test-tone-440hz.wav
```

---

**End of Manual Test Checklist**
