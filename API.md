# DAWG AI - API Documentation

## Overview
Backend API documentation for DAWG AI's server endpoints.

**Base URL:** `http://localhost:3000/api` (development)

**Last Updated:** 2025-10-02

---

## Authentication ✅

**Stage 6.2 Complete!** All project endpoints now require authentication via NextAuth.js.

### Required Environment Variables

```bash
# Claude AI
ANTHROPIC_API_KEY=your_api_key_here

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dawg_ai"
```

### Authentication Methods

1. **Credentials (Email/Password)**
   - Register: `POST /api/auth/register`
   - Login: `POST /api/auth/signin` (NextAuth)

2. **OAuth (Optional)**
   - GitHub: Configure `GITHUB_ID` and `GITHUB_SECRET`
   - Google: Coming soon

### Session Management

Sessions use JWT strategy (stateless):
- **Expiration:** 30 days
- **Token:** Stored in HTTP-only cookie
- **Access:** Use `useSession()` hook (client) or `requireAuth()` (server)

### Protected Endpoints

All `/api/projects/*` endpoints require authentication:
- `POST /api/projects/save`
- `GET /api/projects/load`
- `GET /api/projects/list`
- `DELETE /api/projects/delete`

**Error Response (401):**
```json
{
  "error": "Unauthorized"
}
```

See `AUTHENTICATION_SETUP.md` for full integration guide.

---

## Endpoints

### POST /api/chat

Chat with the AI vocal coach/music producer.

#### Request Body

```typescript
{
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  stream?: boolean;                    // Default: true
  projectContext?: {
    trackCount?: number;
    currentTrack?: string;
    recordingDuration?: number;
  };
}
```

#### Example Request (Non-Streaming)

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Help me warm up my voice"}
    ],
    "stream": false
  }'
```

**Response:**
```json
{
  "message": "Here are some vocal warmup exercises...",
  "id": "msg_01ABC123"
}
```

#### Example Request (Streaming)

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Give me feedback on my pitch"}
    ],
    "stream": true,
    "projectContext": {
      "trackCount": 3,
      "currentTrack": "Vocals 1",
      "recordingDuration": 45
    }
  }'
```

**Response (Server-Sent Events):**
```
data: {"text":"Let"}
data: {"text":"'s"}
data: {"text":" analyze"}
...
data: [DONE]
```

#### Response Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 400  | Invalid request (bad message format) |
| 401  | Invalid or missing API key |
| 429  | Rate limit exceeded |
| 500  | Server error |

#### Error Response Format

```json
{
  "error": "Error message here"
}
```

---

## Frontend Integration

### React Hook Example (Non-Streaming)

```typescript
async function sendMessage(userMessage: string) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: userMessage }
      ],
      stream: false
    })
  });

  const data = await response.json();
  return data.message;
}
```

### React Hook Example (Streaming)

```typescript
async function streamMessage(userMessage: string, onChunk: (text: string) => void) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: userMessage }
      ],
      stream: true
    })
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          if (parsed.text) {
            onChunk(parsed.text);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }
}
```

---

## AI System Prompt

The AI vocal coach uses a comprehensive system prompt that includes:

**Core Persona:**
- Professional vocal coach specializing in country music
- Music producer with production expertise
- Adaptive teacher adjusting to user skill level

**Capabilities:**
- Vocal coaching (pitch, tone, breath control)
- Production guidance (mixing, effects, arrangement)
- Creative support (songwriting, melody creation)
- Real-time feedback and encouragement

**Communication Style:**
- Concise and actionable
- Uses music terminology with explanations
- Encouraging without patronizing
- Structured responses with bullet points

**Context Awareness:**
The AI receives project context including:
- Number of tracks
- Current track name
- Recording duration
- (Future: pitch data, waveform analysis, user vocal profile)

---

## Authentication Endpoints ✅

### POST /api/auth/register

Register a new user with email/password.

