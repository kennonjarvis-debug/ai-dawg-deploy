# How to Test DAWG AI

This guide shows you exactly how I (Claude) can test your AI DAW and how you can test it too.

## 🎯 Testing Philosophy

**The goal:** Test DAWG AI like a real user would - creating tracks, recording vocals, using the AI coach, and producing music.

---

## 🚀 Quick Start

### 1. Ensure Server is Running
```bash
npm run dev
```
Visit: **http://localhost:3000**

### 2. Run Automated API Tests
```bash
./test-api.sh
```

This validates:
- ✅ Server health
- ✅ Chat API endpoint
- ✅ Streaming responses
- ✅ Tool calling integration
- ✅ Project context
- ✅ Error handling

---

## 🧪 Manual Testing Workflows

### Test #1: AI Function Calling - Set BPM

**What to test:** Can the AI control the DAW via chat commands?

**Steps:**
1. Open http://localhost:3000
2. Look at the ChatPanel on the right
3. Type: `Set the BPM to 140`
4. Press Enter

**Expected Result:**
```
[You]: Set the BPM to 140
[System]: 🤖 Executing: set_bpm...
[System]: ✅ Tempo set to 140 BPM
[AI]: I've set the tempo to 140 BPM for you!
```

**Verify:**
- Transport bar shows "140 BPM"
- System message has blue action badge
- No errors in browser console

---

### Test #2: AI Function Calling - Create Track

**Steps:**
1. Type: `Create a new track called Lead Vocals`

**Expected Result:**
```
[You]: Create a new track called Lead Vocals
[System]: 🤖 Executing: create_track...
[System]: ✅ Created new track "Lead Vocals"
[AI]: I've created a new track called "Lead Vocals" for you. Ready to record!
```

**Verify:**
- New track appears in left sidebar
- Track name is "Lead Vocals"
- Track has default controls (volume, pan, etc.)

---

### Test #3: Complex Multi-Step Command

**Steps:**
1. Type: `Create a track called Vocals, set its volume to 75, and arm it for recording`

**Expected Result:**
```
[You]: Create a track called Vocals, set its volume to 75, and arm it for recording
[System]: 🤖 Executing: create_track...
[System]: ✅ Created new track "Vocals"
[System]: 🤖 Executing: adjust_volume...
[System]: ✅ Volume set to 75 on track "Vocals"
[System]: 🤖 Executing: arm_track...
[System]: ✅ Track "Vocals" armed
[AI]: Done! I've created the "Vocals" track, set its volume to 75%, and armed it for recording.
```

**Verify:**
- Track "Vocals" exists
- Volume slider at 75
- Record arm button lit up

---

### Test #4: AI Vocal Coach - Warmup Request

**Steps:**
1. Type: `Help me warm up my voice`

**Expected Result:**
- AI provides vocal exercises
- Response includes breathing techniques or scales
- No tool calls (this is coaching, not DAW control)

---

### Test #5: AI Vocal Coach - BPM Guidance

**Steps:**
1. Type: `What BPM should I use for a country ballad?`

**Expected Result:**
- AI recommends 60-80 BPM range
- Explains why (ballads are slower, emotional)
- May offer to set the BPM automatically

---

### Test #6: Audio Upload Workflow

**Steps:**
1. Click "Upload" button in transport bar
2. Select an audio file (.wav, .mp3, or .m4a)
3. Click confirm/upload

**Expected Result:**
- Upload modal closes
- New track created with file name
- Waveform displays in center timeline
- Track appears in left sidebar

**Verify:**
- Waveform is visible and properly scaled
- Track name matches file name (without extension)
- Can click play and hear audio

---

### Test #7: Recording Workflow

**Steps:**
1. Create a track (or use existing)
2. Arm the track for recording (click record arm button OR ask AI)
3. Click record button in transport
4. Make some noise for 3-5 seconds
5. Click stop

**Expected Result:**
- Recording captured
- Waveform appears in timeline
- Can play back recording
- Recording saved to track

**Verify:**
- Waveform displays correctly
- Audio quality is good (no crackling)
- Playback syncs with other tracks

---

### Test #8: Multi-Track Playback

**Steps:**
1. Upload or record on Track 1
2. Upload or record on Track 2
3. Ensure both tracks are unmuted
4. Click play

**Expected Result:**
- Both tracks play simultaneously
- Tracks are synchronized
- Volume and pan controls work

**Verify:**
- No audio artifacts or crackling
- Tracks start and stop together
- Solo/mute buttons work correctly

---

## 🔧 Testing from Browser Console

Open DevTools (F12) and run these commands:

### Check Store State
```javascript
// Get current tracks
const tracks = window.__NEXT_DATA__ // This won't work, use React DevTools instead

// Better: Open React DevTools > Components > find TrackList > view props/hooks
```

### Simulate API Call
```javascript
// Test chat API directly
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Set BPM to 120' }],
    stream: false,
    enableTools: true,
    projectContext: {
      trackCount: 1,
      bpm: 120,
      tracks: [{ id: 'test', name: 'Test Track', type: 'audio', recordArm: false, solo: false, mute: false }]
    }
  })
})
.then(r => r.json())
.then(console.log)
```

