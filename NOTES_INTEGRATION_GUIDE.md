# iOS Notes & Voice Memos Integration Guide

## 🎯 Overview

DAWG AI and JARVIS now have intelligent integration with your iOS Notes and Voice Memos! The system automatically:
- Transcribes voice memos using OpenAI Whisper
- Analyzes content using Claude AI
- Takes context-aware actions based on the app

### What It Does

**For DAWG AI (Music Production):**
- Detects song lyrics and musical ideas
- Identifies song structure (verse, chorus, bridge)
- Suggests song improvements and finalization
- Creates recording tracks automatically
- Analyzes your writing style

**For JARVIS (Personal Assistant):**
- Identifies reminders and calendar events
- Extracts dates, times, and action items
- Detects meeting notes
- Creates tasks and schedules

---

## 🚀 Quick Start

### 1. Set Up Environment Variables

Add to your `.env` file:

```bash
# Required for transcription
OPENAI_API_KEY=your_openai_api_key_here

# Required for analysis (already set)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 2. Export Notes from iOS

#### Option A: iCloud Sync (Easiest)
1. Enable iCloud Drive on your Mac
2. Enable Notes in iCloud settings
3. Notes will auto-sync to: `~/Library/Mobile Documents/com~apple~Notes/Documents`

#### Option B: Manual Export
1. Open Notes app on Mac
2. Select notes you want to sync
3. File → Export as...
4. Choose format: Plain Text (.txt) or HTML
5. Save to a folder (e.g., `~/Documents/NotesToSync`)

#### Option C: Voice Memos
1. Voice memos sync automatically via iCloud to:
   `~/Library/Application Support/com.apple.VoiceMemos/Recordings`

### 3. Run the Sync Script

```bash
# For DAWG AI (music-focused analysis)
cd apps/backend
npx tsx src/scripts/sync-ios-notes.ts --app=dawg_ai

# For JARVIS (productivity-focused analysis)
npx tsx src/scripts/sync-ios-notes.ts --app=jarvis

# With custom path
npx tsx src/scripts/sync-ios-notes.ts --app=dawg_ai --path=~/Documents/NotesToSync
```

---

## 📡 API Endpoints

### Import a Text Note

```bash
POST /api/notes/import/text
Content-Type: application/json

{
  "title": "Song Idea: Summer Vibes",
  "content": "Verse 1: Walking down the beach...",
  "sourceType": "manual"
}
```

### Import a Voice Memo

```bash
POST /api/notes/import/voice-memo
Content-Type: multipart/form-data

audio: <file>
autoAnalyze: true
appContext: "dawg_ai"
```

### Get All Notes

```bash
GET /api/notes
Query params:
  - source: ios_notes | voice_memo | manual
  - search: keyword
```

### Analyze a Note

```bash
POST /api/notes/:id/analyze
Content-Type: application/json

{
  "appContext": "dawg_ai",
  "userPreferences": {
    "musicGenre": "Country",
    "writingStyle": "Narrative storytelling"
  }
}
```

### Execute Actions on a Note

```bash
POST /api/notes/:id/execute-actions
Content-Type: application/json

{
  "appContext": "dawg_ai"
}
```

---

## 🔄 Automatic Sync

### Set Up Periodic Sync (macOS Automator)

1. Open **Automator** on Mac
2. Create New → **Calendar Alarm**
3. Add action: **Run Shell Script**
4. Paste:

```bash
cd /Users/benkennon/dawg-ai/apps/backend
npx tsx src/scripts/sync-ios-notes.ts --app=dawg_ai >> /tmp/notes-sync.log 2>&1
```

5. Set schedule (e.g., every hour)

### Using launchd (Advanced)

Create `~/Library/LaunchAgents/com.dawgai.notes-sync.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.dawgai.notes-sync</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/npx</string>
        <string>tsx</string>
        <string>/Users/benkennon/dawg-ai/apps/backend/src/scripts/sync-ios-notes.ts</string>
        <string>--app=dawg_ai</string>
    </array>
    <key>StartInterval</key>
    <integer>3600</integer>
    <key>StandardOutPath</key>
    <string>/tmp/dawgai-sync.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/dawgai-sync-error.log</string>
