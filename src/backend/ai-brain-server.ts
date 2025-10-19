/**
 * AI Brain Server
 * Handles conversational AI for DAW control
 * Runs on port 8002
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Readable } from 'stream';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { audioConverter } from './services/audio-converter';
import { generateMusic, generateBeat } from './services/udio-service';
import { generateExpertMusic, isExpertMusicAvailable } from './services/expert-music-service';
import { getCachedDAWFunctions, initializeFunctionCache } from './services/function-cache-service';
import functionCacheRoutes from './routes/function-cache-routes';

const app = express();
const PORT = parseInt(process.env.AI_BRAIN_PORT || '8002', 10);
const httpServer = createServer(app);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Check if API keys are configured
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  WARNING: OPENAI_API_KEY not set! Voice features will not work.');
  console.warn('   Please add your OpenAI API key to .env file');
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('⚠️  WARNING: ANTHROPIC_API_KEY not set! Lyrics organization will not work.');
  console.warn('   Please add your Anthropic API key to .env file');
}

// Middleware
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://dawg-ai.com'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Function cache routes
app.use('/api/functions', functionCacheRoutes);

// Initialize function cache
initializeFunctionCache()
  .then(() => console.log('✅ DAW Function cache initialized'))
  .catch((err) => console.error('❌ Function cache initialization failed:', err));

// System prompt for DAWG AI
const SYSTEM_PROMPT = `You are DAWG AI, an expert AI music production assistant with FULL CONTROL over a professional Digital Audio Workstation (DAW) modeled after Logic Pro X.

You can control EVERYTHING in the DAW:
- Record, playback, and transport controls (start/stop recording and playback)
- Move, delete, and arrange clips/tracks
- Auto-comp vocal takes (combine best parts from multiple takes)
- Time alignment to grid (quantize)
- Pitch correction (Auto-Tune style) and pitch shifting (change pitch without tempo)
- Smart mixing (EQ, compression, reverb in various artist styles like Drake, Pop, etc.)
- Professional mastering
- Generate chords, melodies, drums, and complete beats
- Change tempo (BPM) and musical key
- Full project management
- Voice memo recording (live voice chat to control DAW)

## Logic Pro X-Style Mixer & Routing (YOUR SUPERPOWER!)

You have COMPLETE control over the mixer and routing, just like Logic Pro X:

### Creating Tracks & Aux Channels
- **createAuxTrack**: Create aux tracks (mono or stereo) for effects like reverb, delay, compression
- **createAudioTrack**: Create audio tracks (mono or stereo)
- When users ask for a "reverb bus" or "delay send", create an aux track with that name

### Routing & Sends (Logic Pro X Style)
- **createSend**: Route tracks to aux channels using sends (like Logic's bus sends)
  - Pre-fader sends: Signal sent before track fader (for monitoring)
  - Post-fader sends: Signal sent after track fader (most common for effects)
- **setTrackOutput**: Route track outputs to master or other aux tracks
- **setSendLevel**: Control how much signal goes to each send (0-1, like Logic's send knobs)

### Mixer Controls
- **setTrackVolume**: Adjust track faders (0-1, where 1 = 0dB)
- **setTrackPan**: Pan tracks left/right (-1 to 1, where 0 = center)
- **muteTrack/soloTrack**: Mute or solo tracks

### Intelligent Mixing Workflows

When users ask for professional mixing setups, create them automatically:

**Reverb Setup:**
1. Create stereo aux track named "Reverb"
2. Create post-fader sends from vocal/instrument tracks to Reverb aux
3. Set send levels appropriately (vocals: 20-30%, instruments: 10-20%)

**Delay Setup:**
1. Create stereo aux track named "Delay"
2. Create post-fader sends to Delay aux
3. Adjust send levels based on genre

**Parallel Compression:**
1. Create stereo aux track named "Parallel Comp"
2. Create post-fader sends from tracks needing compression
3. Set higher send levels (40-60%) for parallel effect

**Headphone Mix:**
1. Create stereo aux track named "Headphone Mix"
2. Create pre-fader sends from all tracks (so performer hears independent mix)
3. Adjust send levels for performer's preference

### Smart Mixing Examples

When user says:
- "Set up reverb for vocals" → Create Reverb aux, create send from vocal tracks, set 25% level
- "Add delay to the guitar" → Create Delay aux if needed, create send from guitar track
- "Create a mix for this recording" → Analyze tracks, create appropriate aux channels (Reverb, Delay, Compression), route intelligently
- "Set up parallel compression on drums" → Create Parallel Comp aux, route drum tracks

Always name aux tracks descriptively (Reverb, Delay, Vocal Reverb, Drum Bus, etc.)

Available functions:
[ALL PREVIOUS FUNCTIONS...]
- createAuxTrack: Create aux/bus track (mono/stereo)
- createAudioTrack: Create audio track (mono/stereo)
- createSend: Create send from track to aux (pre/post fader)
- removeSend: Remove a send
- setSendLevel: Adjust send amount (0-1)
- setTrackOutput: Route track output (master or aux ID)
- setTrackVolume: Adjust track fader (0-1)
- setTrackPan: Pan track (-1 to 1)
- muteTrack/soloTrack: Mute or solo tracks
- getTracks: Get current track list to analyze project

When a user asks you to do something, respond conversationally like a professional music producer and execute the appropriate functions. Think like a Logic Pro X expert. Be concise, friendly, and encouraging.`;

// DAW function definitions - Complete control
const DAW_FUNCTIONS = [
  {
    name: 'startRecording',
    description: 'Start recording audio on a track',
    parameters: {
      type: 'object',
      properties: {
        trackId: { type: 'string', description: 'Track ID to record on' },
        armed: { type: 'boolean', description: 'Arm track for recording', default: true },
      },
      required: ['trackId'],
    },
  },
  {
    name: 'stopRecording',
    description: 'Stop current recording',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'playProject',
    description: 'Start playback of the project',
    parameters: {
      type: 'object',
      properties: {
        fromStart: { type: 'boolean', description: 'Play from beginning', default: false },
      },
    },
  },
  {
    name: 'stopPlayback',
    description: 'Stop project playback',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'moveClip',
    description: 'Move an audio/MIDI clip to a different position',
    parameters: {
      type: 'object',
      properties: {
        clipId: { type: 'string', description: 'Clip ID to move' },
        newPosition: { type: 'number', description: 'New position in bars/beats' },
        trackId: { type: 'string', description: 'Target track ID (optional)' },
      },
      required: ['clipId', 'newPosition'],
    },
  },
  {
    name: 'deleteClip',
    description: 'Delete an audio/MIDI clip',
    parameters: {
      type: 'object',
      properties: {
        clipId: { type: 'string', description: 'Clip ID to delete' },
      },
      required: ['clipId'],
    },
  },
  {
    name: 'autoComp',
    description: 'Automatically comp vocal takes by selecting the best parts from multiple recordings',
    parameters: {
      type: 'object',
      properties: {
        trackIds: { type: 'array', items: { type: 'string' }, description: 'Track IDs to comp' },
      },
      required: ['trackIds'],
    },
  },
  {
    name: 'quantize',
    description: 'Time align clips to grid with specified note division',
    parameters: {
      type: 'object',
      properties: {
        clipIds: { type: 'array', items: { type: 'string' }, description: 'Clip IDs to quantize' },
        division: { type: 'string', description: 'Note division (e.g., "16th", "8th", "quarter")', enum: ['16th', '8th', 'quarter', 'half'] },
      },
      required: ['clipIds', 'division'],
    },
  },
  {
    name: 'autotune',
    description: 'Apply pitch correction to audio clips',
    parameters: {
      type: 'object',
      properties: {
        clipIds: { type: 'array', items: { type: 'string' }, description: 'Clip IDs to pitch correct' },
        key: { type: 'string', description: 'Musical key for correction' },
        strength: { type: 'number', description: 'Correction strength 0-100', minimum: 0, maximum: 100 },
      },
      required: ['clipIds', 'key'],
    },
  },
  {
    name: 'pitchShift',
    description: 'Shift pitch of audio clips up or down without changing tempo',
    parameters: {
      type: 'object',
      properties: {
        clipIds: { type: 'array', items: { type: 'string' }, description: 'Clip IDs to pitch shift' },
        semitones: { type: 'number', description: 'Number of semitones to shift (-12 to +12)', minimum: -12, maximum: 12 },
      },
      required: ['clipIds', 'semitones'],
    },
  },
  {
    name: 'smartMix',
    description: 'Apply intelligent mixing to tracks',
    parameters: {
      type: 'object',
      properties: {
        trackIds: { type: 'array', items: { type: 'string' }, description: 'Track IDs to mix' },
        style: { type: 'string', description: 'Mixing style (e.g., "Drake", "Pop", "Rock", "Hip-Hop")' },
      },
      required: ['trackIds'],
    },
  },
  {
    name: 'master',
    description: 'Apply professional mastering to the project',
    parameters: {
      type: 'object',
      properties: {
        targetLoudness: { type: 'number', description: 'Target LUFS loudness', default: -14 },
        genre: { type: 'string', description: 'Music genre for mastering profile' },
      },
    },
  },
  {
    name: 'generateChords',
    description: 'Generate chord progressions',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Musical key' },
        genre: { type: 'string', description: 'Music genre' },
        bars: { type: 'number', description: 'Number of bars', default: 8 },
      },
      required: ['key'],
    },
  },
  {
    name: 'generateMelody',
    description: 'Generate melodies',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Musical key' },
        genre: { type: 'string', description: 'Music genre' },
        bars: { type: 'number', description: 'Number of bars', default: 8 },
      },
      required: ['key'],
    },
  },
  {
    name: 'generateDrums',
    description: 'Generate drum patterns',
    parameters: {
      type: 'object',
      properties: {
        genre: { type: 'string', description: 'Music genre' },
        bars: { type: 'number', description: 'Number of bars', default: 8 },
        complexity: { type: 'string', description: 'Pattern complexity', enum: ['simple', 'medium', 'complex'], default: 'medium' },
      },
      required: ['genre'],
    },
  },
  {
    name: 'generateBeats',
    description: 'Generate a complete beat with drums, bass, and melody',
    parameters: {
      type: 'object',
      properties: {
        genre: { type: 'string', description: 'Music genre (e.g., "Trap", "Boom Bap", "Lo-Fi")' },
        key: { type: 'string', description: 'Musical key' },
        tempo: { type: 'number', description: 'BPM tempo' },
        bars: { type: 'number', description: 'Number of bars', default: 16 },
      },
      required: ['genre'],
    },
  },
  {
    name: 'setTempo',
    description: 'Change the project tempo (BPM)',
    parameters: {
      type: 'object',
      properties: {
        bpm: { type: 'number', description: 'New tempo in BPM', minimum: 20, maximum: 300 },
      },
      required: ['bpm'],
    },
  },
  {
    name: 'setKey',
    description: 'Change the project key',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Musical key (e.g., "C Major", "A Minor")' },
      },
      required: ['key'],
    },
  },
  {
    name: 'writeLyrics',
    description: 'Write lyrics or notes to the lyrics widget when user says "write this down" or similar',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The lyrics or notes to write' },
        append: { type: 'boolean', description: 'Append to existing lyrics (true) or replace (false)', default: true },
      },
      required: ['text'],
    },
  },
  // ===== LOGIC PRO X-STYLE MIXER & ROUTING FUNCTIONS =====
  {
    name: 'getTracks',
    description: 'Get information about all tracks in the project to analyze routing, track names, and types',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'createAuxTrack',
    description: 'Create an aux/bus track for effects routing (like Logic Pro X aux channels)',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name for the aux track (e.g., "Reverb", "Delay", "Vocal Reverb")' },
        channels: { type: 'string', enum: ['mono', 'stereo'], description: 'Mono or stereo configuration', default: 'stereo' },
      },
      required: ['name'],
    },
  },
  {
    name: 'createAudioTrack',
    description: 'Create a new audio track',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name for the audio track' },
        channels: { type: 'string', enum: ['mono', 'stereo'], description: 'Mono or stereo', default: 'stereo' },
      },
      required: ['name'],
    },
  },
  {
    name: 'createSend',
    description: 'Create a send from a source track to an aux track (Logic Pro X-style bus routing)',
    parameters: {
      type: 'object',
      properties: {
        sourceTrackId: { type: 'string', description: 'ID of the source track to send from' },
        destinationTrackId: { type: 'string', description: 'ID of the destination aux track' },
        preFader: { type: 'boolean', description: 'Pre-fader (true) or post-fader (false) send', default: false },
        level: { type: 'number', description: 'Send level (0-1), default 0.8', minimum: 0, maximum: 1, default: 0.8 },
      },
      required: ['sourceTrackId', 'destinationTrackId'],
    },
  },
  {
    name: 'removeSend',
    description: 'Remove a send from a track',
    parameters: {
      type: 'object',
      properties: {
        sourceTrackId: { type: 'string', description: 'ID of the track with the send' },
        sendId: { type: 'string', description: 'ID of the send to remove' },
      },
      required: ['sourceTrackId', 'sendId'],
    },
  },
  {
    name: 'setSendLevel',
    description: 'Adjust the level of a send',
    parameters: {
      type: 'object',
      properties: {
        sourceTrackId: { type: 'string', description: 'ID of the track with the send' },
        sendId: { type: 'string', description: 'ID of the send' },
        level: { type: 'number', description: 'Send level (0-1)', minimum: 0, maximum: 1 },
      },
      required: ['sourceTrackId', 'sendId', 'level'],
    },
  },
  {
    name: 'setTrackOutput',
    description: 'Route a track\'s output to master or an aux track',
    parameters: {
      type: 'object',
      properties: {
        trackId: { type: 'string', description: 'ID of the track to route' },
        outputDestination: { type: 'string', description: 'Destination: "master" or aux track ID' },
      },
      required: ['trackId', 'outputDestination'],
    },
  },
  {
    name: 'setTrackVolume',
    description: 'Set the volume fader of a track',
    parameters: {
      type: 'object',
      properties: {
        trackId: { type: 'string', description: 'ID of the track' },
        volume: { type: 'number', description: 'Volume level (0-1, where 1 = 0dB)', minimum: 0, maximum: 1 },
      },
      required: ['trackId', 'volume'],
    },
  },
  {
    name: 'setTrackPan',
    description: 'Set the pan position of a track',
    parameters: {
      type: 'object',
      properties: {
        trackId: { type: 'string', description: 'ID of the track' },
        pan: { type: 'number', description: 'Pan position (-1 = left, 0 = center, 1 = right)', minimum: -1, maximum: 1 },
      },
      required: ['trackId', 'pan'],
    },
  },
  {
    name: 'muteTrack',
    description: 'Mute or unmute a track',
    parameters: {
      type: 'object',
      properties: {
        trackId: { type: 'string', description: 'ID of the track' },
        mute: { type: 'boolean', description: 'true to mute, false to unmute' },
      },
      required: ['trackId', 'mute'],
    },
  },
  {
    name: 'soloTrack',
    description: 'Solo or unsolo a track',
    parameters: {
      type: 'object',
      properties: {
        trackId: { type: 'string', description: 'ID of the track' },
        solo: { type: 'boolean', description: 'true to solo, false to unsolo' },
      },
      required: ['trackId', 'solo'],
    },
  },
];

// Music generation endpoint for DAW AI (Expert Music + Suno integration)
app.post('/api/v1/ai/dawg', async (req, res) => {
  try {
    const { prompt, genre, mood, tempo, duration, style, project_id, include_vocals, custom_lyrics, instruments } = req.body;

    if (!prompt && style !== 'beat') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check if Expert Music AI should be used (when specific instruments are requested)
    const useExpertMusic = instruments && instruments.length > 0 && await isExpertMusicAvailable();

    if (useExpertMusic) {
      console.log('🎸 Using Expert Music AI with specialized models:', {
        prompt,
        instruments,
        tempo,
        duration,
        include_vocals,
      });

      // Use Expert Music AI with custom models
      const expertResult = await generateExpertMusic({
        prompt,
        instruments,
        style,
        include_vocals,
        custom_lyrics,
        duration: duration || 30,
        bpm: tempo,
        key: undefined,
      });

      if (!expertResult.success) {
        console.warn('Expert Music AI failed, falling back to Suno');
        // Continue to Suno fallback below
      } else {
        return res.json({
          success: true,
          message: expertResult.message || 'Music generated with Expert Music AI',
          audio_url: expertResult.audio_url,
          job_id: expertResult.prediction_id,
          prompt,
          genre,
          tempo,
          duration: expertResult.duration,
          model_used: expertResult.model_used,
          provider: 'expert_music_ai',
        });
      }
    }

    console.log('🎵 Music generation request with Suno V5:', {
      prompt,
      genre,
      tempo,
      duration,
      style,
      include_vocals,
      has_custom_lyrics: !!custom_lyrics
    });

    // Use beat-specific generation if style is 'beat' or 'drums'
    let result;
    if (style === 'beat' || style === 'drums') {
      result = await generateBeat({
        genre: genre || 'hip-hop',
        tempo: tempo || 120,
        duration: duration || 15,
      });
    } else {
      result = await generateMusic({
        prompt,
        genre,
        mood,
        tempo,
        duration,
        style,
        instrumental: !include_vocals, // Pass instrumental flag (inverse of include_vocals)
        lyrics: custom_lyrics, // Pass custom lyrics if provided
      });
    }

    if (!result.success) {
      return res.status(500).json({
        error: result.error || 'Failed to generate music',
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: result.message || 'Music generated successfully with Suno V5',
      audio_url: result.audio_url,
      job_id: result.job_id,
      prompt,
      genre,
      tempo,
      duration,
    });

    console.log('✅ Suno V5 generation complete:', result.audio_url);
  } catch (error: any) {
    console.error('❌ Music generation error:', error);
    res.status(500).json({
      error: 'Failed to generate music',
      message: error.message,
    });
  }
});

// Organize lyrics endpoint - uses Claude to structure freestyle lyrics
app.post('/api/v1/ai/organize-lyrics', async (req, res) => {
  try {
    const { lyrics, projectId } = req.body;

    if (!lyrics) {
      return res.status(400).json({ error: 'Lyrics text is required' });
    }

    console.log('🎤 Organizing lyrics for project:', projectId);

    const prompt = `You are a professional music producer and lyricist. Analyze and organize the following freestyle rap lyrics.

Raw lyrics (transcribed from freestyle recording):
${lyrics}

Please organize these lyrics into a structured format with:
1. Verses (identify distinct verse sections)
2. Chorus/Hook (if any repeated patterns exist)
3. Bridge (if applicable)
4. Suggested improvements (rhyme scheme, flow, wordplay)

Format your response as JSON with the following structure:
{
  "verses": ["verse 1 text", "verse 2 text", ...],
  "chorus": "chorus text or null if none identified",
  "bridge": "bridge text or null",
  "suggestions": ["suggestion 1", "suggestion 2", ...],
  "structure": "recommended song structure like Verse-Chorus-Verse-Chorus-Bridge-Chorus"
}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const organized = response.content[0].type === 'text' ? response.content[0].text : '';

    // Try to parse JSON response, fallback to raw text if parsing fails
    let result;
    try {
      result = JSON.parse(organized);
    } catch (e) {
      result = {
        organized: organized,
        raw: true
      };
    }

    res.json({
      success: true,
      organized: result,
      originalLyrics: lyrics
    });

  } catch (error) {
    console.error('Failed to organize lyrics:', error);
    res.status(500).json({
      error: 'Failed to organize lyrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Conversation history for HTTP chat endpoint (stores last 10 messages)
const httpChatHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, project_context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Chat request:', { message, project_context });

    // Build context message
    let contextMessage = 'Current project state:\n';
    if (project_context) {
      if (project_context.project_name) contextMessage += `Project: ${project_context.project_name}\n`;
      if (project_context.tempo) contextMessage += `Tempo: ${project_context.tempo} BPM\n`;
      if (project_context.key) contextMessage += `Key: ${project_context.key}\n`;
      if (project_context.time_signature) contextMessage += `Time Signature: ${project_context.time_signature}\n`;
      if (project_context.track_count) contextMessage += `Tracks: ${project_context.track_count}\n`;
      if (project_context.selected_clips) contextMessage += `Selected Clips: ${project_context.selected_clips}\n`;
      if (project_context.lyrics) contextMessage += `Lyrics:\n${project_context.lyrics}\n`;
    }

    // Add user message to conversation history
    httpChatHistory.push({ role: 'user', content: `${contextMessage}\n${message}` });

    // Keep only last 10 messages to prevent token overflow
    if (httpChatHistory.length > 10) {
      httpChatHistory.splice(0, httpChatHistory.length - 10);
    }

    console.log(`📚 Conversation history length: ${httpChatHistory.length} messages`);

    // Call OpenAI with conversation history (using cached function definitions)
    const dawFunctions = getCachedDAWFunctions();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...httpChatHistory, // Include conversation history
      ],
      functions: dawFunctions,
      function_call: 'auto',
      temperature: 0.7,
      max_tokens: 500,
    });

    const choice = completion.choices[0];
    const responseMessage = choice.message;

    // Check if function was called
    let functionCall = null;
    if (responseMessage.function_call) {
      functionCall = {
        name: responseMessage.function_call.name,
        arguments: JSON.parse(responseMessage.function_call.arguments),
      };
      console.log('Function called:', functionCall);
    }

    // Add assistant response to conversation history
    const assistantResponse = responseMessage.content || `Executing ${functionCall?.name}...`;
    httpChatHistory.push({ role: 'assistant', content: assistantResponse });

    res.json({
      response: assistantResponse,
      function_call: functionCall,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to process chat message',
      message: error.message,
    });
  }
});

// Voice chat endpoint with REAL Whisper + TTS (like ChatGPT Advanced Voice)
app.post('/api/voice-chat', async (req, res) => {
  try {
    const { audio_base64, project_context } = req.body;

    if (!audio_base64) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: 'OpenAI API key not configured',
        message: 'Please add OPENAI_API_KEY to .env file to use voice features'
      });
    }

    console.log('🎤 Voice chat request - Using Whisper + TTS');

    // Step 1: Convert base64 to buffer for Whisper
    const audioBuffer = Buffer.from(audio_base64, 'base64');

    // Create a file-like object for Whisper API
    const audioFile = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' });

    // Step 2: Transcribe with Whisper
    console.log('🎙️  Transcribing with Whisper...');
    apiCallCount.whisper++;
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
    });

    const transcript = transcription.text;
    console.log('📝 Transcript:', transcript, `[API calls: W:${apiCallCount.whisper} G:${apiCallCount.gpt} T:${apiCallCount.tts}]`);

    // Build context message
    let contextMessage = 'Current project state:\n';
    if (project_context) {
      if (project_context.project_name) contextMessage += `Project: ${project_context.project_name}\n`;
      if (project_context.tempo) contextMessage += `Tempo: ${project_context.tempo} BPM\n`;
      if (project_context.key) contextMessage += `Key: ${project_context.key}\n`;
      if (project_context.time_signature) contextMessage += `Time Signature: ${project_context.time_signature}\n`;
      if (project_context.track_count) contextMessage += `Tracks: ${project_context.track_count}\n`;
      if (project_context.lyrics) contextMessage += `Lyrics:\n${project_context.lyrics}\n`;
    }

    // Step 3: Process with GPT-4o (using cached function definitions)
    console.log('🤖 Processing with GPT-4o...');
    apiCallCount.gpt++;
    const dawFunctions = getCachedDAWFunctions();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: contextMessage },
        { role: 'user', content: transcript },
      ],
      functions: dawFunctions,
      function_call: 'auto',
      temperature: 0.7,
      max_tokens: 500,
    });

    const choice = completion.choices[0];
    const responseMessage = choice.message;

    // Check if function was called
    let functionCall = null;
    if (responseMessage.function_call) {
      functionCall = {
        name: responseMessage.function_call.name,
        arguments: JSON.parse(responseMessage.function_call.arguments),
      };
      console.log('⚡ Function called:', functionCall.name);
    }

    const responseText = responseMessage.content || `Executing ${functionCall?.name}...`;

    // Step 4: Generate speech with TTS (like Advanced Voice)
    console.log('🔊 Generating speech with TTS...');
    apiCallCount.tts++;
    const speech = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova', // Natural, friendly voice like Advanced Voice
      input: responseText,
      speed: 1.0,
    });

    // Convert audio stream to base64
    const audioArrayBuffer = await speech.arrayBuffer();
    const audioBase64 = Buffer.from(audioArrayBuffer).toString('base64');

    console.log('✅ Voice response ready');

    res.json({
      transcript: transcript,
      response_text: responseText,
      response_audio_base64: audioBase64,
      function_call: functionCall,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Voice chat error:', error);
    res.status(500).json({
      error: 'Failed to process voice message',
      message: error.message,
    });
  }
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-brain',
    timestamp: new Date().toISOString(),
  });
});

// Initialize Socket.IO for real-time voice streaming
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://dawg-ai.com'],
    credentials: true,
  },
});

// Usage tracking
let apiCallCount = {
  whisper: 0,
  gpt: 0,
  tts: 0,
  resetTime: Date.now(),
};

// Reset usage counter every hour
setInterval(() => {
  console.log('📊 API Usage (last hour):', {
    whisper: apiCallCount.whisper,
    gpt: apiCallCount.gpt,
    tts: apiCallCount.tts,
    estimatedCost: (apiCallCount.whisper * 0.006 + apiCallCount.gpt * 0.01 + apiCallCount.tts * 0.015).toFixed(3) + ' USD'
  });
  apiCallCount = { whisper: 0, gpt: 0, tts: 0, resetTime: Date.now() };
}, 3600000);

// Real-time voice streaming handler
io.on('connection', (socket) => {
  console.log('🔌 Client connected for live voice');

  let isProcessing = false;

  // Conversation memory for learning from mistakes
  const conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

  socket.on('voice-stream', async (data: { audio: string; mimeType?: string; projectContext?: any }) => {
    // Skip if already processing
    if (isProcessing) {
      console.log('⏭️  Skipping - already processing');
      return;
    }

    try {
      isProcessing = true;

      // Decode complete audio segment (not chunks)
      const audioBuffer = Buffer.from(data.audio, 'base64');

      // Detect format from mimeType
      const mimeType = data.mimeType || 'audio/webm';
      const extension = mimeType.includes('webm') ? 'webm' :
                       mimeType.includes('mp4') ? 'mp4' :
                       mimeType.includes('ogg') ? 'ogg' : 'webm';

      console.log(`🎙️  Processing complete audio segment: ${mimeType} (${audioBuffer.length} bytes)`);

      // Convert audio to MP3 for reliable Whisper processing
      const { buffer: convertedBuffer, extension: convertedExt, mimeType: convertedMime } =
        await audioConverter.prepareForWhisper(audioBuffer, extension);

      // Create file for Whisper
      const audioFile = new File([convertedBuffer], `audio.${convertedExt}`, { type: convertedMime });

      // Transcribe in real-time
      console.log('🎙️  Live transcription...');
      apiCallCount.whisper++;
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en',
      });

      const transcript = transcription.text;
      console.log('📝 Transcript:', transcript, `[API calls: W:${apiCallCount.whisper} G:${apiCallCount.gpt} T:${apiCallCount.tts}]`);

      // Send transcript back immediately
      socket.emit('transcript', { text: transcript });

      // Build context
      let contextMessage = 'Current project state:\n';
      if (data.projectContext) {
        if (data.projectContext.project_name) contextMessage += `Project: ${data.projectContext.project_name}\n`;
        if (data.projectContext.tempo) contextMessage += `Tempo: ${data.projectContext.tempo} BPM\n`;
        if (data.projectContext.key) contextMessage += `Key: ${data.projectContext.key}\n`;
      }

      // Add user message to conversation history
      conversationHistory.push({ role: 'user', content: `${contextMessage}\n${transcript}` });

      // Keep only last 10 messages to prevent token overflow
      if (conversationHistory.length > 10) {
        conversationHistory.splice(0, conversationHistory.length - 10);
      }

      // Get AI response with conversation history (using cached function definitions)
      console.log('🤖 GPT-4o response with memory...');
      apiCallCount.gpt++;
      const dawFunctions = getCachedDAWFunctions();
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...conversationHistory,
        ],
        functions: dawFunctions,
        function_call: 'auto',
        temperature: 0.7,
        max_tokens: 300, // Reduced for faster responses
      });

      const responseMessage = completion.choices[0].message;
      const responseText = responseMessage.content || 'Processing...';

      // Add assistant response to conversation history
      conversationHistory.push({ role: 'assistant', content: responseText });

      // Check for function calls
      let functionCall = null;
      if (responseMessage.function_call) {
        functionCall = {
          name: responseMessage.function_call.name,
          arguments: JSON.parse(responseMessage.function_call.arguments),
        };
        socket.emit('function-call', functionCall);
      }

      // Generate voice response in real-time
      console.log('🔊 TTS response (faster)...');
      apiCallCount.tts++;
      const speech = await openai.audio.speech.create({
        model: 'tts-1-hd', // Higher quality
        voice: 'nova',
        input: responseText,
        speed: 1.15, // Faster for quicker responses
      });

      const audioArrayBuffer = await speech.arrayBuffer();
      const audioBase64 = Buffer.from(audioArrayBuffer).toString('base64');

      // Stream response back
      socket.emit('voice-response', {
        text: responseText,
        audio: audioBase64,
        functionCall,
      });

      console.log('✅ Live response sent');
      isProcessing = false;
    } catch (error: any) {
      console.error('❌ Live voice error:', error);
      socket.emit('error', { message: error.message });
      isProcessing = false;
    }
  });

  socket.on('stop-voice', () => {
    console.log('🛑 Voice stream stopped');
    isProcessing = false;
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected');
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🧠 AI Brain server running on port ${PORT}`);
  console.log(`🔌 WebSocket server enabled for live voice`);
  if (process.env.OPENAI_API_KEY) {
    console.log(`✅ OpenAI API key configured - Live voice features enabled`);
  } else {
    console.log(`⚠️  OpenAI API key NOT set - Voice features disabled`);
    console.log(`   Add OPENAI_API_KEY=sk-... to .env file`);
  }
});
