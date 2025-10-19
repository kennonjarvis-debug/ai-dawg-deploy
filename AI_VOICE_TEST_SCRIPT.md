# DAWG AI Voice Feature Test Script

## 🎯 Testing Overview

This comprehensive test script covers all AI voice features, DAW controls, and expected behaviors for the DAWG AI system.

---

## ✅ Pre-Test Setup Checklist

- [ ] Servers running:
  - `npm run dev:ui` (port 5173)
  - `npx tsx src/backend/realtime-voice-server.ts` (port 3100)
  - `npx tsx src/backend/ai-brain-server.ts` (port 8002)
- [ ] Microphone permissions granted
- [ ] Audio output device working
- [ ] Browser: Chrome/Edge (best WebSocket support)

---

## 🎙️ SECTION 1: Voice Connection & Audio Quality

### Test 1.1: Connect to Live Voice
**Steps:**
1. Click the microphone button in AI Chat widget
2. Wait for "🔴 LIVE voice active!" toast

**Expected:**
- ✅ Connection toast appears within 2 seconds
- ✅ Microphone icon turns red and pulsates
- ✅ No console errors
- ✅ "LIVE mode active..." appears in input field

**Pass/Fail:** ___

---

### Test 1.2: Speech Recognition (User → AI)
**Steps:**
1. With live voice active, say: "Hey AI, can you hear me?"
2. Watch for transcript in chat

**Expected:**
- ✅ User speech appears as text in chat (light blue bubble)
- ✅ Transcript is accurate (>90%)
- ✅ Response appears within 2-3 seconds
- ✅ "Speaking..." indicator shows when AI responds

**Pass/Fail:** ___

---

### Test 1.3: AI Voice Response Quality
**Steps:**
1. Say: "Tell me about music production"
2. Listen to AI voice response

**Expected:**
- ✅ Audio plays clearly without crackling/popping
- ✅ No audio dropouts or stuttering
- ✅ Volume is consistent
- ✅ AI transcript appears in chat (gray bubble)
- ✅ Latency <500ms from end of user speech

**Audio Quality Issues?** If crackling occurs:
- Check browser console for buffer warnings
- Try refreshing browser (clear audio queue)
- Verify no other audio apps are using microphone

**Pass/Fail:** ___

---

### Test 1.4: Disconnect Voice
**Steps:**
1. Click microphone button again (red pulsing button)

**Expected:**
- ✅ "Voice stopped" toast appears
- ✅ Microphone icon returns to gray
- ✅ Input field shows normal placeholder
- ✅ Can still send text messages

**Pass/Fail:** ___

---

## 🎨 SECTION 2: Voice Selection & Changing

### Test 2.1: Manual Voice Change (Dropdown)
**Steps:**
1. Click voice selector in header (shows current voice, e.g., "alloy")
2. Select "echo" from dropdown
3. Start live voice and say something

**Expected:**
- ✅ Dropdown shows all 8 voices: alloy, echo, shimmer, ash, ballad, coral, sage, verse
- ✅ "Voice changed to echo" toast appears
- ✅ AI responds in new voice (warmer, clearer tone than alloy)
- ✅ Voice selector shows "echo" as selected

**Pass/Fail:** ___

---

### Test 2.2: AI-Initiated Voice Change
**Steps:**
1. With live voice active, say: "Change your voice to shimmer"
2. Wait for AI response

**Expected:**
- ✅ AI says something like "Sure! I'm switching to shimmer voice now..."
- ✅ Voice selector UI updates to "shimmer"
- ✅ Next response is in shimmer voice (bright, energetic)
- ✅ Console shows: `🎙️ AI changing voice to: shimmer`

**Pass/Fail:** ___

---

### Test 2.3: Voice Demo Request
**Steps:**
1. Say: "Can I hear all your voices?"
2. Listen to AI response

**Expected:**
- ✅ AI explains available voices
- ✅ AI lists characteristics (e.g., "alloy is balanced, echo is warm...")
- ✅ May offer to demo them

**Pass/Fail:** ___

---

## 🎛️ SECTION 3: Transport & Recording Controls

