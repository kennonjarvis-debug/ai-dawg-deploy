# 🔔 SYNC Monitor - Quick Start

**Real-time coordination for multi-instance development**

---

## 🚀 Quick Start (30 seconds)

### 1. Open a New Terminal

```bash
cd /Users/benkennon/dawg-ai
```

### 2. Run the Monitor

```bash
./sync-monitor.sh
```

### 3. Keep It Running

The monitor will:
- ✅ Show all instance statuses
- ✅ Display your assigned tasks
- ✅ Alert you to new messages
- ✅ Filter messages for your instance

---

## 📢 What You'll See

```
╔════════════════════════════════════════════════════════════════╗
║         DAWG AI - SYNC Monitor (Instance 3)                   ║
╔════════════════════════════════════════════════════════════════╗

Instance Status Summary:
  Instance 1 (UI): Working on Stage 4 ✅
  Instance 2 (Audio): ALL COMPLETE ✅
  Instance 3 (AI - YOU): Stage 8 Complete ✅
  Instance 4 (Data): ALL COMPLETE ✅

Your Assigned Tasks:
  - Stage 9: Adaptive AI features ⏳
  - Support Instance 1 with music/voice UI ⏳

Messages for Instance 3:
  ════════════════════════════════════════════════════════════
  From Instance 1 to Instance 3
  **Message:** Need help with music generation UI...
  ════════════════════════════════════════════════════════════

⏳ Watching for changes... (Ctrl+C to stop)
```

---

## 💬 How to Communicate

### When You Have Questions/Requests

**Edit SYNC.md** and add:

```markdown
### From Instance 3 to Instance 1
**Date:** 2025-10-02 23:45
**Message:**
I need to know where you want the music generation controls placed.
Should they be in a modal or sidebar?
```

**Their monitor will alert them!** They'll respond via SYNC.md.

---

## 🛠️ Controls

- **Stop monitoring:** Press `Ctrl+C`
- **Restart:** Just run `./sync-monitor.sh` again
- **Change check interval:** Edit line 200 in `sync-monitor.sh` (default: 5 seconds)
- **Disable bell sound:** Comment out line 180 in `sync-monitor.sh`

---

## 📚 Full Documentation

See `SYNC_MONITOR_GUIDE.md` for:
- Complete feature list
- Customization options
- Troubleshooting
- Advanced usage

---

## ⚡ Pro Tips

1. **Run in dedicated terminal** - Don't close it!
2. **Check messages immediately** - When you hear the bell
3. **Update SYNC.md often** - Keep others informed
4. **Use clear message format** - Follow the template

---

## 🔗 Related Files

- `SYNC.md` - Main coordination file (what the monitor watches)
- `SYNC_MONITOR_GUIDE.md` - Full documentation
- `sync-monitor.sh` - The script itself

---

**🎯 Start now: `./sync-monitor.sh`**

Then tell your Claude instance:
> "I started the sync monitor. Alert me when there are new messages."

**Happy coordinating! 🚀**
