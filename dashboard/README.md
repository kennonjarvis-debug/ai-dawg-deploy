# DAWG AI - Development Dashboard 📊

**Live visual progress tracker for all Claude instances**

## Quick Start

### Open the Dashboard

```bash
# Option 1: Open in default browser
open dashboard/index.html

# Option 2: Serve with Python
cd dashboard
python3 -m http.server 8080
# Then open: http://localhost:8080
```

### Update Progress

When a Claude instance makes progress:

```bash
./dashboard/update-progress.sh [module-id] [status] [progress]
```

**Examples:**

```bash
# Instance D started MIDI editor
./dashboard/update-progress.sh midi-editor in-progress 10

# Instance D completed piano roll (50% of MIDI editor)
./dashboard/update-progress.sh midi-editor in-progress 50

# Instance D finished MIDI editor completely
./dashboard/update-progress.sh midi-editor complete 100

# Instance E started timeline
./dashboard/update-progress.sh timeline in-progress 15
```

## Dashboard Features

### 🎯 Overall Stats
- Completed modules count
- In-progress count
- Pending count
- Total lines of code added
- Total files added
- Estimated days remaining

### 📊 Progress Bars
- Overall project progress (weighted by estimated days)
- Per-module progress bars
- Visual status indicators

### 🎨 Color Coding
- **Green**: Complete ✅
- **Orange**: In Progress 🔥 (animated pulse)
- **Gray**: Pending/Ready to Start
- **Red**: Blocked 🚫

### 📋 Module Cards Show:
- Module name and instance assignment
- Status badge
- Progress percentage
- Stats (files, lines, components)
- Prompts to use (from CLAUDE_PROMPTS.md)
- Next steps (commands to run)
- Blockers (if any)

### 🔄 Auto-Refresh
- Dashboard auto-refreshes every 30 seconds
- Manual refresh button (bottom right)

## Module IDs

| Module ID | Name | Instance |
|-----------|------|----------|
| `design-system` | Design System | A |
| `audio-engine` | Audio Engine | B |
| `backend-api` | Backend API | C |
| `midi-editor` | MIDI Editor | D |
| `timeline` | Timeline & Multi-track | E |
| `recording-system` | Recording System | F |
| `effects-processor` | Effects Processor | G |
| `voice-interface` | AI Voice Interface | H |
| `ai-beat-generator` | AI Beat Generator | I |
| `ai-vocal-coach` | AI Vocal Coach | J |
| `ai-mixing` | AI Mixing & Mastering | K |
| `cloud-storage` | Cloud Storage | L |

## Workflow

### Instance Starting Work

```bash
# Instance D starting MIDI editor
cd ../dawg-worktrees/midi-editor
# Copy prompts from CLAUDE_PROMPTS.md
# Paste into Claude Code

# Update dashboard
./dashboard/update-progress.sh midi-editor in-progress 0
```

### Instance Making Progress

```bash
# Completed piano roll component (estimate 50% done)
./dashboard/update-progress.sh midi-editor in-progress 50
```

### Instance Completing Module

```bash
# MIDI editor finished!
./dashboard/update-progress.sh midi-editor complete 100

# Dashboard will automatically:
# - Set progress to 100%
# - Add completion date
# - Update overall project progress
# - Update stats (completed count, etc.)
```

### Instance Blocked

```bash
# If a module is blocked
./dashboard/update-progress.sh recording-system blocked 0
```

## Customization

### Add New Modules

Edit `dashboard/progress.json`:

```json
{
  "id": "new-module",
  "name": "New Module Name",
  "instance": "M",
  "status": "pending",
  "progress": 0,
  "filesAdded": 0,
  "linesAdded": 0,
  "components": 0,
  "estimatedDays": 5,
  "startDate": null,
  "completedDate": null,
  "prompts": ["Stage X.X - Prompt Name"],
  "blockers": [],
  "nextSteps": ["Command to run"]
}
```

### Update Stats Manually

If you need to update files/lines/components after completion:

```json
{
  "id": "midi-editor",
  "status": "complete",
  "progress": 100,
  "filesAdded": 15,        // ← Update this
  "linesAdded": 2500,      // ← Update this
  "components": 8,         // ← Update this
  "completedDate": "2025-10-15"
}
```

Then refresh the dashboard.

## Tips

### Keep Dashboard Open

Leave the dashboard open in a browser tab while working. It'll auto-refresh every 30 seconds so you always see the latest progress.

### Use from Any Directory

The update script works from project root:

```bash
# From anywhere in the project
./dashboard/update-progress.sh midi-editor in-progress 75
```

### Quick Check

```bash
# See current progress
cat dashboard/progress.json | grep -A 2 '"id": "midi-editor"'
```

## Troubleshooting

### Dashboard Not Loading

Make sure you're opening it correctly:

```bash
# Method 1: Direct file open
open dashboard/index.html

# Method 2: HTTP server (better for auto-refresh)
cd dashboard && python3 -m http.server 8080
```

### Update Script Not Working

```bash
# Make sure it's executable
chmod +x dashboard/update-progress.sh

# Check if Node.js is available
node --version
```

### Progress Not Updating

1. Refresh the dashboard manually (🔄 button)
2. Check browser console for errors (F12)
3. Verify `progress.json` has valid JSON

---

**Happy tracking!** 🚀

The dashboard gives you real-time visibility into all Claude instances working in parallel.
