import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import cors from 'cors';
import { generateMusic, generateBeat } from './services/musicgen-service';
import { getCachedVoiceFunctions, initializeFunctionCache } from './services/function-cache-service';
import functionCacheRoutes from './routes/function-cache-routes';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const server = createServer(app);

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
app.use(express.json());

// Function cache routes
app.use('/api/functions', functionCacheRoutes);

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PORT = parseInt(process.env.REALTIME_VOICE_PORT || process.env.PORT || '3100', 10);

logger.info('OpenAI Realtime Voice Server Starting...');
logger.info('Port configured', { port: PORT });
logger.info('OpenAI API Key status', { configured: !!OPENAI_API_KEY });

// Initialize function cache
initializeFunctionCache()
  .then(() => logger.info('Function cache ready'))
  .catch((err) => logger.error('Function cache initialization failed:', { error: err }));

// ✨ SHARED OpenAI WebSocket (singleton pattern)
let sharedOpenaiWs: WebSocket | null = null;
let isConnected = false;
let isAIResponding = false;
let currentResponseId: string | null = null;
let currentVoice = 'alloy';

// Conversation memory for context and learning
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
const conversationHistory: ConversationMessage[] = [];
const MAX_HISTORY_LENGTH = 10;

// Initialize shared OpenAI WebSocket
function initializeOpenAIConnection(voice: string = 'alloy') {
  if (sharedOpenaiWs && isConnected) {
    logger.warn('Already connected to OpenAI');
    return;
  }

  currentVoice = voice;
  logger.info('Initializing shared OpenAI connection', { voice });

  const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';
  sharedOpenaiWs = new WebSocket(url, {
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'OpenAI-Beta': 'realtime=v1'
    }
  });

  sharedOpenaiWs.on('open', () => {
    logger.info('Connected to OpenAI Realtime API');
    isConnected = true;

    // Get cached voice functions (optimized for bandwidth)
    const voiceFunctions = getCachedVoiceFunctions();
    logger.info('Using cached voice functions', { count: voiceFunctions.length });

    // Configure session
    sharedOpenaiWs?.send(JSON.stringify({
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: 'You are a professional music producer AI assistant helping users create music in a DAW. Be concise, creative, and helpful. When users ask you to create beats or music, use the generate_music function. When they ask to start recording, use start_recording. When they hum a melody and want lyrics/vocals, use melody_to_vocals.',
        voice: currentVoice,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 200
        },
        tools: voiceFunctions, // Use cached functions
        tool_choice: 'auto',
        temperature: 0.8
      }
    }));
  });

  sharedOpenaiWs.on('message', (data) => {
    try {
      const event = JSON.parse(data.toString());

      // Log session events
      if (event.type?.startsWith('session.') || event.type?.startsWith('conversation.item.') || event.type?.startsWith('input_audio_buffer.') || event.type?.startsWith('response.')) {
        if (!event.type.includes('.delta')) {
          logger.debug(`Event: ${event.type}`);
        }
      }

      switch (event.type) {
        case 'conversation.item.created':
          logger.debug('New conversation item');
          break;

        case 'conversation.item.input_audio_transcription.completed':
          io.emit('user-transcript-done', { text: event.transcript });
          logger.debug('User said:', { transcript: event.transcript });
          // Add to conversation history
          conversationHistory.push({
            role: 'user',
            content: event.transcript,
            timestamp: new Date()
          });
          // Keep only last MAX_HISTORY_LENGTH messages
          if (conversationHistory.length > MAX_HISTORY_LENGTH) {
            conversationHistory.splice(0, conversationHistory.length - MAX_HISTORY_LENGTH);
          }
          break;

        case 'response.audio_transcript.delta':
          io.emit('ai-text-delta', { text: event.delta });
          break;

        case 'response.audio_transcript.done':
          io.emit('ai-text-done', { text: event.transcript });
          logger.debug('AI said:', { transcript: event.transcript });
          // Add to conversation history
          if (event.transcript && event.transcript.trim()) {
            conversationHistory.push({
              role: 'assistant',
              content: event.transcript,
              timestamp: new Date()
            });
            // Keep only last MAX_HISTORY_LENGTH messages
            if (conversationHistory.length > MAX_HISTORY_LENGTH) {
              conversationHistory.splice(0, conversationHistory.length - MAX_HISTORY_LENGTH);
            }
          }
          break;

        case 'response.audio.delta':
          io.emit('audio-delta', { audio: event.delta });
          break;

        case 'response.audio.done':
          logger.debug('Audio response complete');
          io.emit('audio-done');
          break;

        case 'response.created':
          logger.debug('AI response started');
          isAIResponding = true;
          currentResponseId = event.response.id;
          io.emit('response-started');
          break;

        case 'response.done':
          logger.debug('Response complete');
          isAIResponding = false;
          currentResponseId = null;
          io.emit('response-done');
          break;

        case 'error':
          // Suppress "no active response" errors (common race condition during interruptions)
          const errorMessage = event.error?.message || '';
          if (errorMessage.toLowerCase().includes('no active response') || errorMessage.toLowerCase().includes('cancellation failed')) {
            logger.debug('OpenAI: Response cancellation skipped (already finished)');
          } else {
            logger.error('OpenAI Error:', { error: event.error });
            io.emit('error', { message: event.error.message });
          }
          break;

        case 'input_audio_buffer.speech_started':
          logger.debug('User started speaking');
          io.emit('speech-started');

          // Interrupt AI if it's currently responding
          if (isAIResponding && currentResponseId) {
            logger.debug('User interrupted AI - canceling response');
            try {
              sharedOpenaiWs?.send(JSON.stringify({
                type: 'response.cancel'
              }));
              io.emit('ai-interrupted');
            } catch (error: any) {
              // Suppress "no active response" errors (race condition where response finished just as we tried to cancel)
              const errorMsg = error.message?.toLowerCase() || '';
              if (!errorMsg.includes('no active response') && !errorMsg.includes('cancellation failed')) {
                logger.error('Error canceling response:', { error });
              } else {
                logger.debug('Response already finished, ignoring cancellation error');
              }
            }
            isAIResponding = false;
            currentResponseId = null;
          }
          break;

        case 'input_audio_buffer.speech_stopped':
          logger.debug('User stopped speaking');
          io.emit('speech-stopped');
          break;

        case 'response.function_call_arguments.done':
          logger.debug('Function call:', { name: event.name, arguments: event.arguments });

          if (event.name === 'change_my_voice') {
            try {
              const args = JSON.parse(event.arguments);
              logger.info('AI changing voice to:', { voice: args.voice });

              sharedOpenaiWs?.send(JSON.stringify({
                type: 'session.update',
                session: {
                  voice: args.voice
                }
              }));

              sharedOpenaiWs?.send(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'function_call_output',
                  call_id: event.call_id,
                  output: JSON.stringify({
                    success: true,
                    message: `Voice changed to ${args.voice}`
                  })
                }
              }));

              sharedOpenaiWs?.send(JSON.stringify({
                type: 'response.create'
              }));

              io.emit('voice-changed', { voice: args.voice });
            } catch (error) {
              logger.error('Error handling voice change:', { error });
            }
          } else {
            // Forward function calls to ALL clients
            logger.debug('Broadcasting function call to all clients:', { functionName: event.name });
            io.emit('function-call', {
              call_id: event.call_id,
              name: event.name,
              arguments: event.arguments
            });
            logger.debug('Function call broadcasted');
          }
          break;

        case 'rate_limits.updated':
          logger.debug('rate_limits.updated');
          break;

        default:
          if (event.type && !event.type.includes('.delta')) {
            logger.debug(`Event: ${event.type}`);
          }
          break;
      }
    } catch (error) {
      logger.error('Error processing OpenAI message:', { error });
    }
  });

  sharedOpenaiWs.on('error', (error) => {
    logger.error('OpenAI WebSocket error:', { error });
    isConnected = false;
  });

  sharedOpenaiWs.on('close', () => {
    logger.info('Disconnected from OpenAI Realtime API');
    isConnected = false;
    sharedOpenaiWs = null;
  });
}