### Check for Errors
```javascript
// Monitor console for errors
console.log('No errors!' || 'Check above for errors')
```

---

## 🤖 How Claude (Me) Can Test

Since I can't interact with the browser UI directly, here's what I can do:

### ✅ What I CAN Test

1. **API Endpoints**
   ```bash
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"messages": [{"role": "user", "content": "Hi"}]}'
   ```

2. **File Structure**
   - Read component code
   - Check for syntax errors
   - Verify imports are correct

3. **State Management**
   - Review Zustand store code
   - Check hook implementations

4. **Type Safety**
   - Run `npm run build` to catch TypeScript errors

5. **Automated Scripts**
   - Create and run test scripts like `test-api.sh`

### ❌ What I CANNOT Test

1. **Visual UI** - Can't see the rendered page
2. **User Interactions** - Can't click buttons or type in inputs
3. **Audio Playback** - Can't hear if audio plays correctly
4. **Browser-specific Issues** - Can't test different browsers
5. **Real-time Microphone Recording** - Can't access microphone

---

## 📸 How to Help Me Test

### Send Screenshots

When testing, take screenshots and send them to me. I can analyze:
- Layout and styling
- Error messages
- Console output
- Network requests

### Copy Console Output

If you see errors:
```
Right-click in console → Save as... → Send to me
```

### Describe What You See

Example:
> "I typed 'Set BPM to 140' and saw three messages appear:
> 1. My message on the right (blue)
> 2. A system message 'Executing: set_bpm...' in the center
> 3. A success message '✅ Tempo set to 140 BPM'
> But the BPM in the transport bar didn't change."

---

## 🎬 Complete Testing Scenario

### **Scenario: "Record a Country Ballad"**

This tests the full workflow from start to finish:

#### Step 1: Setup Project
1. Open http://localhost:3000
2. Chat: `Let's create a country ballad together`
3. Chat: `Set the BPM to 72`
4. Verify BPM changes to 72

#### Step 2: Create Tracks
1. Chat: `Create a track called Lead Vocals and arm it`
2. Verify track created and armed
3. Upload a backing track (optional)

#### Step 3: Get AI Coaching
1. Chat: `Help me warm up before recording`
2. Do the vocal exercises the AI suggests
3. Chat: `Ready to record. Any tips for a ballad?`

#### Step 4: Record
1. Click record button (or chat: `Start recording`)
2. Sing for 10-15 seconds
3. Stop recording
4. Verify waveform appears

#### Step 5: Get Feedback
1. Chat: `How did I sound? What can I improve?`
2. AI analyzes and provides feedback

#### Step 6: Mix
1. Chat: `Adjust my vocal volume to 80 and pan it slightly right`
2. Verify volume slider moves to 80
3. Verify pan adjusts

#### Step 7: Playback
1. Click play
2. Listen to the mix
3. Make adjustments based on AI suggestions

---

## ✅ Success Checklist

After testing, verify:

- [ ] ChatPanel opens and accepts input
- [ ] AI responds to messages
- [ ] Tool calls execute (system messages appear)
- [ ] DAW state changes (BPM, tracks, volume, etc.)
- [ ] Recording captures audio
- [ ] Waveforms display
- [ ] Playback works
- [ ] Multiple tracks sync
- [ ] No console errors
- [ ] No TypeScript errors (`npm run build`)

---

## 🐛 Common Issues & Fixes

### Issue: "AI not responding"
**Fix:** Check ANTHROPIC_API_KEY in .env.local

### Issue: "Tool calls not executing"
**Fix:** Check browser console for errors in executeAction()

### Issue: "Waveforms not displaying"
**Fix:** Check WaveformDisplay component, verify recordings have waveformData

### Issue: "Audio not playing"
**Fix:**
- Check browser audio permissions
- Verify track is unmuted
- Check volume levels

### Issue: "Recording not working"
**Fix:**
- Check microphone permissions
- Verify track is armed
- Check useRecording hook

---

## 📊 Test Results Template

```markdown
## Test Session: [Date]

### Environment
- Browser:
- OS:
- Node:
- npm:

### Tests Completed
- [ ] API health check
- [ ] AI chat responses
- [ ] Tool calling (Set BPM)
- [ ] Tool calling (Create track)
- [ ] Tool calling (Multi-step)
- [ ] Recording workflow
- [ ] Upload workflow
- [ ] Playback
- [ ] Multi-track sync

### Issues Found
1. [Description]
2. [Description]

### Screenshots
[Attach screenshots]

### Console Errors
[Copy/paste errors]
```

---

## 🎯 Next Steps

1. **Run `./test-api.sh`** - Automated API tests
2. **Follow manual tests above** - Test UI interactions
3. **Record test session results** - Document findings
4. **Report issues** - Create bug reports for problems
5. **Celebrate** - When everything works! 🎉