**Request Body:**
```typescript
{
  email: string;      // Valid email address
  password: string;   // Minimum 8 characters
  name?: string;      // Optional display name
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "name": "John Doe"
  }'
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "cld1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-10-02T20:00:00Z"
  },
  "message": "User created successfully"
}
```

**Error Responses:**
- `400` - Missing email or password
- `400` - Password too short (< 8 characters)
- `409` - User already exists
- `500` - Server error

---

### POST /api/auth/signin

Login with credentials (handled by NextAuth.js).

**Browser:** Visit `http://localhost:3000/api/auth/signin`

**Programmatic (Client Component):**
```typescript
import { signIn } from 'next-auth/react';

const result = await signIn('credentials', {
  email: 'user@example.com',
  password: 'password123',
  redirect: false,
});

if (result?.error) {
  console.error('Login failed:', result.error);
}
```

**Response:**
Sets session cookie and redirects to app.

---

### GET /api/auth/session

Get current user session.

**Example:**
```bash
curl http://localhost:3000/api/auth/session
```

**Response (Authenticated):**
```json
{
  "user": {
    "id": "cld1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "image": null
  },
  "expires": "2025-11-01T20:00:00Z"
}
```

**Response (Unauthenticated):**
```json
{}
```

---

### POST /api/auth/signout

Logout current user.

**Browser:** Visit `http://localhost:3000/api/auth/signout`

**Programmatic:**
```typescript
import { signOut } from 'next-auth/react';

await signOut({ redirect: false });
```

---

## Project Management Endpoints ✅

### POST /api/projects/save

Save or update a project with tracks and recordings.

**Request Body:**
```typescript
{
  userId: string;
  project: {
    id?: string;           // Omit for new project
    name: string;
    bpm?: number;
    genre?: string;
    key?: string;
    description?: string;
    settings?: object;
  };
  tracks: Array<{
    id?: string;           // Omit for new track
    name: string;
    position: number;
    volume: number;
    pan: number;
    isSolo: boolean;
    isMuted: boolean;
    recordings: Array<{
      id?: string;
      audioUrl: string;  // S3 URL
      duration: number;
      fileSize: number;
      format: string;
      sampleRate: number;
      waveformData?: object;
    }>;
  }>;
}
```

**Response:**
```json
{
  "success": true,
  "project": { /* Full project with IDs */ }
}
```

---

### GET /api/projects/load

Load a project with all data.

**Query Parameters:**
- `projectId` - Load specific project
- `userId` - Load most recent project for user

**Example:**
```bash
curl "http://localhost:3000/api/projects/load?projectId=abc123"
```

**Response:**
```json
{
  "success": true,
  "project": {
    "id": "abc123",
    "name": "My Song",
    "tracks": [ /* tracks with recordings */ ]
  }
}
```

---

### GET /api/projects/list

List all projects for a user.

**Query Parameters:**
- `userId` - Required
- `includeArchived` - Include archived (default: false)
- `limit` - Max results (default: 50)
- `offset` - Pagination offset (default: 0)

**Example:**
```bash
curl "http://localhost:3000/api/projects/list?userId=user123&limit=10"
```

**Response:**
```json
{
  "success": true,
  "projects": [
    {
      "id": "abc123",
      "name": "My Song",
      "trackCount": 3,
      "lastOpenedAt": "2025-10-02T19:00:00Z"
    }
  ],
  "total": 25,
  "limit": 10,
  "offset": 0
}
```

---

### DELETE /api/projects/delete

Archive or permanently delete a project.

**Request Body:**
```typescript
{
  projectId: string;
  userId: string;        // For verification
  hardDelete?: boolean;  // Default: false (archive)
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project archived"
}
```

---

## AI Function Calling ✅

### Overview
The chat endpoint supports **AI function calling** (tool use) to enable Claude to directly control DAW actions.

### Enabling Function Calling

Add `enableTools: true` to your request:

