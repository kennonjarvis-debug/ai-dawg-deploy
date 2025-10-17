import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*' }
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || 3100;

console.log('🚀 OpenAI Realtime Voice Server Starting...');
console.log(`✅ OpenAI API Key: ${OPENAI_API_KEY ? 'Configured' : 'MISSING'}`);

// OpenAI Realtime API connection
io.on('connection', (socket) => {
  console.log('🎤 Client connected for LIVE voice');

  let openaiWs: WebSocket | null = null;
  let isConnected = false;

  // Connect to OpenAI Realtime API
  socket.on('start-realtime', async () => {
    if (openaiWs) {
      console.log('⚠️  Already connected to OpenAI Realtime API');
      return;
    }

    try {
      // Connect to OpenAI Realtime API WebSocket
      const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';
      openaiWs = new WebSocket(url, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'realtime=v1'
        }
      });

      openaiWs.on('open', () => {
        console.log('✅ Connected to OpenAI Realtime API');
        isConnected = true;
        socket.emit('realtime-connected');

        // Configure session with tools for DAW control
        openaiWs?.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: 'You are DAWG AI, a helpful music production assistant. Be conversational and friendly. Help with DAW controls, mixing, recording, and music production. You have access to tools to control the DAW - use them when the user asks you to perform actions. CRITICAL: When the user is recording and asks you to transcribe their freestyle lyrics, you MUST call update_lyrics with append=true CONTINUOUSLY as they speak each line or phrase in real-time - do NOT wait until they finish recording. Transcribe live, line by line, as the words come out.',
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            },
            tools: [
              {
                type: 'function',
                name: 'start_recording',
                description: 'Start recording audio in the DAW',
                parameters: { type: 'object', properties: {}, required: [] }
              },
              {
                type: 'function',
                name: 'stop_recording',
                description: 'Stop recording audio in the DAW',
                parameters: { type: 'object', properties: {}, required: [] }
              },
              {
                type: 'function',
                name: 'play',
                description: 'Start playback in the DAW',
                parameters: { type: 'object', properties: {}, required: [] }
              },
              {
                type: 'function',
                name: 'stop',
                description: 'Stop playback in the DAW',
                parameters: { type: 'object', properties: {}, required: [] }
              },
              {
                type: 'function',
                name: 'update_lyrics',
                description: 'Update or append lyrics to the lyrics widget. Use append=true when transcribing freestyle lyrics line by line.',
                parameters: {
                  type: 'object',
                  properties: {
                    text: { type: 'string', description: 'The lyrics text to add or set' },
                    append: { type: 'boolean', description: 'If true, append to existing lyrics. If false, replace all lyrics.' }
                  },
                  required: ['text', 'append']
                }
              },
              {
                type: 'function',
                name: 'create_track',
                description: 'Create a new track in the DAW',
                parameters: { type: 'object', properties: {}, required: [] }
              },
              {
                type: 'function',
                name: 'set_tempo',
                description: 'Set the project tempo (BPM)',
                parameters: {
                  type: 'object',
                  properties: {
                    bpm: { type: 'number', description: 'The tempo in beats per minute' }
                  },
                  required: ['bpm']
                }
              },
              {
                type: 'function',
                name: 'set_key',
                description: 'Set the project key',
                parameters: {
                  type: 'object',
                  properties: {
                    key: { type: 'string', description: 'The musical key (e.g., C, Dm, F#)' }
                  },
                  required: ['key']
                }
              },
              {
                type: 'function',
                name: 'apply_autotune',
                description: 'Apply autotune effect to selected audio',
                parameters: { type: 'object', properties: {}, required: [] }
              },
              {
                type: 'function',
                name: 'apply_compression',
                description: 'Apply automatic compression to selected audio',
                parameters: { type: 'object', properties: {}, required: [] }
              },
              {
                type: 'function',
                name: 'quantize_audio',
                description: 'Quantize/time-align selected audio to the grid',
                parameters: { type: 'object', properties: {}, required: [] }
              },
              {
                type: 'function',
                name: 'smart_mix',
                description: 'Apply AI-powered smart mixing to the project',
                parameters: { type: 'object', properties: {}, required: [] }
              },
              {
                type: 'function',
                name: 'master_audio',
                description: 'Apply AI mastering to the project',
                parameters: { type: 'object', properties: {}, required: [] }
              },
              {
                type: 'function',
                name: 'generate_music',
                description: 'Generate AI music with custom prompts. Examples: "create a stratocaster riff", "808s like metro boomin", "morgan wallen style country song", "trap beat with heavy bass"',
                parameters: {
                  type: 'object',
                  properties: {
                    prompt: { type: 'string', description: 'Detailed description of the music to generate (instruments, style, artist references, etc.)' },
                    genre: { type: 'string', description: 'Genre (optional): pop, rock, hip-hop, electronic, country, etc.' },
                    tempo: { type: 'number', description: 'Tempo in BPM (optional), default 120' },
                    duration: { type: 'number', description: 'Duration in seconds (optional), default 30' }
                  },
                  required: ['prompt']
                }
              },
              {
                type: 'function',
                name: 'save_project',
                description: 'Save the current project',
                parameters: { type: 'object', properties: {}, required: [] }
              },
              {
                type: 'function',
                name: 'export_project',
                description: 'Export the current project as audio',
                parameters: { type: 'object', properties: {}, required: [] }
              },
              {
                type: 'function',
                name: 'process_voice_memo',
                description: 'Process a voice memo recording with AI: isolate vocals, transcribe, analyze musical intent, and compose a full song. This is a complete creative workflow from voice recording to finished track.',
                parameters: { type: 'object', properties: {}, required: [] }
              },
              // REAL-TIME EFFECT CONTROL DURING RECORDING
              {
                type: 'function',
                name: 'adjust_brightness',
                description: 'Adjust brightness/high frequencies of the live monitoring mix in real-time. Use when user asks for "more brightness", "add air", "more highs", "brighter sound", etc. during recording.',
                parameters: {
                  type: 'object',
                  properties: {
                    amount: {
                      type: 'string',
                      enum: ['subtle', 'moderate', 'aggressive'],
                      description: 'How much brightness to add - subtle (2dB), moderate (4dB), aggressive (6dB)'
                    }
                  },
                  required: ['amount']
                }
              },
              {
                type: 'function',
                name: 'adjust_compression',
                description: 'Adjust compression on live monitoring mix in real-time. Use when user asks for "more compression", "tighter", "control dynamics", "more punch", etc. during recording.',
                parameters: {
                  type: 'object',
                  properties: {
                    amount: {
                      type: 'string',
                      enum: ['light', 'medium', 'heavy'],
                      description: 'Compression intensity - light (2.5:1), medium (4:1), heavy (6:1)'
                    }
                  },
                  required: ['amount']
                }
              },
              {
                type: 'function',
                name: 'adjust_warmth',
                description: 'Adjust warmth/low-mid frequencies in real-time. Use when user asks for "warmer", "more body", "fuller sound", "more low-mids", etc. during recording.',
                parameters: {
                  type: 'object',
                  properties: {
                    amount: {
                      type: 'string',
                      enum: ['subtle', 'moderate', 'heavy'],
                      description: 'How much warmth to add - subtle (2dB @ 200Hz), moderate (3dB @ 150Hz), heavy (4dB @ 110Hz + Neve 1073)'
                    }
                  },
                  required: ['amount']
                }
              },
              {
                type: 'function',
                name: 'add_autotune',
                description: 'Enable or adjust autotune on live monitoring in real-time. Use when user asks for "add autotune", "more tuning", "pitch correction", "t-pain effect", etc. during recording.',
                parameters: {
                  type: 'object',
                  properties: {
                    speed: {
                      type: 'string',
                      enum: ['natural', 'moderate', 'tpain'],
                      description: 'Retune speed - natural (25ms, subtle), moderate (15ms, modern), tpain (0ms, robotic)'
                    }
                  },
                  required: ['speed']
                }
              },
              {
                type: 'function',
                name: 'add_reverb',
                description: 'Add or adjust reverb on live monitoring in real-time. Use when user asks for "add reverb", "more space", "more room", "bigger sound", etc. during recording.',
                parameters: {
                  type: 'object',
                  properties: {
                    amount: {
                      type: 'number',
                      minimum: 0,
                      maximum: 100,
                      description: 'Reverb wet mix percentage (0-100)'
                    },
                    type: {
                      type: 'string',
                      enum: ['plate', 'room', 'hall'],
                      description: 'Reverb type - plate (bright, tight), room (natural), hall (large, spacious)'
                    }
                  },
                  required: ['amount', 'type']
                }
              },
              {
                type: 'function',
                name: 'remove_harshness',
                description: 'Reduce harsh high frequencies in real-time. Use when user asks for "less harsh", "too bright", "reduce sibilance", "softer highs", etc. during recording.',
                parameters: {
                  type: 'object',
                  properties: {
                    amount: {
                      type: 'string',
                      enum: ['light', 'moderate', 'heavy'],
                      description: 'Amount of harshness reduction'
                    }
                  },
                  required: ['amount']
                }
              },
              {
                type: 'function',
                name: 'add_delay',
                description: 'Add delay effect on live monitoring in real-time. Use when user asks for "add delay", "add echo", "slap delay", etc. during recording.',
                parameters: {
                  type: 'object',
                  properties: {
                    timing: {
                      type: 'string',
                      enum: ['eighth', 'quarter', 'dotted-eighth'],
                      description: 'Delay timing relative to tempo'
                    },
                    feedback: {
                      type: 'number',
                      minimum: 0,
                      maximum: 100,
                      description: 'Delay feedback amount (0-100)'
                    },
                    mix: {
                      type: 'number',
                      minimum: 0,
                      maximum: 100,
                      description: 'Delay wet mix percentage (0-100)'
                    }
                  },
                  required: ['timing', 'feedback', 'mix']
                }
              },
              {
                type: 'function',
                name: 'adjust_presence',
                description: 'Adjust vocal presence (3-6kHz range) in real-time. Use when user asks for "more presence", "upfront", "clearer vocals", "cut through the mix", etc. during recording.',
                parameters: {
                  type: 'object',
                  properties: {
                    amount: {
                      type: 'string',
                      enum: ['subtle', 'moderate', 'aggressive'],
                      description: 'How much presence to add'
                    }
                  },
                  required: ['amount']
                }
              },
              {
                type: 'function',
                name: 'reset_effects',
                description: 'Reset all live monitoring effects to bypass/neutral. Use when user asks for "remove all effects", "dry signal", "no effects", "reset", etc. during recording.',
                parameters: { type: 'object', properties: {}, required: [] }
              }
            ],
            tool_choice: 'auto'
          }
        }));
      });

      openaiWs.on('message', (data) => {
        try {
          const event = JSON.parse(data.toString());

          // Forward relevant events to client
          switch (event.type) {
            case 'session.created':
            case 'session.updated':
              console.log(`📋 ${event.type}`);
              break;

            case 'conversation.item.created':
              console.log('💬 New conversation item');
              break;

            // User speech transcription (what the user said)
            case 'conversation.item.input_audio_transcription.delta':
              socket.emit('user-transcript-delta', { text: event.delta });
              break;

            case 'conversation.item.input_audio_transcription.completed':
              // This is what the USER said
              socket.emit('user-transcript-done', { text: event.transcript });
              console.log('📝 User said:', event.transcript);
              break;

            // AI response text (from audio transcript)
            case 'response.audio_transcript.delta':
              socket.emit('ai-text-delta', { text: event.delta });
              break;

            case 'response.audio_transcript.done':
              // This is what the AI is saying
              socket.emit('ai-text-done', { text: event.transcript });
              console.log('🤖 AI said:', event.transcript);
              break;

            case 'response.audio.delta':
              // Stream audio back to client
              socket.emit('audio-delta', { audio: event.delta });
              break;

            case 'response.audio.done':
              console.log('🔊 Audio response complete');
              socket.emit('audio-done');
              break;

            case 'response.done':
              console.log('✅ Response complete');
              break;

            case 'error':
              console.error('❌ OpenAI Error:', event.error);
              socket.emit('error', { message: event.error.message });
              break;

            case 'input_audio_buffer.speech_started':
              console.log('🗣️  User started speaking');
              socket.emit('speech-started');
              break;

            case 'input_audio_buffer.speech_stopped':
              console.log('🤐 User stopped speaking');
              socket.emit('speech-stopped');
              break;

            // Function calling events
            case 'response.function_call_arguments.delta':
              // Function call arguments streaming (we'll wait for done)
              break;

            case 'response.function_call_arguments.done':
              // Complete function call received
              console.log('🔧 Function call:', event.name, event.arguments);
              socket.emit('function-call', {
                call_id: event.call_id,
                name: event.name,
                arguments: event.arguments
              });
              break;

            default:
              // Log unknown events for debugging
              if (event.type) {
                console.log(`🔔 ${event.type}`);
              }
          }
        } catch (error) {
          console.error('Error parsing OpenAI message:', error);
        }
      });

      openaiWs.on('error', (error) => {
        console.error('❌ OpenAI WebSocket error:', error);
        socket.emit('error', { message: 'OpenAI connection error' });
      });

      openaiWs.on('close', () => {
        console.log('🔌 Disconnected from OpenAI Realtime API');
        isConnected = false;
        socket.emit('realtime-disconnected');
      });

    } catch (error: any) {
      console.error('Failed to connect to OpenAI Realtime API:', error);
      socket.emit('error', { message: 'Failed to connect to OpenAI' });
    }
  });

  // Receive audio from client and forward to OpenAI
  socket.on('audio-data', (data: { audio: string }) => {
    if (!openaiWs || !isConnected) {
      console.warn('⚠️  Not connected to OpenAI');
      return;
    }

    try {
      // Forward audio to OpenAI (base64 PCM16 audio)
      openaiWs.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: data.audio
      }));
    } catch (error) {
      console.error('Error sending audio to OpenAI:', error);
    }
  });

  // Receive function results from client and send back to OpenAI
  socket.on('function-result', (data: { call_id: string; output: any }) => {
    if (!openaiWs || !isConnected) {
      console.warn('⚠️  Not connected to OpenAI');
      return;
    }

    try {
      console.log('✅ Function result:', data.call_id, data.output);
      // Send function call output back to OpenAI
      openaiWs.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: data.call_id,
          output: JSON.stringify(data.output)
        }
      }));
      // Trigger response generation
      openaiWs.send(JSON.stringify({
        type: 'response.create'
      }));
    } catch (error) {
      console.error('Error sending function result to OpenAI:', error);
    }
  });

  // Stop realtime session
  socket.on('stop-realtime', () => {
    console.log('🛑 Stopping realtime session');
    if (openaiWs) {
      openaiWs.close();
      openaiWs = null;
    }
    isConnected = false;
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    console.log('👋 Client disconnected');
    if (openaiWs) {
      openaiWs.close();
      openaiWs = null;
    }
  });
});

server.listen(PORT, () => {
  console.log(`🎙️  Realtime Voice Server running on port ${PORT}`);
  console.log(`🔗 WebSocket endpoint: ws://localhost:${PORT}`);
});
