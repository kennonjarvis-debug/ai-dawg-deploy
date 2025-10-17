# DAWG AI - Manual Testing Guide

## Current Features Available for Testing

### 🎛️ Transport Controls
### 🎚️ Track Management
### 🎙️ Audio Recording
### 🔊 Audio Playback
### 📊 Waveform Display
### 💾 Export Audio
### 🎧 Device Selection

---

## Test Suite 1: Transport Controls

### Test 1.1: Basic Transport Playback
**Steps:**
1. Open http://localhost:3000
2. Click the Play button (▶) in transport bar
3. Observe the waveform bars animating
4. Click Pause button (⏸)
5. Waveform bars should stop animating

**Expected Result:**
- ✅ Play button changes to Pause when clicked
- ✅ Waveform bars animate when playing
- ✅ Animation stops when paused

### Test 1.2: Keyboard Shortcuts
**Steps:**
1. Press `Spacebar` on keyboard
2. Press `Spacebar` again

**Expected Result:**
- ✅ Spacebar toggles play/pause
- ✅ Works from anywhere in the app (except when typing in inputs)

### Test 1.3: BPM Display
**Steps:**
1. Check the BPM display in transport bar

**Expected Result:**
- ✅ Shows "120 BPM" by default

### Test 1.4: Time Display
**Steps:**
1. Click Play
2. Observe time displays (MM:SS.mmm and bars.beats.sixteenths)

**Expected Result:**
- ✅ Both time formats update smoothly
- ✅ Positions increment while playing

### Test 1.5: Volume Control
**Steps:**
1. Click the volume slider in transport bar
2. Drag to adjust volume
3. Click + button to increase volume
4. Click - button to decrease volume

**Expected Result:**
- ✅ Slider responds to drag
- ✅ +/- buttons adjust volume by 10
- ✅ Volume stays between 0-100

---

## Test Suite 2: Track Management

### Test 2.1: Add Track
**Steps:**
1. Click "+ Add Track" button (either in transport or sidebar)
2. Observe the track list

**Expected Result:**
- ✅ New track appears in sidebar
- ✅ Track is named "Audio 1", "Audio 2", etc.
- ✅ Track has random color indicator
- ✅ Track is automatically selected (active state)

### Test 2.2: Rename Track
**Steps:**
1. Add a track
2. Double-click the track name
3. Type a new name (e.g., "Vocals")
4. Press Enter

**Expected Result:**
- ✅ Name becomes editable
- ✅ New name is saved
- ✅ Edit mode exits after Enter

**Alternative:**
- Double-click name
- Type new name
- Click outside the input

**Expected Result:**
- ✅ Name is saved when clicking outside

### Test 2.3: Select Track
**Steps:**
1. Add 3 tracks
2. Click on Track 2

**Expected Result:**
- ✅ Track 2 becomes active (highlighted)
- ✅ Only one track is active at a time

### Test 2.4: Solo Track
**Steps:**
1. Add 2 tracks
2. Click "S" button on Track 1

**Expected Result:**
- ✅ "S" button highlights/changes color
- ✅ Solo state is toggled

### Test 2.5: Mute Track
**Steps:**
1. Add a track
2. Click "M" button

**Expected Result:**
- ✅ "M" button highlights
- ✅ Mute state is toggled

### Test 2.6: Volume Control Per Track
**Steps:**
1. Add a track
2. Drag the volume slider
3. Observe the numeric value

**Expected Result:**
- ✅ Slider moves smoothly
- ✅ Numeric value updates (0-100)
- ✅ Volume is saved per track

### Test 2.7: Duplicate Track
**Steps:**
1. Add a track and rename it "Lead Guitar"
2. Click the duplicate button (copy icon)

**Expected Result:**
- ✅ New track appears
- ✅ New track is named "Lead Guitar (Copy)"
- ✅ Settings are duplicated (volume, etc.)

### Test 2.8: Delete Track
**Steps:**
1. Add a track
2. Click the delete button (trash icon)
3. Confirm the deletion prompt

**Expected Result:**
- ✅ Confirmation dialog appears
- ✅ Track is removed after confirmation
- ✅ Track list updates

### Test 2.9: Track Color Indicators
**Steps:**
1. Add 5+ tracks
2. Observe the color strips on the left edge

**Expected Result:**
- ✅ Each track has a different color (from 8 available colors)
- ✅ Colors are visually distinct

---

## Test Suite 3: Audio Recording

### Test 3.1: Record Arm Without Monitoring
**Steps:**
1. Add a track
2. Do NOT click record arm yet
3. Observe browser permissions

