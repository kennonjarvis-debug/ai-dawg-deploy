# DAWG AI - Quick Start Guide 🚀

## 1. View the Dashboard

```bash
open dashboard/index.html
```

The dashboard shows:
- ✅ 3 modules complete (Design System, Audio Engine, Backend API)
- 🔥 Real-time progress of all Claude instances
- 📊 Stats: lines of code, files, components
- 🎯 What to work on next

---

## 2. Start Your First Module

### Option A: MIDI Editor (Recommended - Instance D)

```bash
cd ../dawg-worktrees/midi-editor
# Open new Claude Code window here
```

**Copy these prompts from `CLAUDE_PROMPTS.md`:**
- 5.1 - Piano Roll Canvas
- 5.2 - MIDI Playback Integration

**Update dashboard:**
```bash
./dashboard/update-progress.sh midi-editor in-progress 0
```

---

### Option B: Timeline System (Instance E)

```bash
git worktree add ../dawg-worktrees/timeline module/timeline
cd ../dawg-worktrees/timeline
# Open new Claude Code window here
```

**Copy these prompts from `CLAUDE_PROMPTS.md`:**
- 3.1 - Timeline Canvas Foundation
- 3.2 - Timeline Track Interactions
- 3.3 - Waveform Rendering
- 3.4 - Timeline Recording Integration

**Update dashboard:**
```bash
./dashboard/update-progress.sh timeline in-progress 0
```

---

## 3. Update Progress

As your Claude instance makes progress:

```bash
# Started work
./dashboard/update-progress.sh midi-editor in-progress 0

# 25% done
./dashboard/update-progress.sh midi-editor in-progress 25

# 50% done
./dashboard/update-progress.sh midi-editor in-progress 50

# Finished!
./dashboard/update-progress.sh midi-editor complete 100
```

The dashboard auto-refreshes every 30 seconds.

---

## 4. Key Files Reference

| File | Purpose |
|------|---------|
| `CLAUDE_PROMPTS.md` | Copy-paste prompts for each module |
| `INSTANCE_ASSIGNMENTS.md` | Which instance builds what |
| `dashboard/index.html` | Live progress dashboard |
| `dashboard/update-progress.sh` | Update progress from CLI |
| `INTEGRATION_COMPLETE.md` | Phase 1 completion report |

---

## 5. Workflow Summary

```
┌─────────────────────────────────────────────┐
│ 1. Open Dashboard (always keep it open)    │
│    open dashboard/index.html                │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. Navigate to Module Worktree             │
│    cd ../dawg-worktrees/[module]            │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. Open Claude Code in that Directory      │
│    (New window, fresh instance)             │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 4. Copy Prompts from CLAUDE_PROMPTS.md     │
│    Paste into Claude Code Composer (Cmd+I)  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 5. Let Claude Build                         │
│    It will create all files, test, etc.     │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 6. Update Dashboard as You Progress         │
│    ./dashboard/update-progress.sh ...       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 7. When Complete, Merge to Main            │
│    git checkout master                      │
│    git merge module/[name]                  │
└─────────────────────────────────────────────┘
```

---

## 6. Parallel Development

You can run multiple Claude instances **at the same time**:

### ✅ Safe to Run in Parallel
- Instance D (MIDI) + Instance E (Timeline)
- Instance D (MIDI) + Instance H (Voice)
- Any two in different worktrees

### ❌ Don't Run in Parallel
- Two instances in same worktree
- Instance 0 (main) while others work

---

## 7. Need Help?

### Where to Find Info
- **Module specs**: Check `docs/MODULE_*.md`
- **Development prompts**: `CLAUDE_PROMPTS.md`
- **Instance assignments**: `INSTANCE_ASSIGNMENTS.md`
- **Phase 1 summary**: `INTEGRATION_COMPLETE.md`
- **Dashboard help**: `dashboard/README.md`

### Common Commands

```bash
# Open dashboard
open dashboard/index.html

# Update progress
./dashboard/update-progress.sh [module-id] [status] [progress]

# List all worktrees
git worktree list

# Create new worktree
git worktree add ../dawg-worktrees/[name] module/[name]

# Merge completed module
git checkout master
git merge module/[name]

# View what's been built
cat INTEGRATION_COMPLETE.md
```

---

## 8. Your Current Status

✅ **Phase 1 Complete** (27% overall)
- Design System: 20 components
- Audio Engine: 8 classes
- Backend API: 9 endpoints

🎯 **Next Up** (Choose one or both):
- Module 4: MIDI Editor (Instance D) - 4-5 days
- Module 3: Timeline System (Instance E) - 5-6 days

📊 **Progress**: Check `dashboard/index.html`

---

**Let's build! 🚀**
