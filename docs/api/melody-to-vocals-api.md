# Melody-to-Vocals API Documentation

Complete API reference for the Melody-to-Vocals feature in AI DAW.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
- [Request Formats](#request-formats)
- [Response Formats](#response-formats)
- [Error Handling](#error-handling)
- [Rate Limits](#rate-limits)
- [Code Examples](#code-examples)
- [Webhooks](#webhooks)

## Overview

### Base URL

```
http://localhost:8003
```

For production deployments, use your configured domain:
```
https://your-domain.com/expert-music-ai
```

### API Version

Current version: `v1.0.0`

### Content Type

All requests use `multipart/form-data` for file uploads.

### Service Status

Check if the service is running:

```bash
curl http://localhost:8003/
```

Response:
```json
{
  "service": "Expert Music AI",
  "version": "1.0.0",
  "status": "running",
  "endpoints": [
    "/melody-to-vocals",
    "/models",
    "/health"
  ]
}
```

## Authentication

### API Keys Required

The Melody-to-Vocals service requires API keys for external services:

1. **AI Provider** (for lyrics):
   - Anthropic: `ANTHROPIC_API_KEY`
   - OpenAI: `OPENAI_API_KEY`

2. **Vocal Synthesis**:
   - Replicate: `REPLICATE_API_TOKEN`

### Setting API Keys

#### Environment Variables

Create a `.env` file in the project root:

```bash
# Required for lyric generation (choose one or both)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Required for vocal synthesis
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxx
```

#### Server Configuration

Keys are loaded when the server starts. Restart after changing `.env`:

```bash
python src/backend/expert-music-ai/server.py
```

## Endpoints

### POST /melody-to-vocals

Convert a hummed melody to vocals with AI-generated lyrics.

#### Request

**URL**: `http://localhost:8003/melody-to-vocals`

**Method**: `POST`

**Content-Type**: `multipart/form-data`

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `audio_file` | File | Yes | - | Audio file (WAV, MP3) with hummed melody |
| `prompt` | String | Yes | - | Creative prompt describing the song theme |
| `genre` | String | No | "pop" | Musical genre (pop, rock, hip-hop, etc.) |
| `theme` | String | No | null | Specific subject matter or topic |
| `mood` | String | No | null | Emotional atmosphere (happy, sad, etc.) |
| `style` | String | No | null | Reference artist style |
| `ai_provider` | String | No | "anthropic" | AI for lyrics: "anthropic" or "openai" |
| `vocal_model` | String | No | "bark" | Synthesis model: "bark" or "musicgen" |

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "audio_url": "https://replicate.delivery/pbxt/...",
  "lyrics": "Under the stars, we danced so free\nSummer nights, just you and me...",
  "melody_info": {
    "num_notes": 24,
    "duration": 8.5,
    "key": "C",
    "range": "C4 to G4",
    "notes": ["C4", "D4", "E4", "F4", "G4", "F4", "E4", "D4"]
  },
  "lyrics_info": {
    "num_lines": 8,
    "syllables": 42,
    "genre": "pop",
    "theme": "romance",
    "mood": "nostalgic"
  },
  "processing_steps": [
    "Extracted 24 notes from melody",
    "Generated 8 lines of lyrics",
    "Synthesized vocals using bark"
  ]
}
```

**Error (4xx/5xx)**:

```json
{
  "detail": "Could not extract clear melody from audio",
  "error_code": "MELODY_EXTRACTION_FAILED",
  "suggestions": [
    "Record in a quieter environment",
    "Ensure melody is clearly audible",
    "Try a different audio format"
  ]
}
```

#### Example Request

**cURL**:

```bash
curl -X POST http://localhost:8003/melody-to-vocals \
  -H "Accept: application/json" \
  -F "audio_file=@melody.wav" \
  -F "prompt=A love song about summer nights" \
  -F "genre=pop" \
  -F "mood=nostalgic" \
  -F "theme=romance" \
  -F "ai_provider=anthropic" \
  -F "vocal_model=bark"
```

**JavaScript/TypeScript**:

```typescript
const formData = new FormData();
formData.append('audio_file', audioFile);
formData.append('prompt', 'A love song about summer nights');
formData.append('genre', 'pop');
formData.append('mood', 'nostalgic');

const response = await fetch('http://localhost:8003/melody-to-vocals', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

**Python**:

```python
import requests

url = "http://localhost:8003/melody-to-vocals"

with open('melody.wav', 'rb') as f:
    files = {'audio_file': f}
    data = {
        'prompt': 'A love song about summer nights',
        'genre': 'pop',
        'mood': 'nostalgic',
        'theme': 'romance',
        'ai_provider': 'anthropic',
        'vocal_model': 'bark'
    }

    response = requests.post(url, files=files, data=data)
    result = response.json()
```

### GET /models

List available AI models and their status.

#### Request

**URL**: `http://localhost:8003/models`

**Method**: `GET`

**Parameters**: None

#### Response

```json
{
  "ai_providers": [
    {
      "name": "anthropic",
      "model": "claude-3-5-sonnet-20241022",
      "available": true,
      "description": "Claude AI for lyric generation"
    },
    {
      "name": "openai",
      "model": "gpt-4",
      "available": true,
      "description": "GPT-4 for lyric generation"
    }
  ],
  "vocal_models": [
    {
      "name": "bark",
      "provider": "replicate",
      "model_id": "pollinations/bark",
      "available": true,
      "description": "Text-to-speech vocal synthesis",
      "avg_processing_time": 25
    },
    {
      "name": "musicgen",
      "provider": "replicate",
      "model_id": "meta/musicgen:melody",
      "available": true,
      "description": "Music generation with melody conditioning",
      "avg_processing_time": 50
    }
  ],
  "pitch_extraction": {
    "model": "CREPE",
    "version": "0.0.24",
    "available": true,
    "description": "Local pitch extraction neural network"
  }
}
```

### GET /health

Health check endpoint for monitoring.

#### Request

**URL**: `http://localhost:8003/health`

**Method**: `GET`

#### Response

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "dependencies": {
    "anthropic": "connected",
    "openai": "connected",
    "replicate": "connected",
    "crepe": "loaded"
  },
  "uptime": 3600,
  "total_requests": 42
}
```

## Request Formats

### Audio File Requirements

**Supported Formats**:
- WAV (recommended)
- MP3
- FLAC
- M4A

**Specifications**:
- **Sample rate**: 16kHz or higher (44.1kHz recommended)
- **Channels**: Mono (1 channel) or Stereo (auto-converted)
- **Bit depth**: 16-bit or 24-bit
- **Duration**: 5-30 seconds (optimal: 10-15 seconds)
- **File size**: Max 10MB

**Audio Quality Tips**:
- Record in quiet environment
- Use consistent volume
- Avoid clipping/distortion
- Minimize background noise

### Parameter Validation

**prompt**:
- Min length: 5 characters
- Max length: 500 characters
- Must not be empty or whitespace only

**genre**:
- Must be one of: pop, rock, hip-hop, r&b, country, folk, indie, electronic, jazz, blues, soul, latin, reggae
- Case-insensitive

**mood**:
- Free-form text
- Recommended: happy, sad, nostalgic, angry, calm, energetic, romantic, dark, hopeful, playful

**theme**:
- Free-form text
- Examples: love, freedom, struggle, celebration, nature, memory

**ai_provider**:
- Must be: "anthropic" or "openai"
- Corresponding API key must be configured

**vocal_model**:
- Must be: "bark" or "musicgen"

## Response Formats

### Success Response Schema

```typescript
interface MelodyToVocalsResponse {
  success: boolean;                    // Always true for successful requests
  audio_url: string;                   // URL to download generated vocals
  lyrics: string;                      // Generated lyrics (plain text)
  melody_info: MelodyInfo;            // Extracted melody data
  lyrics_info: LyricsInfo;            // Lyrics metadata
  processing_steps: string[];          // Steps taken during processing
}

interface MelodyInfo {
  num_notes: number;                   // Count of distinct notes
  duration: number;                    // Length in seconds
  key: string;                         // Detected musical key (e.g., "C", "G")
  range: string;                       // Note range (e.g., "C4 to G4")
  notes: string[];                     // Array of note names
}

interface LyricsInfo {
  num_lines: number;                   // Number of lyric lines
  syllables: number;                   // Total syllable count
  genre: string;                       // Genre used for generation
  theme?: string;                      // Theme if provided
  mood?: string;                       // Mood if provided
}
```

### Audio URL Format

The `audio_url` field contains a temporary URL to download the generated vocals:

```
https://replicate.delivery/pbxt/[unique-id]/output.mp3
```

**Important**:
- URLs expire after 24 hours
- Download immediately or re-upload to your storage
- File format is typically MP3
- Audio length matches your original melody

### Lyrics Format

Lyrics are returned as plain text with line breaks:

```
Under the stars, we danced so free
Summer nights, just you and me
Moonlight glow on your face so bright
Lost in love on a summer night
```

**Characteristics**:
- Line breaks indicated by `\n`
- No additional formatting (no markdown, HTML)
- Typically 4-12 lines depending on melody length
- Syllable count matched to melody phrasing

## Error Handling

### Error Response Schema

```typescript
interface ErrorResponse {
  detail: string;                      // Human-readable error message
  error_code: string;                  // Machine-readable error code
  suggestions?: string[];              // Recommended solutions
  debug_info?: object;                 // Additional debug data (dev mode)
}
```

### HTTP Status Codes

| Code | Name | Description |
|------|------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid parameters or file format |
| 401 | Unauthorized | Missing or invalid API keys |
| 413 | Payload Too Large | Audio file exceeds 10MB |
| 415 | Unsupported Media Type | Audio format not supported |
| 422 | Unprocessable Entity | Valid format but processing failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | Dependency service unavailable |
| 504 | Gateway Timeout | Request took too long |

### Error Codes

| Code | HTTP Status | Description | Solution |
|------|-------------|-------------|----------|
| `MISSING_AUDIO_FILE` | 400 | No audio file provided | Include audio_file in request |
| `MISSING_PROMPT` | 400 | No prompt provided | Include prompt parameter |
| `INVALID_GENRE` | 400 | Genre not supported | Use supported genre |
| `INVALID_AI_PROVIDER` | 400 | Invalid AI provider | Use "anthropic" or "openai" |
| `INVALID_VOCAL_MODEL` | 400 | Invalid vocal model | Use "bark" or "musicgen" |
| `FILE_TOO_LARGE` | 413 | File exceeds size limit | Compress or trim audio |
| `UNSUPPORTED_FORMAT` | 415 | Audio format not supported | Convert to WAV or MP3 |
| `MELODY_EXTRACTION_FAILED` | 422 | Could not extract melody | Record clearer audio |
| `LYRIC_GENERATION_FAILED` | 422 | AI lyric generation failed | Check API keys, retry |
| `VOCAL_SYNTHESIS_FAILED` | 422 | Vocal synthesis failed | Retry, check Replicate status |
| `API_KEY_MISSING` | 401 | Required API key not set | Set environment variables |
| `API_KEY_INVALID` | 401 | API key is invalid | Verify API key is correct |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Wait before retrying |
| `EXTERNAL_SERVICE_ERROR` | 503 | Replicate/AI service down | Check service status, retry |
| `PROCESSING_TIMEOUT` | 504 | Processing took too long | Use shorter audio, retry |

### Example Error Responses

**Invalid Audio File**:

```json
{
  "detail": "Could not read audio file. Unsupported format.",
  "error_code": "UNSUPPORTED_FORMAT",
  "suggestions": [
    "Convert audio to WAV or MP3 format",
    "Ensure file is not corrupted",
    "Try re-recording the melody"
  ]
}
```

**Missing API Key**:

```json
{
  "detail": "ANTHROPIC_API_KEY not found in environment",
  "error_code": "API_KEY_MISSING",
  "suggestions": [
    "Set ANTHROPIC_API_KEY in .env file",
    "Or use ai_provider=openai with OPENAI_API_KEY",
    "Restart the server after setting environment variables"
  ]
}
```

**Processing Failed**:

```json
{
  "detail": "Could not extract clear melody from audio",
  "error_code": "MELODY_EXTRACTION_FAILED",
  "suggestions": [
    "Record in a quieter environment",
    "Ensure melody is clearly audible",
    "Hum or sing louder and more clearly",
    "Remove background music or noise"
  ]
}
```

## Rate Limits

### Default Limits

| Endpoint | Requests per Minute | Requests per Hour |
|----------|---------------------|-------------------|
| `/melody-to-vocals` | 10 | 100 |
| `/models` | 60 | 1000 |
| `/health` | 120 | Unlimited |

### Rate Limit Headers

Responses include rate limit information:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1634567890
```

### Exceeding Rate Limits

When rate limit is exceeded:

**Response** (429):
```json
{
  "detail": "Rate limit exceeded. Try again in 42 seconds.",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 42
}
```

### Best Practices

- Implement exponential backoff for retries
- Cache results when possible
- Monitor rate limit headers
- Use webhooks for async processing (if available)

## Code Examples

### TypeScript/Node.js SDK

**Installation**:

```bash
npm install form-data node-fetch
```

**Usage**:

```typescript
import { generateVocalsFromMelody } from './src/backend/services/melody-vocals-service';

// Simple usage
const result = await generateVocalsFromMelody({
  audioFilePath: './melody.wav',
  prompt: 'A love song about summer nights'
});

console.log('Vocals:', result.audio_url);
console.log('Lyrics:', result.lyrics);

// Advanced usage with all parameters
const advancedResult = await generateVocalsFromMelody({
  audioFilePath: './melody.wav',
  prompt: 'An empowering anthem about overcoming obstacles',
  genre: 'rock',
  theme: 'perseverance',
  mood: 'energetic',
  style: 'Foo Fighters',
  aiProvider: 'anthropic',
  vocalModel: 'musicgen'
});

// Download the audio file
const audioResponse = await fetch(advancedResult.audio_url);
const audioBuffer = await audioResponse.arrayBuffer();
await fs.writeFile('output.mp3', Buffer.from(audioBuffer));
```

### Python SDK

**Installation**:

```bash
pip install requests
```

**Usage**:

```python
import requests
import json

def generate_vocals(
    audio_file_path: str,
    prompt: str,
    genre: str = "pop",
    mood: str = None,
    theme: str = None,
    ai_provider: str = "anthropic",
    vocal_model: str = "bark"
):
    url = "http://localhost:8003/melody-to-vocals"

    with open(audio_file_path, 'rb') as f:
        files = {'audio_file': f}
        data = {
            'prompt': prompt,
            'genre': genre,
            'ai_provider': ai_provider,
            'vocal_model': vocal_model
        }

        if mood:
            data['mood'] = mood
        if theme:
            data['theme'] = theme

        response = requests.post(url, files=files, data=data)
        response.raise_for_status()

        return response.json()

# Example usage
result = generate_vocals(
    audio_file_path='melody.wav',
    prompt='A celebration of new beginnings',
    genre='pop',
    mood='uplifting',
    theme='personal growth'
)

print(f"Success: {result['success']}")
print(f"Audio URL: {result['audio_url']}")
print(f"Lyrics:\n{result['lyrics']}")

# Download the audio
import urllib.request
urllib.request.urlretrieve(result['audio_url'], 'output.mp3')
```

### cURL Examples

**Basic Request**:

```bash
curl -X POST http://localhost:8003/melody-to-vocals \
  -F "audio_file=@melody.wav" \
  -F "prompt=A love song" \
  -F "genre=pop"
```

**Full Parameters**:

```bash
curl -X POST http://localhost:8003/melody-to-vocals \
  -F "audio_file=@melody.wav" \
  -F "prompt=An empowering anthem about rising above challenges" \
  -F "genre=rock" \
  -F "mood=energetic" \
  -F "theme=perseverance" \
  -F "style=Imagine Dragons" \
  -F "ai_provider=anthropic" \
  -F "vocal_model=bark" \
  -o response.json

# Extract audio URL and download
cat response.json | jq -r '.audio_url' | xargs curl -o output.mp3
```

**With Error Handling**:

```bash
#!/bin/bash

response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:8003/melody-to-vocals \
  -F "audio_file=@melody.wav" \
  -F "prompt=A love song" \
  -F "genre=pop")

http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 200 ]; then
  echo "Success!"
  echo "$body" | jq '.'
  audio_url=$(echo "$body" | jq -r '.audio_url')
  curl -o output.mp3 "$audio_url"
else
  echo "Error: HTTP $http_code"
  echo "$body" | jq '.'
fi
```

### JavaScript/Fetch API

**Browser Usage**:

```javascript
async function generateVocals(audioFile, prompt, options = {}) {
  const formData = new FormData();
  formData.append('audio_file', audioFile);
  formData.append('prompt', prompt);

  // Add optional parameters
  if (options.genre) formData.append('genre', options.genre);
  if (options.mood) formData.append('mood', options.mood);
  if (options.theme) formData.append('theme', options.theme);
  if (options.style) formData.append('style', options.style);
  if (options.aiProvider) formData.append('ai_provider', options.aiProvider);
  if (options.vocalModel) formData.append('vocal_model', options.vocalModel);

  try {
    const response = await fetch('http://localhost:8003/melody-to-vocals', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating vocals:', error);
    throw error;
  }
}

// Usage with file input
document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const prompt = document.getElementById('promptInput').value;

  try {
    const result = await generateVocals(file, prompt, {
      genre: 'pop',
      mood: 'happy',
      vocalModel: 'bark'
    });

    document.getElementById('lyrics').textContent = result.lyrics;
    document.getElementById('audio').src = result.audio_url;
  } catch (error) {
    alert('Error: ' + error.message);
  }
});
```

## Webhooks

### Coming Soon

Webhook support for asynchronous processing will be added in a future version. This will allow you to:

- Submit requests and receive callbacks when complete
- Avoid timeout issues for long-running requests
- Process multiple requests in parallel

**Planned Format**:

```json
{
  "webhook_url": "https://your-app.com/melody-callback",
  "audio_file": "...",
  "prompt": "...",
  "async": true
}
```

## API Costs

### Estimated Costs per Request

Based on default parameters:

| Component | Provider | Cost |
|-----------|----------|------|
| Pitch Extraction | Local (CREPE) | $0.00 |
| Lyrics (Claude) | Anthropic | ~$0.01 |
| Lyrics (GPT-4) | OpenAI | ~$0.02 |
| Vocals (Bark) | Replicate | ~$0.03-0.05 |
| Vocals (MusicGen) | Replicate | ~$0.07-0.10 |
| **Total (Bark + Claude)** | | **~$0.04** |
| **Total (MusicGen + GPT-4)** | | **~$0.12** |

### Cost Optimization Tips

1. Use Claude instead of GPT-4 (cheaper)
2. Use Bark instead of MusicGen (faster, cheaper)
3. Keep melodies under 15 seconds
4. Batch similar requests
5. Cache results for identical inputs

## Support

### Documentation

- Main guide: `/docs/melody-to-vocals.md`
- Examples: `/docs/examples/melody-to-vocals-examples.md`
- Deployment: `/docs/expert-music-ai-deployment.md`

### Health Monitoring

Monitor service health:

```bash
curl http://localhost:8003/health
```

### Logs

View server logs:

```bash
tail -f expert-music-ai.log
```

### Troubleshooting

Common issues and solutions are documented in the main guide under the Troubleshooting section.

---

**API Version**: 1.0.0
**Last Updated**: 2025-10-18
**Support**: See main documentation for contact information