**Expected Result:**
- ✅ NO microphone permission requested
- ✅ No monitoring/feedback

### Test 3.2: Enable Recording (Record Arm)
**Steps:**
1. Add a track
2. Click the record arm button (●)
3. Allow microphone access if prompted

**Expected Result:**
- ✅ Browser requests microphone permission
- ✅ Record arm button (●) highlights in red
- ✅ You can hear yourself (monitoring enabled)

### Test 3.3: Disable Recording (Disarm)
**Steps:**
1. With record arm enabled (from Test 3.2)
2. Click the record arm button (●) again

**Expected Result:**
- ✅ Record arm button unhighlights
- ✅ Monitoring stops (can't hear yourself)
- ✅ Microphone indicator in browser turns off
- ✅ Microphone is fully released

### Test 3.4: Record Audio
**Steps:**
1. Add a track
2. Click record arm button (●)
3. Allow microphone access
4. Click Play button in transport (should auto-start recording)
5. Speak or make sound for 5 seconds
6. Click Pause/Stop

**Expected Result:**
- ✅ Recording starts when transport plays
- ✅ Recording count appears on track ("1 recording")
- ✅ Recording is saved to track

### Test 3.5: Multiple Takes on Same Track
**Steps:**
1. Complete Test 3.4
2. Keep record arm enabled
3. Click Play again
4. Record another 5 seconds
5. Click Pause

**Expected Result:**
- ✅ Track shows "2 recordings"
- ✅ Latest recording becomes active

### Test 3.6: Record on Multiple Tracks
**Steps:**
1. Add Track 1, record arm, record something
2. Add Track 2, record arm, record something different
3. Disable record arm on both

**Expected Result:**
- ✅ Each track has its own recording
- ✅ Recordings are independent

---

## Test Suite 4: Audio Playback

### Test 4.1: Play Recording
**Steps:**
1. Record audio on a track (see Test 3.4)
2. Disable record arm (●)
3. Click Play in transport

**Expected Result:**
- ✅ Your recorded audio plays back
- ✅ Playback is in sync with transport

### Test 4.2: Volume Control During Playback
**Steps:**
1. Play a recording
2. Adjust track volume slider while playing

**Expected Result:**
- ✅ Volume changes in real-time
- ✅ No interruption in playback

### Test 4.3: Mute During Playback
**Steps:**
1. Play a recording
2. Click "M" (mute) button

**Expected Result:**
- ✅ Audio is immediately silenced
- ✅ Playback continues (just muted)

### Test 4.4: Solo Track Playback
**Steps:**
1. Record on Track 1 and Track 2
2. Click "S" (solo) on Track 1
3. Click Play

**Expected Result:**
- ✅ Only Track 1 plays
- ✅ Track 2 is silenced (even if not muted)

### Test 4.5: Multiple Tracks Playing Simultaneously
**Steps:**
1. Record audio on 3 different tracks
2. Disable all record arms
3. Click Play

**Expected Result:**
- ✅ All 3 tracks play at the same time
- ✅ Audio is mixed together
- ✅ Individual volume controls work

---

## Test Suite 5: Waveform Display

### Test 5.1: View Waveform
**Steps:**
1. Record audio on a track
2. Observe the waveform display area (center of screen)

**Expected Result:**
- ✅ Waveform visualization appears
- ✅ Waveform shows audio peaks and valleys
- ✅ Waveform colors match design (gray/white)

### Test 5.2: Zoom In
**Steps:**
1. With a recording loaded
2. Click the Zoom In button (+) in waveform controls

**Expected Result:**
- ✅ Waveform zooms in (shows more detail)
- ✅ Zoom level percentage increases
- ✅ Horizontal scrollbar may appear

### Test 5.3: Zoom Out
**Steps:**
1. Zoom in first
2. Click the Zoom Out button (-)

**Expected Result:**
- ✅ Waveform zooms out (shows more time)
- ✅ Zoom level percentage decreases

### Test 5.4: Fit to Width
**Steps:**
1. Zoom in/out to any level
2. Click the Fit button (maximize icon)

**Expected Result:**
- ✅ Waveform fits entire width
- ✅ Zoom resets to 100% or fits content

### Test 5.5: Waveform Syncs with Track Selection
**Steps:**
1. Record on Track 1
2. Record on Track 2 (different audio)
3. Click Track 1
4. Click Track 2

**Expected Result:**
- ✅ Waveform updates when switching tracks
- ✅ Shows correct audio for selected track
- ✅ Shows latest/active recording for that track

### Test 5.6: Empty Waveform State
**Steps:**
1. Add a track with no recordings
2. Observe waveform area

**Expected Result:**
- ✅ Shows empty state message
- ✅ Message: "No recording selected"
- ✅ Helpful hint displayed

---

## Test Suite 6: Device Selection

### Test 6.1: View Available Input Devices
**Steps:**
1. Add a track
2. Click the Input device dropdown (microphone icon)

**Expected Result:**
- ✅ Dropdown menu appears
- ✅ Lists all available microphones
- ✅ Shows device names clearly

### Test 6.2: Select Different Input Device
**Steps:**
1. Open input device dropdown
2. Select a different microphone
3. Enable record arm

**Expected Result:**
- ✅ Dropdown closes
- ✅ Selected device name shows in button
- ✅ Recording uses new microphone

### Test 6.3: View Available Output Devices
**Steps:**
1. Add a track
2. Click the Output device dropdown (speaker icon)

**Expected Result:**
- ✅ Dropdown menu appears
- ✅ Lists all available speakers/headphones
- ✅ Shows device names clearly

### Test 6.4: Select Different Output Device
**Steps:**
1. Open output device dropdown
2. Select a different speaker/headphone

**Expected Result:**
- ✅ Dropdown closes
- ✅ Selected device name shows in button
- ✅ Monitoring/playback routes to new device

### Test 6.5: Device Changes Per Track
**Steps:**
1. Add Track 1, set input to "Microphone A"
2. Add Track 2, set input to "Microphone B" (if available)

**Expected Result:**
- ✅ Each track remembers its own input device
- ✅ Switching between tracks shows correct device

### Test 6.6: Device Hot-Swapping
**Steps:**
1. Open device dropdown
2. Physically unplug/plug in a USB microphone
3. Reopen device dropdown

**Expected Result:**
- ✅ Device list updates automatically
- ✅ New devices appear
- ✅ Disconnected devices disappear

---

## Test Suite 7: Export Audio

### Test 7.1: Export Single Recording (WAV)
**Steps:**
1. Record audio on a track
2. Click the download button (download icon) on the track
3. Check your Downloads folder

**Expected Result:**
- ✅ WAV file downloads
- ✅ Filename format: `{TrackName}_{YYYY-MM-DD}.wav`
- ✅ File can be opened in audio software
- ✅ Audio quality is preserved

### Test 7.2: Export Multiple Recordings
**Steps:**
1. Record 3 takes on a track
2. Click download button

**Expected Result:**
- ✅ Exports the active/latest recording
- ✅ Downloads successfully

### Test 7.3: Export from Multiple Tracks
**Steps:**
1. Record on Track 1 (name it "Vocals")
2. Record on Track 2 (name it "Guitar")
3. Export both

**Expected Result:**
- ✅ Each track exports its own recording
- ✅ Filenames include track names
- ✅ Files are separate and correct

### Test 7.4: No Recording Export
**Steps:**
1. Add a track with no recordings
2. Look for download button

**Expected Result:**
- ✅ Download button does NOT appear
- ✅ OR shows disabled state

---

## Test Suite 8: Integration Tests

### Test 8.1: Full Recording Workflow
**Steps:**
1. Click "+ Add Track"
2. Rename to "Test Vocal"
3. Select input device
4. Click record arm (●)
5. Click Play (transport)
6. Speak for 10 seconds
7. Click Pause
8. Click record arm (●) to disarm
9. Click Play to playback
10. Click download to export

**Expected Result:**
- ✅ Each step works smoothly
- ✅ No errors in console
- ✅ Recording captured and played back
- ✅ Export successful

### Test 8.2: Multi-Track Recording
**Steps:**
1. Add Track 1, record vocals
2. Add Track 2, record guitar (or different sound)
3. Disable both record arms
4. Click Play
5. Adjust individual volumes
6. Export both tracks

**Expected Result:**
- ✅ Both tracks play simultaneously
- ✅ Individual volume controls work
- ✅ Both exports are correct

### Test 8.3: Track Management During Playback
**Steps:**
1. Record on 2 tracks
2. Start playback
3. While playing: mute Track 1
4. While playing: solo Track 2
5. While playing: adjust volumes

**Expected Result:**
- ✅ All controls work during playback
- ✅ No audio glitches
- ✅ Changes apply immediately

### Test 8.4: Browser Refresh Persistence
**Steps:**
1. Add 3 tracks
2. Record on each
3. Refresh browser (F5)

**Expected Result:**
- ⚠️ **KNOWN LIMITATION**: Recordings are lost
- ✅ Track structure is lost (this is expected - no persistence yet)

### Test 8.5: Multiple Browser Tabs
**Steps:**
1. Open http://localhost:3000 in Tab 1
2. Open http://localhost:3000 in Tab 2
3. Add track in Tab 1
4. Observe Tab 2

**Expected Result:**
- ✅ Each tab has independent state
- ✅ Audio devices don't conflict

---

## Test Suite 9: UI/UX Tests

### Test 9.1: Responsive Layout
**Steps:**
1. Resize browser window (narrow and wide)
2. Observe layout

**Expected Result:**
- ✅ Track sidebar stays 320px
- ✅ Waveform area fills remaining space
- ✅ Transport bar stays full width at top

### Test 9.2: Scrolling Track List
**Steps:**
1. Add 10+ tracks
2. Observe track list scrolling

**Expected Result:**
- ✅ Track list becomes scrollable
- ✅ Custom scrollbar appears
- ✅ Scrolling is smooth

### Test 9.3: Visual Feedback
**Steps:**
1. Hover over buttons
2. Click buttons
3. Record arm a track
4. Play transport

**Expected Result:**
- ✅ Buttons show hover states
- ✅ Active states are clear (record arm red, solo yellow, etc.)
- ✅ Waveform bars animate when playing

### Test 9.4: Empty States
**Steps:**
1. Fresh app load (no tracks)
2. Add track but don't record

**Expected Result:**
- ✅ "Welcome to DAWG AI" message shows
- ✅ Waveform shows "No recording selected"
- ✅ Helpful hints are displayed

---

## Test Suite 10: Error Handling

### Test 10.1: Microphone Permission Denied
**Steps:**
1. Add track
2. Click record arm
3. Click "Block" on microphone permission

**Expected Result:**
- ✅ Error message in console
- ✅ Record arm button may stay inactive
- ✅ App doesn't crash

### Test 10.2: No Microphone Available
**Steps:**
1. Disable all microphones in system settings
2. Try to record arm a track

**Expected Result:**
- ✅ Graceful error handling
- ✅ Error logged to console
- ✅ App remains functional

### Test 10.3: Recording While Disarmed
**Steps:**
1. Add track (don't record arm)
2. Click Play in transport

**Expected Result:**
- ✅ No recording happens
- ✅ No errors
- ✅ Transport plays normally

---

## Known Limitations (Not Bugs)

1. **No Persistence**: Recordings lost on refresh (planned feature)
2. **No File Upload**: Upload button is placeholder
3. **No AI Features**: AI integration coming in later stage
4. **No MIDI Support**: MIDI tracks not yet implemented
5. **No Effects/Plugins**: DSP features not yet implemented
6. **No Mixer View**: Advanced mixing UI not yet built
7. **No Automation**: Parameter automation not yet implemented
8. **Limited Export**: Only WAV export, no MP3/OGG yet

---

## Performance Tests

### Perf 1: Many Tracks
**Steps:**
1. Add 20 tracks
2. Observe performance

**Expected Result:**
- ✅ UI remains responsive
- ✅ No significant lag

### Perf 2: Long Recordings
**Steps:**
1. Record for 60+ seconds
2. Play back

**Expected Result:**
- ✅ Recording completes
- ✅ Playback is smooth
- ✅ Waveform renders

### Perf 3: Concurrent Playback
**Steps:**
1. Record on 5 tracks
2. Play all simultaneously

**Expected Result:**
- ✅ All tracks play in sync
- ✅ No audio dropouts
- ✅ CPU usage reasonable

---

## Browser Compatibility Tests

### Recommended Testing Browsers:
- ✅ **Chrome/Edge** (Chromium) - Primary target
- ✅ **Firefox** - Should work
- ✅ **Safari** - May have WebAudio API differences
- ❌ **IE11** - Not supported

---

## Success Criteria

After running all tests, the following should be true:

✅ Transport controls work smoothly
✅ Tracks can be added, renamed, controlled
✅ Recording captures audio correctly
✅ Playback works with volume/mute/solo
✅ Waveform displays recorded audio
✅ Device selection allows choosing inputs/outputs
✅ Export produces valid WAV files
✅ Microphone is released when record arm disabled
✅ No major console errors
✅ UI is responsive and intuitive

---

## Reporting Issues

If you find bugs while testing, note:
1. Test number (e.g., "Test 3.4")
2. Steps to reproduce
3. Expected vs actual result
4. Browser and OS
5. Console errors (if any)

---

**Testing Date**: ___________
**Tested By**: ___________
**Overall Status**: ⬜ Pass / ⬜ Fail / ⬜ Partial
