/**
 * Unified Backend Server
 * Consolidates Main Backend, AI Brain, and Realtime Voice into one service
 * Reduces Railway costs from $20/mo (4 services) to $5/mo (1 service)
 */

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Server as SocketIOServer } from 'socket.io';
import WebSocket from 'ws';
import Anthropic from '@anthropic-ai/sdk';

// Main Backend imports
import generationRoutes from './routes/generation-routes';
import trackRoutes from './routes/track-routes';
import costMonitoringRoutes from './routes/cost-monitoring-routes';
import lyricsRoutes from './routes/lyrics-routes';
import clipsRoutes from './routes/clips-routes';
import advancedFeaturesRoutes from './routes/advanced-features-routes';
import { initializeWebSocket } from '../api/websocket/server';
import { shutdownGenerationQueue } from './queues/generation-queue';

// Realtime Voice imports
import { generateMusic, generateBeat } from './services/musicgen-service';
import { getCachedVoiceFunctions, initializeFunctionCache } from './services/function-cache-service';
import functionCacheRoutes from './routes/function-cache-routes';

// Shared imports
import { logger } from './utils/logger';

const app = express();
const httpServer = createServer(app);

// Centralized CORS configuration
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://dawg-ai.com'
];

// Initialize Socket.IO with namespaces
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Initialize Anthropic for AI Brain
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('⚠️  WARNING: ANTHROPIC_API_KEY not set! AI Brain features will not work.');
}

