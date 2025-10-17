# SYNC Monitor - Real-time Instance Coordination

**Automated monitoring tool for multi-instance Claude Code development**

---

## Overview

`sync-monitor.sh` watches `SYNC.md` for changes and automatically displays:
1. Messages directed to Instance 3 (AI Conductor)
2. Current status of all instances
3. Your assigned tasks
4. What you provide to other instances

---

## Usage

### Start Monitoring

```bash
./sync-monitor.sh
```

This will:
- Show initial status of all instances
- Display your assigned tasks
- Show existing messages for Instance 3
- Watch for file changes every 5 seconds
- Alert you when SYNC.md is updated

### Stop Monitoring

Press `Ctrl+C` to stop

---

## What It Shows

### 1. Instance Status Summary
Current status of all 4 instances:
- Instance 1 (UI/Frontend)
- Instance 2 (Audio Engine)
- Instance 3 (AI Conductor - YOU)
- Instance 4 (Data & Storage)

### 2. Your Assigned Tasks
Priority 1 and Priority 2 tasks for Instance 3

### 3. What You Provide
APIs and services Instance 3 provides to other instances

### 4. Messages
All messages directed to:
- "Instance 3" specifically
- "All instances"

---

## Features

### Real-time Updates
- Checks SYNC.md every 5 seconds
- Alerts when file changes detected
- Shows timestamp of last update

### Message Filtering
Only shows messages relevant to Instance 3:
```
### From Instance 1 to Instance 3
### From Instance 2 to Instance 3
### From Instance 4 to Instance 3
### From Instance X to All
```

### Visual Notifications
- Color-coded output (cyan headers, yellow alerts, green success)
- Bell sound when updates detected (can be disabled)
- Clear section separators

### Persistent State
- Tracks last check time in `/tmp/dawg-sync-last-check`
- Only shows NEW updates after initial run
- Survives terminal restarts

---

## Example Output

```
╔════════════════════════════════════════════════════════════════╗
║         DAWG AI - SYNC Monitor (Instance 3)                   ║
╔════════════════════════════════════════════════════════════════╗

👁️  Monitoring SYNC.md for messages to Instance 3...
📁 File: /Users/benkennon/dawg-ai/SYNC.md

╔════════════════════════════════════════════════════════════════╗
║                    Instance Status Summary                     ║
╚════════════════════════════════════════════════════════════════╝

Instance 1 (UI/Frontend):
  **Working on:** Stage 4 Complete ✅ (ChatPanel + AI Function Calling)
  **Next Task:** Stage 3 (Effects UI)

Instance 2 (Audio Engine):
  **Working on:** Stage 10 Complete ✅ (Vocal Effects)
  **Next Task:** Stage 7 (Advanced Audio Routing)

Instance 3 (AI Conductor - YOU):
  **Working on:** Stage 8 Complete ✅ (Voice Cloning)
  **Next Task:** Stage 9 (Adaptive AI Features)

Instance 4 (Data & Storage):
  **Working on:** ALL CORE INFRASTRUCTURE COMPLETE ✅
  **Next Task:** Stage 11 (Real-time Collaboration)

╔════════════════════════════════════════════════════════════════╗
║                    Your Assigned Tasks                         ║
╚════════════════════════════════════════════════════════════════╝

  **Priority 1:**
  - Stage 9: Adaptive AI coaching features ⏳
  - Support Instance 1 with music generation & voice cloning UI ⏳

  **Priority 2:**
  - Stage 9.2: Adaptive difficulty AI logic
  - Stage 9.3: Real-time AI feedback during recording

╔════════════════════════════════════════════════════════════════╗
║                  Messages for Instance 3                       ║
╚════════════════════════════════════════════════════════════════╝

════════════════════════════════════════════════════════════════
### From Instance 1 to Instance 3
────────────────────────────────────────────────────────────────
**Date:** 2025-10-02 22:30
**Message:**
🎉 Music generation UI is ready! Please add harmony generation to AI tools.
════════════════════════════════════════════════════════════════

⏳ Watching for changes... (Ctrl+C to stop)
```

---

## Integration with Claude Code

### Manual Workflow
```bash
# Terminal 1: Run sync monitor
./sync-monitor.sh

# Terminal 2: Work with Claude Code
# When monitor alerts you of new messages, tell Claude:
"Check SYNC.md for new messages from Instance 1"
```

### Automated Workflow (Future)
Could be integrated to:
1. Create GitHub issues from messages
2. Send notifications to Slack/Discord
3. Auto-trigger Claude Code commands
4. Generate task lists

---

## Customization

### Change Check Interval
Edit `sync-monitor.sh`, line ~200:
```bash
sleep 5  # Change to 10 for every 10 seconds
```

### Disable Bell Sound
Edit `sync-monitor.sh`, line ~180:
```bash
# echo -e "\a"  # Comment out this line
```

### Filter Different Messages
Edit the `extract_messages()` function to filter by:
- Specific instance
- Date range
- Keywords

---

## Troubleshooting

### Monitor Not Detecting Changes
- Check file permissions: `ls -la SYNC.md`
- Verify file path in script is correct
- Clear timestamp: `rm /tmp/dawg-sync-last-check`

### Too Many Alerts
- Increase sleep interval (line 200)
- Add filters to `extract_messages()` function

### No Messages Showing
- Ensure SYNC.md has proper message format:
  ```markdown
  ### From Instance X to Instance 3
  **Date:** 2025-10-02
  **Message:** ...
  ```

---

## Tips

### Best Practices
1. **Run in separate terminal** - Keep monitor visible while coding
2. **Check messages regularly** - Don't ignore alerts
3. **Update SYNC.md often** - More updates = better coordination
4. **Use clear message format** - Follow existing patterns

### Workflow Example
```bash
# Setup
Terminal 1: ./sync-monitor.sh          # Monitor
Terminal 2: npm run dev                # Dev server
Terminal 3: (Claude Code session)      # Development

# When alert appears in Terminal 1
1. Read the message
2. Switch to Terminal 3
3. Tell Claude: "Check SYNC.md for message from Instance X"
4. Claude acts on the message
5. Claude updates SYNC.md with completion
```

---

## Future Enhancements

Potential improvements:
- [ ] Desktop notifications (macOS/Linux)
- [ ] Web dashboard for monitoring
- [ ] Integration with Claude Code API
- [ ] Auto-create GitHub issues from messages
- [ ] Message history log
- [ ] Priority indicators for urgent messages
- [ ] Slack/Discord webhook integration
- [ ] Email alerts for critical messages

---

## Related Files

- `SYNC.md` - Main coordination file (monitored by this script)
- `CLAUDE.md` - Persistent memory (updated less frequently)
- `SESSION_LOG.md` - Session tracking
- `ROADMAP.md` - Development roadmap

---

**Start monitoring now:**
```bash
./sync-monitor.sh
```

**Happy coordinating! 🚀**