```typescript
{
  messages: [...],
  stream: true,
  enableTools: true,  // Enable DAW control
  projectContext: {
    tracks: [
      {
        id: "track-1",
        name: "Vocals 1",
        type: "audio",
        recordArm: true,
        solo: false,
        mute: false
      }
    ]
  }
}
```

### Available Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `start_recording` | Start recording on armed track | `trackId?: string` |
| `stop_recording` | Stop current recording | - |
| `start_playback` | Start playing all tracks | - |
| `stop_playback` | Stop playback | - |
| `set_bpm` | Set tempo (BPM) | `bpm: number` (20-300) |
| `adjust_volume` | Set track volume | `trackId?: string`, `volume: number` (0-100) |
| `adjust_pan` | Set track panning | `trackId?: string`, `pan: number` (-50 to 50) |
| `toggle_mute` | Mute/unmute track | `trackId?: string` |
| `toggle_solo` | Solo/unsolo track | `trackId?: string` |
| `arm_track` | Arm track for recording | `trackId?: string` |
| `create_track` | Create new audio track | `name?: string` |
| `rename_track` | Rename track | `trackId?: string`, `name: string` |
| `delete_track` | Delete track | `trackId?: string` |

**Note:** If `trackId` is not provided, the currently active track is used.

### Tool Response Format

#### Streaming Mode
When tools are used, you'll receive special SSE events:

```
data: {"type":"tool_use","id":"toolu_123","name":"set_bpm"}
data: {"type":"tool_input","partial_json":"{\"bpm\":"}
data: {"type":"tool_input","partial_json":"140}"}
data: {"text":"I've set the tempo to 140 BPM."}
data: [DONE]
```

#### Non-Streaming Mode
Response includes `toolUses` array:

```json
{
  "message": "I've set the tempo to 140 BPM.",
  "id": "msg_123",
  "toolUses": [
    {
      "id": "toolu_123",
      "name": "set_bpm",
      "input": { "bpm": 140 }
    }
  ]
}
```

### Client-Side Integration

**1. Handle tool use events (streaming):**

```typescript
for (const line of lines) {
  if (line.startsWith('data: ')) {
    const data = JSON.parse(line.slice(6));

    if (data.type === 'tool_use') {
      // Tool called: data.name, data.id
      const result = await executeAction(data.name, toolInput);
      console.log(result.message);
    } else if (data.text) {
      // Regular text response
      appendMessage(data.text);
    }
  }
}
```

**2. Execute actions locally:**

```typescript
import { executeAction } from '@/lib/ai/actions';

const result = await executeAction('set_bpm', { bpm: 140 });
// { success: true, message: "Tempo set to 140 BPM", data: { bpm: 140 } }
```

### Example Requests

**Set BPM:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Set the BPM to 140"}
    ],
    "enableTools": true
  }'
```

**Start recording:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Start recording on Vocals 1"}
    ],
    "enableTools": true,
    "projectContext": {
      "tracks": [
        {"id": "track-1", "name": "Vocals 1", "recordArm": true}
      ]
    }
  }'
```

**Multiple actions:**
```bash
# "Set BPM to 100, mute Harmony, and pan Vocals to the left"
# Claude will use multiple tools: set_bpm, toggle_mute, adjust_pan
```

### Testing

Run comprehensive function calling tests:

```bash
./test-function-calling.sh
```

**Note:** Requires `ANTHROPIC_API_KEY` in `.env.local`

---

## Audio Storage Endpoints ✅

### POST /api/audio/upload

Upload audio file to S3.

**Request (multipart/form-data):**
```typescript
{
  file: File;           // Audio file (webm, wav, mp3)
  projectId: string;    // Project ID
  recordingId: string;  // Recording ID
  contentType?: string; // MIME type (optional)
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/audio/upload \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -F "file=@recording.webm" \
  -F "projectId=proj123" \
  -F "recordingId=rec456"
```