// OpenAI Realtime configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.warn('⚠️  WARNING: OPENAI_API_KEY not set! Realtime Voice features will not work.');
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Request logging
app.use((req, _res, next) => {
  logger.info('HTTP request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// =============================================================================
// MAIN BACKEND ROUTES (Port 3001 functionality)
// =============================================================================

const mainNamespace = io.of('/');
initializeWebSocket(mainNamespace);

app.use('/api/generate', generationRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/cost-monitoring', costMonitoringRoutes);
app.use('/api/lyrics', lyricsRoutes);
app.use('/api/clips', clipsRoutes);
app.use('/api/v1', advancedFeaturesRoutes);

// =============================================================================
// AI BRAIN ROUTES (Port 8002 functionality -> /api/ai-brain)
// =============================================================================

const aiBrainNamespace = io.of('/ai-brain');

// AI Brain WebSocket handlers
aiBrainNamespace.on('connection', (socket) => {
  logger.info(`AI Brain client connected: ${socket.id}`);

  socket.on('message', async (data) => {
    try {
      const { message, conversationHistory } = data;

      // Stream Claude response
      const stream = await anthropic.messages.stream({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          ...(conversationHistory || []),
          { role: 'user', content: message }
        ],
        system: 'You are an AI assistant for a Digital Audio Workstation. Help users with music production tasks, mixing, and creative decisions.',
      });

      stream.on('text', (text) => {
        socket.emit('response-delta', { text });
      });

      stream.on('message', (message) => {
        socket.emit('response-done', { message });
      });

      stream.on('error', (error) => {
        logger.error('AI Brain streaming error:', error);
        socket.emit('error', { message: error.message });
      });

    } catch (error: any) {
      logger.error('AI Brain error:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`AI Brain client disconnected: ${socket.id}`);
  });
});

// AI Brain HTTP routes
app.get('/api/ai-brain/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-brain',
    anthropic_configured: !!process.env.ANTHROPIC_API_KEY,
  });
});

// =============================================================================
// REALTIME VOICE ROUTES (Port 3100 functionality -> /api/voice)
// =============================================================================

const voiceNamespace = io.of('/voice');

// Function cache routes
app.use('/api/voice/functions', functionCacheRoutes);

// Initialize function cache
initializeFunctionCache()
  .then(() => logger.info('✅ Voice function cache ready'))
  .catch((err) => logger.error('❌ Voice function cache failed:', err));

// Shared OpenAI WebSocket (singleton pattern)
let sharedOpenaiWs: WebSocket | null = null;
let isConnected = false;
let isAIResponding = false;
let currentResponseId: string | null = null;
let currentVoice = 'alloy';

// Conversation memory
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
const conversationHistory: ConversationMessage[] = [];
const MAX_HISTORY_LENGTH = 10;

// Initialize shared OpenAI connection
function initializeOpenAIConnection(voice: string = 'alloy') {
  if (sharedOpenaiWs && isConnected) {
    logger.info('⚠️  Already connected to OpenAI');
    return;
  }

  currentVoice = voice;
  logger.info(`🎙️ Initializing OpenAI connection with voice: ${voice}`);

  const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';
  sharedOpenaiWs = new WebSocket(url, {
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'OpenAI-Beta': 'realtime=v1'
    }
  });

  sharedOpenaiWs.on('open', () => {
    logger.info('✅ Connected to OpenAI Realtime API');
    isConnected = true;

    const voiceFunctions = getCachedVoiceFunctions();
    logger.info(`📦 Using cached voice functions (${voiceFunctions.length} functions)`);

    sharedOpenaiWs?.send(JSON.stringify({
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: 'You are a professional music producer AI assistant helping users create music in a DAW. Be concise, creative, and helpful.',
        voice: currentVoice,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: { model: 'whisper-1' },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 200
        },
        tools: voiceFunctions,
        tool_choice: 'auto',
        temperature: 0.8
      }
    }));
  });

  sharedOpenaiWs.on('message', (data) => {
    try {
      const event = JSON.parse(data.toString());

      switch (event.type) {
        case 'conversation.item.input_audio_transcription.completed':
          voiceNamespace.emit('user-transcript-done', { text: event.transcript });
          logger.info('📝 User said:', event.transcript);
          conversationHistory.push({
            role: 'user',
            content: event.transcript,
            timestamp: new Date()
          });
          if (conversationHistory.length > MAX_HISTORY_LENGTH) {
            conversationHistory.splice(0, conversationHistory.length - MAX_HISTORY_LENGTH);
          }
          break;

        case 'response.audio_transcript.delta':
          voiceNamespace.emit('ai-text-delta', { text: event.delta });
          break;

        case 'response.audio_transcript.done':
          voiceNamespace.emit('ai-text-done', { text: event.transcript });
          logger.info('🤖 AI said:', event.transcript);
          if (event.transcript && event.transcript.trim()) {
            conversationHistory.push({
              role: 'assistant',
              content: event.transcript,
              timestamp: new Date()
            });
            if (conversationHistory.length > MAX_HISTORY_LENGTH) {
              conversationHistory.splice(0, conversationHistory.length - MAX_HISTORY_LENGTH);
            }
          }
          break;

        case 'response.audio.delta':
          voiceNamespace.emit('audio-delta', { audio: event.delta });
          break;

        case 'response.audio.done':
          logger.info('🔊 Audio response complete');
          voiceNamespace.emit('audio-done');
          break;

        case 'response.created':
          logger.info('🤖 AI response started');
          isAIResponding = true;
          currentResponseId = event.response.id;
          voiceNamespace.emit('response-started');
          break;

        case 'response.done':
          logger.info('✅ Response complete');
          isAIResponding = false;
          currentResponseId = null;
          voiceNamespace.emit('response-done');
          break;

        case 'error':
          const errorMessage = event.error?.message || '';
          if (!errorMessage.toLowerCase().includes('no active response')) {
            logger.error('❌ OpenAI Error:', event.error);
            voiceNamespace.emit('error', { message: event.error.message });
          }
          break;

        case 'input_audio_buffer.speech_started':
          logger.info('🗣️  User started speaking');
          voiceNamespace.emit('speech-started');
          if (isAIResponding && currentResponseId) {
            logger.info('⚡ User interrupted AI - canceling response');
            try {
              sharedOpenaiWs?.send(JSON.stringify({ type: 'response.cancel' }));
              voiceNamespace.emit('ai-interrupted');
            } catch (error: any) {
              const errorMsg = error.message?.toLowerCase() || '';
              if (!errorMsg.includes('no active response')) {
                logger.error('Error canceling response:', error);
              }
            }
            isAIResponding = false;
            currentResponseId = null;
          }
          break;

        case 'input_audio_buffer.speech_stopped':
          logger.info('🤐 User stopped speaking');
          voiceNamespace.emit('speech-stopped');
          break;

        case 'response.function_call_arguments.done':
          logger.info('🔧 Function call:', event.name, event.arguments);

          if (event.name === 'change_my_voice') {
            try {
              const args = JSON.parse(event.arguments);
              logger.info(`🎙️ AI changing voice to: ${args.voice}`);

              sharedOpenaiWs?.send(JSON.stringify({
                type: 'session.update',
                session: { voice: args.voice }
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

              sharedOpenaiWs?.send(JSON.stringify({ type: 'response.create' }));
              voiceNamespace.emit('voice-changed', { voice: args.voice });
            } catch (error) {
              logger.error('Error handling voice change:', error);
            }
          } else {
            logger.info(`📤 Broadcasting function call: ${event.name}`);
            voiceNamespace.emit('function-call', {
              call_id: event.call_id,
              name: event.name,
              arguments: event.arguments
            });
          }
          break;
      }
    } catch (error) {
      logger.error('Error processing OpenAI message:', error);
    }
  });

  sharedOpenaiWs.on('error', (error) => {
    logger.error('❌ OpenAI WebSocket error:', error);
    isConnected = false;
  });

  sharedOpenaiWs.on('close', () => {
    logger.info('🔌 Disconnected from OpenAI Realtime API');
    isConnected = false;
    sharedOpenaiWs = null;
  });
}

// Voice WebSocket handlers
voiceNamespace.on('connection', (socket) => {
  logger.info(`🎤 Voice client connected: ${socket.id}`);

  socket.on('start-realtime', (data?: { voice?: string; projectContext?: any }) => {
    const voice = data?.voice || 'alloy';
    initializeOpenAIConnection(voice);

    if (data?.projectContext && sharedOpenaiWs) {
      let contextMessage = 'Current project state:\n';
      if (data.projectContext.project_name) contextMessage += `Project: ${data.projectContext.project_name}\n`;
      if (data.projectContext.tempo) contextMessage += `Tempo: ${data.projectContext.tempo} BPM\n`;
      if (data.projectContext.key) contextMessage += `Key: ${data.projectContext.key}\n`;
      if (data.projectContext.lyrics) contextMessage += `Lyrics:\n${data.projectContext.lyrics}\n`;

      logger.info('📋 Adding project context to conversation');
      sharedOpenaiWs.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: contextMessage }]
        }
      }));
    }

    socket.emit('realtime-started');
  });

  socket.on('send-audio', (data: { audio: string }) => {
    if (!sharedOpenaiWs || !isConnected) {
      logger.warn('⚠️  Not connected to OpenAI');
      return;
    }

    try {
      sharedOpenaiWs.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: data.audio
      }));
    } catch (error) {
      logger.error('Error sending audio to OpenAI:', error);
    }
  });

  socket.on('function-result', (data: { call_id: string; output: any }) => {
    if (!sharedOpenaiWs || !isConnected) {
      logger.warn('⚠️  Not connected to OpenAI');
      return;
    }

    try {
      logger.info('✅ Function result received:', data.call_id);
      sharedOpenaiWs.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: data.call_id,
          output: JSON.stringify(data.output)
        }
      }));
      sharedOpenaiWs.send(JSON.stringify({ type: 'response.create' }));
    } catch (error) {
      logger.error('Error sending function result to OpenAI:', error);
    }
  });

  socket.on('change-voice', (data: { voice: string }) => {
    if (!sharedOpenaiWs || !isConnected) {
      logger.warn('⚠️  Not connected to OpenAI');
      return;
    }

    try {
      logger.info(`🎤 Changing voice to: ${data.voice}`);
      currentVoice = data.voice;
      sharedOpenaiWs.send(JSON.stringify({
        type: 'session.update',
        session: { voice: data.voice }
      }));
      voiceNamespace.emit('voice-changed', { voice: data.voice });
    } catch (error) {
      logger.error('Error changing voice:', error);
    }
  });

  socket.on('stop-realtime', () => {
    logger.info('🛑 Client requested to stop realtime session');
    socket.emit('realtime-stopped');
  });

  socket.on('disconnect', () => {
    logger.info(`👋 Voice client disconnected: ${socket.id}`);
    if (voiceNamespace.sockets.size === 0 && sharedOpenaiWs) {
      logger.info('🛑 Last voice client disconnected - closing OpenAI connection');
      sharedOpenaiWs.close();
      sharedOpenaiWs = null;
      isConnected = false;
    }
  });
});

