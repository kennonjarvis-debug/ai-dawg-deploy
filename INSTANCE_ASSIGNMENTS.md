# DAWG AI - Claude Instance Assignments

**TL;DR**: Each worktree = One Claude instance. Copy the prompts for that module.

---

## Instance Mapping

### Instance 0 (Coordinator) - Main Repo
**Location**: `/Users/benkennon/dawg-ai` (you are here)
**Branch**: `master`
**Role**: Project coordination, integration, documentation
**Prompts**: None (you coordinate, don't code)

---

### Instance D (Timeline) - Module 4
**Location**: `cd ../dawg-worktrees/midi-editor`
**Branch**: `module/midi-editor`
**Prompts to Use**:
```
Stage 5: MIDI Editor
├── 5.1 - Piano Roll Canvas
└── 5.2 - MIDI Playback Integration
```

**What to build**:
- Piano roll MIDI editor
- Note creation/editing/deletion
- Quantization
- Integration with Audio Engine MIDITrack

**Duration**: 4-5 days

**Commands**:
```bash
cd ../dawg-worktrees/midi-editor
# Open new Claude Code instance here
# Copy prompts 5.1 and 5.2 from CLAUDE_PROMPTS.md
```

---

### Instance E (Timeline System) - Module 3
**Location**: `cd ../dawg-worktrees/design-system` (reuse or create new worktree)
**Branch**: Create `module/timeline`
**Prompts to Use**:
```
Stage 3: Timeline & Multi-track Recording Interface
├── 3.1 - Timeline Canvas Foundation
├── 3.2 - Timeline Track Interactions
├── 3.3 - Waveform Rendering
└── 3.4 - Timeline Recording Integration
```

**What to build**:
- Canvas-based timeline
- Track lanes
- Waveform display
- Recording integration

**Duration**: 5-6 days

**Commands**:
```bash
git worktree add ../dawg-worktrees/timeline module/timeline
cd ../dawg-worktrees/timeline
# Open new Claude Code instance here
# Copy prompts 3.1, 3.2, 3.3, 3.4 from CLAUDE_PROMPTS.md
```

---

### Instance F (Recording System) - Module 3 (Part 2)
**Location**: Same as Instance E or new worktree
**Branch**: `module/timeline` or `module/recording`
**Prompts to Use**:
```
Stage 4: Recording System
├── 4.1 - Recording Manager
└── 4.2 - Recording UI & Feedback
```

**What to build**:
- Recording manager class
- Multi-track recording
- Live waveform display
- Take management

**Duration**: 3-4 days

**Commands**:
```bash
# If separate from timeline:
git worktree add ../dawg-worktrees/recording module/recording
cd ../dawg-worktrees/recording
# Copy prompts 4.1 and 4.2 from CLAUDE_PROMPTS.md
```

---

### Instance G (Voice Interface) - Module 6
**Location**: Create new worktree
**Branch**: `module/voice-interface`
**Prompts to Use**:
```
Stage 6: AI Voice Interface
├── 6.1 - Voice Command System
└── 6.2 - Voice Interface UI
```

**What to build**:
- Deepgram speech-to-text
- Claude command interpretation
- Voice control UI
- Text-to-speech feedback

**Duration**: 4-5 days

**Commands**:
```bash
git worktree add ../dawg-worktrees/voice-interface module/voice-interface
cd ../dawg-worktrees/voice-interface
# Copy prompts 6.1 and 6.2 from CLAUDE_PROMPTS.md
```

---

### Instance H (Effects) - Module 5
**Location**: Create new worktree
**Branch**: `module/effects-processor`
**Prompts to Use**:
```
Stage 7: Effects Processor (not yet written)
```

**What to build**:
- EQ, compression, reverb, delay
- Effects chain management
- Real-time DSP

**Duration**: 5-6 days

**Status**: ⏳ Prompts not written yet (coming soon)

---

### Instance I-L (AI Features) - Modules 7-9
**Status**: ⏳ Not ready yet (Stages 8-10)

---

## Recommended Order

### Week 1-2 (NOW)
1. **Instance D**: MIDI Editor (prompts 5.1, 5.2)
2. **Instance E**: Timeline System (prompts 3.1, 3.2, 3.3, 3.4)

Run these in parallel - they don't conflict.

### Week 3-4
3. **Instance F**: Recording System (prompts 4.1, 4.2)
4. **Instance G**: Voice Interface (prompts 6.1, 6.2)

### Week 5+
5. Effects Processor
6. AI Features
7. Cloud Storage

---

## Workflow Per Instance

### Step 1: Navigate to Worktree
```bash
cd ../dawg-worktrees/[module-name]
```

### Step 2: Open Claude Code
```bash
# In that directory
code .
# Or open new Claude Code instance
```

### Step 3: Copy Prompts
1. Open `/Users/benkennon/dawg-ai/CLAUDE_PROMPTS.md`
2. Find your stage (e.g., "Stage 5: MIDI Editor")
3. Copy the entire prompt (including the triple backticks)
4. Paste into Claude Code Composer (Cmd+I) or Chat (Cmd+L)

### Step 4: Let Claude Build
- Claude will read the existing codebase via @Codebase
- It will implement the feature
- It will create all necessary files
- It will test the integration

### Step 5: Merge When Done
```bash
# When module is complete
git add .
git commit -m "feat(midi): Complete MIDI editor implementation"
git checkout master
git merge module/midi-editor
```

---

## Example Session

### Opening Instance D (MIDI Editor)

```bash
# Terminal 1 - Navigate to worktree
cd /Users/benkennon/dawg-worktrees/midi-editor

# Open Claude Code in this directory
# Copy this prompt from CLAUDE_PROMPTS.md:
```

**Paste into Claude Code Composer (Cmd+I):**

```
Create the piano roll MIDI editor component with full note editing capabilities.

@Codebase Reference MODULE_4_MIDI_EDITOR.md specification and AudioEngine MIDITrack

Requirements:
1. 88-key piano keyboard (left side, A0-C8)
2. Grid with beat subdivisions (1/4, 1/8, 1/16, 1/32)
...
[rest of prompt 5.1]
```

Claude builds the entire piano roll component automatically.

---

## Parallel Development

You can run **multiple Claude instances simultaneously** without conflicts:

### Safe to Run in Parallel ✅
- Instance D (MIDI) + Instance E (Timeline) ← Different worktrees
- Instance D (MIDI) + Instance G (Voice) ← Different worktrees
- Any two instances in different worktrees

### NOT Safe to Run in Parallel ❌
- Two instances in same worktree
- Instance 0 (main) while others are working
- Any two instances editing shared packages (rare, but check)

---

## Quick Reference

| Instance | Module | Worktree Path | Prompts | Duration |
|----------|--------|---------------|---------|----------|
| D | MIDI Editor | `dawg-worktrees/midi-editor` | 5.1, 5.2 | 4-5 days |
| E | Timeline | `dawg-worktrees/timeline` | 3.1-3.4 | 5-6 days |
| F | Recording | `dawg-worktrees/recording` | 4.1, 4.2 | 3-4 days |
| G | Voice Interface | `dawg-worktrees/voice-interface` | 6.1, 6.2 | 4-5 days |
| H | Effects | `dawg-worktrees/effects-processor` | TBD | 5-6 days |

---

## TLDR Commands

### Start MIDI Editor (Instance D)
```bash
cd ../dawg-worktrees/midi-editor
# Open Claude Code here
# Copy prompts 5.1 + 5.2 from CLAUDE_PROMPTS.md
```

### Start Timeline (Instance E)
```bash
git worktree add ../dawg-worktrees/timeline module/timeline
cd ../dawg-worktrees/timeline
# Open Claude Code here
# Copy prompts 3.1 + 3.2 + 3.3 + 3.4 from CLAUDE_PROMPTS.md
```

---

**Last Updated**: 2025-10-14
**Next Action**: Start Instance D (MIDI Editor) or Instance E (Timeline)