**Response:**
```json
{
  "success": true,
  "url": "https://dawg-ai-recordings.s3.us-east-1.amazonaws.com/users/.../recording.webm",
  "key": "users/user123/projects/proj456/recordings/rec789.webm",
  "size": 524288,
  "contentType": "audio/webm"
}
```

**Limits:**
- Max file size: 100MB
- Allowed types: `audio/webm`, `audio/wav`, `audio/mpeg`, `audio/mp3`

**Error Responses:**
- `400` - Missing file or invalid parameters
- `413` - File too large
- `401` - Unauthorized
- `500` - S3 upload error

---

### GET /api/audio/url

Generate signed URL for audio download.

**Query Parameters:**
- `key` or `url` - S3 key or full URL (required)
- `expiresIn` - Expiration time in seconds (default: 3600)
- `recordingId` - Recording ID for ownership verification (optional)

**Example:**
```bash
curl "http://localhost:3000/api/audio/url?key=users/user123/projects/proj456/recordings/rec789.webm&expiresIn=7200"
```

**Response:**
```json
{
  "success": true,
  "url": "https://dawg-ai-recordings.s3.amazonaws.com/...?X-Amz-Algorithm=...",
  "expiresIn": 7200,
  "expiresAt": "2025-10-02T22:00:00Z"
}
```

**Use Case:**
Generate temporary download URLs for playback in the browser. URLs expire after specified time for security.

---

### DELETE /api/audio/delete

Delete audio file from S3.

**Request Body:**
```typescript
{
  key?: string;         // S3 key (path/filename)
  url?: string;         // Full S3 URL (alternative)
  recordingId?: string; // Recording ID (deletes from DB too)
}
```

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/audio/delete \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{"recordingId":"rec123"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Audio file deleted successfully"
}
```

**Note:** If `recordingId` is provided, the recording is also deleted from the database.

---

## Music Generation Endpoints ✅

### POST /api/generate/music

Generate AI instrumental music from text description or vocal melody.

**Modes:**
1. **Text-to-Music** - Generate from style description
2. **Melody-to-Music** - Generate arrangement following vocal melody

**Request Body (Text-to-Music):**
```typescript
{
  prompt?: string;           // Direct text prompt
  style?: {                  // Structured style description (recommended)
    genre: string;           // "country", "pop", "rock", "jazz"
    mood: string;            // "upbeat", "melancholic", "energetic"
    instruments?: string[];  // ["acoustic guitar", "piano", "drums"]
    tempo?: string;          // "fast", "moderate", "slow", "120 BPM"
    key?: string;            // "C major", "A minor", "G"
    arrangement?: string;    // "full band", "sparse", "orchestral"
    description?: string;    // Additional style notes
  };
  duration?: number;         // Duration in seconds (1-120, default: 30)
  model?: string;            // "small", "medium", "large" (default: "medium")
  temperature?: number;      // Creativity (0-1, default: 1)
}
```

**Request Body (Melody-to-Music):**
```typescript
{
  melodyInput: string;       // URL to audio file (vocal recording)
  style?: { ... };           // Same as above
  prompt?: string;           // Additional prompt text
  duration?: number;         // Duration in seconds (default: 30)
}
```

**Example 1: Text-to-Music**
```bash
curl -X POST http://localhost:3000/api/generate/music \
  -H "Content-Type: application/json" \
  -d '{
    "style": {
      "genre": "country",
      "mood": "upbeat",
      "instruments": ["acoustic guitar", "fiddle", "drums"],
      "tempo": "fast",
      "key": "G major"
    },
    "duration": 30,
    "model": "medium"
  }'
```

**Example 2: Melody-to-Music**
```bash
curl -X POST http://localhost:3000/api/generate/music \
  -H "Content-Type: application/json" \
  -d '{
    "melodyInput": "https://dawg-ai-recordings.s3.amazonaws.com/.../vocal.webm",
    "style": {
      "genre": "pop",
      "mood": "energetic",
      "instruments": ["piano", "strings", "synth", "drums"]
    },
    "duration": 30
  }'