### Test 3.1: Start/Stop Recording
**Voice Commands to Test:**
- "Start recording"
- "Stop recording"
- "Record now"
- "Stop the recording"

**Expected for each:**
- ✅ Recording indicator appears (red REC badge)
- ✅ Toast confirmation
- ✅ AI verbally confirms action
- ✅ Transport controls update

**Pass/Fail:** ___

---

### Test 3.2: Playback Controls
**Voice Commands to Test:**
- "Play" or "Start playback"
- "Stop" or "Stop playback"
- "Pause"

**Expected:**
- ✅ Play button becomes pause button
- ✅ Timeline playhead moves
- ✅ AI confirms action
- ✅ Audio plays if clips exist

**Pass/Fail:** ___

---

## 🎹 SECTION 4: Track & Mixer Controls

### Test 4.1: Create Tracks
**Voice Commands to Test:**
- "Create a new audio track called Vocals"
- "Make a stereo aux track named Reverb"
- "Add a mono track for bass"

**Expected:**
- ✅ New track appears in timeline/mixer
- ✅ Track has correct name
- ✅ Correct channel configuration (mono/stereo)
- ✅ Toast: "Created stereo audio track: Vocals" (or similar)

**Pass/Fail:** ___

---

### Test 4.2: Aux Tracks & Sends
**Voice Commands to Test:**
1. "Create an aux track called Delay"
2. "Send the vocals track to the delay aux"
3. "Set the send level to 50 percent"

**Expected:**
- ✅ Aux track created
- ✅ Send appears in vocals track's send slots
- ✅ Send level indicator shows ~50%
- ✅ Progress toast appears for long operations

**Pass/Fail:** ___

---

### Test 4.3: Volume & Pan
**Voice Commands to Test:**
- "Set vocals volume to 80 percent"
- "Pan the guitar hard left"
- "Center the drums"

**Expected:**
- ✅ Fader moves to correct position
- ✅ Pan knob updates
- ✅ AI confirms: "Volume set to 80%"

**Pass/Fail:** ___

---

### Test 4.4: Mute & Solo
**Voice Commands to Test:**
- "Mute the bass track"
- "Solo the vocals"
- "Unmute all tracks"

**Expected:**
- ✅ Mute button lights up (yellow)
- ✅ Solo button lights up (green)
- ✅ Audio output changes accordingly
- ✅ AI confirms action

**Pass/Fail:** ___

---

## 🎵 SECTION 5: AI Music Generation (Long-Running Operations)

### Test 5.1: Generate Music
**Voice Command:**
"Generate a trap beat with heavy 808s at 140 BPM"

**Expected:**
- ✅ AI confirms: "Generating trap beat..."
- ✅ **PROGRESS TOAST appears** (top-right): "🎵 Generating music: trap beat with heavy 808s..."
- ✅ Toast shows loading indicator
- ✅ Generation completes in 20-30 seconds
- ✅ New audio clip appears on timeline
- ✅ Success toast replaces loading toast

**Audio Crackling During Generation?**
- This is normal - generation is CPU intensive
- Audio should be clean once playback starts

**Pass/Fail:** ___

---

### Test 5.2: AI Smart Mix
**Voice Command:**
"Apply smart mix to this project"

**Expected:**
- ✅ **PROGRESS TOAST**: "🎚️ AI Smart Mix in progress..."
- ✅ Toast duration: ~15 seconds
- ✅ Track volumes/pans adjust automatically
- ✅ AI explains changes made

**Pass/Fail:** ___

---

### Test 5.3: AI Mastering
**Voice Command:**
"Master this track for streaming"

**Expected:**
- ✅ **PROGRESS TOAST**: "✨ AI Mastering in progress..."
- ✅ Toast duration: ~20 seconds
- ✅ Master channel processing updates
- ✅ Audio becomes louder/more polished

**Pass/Fail:** ___

---

## 🎚️ SECTION 6: Audio Processing

### Test 6.1: Autotune
**Voice Commands:**
- "Apply autotune to the vocals"
- "Add autotune"

**Expected:**
- ✅ AI confirms application
- ✅ Autotune plugin appears in track's plugin slot
- ✅ Toast confirmation

