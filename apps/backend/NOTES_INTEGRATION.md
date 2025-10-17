# Notes & Voice Memos Integration

**Complete integration for JARVIS and DAWG AI to access, analyze, edit, and complete songs from iOS Notes and Voice Memos.**

## Features Implemented

### ✅ Database Persistence
- **509 notes** synced from iOS Notes to PostgreSQL
- Full-text search and filtering
- AI analysis results stored permanently
- Suggested actions tracked with execution status

### ✅ Note Versioning & History
- Automatic version tracking for all note edits
- Original content preserved before any changes
- Ability to restore previous versions
- Track who made changes (AI, user, or system)

### ✅ AI Song Completion
- Claude Sonnet 4 analyzes incomplete songs
- Completes missing sections (verses, choruses, bridges)
- Maintains original style, voice, and theme
- Archives original before completion

### ✅ Full CRUD Operations
- Create, Read, Update, Delete notes
- Search by keyword
- Filter by source (ios_notes, voice_memo, manual)
- Voice memo transcription ready (OpenAI Whisper)

## API Endpoints

Base URL: `http://localhost:3001/api/notes`

### Core Endpoints

#### GET `/api/notes`
Get all notes with optional filtering.

**Query Parameters:**
- `source`: Filter by source type (ios_notes, voice_memo, manual)
- `search`: Search notes by title/content

**Example:**
```bash
# Get all notes
curl http://localhost:3001/api/notes

# Search for songs about "Cowboy"
curl 'http://localhost:3001/api/notes?search=Cowboy'

# Get only iOS Notes
curl 'http://localhost:3001/api/notes?source=ios_notes'
```

#### PATCH `/api/notes/:id`
Update a note's title or content.

**Body:**
```json
{
  "title": "New Title",
  "content": "Updated content...",
  "editReason": "Fixed typo"
}
```

**Example:**
```bash
curl -X PATCH http://localhost:3001/api/notes/cmgtk... \\
  -H "Content-Type: application/json" \\
  -d '{"content": "Updated lyrics..."}'
```

#### POST `/api/notes/:id/complete-song`
Complete an incomplete song using AI.

**Body (optional):**
```json
{
  "userPreferences": {
    "musicGenre": "country-pop",
    "writingStyle": "Morgan Wallen style"
  }
}
```

**Response:**
```json
{
  "success": true,
  "note": {
    "id": "...",
    "title": "Cowboy Heart",
    "content": "Verse 1:\\n...\\n\\nChorus:\\n...\\n\\nVerse 2:\\n...",
    "sourceType": "ios_notes",
    "createdAt": "2025-10-16T...",
    "updatedAt": "2025-10-16T...",
    "metadata": {
      "wordCount": 320
    }
  },
  "version": 2,
  "message": "Song completed successfully"
}
```

#### GET `/api/notes/:id/versions`
Get version history for a note.

**Response:**
```json
{
  "success": true,
  "versions": [
    {
      "id": "...",
      "noteId": "...",
      "version": 2,
      "title": "Cowboy Heart",
      "content": "...",
      "editReason": "AI song completion",
      "createdBy": "ai",
      "createdAt": "2025-10-16T..."
    },
    {
      "id": "...",
      "noteId": "...",
      "version": 1,
      "title": "Cowboy Heart",
      "content": "...",
      "editReason": "Original version",
      "createdBy": "system",
      "createdAt": "2025-10-16T..."
    }
  ],
  "count": 2
}
```

#### POST `/api/notes/:id/restore/:version`
Restore a specific version of a note.

**Example:**
```bash
# Restore version 1
curl -X POST http://localhost:3001/api/notes/cmgtk.../restore/1
```

### Analysis Endpoints

#### POST `/api/notes/:id/analyze`
Analyze a note with Claude AI.

**Body:**
```json
{
  "appContext": "dawg_ai",
  "userPreferences": {
    "musicGenre": "country",
    "writingStyle": "storytelling"
  }
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "id": "...",
    "noteId": "...",
    "contentType": "song_lyrics",
    "confidence": 0.95,
    "summary": "Complete country song about...",
    "extractedData": {
      "keywords": ["love", "truck", "country"],
      "songStructure": {
        "verses": ["Verse 1 text"],
        "chorus": ["Chorus text"],
        "bridge": "Bridge text"
      }
    },
    "suggestedActions": [
      {
        "type": "finalize_song",
        "priority": "high",
        "description": "Polish lyrics and add final touches",
        "appContext": "dawg_ai",
        "metadata": {}
      }
    ]
  }
}
```