</dict>
</plist>
```

Load it:
```bash
launchctl load ~/Library/LaunchAgents/com.dawgai.notes-sync.plist
```

---

## 🎨 Example Workflows

### Workflow 1: Voice Memo → Song Track

1. Record a voice memo on iPhone: "Song idea for country track"
2. Sync runs (or manually trigger)
3. System:
   - Transcribes audio
   - Detects it's song lyrics
   - Creates a track in DAWG AI
   - Suggests improvements

### Workflow 2: Written Lyrics → Finalized Song

1. Write lyrics in Notes app
2. Save with title: "New Song - Heartbreak Road"
3. Sync detects song structure
4. System:
   - Identifies verses, chorus, bridge
   - Analyzes writing style
   - Suggests finalization steps
   - Recommends BPM and key

### Workflow 3: Meeting Note → Calendar Event (JARVIS)

1. Write meeting note: "Meeting with producer next Tuesday 2pm"
2. System:
   - Extracts date/time
   - Creates calendar event
   - Sets reminder

---

## 🧪 Testing

### Test the Integration

```bash
# Create a test note
curl -X POST http://localhost:3001/api/notes/import/text \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Song: Summer Days",
    "content": "Verse 1: Walking down that dusty road\nChorus: Summer days, summer nights\nVerse 2: Thinking about the times we had",
    "sourceType": "manual"
  }'

# Get all notes
curl http://localhost:3001/api/notes

# Analyze the note (copy ID from previous response)
curl -X POST http://localhost:3001/api/notes/NOTE_ID/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "appContext": "dawg_ai"
  }'

# Execute actions
curl -X POST http://localhost:3001/api/notes/NOTE_ID/execute-actions \
  -H "Content-Type: application/json" \
  -d '{
    "appContext": "dawg_ai"
  }'
```

---

## 📊 Analysis Output Example

```json
{
  "contentType": "song_lyrics",
  "confidence": 0.95,
  "summary": "Country song about summer memories and nostalgia",
  "extractedData": {
    "keywords": ["summer", "road", "memories", "nostalgia"],
    "songStructure": {
      "verses": [
        "Walking down that dusty road",
        "Thinking about the times we had"
      ],
      "chorus": ["Summer days, summer nights"]
    }
  },
  "suggestedActions": [
    {
      "type": "finalize_song",
      "priority": "high",
      "description": "Complete song structure and add bridge",
      "appContext": "dawg_ai"
    },
    {
      "type": "create_track",
      "priority": "medium",
      "description": "Set up recording track for 'Summer Days'",
      "appContext": "dawg_ai",
      "metadata": {
        "bpm": 95,
        "key": "G"
      }
    }
  ]
}
```

---

## 🎯 Supported File Formats

**Audio (Voice Memos):**
- `.mp3`, `.m4a`, `.wav`, `.mp4`, `.mpeg`, `.mpga`, `.webm`
- Max size: 25MB (Whisper API limit)

**Text (Notes):**
- `.txt`, `.md`, `.html`

---

## 🔧 Troubleshooting

### Voice Memo Transcription Fails
- Check file size (must be < 25MB)
- Verify OPENAI_API_KEY is set
- Ensure supported audio format

### Notes Not Syncing
- Verify iCloud is enabled
- Check file permissions
- Try manual export first

### Analysis Seems Incorrect
- Provide more context in note title
- Add metadata/tags
- Specify genre/style in user preferences

---

## 🚦 Next Steps

1. **Set up API keys** (OpenAI + Anthropic)
2. **Export some test notes** from iOS
3. **Run the sync script** manually
4. **Review the analysis results**
5. **Set up automatic sync** with Automator/launchd

Happy creating! 🎵✨
