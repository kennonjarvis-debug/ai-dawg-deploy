# Merge Your Work & Start Next Modules 🚀

## Step 1: Merge Completed Modules to Main

### If MIDI Editor is Done (Instance D)
```bash
cd /Users/benkennon/dawg-ai
git checkout master
git merge module/midi-editor

# Update dashboard
./dashboard/update-progress.sh midi-editor complete 100

# Check what was added
git log --oneline -5
```

### If Timeline is Done (Instance E)
```bash
cd /Users/benkennon/dawg-ai
git checkout master
git merge module/timeline

# Update dashboard
./dashboard/update-progress.sh timeline complete 100

# Check what was added
git log --oneline -5
```

---

## Step 2: Start Next Modules (Pick Your Battles)

### Option A: Recording System + Voice Interface (Recommended)

Both have complete prompts ready to go!

#### Terminal 1 - Recording System (Instance F)
```bash
cd /Users/benkennon/dawg-ai
git worktree add ../dawg-worktrees/recording module/recording
cd ../dawg-worktrees/recording

# Update dashboard
cd /Users/benkennon/dawg-ai
./dashboard/update-progress.sh recording-system in-progress 0

# Open Claude Code in recording worktree
# Copy these prompts from CLAUDE_PROMPTS.md:
```

**Prompts for Instance F (Recording):**
```
Stage 4: Recording System
├── 4.1 - Recording Manager
└── 4.2 - Recording UI & Feedback
```

---

#### Terminal 2 - Voice Interface (Instance H)
```bash
cd /Users/benkennon/dawg-ai
git worktree add ../dawg-worktrees/voice-interface module/voice-interface
cd ../dawg-worktrees/voice-interface

# Update dashboard
cd /Users/benkennon/dawg-ai
./dashboard/update-progress.sh voice-interface in-progress 0

# Open Claude Code in voice-interface worktree
# Copy these prompts from CLAUDE_PROMPTS.md:
```

**Prompts for Instance H (Voice Interface):**
```
Stage 6: AI Voice Interface
├── 6.1 - Voice Command System
└── 6.2 - Voice Interface UI
```

---

### Option B: Effects Processor (Need to Write Prompts)

If you want to do Effects Processor next, I need to write the prompts first. Let me know and I'll create them!

---

## Step 3: Update Dashboard

As each instance progresses:

```bash
# Started work
./dashboard/update-progress.sh recording-system in-progress 0
./dashboard/update-progress.sh voice-interface in-progress 0

# 50% done
./dashboard/update-progress.sh recording-system in-progress 50

# Finished
./dashboard/update-progress.sh recording-system complete 100
```

---

## What Each Module Does

### Recording System (Instance F) - 3-4 days
**What it builds:**
- RecordingManager class for multi-track recording
- Live waveform display during recording
- Take management (comp multiple takes)
- Recording UI with countdown and input meters
- Punch-in/punch-out recording

**Integration:**
- Connects to Audio Engine
- Syncs with Timeline
- Backend API for saving recordings

---

### Voice Interface (Instance H) - 4-5 days
**What it builds:**
- Deepgram speech-to-text integration
- Claude command interpretation (natural language DAW control)
- Voice command system
- Voice UI with visual feedback
- Text-to-speech responses (optional)

**Example commands:**
- "Play the song"
- "Create a new vocal track at -6 dB"
- "Mute track 2"
- "Set BPM to 120"

---

## Quick Commands Reference

```bash
# Merge completed work
cd /Users/benkennon/dawg-ai
git checkout master
git merge module/[module-name]

# Create new worktree
git worktree add ../dawg-worktrees/[name] module/[name]

# Update dashboard
./dashboard/update-progress.sh [module-id] [status] [progress]

# View dashboard
open dashboard/index.html

# List all worktrees
git worktree list
```

---

## Next Available Modules (After Recording + Voice)

1. **Effects Processor** - EQ, compression, reverb (prompts needed)
2. **AI Beat Generator** - Generate drum patterns (prompts needed)
3. **AI Vocal Coach** - Pitch detection, exercises (prompts needed)
4. **AI Mixing/Mastering** - Automated mixing (prompts needed)
5. **Cloud Storage** - S3 integration, project backup (prompts needed)

Let me know which ones you want next and I'll write the prompts!

---

## Current Progress

After merging MIDI + Timeline:
- ✅ 5/12 modules complete (42% overall)
- 🔥 Ready to start: Recording System + Voice Interface
- 📊 Dashboard will show updated progress

---

**TL;DR:**

1. Merge your completed work (git merge)
2. Update dashboard (./dashboard/update-progress.sh ... complete 100)
3. Start Recording System (Instance F) + Voice Interface (Instance H)
4. Both have full prompts in CLAUDE_PROMPTS.md
5. Can run in parallel - no conflicts

**Let's keep building! 🚀**