```

**Response:**
```json
{
  "success": true,
  "audio_url": "https://replicate.delivery/pbxt/abc123.wav",
  "metadata": {
    "prompt": "upbeat country instrumental featuring acoustic guitar, fiddle, drums, in G major, fast tempo",
    "model": "medium",
    "duration": 30,
    "cost": 0.08,
    "melody_input": "https://..." // Only for melody-to-music
  }
}
```

**Response Codes:**
- `200` - Success (audio generated)
- `400` - Invalid request (bad duration, missing fields)
- `429` - Rate limit exceeded (Replicate API)
- `500` - Generation error or missing `REPLICATE_API_TOKEN`
- `503` - Model unavailable

**Generation Time:** 30-60 seconds (be patient!)
**Cost:** ~$0.08 per 30-second track (varies by model/duration)

**Models:**
| Model | Quality | Speed | Cost Multiplier |
|-------|---------|-------|----------------|
| `small` | Good | Fast | 0.8x |
| `medium` | Better | Moderate | 1.0x (recommended) |
| `large` | Best | Slow | 1.3x |
| `melody` | Better | Moderate | 1.1x (auto-selected for melody input) |

---

### GET /api/generate/music

Get cost estimate for music generation (no API key required).

**Query Parameters:**
- `model` - Model name (small/medium/large, default: medium)
- `duration` - Duration in seconds (default: 30)

**Example:**
```bash
curl "http://localhost:3000/api/generate/music?model=large&duration=60"
```

**Response:**
```json
{
  "cost": 0.208,
  "model": "large",
  "duration": 60,
  "currency": "USD"
}
```

---

## Future Endpoints (Planned)

### POST /api/vocal-analysis
Analyze vocal recording for pitch/timing (Stage 5 - pitch detection complete, endpoint pending)

### POST /api/generate/harmony
Generate harmony tracks from voice profile (Stage 8 - voice cloning)

---

## Rate Limiting

**Current:** No rate limiting (development only)

**Production (Future):**
- 60 requests per minute per user
- 1000 requests per day per user
- Streaming responses count as 1 request

---

## Voice Cloning Endpoints ✅

### POST /api/voice/clone

Create a voice profile from a vocal sample for harmony generation.

**Request Body:**
```typescript
{
  userId: string;
  name: string;              // Name for voice profile (e.g., "My Lead Voice")
  sampleAudioUrl: string;    // S3 URL to voice sample audio
  duration: number;          // Duration in seconds (6-30 required)
  format: string;            // Audio format (wav, mp3, webm, ogg, m4a)
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/voice/clone \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "name": "My Lead Voice",
    "sampleAudioUrl": "https://dawg-ai-recordings.s3.amazonaws.com/.../vocal.webm",
    "duration": 10,
    "format": "webm"
  }'
```

**Response:**
```json
{
  "success": true,
  "voiceProfile": {
    "id": "voice_1696800000_abc123",
    "userId": "user_123",
    "name": "My Lead Voice",
    "sampleAudioUrl": "https://...",
    "createdAt": "2025-10-02T12:00:00.000Z"
  }
}
```

**Requirements:**
- Sample duration: 6-30 seconds
- Single speaker (no overlapping voices)
- Clean audio (minimal background noise)
- Valid formats: WAV, MP3, WebM, OGG, M4A

**Response Codes:**
- `200` - Voice profile created
- `400` - Invalid sample (duration, format, missing fields)
- `401` - Invalid Replicate API token
- `500` - Voice profile creation failed

---

### POST /api/voice/harmony

Generate harmony vocals using a cloned voice profile.

**Request Body:**
```typescript
{
  leadVocalUrl: string;      // S3 URL to lead vocal recording
  voiceProfileId: string;    // ID of voice profile to use
  intervals: string[];       // Array of harmony intervals
  language?: string;         // Language code (default: "en")
}
```

**Available Intervals:**
- `third_above` - Major third up (e.g., C → E)
- `third_below` - Major third down (e.g., E → C)
- `fifth_above` - Perfect fifth up (e.g., C → G)
- `fifth_below` - Perfect fifth down (e.g., G → C)
- `octave_above` - Octave up (e.g., C4 → C5)
- `octave_below` - Octave down (e.g., C5 → C4)

**Example:**
```bash
curl -X POST http://localhost:3000/api/voice/harmony \
  -H "Content-Type: application/json" \
  -d '{
    "leadVocalUrl": "https://dawg-ai-recordings.s3.amazonaws.com/.../lead.webm",
    "voiceProfileId": "voice_1696800000_abc123",
    "intervals": ["third_above", "fifth_above"],
    "language": "en"
  }'