#### POST `/api/notes/:id/execute-actions`
Analyze and execute suggested actions.

**Body:**
```json
{
  "appContext": "dawg_ai"
}
```

### Import Endpoints

#### POST `/api/notes/import/text`
Import a text note manually.

**Body:**
```json
{
  "title": "New Song Idea",
  "content": "Verse 1: ...",
  "sourceType": "manual"
}
```

#### POST `/api/notes/import/voice-memo`
Import and transcribe a voice memo.

**Multipart Form Data:**
- `audio`: Audio file (mp3, m4a, wav, mp4, mpeg, mpga, webm)
- `autoAnalyze`: "true" or "false" (default: true)
- `appContext`: "jarvis" or "dawg_ai" (default: dawg_ai)

**Example:**
```bash
curl -X POST http://localhost:3001/api/notes/import/voice-memo \\
  -F "audio=@/path/to/recording.m4a" \\
  -F "autoAnalyze=true" \\
  -F "appContext=dawg_ai"
```

## Integration with JARVIS & DAWG AI

### For Chat Interface

Both JARVIS and DAWG AI can call these endpoints to:

1. **Browse Notes**
   ```javascript
   // Get all song lyrics
   fetch('http://localhost:3001/api/notes?search=verse')
   ```

2. **Complete Incomplete Songs**
   ```javascript
   // User: "Complete the song 'Cowboy Heart'"
   // AI finds the note ID, then:
   fetch('http://localhost:3001/api/notes/cmgtk.../complete-song', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ userPreferences: { musicGenre: 'country' } })
   })
   ```

3. **Edit Songs**
   ```javascript
   // User: "Change the chorus in 'Ghost in This Town'"
   // AI updates the content:
   fetch('http://localhost:3001/api/notes/cmgtk...', {
     method: 'PATCH',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       content: newLyrics,
       editReason: 'User requested chorus change'
     })
   })
   ```

4. **View History**
   ```javascript
   // User: "Show me the original version of this song"
   fetch('http://localhost:3001/api/notes/cmgtk.../versions')
   ```

5. **Restore Previous Version**
   ```javascript
   // User: "I liked version 1 better, restore it"
   fetch('http://localhost:3001/api/notes/cmgtk.../restore/1', {
     method: 'POST'
   })
   ```

### Workflow Example

**User**: "Find my incomplete songs and complete them"

**DAWG AI**:
1. Searches for notes with `song_idea` content type
2. Identifies incomplete songs (missing verses, chorus, or bridge)
3. For each incomplete song:
   - Archives original version
   - Calls `/complete-song` endpoint
   - Shows user the completed song
   - Mentions original is saved in version history

**User**: "Complete 'Cowboy Heart'"

**DAWG AI**:
1. Searches: `GET /api/notes?search=Cowboy Heart`
2. Finds note ID: `cmgtkf...`
3. Completes: `POST /api/notes/cmgtkf.../complete-song`
4. Returns completed song with version info

**User**: "I don't like the new chorus, restore the original"

**DAWG AI**:
1. Gets versions: `GET /api/notes/cmgtkf.../versions`
2. Restores version 1: `POST /api/notes/cmgtkf.../restore/1`

## Database Schema

### Notes Table
```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT DEFAULT 'manual', -- ios_notes, voice_memo, manual
  original_file_path TEXT,
  word_count INTEGER,
  duration REAL,
  transcription_status TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Note Versions Table
```sql
CREATE TABLE note_versions (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  edit_reason TEXT,
  created_by TEXT DEFAULT 'ai', -- ai, user, system
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  UNIQUE (note_id, version)
);
```

### AI Analysis Table
```sql
CREATE TABLE ai_analyses (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL,
  content_type TEXT, -- song_lyrics, song_idea, reminder, etc.
  confidence REAL DEFAULT 0.0,
  summary TEXT,
  app_context TEXT, -- jarvis, dawg_ai
  extracted_data JSONB DEFAULT '{}',
  analyzed_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);
