/**
 * AI Brain Server
 * Handles conversational AI for DAW control
 * Runs on port 8002
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';
import { Readable } from 'stream';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { audioConverter } from './services/audio-converter';

const app = express();
const PORT = parseInt(process.env.PORT || '8002', 10);
const httpServer = createServer(app);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Check if OpenAI API key is configured
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  WARNING: OPENAI_API_KEY not set! Voice features will not work.');
  console.warn('   Please add your OpenAI API key to .env file');
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// System prompt for AI DAWG
const SYSTEM_PROMPT = `You are AI DAWG, an expert AI music production assistant with FULL CONTROL over a professional Digital Audio Workstation (DAW).

You can control EVERYTHING in the DAW:
- Record, playback, and transport controls (start/stop recording and playback)
- Move, delete, and arrange clips/tracks
- Auto-comp vocal takes (combine best parts from multiple takes)
- Time alignment to grid (quantize)
- Pitch correction (Auto-Tune style)
- Smart mixing (EQ, compression, reverb in various artist styles like Drake, Pop, etc.)
- Professional mastering
- Generate chords, melodies, drums, and complete beats
- Change tempo (BPM) and musical key
- Full project management

Available functions:
- startRecording/stopRecording: Control recording
- playProject/stopPlayback: Control playback
- moveClip: Move clips around the timeline
- deleteClip: Remove clips
- autoComp: Automatically comp vocal takes
- quantize: Time align clips to grid
- autotune: Apply pitch correction
- smartMix: Apply intelligent mixing
- master: Professional mastering
- generateChords/Melody/Drums: Generate musical elements
- generateBeats: Create complete beats
- setTempo/setKey: Change project settings

When a user asks you to do something, respond conversationally like a professional music producer and execute the appropriate function. Be concise, friendly, and encouraging. You can control the DAW like a producer's assistant.`;

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
];

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

    // Call OpenAI with function calling
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: contextMessage },
        { role: 'user', content: message },
      ],
      functions: DAW_FUNCTIONS,
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

    res.json({
      response: responseMessage.content || `Executing ${functionCall?.name}...`,
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

    // Step 3: Process with GPT-4o
    console.log('🤖 Processing with GPT-4o...');
    apiCallCount.gpt++;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: contextMessage },
        { role: 'user', content: transcript },
      ],
      functions: DAW_FUNCTIONS,
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

      // Get AI response with conversation history
      console.log('🤖 GPT-4o response with memory...');
      apiCallCount.gpt++;
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...conversationHistory,
        ],
        functions: DAW_FUNCTIONS,
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