**Pass/Fail:** ___

---

### Test 6.2: Compression
**Voice Command:**
"Add compression to the drums"

**Expected:**
- ✅ Compressor plugin added
- ✅ AI may suggest settings
- ✅ Toast: "Compression applied"

**Pass/Fail:** ___

---

### Test 6.3: Quantize
**Voice Command:**
"Quantize the drums to the grid"

**Expected:**
- ✅ Clips snap to grid
- ✅ AI explains quantization
- ✅ Toast confirmation

**Pass/Fail:** ___

---

## ⚙️ SECTION 7: Project Settings

### Test 7.1: Tempo (BPM)
**Voice Commands:**
- "Set tempo to 120 BPM"
- "Change the BPM to 140"

**Expected:**
- ✅ Transport BPM display updates
- ✅ Grid spacing changes
- ✅ AI confirms: "Tempo set to 120 BPM"

**Pass/Fail:** ___

---

### Test 7.2: Musical Key
**Voice Commands:**
- "Set the key to C minor"
- "Change key to F sharp"

**Expected:**
- ✅ Key display updates
- ✅ AI confirms key change
- ✅ Console log shows key update

**Pass/Fail:** ___

---

## 🎤 SECTION 8: Lyrics & Vocals

### Test 8.1: Update Lyrics
**Voice Command (while recording):**
"Update lyrics: Yo, this is a test"

**Expected:**
- ✅ Lyrics widget updates with text
- ✅ AI confirms: "Lyrics updated"
- ✅ Text appears in lyrics panel

**Pass/Fail:** ___

---

### Test 8.2: Real-Time Effects (During Recording)
**Voice Commands (while recording):**
- "Add more brightness"
- "More compression"
- "Add reverb"
- "Warmer sound"

**Expected:**
- ✅ Toast shows effect adjustment: "✨ Brightness adjusted: moderate"
- ✅ AI confirms verbally
- ✅ Monitor mix changes in real-time

**Available Real-Time Effects:**
- Brightness (highs)
- Compression
- Warmth (low-mids)
- Autotune
- Reverb (plate/room/hall)
- Delay
- Presence (vocal clarity)
- Remove harshness

**Pass/Fail:** ___

---

## 💾 SECTION 9: Project Management

### Test 9.1: Save Project
**Voice Command:**
"Save the project"

**Expected:**
- ✅ AI confirms save
- ✅ Toast: "Project saved"
- ✅ Console shows save operation

**Pass/Fail:** ___

---

### Test 9.2: Export Audio
**Voice Command:**
"Export this track"

**Expected:**
- ✅ AI confirms export started
- ✅ Toast: "Project export started"
- ✅ Export progress indicator (if long operation)

**Pass/Fail:** ___

---

## 🔧 SECTION 10: Error Handling & Edge Cases

### Test 10.1: Connection Loss Recovery
**Steps:**
1. Start live voice
2. Disconnect internet
3. Reconnect internet
4. Try speaking again

**Expected:**
- ✅ Toast shows disconnection
- ✅ Auto-reconnect attempt
- ✅ User can manually restart voice

**Pass/Fail:** ___

---

### Test 10.2: Rapid Voice Changes
**Steps:**
1. Say: "Change voice to echo"
2. Immediately say: "Actually change to shimmer"
3. Then: "No wait, use ballad"

**Expected:**
- ✅ AI handles queue gracefully
- ✅ Ends up with ballad voice
- ✅ No crashes or errors

**Pass/Fail:** ___

---

### Test 10.3: Invalid Commands
**Voice Command:**
"Teleport the track to Mars"

**Expected:**
- ✅ AI responds naturally: "I can't do that, but I can..."
- ✅ No crashes
- ✅ Suggests valid alternatives

**Pass/Fail:** ___

---

## 📊 SECTION 11: Chat Widget UI/UX

### Test 11.1: Chat Scrolling
**Steps:**
1. Have a long conversation (20+ messages)
2. Verify chat doesn't expand widget

**Expected:**
- ✅ Chat container stays fixed height (max 500px)
- ✅ Scrollbar appears when needed
- ✅ Auto-scrolls to latest message
- ✅ Can manually scroll to read history