```

**Response:**
```json
{
  "success": true,
  "harmonies": [
    {
      "interval": "third_above",
      "audioUrl": "https://replicate.delivery/.../third_above.wav",
      "cost": 0.06
    },
    {
      "interval": "fifth_above",
      "audioUrl": "https://replicate.delivery/.../fifth_above.wav",
      "cost": 0.06
    }
  ],
  "totalCost": 0.12
}
```

**Response Codes:**
- `200` - Harmonies generated successfully
- `400` - Invalid request (intervals, missing fields)
- `401` - Invalid Replicate API token
- `429` - Rate limit exceeded
- `500` - Harmony generation failed

**Generation Time:** 1-2 minutes (depends on number of intervals)
**Cost:** ~$0.06 per 10-second harmony (~$0.006/second)

---

### GET /api/voice/harmony

Estimate cost for harmony generation.

**Query Parameters:**
- `duration` - Duration per harmony in seconds
- `intervals` - Comma-separated list of intervals

**Example:**
```bash
curl "http://localhost:3000/api/voice/harmony?duration=10&intervals=third_above,fifth_above"
```

**Response:**
```json
{
  "success": true,
  "estimatedCost": 0.12,
  "breakdown": {
    "third_above": 0.06,
    "fifth_above": 0.06
  },
  "durationPerHarmony": 10,
  "intervalCount": 2
}
```

---

### GET /api/voice/clone

Get all voice profiles for a user.

**Query Parameters:**
- `userId` - User ID to fetch profiles for

**Example:**
```bash
curl "http://localhost:3000/api/voice/clone?userId=user_123"
```

**Response:**
```json
{
  "success": true,
  "voiceProfiles": [
    {
      "id": "voice_1696800000_abc123",
      "userId": "user_123",
      "name": "My Lead Voice",
      "sampleAudioUrl": "https://...",
      "createdAt": "2025-10-02T12:00:00.000Z"
    }
  ]
}
```

**Note:** Currently returns empty array (database integration pending).

---

## Testing

### Health Check
```bash
curl http://localhost:3000/api/chat
# Should return: 405 Method Not Allowed (POST only)
```

### Valid Request Test
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"stream":false}'
```

### Invalid Format Test
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":"invalid"}'
# Should return: 400 Invalid messages format
```

---

## Development Notes

### Adding New Endpoints
1. Create route file: `/app/api/[endpoint]/route.ts`
2. Export `POST`, `GET`, etc. functions
3. Use TypeScript interfaces for request/response
4. Add comprehensive error handling
5. Document in this file

### Debugging
- Check server logs in terminal running `npm run dev`
- API errors logged with `console.error('Chat API error:', error)`
- Use `curl -v` for verbose HTTP debugging

### Environment Setup
Required `.env.local` variables:
```bash
ANTHROPIC_API_KEY=sk-ant-...        # Required for /api/chat
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Changelog