// Client connection handler
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  socket.on('start-realtime', (data?: { voice?: string; projectContext?: any }) => {
    const voice = data?.voice || 'alloy';
    initializeOpenAIConnection(voice);

    // If project context is provided, add it as a conversation item
    if (data?.projectContext && sharedOpenaiWs) {
      let contextMessage = 'Current project state:\n';
      if (data.projectContext.project_name) contextMessage += `Project: ${data.projectContext.project_name}\n`;
      if (data.projectContext.tempo) contextMessage += `Tempo: ${data.projectContext.tempo} BPM\n`;
      if (data.projectContext.key) contextMessage += `Key: ${data.projectContext.key}\n`;
      if (data.projectContext.time_signature) contextMessage += `Time Signature: ${data.projectContext.time_signature}\n`;
      if (data.projectContext.track_count) contextMessage += `Tracks: ${data.projectContext.track_count}\n`;
      if (data.projectContext.lyrics) contextMessage += `Lyrics:\n${data.projectContext.lyrics}\n`;

      logger.debug('Adding project context to conversation');

      // Add context as a user message
      sharedOpenaiWs.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{
            type: 'input_text',
            text: contextMessage
          }]
        }
      }));
    }

    socket.emit('realtime-started');
  });

  socket.on('send-audio', (data: { audio: string }) => {
    if (!sharedOpenaiWs || !isConnected) {
      logger.warn('Not connected to OpenAI');
      return;
    }

    try {
      sharedOpenaiWs.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: data.audio
      }));
    } catch (error) {
      logger.error('Error sending audio to OpenAI:', { error });
    }
  });

  socket.on('function-result', (data: { call_id: string; output: any }) => {
    if (!sharedOpenaiWs || !isConnected) {
      logger.warn('Not connected to OpenAI');
      return;
    }

    try {
      logger.debug('Function result received:', { callId: data.call_id });
      sharedOpenaiWs.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: data.call_id,
          output: JSON.stringify(data.output)
        }
      }));
      sharedOpenaiWs.send(JSON.stringify({
        type: 'response.create'
      }));
    } catch (error) {
      logger.error('Error sending function result to OpenAI:', { error });
    }
  });

  socket.on('change-voice', (data: { voice: string }) => {
    if (!sharedOpenaiWs || !isConnected) {
      logger.warn('Not connected to OpenAI');
      return;
    }

    try {
      logger.info('Changing voice to:', { voice: data.voice });
      currentVoice = data.voice;
      sharedOpenaiWs.send(JSON.stringify({
        type: 'session.update',
        session: {
          voice: data.voice
        }
      }));
      io.emit('voice-changed', { voice: data.voice });
    } catch (error) {
      logger.error('Error changing voice:', { error });
    }
  });

  socket.on('stop-realtime', () => {
    logger.info('Client requested to stop realtime session');
    // Don't close shared WebSocket when one client disconnects
    socket.emit('realtime-stopped');
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
    // Only close OpenAI connection if NO clients are connected
    if (io.sockets.sockets.size === 0 && sharedOpenaiWs) {
      logger.info('Last client disconnected - closing OpenAI connection');
      sharedOpenaiWs.close();
      sharedOpenaiWs = null;
      isConnected = false;
    }
  });
});

server.listen(PORT, () => {
  logger.info('Realtime Voice Server running', { port: PORT });
  logger.info('WebSocket endpoint', { endpoint: `ws://localhost:${PORT}` });
});