**Pass/Fail:** ___

---

### Test 11.2: Text Chat (Fallback)
**Steps:**
1. Without clicking mic, type: "Create a new track"
2. Press Enter

**Expected:**
- ✅ AI responds via text
- ✅ Function executes (track created)
- ✅ No voice playback
- ✅ Can switch to voice anytime

**Pass/Fail:** ___

---

## 🎯 SECTION 12: Complete AI Functions List

### All 30+ AI Functions to Test:

#### Transport
- [x] start_recording
- [x] stop_recording
- [x] play
- [x] stop

#### Track Management
- [x] create_track
- [x] createAudioTrack
- [x] createAuxTrack
- [x] getTracks

#### Mixer & Routing
- [x] createSend
- [x] removeSend
- [x] setSendLevel
- [x] setTrackOutput
- [x] setTrackVolume
- [x] setTrackPan
- [x] muteTrack
- [x] soloTrack

#### Project Settings
- [x] set_tempo
- [x] set_key

#### Audio Processing
- [x] apply_autotune
- [x] apply_compression
- [x] quantize_audio
- [x] smart_mix
- [x] master_audio

#### Generation
- [x] generate_music

#### Project
- [x] save_project
- [x] export_project

#### Lyrics
- [x] update_lyrics

#### Real-Time Effects (During Recording)
- [x] adjust_brightness
- [x] adjust_compression
- [x] adjust_warmth
- [x] add_autotune
- [x] add_reverb
- [x] remove_harshness
- [x] add_delay
- [x] adjust_presence
- [x] reset_effects

#### Voice Control
- [x] change_my_voice

---

## 🏆 Final Integration Test

### The Grand Test: Complete Workflow
**Steps:**
1. ✅ Connect live voice
2. ✅ Change voice to your favorite
3. ✅ "Create a stereo audio track called Lead Vocals"
4. ✅ "Set tempo to 120 BPM and key to C major"
5. ✅ "Start recording"
6. ✅ (While recording) "Add some reverb and compression"
7. ✅ "Stop recording"
8. ✅ "Generate a trap beat at 120 BPM"
9. ✅ "Create an aux track called Reverb Bus"
10. ✅ "Send the vocals to the reverb bus at 60 percent"
11. ✅ "Apply smart mix"
12. ✅ "Master this for streaming"
13. ✅ "Save the project"

**Expected:**
- ✅ All commands execute successfully
- ✅ Progress toasts appear for long operations
- ✅ No crashes or connection drops
- ✅ Final project is playable and sounds good
- ✅ All transcripts appear in chat

**Pass/Fail:** ___

---

## 🐛 Known Issues & Workarounds

### Issue: Audio Crackling/Popping
**Cause:** Network jitter or buffer underruns
**Fix:**
- Refresh browser
- Check network stability
- Close other tabs/apps using audio
- The system batches audio every 100ms to minimize this

### Issue: Voice Stops Responding
**Cause:** WebSocket disconnect
**Fix:**
- Check console for errors
- Click mic off, then on again
- Hard refresh (⌘+Shift+R)

### Issue: AI Mishears Commands
**Cause:** Whisper transcription error or background noise
**Fix:**
- Speak clearly and pause between commands
- Reduce background noise
- Can always use text chat as backup

---

## 📝 Test Results Summary

**Date:** ___________
**Tester:** ___________

**Total Tests:** 50+
**Passed:** ___
**Failed:** ___
**Skipped:** ___

**Pass Rate:** ___%

**Critical Issues Found:**
-
-
-

**Recommendations:**
-
-
-

---

## 🔗 Quick Reference

**Voice Options:** alloy, echo, shimmer, ash, ballad, coral, sage, verse

**Latency Target:** <500ms response time
**Audio Format:** PCM16 @ 24kHz
**Silence Detection:** 400ms (optimized for low latency)

**Console Commands for Debugging:**
```javascript
// Check WebSocket status
voiceSocketRef.current?.connected  // Should be true

// Check audio queue
audioQueueRef.current.length  // Should be 0-3 normally

// Check if live
isLiveRef.current  // Should match UI state
```

---

**End of Test Script**