### 2025-10-02 - Stage 8 Voice Cloning & Harmony Generation (Instance 3)
- ✅ Replicate XTTS-v2 integration for voice cloning
- ✅ POST /api/voice/clone endpoint (voice profile creation)
- ✅ POST /api/voice/harmony endpoint (harmony generation)
- ✅ GET /api/voice/harmony endpoint (cost estimation)
- ✅ GET /api/voice/clone endpoint (fetch user profiles)
- ✅ `/lib/ai/voice-cloning.ts` - Voice cloning client
- ✅ Added `create_voice_profile` and `generate_harmony` AI tools
- ✅ 6 harmony intervals (third/fifth/octave above/below)
- ✅ Voice sample validation (6-30s duration, format checks)
- ✅ Test suite (`test-voice-cloning.sh`)
- ✅ Documentation (`VOICE_CLONING_SETUP.md`)

### 2025-10-02 - Stage 7 AI Music Generation (Instance 3)
- ✅ Replicate API integration (MusicGen)
- ✅ POST /api/generate/music endpoint (text-to-music & melody-to-music)
- ✅ GET /api/generate/music endpoint (cost estimation)
- ✅ `/lib/ai/music-generation.ts` - Music generation client
- ✅ `/lib/ai/melody-types.ts` - Melody analysis data structures
- ✅ Added `generate_backing_track` and `generate_from_melody` AI tools
- ✅ Melody conditioning support (vocal → instrumental arrangement)
- ✅ 4 model options (small/medium/large/melody)
- ✅ Cost estimation and tracking
- ✅ Test suite (`test-music-generation.sh`)
- ✅ Documentation (`MUSIC_GENERATION_SETUP.md`)

### 2025-10-02 - Stage 6.4 S3 Audio Storage (Instance 4)
- ✅ AWS S3 SDK v3 integration
- ✅ POST /api/audio/upload endpoint (multipart/form-data)
- ✅ GET /api/audio/url endpoint (signed URLs)
- ✅ DELETE /api/audio/delete endpoint
- ✅ `/lib/storage/s3-client.ts` - S3 utilities
- ✅ File validation (type, size limits)
- ✅ Ownership verification
- ✅ Cloudflare R2 compatible
- ✅ Documentation (`S3_STORAGE_SETUP.md`)
- ✅ Updated API.md with S3 endpoints

### 2025-10-02 - Stage 6.2 Authentication (Instance 4)
- ✅ NextAuth.js integration with multiple providers
- ✅ POST /api/auth/register endpoint
- ✅ Credentials provider (email/password with bcrypt)
- ✅ GitHub OAuth provider (optional)
- ✅ JWT session strategy (30-day expiration)
- ✅ `/lib/auth/*` utilities (requireAuth, getSession, SessionProvider)
- ✅ Protected all `/api/projects/*` endpoints
- ✅ Test suite (`test-auth.sh`)
- ✅ Documentation (`AUTHENTICATION_SETUP.md`)
- ✅ Updated `.env.example` with auth variables

### 2025-10-02 - Stage 4.4 AI Function Calling (Instance 3)
- ✅ AI tool use for DAW control (13 tools)
- ✅ `/lib/ai/tools.ts` - Tool definitions for Claude API
- ✅ `/lib/ai/actions.ts` - Client-side action handlers
- ✅ Updated `/api/chat` to support `enableTools` flag
- ✅ Streaming and non-streaming tool use support
- ✅ Enhanced project context with track details
- ✅ Test suite for function calling
- ✅ Documentation in API.md

### 2025-10-02 - Stage 6.1 & 6.3 Database & Persistence (Instance 4)
- ✅ Prisma ORM setup with PostgreSQL
- ✅ Database schema (Users, Projects, Tracks, Recordings)
- ✅ POST /api/projects/save endpoint
- ✅ GET /api/projects/load endpoint
- ✅ GET /api/projects/list endpoint
- ✅ DELETE /api/projects/delete endpoint
- ✅ Environment variables for database
- ✅ Database setup documentation

### 2025-10-02 - Stage 4 AI Chat Integration (Instance 3)
- ✅ POST /api/chat endpoint
- ✅ Streaming and non-streaming support
- ✅ Project context integration
- ✅ Comprehensive error handling
- ✅ Vocal coach system prompt
