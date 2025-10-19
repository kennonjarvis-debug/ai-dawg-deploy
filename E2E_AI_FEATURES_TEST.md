# End-to-End AI Features Test Plan

**Production URL**: https://dawg-ai.com
**Test Date**: $(date)

## Prerequisites
- [ ] Browser: Chrome/Firefox/Safari
- [ ] Logged into production site
- [ ] Project created and open
- [ ] Backend services running (check https://dawg-ai.com/health)

---

## Part 1: Advanced Features (Settings Panel)

### Access Advanced Features
1. [ ] Click "DAWG AI" menu in top-left
2. [ ] Click "Settings"
3. [ ] Click "Advanced Features" tab
4. [ ] Verify all 8 features are visible

### Feature 1: Live Vocal Analysis
- **Description**: Real-time pitch detection and vocal coaching during recording
- [ ] Toggle ON
- [ ] Save settings
- [ ] Close settings
- [ ] Start recording on a track
- [ ] Verify pitch display appears during recording
- [ ] Speak/sing into microphone
- [ ] Verify pitch detection shows notes (C, D, E, etc.)
- [ ] Verify sharp/flat indicators appear
- [ ] Stop recording

### Feature 2: Stem Separation
- **Description**: Separate vocals, drums, bass, and other instruments from mixed audio
- [ ] Toggle ON
- [ ] Save settings
- [ ] Upload a mixed audio file
- [ ] Right-click audio clip
- [ ] Verify "Separate Stems" option appears
- [ ] Click "Separate Stems"
- [ ] Verify API call to `/api/v1/audio/separate-stems`
- [ ] Verify success message or progress indicator

### Feature 3: Budget Alerts
- **Description**: Track API costs and get notified when approaching budget limits
- [ ] Toggle ON
- [ ] Save settings
- [ ] Navigate to billing section
- [ ] Verify budget display shows
- [ ] Verify cost tracking is visible
- [ ] Make an API call (generate music)
- [ ] Verify budget counter updates

### Feature 4: Freestyle Session Mode
- **Description**: Voice-controlled recording and DAW commands for hands-free workflow
- [ ] Toggle ON
- [ ] Save settings
- [ ] Click record button
- [ ] Verify voice command listening indicator
- [ ] Say "Start recording"
- [ ] Verify recording starts
- [ ] Say "Stop recording"
- [ ] Verify recording stops

### Feature 5: AI Memory
- **Description**: AI learns your preferences and style over time
- [ ] Toggle ON
- [ ] Save settings
- [ ] Open AI chat widget
- [ ] Tell AI a preference (e.g., "I prefer trap drums")
- [ ] Verify API call to `/api/v1/ai/memory`
- [ ] Close and reopen AI chat
- [ ] Verify AI remembers the preference

### Feature 6: Melody-to-Vocals
- **Description**: Convert hummed melodies into full vocal tracks with AI-generated lyrics
- [ ] Toggle ON
- [ ] Save settings
- [ ] Record a hummed melody
- [ ] Right-click the clip
- [ ] Verify "Melody to Vocals" option appears
- [ ] Click "Melody to Vocals"
- [ ] Enter lyrics prompt
- [ ] Verify API call to `/api/v1/ai/melody-to-vocals`
- [ ] Verify vocals are generated

### Feature 7: AI Mastering
- **Description**: Automatic professional mastering with LUFS analysis
- [ ] Toggle ON
- [ ] Save settings
- [ ] Select project tracks
- [ ] Click "Master" button
- [ ] Verify mastering options appear
- [ ] Select target LUFS (-14 for streaming)
- [ ] Verify API call to `/api/v1/ai/master`
- [ ] Verify mastering is applied

### Feature 8: Voice Commands
- **Description**: Control DAW with voice commands (experimental)
- [ ] Toggle ON
- [ ] Save settings
- [ ] Click microphone icon
- [ ] Say "Play"
- [ ] Verify playback starts
- [ ] Say "Stop"
- [ ] Verify playback stops
- [ ] Say "Add track"
- [ ] Verify new track is created

### Settings Persistence
- [ ] Toggle features ON/OFF
- [ ] Save settings
- [ ] Refresh page
- [ ] Reopen Settings > Advanced Features
- [ ] Verify settings persisted correctly

---

## Part 2: Regular AI Features

### AI Music Generation
- [ ] Click "DAWG AI" menu
- [ ] Click "AI Music Gen"
- [ ] Enter prompt: "upbeat pop instrumental with catchy melody"
- [ ] Select duration: 30 seconds
- [ ] Click "Generate"
- [ ] Verify progress bar appears
- [ ] Verify generation completes
- [ ] Verify audio file is created
- [ ] Verify clip is added to timeline
- [ ] Play generated audio

### AI Chat Widget
- [ ] Click AI chat icon (bottom-right or panel)
- [ ] Type: "Add a drum track"
- [ ] Verify AI responds
- [ ] Verify drum track is created
- [ ] Type: "Generate a beat"
- [ ] Verify beat generation starts
- [ ] Verify function calling works

### Realtime Voice Assistant
- [ ] Click microphone icon in AI panel
- [ ] Speak: "Generate a trap beat"
- [ ] Verify transcription appears
- [ ] Verify AI responds vocally
- [ ] Verify beat generation starts
- [ ] Speak: "Add reverb to track 1"
- [ ] Verify command is executed

### Voice Memo Recording
- [ ] Click "Voice Memo" button
- [ ] Speak into microphone
- [ ] Click stop
- [ ] Verify transcription appears
- [ ] Verify audio is saved
- [ ] Verify clip is added to timeline

### Lyrics Widget
- [ ] Open lyrics widget
- [ ] Type lyrics: "This is a test song"
- [ ] Click "Analyze Lyrics"
- [ ] Verify AI analyzes structure
- [ ] Verify color-coded sections (verse, chorus, etc.)
- [ ] Verify iteration count (3 max)
- [ ] Verify feedback appears

### Auto-Quantize
- [ ] Record a slightly off-tempo drum pattern
- [ ] Right-click the clip
- [ ] Click "Quantize"
- [ ] Verify quantization is applied
- [ ] Verify timing is corrected

### Auto-Tune
- [ ] Record vocals (slightly out of tune)
- [ ] Right-click the vocal clip
- [ ] Click "Auto-Tune"
- [ ] Verify pitch correction is applied
- [ ] Play back and verify tuning

---

## Part 3: Backend API Health Checks

### Generation API
```bash
curl -X POST https://dawg-ai-backend-production.up.railway.app/api/v1/ai/memory \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","type":"preference","content":"I love trap beats","importance":5}'
```
- [ ] Returns 200 OK
- [ ] Memory is created

### Stem Separation API
```bash
curl -X POST https://dawg-ai-backend-production.up.railway.app/api/v1/audio/separate-stems \
  -F "audio=@test.mp3" \
  -F "projectId=test-project"
```
- [ ] Returns 200 OK
- [ ] Stems are returned

### Melody-to-Vocals API
```bash
curl -X POST https://dawg-ai-backend-production.up.railway.app/api/v1/ai/melody-to-vocals \
  -F "audio=@melody.mp3" \
  -F "prompt=upbeat pop song" \
  -F "genre=pop"
```
- [ ] Returns 200 OK
- [ ] Vocals are generated

### AI Mastering API
```bash
curl -X POST https://dawg-ai-backend-production.up.railway.app/api/v1/ai/master \
  -H "Content-Type: application/json" \
  -d '{"projectId":"test","targetLoudness":-14,"genre":"pop"}'
```
- [ ] Returns 200 OK
- [ ] Mastering chain is returned

### Budget API
```bash
curl https://dawg-ai-backend-production.up.railway.app/api/v1/billing/usage/test-user/current
```
- [ ] Returns 200 OK
- [ ] Usage data is returned

---

## Part 4: Integration Tests

### Full Workflow: Create Song from Scratch
1. [ ] Create new project
2. [ ] Tell AI: "Create a pop song with vocals and drums"
3. [ ] Verify AI creates:
   - [ ] Drum track
   - [ ] Vocal track
   - [ ] Bass track
4. [ ] Record vocals on vocal track
5. [ ] Verify Live Vocal Analysis shows pitch
6. [ ] Apply AI Mastering
7. [ ] Export project
8. [ ] Verify final audio file

### Full Workflow: Remix Existing Song
1. [ ] Upload a full song (mixed)
2. [ ] Use Stem Separation
3. [ ] Verify stems are created:
   - [ ] Vocals
   - [ ] Drums
   - [ ] Bass
   - [ ] Other
4. [ ] Apply effects to each stem
5. [ ] Re-mix and master
6. [ ] Export

### Full Workflow: Hum-to-Song
1. [ ] Record hummed melody
2. [ ] Use Melody-to-Vocals
3. [ ] Verify lyrics are generated
4. [ ] Verify vocals are synthesized
5. [ ] Add backing track via AI Music Gen
6. [ ] Apply AI Mastering
7. [ ] Export final song

---

## Test Results

### Pass/Fail Summary
- Total Tests: __/__
- Passed: __
- Failed: __
- Blocked: __

### Critical Issues
1.
2.
3.

### Non-Critical Issues
1.
2.
3.

### Notes
-
-
-

---

## Sign-off
**Tester**: ________________
**Date**: ________________
**Status**: [ ] PASSED [ ] FAILED [ ] BLOCKED