// Voice HTTP health check
app.get('/api/voice/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'realtime-voice',
    openai_configured: !!OPENAI_API_KEY,
    connected: isConnected,
  });
});

// =============================================================================
// SHARED ENDPOINTS
// =============================================================================

// Unified health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'unified-backend',
    services: {
      main: 'healthy',
      ai_brain: !!process.env.ANTHROPIC_API_KEY ? 'healthy' : 'unconfigured',
      realtime_voice: !!OPENAI_API_KEY ? 'healthy' : 'unconfigured',
    },
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
  });
  res.status(500).json({ error: 'Internal server error' });
});

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

const gracefulShutdown = async () => {
  logger.info('Shutting down unified backend gracefully...');

  httpServer.close(async () => {
    logger.info('HTTP server closed');

    // Shutdown services
    await shutdownGenerationQueue();
    io.close();

    // Close OpenAI WebSocket
    if (sharedOpenaiWs) {
      sharedOpenaiWs.close();
    }

    logger.info('Unified backend shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// =============================================================================
// START SERVER
// =============================================================================

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || '3001', 10);
httpServer.listen(PORT, () => {
  logger.info(`🚀 Unified Backend Server running on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    services: ['main-backend', 'ai-brain', 'realtime-voice'],
    cost_savings: '$15/month (3 Railway services → 1)',
  });
});

export { app, httpServer, io };
