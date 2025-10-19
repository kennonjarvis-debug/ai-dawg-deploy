import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import cors from 'cors';
import { generateMusic, generateBeat } from './services/musicgen-service';
import { getCachedVoiceFunctions, initializeFunctionCache } from './services/function-cache-service';
import functionCacheRoutes from './routes/function-cache-routes';

dotenv.config();

const app = express();
const server = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Function cache routes
app.use('/api/functions', functionCacheRoutes);

const io = new SocketIOServer(server, {
  cors: { origin: '*' }
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || 3100;

console.log('🚀 OpenAI Realtime Voice Server Starting...');
console.log(`✅ OpenAI API Key: ${OPENAI_API_KEY ? 'Configured' : 'MISSING'}`);

// Initialize function cache
initializeFunctionCache()
  .then(() => console.log('✅ Function cache ready'))
  .catch((err) => console.error('❌ Function cache initialization failed:', err));

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
    console.log('⚠️  Already connected to OpenAI');
    return;
  }

  currentVoice = voice;
  console.log(`🎙️ Initializing shared OpenAI connection with voice: ${voice}`);

  const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';
  sharedOpenaiWs = new WebSocket(url, {
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'OpenAI-Beta': 'realtime=v1'
    }
  });

  sharedOpenaiWs.on('open', () => {
    console.log('✅ Connected to OpenAI Realtime API');
    isConnected = true;

    // Get cached voice functions (optimized for bandwidth)
    const voiceFunctions = getCachedVoiceFunctions();
    console.log(`📦 Using cached voice functions (${voiceFunctions.length} functions)`);

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
          console.log(`📋 ${event.type}`);
        }
      }

      switch (event.type) {
        case 'conversation.item.created':
          console.log('💬 New conversation item');
          break;

        case 'conversation.item.input_audio_transcription.completed':
          io.emit('user-transcript-done', { text: event.transcript });
          console.log('📝 User said:', event.transcript);
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
          console.log('🤖 AI said:', event.transcript);
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
          console.log('🔊 Audio response complete');
          io.emit('audio-done');
          break;

        case 'response.created':
          console.log('🤖 AI response started');
          isAIResponding = true;
          currentResponseId = event.response.id;
          io.emit('response-started');
          break;

        case 'response.done':
          console.log('✅ Response complete');
          isAIResponding = false;
          currentResponseId = null;
          io.emit('response-done');
          break;

        case 'error':
          // Suppress "no active response" errors (common race condition during interruptions)
          const errorMessage = event.error?.message || '';
          if (errorMessage.toLowerCase().includes('no active response') || errorMessage.toLowerCase().includes('cancellation failed')) {
            console.debug('OpenAI: Response cancellation skipped (already finished)');
          } else {
            console.error('❌ OpenAI Error:', event.error);
            io.emit('error', { message: event.error.message });
          }
          break;

        case 'input_audio_buffer.speech_started':
          console.log('🗣️  User started speaking');
          io.emit('speech-started');

          // Interrupt AI if it's currently responding
          if (isAIResponding && currentResponseId) {
            console.log('⚡ User interrupted AI - canceling response');
            try {
              sharedOpenaiWs?.send(JSON.stringify({
                type: 'response.cancel'
              }));
              io.emit('ai-interrupted');
            } catch (error: any) {
              // Suppress "no active response" errors (race condition where response finished just as we tried to cancel)
              const errorMsg = error.message?.toLowerCase() || '';
              if (!errorMsg.includes('no active response') && !errorMsg.includes('cancellation failed')) {
                console.error('Error canceling response:', error);
              } else {
                console.debug('Response already finished, ignoring cancellation error');
              }
            }
            isAIResponding = false;
            currentResponseId = null;
          }
          break;

        case 'input_audio_buffer.speech_stopped':
          console.log('🤐 User stopped speaking');
          io.emit('speech-stopped');
          break;

        case 'response.function_call_arguments.done':
          console.log('🔧 Function call:', event.name, event.arguments);

          if (event.name === 'change_my_voice') {
            try {
              const args = JSON.parse(event.arguments);
              console.log(`🎙️ AI changing voice to: ${args.voice}`);

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
              console.error('Error handling voice change:', error);
            }
          } else {
            // Forward function calls to ALL clients
            console.log(`📤 Broadcasting function call to all clients: ${event.name}`);
            io.emit('function-call', {
              call_id: event.call_id,
              name: event.name,
              arguments: event.arguments
            });
            console.log(`📨 Function call broadcasted`);
          }
          break;

        case 'rate_limits.updated':
          console.log('🔔 rate_limits.updated');
          break;

        default:
          if (event.type && !event.type.includes('.delta')) {
            console.log(`🔔 ${event.type}`);
          }
          break;
      }
    } catch (error) {
      console.error('Error processing OpenAI message:', error);
    }
  });

  sharedOpenaiWs.on('error', (error) => {
    console.error('❌ OpenAI WebSocket error:', error);
    isConnected = false;
  });

  sharedOpenaiWs.on('close', () => {
    console.log('🔌 Disconnected from OpenAI Realtime API');
    isConnected = false;
    sharedOpenaiWs = null;
  });
}

// Client connection handler
io.on('connection', (socket) => {
  console.log(`🎤 Client connected (ID: ${socket.id})`);

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

      console.log('📋 Adding project context to conversation');

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
      console.warn('⚠️  Not connected to OpenAI');
      return;
    }

    try {
      sharedOpenaiWs.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: data.audio
      }));
    } catch (error) {
      console.error('Error sending audio to OpenAI:', error);
    }
  });

  socket.on('function-result', (data: { call_id: string; output: any }) => {
    if (!sharedOpenaiWs || !isConnected) {
      console.warn('⚠️  Not connected to OpenAI');
      return;
    }

    try {
      console.log('✅ Function result received:', data.call_id);
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
      console.error('Error sending function result to OpenAI:', error);
    }
  });

  socket.on('change-voice', (data: { voice: string }) => {
    if (!sharedOpenaiWs || !isConnected) {
      console.warn('⚠️  Not connected to OpenAI');
      return;
    }

    try {
      console.log(`🎤 Changing voice to: ${data.voice}`);
      currentVoice = data.voice;
      sharedOpenaiWs.send(JSON.stringify({
        type: 'session.update',
        session: {
          voice: data.voice
        }
      }));
      io.emit('voice-changed', { voice: data.voice });
    } catch (error) {
      console.error('Error changing voice:', error);
    }
  });

  socket.on('stop-realtime', () => {
    console.log('🛑 Client requested to stop realtime session');
    // Don't close shared WebSocket when one client disconnects
    socket.emit('realtime-stopped');
  });

  socket.on('disconnect', () => {
    console.log(`👋 Client disconnected (ID: ${socket.id})`);
    // Only close OpenAI connection if NO clients are connected
    if (io.sockets.sockets.size === 0 && sharedOpenaiWs) {
      console.log('🛑 Last client disconnected - closing OpenAI connection');
      sharedOpenaiWs.close();
      sharedOpenaiWs = null;
      isConnected = false;
    }
  });
});

server.listen(PORT, () => {
  console.log(`🎙️  Realtime Voice Server running on port ${PORT}`);
  console.log(`🔗 WebSocket endpoint: ws://localhost:${PORT}`);
});