```

### Actions Table
```sql
CREATE TABLE actions (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL,
  type TEXT, -- finalize_song, create_track, archive, etc.
  description TEXT,
  priority TEXT DEFAULT 'medium',
  app_context TEXT,
  metadata JSONB DEFAULT '{}',
  executed BOOLEAN DEFAULT FALSE,
  executed_at TIMESTAMP,
  execution_result JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (analysis_id) REFERENCES ai_analyses(id) ON DELETE CASCADE
);
```

## Current Data

- **509 notes** synced from iOS Notes
- **0 voice memos** (none found in export, ready when synced)
- **10 AI analyses** (last 10 notes analyzed during sync)
- **Multiple actions** executed (archive, suggest_improvements)

### Song Examples in Database:
- "Cowboy Heart"
- "Ghost in This Town"
- "God Is My Rockstar"
- "Midnight Highway"
- "American Nights"
- "Never Alone"
- "Baptized In Fire And Rain"
- "Count It All Loss"
- And 500+ more...

## Testing

### Test Song Completion
```bash
# 1. Find a song
curl -s 'http://localhost:3001/api/notes?search=Cowboy' | jq '.notes[0].id'

# 2. Complete it
curl -X POST http://localhost:3001/api/notes/YOUR_NOTE_ID/complete-song \\
  -H "Content-Type: application/json" \\
  -d '{}'

# 3. Check versions
curl http://localhost:3001/api/notes/YOUR_NOTE_ID/versions | jq
```

### Test Note Editing
```bash
# Update a song
curl -X PATCH http://localhost:3001/api/notes/YOUR_NOTE_ID \\
  -H "Content-Type: application/json" \\
  -d '{"content": "New verse 1 lyrics...", "editReason": "Improved opening"}'
```

### Test Search
```bash
# Find all songs about God
curl -s 'http://localhost:3001/api/notes?search=God' | jq '.count'

# Find incomplete songs (usually have shorter content)
curl -s 'http://localhost:3001/api/notes' | jq '.notes[] | select(.metadata.wordCount < 50) | {title, wordCount: .metadata.wordCount}'
```

## Next Steps for Frontend Integration

### JARVIS (Personal Assistant)
1. Add "Notes" section to dashboard
2. Show reminders, tasks, and meeting notes
3. Allow editing and completion of tasks
4. Voice memo transcription for meeting notes

### DAWG AI (Music Production)
1. Add "Songs" library to UI
2. Show all song ideas and lyrics
3. "Complete Song" button for incomplete songs
4. Version history viewer
5. Integration with recording interface
6. Ability to create track from completed song

## Architecture

```
┌─────────────┐
│  iOS Notes  │
│ Voice Memos │
└──────┬──────┘
       │
       │ Extract Script
       │ (bash + sqlite3)
       ↓
┌─────────────┐
│   /tmp/     │
│notes-export │
└──────┬──────┘
       │
       │ Sync Script
       │ (TypeScript)
       ↓
┌─────────────────────────────────────────┐
│           Backend Services               │
│ ┌─────────┐  ┌──────────┐  ┌──────────┐│
│ │ Import  │→ │ Analysis │→ │ Action   ││
│ │ Service │  │ Service  │  │ Router   ││
│ └─────────┘  └──────────┘  └──────────┘│
│ ┌──────────────────────────────────────┐│
│ │      Completion Service               ││
│ │  - Complete Songs                     ││
│ │  - Version Management                 ││
│ │  - History Tracking                   ││
│ └──────────────────────────────────────┘│
└───────────────────┬─────────────────────┘
                    │
                    ↓
          ┌─────────────────┐
          │   PostgreSQL    │
          │                 │
          │ - notes         │
          │ - note_versions │
          │ - ai_analyses   │
          │ - actions       │
          │ - voice_memos   │
          └─────────────────┘
                    ↑
                    │
       ┌────────────┴────────────┐
       │                         │
┌──────┴──────┐          ┌──────┴──────┐
│   JARVIS    │          │  DAWG AI    │
│             │          │             │
│ - Tasks     │          │ - Songs     │
│ - Reminders │          │ - Lyrics    │
│ - Meetings  │          │ - Ideas     │
└─────────────┘          └─────────────┘
```

## Summary

**Everything is working and ready to use!**

✅ **509 notes** synced and stored in PostgreSQL
✅ **Full API** for CRUD operations
✅ **AI completion** for incomplete songs
✅ **Version history** with restore capability
✅ **Search & filter** by content and source
✅ **Analysis** for content type detection
✅ **Action execution** for suggested improvements

Both JARVIS and DAWG AI can now seamlessly:
- Access all notes and voice memos
- Search for specific content
- Complete incomplete songs
- Edit existing notes
- Track version history
- Restore previous versions
- Execute AI-suggested actions

The backend is fully operational at `http://localhost:3001` and ready for frontend integration!
